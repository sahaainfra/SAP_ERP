/**
 * Navigation Structure
 * 
 * Server-driven menu that is filtered by user permissions.
 * This represents what GET /api/dx/v1/navigation would return.
 */

export interface NavItem {
  key: string;
  label: string;
  route: string;
  icon: string;
  badge?: number;
  permission?: string;
  children?: NavItem[];
}

export interface NavGroup {
  key: string;
  label: string;
  icon: string;
  order: number;
  items: NavItem[];
}

/**
 * Mock navigation response - in production this comes from the server
 * filtered by user permissions and current context
 */
export const navigationData: NavGroup[] = [
  {
    key: 'personal',
    label: 'Personal',
    icon: 'user',
    order: 10,
    items: [
      { key: 'home', label: 'Home', route: '/dashboard', icon: 'home', permission: 'dashboard.view' },
      { key: 'workspace', label: 'My Workspace', route: '/workspace', icon: 'layout-dashboard', permission: 'workspace.view' },
      { key: 'my-tasks', label: 'My Tasks', route: '/tasks', icon: 'check-square', badge: 3, permission: 'tasks.view' },
      { key: 'my-approvals', label: 'My Approvals', route: '/approvals', icon: 'file-check', badge: 4, permission: 'approvals.view' },
    ],
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: 'folder-kanban',
    order: 20,
    items: [
      { key: 'project-list', label: 'Project List', route: '/projects', icon: 'list', permission: 'project.view' },
      { key: 'project-360', label: 'Project 360', route: '/projects/360', icon: 'eye', permission: 'project.view' },
      { key: 'sites', label: 'Sites', route: '/sites', icon: 'map-pin', permission: 'site.view' },
      { key: 'packages', label: 'Packages', route: '/packages', icon: 'package', permission: 'package.view' },
      { key: 'contracts', label: 'Contracts', route: '/contracts', icon: 'file-text', permission: 'contract.view' },
    ],
  },
  {
    key: 'procurement',
    label: 'Procurement',
    icon: 'truck',
    order: 30,
    items: [
      { key: 'mr', label: 'Material Requisition', route: '/procurement/mr', icon: 'clipboard-list', permission: 'mr.view' },
      { key: 'pr', label: 'Purchase Requisition', route: '/procurement/pr', icon: 'file-plus', permission: 'pr.view' },
      { key: 'rfq', label: 'RFQ', route: '/procurement/rfq', icon: 'send', permission: 'rfq.view' },
      { key: 'po', label: 'Purchase Orders', route: '/procurement/po', icon: 'shopping-cart', permission: 'po.view' },
      { key: 'vendors', label: 'Vendors', route: '/vendors', icon: 'users', permission: 'vendor.view' },
    ],
  },
  {
    key: 'materials',
    label: 'Materials & Store',
    icon: 'box',
    order: 40,
    items: [
      { key: 'stores', label: 'Stores', route: '/materials/stores', icon: 'warehouse', permission: 'store.view' },
      { key: 'stock', label: 'Stock', route: '/materials/stock', icon: 'database', permission: 'stock.view' },
      { key: 'grn', label: 'GRN', route: '/materials/grn', icon: 'package-check', permission: 'grn.view' },
      { key: 'issues', label: 'Issue', route: '/materials/issues', icon: 'package-minus', permission: 'issue.view' },
      { key: 'material-master', label: 'Material Master', route: '/materials/master', icon: 'layers', permission: 'material.view' },
    ],
  },
  {
    key: 'execution',
    label: 'Execution',
    icon: 'hard-hat',
    order: 50,
    items: [
      { key: 'dpr', label: 'DPR', route: '/execution/dpr', icon: 'calendar', permission: 'dpr.view' },
      { key: 'mb', label: 'Measurement Book', route: '/execution/mb', icon: 'book-open', permission: 'mb.view' },
      { key: 'progress', label: 'Progress', route: '/execution/progress', icon: 'trending-up', permission: 'progress.view' },
    ],
  },
  {
    key: 'billing',
    label: 'Billing & Commercial',
    icon: 'dollar-sign',
    order: 60,
    items: [
      { key: 'ra-bills', label: 'RA Bills', route: '/billing/ra-bills', icon: 'receipt', permission: 'ra-bill.view' },
      { key: 'invoices', label: 'Client Invoices', route: '/billing/invoices', icon: 'file-text', permission: 'invoice.view' },
      { key: 'payments', label: 'Payments', route: '/billing/payments', icon: 'credit-card', permission: 'payment.view' },
    ],
  },
  {
    key: 'finance',
    label: 'Finance',
    icon: 'landmark',
    order: 70,
    items: [
      { key: 'vouchers', label: 'Vouchers', route: '/finance/vouchers', icon: 'file', permission: 'voucher.view' },
      { key: 'budget', label: 'Budget', route: '/finance/budget', icon: 'piggy-bank', permission: 'budget.view' },
      { key: 'cost-control', label: 'Cost Control', route: '/finance/cost-control', icon: 'target', permission: 'cost.view' },
    ],
  },
  {
    key: 'quality-safety',
    label: 'Quality & Safety',
    icon: 'shield-check',
    order: 80,
    items: [
      { key: 'itp', label: 'ITP', route: '/quality/itp', icon: 'clipboard-check', permission: 'itp.view' },
      { key: 'wir', label: 'WIR', route: '/quality/wir', icon: 'search', permission: 'wir.view' },
      { key: 'ncr', label: 'NCR', route: '/quality/ncr', icon: 'alert-triangle', permission: 'ncr.view' },
      { key: 'hse', label: 'HSE Dashboard', route: '/safety/hse', icon: 'heart-pulse', permission: 'hse.view' },
      { key: 'incidents', label: 'Incidents', route: '/safety/incidents', icon: 'alert-circle', badge: 2, permission: 'incident.view' },
    ],
  },
  {
    key: 'insight',
    label: 'Insight',
    icon: 'bar-chart-3',
    order: 90,
    items: [
      { key: 'analytics', label: 'Analytics & EVM', route: '/analytics', icon: 'line-chart', permission: 'analytics.view' },
      { key: 'exceptions', label: 'Exception Centre', route: '/exceptions', icon: 'alert-triangle', badge: 2, permission: 'exceptions.view' },
      { key: 'reports', label: 'Reports', route: '/reports', icon: 'file-bar-chart', permission: 'reports.view' },
    ],
  },
  {
    key: 'admin',
    label: 'Administration',
    icon: 'settings',
    order: 100,
    items: [
      { key: 'permissions', label: 'Permissions', route: '/admin/permissions', icon: 'shield', permission: 'admin.permissions' },
      { key: 'backup', label: 'Backup & Restore', route: '/admin/backup', icon: 'database', permission: 'admin.backup' },
      { key: 'audit-log', label: 'Audit Log', route: '/admin/audit', icon: 'scroll-text', permission: 'admin.audit' },
      { key: 'settings', label: 'Settings', route: '/admin/settings', icon: 'settings', permission: 'admin.settings' },
      { key: 'design-system', label: 'Design System', route: '/dev/design-system', icon: 'palette', permission: 'dev.tools' },
    ],
  },
];

/**
 * Filter navigation by user permissions
 * In production, this filtering happens server-side
 */
export function filterNavigationByPermissions(
  nav: NavGroup[],
  userPermissions: string[]
): NavGroup[] {
  return nav
    .map(group => ({
      ...group,
      items: group.items.filter(item => 
        !item.permission || userPermissions.includes(item.permission)
      ),
    }))
    .filter(group => group.items.length > 0);
}

/**
 * Find navigation item by route
 */
export function findNavItemByRoute(route: string): NavItem | null {
  for (const group of navigationData) {
    for (const item of group.items) {
      if (item.route === route) {
        return item;
      }
    }
  }
  return null;
}

/**
 * Get breadcrumb path for a route
 */
export function getBreadcrumbPath(route: string): Array<{ label: string; route: string }> {
  const path: Array<{ label: string; route: string }> = [{ label: 'Home', route: '/dashboard' }];
  
  for (const group of navigationData) {
    for (const item of group.items) {
      if (item.route === route) {
        path.push({ label: group.label, route: '#' });
        path.push({ label: item.label, route });
        return path;
      }
    }
  }
  
  return path;
}
