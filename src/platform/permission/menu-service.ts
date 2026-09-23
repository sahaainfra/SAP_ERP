/**
 * Part 08 — Menu Service
 * 
 * Server-driven, permission-filtered navigation menu.
 * The client never filters a menu - it renders what the server sends.
 */

import { Actor } from './actor';
import { PermissionKey } from './types';

// ─── Menu Item ────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  route?: string;
  permissionKey?: PermissionKey;
  projectScoped?: boolean;
  children?: MenuItem[];
  order: number;
}

// ─── Menu Response ────────────────────────────────────────────────────────────

export interface MenuResponse {
  items: MenuItem[];
  contextProjects: number[];
  version: string;
}

// ─── Menu Service ─────────────────────────────────────────────────────────────

export class MenuService {
  private menuItems: MenuItem[] = [];

  /**
   * Register a menu item
   */
  register(item: MenuItem): void {
    this.menuItems.push(item);
  }

  /**
   * Get filtered menu for an actor
   */
  getMenu(actor: Actor, projectId?: number): MenuResponse {
    // Filter items by permission
    const visible = this.menuItems.filter(item => {
      if (!item.permissionKey) {
        return true; // No permission required
      }
      return actor.can(item.permissionKey, item.projectScoped ? projectId : undefined);
    });

    // Filter children recursively
    const filtered = this.filterChildren(visible, actor, projectId);

    // Prune empty parents
    const pruned = this.pruneEmptyParents(filtered);

    // Sort by order
    const sorted = this.sortMenu(pruned);

    // Get context projects
    const contextProjects = actor.projectsWith('project.view');

    return {
      items: sorted,
      contextProjects,
      version: actor.permVersion,
    };
  }

  /**
   * Filter children recursively
   */
  private filterChildren(items: MenuItem[], actor: Actor, projectId?: number): MenuItem[] {
    return items.map(item => {
      if (!item.children || item.children.length === 0) {
        return item;
      }

      const filteredChildren = item.children.filter(child => {
        if (!child.permissionKey) {
          return true;
        }
        return actor.can(child.permissionKey, child.projectScoped ? projectId : undefined);
      });

      return {
        ...item,
        children: this.filterChildren(filteredChildren, actor, projectId),
      };
    });
  }

  /**
   * Prune empty parents
   * 
   * Remove parent items whose children are all hidden.
   * An empty "Finance" menu is worse than no menu.
   */
  private pruneEmptyParents(items: MenuItem[]): MenuItem[] {
    return items.filter(item => {
      if (!item.children || item.children.length === 0) {
        return true; // Leaf node
      }

      // Recursively prune children
      const prunedChildren = this.pruneEmptyParents(item.children);

      // Keep parent if it has visible children or is a leaf
      return prunedChildren.length > 0;
    }).map(item => {
      if (!item.children || item.children.length === 0) {
        return item;
      }
      return {
        ...item,
        children: this.pruneEmptyParents(item.children),
      };
    });
  }

  /**
   * Sort menu items by order
   */
  private sortMenu(items: MenuItem[]): MenuItem[] {
    return items
      .sort((a, b) => a.order - b.order)
      .map(item => {
        if (!item.children || item.children.length === 0) {
          return item;
        }
        return {
          ...item,
          children: this.sortMenu(item.children),
        };
      });
  }

  /**
   * Seed default menu items
   */
  seedDefaultMenu(): void {
    const defaultMenu: MenuItem[] = [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'LayoutDashboard',
        route: '/dashboard',
        permissionKey: 'project.project.view',
        projectScoped: true,
        order: 1,
      },
      {
        id: 'projects',
        label: 'Projects',
        icon: 'Briefcase',
        route: '/projects',
        permissionKey: 'project.project.view',
        order: 2,
      },
      {
        id: 'procurement',
        label: 'Procurement',
        icon: 'Package',
        order: 3,
        children: [
          {
            id: 'procurement.po',
            label: 'Purchase Orders',
            route: '/procurement/po',
            permissionKey: 'procure.po.view',
            projectScoped: true,
            order: 1,
          },
          {
            id: 'procurement.indent',
            label: 'Indents',
            route: '/procurement/indent',
            permissionKey: 'procure.indent.view',
            projectScoped: true,
            order: 2,
          },
          {
            id: 'procurement.vendor',
            label: 'Vendors',
            route: '/procurement/vendor',
            permissionKey: 'master.vendor.view',
            order: 3,
          },
        ],
      },
      {
        id: 'store',
        label: 'Store & Inventory',
        icon: 'Warehouse',
        order: 4,
        children: [
          {
            id: 'store.stock',
            label: 'Stock',
            route: '/store/stock',
            permissionKey: 'store.stock.view',
            projectScoped: true,
            order: 1,
          },
          {
            id: 'store.grn',
            label: 'Goods Receipt',
            route: '/store/grn',
            permissionKey: 'store.grn.view',
            projectScoped: true,
            order: 2,
          },
          {
            id: 'store.issue',
            label: 'Material Issue',
            route: '/store/issue',
            permissionKey: 'store.issue.view',
            projectScoped: true,
            order: 3,
          },
        ],
      },
      {
        id: 'finance',
        label: 'Finance',
        icon: 'FileText',
        order: 5,
        children: [
          {
            id: 'finance.voucher',
            label: 'Vouchers',
            route: '/finance/voucher',
            permissionKey: 'finance.voucher.view',
            projectScoped: true,
            order: 1,
          },
          {
            id: 'finance.payment',
            label: 'Payments',
            route: '/finance/payment',
            permissionKey: 'finance.payment.view',
            projectScoped: true,
            order: 2,
          },
          {
            id: 'finance.receipt',
            label: 'Receipts',
            route: '/finance/receipt',
            permissionKey: 'finance.receipt.view',
            projectScoped: true,
            order: 3,
          },
        ],
      },
      {
        id: 'billing',
        label: 'Billing',
        icon: 'Calculator',
        order: 6,
        children: [
          {
            id: 'billing.client',
            label: 'Client Bills',
            route: '/billing/client',
            permissionKey: 'bill.client.view',
            projectScoped: true,
            order: 1,
          },
          {
            id: 'billing.sc',
            label: 'Subcontractor Bills',
            route: '/billing/sc',
            permissionKey: 'bill.sc.view',
            projectScoped: true,
            order: 2,
          },
        ],
      },
      {
        id: 'hr',
        label: 'HR & Payroll',
        icon: 'Users',
        order: 7,
        children: [
          {
            id: 'hr.employee',
            label: 'Employees',
            route: '/hr/employee',
            permissionKey: 'hr.employee.view',
            projectScoped: true,
            order: 1,
          },
          {
            id: 'hr.attendance',
            label: 'Attendance',
            route: '/hr/attendance',
            permissionKey: 'hr.attendance.view',
            projectScoped: true,
            order: 2,
          },
          {
            id: 'hr.payroll',
            label: 'Payroll',
            route: '/hr/payroll',
            permissionKey: 'hr.payroll.view',
            projectScoped: true,
            order: 3,
          },
        ],
      },
      {
        id: 'quality',
        label: 'Quality',
        icon: 'FlaskConical',
        order: 8,
        children: [
          {
            id: 'quality.inspection',
            label: 'Inspections',
            route: '/quality/inspection',
            permissionKey: 'qa.inspection.view',
            projectScoped: true,
            order: 1,
          },
        ],
      },
      {
        id: 'safety',
        label: 'Safety',
        icon: 'Shield',
        order: 9,
        children: [
          {
            id: 'safety.incident',
            label: 'Incidents',
            route: '/safety/incident',
            permissionKey: 'hse.incident.view',
            projectScoped: true,
            order: 1,
          },
        ],
      },
      {
        id: 'equipment',
        label: 'Equipment',
        icon: 'Truck',
        route: '/equipment',
        permissionKey: 'asset.equipment.view',
        projectScoped: true,
        order: 10,
      },
      {
        id: 'admin',
        label: 'Administration',
        icon: 'Settings',
        order: 100,
        children: [
          {
            id: 'admin.responsibility',
            label: 'Responsibilities',
            route: '/admin/responsibility',
            permissionKey: 'admin.responsibility.configure',
            order: 1,
          },
          {
            id: 'admin.audit',
            label: 'Audit Log',
            route: '/admin/audit',
            permissionKey: 'admin.audit.view',
            order: 2,
          },
        ],
      },
    ];

    for (const item of defaultMenu) {
      this.register(item);
    }
  }
}

export const menuService = new MenuService();

// Seed default menu
menuService.seedDefaultMenu();
