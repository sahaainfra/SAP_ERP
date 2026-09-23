/**
 * Part 03 — Design System Showcase
 * 
 * Demonstrates all design tokens, themes, and components.
 * Accessible at /dev/design-system route.
 */

import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { EmptyState } from './EmptyState';
import { Skeleton, SkeletonKPICard, SkeletonTable, SkeletonList } from './Skeleton';
import { WidgetErrorBoundary } from './WidgetErrorBoundary';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatting';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

export function DesignSystemShowcase() {
  const { theme, setTheme, density, setDensity, availableThemes, availableDensities } = useTheme();

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--sapTitleColor)' }}>
          Design System Showcase
        </h1>
        <p style={{ color: 'var(--sapTextColor)' }}>
          Part 03 — SAP Horizon-aligned design tokens, themes, and components
        </p>
      </div>

      {/* Theme Switcher */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--sapTitleColor)' }}>
          Themes
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {availableThemes.map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="p-4 rounded-lg border-2 transition-all"
              style={{
                backgroundColor: 'var(--sapTile_Background)',
                borderColor: theme === t ? 'var(--sapButton_Emphasized_BorderColor)' : 'var(--sapTile_BorderColor)',
              }}
            >
              <div className="flex items-center justify-between mb-2">
                {t === 'morning-horizon' && <Sun size={20} style={{ color: 'var(--sapContent_IconColor)' }} />}
                {t === 'evening-horizon' && <Moon size={20} style={{ color: 'var(--sapContent_IconColor)' }} />}
                {(t === 'hc-black' || t === 'hc-white') && (
                  <Monitor size={20} style={{ color: 'var(--sapContent_IconColor)' }} />
                )}
                {theme === t && <Check size={16} style={{ color: 'var(--sapPositiveColor)' }} />}
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                {t.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Density Switcher */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--sapTitleColor)' }}>
          Density
        </h2>
        <div className="flex gap-3">
          {availableDensities.map((d) => (
            <button
              key={d}
              onClick={() => setDensity(d)}
              className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: density === d ? 'var(--sapButton_Emphasized_Background)' : 'var(--sapButton_Background)',
                color: density === d ? 'var(--sapButton_Emphasized_TextColor)' : 'var(--sapButton_TextColor)',
                border: `1px solid ${density === d ? 'var(--sapButton_Emphasized_BorderColor)' : 'var(--sapButton_BorderColor)'}`,
              }}
            >
              {d.charAt(0).toUpperCase() + d.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Status Colors */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--sapTitleColor)' }}>
          Status Colors
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {['draft', 'submitted', 'approved', 'rejected', 'pending-approval', 'completed'].map((status) => (
            <div
              key={status}
              className="p-3 rounded-lg text-center"
              style={{
                backgroundColor: `var(--erp-status-${status}-bg)`,
                border: `1px solid var(--erp-status-${status}-border)`,
              }}
            >
              <div className="text-xs font-medium" style={{ color: `var(--erp-status-${status}-fg)` }}>
                {status.replace('-', ' ').toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KPI Health */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--sapTitleColor)' }}>
          KPI Health Indicators
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {['excellent', 'good', 'warning', 'critical', 'neutral'].map((health) => (
            <div
              key={health}
              className="p-4 rounded-lg text-center"
              style={{
                backgroundColor: `var(--erp-kpi-${health}-bg)`,
              }}
            >
              <div className="text-2xl font-bold mb-1" style={{ color: `var(--erp-kpi-${health})` }}>
                {health === 'excellent' && '95%'}
                {health === 'good' && '87%'}
                {health === 'warning' && '72%'}
                {health === 'critical' && '45%'}
                {health === 'neutral' && '—'}
              </div>
              <div className="text-xs font-medium capitalize" style={{ color: `var(--erp-kpi-${health})` }}>
                {health}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Formatting Examples */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--sapTitleColor)' }}>
          Formatting Utilities
        </h2>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 space-y-3" style={{ backgroundColor: 'var(--sapTile_Background)' }}>
          <div className="flex justify-between">
            <span style={{ color: 'var(--sapTextColor)' }}>Currency (Full):</span>
            <span className="font-mono" style={{ color: 'var(--sapTextColor)' }}>
              {formatCurrency(12345678.9)}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--sapTextColor)' }}>Currency (Compact):</span>
            <span className="font-mono" style={{ color: 'var(--sapTextColor)' }}>
              {formatCurrency(12345678.9, { compact: 'compact' })}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--sapTextColor)' }}>Percentage:</span>
            <span className="font-mono" style={{ color: 'var(--sapTextColor)' }}>
              {formatPercentage(87.4)}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--sapTextColor)' }}>Date:</span>
            <span className="font-mono" style={{ color: 'var(--sapTextColor)' }}>
              {formatDate('2026-09-15')}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: 'var(--sapTextColor)' }}>Null value:</span>
            <span className="font-mono" style={{ color: 'var(--sapTextColor)' }}>
              {formatCurrency(null)}
            </span>
          </div>
        </div>
      </section>

      {/* Empty States */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--sapTitleColor)' }}>
          Empty States
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <EmptyState type="no-data" title="No purchase orders" description="Create your first purchase order to get started." />
          <EmptyState type="filtered" title="No records match" description="Try adjusting your filters." onClearFilters={() => {}} />
          <EmptyState type="no-permission" title="Access restricted" description="You do not have permission to view this information." />
          <EmptyState type="not-configured" title="Module not configured" description="Contact your administrator." />
        </div>
      </section>

      {/* Skeleton Loaders */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--sapTitleColor)' }}>
          Skeleton Loaders
        </h2>
        <div className="space-y-4">
          <SkeletonKPICard count={4} />
          <SkeletonTable rows={3} columns={4} />
          <SkeletonList items={3} />
        </div>
      </section>

      {/* Error Boundary */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--sapTitleColor)' }}>
          Widget Error Boundary
        </h2>
        <WidgetErrorBoundary>
          <div
            className="p-4 rounded-lg"
            style={{
              backgroundColor: 'var(--sapTile_Background)',
              border: '1px solid var(--sapTile_BorderColor)',
            }}
          >
            <p style={{ color: 'var(--sapTextColor)' }}>
              This widget is working correctly. The error boundary will catch any errors and display a retry button.
            </p>
          </div>
        </WidgetErrorBoundary>
      </section>
    </div>
  );
}
