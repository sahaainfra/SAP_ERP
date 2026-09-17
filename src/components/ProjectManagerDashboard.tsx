/**
 * Project Manager Dashboard - Part 6
 * 
 * Role-specific dashboard for Project Managers showing
 * project health, progress, costs, and key metrics.
 */

import { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Calendar, DollarSign, 
  Users, HardHat, AlertTriangle, CheckCircle
} from 'lucide-react';
import type { KpiDefinition } from '../types/realtime';
import KpiCardV2 from './KpiCardV2';
import Chart from './Chart';

// Mock KPI data for Project Manager Dashboard
const projectManagerKpis = [
  {
    kpiKey: 'project.health_score',
    value: 72,
    previousValue: 75,
    target: 80,
    variance: -3,
    variancePercent: -3.75,
    trend: 'down' as const,
    status: 'warning' as const,
    unit: '',
    asOf: '2026-02-10T12:00:00Z',
    isPartial: false,
    computeMs: 45,
    rowCount: 1,
    fromCache: false,
    cacheAgeSeconds: 0,
  },
  {
    kpiKey: 'project.progress',
    value: 68,
    previousValue: 65,
    target: 75,
    variance: -7,
    variancePercent: -9.33,
    trend: 'up' as const,
    status: 'warning' as const,
    unit: '%',
    asOf: '2026-02-10T12:00:00Z',
    isPartial: false,
    computeMs: 38,
    rowCount: 1,
    fromCache: false,
    cacheAgeSeconds: 0,
  },
  {
    kpiKey: 'project.cost_variance',
    value: -7000000,
    previousValue: -5000000,
    target: 0,
    variance: -2000000,
    variancePercent: -40,
    trend: 'down' as const,
    status: 'critical' as const,
    unit: 'INR',
    asOf: '2026-02-10T12:00:00Z',
    isPartial: false,
    computeMs: 52,
    rowCount: 1,
    fromCache: false,
    cacheAgeSeconds: 0,
  },
  {
    kpiKey: 'project.schedule_variance',
    value: -7,
    previousValue: -5,
    target: 0,
    variance: -2,
    variancePercent: -40,
    trend: 'down' as const,
    status: 'warning' as const,
    unit: 'days',
    asOf: '2026-02-10T12:00:00Z',
    isPartial: false,
    computeMs: 41,
    rowCount: 1,
    fromCache: false,
    cacheAgeSeconds: 0,
  },
];

// Mock definitions for KPIs
function createDefinition(kpiKey: string): KpiDefinition {
  const definitions: Record<string, Partial<KpiDefinition>> = {
    'project.health_score': {
      kpiName: 'Project Health Score',
      module: 'project',
      calculationType: 'AVG',
      valueType: 'COUNT',
      goodDirection: 'UP',
    },
    'project.progress': {
      kpiName: 'Project Progress',
      module: 'project',
      calculationType: 'AVG',
      valueType: 'COUNT',
      goodDirection: 'UP',
    },
    'project.cost_variance': {
      kpiName: 'Cost Variance',
      module: 'project',
      calculationType: 'VARIANCE',
      valueType: 'CURRENCY',
      goodDirection: 'DOWN',
    },
    'project.schedule_variance': {
      kpiName: 'Schedule Variance',
      module: 'project',
      calculationType: 'VARIANCE',
      valueType: 'DAYS',
      goodDirection: 'DOWN',
    },
  };

  const def = definitions[kpiKey] || {};
  return {
    id: Math.floor(Math.random() * 1000),
    kpiKey,
    kpiName: def.kpiName || kpiKey,
    module: def.module || 'project',
    calculationType: def.calculationType || 'SUM',
    valueType: def.valueType || 'COUNT',
    aggregationLevel: 'PROJECT',
    goodDirection: def.goodDirection || 'UP',
    thresholdType: 'PERCENT_OF_TARGET',
    refreshStrategy: 'EVENT',
    cacheTtlS: 300,
    requiredPermission: 'project.view',
    isActive: true,
  };
}

// Mock chart data
const progressChartData = [
  { label: 'Sep', value: 45, target: 50 },
  { label: 'Oct', value: 52, target: 58 },
  { label: 'Nov', value: 58, target: 65 },
  { label: 'Dec', value: 62, target: 70 },
  { label: 'Jan', value: 65, target: 73 },
  { label: 'Feb', value: 68, target: 75 },
];

const costChartData = [
  { label: 'Sep', value: 4.2, target: 4.0 },
  { label: 'Oct', value: 4.8, target: 4.6 },
  { label: 'Nov', value: 5.5, target: 5.2 },
  { label: 'Dec', value: 6.1, target: 5.8 },
  { label: 'Jan', value: 6.8, target: 6.4 },
  { label: 'Feb', value: 7.2, target: 7.0 },
];

export default function ProjectManagerDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--sapTextColor)' }}>
          Project Manager Dashboard
        </h1>
        <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
          Metro Line Extension • Updated just now
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {projectManagerKpis.map((kpi) => (
          <KpiCardV2
            key={kpi.kpiKey}
            value={kpi}
            definition={createDefinition(kpi.kpiKey)}
            variant="numeric"
          />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Progress Chart */}
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              Progress vs Plan
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: 'var(--sapAccentColor6)' }} />
                <span style={{ color: 'var(--sapContent_LabelColor)' }}>Actual</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: 'var(--sapAccentColor10)' }} />
                <span style={{ color: 'var(--sapContent_LabelColor)' }}>Planned</span>
              </div>
            </div>
          </div>
          <Chart
            type="line"
            data={[
              { name: 'Actual', data: progressChartData.map(d => ({ label: d.label, value: d.value })), color: 'var(--sapAccentColor6)' },
              { name: 'Planned', data: progressChartData.map(d => ({ label: d.label, value: d.target })), color: 'var(--sapAccentColor10)' },
            ]}
            height={250}
            showLegend={false}
            yAxisLabel="Progress %"
          />
        </div>

        {/* Cost Chart */}
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              Cost Performance (Cr)
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: 'var(--sapAccentColor6)' }} />
                <span style={{ color: 'var(--sapContent_LabelColor)' }}>Actual</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: 'var(--sapAccentColor10)' }} />
                <span style={{ color: 'var(--sapContent_LabelColor)' }}>Budget</span>
              </div>
            </div>
          </div>
          <Chart
            type="line"
            data={[
              { name: 'Actual', data: costChartData.map(d => ({ label: d.label, value: d.value })), color: 'var(--sapAccentColor6)' },
              { name: 'Budget', data: costChartData.map(d => ({ label: d.label, value: d.target })), color: 'var(--sapAccentColor10)' },
            ]}
            height={250}
            showLegend={false}
            yAxisLabel="Cost (Cr)"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Manpower */}
        <div className="sap-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: 'var(--sapAccentBackgroundColor3)' }}>
              <Users size={20} style={{ color: 'var(--sapAccentColor3)' }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              Manpower
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Deployed Today</span>
              <span className="text-base font-bold" style={{ color: 'var(--sapTextColor)' }}>245</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Planned</span>
              <span className="text-base font-bold" style={{ color: 'var(--sapTextColor)' }}>260</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Attendance</span>
              <span className="text-base font-bold" style={{ color: 'var(--sapPositiveColor)' }}>94%</span>
            </div>
          </div>
        </div>

        {/* Quality & Safety */}
        <div className="sap-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: 'var(--sapAccentBackgroundColor8)' }}>
              <CheckCircle size={20} style={{ color: 'var(--sapAccentColor8)' }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              Quality & Safety
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>WIR Pass Rate</span>
              <span className="text-base font-bold" style={{ color: 'var(--sapTextColor)' }}>92%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Open NCRs</span>
              <span className="text-base font-bold" style={{ color: 'var(--sapCriticalColor)' }}>12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Days Without LTI</span>
              <span className="text-base font-bold" style={{ color: 'var(--sapPositiveColor)' }}>145</span>
            </div>
          </div>
        </div>

        {/* Approvals */}
        <div className="sap-card p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg" style={{ background: 'var(--sapAccentBackgroundColor1)' }}>
              <AlertTriangle size={20} style={{ color: 'var(--sapAccentColor1)' }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              Pending Approvals
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>My Approvals</span>
              <span className="text-base font-bold" style={{ color: 'var(--sapCriticalColor)' }}>7</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Waiting on Others</span>
              <span className="text-base font-bold" style={{ color: 'var(--sapTextColor)' }}>12</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Overdue</span>
              <span className="text-base font-bold" style={{ color: 'var(--sapNegativeColor)' }}>3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="sap-card p-4">
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
          Action Items
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--sapList_Hover_Background)] transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--sapNegativeColor)' }} />
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                  Review 3 overdue purchase orders
                </div>
                <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Due: 2 days ago
                </div>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--sapErrorBackground)', color: 'var(--sapNegativeTextColor)' }}>
              Urgent
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--sapList_Hover_Background)] transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--sapCriticalColor)' }} />
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                  Approve 7 pending purchase requisitions
                </div>
                <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Due: Today
                </div>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--sapWarningBackground)', color: 'var(--sapCriticalTextColor)' }}>
              High
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--sapList_Hover_Background)] transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--sapInformativeColor)' }} />
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                  Review cost variance report for January
                </div>
                <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Due: Tomorrow
                </div>
              </div>
            </div>
            <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--sapInformationBackground)', color: 'var(--sapInformativeTextColor)' }}>
              Normal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
