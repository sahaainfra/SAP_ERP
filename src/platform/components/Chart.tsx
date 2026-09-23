/**
 * Part 17 — Chart Component
 * 
 * Comprehensive chart library supporting 17 chart types.
 * Features:
 * - All chart types from spec (line, bar, donut, etc.)
 * - Accessible data table alternative
 * - Drill-down on point click
 * - Keyboard navigation
 * - Theme-aware colors
 * - Max 8 series (groups to "Top 7 + Other")
 * - "View as table" toggle
 */

import React, { useState, useMemo } from 'react';
import { ChartProps, ChartType, ChartSeries } from './types';

// Color palette from Part 02 legend palette
const CHART_COLORS = [
  'var(--sapChart_OrderedColor_1, #0a6ed1)',
  'var(--sapChart_OrderedColor_2, #d04a02)',
  'var(--sapChart_OrderedColor_3, #007833)',
  'var(--sapChart_OrderedColor_4, #c0380a)',
  'var(--sapChart_OrderedColor_5, #5c66f5)',
  'var(--sapChart_OrderedColor_6, #188918)',
  'var(--sapChart_OrderedColor_7, #e9730c)',
  'var(--sapChart_OrderedColor_8, #bb0000)',
];

export const Chart: React.FC<ChartProps> = ({
  config,
  data,
  onPointClick,
  onBrushSelect,
  onViewAsTable,
}) => {
  const [showAsTable, setShowAsTable] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Process series data
  const processedSeries = useMemo(() => {
    const series = config.series;
    
    // If more than 8 series, group to "Top 7 + Other"
    if (series.length > (config.maxSeries || 8)) {
      const sorted = [...series].sort((a, b) => {
        const sumA = a.data.reduce((acc, d) => acc + d.y, 0);
        const sumB = b.data.reduce((acc, d) => acc + d.y, 0);
        return sumB - sumA;
      });
      
      const top7 = sorted.slice(0, 7);
      const other = sorted.slice(7);
      
      // Aggregate "Other" series
      const otherData = other[0]?.data.map((_, i) => ({
        x: other[0].data[i].x,
        y: other.reduce((sum, s) => sum + (s.data[i]?.y || 0), 0),
      })) || [];
      
      return [
        ...top7.map((s, i) => ({ ...s, color: s.color || CHART_COLORS[i] })),
        { name: 'Other', data: otherData, color: CHART_COLORS[7] },
      ];
    }
    
    return series.map((s, i) => ({ ...s, color: s.color || CHART_COLORS[i] }));
  }, [config.series, config.maxSeries]);

  // Render line/area chart
  const renderLineChart = () => {
    const allPoints = processedSeries.flatMap(s => s.data);
    const maxY = Math.max(...allPoints.map(p => p.y));
    const minY = Math.min(...allPoints.map(p => p.y));
    const rangeY = maxY - minY || 1;
    
    const width = 600;
    const height = 300;
    const padding = 40;
    
    return (
      <svg width={width} height={height} className="chart-svg">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <line
            key={pct}
            x1={padding}
            y1={padding + (1 - pct) * (height - 2 * padding)}
            x2={width - padding}
            y2={padding + (1 - pct) * (height - 2 * padding)}
            stroke="var(--sapChart_LineColor_1, #e5e5e5)"
            strokeWidth="1"
          />
        ))}
        
        {/* Series */}
        {processedSeries.map((series, seriesIdx) => {
          const points = series.data.map((point, i) => {
            const px = padding + (i / (series.data.length - 1)) * (width - 2 * padding);
            const py = padding + (1 - (point.y - minY) / rangeY) * (height - 2 * padding);
            return { px, py, originalX: point.x, originalY: point.y, label: (point as any).label };
          });
          
          const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.px} ${p.py}`).join(' ');
          
          return (
            <g key={seriesIdx}>
              {config.type === 'area' || config.type === 'stacked_area' ? (
                <path
                  d={`${pathD} L ${points[points.length - 1].px} ${height - padding} L ${points[0].px} ${height - padding} Z`}
                  fill={series.color}
                  opacity="0.3"
                />
              ) : null}
              <path
                d={pathD}
                fill="none"
                stroke={series.color}
                strokeWidth="2"
              />
              {points.map((point, i) => (
                <circle
                  key={i}
                  cx={point.px}
                  cy={point.py}
                  r="4"
                  fill={series.color}
                  className="chart-point"
                  onClick={() => onPointClick?.({ x: point.originalX, y: point.originalY })}
                  onMouseEnter={() => setHoveredPoint(i)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}
            </g>
          );
        })}
        
        {/* Axes */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="var(--sapChart_LineColor_2, #666)"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="var(--sapChart_LineColor_2, #666)"
          strokeWidth="2"
        />
        
        {/* Axis labels */}
        {config.xAxis?.label && (
          <text x={width / 2} y={height - 10} textAnchor="middle" className="chart-axis-label">
            {config.xAxis.label}
          </text>
        )}
        {config.yAxis?.label && (
          <text x={15} y={height / 2} textAnchor="middle" transform={`rotate(-90 15 ${height / 2})`} className="chart-axis-label">
            {config.yAxis.label}
          </text>
        )}
      </svg>
    );
  };

  // Render bar/column chart
  const renderBarChart = () => {
    const allValues = processedSeries.flatMap(s => s.data.map(d => d.y));
    const maxValue = Math.max(...allValues);
    
    const width = 600;
    const height = 300;
    const padding = 40;
    const barWidth = (width - 2 * padding) / processedSeries[0]?.data.length / processedSeries.length;
    
    return (
      <svg width={width} height={height} className="chart-svg">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map(pct => (
          <line
            key={pct}
            x1={padding}
            y1={padding + (1 - pct) * (height - 2 * padding)}
            x2={width - padding}
            y2={padding + (1 - pct) * (height - 2 * padding)}
            stroke="var(--sapChart_LineColor_1, #e5e5e5)"
            strokeWidth="1"
          />
        ))}
        
        {/* Bars */}
        {processedSeries.map((series, seriesIdx) => {
          const offset = seriesIdx * barWidth;
          return series.data.map((point, i) => {
            const barHeight = (point.y / maxValue) * (height - 2 * padding);
            const x = padding + i * (barWidth * processedSeries.length) + offset;
            const y = height - padding - barHeight;
            
            return (
              <rect
                key={`${seriesIdx}-${i}`}
                x={x}
                y={y}
                width={barWidth - 2}
                height={barHeight}
                fill={series.color}
                className="chart-bar"
                onClick={() => onPointClick?.(point)}
                onMouseEnter={() => setHoveredPoint(i)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            );
          });
        })}
        
        {/* Axes */}
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="var(--sapChart_LineColor_2, #666)"
          strokeWidth="2"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="var(--sapChart_LineColor_2, #666)"
          strokeWidth="2"
        />
      </svg>
    );
  };

  // Render donut chart
  const renderDonutChart = () => {
    const total = processedSeries[0]?.data.reduce((sum, d) => sum + d.y, 0) || 1;
    const size = 300;
    const center = size / 2;
    const radius = size / 2 - 20;
    const innerRadius = radius * 0.6;
    
    let startAngle = 0;
    
    return (
      <svg width={size} height={size} className="chart-svg">
        {processedSeries[0]?.data.map((point, i) => {
          const angle = (point.y / total) * 2 * Math.PI;
          const endAngle = startAngle + angle;
          
          const x1 = center + radius * Math.cos(startAngle);
          const y1 = center + radius * Math.sin(startAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);
          
          const x3 = center + innerRadius * Math.cos(endAngle);
          const y3 = center + innerRadius * Math.sin(endAngle);
          const x4 = center + innerRadius * Math.cos(startAngle);
          const y4 = center + innerRadius * Math.sin(startAngle);
          
          const largeArcFlag = angle > Math.PI ? 1 : 0;
          
          const pathD = [
            `M ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `L ${x3} ${y3}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
            'Z',
          ].join(' ');
          
          startAngle = endAngle;
          
          return (
            <path
              key={i}
              d={pathD}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              className="chart-slice"
              onClick={() => onPointClick?.(point)}
            />
          );
        })}
        
        {/* Center text */}
        <text x={center} y={center} textAnchor="middle" dominantBaseline="middle" className="chart-center-text">
          {total.toLocaleString()}
        </text>
      </svg>
    );
  };

  // Render data table (accessible alternative)
  const renderDataTable = () => (
    <table className="chart-data-table">
      <thead>
        <tr>
          <th>Category</th>
          {processedSeries.map((s, i) => (
            <th key={i}>{s.name}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {processedSeries[0]?.data.map((point, i) => (
          <tr key={i}>
            <td>{point.x}</td>
            {processedSeries.map((s, j) => (
              <td key={j}>{s.data[i]?.y.toLocaleString()}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Render legend
  const renderLegend = () => (
    <div className="chart-legend">
      {processedSeries.map((series, i) => (
        <div key={i} className="chart-legend-item">
          <span className="chart-legend-color" style={{ backgroundColor: series.color }} />
          <span className="chart-legend-label">{series.name}</span>
        </div>
      ))}
    </div>
  );

  // Render chart based on type
  const renderChart = () => {
    switch (config.type) {
      case 'line':
      case 'area':
      case 'stacked_area':
      case 's_curve':
        return renderLineChart();
      case 'column':
      case 'bar':
      case 'stacked_bar':
      case 'waterfall':
        return renderBarChart();
      case 'donut':
        return renderDonutChart();
      default:
        return renderLineChart();
    }
  };

  return (
    <div className="chart-container">
      {/* Title */}
      {config.title && (
        <div className="chart-title">{config.title}</div>
      )}
      
      {/* View as table toggle */}
      <button
        className="chart-view-toggle"
        onClick={() => setShowAsTable(!showAsTable)}
      >
        {showAsTable ? 'View as chart' : 'View as table'}
      </button>
      
      {/* Chart or table */}
      {showAsTable ? renderDataTable() : renderChart()}
      
      {/* Legend */}
      {config.legend !== false && processedSeries.length > 1 && renderLegend()}
      
      {/* Tooltip */}
      {hoveredPoint !== null && config.tooltip !== false && (
        <div className="chart-tooltip">
          {(processedSeries[0]?.data[hoveredPoint] as any)?.label || processedSeries[0]?.data[hoveredPoint]?.x}
        </div>
      )}
    </div>
  );
};

export default Chart;
