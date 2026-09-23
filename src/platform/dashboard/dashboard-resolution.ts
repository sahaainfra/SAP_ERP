/**
 * Part 20 — Dashboard Resolution Service
 * 
 * Core engine that resolves which dashboard a user should see based on:
 * - Effective permission set (Part 08)
 * - Project context (Part 02)
 * - Responsibility template (Part 06)
 * - Personalization preferences (Part 17)
 * 
 * Resolution order:
 * 1. Determine active context (company, project(s), site(s), FY)
 * 2. Resolve effective permission set for that context
 * 3. Resolve dashboard layout (five-step resolution)
 * 4. Filter widgets by permission; remove unauthorized; re-flow grid
 * 5. Batch-fetch all KPIs in one call
 * 6. Render from snapshot immediately, then apply live values
 * 7. Subscribe to relevant event channels
 */

import {
  DashboardDefinition,
  DashboardResolutionContext,
  ResolvedDashboard,
  ResolvedBand,
  ResolvedWidget,
  UniversalBand,
  UNIVERSAL_BANDS,
  ROLE_DASHBOARDS,
  RoleDashboardCode,
  DashboardPersonalization,
  WidgetDefinition,
} from './types';
import { Actor } from '../permission/actor';

export class DashboardResolutionService {
  private personalizations: Map<string, DashboardPersonalization> = new Map();

  /**
   * Resolve dashboard for a user in a given context
   */
  async resolve(
    actor: Actor,
    context: DashboardResolutionContext
  ): Promise<ResolvedDashboard> {
    // Step 1: Determine which dashboard definition to use
    const dashboardDef = await this.resolveDashboardDefinition(actor, context);
    
    // Step 2: Apply personalization (if any)
    const personalized = await this.applyPersonalization(dashboardDef, actor.userId, context.projectIds[0]);
    
    // Step 3: Filter bands and widgets by permission
    const resolvedBands = this.filterByPermission(personalized, actor);
    
    // Step 4: Re-flow grid (remove empty bands, adjust sizes)
    const finalBands = this.reflowGrid(resolvedBands);
    
    return {
      context,
      bands: finalBands,
      resolvedAt: new Date().toISOString(),
      permissionVersion: actor.permVersion,
    };
  }

  /**
   * Resolve which dashboard definition to use
   * Five-step resolution:
   * 1. User's personal dashboard for this project
   * 2. User's personal dashboard with project_id NULL
   * 3. Template default for responsibility on this project
   * 4. Template default with project_id NULL
   * 5. System default for the role
   */
  private async resolveDashboardDefinition(
    actor: Actor,
    context: DashboardResolutionContext
  ): Promise<DashboardDefinition> {
    const projectId = context.projectIds[0];
    
    // Step 1: Check for user's personal dashboard for this project
    const personalKey = this.getPersonalizationKey(actor.userId, projectId);
    const personalization = this.personalizations.get(personalKey);
    if (personalization) {
      const personalDashboard = ROLE_DASHBOARDS[personalization.dashboardCode as RoleDashboardCode];
      if (personalDashboard) {
        return personalDashboard;
      }
    }
    
    // Step 2: Check for user's personal dashboard with project_id NULL
    const personalKeyNoProject = this.getPersonalizationKey(actor.userId);
    const personalizationNoProject = this.personalizations.get(personalKeyNoProject);
    if (personalizationNoProject) {
      const personalDashboard = ROLE_DASHBOARDS[personalizationNoProject.dashboardCode as RoleDashboardCode];
      if (personalDashboard) {
        return personalDashboard;
      }
    }
    
    // Step 3: Check for template default for responsibility on this project
    if (context.responsibilityTemplate) {
      const templateDashboard = this.findDashboardByTemplate(context.responsibilityTemplate, projectId);
      if (templateDashboard) {
        return templateDashboard;
      }
    }
    
    // Step 4: Check for template default with project_id NULL
    if (context.responsibilityTemplate) {
      const templateDashboard = this.findDashboardByTemplate(context.responsibilityTemplate);
      if (templateDashboard) {
        return templateDashboard;
      }
    }
    
    // Step 5: Fall back to system default based on actor's permissions
    // In production, would check actor's responsibility template or role
    // For now, default to project_manager if they have project permissions
    if (actor.can('project.project.view', projectId)) {
      return ROLE_DASHBOARDS.project_manager!;
    }
    
    // Ultimate fallback: super_admin dashboard (most permissive)
    return ROLE_DASHBOARDS.super_admin!;
  }

  /**
   * Find dashboard by responsibility template
   */
  private findDashboardByTemplate(
    templateCode: string,
    projectId?: number
  ): DashboardDefinition | undefined {
    // In production, would query dx_dashboard table
    // For now, check ROLE_DASHBOARDS for matching audience
    for (const dashboard of Object.values(ROLE_DASHBOARDS)) {
      if (dashboard?.audience.responsibilityTemplates?.includes(templateCode)) {
        return dashboard;
      }
    }
    return undefined;
  }

  /**
   * Apply user personalization to dashboard
   */
  private async applyPersonalization(
    dashboard: DashboardDefinition,
    userId: number,
    projectId?: number
  ): Promise<DashboardDefinition> {
    const key = this.getPersonalizationKey(userId, projectId);
    const personalization = this.personalizations.get(key);
    
    if (!personalization) {
      return dashboard; // No personalization, return as-is
    }
    
    // Apply widget order
    const orderedBands = dashboard.bands.map(band => {
      const orderedWidgets = [...band.widgets].sort((a, b) => {
        const aIndex = personalization.widgetOrder.indexOf(a.id);
        const bIndex = personalization.widgetOrder.indexOf(b.id);
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
      
      return { ...band, widgets: orderedWidgets };
    });
    
    // Apply widget sizes
    const resizedBands = orderedBands.map(band => ({
      ...band,
      widgets: band.widgets.map(widget => ({
        ...widget,
        size: personalization.widgetSizes[widget.id] || widget.size,
      })),
    }));
    
    return { ...dashboard, bands: resizedBands };
  }

  /**
   * Filter bands and widgets by permission
   * Rule: A tile the user is not authorized to see does not exist (not empty, not zero)
   */
  private filterByPermission(
    dashboard: DashboardDefinition,
    actor: Actor
  ): ResolvedBand[] {
    const resolvedBands: ResolvedBand[] = [];
    
    for (const band of dashboard.bands) {
      // Filter widgets by permission
      const resolvedWidgets: ResolvedWidget[] = [];
      
      for (const widget of band.widgets) {
        // Check if user has permission for this widget
        const projectId = actor.projectId || undefined;
        if (actor.can(widget.permissionKey, projectId)) {
          resolvedWidgets.push({
            id: widget.id,
            type: widget.type,
            title: widget.title,
            size: widget.size,
            kpiCode: widget.kpiCode,
            config: widget.config,
            isMandatory: widget.isMandatory || false,
          });
        }
      }
      
      // Only include band if it has at least one widget
      if (resolvedWidgets.length > 0) {
        const bandDef = UNIVERSAL_BANDS.find(b => b.id === band.id);
        resolvedBands.push({
          id: band.id,
          label: bandDef?.label || band.label,
          collapsible: band.collapsible ?? bandDef?.collapsible ?? true,
          widgets: resolvedWidgets,
        });
      }
    }
    
    return resolvedBands;
  }

  /**
   * Re-flow grid after filtering
   * Ensures no gaps in the layout
   */
  private reflowGrid(bands: ResolvedBand[]): ResolvedBand[] {
    // In production, would implement CSS Grid re-flow logic
    // For now, just return bands as-is (CSS Grid handles re-flow automatically)
    return bands;
  }

  /**
   * Save user personalization
   */
  async savePersonalization(
    userId: number,
    projectId: number | undefined,
    personalization: Omit<DashboardPersonalization, 'userId' | 'updatedAt'>
  ): Promise<void> {
    const key = this.getPersonalizationKey(userId, projectId);
    
    const existing = this.personalizations.get(key) || {
      userId,
      dashboardCode: personalization.dashboardCode,
      projectId,
      widgetOrder: [],
      hiddenWidgets: [],
      widgetSizes: {},
      pinnedKpis: [],
      savedFilters: {},
      updatedAt: new Date().toISOString(),
    };
    
    const updated: DashboardPersonalization = {
      ...existing,
      ...personalization,
      updatedAt: new Date().toISOString(),
    };
    
    this.personalizations.set(key, updated);
    
    // In production, would persist to dx_user_preference or dx_dashboard_personalization
  }

  /**
   * Get user personalization
   */
  async getPersonalization(
    userId: number,
    projectId?: number
  ): Promise<DashboardPersonalization | undefined> {
    const key = this.getPersonalizationKey(userId, projectId);
    return this.personalizations.get(key);
  }

  /**
   * Get personalization key
   */
  private getPersonalizationKey(userId: number, projectId?: number): string {
    return projectId ? `${userId}:${projectId}` : `${userId}:global`;
  }

  /**
   * Get all KPI codes needed for a dashboard (for batch fetch)
   */
  getRequiredKpiCodes(dashboard: ResolvedDashboard): string[] {
    const kpiCodes = new Set<string>();
    
    for (const band of dashboard.bands) {
      for (const widget of band.widgets) {
        if (widget.kpiCode) {
          kpiCodes.add(widget.kpiCode);
        }
      }
    }
    
    return Array.from(kpiCodes);
  }

  /**
   * Check if dashboard needs re-resolution (e.g., permission changed)
   */
  needsReResolution(
    currentDashboard: ResolvedDashboard,
    actor: Actor
  ): boolean {
    return currentDashboard.permissionVersion !== actor.permVersion;
  }
}

// Singleton instance
export const dashboardResolutionService = new DashboardResolutionService();
