/**
 * Part 06 & 07 — Permission Module Exports
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
