/**
 * Part 06 — Permission Service
 * 
 * Manages the permission catalogue and provides validation for permission keys.
 */

import { Permission, PermissionKey, ModuleNamespace, ActionVerb, MODULE_NAMESPACES, ACTION_VERBS } from './types';

export class PermissionService {
  private permissions: Map<number, Permission> = new Map();
  private permissionsByKey: Map<string, Permission> = new Map();
  private nextId = 1;

  /**
   * Validate permission key format: module.entity.action
   */
  static isValidPermissionKey(key: string): key is PermissionKey {
    const parts = key.split('.');
    if (parts.length !== 3) return false;

    const [module, entity, action] = parts;
    
    // Check module namespace
    if (!MODULE_NAMESPACES.includes(module as ModuleNamespace)) {
      return false;
    }

    // Check action verb
    if (!ACTION_VERBS.includes(action as ActionVerb)) {
      return false;
    }

    // Entity must be non-empty
    if (!entity || entity.trim() === '') {
      return false;
    }

    return true;
  }

  /**
   * Parse permission key into components
   */
  static parsePermissionKey(key: PermissionKey): {
    module: ModuleNamespace;
    entity: string;
    action: ActionVerb;
  } {
    const [module, entity, action] = key.split('.');
    return {
      module: module as ModuleNamespace,
      entity,
      action: action as ActionVerb,
    };
  }

  /**
   * Register a new permission
   */
  register(data: {
    permissionKey: PermissionKey;
    label: string;
    description?: string;
    isSensitive?: boolean;
    requiresLimit?: boolean;
    sortOrder?: number;
  }): Permission {
    if (!PermissionService.isValidPermissionKey(data.permissionKey)) {
      throw new Error(`Invalid permission key format: ${data.permissionKey}`);
    }

    if (this.permissionsByKey.has(data.permissionKey)) {
      throw new Error(`Permission already exists: ${data.permissionKey}`);
    }

    const { module, entity, action } = PermissionService.parsePermissionKey(data.permissionKey);

    const permission: Permission = {
      id: this.nextId++,
      permissionKey: data.permissionKey,
      module,
      entity,
      action,
      label: data.label,
      description: data.description,
      isSensitive: data.isSensitive ?? false,
      requiresLimit: data.requiresLimit ?? false,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.permissions.set(permission.id, permission);
    this.permissionsByKey.set(permission.permissionKey, permission);

    return permission;
  }

  /**
   * Get permission by ID
   */
  getById(id: number): Permission | undefined {
    return this.permissions.get(id);
  }

  /**
   * Get permission by key
   */
  getByKey(key: PermissionKey): Permission | undefined {
    return this.permissionsByKey.get(key);
  }

  /**
   * Get all permissions
   */
  getAll(): Permission[] {
    return Array.from(this.permissions.values());
  }

  /**
   * Get permissions by module
   */
  getByModule(module: ModuleNamespace): Permission[] {
    return this.getAll().filter(p => p.module === module);
  }

  /**
   * Get permissions by entity
   */
  getByEntity(module: ModuleNamespace, entity: string): Permission[] {
    return this.getAll().filter(p => p.module === module && p.entity === entity);
  }

  /**
   * Check if permission exists
   */
  exists(key: PermissionKey): boolean {
    return this.permissionsByKey.has(key);
  }

  /**
   * Deactivate a permission
   */
  deactivate(id: number): void {
    const permission = this.permissions.get(id);
    if (!permission) {
      throw new Error(`Permission not found: ${id}`);
    }
    permission.isActive = false;
  }

  /**
   * Activate a permission
   */
  activate(id: number): void {
    const permission = this.permissions.get(id);
    if (!permission) {
      throw new Error(`Permission not found: ${id}`);
    }
    permission.isActive = true;
  }

  /**
   * Seed common permissions for a module
   */
  seedModulePermissions(module: ModuleNamespace, entity: string, label: string): Permission[] {
    const permissions: Permission[] = [];

    const actions: Array<{ action: ActionVerb; label: string; isSensitive?: boolean; requiresLimit?: boolean }> = [
      { action: 'view', label: `View ${label}` },
      { action: 'view_all', label: `View all ${label}` },
      { action: 'create', label: `Create ${label}` },
      { action: 'edit', label: `Edit ${label}` },
      { action: 'edit_any', label: `Edit any ${label}` },
      { action: 'delete_draft', label: `Delete draft ${label}` },
      { action: 'submit', label: `Submit ${label}` },
      { action: 'approve', label: `Approve ${label}`, requiresLimit: true },
      { action: 'reject', label: `Reject ${label}` },
      { action: 'return', label: `Return ${label}` },
      { action: 'print', label: `Print ${label}` },
      { action: 'export', label: `Export ${label}` },
    ];

    for (const { action, label: actionLabel, isSensitive, requiresLimit } of actions) {
      const key = `${module}.${entity}.${action}` as PermissionKey;
      if (!this.exists(key)) {
        permissions.push(this.register({
          permissionKey: key,
          label: actionLabel,
          isSensitive,
          requiresLimit,
        }));
      }
    }

    return permissions;
  }
}

export const permissionService = new PermissionService();
