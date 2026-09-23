/**
 * Part 05 — Base CRUD Controller
 * 
 * Abstract base class for all entity controllers.
 * Provides standard CRUD operations with:
 * - Response envelope
 * - Filter compilation
 * - Pagination (offset and keyset)
 * - Concurrency control (ETag)
 * - Idempotency
 * - Three-tier validation
 * - Permission checks
 * - Field masking
 */

import { ok, fail, ApiSuccess, ApiFailure, PageMeta } from './envelope';
import { parseFilter, compileFilter, FieldSpec } from './filter/compiler';
import { parseOffsetPagination, parseKeysetPagination, requiresKeysetPagination, encodeCursor, OrderSpec } from './pagination';
import { generateETagFromVersion, ConcurrencyGuard } from './concurrency';
import { withIdempotency } from './idempotency';
import { validate, ShapeValidationRule, ReferenceCheck, BusinessRule, Override } from './validation';
import { ApiError, ValidationError, NotFoundError } from '../errors/catalogue';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Actor {
  userId: string;
  can(permission: string): boolean;
  projectScope?: string[];
  companyScope?: string[];
}

export interface QueryParams {
  $filter?: string;
  $orderby?: string;
  $skip?: number;
  $top?: number;
  $cursor?: string;
  $select?: string;
  $expand?: string;
  $search?: string;
  $view?: string;
  $totals?: string;
}

export interface CrudPermissions {
  view: string;
  create: string;
  update: string;
  delete: string;
}

// ─── Abstract Base Controller ─────────────────────────────────────────────────

/**
 * BaseCrudController — abstract base for all entity controllers
 * 
 * Usage:
 * ```typescript
 * class PurchaseOrderController extends BaseCrudController<PurchaseOrder, CreatePoDto, UpdatePoDto> {
 *   protected readonly entity = 'purchase_order';
 *   protected readonly fields = PO_FIELDS;
 *   protected readonly permissions = { view: 'procure.po.view', ... };
 *   protected readonly shapeRules = PO_SHAPE_RULES;
 *   protected readonly businessRules = PO_BUSINESS_RULES;
 *   
 *   constructor(
 *     private repo: PurchaseOrderRepository,
 *     private service: PurchaseOrderService,
 *   ) {
 *     super();
 *   }
 * }
 * ```
 */
export abstract class BaseCrudController<TResource, TCreate, TUpdate> {
  protected abstract readonly entity: string;
  protected abstract readonly fields: Record<string, FieldSpec>;
  protected abstract readonly permissions: CrudPermissions;
  protected abstract readonly shapeRules: ShapeValidationRule[];
  protected abstract readonly businessRules: BusinessRule<any>[];

  protected concurrencyGuard?: ConcurrencyGuard;

  // ─── List (GET /) ─────────────────────────────────────────────────────────

  async list(
    query: QueryParams,
    actor: Actor
  ): Promise<ApiSuccess<TResource[]> | ApiFailure> {
    try {
      // Check permission
      if (!actor.can(this.permissions.view)) {
        return fail('PERMISSION_DENIED', 'You do not have permission to view this resource');
      }

      // Parse filter
      let whereSql = '1=1';
      let whereParams: unknown[] = [];

      if (query.$filter) {
        const ast = parseFilter(query.$filter);
        const compiled = compileFilter(ast, this.fields, actor);
        whereSql = compiled.sql;
        whereParams = compiled.params;
      }

      // Parse pagination
      const useKeyset = requiresKeysetPagination(this.entity);
      let pageMeta: PageMeta;
      let orderBy: OrderSpec[] = [];

      if (useKeyset) {
        const { cursor, top } = parseKeysetPagination(query);
        // Keyset pagination logic would go here
        pageMeta = {
          skip: 0,
          top,
          total: 0, // Would be computed from query
          hasMore: false,
        };
      } else {
        const { skip, top } = parseOffsetPagination(query);
        pageMeta = {
          skip,
          top,
          total: 0, // Would be computed from query
          hasMore: false,
        };
      }

      // Parse orderby
      if (query.$orderby) {
        orderBy = query.$orderby.split(',').map((part) => {
          const [field, direction] = part.trim().split(' ');
          return {
            field,
            direction: (direction?.toLowerCase() === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc',
          };
        });
      }

      // Execute query (placeholder — would call repository)
      const rows: TResource[] = [];
      const total = 0;

      // Update page meta
      pageMeta.total = total;
      pageMeta.hasMore = pageMeta.skip + pageMeta.top < total;

      // Generate cursor for keyset pagination
      if (useKeyset && rows.length > 0) {
        const lastRow = rows[rows.length - 1] as any;
        pageMeta.cursor = encodeCursor(lastRow, orderBy);
      }

      return ok(rows, {
        page: pageMeta,
        generatedAt: new Date().toISOString(),
        correlationId: crypto.randomUUID(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        return fail(error.code, error.message);
      }
      return fail('INTERNAL_ERROR', 'An unexpected error occurred');
    }
  }

  // ─── Get One (GET /:id) ───────────────────────────────────────────────────

  async getOne(
    id: string | number,
    actor: Actor
  ): Promise<ApiSuccess<TResource> | ApiFailure> {
    try {
      // Check permission
      if (!actor.can(this.permissions.view)) {
        return fail('PERMISSION_DENIED', 'You do not have permission to view this resource');
      }

      // Fetch resource (placeholder — would call repository)
      const resource: TResource | null = null;

      if (!resource) {
        return fail('NOT_FOUND', `${this.entity} ${id} not found`);
      }

      // Generate ETag
      const version = (resource as any).row_version ?? 1;
      const etag = generateETagFromVersion(version);

      return ok(resource, {
        generatedAt: new Date().toISOString(),
        correlationId: crypto.randomUUID(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        return fail(error.code, error.message);
      }
      return fail('INTERNAL_ERROR', 'An unexpected error occurred');
    }
  }

  // ─── Create (POST /) ──────────────────────────────────────────────────────

  async create(
    dto: TCreate,
    actor: Actor,
    idempotencyKey?: string
  ): Promise<ApiSuccess<TResource> | ApiFailure> {
    try {
      // Check permission
      if (!actor.can(this.permissions.create)) {
        return fail('PERMISSION_DENIED', 'You do not have permission to create this resource');
      }

      // Validate (all three tiers)
      const data = dto as Record<string, unknown>;
      const report = await validate(
        data,
        this.shapeRules,
        [], // Reference checks would go here
        this.businessRules,
        { dto, actor },
        actor
      );

      if (report.blocked) {
        throw new ValidationError(report.issues);
      }

      // Execute with idempotency
      const result = await withIdempotency(
        idempotencyKey,
        actor.userId,
        `POST /${this.entity}`,
        dto,
        async () => {
          // Create resource (placeholder — would call service)
          const resource: TResource = {} as TResource;
          return { status: 201, body: resource };
        }
      );

      return ok(result.body, {
        generatedAt: new Date().toISOString(),
        correlationId: crypto.randomUUID(),
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return fail('VALIDATION_FAILED', 'Validation failed', {
          details: error.issues.map(issue => ({
            ...issue,
            severity: 'ERROR' as const,
          })),
        });
      }
      if (error instanceof ApiError) {
        return fail(error.code, error.message);
      }
      return fail('INTERNAL_ERROR', 'An unexpected error occurred');
    }
  }

  // ─── Update (PATCH /:id) ──────────────────────────────────────────────────

  async update(
    id: string | number,
    dto: TUpdate,
    actor: Actor,
    ifMatch?: string
  ): Promise<ApiSuccess<TResource> | ApiFailure> {
    try {
      // Check permission
      if (!actor.can(this.permissions.update)) {
        return fail('PERMISSION_DENIED', 'You do not have permission to update this resource');
      }

      // Check concurrency
      if (this.concurrencyGuard && ifMatch) {
        await this.concurrencyGuard.assert(this.entity, id, ifMatch);
      } else if (!ifMatch) {
        return fail('PRECONDITION_REQUIRED', 'If-Match header is required');
      }

      // Validate (all three tiers)
      const data = dto as Record<string, unknown>;
      const report = await validate(
        data,
        this.shapeRules,
        [], // Reference checks would go here
        this.businessRules,
        { id, dto, actor },
        actor
      );

      if (report.blocked) {
        throw new ValidationError(report.issues);
      }

      // Update resource (placeholder — would call service)
      const resource: TResource = {} as TResource;

      return ok(resource, {
        generatedAt: new Date().toISOString(),
        correlationId: crypto.randomUUID(),
      });
    } catch (error) {
      if (error instanceof ValidationError) {
        return fail('VALIDATION_FAILED', 'Validation failed', {
          details: error.issues.map(issue => ({
            ...issue,
            severity: 'ERROR' as const,
          })),
        });
      }
      if (error instanceof ApiError) {
        return fail(error.code, error.message);
      }
      return fail('INTERNAL_ERROR', 'An unexpected error occurred');
    }
  }

  // ─── Delete (DELETE /:id) ─────────────────────────────────────────────────

  async delete(
    id: string | number,
    actor: Actor,
    ifMatch?: string
  ): Promise<ApiSuccess<null> | ApiFailure> {
    try {
      // Check permission
      if (!actor.can(this.permissions.delete)) {
        return fail('PERMISSION_DENIED', 'You do not have permission to delete this resource');
      }

      // Check concurrency
      if (this.concurrencyGuard && ifMatch) {
        await this.concurrencyGuard.assert(this.entity, id, ifMatch);
      } else if (!ifMatch) {
        return fail('PRECONDITION_REQUIRED', 'If-Match header is required');
      }

      // Delete resource (placeholder — would call service)

      return ok(null, {
        generatedAt: new Date().toISOString(),
        correlationId: crypto.randomUUID(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        return fail(error.code, error.message);
      }
      return fail('INTERNAL_ERROR', 'An unexpected error occurred');
    }
  }

  // ─── Validate (POST /:id/validate) ────────────────────────────────────────

  async validateDryRun(
    id: string | number | null,
    dto: TCreate | TUpdate,
    actor: Actor,
    overrides?: Override[]
  ): Promise<ApiSuccess<{ blocked: boolean }> | ApiFailure> {
    try {
      // Check permission
      if (!actor.can(this.permissions.view)) {
        return fail('PERMISSION_DENIED', 'You do not have permission to validate this resource');
      }

      // Validate (all three tiers)
      const data = dto as Record<string, unknown>;
      const report = await validate(
        data,
        this.shapeRules,
        [], // Reference checks would go here
        this.businessRules,
        { id, dto, actor },
        actor,
        overrides
      );

      return ok({ blocked: report.blocked }, {
        warnings: report.issues.filter((i) => i.severity === 'WARNING'),
        generatedAt: new Date().toISOString(),
        correlationId: crypto.randomUUID(),
      });
    } catch (error) {
      if (error instanceof ApiError) {
        return fail(error.code, error.message);
      }
      return fail('INTERNAL_ERROR', 'An unexpected error occurred');
    }
  }
}
