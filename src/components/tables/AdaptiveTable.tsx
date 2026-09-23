/**
 * Part 19 — Adaptive Table Component
 * 
 * Three-mode smart table that adapts to device and user preference:
 * 1. Table mode (M and up) — full grid with all columns
 * 2. Card mode (XS/S default) — each row becomes a card with primary/secondary/metric
 * 3. Compact list mode — for selection contexts
 * 
 * Key features:
 * - Totals never lost (sticky summary bar in card mode)
 * - All columns reachable via expand or object page
 * - Mode persists per table in user preferences
 * - Server-computed totals across full filtered set
 */

import React, { useState, useEffect } from 'react';
import { useBreakpoint } from '../../config/breakpoints';

export type TableMode = 'table' | 'card' | 'compact';

export interface CardConfig {
  primary: string; // Identity field
  secondary: string[]; // Up to 3 supporting fields
  metric?: {
    field: string;
    label?: string;
  };
  status?: string;
  actions?: string[]; // Up to 2 inline actions
  expand?: string[]; // Fields revealed on tap
}

export interface AdaptiveTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    label: string;
    width?: number;
    sortable?: boolean;
    render?: (value: any, row: T) => React.ReactNode;
  }>;
  cardConfig: CardConfig;
  totals?: Record<string, any>;
  mode?: TableMode;
  onModeChange?: (mode: TableMode) => void;
  onRowClick?: (row: T) => void;
  onAction?: (action: string, row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export function AdaptiveTable<T extends { id: string | number }>({
  data,
  columns,
  cardConfig,
  totals,
  mode: controlledMode,
  onModeChange,
  onRowClick,
  onAction,
  loading = false,
  emptyMessage = 'No data available',
}: AdaptiveTableProps<T>) {
  const { breakpoint, isPhone, isTablet } = useBreakpoint();
  
  // Determine default mode based on device
  const getDefaultMode = (): TableMode => {
    if (isPhone) return 'card';
    if (isTablet) return 'card';
    return 'table';
  };

  const [internalMode, setInternalMode] = useState<TableMode>(getDefaultMode());
  const mode = controlledMode ?? internalMode;
  const [expandedRows, setExpandedRows] = useState<Set<string | number>>(new Set());

  // Update default mode when device changes
  useEffect(() => {
    if (!controlledMode) {
      setInternalMode(getDefaultMode());
    }
  }, [isPhone, isTablet, controlledMode]);

  const handleModeChange = (newMode: TableMode) => {
    setInternalMode(newMode);
    onModeChange?.(newMode);
  };

  const toggleRowExpansion = (rowId: string | number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId);
    } else {
      newExpanded.add(rowId);
    }
    setExpandedRows(newExpanded);
  };

  const getCellValue = (row: T, key: keyof T): any => {
    return row[key];
  };

  const formatValue = (value: any, column?: typeof columns[0]): string => {
    if (value === null || value === undefined) return '—';
    if (column?.render) return '';
    if (typeof value === 'number') {
      return value.toLocaleString('en-IN');
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (value instanceof Date) {
      return value.toLocaleDateString('en-IN');
    }
    return String(value);
  };

  // Render table mode
  const renderTableMode = () => (
    <div className="adaptive-table table-mode">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{ width: col.width ? `${col.width}px` : 'auto' }}
                className={col.sortable ? 'sortable' : ''}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {columns.map((col) => (
                <td key={String(col.key)}>
                  {col.render
                    ? col.render(getCellValue(row, col.key), row)
                    : formatValue(getCellValue(row, col.key), col)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {totals && (
          <tfoot>
            <tr className="totals-row">
              <td className="totals-label">Total</td>
              {columns.slice(1).map((col) => (
                <td key={String(col.key)} className="totals-value">
                  {totals[col.key as string] !== undefined
                    ? formatValue(totals[col.key as string])
                    : ''}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );

  // Render card mode
  const renderCardMode = () => (
    <div className="adaptive-table card-mode">
      {/* Sticky totals bar */}
      {totals && (
        <div className="card-totals-bar">
          <span className="totals-label">Total:</span>
          {cardConfig.metric && totals[cardConfig.metric.field] !== undefined && (
            <span className="totals-value">
              {cardConfig.metric.label || cardConfig.metric.field}:{' '}
              {formatValue(totals[cardConfig.metric.field])}
            </span>
          )}
          <span className="row-count">{data.length} records</span>
        </div>
      )}

      {/* Cards */}
      <div className="cards-container">
        {data.map((row) => {
          const isExpanded = expandedRows.has(row.id);
          const primaryValue = getCellValue(row, cardConfig.primary as keyof T);
          const statusValue = cardConfig.status
            ? getCellValue(row, cardConfig.status as keyof T)
            : null;

          return (
            <div
              key={row.id}
              className={`card ${isExpanded ? 'expanded' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {/* Primary line */}
              <div className="card-primary">
                <span className="card-primary-text">
                  {formatValue(primaryValue)}
                </span>
                {statusValue && (
                  <span className={`card-status status-${String(statusValue).toLowerCase()}`}>
                    {formatValue(statusValue)}
                  </span>
                )}
              </div>

              {/* Secondary lines */}
              <div className="card-secondary">
                {cardConfig.secondary.map((field) => {
                  const value = getCellValue(row, field as keyof T);
                  const column = columns.find((c) => c.key === field);
                  return (
                    <div key={field} className="card-secondary-item">
                      <span className="secondary-label">{column?.label || field}:</span>
                      <span className="secondary-value">{formatValue(value)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Metric */}
              {cardConfig.metric && (
                <div className="card-metric">
                  <span className="metric-label">
                    {cardConfig.metric.label || cardConfig.metric.field}
                  </span>
                  <span className="metric-value">
                    {formatValue(getCellValue(row, cardConfig.metric.field as keyof T))}
                  </span>
                </div>
              )}

              {/* Inline actions */}
              {cardConfig.actions && cardConfig.actions.length > 0 && (
                <div className="card-actions">
                  {cardConfig.actions.slice(0, 2).map((action) => (
                    <button
                      key={action}
                      className="card-action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAction?.(action, row);
                      }}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}

              {/* Expand toggle */}
              {cardConfig.expand && cardConfig.expand.length > 0 && (
                <button
                  className="card-expand-toggle"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleRowExpansion(row.id);
                  }}
                >
                  {isExpanded ? '▲ Less' : '▼ More'}
                </button>
              )}

              {/* Expanded fields */}
              {isExpanded && cardConfig.expand && (
                <div className="card-expanded">
                  {cardConfig.expand.map((field) => {
                    const value = getCellValue(row, field as keyof T);
                    const column = columns.find((c) => c.key === field);
                    return (
                      <div key={field} className="expanded-field">
                        <span className="expanded-label">{column?.label || field}:</span>
                        <span className="expanded-value">{formatValue(value)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render compact list mode
  const renderCompactMode = () => (
    <div className="adaptive-table compact-mode">
      <div className="compact-list">
        {data.map((row) => {
          const primaryValue = getCellValue(row, cardConfig.primary as keyof T);
          const metricValue = cardConfig.metric
            ? getCellValue(row, cardConfig.metric.field as keyof T)
            : null;

          return (
            <div
              key={row.id}
              className="compact-row"
              onClick={() => onRowClick?.(row)}
            >
              <span className="compact-primary">{formatValue(primaryValue)}</span>
              {metricValue && (
                <span className="compact-metric">{formatValue(metricValue)}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  // Render loading state
  if (loading) {
    return (
      <div className="adaptive-table loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  // Render empty state
  if (data.length === 0) {
    return (
      <div className="adaptive-table empty">
        <div className="empty-state">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="adaptive-table-container">
      {/* Mode switcher */}
      <div className="mode-switcher">
        <button
          className={`mode-button ${mode === 'table' ? 'active' : ''}`}
          onClick={() => handleModeChange('table')}
          disabled={isPhone}
        >
          Table
        </button>
        <button
          className={`mode-button ${mode === 'card' ? 'active' : ''}`}
          onClick={() => handleModeChange('card')}
        >
          Cards
        </button>
        <button
          className={`mode-button ${mode === 'compact' ? 'active' : ''}`}
          onClick={() => handleModeChange('compact')}
        >
          List
        </button>
      </div>

      {/* Table content */}
      {mode === 'table' && renderTableMode()}
      {mode === 'card' && renderCardMode()}
      {mode === 'compact' && renderCompactMode()}
    </div>
  );
}

export default AdaptiveTable;
