/**
 * Chart Component - Part 5
 * 
 * Flexible chart component supporting multiple chart types.
 * Uses Recharts library with SAP Fiori design tokens.
 */

import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, ScatterChart, Scatter, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Treemap
} from 'recharts';
import type { ChartProps, ChartType, ChartSeries, ChartDataPoint } from '../types/components';

// SAP Legend colors from design tokens
const CHART_COLORS = [
  'var(--sapLegendColor1, #c35500)',
  'var(--sapLegendColor2, #d23a0a)',
  'var(--sapLegendColor3, #df1278)',
  'var(--sapLegendColor4, #840606)',
  'var(--sapLegendColor5, #cc00dc)',
  'var(--sapLegendColor6, #0057d2)',
  'var(--sapLegendColor7, #07838f)',
  'var(--sapLegendColor8, #188918)',
];

export default function Chart({
  type,
  data,
  title,
  xAxisLabel,
  yAxisLabel,
  showLegend = true,
  showGrid = true,
  interactive = true,
  height = 300,
  onPointClick
}: ChartProps) {
  // Normalize data to series format
  const series: ChartSeries[] = Array.isArray(data) && data.length > 0 && 'series' in data[0]
    ? data as ChartSeries[]
    : [{ name: 'Value', data: data as ChartDataPoint[] }];

  // Get all unique labels for X axis
  const allLabels = Array.from(new Set(series.flatMap(s => s.data.map(d => d.label))));

  // Transform data for Recharts
  const chartData = allLabels.map(label => {
    const point: any = { label };
    series.forEach(s => {
      const dataPoint = s.data.find(d => d.label === label);
      point[s.name] = dataPoint?.value || 0;
      if (dataPoint?.target !== undefined) {
        point[`${s.name}_target`] = dataPoint.target;
      }
    });
    return point;
  });

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--sapChart_LineColor_1, #e5e5e5)" />}
            <XAxis dataKey="label" stroke="var(--sapChart_LineColor_2, #999)" label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined} />
            <YAxis stroke="var(--sapChart_LineColor_2, #999)" label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--sapTile_Background, #fff)', border: '1px solid var(--sapGroup_ContentBorderColor, #e5e5e5)', borderRadius: 'var(--erp-radius-button, 4px)' }} />
            {showLegend && <Legend />}
            {series.map((s, i) => (
              <Line
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={s.color || CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={2}
                dot={interactive}
                activeDot={interactive ? { r: 6 } : undefined}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--sapChart_LineColor_1, #e5e5e5)" />}
            <XAxis dataKey="label" stroke="var(--sapChart_LineColor_2, #999)" />
            <YAxis stroke="var(--sapChart_LineColor_2, #999)" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--sapTile_Background, #fff)', border: '1px solid var(--sapGroup_ContentBorderColor, #e5e5e5)', borderRadius: 'var(--erp-radius-button, 4px)' }} />
            {showLegend && <Legend />}
            {series.map((s, i) => (
              <Area
                key={s.name}
                type="monotone"
                dataKey={s.name}
                stroke={s.color || CHART_COLORS[i % CHART_COLORS.length]}
                fill={s.color || CHART_COLORS[i % CHART_COLORS.length]}
                fillOpacity={0.3}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );

      case 'column':
      case 'bar':
        return (
          <BarChart data={chartData} layout={type === 'bar' ? 'vertical' : 'horizontal'}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--sapChart_LineColor_1, #e5e5e5)" />}
            <XAxis type={type === 'bar' ? 'number' : 'category'} dataKey={type === 'bar' ? undefined : 'label'} stroke="var(--sapChart_LineColor_2, #999)" />
            <YAxis type={type === 'bar' ? 'category' : 'number'} dataKey={type === 'bar' ? 'label' : undefined} stroke="var(--sapChart_LineColor_2, #999)" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--sapTile_Background, #fff)', border: '1px solid var(--sapGroup_ContentBorderColor, #e5e5e5)', borderRadius: 'var(--erp-radius-button, 4px)' }} />
            {showLegend && <Legend />}
            {series.map((s, i) => (
              <Bar
                key={s.name}
                dataKey={s.name}
                fill={s.color || CHART_COLORS[i % CHART_COLORS.length]}
                radius={[4, 4, 0, 0]}
                onClick={interactive && onPointClick ? onPointClick : undefined}
              />
            ))}
          </BarChart>
        );

      case 'donut':
        const pieData = (data as ChartDataPoint[]).map((d, i) => ({
          ...d,
          fill: CHART_COLORS[i % CHART_COLORS.length]
        }));
        return (
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              nameKey="label"
              onClick={interactive && onPointClick ? onPointClick : undefined}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: 'var(--sapTile_Background, #fff)', border: '1px solid var(--sapGroup_ContentBorderColor, #e5e5e5)', borderRadius: 'var(--erp-radius-button, 4px)' }} />
            {showLegend && <Legend />}
          </PieChart>
        );

      case 'combination':
        return (
          <ComposedChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--sapChart_LineColor_1, #e5e5e5)" />}
            <XAxis dataKey="label" stroke="var(--sapChart_LineColor_2, #999)" />
            <YAxis stroke="var(--sapChart_LineColor_2, #999)" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--sapTile_Background, #fff)', border: '1px solid var(--sapGroup_ContentBorderColor, #e5e5e5)', borderRadius: 'var(--erp-radius-button, 4px)' }} />
            {showLegend && <Legend />}
            {series.map((s, i) => {
              const color = s.color || CHART_COLORS[i % CHART_COLORS.length];
              if (s.type === 'line') {
                return (
                  <Line
                    key={s.name}
                    type="monotone"
                    dataKey={s.name}
                    stroke={color}
                    strokeWidth={2}
                  />
                );
              } else if (s.type === 'area') {
                return (
                  <Area
                    key={s.name}
                    type="monotone"
                    dataKey={s.name}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                );
              } else {
                return (
                  <Bar
                    key={s.name}
                    dataKey={s.name}
                    fill={color}
                    radius={[4, 4, 0, 0]}
                  />
                );
              }
            })}
          </ComposedChart>
        );

      case 'scatter':
        const scatterData = (data as ChartDataPoint[]).map(d => ({
          x: d.value,
          y: d.target || 0,
          label: d.label
        }));
        return (
          <ScatterChart>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="var(--sapChart_LineColor_1, #e5e5e5)" />}
            <XAxis type="number" dataKey="x" name={xAxisLabel || 'X'} stroke="var(--sapChart_LineColor_2, #999)" />
            <YAxis type="number" dataKey="y" name={yAxisLabel || 'Y'} stroke="var(--sapChart_LineColor_2, #999)" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--sapTile_Background, #fff)', border: '1px solid var(--sapGroup_ContentBorderColor, #e5e5e5)', borderRadius: 'var(--erp-radius-button, 4px)' }} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Data" data={scatterData} fill={CHART_COLORS[0]} onClick={interactive && onPointClick ? onPointClick : undefined} />
          </ScatterChart>
        );

      default:
        return <div>Chart type not supported</div>;
    }
  };

  return (
    <div className="sap-card p-4">
      {title && (
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--sapTile_TitleTextColor)' }}>
          {title}
        </h3>
      )}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
