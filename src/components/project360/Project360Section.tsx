/**
 * Part 22 — Project 360 Section Component
 * 
 * Collapsible section displaying KPIs and charts for each Project 360 area.
 */

import React from 'react';
import { Project360Section } from '../../platform/dashboard/role-dashboard-types';

interface Project360SectionProps {
  section: Project360Section;
  isExpanded: boolean;
  onToggle: () => void;
  projectId: number;
}

export const Project360SectionComponent: React.FC<Project360SectionProps> = ({
  section,
  isExpanded,
  onToggle,
  projectId,
}) => {
  const getSectionIcon = (type: string): string => {
    const icons: Record<string, string> = {
      contract: '📄',
      execution: '🏗️',
      procurement: '🛒',
      material: '📦',
      manpower: '👷',
      plant: '🚜',
      quality: '✓',
      hse: '⛑️',
      commercial: '💰',
      finance: '📊',
    };
    return icons[type] || '📋';
  };

  const getStatusColor = (status?: string): string => {
    switch (status) {
      case 'good': return 'var(--sapPositiveColor, #107e3e)';
      case 'warning': return 'var(--sapCriticalColor, #e9730c)';
      case 'critical': return 'var(--sapNegativeColor, #bb0000)';
      default: return 'var(--sapNeutralColor, #6a6d70)';
    }
  };

  const formatValue = (value: any, unit?: string): string => {
    if (value === null || value === undefined) return '—';
    
    if (unit === '%') return `${value}%`;
    if (unit === 'days') return `${value} days`;
    if (typeof value === 'number') {
      if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
      if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
      return value.toLocaleString('en-IN');
    }
    return String(value);
  };

  return (
    <div className={`project-360-section ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Section Header */}
      <div className="section-header" onClick={onToggle}>
        <div className="section-title">
          <span className="section-icon">{getSectionIcon(section.type)}</span>
          <h3>{section.label}</h3>
        </div>
        <button className="section-toggle">
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* Section Content */}
      {isExpanded && (
        <div className="section-content">
          {/* KPIs Grid */}
          <div className="kpis-grid">
            {section.kpis.map((kpi, index) => (
              <div key={index} className="kpi-card">
                <div className="kpi-label">{kpi.label}</div>
                <div 
                  className="kpi-value"
                  style={{ color: kpi.status ? getStatusColor(kpi.status) : undefined }}
                >
                  {formatValue(kpi.value, kpi.unit)}
                  {kpi.trend && (
                    <span className={`kpi-trend trend-${kpi.trend}`}>
                      {kpi.trend === 'up' ? '▲' : kpi.trend === 'down' ? '▼' : '→'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          {section.charts && section.charts.length > 0 && (
            <div className="charts-container">
              {section.charts.map((chart, index) => (
                <div key={index} className="chart-wrapper">
                  <h4 className="chart-title">{chart.title}</h4>
                  <div className="chart-placeholder">
                    {/* In production, would render actual chart using Part 17 Chart component */}
                    <div className="chart-type-badge">{chart.type}</div>
                    <div className="chart-kpi-code">{chart.kpiCode}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Drill-down Link */}
          <div className="section-drilldown">
            <a 
              href={`/projects/${projectId}/${section.type}`}
              className="drilldown-link"
            >
              View Details →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Project360SectionComponent;
