/**
 * Part 01 — Dashboard View
 * 
 * The enterprise workspace dashboard. Renders permission-filtered tiles
 * in a responsive grid. Each tile type (KPI, Worklist, QuickAction, Chart)
 * renders through its own component, receiving data from the workspace
 * context — never querying tables directly.
 * 
 * Rule 3: Where there is no authorised data, render the defined empty state.
 * Rule 4: Unauthorised tiles are absent, not zero.
 */

import React, { useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermission } from '../contexts/PermissionContext';
import { KPITile } from './tiles/KPITile';
import { WorklistTile } from './tiles/WorklistTile';
import { QuickActionTile } from './tiles/QuickActionTile';
import { ChartTile } from './tiles/ChartTile';
import { EmptyState } from './EmptyState';
import { ProjectSummaryHeader } from './ProjectSummaryHeader';
import { RecentActivityFeed } from './RecentActivityFeed';
import { Activity, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

export function Dashboard() {
  const { getVisibleTiles, registerTile, registerKPI, registerWorklist, registerQuickAction } = useWorkspace();
  const { activeProject, activeSite } = useProject();
  const { hasPermission } = usePermission();

  // Register workspace tiles for the demo
  // In production, each module registers its own tiles on mount
  useEffect(() => {
    // Project overview KPIs
    if (hasPermission('project.project.view')) {
      registerTile({
        id: 'tile-project-progress',
        type: 'kpi',
        title: 'Physical Progress',
        subtitle: 'Planned vs Actual',
        module: 'project',
        permissionKey: 'project.project.view',
        size: 'medium',
        drillTarget: '/project/progress',
        enabled: true,
      });
      registerKPI({
        id: 'kpi-physical-progress',
        tileId: 'tile-project-progress',
        label: 'Physical Progress',
        source: 'project.progress',
        formula: 'Sum(certified_qty * rate) / Sum(boq_qty * rate) * 100',
        format: 'percentage',
        thresholds: { critical: 50, warning: 70, target: 90, excellent: 95 },
        comparisonPeriod: 'previous',
        drillTarget: '/project/progress',
        permissionKey: 'project.project.view',
        calculationPeriod: 'monthly',
        refreshMechanism: 'scheduled',
      });
    }

    if (hasPermission('procure.po.view')) {
      registerTile({
        id: 'tile-po-pending',
        type: 'kpi',
        title: 'Open Purchase Orders',
        subtitle: 'Awaiting delivery',
        module: 'procure',
        permissionKey: 'procure.po.view',
        size: 'small',
        drillTarget: '/procurement/po',
        enabled: true,
      });
      registerKPI({
        id: 'kpi-po-open',
        tileId: 'tile-po-pending',
        label: 'Open POs',
        source: 'procure.po.count',
        formula: 'COUNT(po) WHERE status IN (RELEASED, PARTIALLY_EXECUTED)',
        format: 'number',
        thresholds: { warning: 10, critical: 20 },
        drillTarget: '/procurement/po',
        permissionKey: 'procure.po.view',
        calculationPeriod: 'real-time',
        refreshMechanism: 'realtime',
      });
    }

    if (hasPermission('store.stock.view')) {
      registerTile({
        id: 'tile-stock-value',
        type: 'kpi',
        title: 'Stock Value',
        subtitle: 'Current inventory',
        module: 'store',
        permissionKey: 'store.stock.view',
        size: 'small',
        drillTarget: '/store/stock',
        enabled: true,
      });
      registerKPI({
        id: 'kpi-stock-value',
        tileId: 'tile-stock-value',
        label: 'Stock Value',
        source: 'store.stock.value',
        formula: 'SUM(qty_on_hand * weighted_avg_rate)',
        format: 'currency',
        thresholds: { warning: 5000000, critical: 10000000 },
        drillTarget: '/store/stock',
        permissionKey: 'store.stock.view',
        calculationPeriod: 'daily',
        refreshMechanism: 'scheduled',
      });
    }

    if (hasPermission('bill.client.view')) {
      registerTile({
        id: 'tile-billing',
        type: 'kpi',
        title: 'Billing Status',
        subtitle: 'RA Bills this month',
        module: 'bill',
        permissionKey: 'bill.client.view',
        size: 'small',
        drillTarget: '/billing/ra-bills',
        enabled: true,
      });
      registerKPI({
        id: 'kpi-billing',
        tileId: 'tile-billing',
        label: 'RA Bills',
        source: 'bill.client.count',
        formula: 'COUNT(ra_bill) WHERE period = current_month',
        format: 'number',
        thresholds: { target: 3 },
        drillTarget: '/billing/ra-bills',
        permissionKey: 'bill.client.view',
        calculationPeriod: 'monthly',
        refreshMechanism: 'realtime',
      });
    }

    if (hasPermission('finance.voucher.view')) {
      registerTile({
        id: 'tile-cashflow',
        type: 'kpi',
        title: 'Cash Flow',
        subtitle: 'Net position',
        module: 'finance',
        permissionKey: 'finance.voucher.view',
        size: 'medium',
        drillTarget: '/finance/cashflow',
        enabled: true,
      });
      registerKPI({
        id: 'kpi-cashflow',
        tileId: 'tile-cashflow',
        label: 'Net Cash Flow',
        source: 'finance.cashflow.net',
        formula: 'SUM(receipts) - SUM(payments) WHERE period = current_month',
        format: 'currency',
        thresholds: { critical: 0, warning: 1000000 },
        comparisonPeriod: 'previous',
        drillTarget: '/finance/cashflow',
        permissionKey: 'finance.voucher.view',
        calculationPeriod: 'monthly',
        refreshMechanism: 'scheduled',
      });
    }

    // Worklists
    if (hasPermission('procure.po.approve')) {
      registerTile({
        id: 'tile-approvals',
        type: 'worklist',
        title: 'Pending Approvals',
        subtitle: 'Awaiting your action',
        module: 'workflow',
        permissionKey: 'procure.po.approve',
        size: 'large',
        drillTarget: '/approvals',
        enabled: true,
      });
      registerWorklist({
        id: 'wl-approvals',
        tileId: 'tile-approvals',
        label: 'Pending Approvals',
        module: 'workflow',
        source: 'workflow.pending',
        maxItems: 10,
        permissionKey: 'procure.po.approve',
        drillTarget: '/approvals',
      });
    }

    if (hasPermission('qa.inspection.view')) {
      registerTile({
        id: 'tile-inspections',
        type: 'worklist',
        title: 'Upcoming Inspections',
        subtitle: 'Scheduled WIRs',
        module: 'qa',
        permissionKey: 'qa.inspection.view',
        size: 'medium',
        drillTarget: '/quality/inspections',
        enabled: true,
      });
      registerWorklist({
        id: 'wl-inspections',
        tileId: 'tile-inspections',
        label: 'Upcoming Inspections',
        module: 'qa',
        source: 'qa.inspection.scheduled',
        maxItems: 5,
        permissionKey: 'qa.inspection.view',
        drillTarget: '/quality/inspections',
      });
    }

    // Quick Actions
    if (hasPermission('procure.indent.create')) {
      registerTile({
        id: 'tile-quick-actions',
        type: 'quick-action',
        title: 'Quick Actions',
        module: 'workspace',
        permissionKey: 'procure.indent.create',
        size: 'small',
        enabled: true,
      });
      registerQuickAction({
        id: 'qa-create-indent',
        tileId: 'tile-quick-actions',
        label: 'New Indent',
        icon: 'package-plus',
        action: '/procurement/indent/new',
        permissionKey: 'procure.indent.create',
        module: 'procure',
        variant: 'primary',
      });
      registerQuickAction({
        id: 'qa-create-po',
        tileId: 'tile-quick-actions',
        label: 'New PO',
        icon: 'file-plus',
        action: '/procurement/po/new',
        permissionKey: 'procure.po.create',
        module: 'procure',
      });
      registerQuickAction({
        id: 'qa-create-grn',
        tileId: 'tile-quick-actions',
        label: 'Record GRN',
        icon: 'clipboard-check',
        action: '/store/grn/new',
        permissionKey: 'store.grn.create',
        module: 'store',
      });
      registerQuickAction({
        id: 'qa-create-dpr',
        tileId: 'tile-quick-actions',
        label: 'Daily Report',
        icon: 'clipboard-list',
        action: '/execution/dpr/new',
        permissionKey: 'project.dpr.create',
        module: 'project',
      });
    }

    // Chart tile
    if (hasPermission('project.project.view')) {
      registerTile({
        id: 'tile-progress-chart',
        type: 'chart',
        title: 'Progress Trend',
        subtitle: 'Last 6 months',
        module: 'project',
        permissionKey: 'project.project.view',
        size: 'wide',
        drillTarget: '/project/progress',
        enabled: true,
      });
    }

    if (hasPermission('finance.voucher.view')) {
      registerTile({
        id: 'tile-cost-chart',
        type: 'chart',
        title: 'Cost vs Budget',
        subtitle: 'Project cost tracking',
        module: 'finance',
        permissionKey: 'finance.voucher.view',
        size: 'wide',
        drillTarget: '/finance/cost-control',
        enabled: true,
      });
    }
  }, [hasPermission, registerTile, registerKPI, registerWorklist, registerQuickAction]);

  const visibleTiles = getVisibleTiles();

  // Categorize tiles by type
  const kpiTiles = visibleTiles.filter(t => t.type === 'kpi');
  const worklistTiles = visibleTiles.filter(t => t.type === 'worklist');
  const quickActionTiles = visibleTiles.filter(t => t.type === 'quick-action');
  const chartTiles = visibleTiles.filter(t => t.type === 'chart');

  return (
    <div className="p-4 lg:p-6 max-w-[1920px] mx-auto">
      {/* Project Summary Header */}
      {activeProject && <ProjectSummaryHeader />}

      {/* Dashboard Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {activeProject ? 'Workspace Dashboard' : 'Enterprise Workspace'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {activeSite ? `${activeSite.name} • ${activeSite.location ?? ''}` : 'Select a project and site to view dashboard'}
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
            <Clock size={12} />
            <span>Real-time</span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Empty state when no project selected */}
      {!activeProject && (
        <EmptyState
          icon={<Activity size={48} />}
          title="No Project Selected"
          description="Select a project from the header to view its dashboard, KPIs and worklists."
        />
      )}

      {/* KPI Row */}
      {kpiTiles.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Key Performance Indicators</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {kpiTiles.map(tile => (
              <KPITile key={tile.id} tile={tile} />
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      {quickActionTiles.length > 0 && (
        <section className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {quickActionTiles.map(tile => (
              <QuickActionTile key={tile.id} tile={tile} />
            ))}
          </div>
        </section>
      )}

      {/* Charts Row */}
      {chartTiles.length > 0 && (
        <section className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {chartTiles.map(tile => (
              <ChartTile key={tile.id} tile={tile} />
            ))}
          </div>
        </section>
      )}

      {/* Worklists + Activity Feed */}
      {(worklistTiles.length > 0 || true) && (
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Action Required & Activity</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              {worklistTiles.map(tile => (
                <WorklistTile key={tile.id} tile={tile} />
              ))}
            </div>
            <RecentActivityFeed />
          </div>
        </section>
      )}

      {/* No tiles visible */}
      {visibleTiles.length === 0 && activeProject && (
        <EmptyState
          icon={<Activity size={48} />}
          title="No Dashboard Content"
          description="No tiles are registered for your current role and permissions. Contact your administrator to configure your workspace."
        />
      )}
    </div>
  );
}
