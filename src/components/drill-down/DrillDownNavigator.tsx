/**
 * Part 22 — Drill-Down Navigator Component
 * 
 * Interactive drill-down navigation with breadcrumb trail.
 * Preserves filters through all levels and validates totals.
 */

import React, { useState, useEffect } from 'react';
import { DrillDownRequest, DrillDownResponse, DrillDownBreadcrumbItem } from '../../platform/dashboard/role-dashboard-types';
import { drillDownService } from '../../platform/dashboard/drill-down';
import { Actor } from '../../platform/permission/actor';

interface DrillDownNavigatorProps {
  kpiCode: string;
  actor: Actor;
  initialFilters?: Record<string, any>;
  onNavigate?: (route: string, filters: Record<string, any>) => void;
}

export const DrillDownNavigator: React.FC<DrillDownNavigatorProps> = ({
  kpiCode,
  actor,
  initialFilters = {},
  onNavigate,
}) => {
  const [currentLevel, setCurrentLevel] = useState(1);
  const [data, setData] = useState<DrillDownResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<DrillDownBreadcrumbItem[]>([]);
  const [totalsValid, setTotalsValid] = useState<boolean | null>(null);

  useEffect(() => {
    loadLevel(1, initialFilters);
  }, [kpiCode]);

  const loadLevel = async (level: number, filters: Record<string, any>) => {
    setLoading(true);
    setError(null);
    try {
      const request: DrillDownRequest = {
        kpiCode,
        level,
        filters,
        projectId: filters.projectId,
      };

      // In production, would call: GET /api/dx/v1/drill/{kpiCode}?level={level}&filters=...
      // For demo, simulate the response
      const response = await simulateDrillDown(request, actor);
      setData(response);
      setCurrentLevel(level);

      // Update breadcrumb
      const newBreadcrumb = response.breadcrumb;
      setBreadcrumb(newBreadcrumb);

      // Validate totals
      if (response.records.length > 0) {
        const validation = await drillDownService.validateDrillDownTotals(kpiCode, level, actor);
        setTotalsValid(validation.valid);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load drill-down data');
    } finally {
      setLoading(false);
    }
  };

  const handleDrillDown = (record: any, nextLevel: number) => {
    const newFilters = { ...data?.records[0], ...record };
    loadLevel(nextLevel, newFilters);
  };

  const handleBreadcrumbClick = (item: DrillDownBreadcrumbItem) => {
    loadLevel(item.level, item.filters);
  };

  const handleBack = () => {
    if (currentLevel > 1) {
      const previousBreadcrumb = breadcrumb[breadcrumb.length - 2];
      if (previousBreadcrumb) {
        loadLevel(previousBreadcrumb.level, previousBreadcrumb.filters);
      }
    }
  };

  if (loading) {
    return (
      <div className="drill-down-navigator loading">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="drill-down-navigator error">
        <div className="error-message">{error}</div>
        <button onClick={() => loadLevel(currentLevel, initialFilters)}>Retry</button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="drill-down-navigator empty">
        <div className="empty-message">No data available</div>
      </div>
    );
  }

  return (
    <div className="drill-down-navigator">
      {/* Breadcrumb */}
      <div className="drill-down-breadcrumb">
        <button
          className="breadcrumb-home"
          onClick={() => loadLevel(1, initialFilters)}
          disabled={currentLevel === 1}
        >
          🏠 Home
        </button>
        {breadcrumb.map((item, index) => (
          <React.Fragment key={index}>
            <span className="breadcrumb-separator">→</span>
            <button
              className="breadcrumb-item"
              onClick={() => handleBreadcrumbClick(item)}
              disabled={index === breadcrumb.length - 1}
            >
              {item.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Current Level Header */}
      <div className="drill-down-header">
        <h2>{data.label}</h2>
        <div className="drill-down-meta">
          <span className="record-count">{data.total} records</span>
          {totalsValid !== null && (
            <span className={`totals-validation ${totalsValid ? 'valid' : 'invalid'}`}>
              {totalsValid ? '✓ Totals match' : '✗ Totals mismatch'}
            </span>
          )}
        </div>
      </div>

      {/* Records Table */}
      <div className="drill-down-records">
        <table className="records-table">
          <thead>
            <tr>
              {Object.keys(data.records[0] || {}).map(key => (
                <th key={key}>{key}</th>
              ))}
              {data.canDrillFurther && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.records.map((record, index) => (
              <tr key={index}>
                {Object.entries(record).map(([key, value]) => (
                  <td key={key}>{formatDrillDownValue(value)}</td>
                ))}
                {data.canDrillFurther && (
                  <td>
                    <button
                      className="drill-down-button"
                      onClick={() => handleDrillDown(record, currentLevel + 1)}
                    >
                      Drill Down →
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Navigation Controls */}
      <div className="drill-down-controls">
        <button
          className="control-button"
          onClick={handleBack}
          disabled={currentLevel === 1}
        >
          ← Back
        </button>
        {onNavigate && data.records.length > 0 && (
          <button
            className="control-button primary"
            onClick={() => onNavigate(`/drill-down/${kpiCode}/level/${currentLevel}`, data.records[0])}
          >
            Open in Full View
          </button>
        )}
      </div>
    </div>
  );
};

// Helper function to format drill-down values
function formatDrillDownValue(value: any): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return value.toLocaleString('en-IN');
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return value.toLocaleDateString('en-GB');
  return String(value);
}

// Simulate drill-down response for demo
async function simulateDrillDown(
  request: DrillDownRequest,
  actor: Actor
): Promise<DrillDownResponse> {
  // In production, this would call the API
  // For demo, return mock data based on level
  
  const levels: Record<number, DrillDownResponse> = {
    1: {
      level: 1,
      label: 'Project List',
      records: [
        { projectId: 1, name: 'Metro Corridor IV', value: 500000000, progress: 65 },
        { projectId: 2, name: 'NH-48 Flyover', value: 300000000, progress: 45 },
        { projectId: 3, name: 'Industrial Park', value: 200000000, progress: 80 },
      ],
      total: 3,
      breadcrumb: [{ level: 1, label: 'Projects', filters: {} }],
      canDrillFurther: true,
    },
    2: {
      level: 2,
      label: 'Project Details',
      records: [
        { category: 'Contract', value: 500000000 },
        { category: 'Executed', value: 325000000 },
        { category: 'Billed', value: 280000000 },
        { category: 'Collected', value: 250000000 },
      ],
      total: 4,
      breadcrumb: [
        { level: 1, label: 'Projects', filters: {} },
        { level: 2, label: 'Metro Corridor IV', filters: { projectId: 1 } },
      ],
      canDrillFurther: true,
    },
    3: {
      level: 3,
      label: 'Cost Categories',
      records: [
        { costCode: 'CIVIL', value: 200000000, committed: 180000000 },
        { costCode: 'MEP', value: 100000000, committed: 90000000 },
        { costCode: 'FINISHING', value: 50000000, committed: 45000000 },
      ],
      total: 3,
      breadcrumb: [
        { level: 1, label: 'Projects', filters: {} },
        { level: 2, label: 'Metro Corridor IV', filters: { projectId: 1 } },
        { level: 3, label: 'Cost Breakdown', filters: { projectId: 1 } },
      ],
      canDrillFurther: true,
    },
    4: {
      level: 4,
      label: 'Transactions',
      records: [
        { poNumber: 'PO-2026-001', vendor: 'ABC Corp', value: 5000000, date: '2026-01-15' },
        { poNumber: 'PO-2026-002', vendor: 'XYZ Ltd', value: 3000000, date: '2026-01-20' },
        { poNumber: 'PO-2026-003', vendor: 'PQR Inc', value: 2000000, date: '2026-01-25' },
      ],
      total: 3,
      breadcrumb: [
        { level: 1, label: 'Projects', filters: {} },
        { level: 2, label: 'Metro Corridor IV', filters: { projectId: 1 } },
        { level: 3, label: 'Cost Breakdown', filters: { projectId: 1 } },
        { level: 4, label: 'CIVIL', filters: { projectId: 1, costCode: 'CIVIL' } },
      ],
      canDrillFurther: false,
    },
  };

  return levels[request.level] || levels[1];
}

export default DrillDownNavigator;
