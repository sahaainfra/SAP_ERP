/**
 * Part 01 — Workspace Resolver
 * 
 * Rule WS-01: A tile the user is not authorised to see does not exist on their workspace.
 * Rule WS-08: A user with different roles on different projects receives correctly different workspaces.
 * Rule WS-09: The client never filters a band, tile list or total. It renders what the server resolved.
 * 
 * This resolver implements deny-by-default permission checking.
 * Until Part 08 exists, unresolvable permissions return false, never true.
 */

import type { TileContract, KPIGovernance, WorkspaceResolution, UniversalBand } from '../types/contracts';
import type { UserIdentity, ProjectContext } from '../types/workspace';

export interface PermissionInterface {
  /**
   * Check if user has a specific permission
   * Deny-by-default: returns false if permission cannot be resolved
   */
  hasPermission(userId: string, permissionKey: string): boolean;
  
  /**
   * Check if user can access a specific project
   */
  canAccessProject(userId: string, projectId: string): boolean;
  
  /**
   * Check if user can access a specific site
   */
  canAccessSite(userId: string, siteId: string): boolean;
  
  /**
   * Get all permission keys for a user
   */
  getUserPermissions(userId: string): string[];
}

/**
 * Deny-by-default permission interface
 * Until Part 08 implements the real permission engine,
 * this returns false for any unresolvable permission.
 */
export class DenyByDefaultPermissionInterface implements PermissionInterface {
  private userPermissions: Map<string, Set<string>> = new Map();
  private userProjects: Map<string, Set<string>> = new Map();
  private userSites: Map<string, Set<string>> = new Map();

  /**
   * Register permissions for a user (for testing/demo)
   */
  registerUserPermissions(userId: string, permissions: string[]): void {
    this.userPermissions.set(userId, new Set(permissions));
  }

  /**
   * Register project access for a user
   */
  registerUserProjects(userId: string, projectIds: string[]): void {
    this.userProjects.set(userId, new Set(projectIds));
  }

  /**
   * Register site access for a user
   */
  registerUserSites(userId: string, siteIds: string[]): void {
    this.userSites.set(userId, new Set(siteIds));
  }

  hasPermission(userId: string, permissionKey: string): boolean {
    const perms = this.userPermissions.get(userId);
    if (!perms) return false; // Deny-by-default
    return perms.has(permissionKey);
  }

  canAccessProject(userId: string, projectId: string): boolean {
    const projects = this.userProjects.get(userId);
    if (!projects) return false; // Deny-by-default
    return projects.has(projectId);
  }

  canAccessSite(userId: string, siteId: string): boolean {
    const sites = this.userSites.get(userId);
    if (!sites) return false; // Deny-by-default
    return sites.has(siteId);
  }

  getUserPermissions(userId: string): string[] {
    const perms = this.userPermissions.get(userId);
    return perms ? Array.from(perms) : [];
  }
}

export class WorkspaceResolver {
  private tiles: Map<string, TileContract> = new Map();
  private kpis: Map<string, KPIGovernance> = new Map();
  private permissionInterface: PermissionInterface;

  constructor(permissionInterface: PermissionInterface) {
    this.permissionInterface = permissionInterface;
  }

  /**
   * Register a tile
   */
  registerTile(tile: TileContract): void {
    this.tiles.set(tile.code, tile);
  }

  /**
   * Register a KPI
   */
  registerKPI(kpi: KPIGovernance): void {
    this.kpis.set(kpi.code, kpi);
  }

  /**
   * Resolve workspace for a user in a project context
   * 
   * Resolution order:
   * user → organisation → company → department → global role → 
   * project assignments → site assignments → responsibility template → 
   * explicit overrides → approval authority → row scope
   */
  resolve(
    userId: string,
    projectId: string | null,
    siteId: string | null,
    deviceTier: 'desktop' | 'tablet' | 'mobile' = 'desktop'
  ): WorkspaceResolution {
    const resolvedAt = new Date().toISOString();
    const allTiles = Array.from(this.tiles.values());
    
    // Filter by permission (Rule WS-01: unauthorised tiles are absent)
    const authorisedTiles = allTiles.filter(tile => 
      this.permissionInterface.hasPermission(userId, tile.permissionKey)
    );

    // Filter by device tier
    const deviceFilteredTiles = authorisedTiles.filter(tile =>
      tile.deviceTiers.includes(deviceTier)
    );

    // Filter by enabled state
    const enabledTiles = deviceFilteredTiles.filter(tile => tile.enabled);

    // Group by band
    const bandMap = new Map<UniversalBand, TileContract[]>();
    for (const tile of enabledTiles) {
      const existing = bandMap.get(tile.band) || [];
      existing.push(tile);
      bandMap.set(tile.band, existing);
    }

    // Sort tiles within each band by defaultPlacement.order
    for (const [band, tiles] of bandMap) {
      tiles.sort((a, b) => a.defaultPlacement.order - b.defaultPlacement.order);
    }

    // Build bands array (Rule: band with no authorised content is omitted)
    const bands = Array.from(bandMap.entries())
      .filter(([_, tiles]) => tiles.length > 0)
      .map(([band, tiles]) => ({
        band,
        visible: true,
        tiles,
      }));

    const permissionFilteredCount = allTiles.length - authorisedTiles.length;

    return {
      userId,
      projectId,
      siteId,
      resolvedAt,
      bands,
      totalTiles: enabledTiles.length,
      permissionFilteredCount,
    };
  }

  /**
   * Get a tile by code
   */
  getTile(code: string): TileContract | undefined {
    return this.tiles.get(code);
  }

  /**
   * Get a KPI by code
   */
  getKPI(code: string): KPIGovernance | undefined {
    return this.kpis.get(code);
  }

  /**
   * Get all tiles for a specific band
   */
  getTilesForBand(band: UniversalBand): TileContract[] {
    return Array.from(this.tiles.values())
      .filter(tile => tile.band === band && tile.enabled)
      .sort((a, b) => a.defaultPlacement.order - b.defaultPlacement.order);
  }
}

// Singleton instances
export const permissionInterface = new DenyByDefaultPermissionInterface();
export const workspaceResolver = new WorkspaceResolver(permissionInterface);
