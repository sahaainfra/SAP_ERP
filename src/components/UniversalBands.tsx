/**
 * Part 01 — Universal Band Structure
 * 
 * Demonstrates the universal band system where bands with no authorised
 * content are omitted entirely rather than shown empty.
 * 
 * Bands: KPI, My Work, My Approvals, My Tasks, My Projects, My Sites,
 * Analytics, Recent Activity, My Exceptions, My Deadlines, My Notifications,
 * My Messages, Quick Actions.
 */

import React from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { usePermission } from '../contexts/PermissionContext';
import type { UniversalBand } from '../types/contracts';
import {
  TrendingUp,
  Briefcase,
  CheckSquare,
  ListTodo,
  FolderKanban,
  MapPin,
  BarChart3,
  Activity,
  AlertTriangle,
  Clock,
  Bell,
  MessageSquare,
  Zap,
} from 'lucide-react';

const BAND_ICONS: Record<UniversalBand, React.ReactNode> = {
  kpi: <TrendingUp size={16} />,
  my_work: <Briefcase size={16} />,
  my_approvals: <CheckSquare size={16} />,
  my_tasks: <ListTodo size={16} />,
  my_projects: <FolderKanban size={16} />,
  my_sites: <MapPin size={16} />,
  analytics: <BarChart3 size={16} />,
  recent_activity: <Activity size={16} />,
  my_exceptions: <AlertTriangle size={16} />,
  my_deadlines: <Clock size={16} />,
  my_notifications: <Bell size={16} />,
  my_messages: <MessageSquare size={16} />,
  quick_actions: <Zap size={16} />,
};

const BAND_LABELS: Record<UniversalBand, string> = {
  kpi: 'Key Performance Indicators',
  my_work: 'My Work',
  my_approvals: 'My Approvals',
  my_tasks: 'My Tasks',
  my_projects: 'My Projects',
  my_sites: 'My Sites',
  analytics: 'Analytics',
  recent_activity: 'Recent Activity',
  my_exceptions: 'My Exceptions',
  my_deadlines: 'My Deadlines',
  my_notifications: 'My Notifications',
  my_messages: 'My Messages',
  quick_actions: 'Quick Actions',
};

interface UniversalBandsProps {
  children: React.ReactNode;
  band: UniversalBand;
  showHeader?: boolean;
}

export function UniversalBand({ children, band, showHeader = true }: UniversalBandsProps) {
  const { hasPermission } = usePermission();

  // Check if user has any permission for tiles in this band
  // For demo, we show all bands but in production this would check actual tile permissions
  const hasContent = React.Children.count(children) > 0;

  // Rule: band with no authorised content is omitted entirely
  if (!hasContent) {
    return null;
  }

  return (
    <section className="mb-6">
      {showHeader && (
        <div className="flex items-center gap-2 mb-3">
          <div className="text-slate-400">
            {BAND_ICONS[band]}
          </div>
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">
            {BAND_LABELS[band]}
          </h2>
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Band visibility indicator — shows which bands are visible/hidden
 * for the current user context
 */
export function BandVisibilityMap() {
  const { getVisibleTiles } = useWorkspace();
  const tiles = getVisibleTiles();

  // Group tiles by band
  const bandCounts = new Map<string, number>();
  tiles.forEach(tile => {
    // Map tile.type to band for demo
    const bandMap: Record<string, UniversalBand> = {
      kpi: 'kpi',
      worklist: 'my_work',
      'quick-action': 'quick_actions',
      chart: 'analytics',
    };
    const band = bandMap[tile.type] || 'kpi';
    bandCounts.set(band, (bandCounts.get(band) || 0) + 1);
  });

  const allBands: UniversalBand[] = [
    'kpi', 'my_work', 'my_approvals', 'my_tasks', 'my_projects',
    'my_sites', 'analytics', 'recent_activity', 'my_exceptions',
    'my_deadlines', 'my_notifications', 'my_messages', 'quick_actions',
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="text-sm font-semibold text-slate-800 mb-3">
        Universal Band Visibility
      </h3>
      <p className="text-xs text-slate-500 mb-3">
        Bands with no authorised content are omitted entirely (not shown empty)
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {allBands.map(band => {
          const count = bandCounts.get(band) || 0;
          const isVisible = count > 0;
          return (
            <div
              key={band}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                isVisible
                  ? 'bg-emerald-50 border border-emerald-200'
                  : 'bg-slate-50 border border-slate-200 opacity-50'
              }`}
            >
              <div className={isVisible ? 'text-emerald-600' : 'text-slate-400'}>
                {BAND_ICONS[band]}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`font-medium truncate ${
                  isVisible ? 'text-emerald-800' : 'text-slate-500'
                }`}>
                  {BAND_LABELS[band]}
                </div>
                <div className="text-[10px] text-slate-500">
                  {isVisible ? `${count} tiles` : 'omitted'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
