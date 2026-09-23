/**
 * Part 22 — Health Score Gauge Component
 * 
 * Visual representation of project health with composite score,
 * band classification, component breakdown, and trend.
 */

import React from 'react';
import { HealthScore } from '../../platform/dashboard/role-dashboard-types';

interface HealthScoreGaugeProps {
  healthScore: HealthScore;
  onComponentClick?: (componentName: string) => void;
}

export const HealthScoreGauge: React.FC<HealthScoreGaugeProps> = ({ 
  healthScore, 
  onComponentClick 
}) => {
  const { compositeScore, band, components, trend } = healthScore;

  const getBandColor = (band: string): string => {
    switch (band) {
      case 'HEALTHY': return 'var(--sapPositiveColor, #107e3e)';
      case 'WATCH': return 'var(--sapCriticalColor, #e9730c)';
      case 'AT_RISK': return 'var(--sapNegativeColor, #bb0000)';
      case 'CRITICAL': return 'var(--sapNegativeColor, #bb0000)';
      default: return 'var(--sapNeutralColor, #6a6d70)';
    }
  };

  const getBandLabel = (band: string): string => {
    switch (band) {
      case 'HEALTHY': return 'Healthy';
      case 'WATCH': return 'Watch';
      case 'AT_RISK': return 'At Risk';
      case 'CRITICAL': return 'Critical';
      default: return band;
    }
  };

  // Calculate SVG arc for gauge
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (compositeScore / 100) * circumference;

  return (
    <div className="health-score-gauge">
      {/* Gauge Visualization */}
      <div className="gauge-container">
        <svg width="200" height="200" className="gauge-svg">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="var(--sapContent_ForegroundColor, #e5e5e5)"
            strokeWidth="12"
          />
          {/* Progress arc */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={getBandColor(band)}
            strokeWidth="12"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 100 100)"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          {/* Score text */}
          <text
            x="100"
            y="95"
            textAnchor="middle"
            className="gauge-score"
            style={{ fontSize: '32px', fontWeight: 'bold', fill: getBandColor(band) }}
          >
            {compositeScore}
          </text>
          <text
            x="100"
            y="120"
            textAnchor="middle"
            className="gauge-label"
            style={{ fontSize: '14px', fill: 'var(--sapContent_LabelColor, #6a6d70)' }}
          >
            Health Score
          </text>
        </svg>
      </div>

      {/* Band Classification */}
      <div className="band-classification">
        <span 
          className="band-badge"
          style={{ 
            backgroundColor: getBandColor(band),
            color: '#fff',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '600'
          }}
        >
          {getBandLabel(band)}
        </span>
      </div>

      {/* Component Breakdown */}
      <div className="component-breakdown">
        <h4 className="breakdown-title">Component Breakdown</h4>
        <div className="component-list">
          {components.map((component, index) => (
            <div 
              key={index} 
              className="component-item"
              onClick={() => onComponentClick?.(component.name)}
              style={{ cursor: onComponentClick ? 'pointer' : 'default' }}
            >
              <div className="component-header">
                <span className="component-name">{component.name}</span>
                <span className="component-score" style={{ color: getComponentColor(component.score) }}>
                  {component.score}
                </span>
              </div>
              <div className="component-bar">
                <div 
                  className="component-fill"
                  style={{ 
                    width: `${component.score}%`,
                    backgroundColor: getComponentColor(component.score)
                  }}
                />
              </div>
              <div className="component-meta">
                <span className="component-weight">Weight: {component.weight}%</span>
                <span className="component-basis">{component.basis}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trend Chart */}
      {trend && trend.length > 0 && (
        <div className="health-trend">
          <h4 className="trend-title">Health Trend (Last 6 Periods)</h4>
          <div className="trend-chart">
            <svg width="100%" height="80" className="trend-svg">
              {/* Trend line */}
              <polyline
                fill="none"
                stroke={getBandColor(band)}
                strokeWidth="2"
                points={trend.map((point, index) => {
                  const x = (index / (trend.length - 1)) * 100;
                  const y = 80 - (point.score / 100) * 80;
                  return `${x}%,${y}`;
                }).join(' ')}
              />
              {/* Data points */}
              {trend.map((point, index) => {
                const x = (index / (trend.length - 1)) * 100;
                const y = 80 - (point.score / 100) * 80;
                return (
                  <circle
                    key={index}
                    cx={`${x}%`}
                    cy={y}
                    r="3"
                    fill={getBandColor(band)}
                  />
                );
              })}
            </svg>
            <div className="trend-labels">
              {trend.map((point, index) => (
                <span key={index} className="trend-label">
                  {point.period}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getComponentColor(score: number): string {
  if (score >= 80) return 'var(--sapPositiveColor, #107e3e)';
  if (score >= 60) return 'var(--sapCriticalColor, #e9730c)';
  return 'var(--sapNegativeColor, #bb0000)';
}

export default HealthScoreGauge;
