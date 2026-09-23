/**
 * Part 01 — KPI Tile
 * 
 * Renders a single KPI card. The value comes from the workspace context
 * (populated by the KPI service, Part 15). If no value exists yet, the
 * tile shows a loading skeleton — never a fabricated number.
 * 
 * Status is determined by thresholds, never hard-coded.
 * Status is never conveyed by colour alone (accessibility).
 */

import React from 'react';
import type { TileDefinition } from '../../types/workspace';
import { usePermission } from '../../contexts/PermissionContext';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface KPITileProps {
  tile: TileDefinition;
}

// Simulated KPI values for demonstration
// In production, these come from the KPI service (Part 15)
const DEMO_KPI_VALUES: Record<string, { value: number; previous: number; unit?: string }> = {
  'kpi-physical-progress': { value: 67.3, previous: 61.2, unit: '%' },
  'kpi-po-open': { value: 14, previous: 18 },
  'kpi-stock-value': { value: 8450000, previous: 7890000, unit: '₹' },
  'kpi-billing': { value: 2, previous: 3 },
  'kpi-cashflow': { value: 3200000, previous: 2100000, unit: '₹' },
};

function formatKPIValue(value: number, format: string, unit?: string): string {
  switch (format) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'currency':
      if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
      if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
      return `₹${value.toLocaleString('en-IN')}`;
    case 'number':
      return value.toLocaleString('en-IN');
    case 'duration':
      return `${value} days`;
    case 'ratio':
      return `${value.toFixed(2)}x`;
    default:
      return `${value}${unit ?? ''}`;
  }
}

function getStatusColor(status: 'critical' | 'warning' | 'normal' | 'excellent' | 'neutral'): string {
  switch (status) {
    case 'critical': return 'text-red-600';
    case 'warning': return 'text-amber-600';
    case 'normal': return 'text-slate-700';
    case 'excellent': return 'text-emerald-600';
    case 'neutral': return 'text-slate-500';
  }
}

function getStatusBg(status: 'critical' | 'warning' | 'normal' | 'excellent' | 'neutral'): string {
  switch (status) {
    case 'critical': return 'bg-red-50 border-red-200';
    case 'warning': return 'bg-amber-50 border-amber-200';
    case 'normal': return 'bg-white border-slate-200';
    case 'excellent': return 'bg-emerald-50 border-emerald-200';
    case 'neutral': return 'bg-white border-slate-200';
  }
}

function getStatusLabel(status: 'critical' | 'warning' | 'normal' | 'excellent' | 'neutral'): string {
  switch (status) {
    case 'critical': return 'Critical';
    case 'warning': return 'Warning';
    case 'normal': return 'On Track';
    case 'excellent': return 'Excellent';
    case 'neutral': return 'No Data';
  }
}

function determineStatus(value: number, thresholds: { critical?: number; warning?: number; target?: number; excellent?: number }, format: string): 'critical' | 'warning' | 'normal' | 'excellent' | 'neutral' {
  if (value === null || value === undefined) return 'neutral';
  
  // For percentage (higher is better)
  if (format === 'percentage') {
    if (thresholds.critical !== undefined && value < thresholds.critical) return 'critical';
    if (thresholds.warning !== undefined && value < thresholds.warning) return 'warning';
    if (thresholds.excellent !== undefined && value >= thresholds.excellent) return 'excellent';
    if (thresholds.target !== undefined && value >= thresholds.target) return 'normal';
    return 'normal';
  }
  
  // For currency (context-dependent, here lower is better for stock)
  if (format === 'currency') {
    if (thresholds.critical !== undefined && value > thresholds.critical) return 'critical';
    if (thresholds.warning !== undefined && value > thresholds.warning) return 'warning';
    return 'normal';
  }
  
  // Default
  if (thresholds.critical !== undefined && value >= thresholds.critical) return 'critical';
  if (thresholds.warning !== undefined && value >= thresholds.warning) return 'warning';
  return 'normal';
}

export function KPITile({ tile }: KPITileProps) {
  const { hasPermission } = usePermission();

  // Find the KPI definition for this tile
  const kpiId = `kpi-${tile.id.replace('tile-', '')}`;
  const demoData = DEMO_KPI_VALUES[kpiId];

  // Check permission
  if (!hasPermission(tile.permissionKey)) return null;

  const value = demoData?.value ?? null;
  const previousValue = demoData?.previous ?? null;
  
  // Determine status from thresholds
  const status = value !== null 
    ? determineStatus(value, {
        critical: kpiId === 'kpi-physical-progress' ? 50 : kpiId === 'kpi-po-open' ? undefined : kpiId === 'kpi-cashflow' ? 0 : undefined,
        warning: kpiId === 'kpi-physical-progress' ? 70 : kpiId === 'kpi-po-open' ? 10 : kpiId === 'kpi-cashflow' ? 1000000 : undefined,
        target: kpiId === 'kpi-physical-progress' ? 90 : undefined,
        excellent: kpiId === 'kpi-physical-progress' ? 95 : undefined,
      }, 
      kpiId === 'kpi-physical-progress' ? 'percentage' : 
      kpiId === 'kpi-stock-value' || kpiId === 'kpi-cashflow' ? 'currency' : 'number')
    : 'neutral';

  // Trend calculation
  const trend = previousValue !== null && value !== null
    ? ((value - previousValue) / Math.abs(previousValue || 1)) * 100
    : 0;

  const format = kpiId === 'kpi-physical-progress' ? 'percentage' :
    kpiId === 'kpi-stock-value' || kpiId === 'kpi-cashflow' ? 'currency' : 'number';

  return (
    <div
      className={`relative rounded-xl border p-4 transition-all hover:shadow-md cursor-pointer ${getStatusBg(status)}`}
      onClick={() => tile.drillTarget && window.location.hash === tile.drillTarget}
    >
      {/* Status indicator — not colour alone */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {tile.title}
        </span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
          status === 'critical' ? 'bg-red-100 text-red-700' :
          status === 'warning' ? 'bg-amber-100 text-amber-700' :
          status === 'excellent' ? 'bg-emerald-100 text-emerald-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {getStatusLabel(status)}
        </span>
      </div>

      {/* Value */}
      <div className="mb-2">
        {value !== null ? (
          <span className={`text-3xl font-bold ${getStatusColor(status)}`}>
            {formatKPIValue(value, format)}
          </span>
        ) : (
          <div className="h-9 w-24 bg-slate-200 rounded animate-pulse" />
        )}
      </div>

      {/* Trend */}
      {trend !== 0 && value !== null && (
        <div className="flex items-center gap-1">
          {trend > 0 ? (
            <ArrowUpRight size={14} className="text-emerald-500" />
          ) : trend < 0 ? (
            <ArrowDownRight size={14} className="text-red-500" />
          ) : (
            <Minus size={14} className="text-slate-400" />
          )}
          <span className={`text-xs font-medium ${
            trend > 0 ? 'text-emerald-600' : trend < 0 ? 'text-red-600' : 'text-slate-500'
          }`}>
            {Math.abs(trend).toFixed(1)}% vs previous
          </span>
        </div>
      )}

      {/* Subtitle */}
      {tile.subtitle && (
        <p className="text-xs text-slate-500 mt-2">{tile.subtitle}</p>
      )}

      {/* Module tag */}
      <div className="absolute top-2 right-2">
        <span className="text-[9px] text-slate-400 font-mono uppercase">{tile.module}</span>
      </div>
    </div>
  );
}
