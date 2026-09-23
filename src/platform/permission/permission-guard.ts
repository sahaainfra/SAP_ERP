/**
 * Part 08 — Permission Guard
 * 
 * Route-level permission enforcement. Fails closed: endpoints without
 * permission metadata are rejected at boot time.
 */

import { Actor } from './actor';
import { PermissionKey } from './types';

// ─── Permission Metadata ──────────────────────────────────────────────────────

export interface PermissionMeta {
  key: PermissionKey | ((req: any) => PermissionKey);
  projectFrom?: 'body' | 'query' | 'param' | 'resource';
  projectField?: string;
}

// Metadata storage (simple Map-based approach)
const permissionMetadata = new WeakMap<Function, PermissionMeta>();

// ─── Decorator ────────────────────────────────────────────────────────────────

/**
 * Decorator to declare required permission for an endpoint
 * 
 * @example
 * @RequiresPermission('procure.po.view')
 * async list() { ... }
 * 
 * @example
 * @RequiresPermission((req) => req.body.isDraft ? 'procure.po.create' : 'procure.po.edit')
 * async save() { ... }
 * 
 * @example
 * @RequiresPermission('procure.po.view', { projectFrom: 'param', projectField: 'projectId' })
 * async get(@Param('projectId') projectId: number) { ... }
 */
export function RequiresPermission(
  key: PermissionKey | ((req: any) => PermissionKey),
  options: { projectFrom?: 'body' | 'query' | 'param' | 'resource'; projectField?: string } = {}
): MethodDecorator {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const meta: PermissionMeta = { key, ...options };
    permissionMetadata.set(descriptor.value, meta);
    return descriptor;
  };
}

// ─── Permission Guard ─────────────────────────────────────────────────────────

export class PermissionGuardError extends Error {
  constructor(
    public readonly code: string,
    public readonly details: Record<string, any>
  ) {
    super(`Permission denied: ${code}`);
    this.name = 'PermissionGuardError';
  }
}

/**
 * Permission guard that enforces route-level permissions
 * 
 * Usage:
 * ```typescript
 * const guard = new PermissionGuard(auditService);
 * 
 * // In middleware or controller
 * await guard.canActivate(request, handler);
 * ```
 */
export class PermissionGuard {
  constructor(private auditService?: any) {}

  /**
   * Check if the actor can access the endpoint
   */
  async canActivate(request: any, handler: any): Promise<boolean> {
    // Get permission metadata from handler
    const meta: PermissionMeta | undefined = permissionMetadata.get(handler);

    // Fail closed: no metadata = no access
    if (!meta) {
      throw new PermissionGuardError('ENDPOINT_MISSING_PERMISSION_DECLARATION', {
        handler: handler.name,
      });
    }

    // Get actor from request
    const actor: Actor = request.actor;
    if (!actor) {
      throw new PermissionGuardError('NO_ACTOR_IN_REQUEST', {});
    }

    // Resolve permission key
    const key = typeof meta.key === 'function' ? meta.key(request) : meta.key;

    // Resolve project ID
    const projectId = await this.resolveProjectId(request, meta);

    // Check permission
    if (!actor.can(key, projectId)) {
      // Audit denied attempt
      if (this.auditService) {
        await this.auditService.recordDenied(actor, key, projectId, request.path, request.ip);
      }

      throw new PermissionGuardError('PERMISSION_DENIED', {
        key,
        projectId,
        userId: actor.userId,
      });
    }

    return true;
  }

  /**
   * Resolve project ID from request based on metadata
   */
  private async resolveProjectId(request: any, meta: PermissionMeta): Promise<number | undefined> {
    if (!meta.projectFrom) {
      return undefined;
    }

    const field = meta.projectField || 'projectId';

    switch (meta.projectFrom) {
      case 'body':
        return request.body?.[field];
      case 'query':
        return request.query?.[field];
      case 'param':
        return request.params?.[field];
      case 'resource':
        // Load the resource and get its project ID
        // This requires the resource to be loaded before the guard runs
        const resource = request.resource;
        if (!resource) {
          throw new PermissionGuardError('RESOURCE_NOT_LOADED', {
            message: 'projectFrom: "resource" requires the resource to be loaded before the guard',
          });
        }
        return resource[field];
      default:
        return undefined;
    }
  }
}

// ─── Boot-Time Assertion ──────────────────────────────────────────────────────

/**
 * Assert that all endpoints have permission metadata
 * 
 * Call this at application startup to fail fast if any endpoint
 * is missing permission declaration.
 */
export function assertAllEndpointsHavePermissions(controllers: any[]): void {
  const missing: string[] = [];

  for (const controller of controllers) {
    const prototype = Object.getPrototypeOf(controller);
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) => name !== 'constructor' && typeof prototype[name] === 'function'
    );

    for (const methodName of methodNames) {
      const method = prototype[methodName];
      const meta = permissionMetadata.get(method);

      if (!meta) {
        missing.push(`${controller.constructor.name}.${methodName}`);
      }
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `The following endpoints are missing permission declarations:\n${missing.join('\n')}`
    );
  }
}

// ─── Helper: Get All Permission Keys ──────────────────────────────────────────

/**
 * Extract all permission keys from controllers for testing
 */
export function extractPermissionKeys(controllers: any[]): PermissionKey[] {
  const keys: Set<PermissionKey> = new Set();

  for (const controller of controllers) {
    const prototype = Object.getPrototypeOf(controller);
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (name) => name !== 'constructor' && typeof prototype[name] === 'function'
    );

    for (const methodName of methodNames) {
      const method = prototype[methodName];
      const meta: PermissionMeta | undefined = permissionMetadata.get(method);

      if (meta && typeof meta.key === 'string') {
        keys.add(meta.key);
      }
    }
  }

  return Array.from(keys);
}
