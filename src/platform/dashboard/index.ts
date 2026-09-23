/**
 * Part 20 & 21 — Dashboard Module Exports
 * 
 * Exports all dashboard components for use by other parts.
 */

// Types
export * from './types';
export * from './role-dashboard-types';

// Services
export { DashboardResolutionService, dashboardResolutionService } from './dashboard-resolution';
export { DrillDownService, drillDownService } from './drill-down';
export { DashboardEngine, dashboardEngine } from './dashboard-engine';
export { Project360Service, project360Service } from './project-360-service';
export { DocumentChainService, documentChainService } from './document-chain-service';

// Role Dashboards
export {
  ROLE_DASHBOARD_CONFIGS,
  SUPER_ADMIN_DASHBOARD,
  MANAGEMENT_DASHBOARD,
  CFO_DASHBOARD,
  PROJECT_MANAGER_DASHBOARD,
  SITE_ENGINEER_DASHBOARD,
  STORE_KEEPER_DASHBOARD,
  EMPLOYEE_LABOUR_DASHBOARD,
  validateRoleDashboard,
  validateRoleRestrictions,
} from './role-dashboards';

// Components
export { ObjectPage } from './object-page';
