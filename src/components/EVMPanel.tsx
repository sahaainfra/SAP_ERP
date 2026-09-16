/**
 * EVM Component - Part 8
 * 
 * Earned Value Management dashboard showing project performance metrics,
 * S-curve visualization, and WBS-level breakdown
 */

import { useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { EVMMetrics, EVMTimeSeries, WBSBreakdown } from '../types/analytics';
import { formatCurrency, formatPercent } from '../utils/formatting';
import { StatusChip } from './SupportingComponents';

interface EVMPanelProps {
  metrics: EVMMetrics;
  timeSeries: EVMTimeSeries[];
  wbsBreakdown: WBSBreakdown[];
}

export default function EVMPanel({ metrics, timeSeries, wbsBreakdown }: EVMPanelProps) {
  const [showForecast, setShowForecast] = useState(true);

  // Prepare chart data
  const chartData = timeSeries.map(point => ({
    period: point.period,
    PV: point.pv,
    EV: point.ev,
    AC: point.ac,
    Forecast: point.forecast
  }));

  // Determine status bands for indices
  const getIndexStatus = (value: number): 'good' | 'watch' | 'at_risk' | 'critical' => {
    if (value >= 1.0) return 'good';
    if (value >= 0.95) return 'watch';
    if (value >= 0.90) return 'at_risk';
    return 'critical';
  };

  const spiStatus = getIndexStatus(metrics.spi);
  const cpiStatus = getIndexStatus(metrics.cpi);

  if (!metrics.baselineAvailable) {
    return (
      <div className="sap-card p-8">
        <div className="flex flex-col items-center justify-center text-center">
          <AlertCircle size={48} className="mb-4" style={{ color: 'var(--sapCriticalColor)' }} />
          <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
            Baseline Not Set — EVM Unavailable
          </h3>
          <p className="text-sm mb-4" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Earned Value Management requires a baselined schedule and budget distribution.
          </p>
          <button
            className="px-4 py-2 rounded text-sm font-medium"
            style={{
              background: 'var(--sapButton_Emphasized_Background)',
              color: 'var(--sapButton_Emphasized_TextColor)'
            }}
          >
            Set Baseline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Earned Value Management
          </h2>
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {metrics.projectName} • As of {new Date(metrics.asOf).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--sapTextColor)' }}>
            <input
              type="checkbox"
              checked={showForecast}
              onChange={(e) => setShowForecast(e.target.checked)}
              className="rounded"
            />
            Show Forecast
          </label>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard
          label="SPI"
          value={metrics.spi}
          format="index"
          status={spiStatus}
          tooltip="Schedule Performance Index (EV / PV)"
        />
        <MetricCard
          label="CPI"
          value={metrics.cpi}
          format="index"
          status={cpiStatus}
          tooltip="Cost Performance Index (EV / AC)"
        />
        <MetricCard
          label="SV"
          value={metrics.sv}
          format="currency"
          status={metrics.sv >= 0 ? 'good' : 'critical'}
          tooltip="Schedule Variance (EV - PV)"
        />
        <MetricCard
          label="CV"
          value={metrics.cv}
          format="currency"
          status={metrics.cv >= 0 ? 'good' : 'critical'}
          tooltip="Cost Variance (EV - AC)"
        />
        <MetricCard
          label="EAC (CPI)"
          value={metrics.eacCPI}
          format="currency"
          status={metrics.eacCPI <= metrics.bac ? 'good' : 'critical'}
          tooltip="Estimate at Completion (BAC / CPI)"
        />
        <MetricCard
          label="TCPI"
          value={metrics.tcpi}
          format="index"
          status={metrics.tcpi <= 1.0 ? 'good' : metrics.tcpi <= 1.1 ? 'watch' : 'critical'}
          tooltip="To-Complete Performance Index"
        />
      </div>

      {/* S-Curve Chart */}
      <div className="sap-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
          S-Curve: PV, EV, AC Over Time
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--sapContent_GridColor)" />
            <XAxis 
              dataKey="period" 
              stroke="var(--sapContent_LabelColor)"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="var(--sapContent_LabelColor)"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatCurrency(value, { compact: true })}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'var(--sapGroup_ContentBackground)',
                border: '1px solid var(--sapContent_BorderColor)',
                borderRadius: '4px'
              }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="PV" 
              stroke="var(--sapChart_OrderedColor_1)"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Planned Value (PV)"
            />
            <Line 
              type="monotone" 
              dataKey="EV" 
              stroke="var(--sapChart_OrderedColor_2)"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Earned Value (EV)"
            />
            <Line 
              type="monotone" 
              dataKey="AC" 
              stroke="var(--sapChart_OrderedColor_3)"
              strokeWidth={2}
              dot={{ r: 4 }}
              name="Actual Cost (AC)"
            />
            {showForecast && (
              <Line 
                type="monotone" 
                dataKey="Forecast" 
                stroke="var(--sapChart_OrderedColor_4)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                name="Forecast (EAC)"
              />
            )}
            <ReferenceLine 
              y={metrics.bac} 
              stroke="var(--sapContent_HelpColor)"
              strokeDasharray="3 3"
              label={{ value: 'BAC', position: 'right', fill: 'var(--sapContent_HelpColor)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* EAC Comparison */}
      <div className="sap-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
          Estimate at Completion (EAC) — Two Methods
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
            <div className="flex items-start gap-3 mb-3">
              <Info size={20} style={{ color: 'var(--sapInformativeColor)' }} />
              <div>
                <h4 className="font-semibold mb-1" style={{ color: 'var(--sapTextColor)' }}>
                  Method 1: CPI-Based EAC
                </h4>
                <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Assumes future work will be performed at the same cost efficiency as past work
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--sapTextColor)' }}>
              {formatCurrency(metrics.eacCPI)}
            </div>
            <div className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Formula: BAC / CPI = {formatCurrency(metrics.bac)} / {metrics.cpi.toFixed(3)}
            </div>
            <div className="mt-2">
              <StatusChip 
                status={metrics.eacCPI <= metrics.bac ? 'On Track' : 'Over Budget'} 
                type={metrics.eacCPI <= metrics.bac ? 'success' : 'error'} 
              />
            </div>
          </div>

          <div className="p-4 rounded" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
            <div className="flex items-start gap-3 mb-3">
              <Info size={20} style={{ color: 'var(--sapInformativeColor)' }} />
              <div>
                <h4 className="font-semibold mb-1" style={{ color: 'var(--sapTextColor)' }}>
                  Method 2: Remaining at Budget Rate
                </h4>
                <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Assumes future work will be performed at the original budgeted rate
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold mb-2" style={{ color: 'var(--sapTextColor)' }}>
              {formatCurrency(metrics.eacRemaining)}
            </div>
            <div className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Formula: AC + (BAC - EV) = {formatCurrency(metrics.ac)} + ({formatCurrency(metrics.bac)} - {formatCurrency(metrics.ev)})
            </div>
            <div className="mt-2">
              <StatusChip 
                status={metrics.eacRemaining <= metrics.bac ? 'On Track' : 'Over Budget'} 
                type={metrics.eacRemaining <= metrics.bac ? 'success' : 'error'} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* WBS Breakdown */}
      <div className="sap-card p-6">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
          WBS-Level Performance Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--sapList_HeaderBackground)' }}>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  WBS Code
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  Work Package
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  PV
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  EV
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  AC
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  SV
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  CV
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  SPI
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  CPI
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {wbsBreakdown.map((wbs, index) => (
                <tr 
                  key={wbs.wbsCode}
                  style={{ 
                    background: index % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                    borderBottom: '1px solid var(--sapList_BorderColor)'
                  }}
                >
                  <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapList_TextColor)' }}>
                    {wbs.wbsCode}
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapList_TextColor)' }}>
                    {wbs.wbsName}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapList_TextColor)' }}>
                    {formatCurrency(wbs.pv, { compact: true })}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapList_TextColor)' }}>
                    {formatCurrency(wbs.ev, { compact: true })}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapList_TextColor)' }}>
                    {formatCurrency(wbs.ac, { compact: true })}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ 
                    color: wbs.sv >= 0 ? 'var(--sapPositiveTextColor)' : 'var(--sapNegativeTextColor)'
                  }}>
                    {formatCurrency(wbs.sv, { compact: true })}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ 
                    color: wbs.cv >= 0 ? 'var(--sapPositiveTextColor)' : 'var(--sapNegativeTextColor)'
                  }}>
                    {formatCurrency(wbs.cv, { compact: true })}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ 
                    color: getIndexStatus(wbs.spi) === 'good' ? 'var(--sapPositiveTextColor)' : 'var(--sapNegativeTextColor)'
                  }}>
                    {wbs.spi.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right" style={{ 
                    color: getIndexStatus(wbs.cpi) === 'good' ? 'var(--sapPositiveTextColor)' : 'var(--sapNegativeTextColor)'
                  }}>
                    {wbs.cpi.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <StatusChip 
                      status={wbs.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} 
                      type={
                        wbs.status === 'good' ? 'success' :
                        wbs.status === 'watch' ? 'info' :
                        wbs.status === 'at_risk' ? 'warning' : 'error'
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: number;
  format: 'index' | 'currency' | 'percent';
  status: 'good' | 'watch' | 'at_risk' | 'critical';
  tooltip: string;
}

function MetricCard({ label, value, format, status, tooltip }: MetricCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case 'good': return 'var(--sapPositiveColor)';
      case 'watch': return 'var(--sapCriticalColor)';
      case 'at_risk': return 'var(--sapCriticalColor)';
      case 'critical': return 'var(--sapNegativeColor)';
    }
  };

  const formatValue = () => {
    switch (format) {
      case 'index':
        return value.toFixed(3);
      case 'currency':
        return formatCurrency(value, { compact: true });
      case 'percent':
        return formatPercent(value);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'good':
        return <CheckCircle2 size={16} style={{ color: getStatusColor() }} />;
      case 'watch':
      case 'at_risk':
        return <AlertCircle size={16} style={{ color: getStatusColor() }} />;
      case 'critical':
        return <AlertCircle size={16} style={{ color: getStatusColor() }} />;
    }
  };

  return (
    <div 
      className="sap-card p-4 relative"
      title={tooltip}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
          {label}
        </div>
        {getStatusIcon()}
      </div>
      <div className="text-2xl font-bold mb-1" style={{ color: 'var(--sapTextColor)' }}>
        {formatValue()}
      </div>
      <div 
        className="text-xs font-medium"
        style={{ color: getStatusColor() }}
      >
        {status === 'good' && 'On Track'}
        {status === 'watch' && 'Watch'}
        {status === 'at_risk' && 'At Risk'}
        {status === 'critical' && 'Critical'}
      </div>
    </div>
  );
}
