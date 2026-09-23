/**
 * Part 01 — Workspace Context
 * 
 * The central registry for tiles, KPIs, worklists and quick actions.
 * Every module from Part 27 onward registers its workspace contributions
 * against these contracts. The workspace resolves visibility by permission,
 * filters values by project context, and renders the unified dashboard.
 * 
 * A tile never queries a table directly — it receives values from the
 * KPI service (Part 15), filtered by the permission engine (Part 08).
 */

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import type {
  TileDefinition,
  KPIDefinition,
  KPIValue,
  WorklistDefinition,
  WorklistItem,
  QuickAction,
  DashboardLayout,
  Notification,
  DomainEvent,
  EventSubscription,
  WorkspaceState,
  TilePosition,
} from '../types/workspace';
import { usePermission } from './PermissionContext';
import { useProject } from './ProjectContext';

// ─── Workspace Context Interface ─────────────────────────────────────────────

interface WorkspaceContextValue {
  // Tile registration
  registerTile: (tile: TileDefinition) => void;
  unregisterTile: (tileId: string) => void;
  getVisibleTiles: () => TileDefinition[];
  
  // KPI registration and values
  registerKPI: (kpi: KPIDefinition) => void;
  updateKPIValue: (kpiId: string, value: KPIValue) => void;
  getKPIValue: (kpiId: string) => KPIValue | undefined;
  
  // Worklist registration and items
  registerWorklist: (worklist: WorklistDefinition) => void;
  updateWorklistItems: (worklistId: string, items: WorklistItem[]) => void;
  getWorklistItems: (worklistId: string) => WorklistItem[];
  
  // Quick actions
  registerQuickAction: (action: QuickAction) => void;
  getQuickActions: (tileId: string) => QuickAction[];
  
  // Layout management
  layout: DashboardLayout | null;
  updateTilePosition: (tileId: string, position: TilePosition) => void;
  toggleTileVisibility: (tileId: string) => void;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  
  // Real-time events
  subscribe: (subscription: EventSubscription) => () => void;
  publishEvent: (event: DomainEvent) => void;
  
  // State
  isLoading: boolean;
  lastRefresh: string | null;
  refreshDashboard: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { hasPermission } = usePermission();
  const { activeProject, activeSite } = useProject();

  // Registration stores
  const [tiles, setTiles] = useState<Map<string, TileDefinition>>(new Map());
  const [kpis, setKpis] = useState<Map<string, KPIDefinition>>(new Map());
  const [kpiValues, setKpiValues] = useState<Map<string, KPIValue>>(new Map());
  const [worklists, setWorklists] = useState<Map<string, WorklistDefinition>>(new Map());
  const [worklistItems, setWorklistItems] = useState<Map<string, WorklistItem[]>>(new Map());
  const [quickActions, setQuickActions] = useState<Map<string, QuickAction[]>>(new Map());
  
  // Layout
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  
  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Event subscriptions
  const [subscriptions, setSubscriptions] = useState<Map<string, EventSubscription>>(new Map());
  
  // State
  const [isLoading, setIsLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  // ─── Tile Registration ──────────────────────────────────────────────────

  const registerTile = useCallback((tile: TileDefinition) => {
    setTiles(prev => {
      const next = new Map(prev);
      next.set(tile.id, tile);
      return next;
    });
  }, []);

  const unregisterTile = useCallback((tileId: string) => {
    setTiles(prev => {
      const next = new Map(prev);
      next.delete(tileId);
      return next;
    });
  }, []);

  const getVisibleTiles = useCallback((): TileDefinition[] => {
    const allTiles = Array.from(tiles.values());
    return allTiles
      .filter(tile => tile.enabled)
      .filter(tile => hasPermission(tile.permissionKey))
      .sort((a, b) => {
        // Sort by position if available, then by module
        if (a.position && b.position) {
          if (a.position.row !== b.position.row) return a.position.row - b.position.row;
          return a.position.col - b.position.col;
        }
        return a.module.localeCompare(b.module);
      });
  }, [tiles, hasPermission]);

  // ─── KPI Registration ──────────────────────────────────────────────────

  const registerKPI = useCallback((kpi: KPIDefinition) => {
    setKpis(prev => {
      const next = new Map(prev);
      next.set(kpi.id, kpi);
      return next;
    });
  }, []);

  const updateKPIValue = useCallback((kpiId: string, value: KPIValue) => {
    setKpiValues(prev => {
      const next = new Map(prev);
      next.set(kpiId, value);
      return next;
    });
  }, []);

  const getKPIValue = useCallback((kpiId: string): KPIValue | undefined => {
    return kpiValues.get(kpiId);
  }, [kpiValues]);

  // ─── Worklist Registration ─────────────────────────────────────────────

  const registerWorklist = useCallback((worklist: WorklistDefinition) => {
    setWorklists(prev => {
      const next = new Map(prev);
      next.set(worklist.id, worklist);
      return next;
    });
  }, []);

  const updateWorklistItems = useCallback((worklistId: string, items: WorklistItem[]) => {
    setWorklistItems(prev => {
      const next = new Map(prev);
      next.set(worklistId, items);
      return next;
    });
  }, []);

  const getWorklistItems = useCallback((worklistId: string): WorklistItem[] => {
    const items = worklistItems.get(worklistId) ?? [];
    // Filter by permission
    return items.filter(item => hasPermission(item.permissionKey));
  }, [worklistItems, hasPermission]);

  // ─── Quick Actions ─────────────────────────────────────────────────────

  const registerQuickAction = useCallback((action: QuickAction) => {
    setQuickActions(prev => {
      const next = new Map(prev);
      const existing = next.get(action.tileId) ?? [];
      next.set(action.tileId, [...existing, action]);
      return next;
    });
  }, []);

  const getQuickActions = useCallback((tileId: string): QuickAction[] => {
    const actions = quickActions.get(tileId) ?? [];
    return actions.filter(a => hasPermission(a.permissionKey));
  }, [quickActions, hasPermission]);

  // ─── Layout Management ─────────────────────────────────────────────────

  const updateTilePosition = useCallback((tileId: string, position: TilePosition) => {
    setLayout(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tiles: prev.tiles.map(t =>
          t.tileId === tileId ? { ...t, position } : t
        ),
        lastModified: new Date().toISOString(),
      };
    });
  }, []);

  const toggleTileVisibility = useCallback((tileId: string) => {
    setLayout(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        tiles: prev.tiles.map(t =>
          t.tileId === tileId ? { ...t, visible: !t.visible } : t
        ),
        lastModified: new Date().toISOString(),
      };
    });
  }, []);

  // ─── Notifications ─────────────────────────────────────────────────────

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  // ─── Event System ──────────────────────────────────────────────────────

  const subscribe = useCallback((subscription: EventSubscription): (() => void) => {
    setSubscriptions(prev => {
      const next = new Map(prev);
      next.set(subscription.id, subscription);
      return next;
    });
    return () => {
      setSubscriptions(prev => {
        const next = new Map(prev);
        next.delete(subscription.id);
        return next;
      });
    };
  }, []);

  const publishEvent = useCallback((event: DomainEvent) => {
    subscriptions.forEach(sub => {
      const matchesType = sub.eventTypes.some(t => t === event.type || t === '*');
      const matchesFilter = sub.filter ? sub.filter(event) : true;
      if (matchesType && matchesFilter) {
        sub.handler(event);
      }
    });
  }, [subscriptions]);

  // ─── Refresh ───────────────────────────────────────────────────────────

  const refreshDashboard = useCallback(() => {
    setIsLoading(true);
    // In production, this triggers re-fetch from KPI service
    setTimeout(() => {
      setIsLoading(false);
      setLastRefresh(new Date().toISOString());
    }, 500);
  }, []);

  // ─── Context Value ─────────────────────────────────────────────────────

  const value = useMemo<WorkspaceContextValue>(() => ({
    registerTile,
    unregisterTile,
    getVisibleTiles,
    registerKPI,
    updateKPIValue,
    getKPIValue,
    registerWorklist,
    updateWorklistItems,
    getWorklistItems,
    registerQuickAction,
    getQuickActions,
    layout,
    updateTilePosition,
    toggleTileVisibility,
    notifications,
    unreadCount,
    markNotificationRead,
    markAllRead,
    subscribe,
    publishEvent,
    isLoading,
    lastRefresh,
    refreshDashboard,
  }), [
    registerTile, unregisterTile, getVisibleTiles,
    registerKPI, updateKPIValue, getKPIValue,
    registerWorklist, updateWorklistItems, getWorklistItems,
    registerQuickAction, getQuickActions,
    layout, updateTilePosition, toggleTileVisibility,
    notifications, unreadCount, markNotificationRead, markAllRead,
    subscribe, publishEvent, isLoading, lastRefresh, refreshDashboard,
  ]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}
