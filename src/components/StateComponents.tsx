/**
 * State Components
 * 
 * Empty, loading, and error states for the design system.
 * These are used throughout the application for consistent UX.
 */

import { AlertCircle, Inbox, Filter, Lock, Settings, RefreshCw } from 'lucide-react';

// ─── Loading States ──────────────────────────────────────────────────────────

/**
 * Skeleton loader for KPI cards
 */
export function KPICardSkeleton() {
  return (
    <div className="sap-card p-4 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-10 h-10 rounded-lg" style={{ background: 'var(--sapBaseColor)' }} />
        <div className="w-16 h-5 rounded" style={{ background: 'var(--sapBaseColor)' }} />
      </div>
      <div className="w-24 h-8 rounded mb-2" style={{ background: 'var(--sapBaseColor)' }} />
      <div className="w-32 h-4 rounded" style={{ background: 'var(--sapBaseColor)' }} />
    </div>
  );
}

/**
 * Skeleton loader for tables
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="sap-card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
        <div className="flex gap-4">
          <div className="w-32 h-4 rounded" style={{ background: 'var(--sapBaseColor)' }} />
          <div className="w-24 h-4 rounded" style={{ background: 'var(--sapBaseColor)' }} />
          <div className="w-20 h-4 rounded" style={{ background: 'var(--sapBaseColor)' }} />
          <div className="w-28 h-4 rounded" style={{ background: 'var(--sapBaseColor)' }} />
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="p-4 border-b last:border-0 animate-pulse" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <div className="flex gap-4">
            <div className="w-40 h-4 rounded" style={{ background: 'var(--sapBaseColor)' }} />
            <div className="w-20 h-4 rounded" style={{ background: 'var(--sapBaseColor)' }} />
            <div className="w-16 h-4 rounded" style={{ background: 'var(--sapBaseColor)' }} />
            <div className="w-24 h-4 rounded" style={{ background: 'var(--sapBaseColor)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton loader for charts
 */
export function ChartSkeleton() {
  return (
    <div className="sap-card p-5 animate-pulse">
      <div className="w-48 h-5 rounded mb-4" style={{ background: 'var(--sapBaseColor)' }} />
      <div className="h-64 rounded" style={{ background: 'var(--sapBaseColor)' }} />
    </div>
  );
}

// ─── Empty States ────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Empty state - no data yet
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--sapNeutralBackground)' }}>
        {icon || <Inbox size={28} style={{ color: 'var(--sapNeutralColor)' }} />}
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--sapTextColor)' }}>
        {title}
      </h3>
      {description && (
        <p className="text-sm text-center max-w-md mb-4" style={{ color: 'var(--sapContent_LabelColor)' }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: 'var(--sapButton_Emphasized_Background)',
            color: 'var(--sapButton_Emphasized_TextColor)',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Empty state - filtered to nothing
 */
export function EmptyFilteredState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--sapNeutralBackground)' }}>
        <Filter size={28} style={{ color: 'var(--sapNeutralColor)' }} />
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--sapTextColor)' }}>
        No records match the selected filters
      </h3>
      <p className="text-sm text-center max-w-md mb-4" style={{ color: 'var(--sapContent_LabelColor)' }}>
        Try adjusting your filter criteria to see more results.
      </p>
      <button
        onClick={onClearFilters}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        style={{
          background: 'var(--sapButton_Background)',
          color: 'var(--sapButton_TextColor)',
          border: '1px solid var(--sapButton_BorderColor)',
        }}
      >
        Clear filters
      </button>
    </div>
  );
}

/**
 * Empty state - no permission
 */
export function EmptyNoPermissionState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--sapNeutralBackground)' }}>
        <Lock size={28} style={{ color: 'var(--sapNeutralColor)' }} />
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--sapTextColor)' }}>
        You do not have access to this information
      </h3>
      <p className="text-sm text-center max-w-md" style={{ color: 'var(--sapContent_LabelColor)' }}>
        Contact your administrator if you believe you should have access.
      </p>
    </div>
  );
}

/**
 * Empty state - module not configured
 */
export function EmptyNotConfiguredState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'var(--sapNeutralBackground)' }}>
        <Settings size={28} style={{ color: 'var(--sapNeutralColor)' }} />
      </div>
      <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--sapTextColor)' }}>
        This module is not configured in your system
      </h3>
      <p className="text-sm text-center max-w-md" style={{ color: 'var(--sapContent_LabelColor)' }}>
        Please contact your system administrator to enable this module.
      </p>
    </div>
  );
}

// ─── Error States ────────────────────────────────────────────────────────────

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

/**
 * Error state - recoverable error
 */
export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div
      className="rounded-lg p-4 border-l-4"
      style={{
        background: 'var(--sapErrorBackground)',
        borderColor: 'var(--sapErrorBorderColor)',
      }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={20} style={{ color: 'var(--sapNegativeTextColor)' }} />
        <div className="flex-1">
          <h4 className="text-sm font-semibold mb-1" style={{ color: 'var(--sapNegativeTextColor)' }}>
            {title}
          </h4>
          {message && (
            <p className="text-sm mb-3" style={{ color: 'var(--sapTextColor)' }}>
              {message}
            </p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              style={{
                background: 'var(--sapButton_Background)',
                color: 'var(--sapButton_TextColor)',
                border: '1px solid var(--sapButton_BorderColor)',
              }}
            >
              <RefreshCw size={14} />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Widget error - inline error for failed widgets
 */
export function WidgetError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div
      className="rounded-lg p-4 border"
      style={{
        background: 'var(--sapErrorBackground)',
        borderColor: 'var(--sapErrorBorderColor)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle size={16} style={{ color: 'var(--sapNegativeTextColor)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--sapNegativeTextColor)' }}>
          Widget failed to load
        </span>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors"
          style={{
            background: 'var(--sapButton_Background)',
            color: 'var(--sapButton_TextColor)',
            border: '1px solid var(--sapButton_BorderColor)',
          }}
        >
          <RefreshCw size={12} />
          Retry
        </button>
      )}
    </div>
  );
}
