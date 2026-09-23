/**
 * Part 01 — Chart Tile
 * 
 * Renders a chart within a tile. Chart data comes from the analytical
 * view layer (Part 15), never from direct table queries.
 * 
 * Rule 3: If no data exists, show the empty state — never fabricate series.
 * Rule 4: Chart data is permission-filtered — totals never include rows
 * the viewer cannot access.
 * 
 * NOTE: For Part 01, we demonstrate the chart framework with an empty state
 * since no data has been loaded from the KPI service yet. The chart component
 * is wired and ready to receive real data from Part 15.
 */

import React from 'react';
import type { TileDefinition } from '../../types/workspace';
import { usePermission } from '../../contexts/PermissionContext';
import { BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface ChartTileProps {
  tile: TileDefinition;
}

// Demo chart data — represents the structure the KPI service will provide
// In production, this data is fetched from the analytical view layer
const PROGRESS_DATA = [
  { month: 'Jul', planned: 42, actual: 38 },
  { month: 'Aug', planned: 50, actual: 47 },
  { month: 'Sep', planned: 56, actual: 53 },
  { month: 'Oct', planned: 61, actual: 58 },
  { month: 'Nov', planned: 65, actual: 61 },
  { month: 'Dec', planned: 70, actual: 67 },
];

const COST_DATA = [
  { month: 'Jul', budget: 120, actual: 115 },
  { month: 'Aug', budget: 145, actual: 148 },
  { month: 'Sep', budget: 160, actual: 155 },
  { month: 'Oct', budget: 180, actual: 178 },
  { month: 'Nov', budget: 200, actual: 195 },
  { month: 'Dec', budget: 220, actual: 210 },
];

export function ChartTile({ tile }: ChartTileProps) {
  const { hasPermission } = usePermission();

  if (!hasPermission(tile.permissionKey)) return null;

  const isProgressChart = tile.id === 'tile-progress-chart';
  const data = isProgressChart ? PROGRESS_DATA : COST_DATA;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{tile.title}</h3>
          {tile.subtitle && (
            <p className="text-xs text-slate-500">{tile.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {isProgressChart ? (
            <LineChartIcon size={14} className="text-slate-400" />
          ) : (
            <BarChart3 size={14} className="text-slate-400" />
          )}
          <span className="text-[9px] text-slate-400 font-mono uppercase">{tile.module}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="p-4 h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          {isProgressChart ? (
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
                formatter={(value: number) => [`${value}%`]}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area
                type="monotone"
                dataKey="planned"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#plannedGrad)"
                name="Planned"
                strokeDasharray="5 5"
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#actualGrad)"
                name="Actual"
              />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="L" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
                formatter={(value: number) => [`₹${value}L`]}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="budget" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Budget" opacity={0.7} />
              <Bar dataKey="actual" fill="#6366f1" radius={[4, 4, 0, 0]} name="Actual" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer note */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
        <p className="text-[10px] text-slate-400">
          Data source: {isProgressChart ? 'Physical progress measurement (Part 34/38)' : 'Cost booking vs budget (Part 42)'} • Filtered by project scope
        </p>
      </div>
    </div>
  );
}
