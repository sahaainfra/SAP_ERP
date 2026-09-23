/**
 * Part 06 — Responsibility Template Service
 * 
 * Manages responsibility templates and their permission mappings.
 */

import { 
  ResponsibilityTemplate, 
  ResponsibilityTemplateWithPermissions,
  ResponsibilityTemplatePermission,
  TemplateCategory,
  Permission,
  SYSTEM_TEMPLATE_CODES,
  SystemTemplateCode
} from './types';
import { permissionService } from './permission.service';

export class ResponsibilityTemplateService {
  private templates: Map<number, ResponsibilityTemplate> = new Map();
  private templatesByCode: Map<string, ResponsibilityTemplate> = new Map();
  private templatePermissions: Map<number, ResponsibilityTemplatePermission[]> = new Map();
  private nextId = 1;
  private nextPermissionId = 1;

  /**
   * Create a new responsibility template
   */
  create(data: {
    templateCode: string;
    templateName: string;
    description?: string;
    category?: TemplateCategory;
    isSystem?: boolean;
    companyId?: number;
    createdBy: number;
  }): ResponsibilityTemplate {
    if (this.templatesByCode.has(data.templateCode)) {
      throw new Error(`Template code already exists: ${data.templateCode}`);
    }

    const template: ResponsibilityTemplate = {
      id: this.nextId++,
      templateCode: data.templateCode,
      templateName: data.templateName,
      description: data.description,
      category: data.category,
      isSystem: data.isSystem ?? false,
      isActive: true,
      companyId: data.companyId,
      createdBy: data.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    this.templates.set(template.id, template);
    this.templatesByCode.set(template.templateCode, template);
    this.templatePermissions.set(template.id, []);

    return template;
  }

  /**
   * Get template by ID
   */
  getById(id: number): ResponsibilityTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * Get template by code
   */
  getByCode(code: string): ResponsibilityTemplate | undefined {
    return this.templatesByCode.get(code);
  }

  /**
   * Get all templates
   */
  getAll(): ResponsibilityTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get template with permissions
   */
  getWithPermissions(id: number): ResponsibilityTemplateWithPermissions | undefined {
    const template = this.templates.get(id);
    if (!template) return undefined;

    const perms = this.templatePermissions.get(id) || [];
    const permissions = perms.map(tp => ({
      permission: permissionService.getById(tp.permissionId)!,
      isGranted: tp.isGranted,
    })).filter(p => p.permission);

    return { ...template, permissions };
  }

  /**
   * Add permission to template
   */
  addPermission(templateId: number, permissionId: number, isGranted: boolean = true): void {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const permission = permissionService.getById(permissionId);
    if (!permission) {
      throw new Error(`Permission not found: ${permissionId}`);
    }

    const perms = this.templatePermissions.get(templateId) || [];
    const existing = perms.find(p => p.permissionId === permissionId);

    if (existing) {
      existing.isGranted = isGranted;
    } else {
      perms.push({
        id: this.nextPermissionId++,
        templateId,
        permissionId,
        isGranted,
      });
      this.templatePermissions.set(templateId, perms);
    }

    // Increment version
    template.version++;
    template.updatedAt = new Date().toISOString();
  }

  /**
   * Remove permission from template
   */
  removePermission(templateId: number, permissionId: number): void {
    const perms = this.templatePermissions.get(templateId) || [];
    const filtered = perms.filter(p => p.permissionId !== permissionId);
    this.templatePermissions.set(templateId, filtered);

    const template = this.templates.get(templateId);
    if (template) {
      template.version++;
      template.updatedAt = new Date().toISOString();
    }
  }

  /**
   * Get permissions for template
   */
  getPermissions(templateId: number): ResponsibilityTemplatePermission[] {
    return this.templatePermissions.get(templateId) || [];
  }

  /**
   * Deactivate template
   */
  deactivate(id: number): void {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }
    if (template.isSystem) {
      throw new Error('Cannot deactivate system template');
    }
    template.isActive = false;
    template.updatedAt = new Date().toISOString();
  }

  /**
   * Seed system templates
   */
  seedSystemTemplates(createdBy: number): void {
    for (const code of SYSTEM_TEMPLATE_CODES) {
      if (!this.templatesByCode.has(code)) {
        this.create({
          templateCode: code,
          templateName: code.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          isSystem: true,
          createdBy,
        });
      }
    }
  }

  /**
   * Update template (explicit propagation required)
   */
  update(id: number, data: {
    templateName?: string;
    description?: string;
    category?: TemplateCategory;
    updatedBy: number;
  }): ResponsibilityTemplate {
    const template = this.templates.get(id);
    if (!template) {
      throw new Error(`Template not found: ${id}`);
    }

    if (data.templateName !== undefined) template.templateName = data.templateName;
    if (data.description !== undefined) template.description = data.description;
    if (data.category !== undefined) template.category = data.category;
    
    template.updatedBy = data.updatedBy;
    template.updatedAt = new Date().toISOString();
    template.version++;

    return template;
  }
}

export const responsibilityTemplateService = new ResponsibilityTemplateService();
