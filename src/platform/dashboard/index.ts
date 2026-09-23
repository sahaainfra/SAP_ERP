/**
 * Part 20, 21 & 22 — Dashboard Module Exports
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

// Components (Part 22)
export { Project360 } from '../../components/project360/Project360';
export { HealthScoreGauge } from '../../components/project360/HealthScoreGauge';
export { Project360SectionComponent } from '../../components/project360/Project360Section';
export { DocumentChainGraph } from '../../components/document-chain/DocumentChainGraph';
export { DrillDownNavigator } from '../../components/drill-down/DrillDownNavigator';
export { EnhancedObjectPage } from '../../components/object-page/EnhancedObjectPage';
