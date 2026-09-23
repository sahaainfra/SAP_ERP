/**
 * Part 16 — Context Service
 * 
 * Manages the ambient context (company, project, site, FY) with:
 * - Server-driven available context
 * - Persistence per user
 * - Coordinated refresh on context change
 * - Permission validation
 */

import { UserContext, AvailableContext, ContextChangeEvent } from './types';

export class ContextService {
  private currentContext: UserContext | null = null;
  private availableContext: AvailableContext | null = null;
  private listeners: Array<(event: ContextChangeEvent) => void> = [];

  /**
   * Fetch available context options from server
   */
  async fetchAvailableContext(): Promise<AvailableContext> {
    // In production, would call:
    // GET /api/dx/v1/context/available
    // For demo, return mock data
    const available = await this.mockFetchAvailableContext();
    this.availableContext = available;
    return available;
  }

  /**
   * Get available context (from cache)
   */
  getAvailableContext(): AvailableContext | null {
    return this.availableContext;
  }

  /**
   * Get current context
   */
  getCurrentContext(): UserContext | null {
    return this.currentContext;
  }

  /**
   * Set context (with server validation)
   */
  async setContext(newContext: Partial<UserContext>): Promise<UserContext> {
    const previous = this.currentContext || this.getDefaultContext();
    
    // Validate against available context
    const validated = await this.validateContext(newContext);
    
    // Persist to server
    // In production, would call:
    // PUT /api/dx/v1/context
    await this.mockPersistContext(validated);

    // Determine which dimensions changed
    const changedDimensions: Array<'company' | 'branch' | 'project' | 'site' | 'financialYear'> = [];
    if (validated.companyId !== previous.companyId) changedDimensions.push('company');
    if (validated.branchId !== previous.branchId) changedDimensions.push('branch');
    if (JSON.stringify(validated.projectIds) !== JSON.stringify(previous.projectIds)) changedDimensions.push('project');
    if (JSON.stringify(validated.siteIds) !== JSON.stringify(previous.siteIds)) changedDimensions.push('site');
    if (validated.financialYear !== previous.financialYear) changedDimensions.push('financialYear');

    // Update current context
    this.currentContext = validated;

    // Notify listeners if context changed
    if (changedDimensions.length > 0) {
      const event: ContextChangeEvent = {
        previous,
        current: validated,
        changedDimensions,
      };
      this.notifyListeners(event);
    }

    return validated;
  }

  /**
   * Subscribe to context changes
   */
  subscribe(listener: (event: ContextChangeEvent) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Check if user has access to a specific project
   */
  hasProjectAccess(projectId: number): boolean {
    if (!this.availableContext) return false;
    return this.availableContext.projects.some(p => p.id === projectId);
  }

  /**
   * Check if user has access to a specific site
   */
  hasSiteAccess(siteId: number): boolean {
    if (!this.availableContext) return false;
    return this.availableContext.sites.some(s => s.id === siteId);
  }

  /**
   * Get default context (first available of each dimension)
   */
  private getDefaultContext(): UserContext {
    if (!this.availableContext) {
      return {
        projectIds: [],
        siteIds: [],
      };
    }

    return {
      companyId: this.availableContext.companies[0]?.id,
      branchId: this.availableContext.branches[0]?.id,
      projectIds: this.availableContext.projects.length > 0 
        ? [this.availableContext.projects[0].id] 
        : [],
      siteIds: [],
      financialYear: this.availableContext.financialYears[0],
    };
  }

  /**
   * Validate context against available options
   */
  private async validateContext(context: Partial<UserContext>): Promise<UserContext> {
    if (!this.availableContext) {
      throw new Error('Available context not loaded');
    }

    const validated: UserContext = {
      projectIds: [],
      siteIds: [],
    };

    // Validate company
    if (context.companyId !== undefined) {
      const company = this.availableContext.companies.find(c => c.id === context.companyId);
      if (!company) {
        throw new Error(`Invalid company ID: ${context.companyId}`);
      }
      validated.companyId = company.id;
    }

    // Validate branch
    if (context.branchId !== undefined) {
      const branch = this.availableContext.branches.find(b => b.id === context.branchId);
      if (!branch) {
        throw new Error(`Invalid branch ID: ${context.branchId}`);
      }
      validated.branchId = branch.id;
    }

    // Validate projects
    if (context.projectIds !== undefined) {
      for (const projectId of context.projectIds) {
        const project = this.availableContext.projects.find(p => p.id === projectId);
        if (!project) {
          throw new Error(`Invalid project ID: ${projectId}`);
        }
      }
      validated.projectIds = context.projectIds;
    }

    // Validate sites (filtered to selected projects)
    if (context.siteIds !== undefined) {
      const availableSites = this.availableContext.sites.filter(
        s => validated.projectIds.length === 0 || validated.projectIds.includes(s.projectId)
      );
      for (const siteId of context.siteIds) {
        const site = availableSites.find(s => s.id === siteId);
        if (!site) {
          throw new Error(`Invalid site ID: ${siteId}`);
        }
      }
      validated.siteIds = context.siteIds;
    }

    // Validate financial year
    if (context.financialYear !== undefined) {
      if (!this.availableContext.financialYears.includes(context.financialYear)) {
        throw new Error(`Invalid financial year: ${context.financialYear}`);
      }
      validated.financialYear = context.financialYear;
    }

    return validated;
  }

  /**
   * Notify all listeners of context change
   */
  private notifyListeners(event: ContextChangeEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Context listener error:', error);
      }
    }
  }

  /**
   * Mock fetch available context (in production, would call API)
   */
  private async mockFetchAvailableContext(): Promise<AvailableContext> {
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
      companies: [
        { id: 1, name: 'Acme Construction Ltd', code: 'ACME' },
      ],
      branches: [
        { id: 1, name: 'Head Office', code: 'HO', companyId: 1 },
        { id: 2, name: 'North Region', code: 'NR', companyId: 1 },
      ],
      projects: [
        { id: 1, name: 'Metro Corridor IV', code: 'MC4', companyId: 1 },
        { id: 2, name: 'NH-48 Flyover', code: 'NH48', companyId: 1 },
        { id: 3, name: 'Industrial Park Phase II', code: 'IP2', companyId: 1 },
      ],
      sites: [
        { id: 1, name: 'Reach 1', code: 'R1', projectId: 1 },
        { id: 2, name: 'Reach 2', code: 'R2', projectId: 1 },
        { id: 3, name: 'Site B', code: 'SB', projectId: 2 },
        { id: 4, name: 'Main Site', code: 'MS', projectId: 3 },
      ],
      financialYears: ['2025-26', '2026-27', '2027-28'],
    };
  }

  /**
   * Mock persist context (in production, would call API)
   */
  private async mockPersistContext(context: UserContext): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50));
    console.log('Context persisted:', context);
  }
}

export const contextService = new ContextService();
