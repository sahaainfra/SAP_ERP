/**
 * Part 06, 07 & 08 — Permission Module Exports
 */

// Types
export * from './types';

// Services (Part 06)
export { permissionService, PermissionService } from './permission.service';
export { responsibilityTemplateService, ResponsibilityTemplateService } from './responsibility-template.service';
export { projectAssignmentService, ProjectAssignmentService } from './project-assignment.service';
export { permissionResolver, PermissionResolver } from './permission-resolver';
export { delegationService, DelegationService } from './delegation.service';
export { sodService, SodService } from './sod.service';

// Enhanced Resolver (Part 07)
export { enhancedPermissionResolver, EnhancedPermissionResolver } from './enhanced-resolver';
export { Actor, createActor } from './actor';
export { sodEvaluator, SodEvaluator } from './sod-evaluator';
export { impactPreviewService, ImpactPreviewService } from './impact-preview';

// Permission Engine (Part 08)
export {
  PermissionGuard,
  PermissionGuardError,
  RequiresPermission,
  assertAllEndpointsHavePermissions,
  extractPermissionKeys,
} from './permission-guard';
export {
  QueryFilter,
  queryFilter,
  ENTITY_SCOPES,
} from './query-filter';
export type {
  EntityScopeSpec,
  CompiledWhere,
} from './query-filter';
export {
  FieldMasker,
  fieldMasker,
  STANDARD_FIELD_RESTRICTIONS,
} from './field-masker';
export type {
  FieldMaskMode,
  FieldMaskRule,
} from './field-masker';
export {
  ActionPolicyRegistry,
  actionPolicyRegistry,
  BaseActionPolicy,
  PoReleasePolicy,
  PaymentPostPolicy,
  assertAllActionsHavePolicies,
} from './action-policy';
export type {
  ActionPolicy,
  PolicyContext,
  PolicyResult,
} from './action-policy';
export {
  MenuService,
  menuService,
} from './menu-service';
export type {
  MenuItem,
  MenuResponse,
} from './menu-service';
