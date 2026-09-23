/**
 * Part 16 — Navigation Service
 * 
 * Manages server-driven, permission-filtered navigation menu with:
 * - Menu fetching from /api/dx/v1/navigation
 * - Caching with permission version
 * - Automatic refresh on permission change
 * - Empty parent pruning
 */

import { MenuItem, NavigationMenu, NavigationState } from './types';

export class NavigationService {
  private menu: NavigationMenu | null = null;
  private cache: { menu: NavigationMenu; expiresAt: number } | null = null;
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
  private listeners: Array<(menu: NavigationMenu) => void> = [];

  /**
   * Fetch navigation menu from server
   */
  async fetchMenu(forceRefresh: boolean = false): Promise<NavigationMenu> {
    // Check cache
    if (!forceRefresh && this.cache && this.cache.expiresAt > Date.now()) {
      this.menu = this.cache.menu;
      return this.menu;
    }

    // In production, would call:
    // GET /api/dx/v1/navigation
    // For demo, return mock menu
    const menu = await this.mockFetchMenu();
    
    // Prune empty parents
    menu.groups = this.pruneEmptyParents(menu.groups);

    // Cache the result
    this.cache = {
      menu,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    };
    this.menu = menu;

    // Notify listeners
    this.notifyListeners(menu);

    return menu;
  }

  /**
   * Get current menu (from cache)
   */
  getMenu(): NavigationMenu | null {
    return this.menu;
  }

  /**
   * Subscribe to menu changes
   */
  subscribe(listener: (menu: NavigationMenu) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Invalidate cache (called on permission change)
   */
  invalidateCache(): void {
    this.cache = null;
    this.menu = null;
  }

  /**
   * Find menu item by key
   */
  findItemByKey(key: string): MenuItem | null {
    if (!this.menu) return null;

    const search = (items: MenuItem[]): MenuItem | null => {
      for (const item of items) {
        if (item.key === key) return item;
        if (item.children) {
          const found = search(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    return search(this.menu.groups);
  }

  /**
   * Find menu item by route
   */
  findItemByRoute(route: string): MenuItem | null {
    if (!this.menu) return null;

    const search = (items: MenuItem[]): MenuItem | null => {
      for (const item of items) {
        if (item.route === route) return item;
        if (item.children) {
          const found = search(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    return search(this.menu.groups);
  }

  /**
   * Get breadcrumb trail for a route
   */
  getBreadcrumb(route: string): Array<{ label: string; route?: string }> {
    const item = this.findItemByRoute(route);
    if (!item) return [];

    const trail: Array<{ label: string; route?: string }> = [];
    this.buildBreadcrumb(item.key, trail);
    return trail;
  }

  /**
   * Prune empty parent groups
   * Rule: A navigation parent whose children are all hidden is pruned
   */
  private pruneEmptyParents(items: MenuItem[]): MenuItem[] {
    return items.filter(item => {
      if (!item.children || item.children.length === 0) {
        return true; // Leaf node
      }

      // Recursively prune children
      item.children = this.pruneEmptyParents(item.children);

      // Keep parent if it has visible children
      return item.children.length > 0;
    });
  }

  /**
   * Build breadcrumb trail recursively
   */
  private buildBreadcrumb(
    itemKey: string,
    trail: Array<{ label: string; route?: string }>
  ): void {
    const item = this.findItemByKey(itemKey);
    if (!item) return;

    // Add parent first
    if (item.parentKey) {
      this.buildBreadcrumb(item.parentKey, trail);
    }

    // Add current item
    trail.push({
      label: item.label,
      route: item.route,
    });
  }

  /**
   * Notify all listeners of menu change
   */
  private notifyListeners(menu: NavigationMenu): void {
    for (const listener of this.listeners) {
      try {
        listener(menu);
      } catch (error) {
        console.error('Navigation listener error:', error);
      }
    }
  }

  /**
   * Mock menu fetch (in production, would call API)
   */
  private async mockFetchMenu(): Promise<NavigationMenu> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      version: 'v1',
      groups: [
        {
          key: 'personal',
          label: 'Personal',
          icon: 'person',
          sortOrder: 10,
          isActive: true,
          moduleGroup: 'PERSONAL',
          children: [
            { key: 'home', label: 'Home', icon: 'home', route: '/home', sortOrder: 1, isActive: true },
            { key: 'my-workspace', label: 'My Workspace', icon: 'dashboard', route: '/workspace', sortOrder: 2, isActive: true },
            { key: 'my-tasks', label: 'My Tasks', icon: 'task', route: '/tasks', permissionKey: 'workflow.task.view', sortOrder: 3, isActive: true, badge: 5 },
            { key: 'my-approvals', label: 'My Approvals', icon: 'approval', route: '/approvals', permissionKey: 'workflow.approval.view', sortOrder: 4, isActive: true, badge: 3 },
          ],
        },
        {
          key: 'projects',
          label: 'Projects',
          icon: 'domain',
          sortOrder: 20,
          isActive: true,
          moduleGroup: 'PROJECTS',
          children: [
            { key: 'project-list', label: 'Project List', icon: 'list', route: '/projects', permissionKey: 'project.view', sortOrder: 1, isActive: true },
            { key: 'project-360', label: 'Project 360', icon: 'view_in_ar', route: '/project-360', permissionKey: 'project.view', sortOrder: 2, isActive: true },
            { key: 'sites', label: 'Sites', icon: 'location_on', route: '/sites', permissionKey: 'project.site.view', sortOrder: 3, isActive: true },
          ],
        },
        {
          key: 'procurement',
          label: 'Procurement',
          icon: 'shopping_cart',
          sortOrder: 30,
          isActive: true,
          moduleGroup: 'PROCUREMENT',
          children: [
            { key: 'material-requisition', label: 'Material Requisition', icon: 'request_quote', route: '/procurement/mr', permissionKey: 'procure.mr.view', sortOrder: 1, isActive: true },
            { key: 'purchase-orders', label: 'Purchase Orders', icon: 'receipt', route: '/procurement/po', permissionKey: 'procure.po.view', sortOrder: 2, isActive: true, badge: 12 },
            { key: 'vendors', label: 'Vendors', icon: 'business', route: '/procurement/vendors', permissionKey: 'master.vendor.view', sortOrder: 3, isActive: true },
          ],
        },
        {
          key: 'materials-store',
          label: 'Materials & Store',
          icon: 'inventory',
          sortOrder: 40,
          isActive: true,
          moduleGroup: 'MATERIALS',
          children: [
            { key: 'stores', label: 'Stores', icon: 'store', route: '/store/stores', permissionKey: 'store.store.view', sortOrder: 1, isActive: true },
            { key: 'stock', label: 'Stock', icon: 'inventory_2', route: '/store/stock', permissionKey: 'store.stock.view', sortOrder: 2, isActive: true },
            { key: 'grn', label: 'GRN', icon: 'move_to_inbox', route: '/store/grn', permissionKey: 'store.grn.view', sortOrder: 3, isActive: true },
          ],
        },
        {
          key: 'finance',
          label: 'Finance',
          icon: 'account_balance',
          sortOrder: 50,
          isActive: true,
          moduleGroup: 'FINANCE',
          children: [
            { key: 'vouchers', label: 'Vouchers', icon: 'receipt_long', route: '/finance/vouchers', permissionKey: 'finance.voucher.view', sortOrder: 1, isActive: true },
            { key: 'payments', label: 'Payments', icon: 'payment', route: '/finance/payments', permissionKey: 'finance.payment.view', sortOrder: 2, isActive: true },
            { key: 'budget', label: 'Budget', icon: 'savings', route: '/finance/budget', permissionKey: 'finance.budget.view', sortOrder: 3, isActive: true },
          ],
        },
        {
          key: 'hr',
          label: 'HR & Manpower',
          icon: 'people',
          sortOrder: 60,
          isActive: true,
          moduleGroup: 'HR',
          children: [
            { key: 'employees', label: 'Employees', icon: 'badge', route: '/hr/employees', permissionKey: 'hr.employee.view', sortOrder: 1, isActive: true },
            { key: 'attendance', label: 'Attendance', icon: 'event_available', route: '/hr/attendance', permissionKey: 'hr.attendance.view', sortOrder: 2, isActive: true },
          ],
        },
        {
          key: 'quality-safety',
          label: 'Quality & Safety',
          icon: 'verified',
          sortOrder: 70,
          isActive: true,
          moduleGroup: 'QUALITY',
          children: [
            { key: 'wir', label: 'WIR', icon: 'checklist', route: '/quality/wir', permissionKey: 'qa.wir.view', sortOrder: 1, isActive: true },
            { key: 'ncr', label: 'NCR', icon: 'warning', route: '/quality/ncr', permissionKey: 'qa.ncr.view', sortOrder: 2, isActive: true, badge: 2 },
            { key: 'incidents', label: 'Incidents', icon: 'error', route: '/safety/incidents', permissionKey: 'hse.incident.view', sortOrder: 3, isActive: true },
          ],
        },
        {
          key: 'administration',
          label: 'Administration',
          icon: 'admin_panel_settings',
          sortOrder: 100,
          isActive: true,
          moduleGroup: 'ADMIN',
          children: [
            { key: 'users', label: 'Users', icon: 'person', route: '/admin/users', permissionKey: 'admin.user.view', sortOrder: 1, isActive: true },
            { key: 'roles', label: 'Roles', icon: 'security', route: '/admin/roles', permissionKey: 'admin.role.view', sortOrder: 2, isActive: true },
            { key: 'project-responsibilities', label: 'Project Responsibilities', icon: 'assignment_ind', route: '/admin/responsibilities', permissionKey: 'admin.responsibility.view', sortOrder: 3, isActive: true },
            { key: 'audit-log', label: 'Audit Log', icon: 'history', route: '/admin/audit', permissionKey: 'admin.audit.view', sortOrder: 4, isActive: true },
          ],
        },
      ],
    };
  }
}

export const navigationService = new NavigationService();
