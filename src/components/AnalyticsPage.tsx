import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ComposedChart
} from 'recharts';
import {
  TrendingUp, TrendingDown, Target, Activity,
  AlertTriangle, CheckCircle2, Clock, DollarSign
} from 'lucide-react';
import { evmData, monthlyProgress, budgetBreakdown, projects } from '../data/mockData';

export default function AnalyticsPage() {
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const avgProgress = Math.round(projects.reduce((s, p) => s + p.progress, 0) / projects.length);
  const spi = 0.96;
  const cpi = 0.94;
  const eac = totalBudget * 1.07;
  const etc = eac - totalSpent;
  const tcpi = totalBudget / eac;
  const vac = totalBudget - eac;

  const radarData = [
    { metric: 'Schedule', value: 78, fullMark: 100 },
    { metric: 'Cost', value: 85, fullMark: 100 },
    { metric: 'Quality', value: 92, fullMark: 100 },
    { metric: 'Safety', value: 95, fullMark: 100 },
    { metric: 'Resources', value: 86, fullMark: 100 },
    { metric: 'Risk', value: 68, fullMark: 100 },
  ];

  const forecastData = [
    { month: 'Mar', actual: 55, forecast: 55 },
    { month: 'Apr', actual: 60, forecast: 60 },
    { month: 'May', actual: 65, forecast: 65 },
    { month: 'Jun', actual: 69, forecast: 69 },
    { month: 'Jul', forecast: 74 },
    { month: 'Aug', forecast: 79 },
    { month: 'Sep', forecast: 84 },
    { month: 'Oct', forecast: 88 },
    { month: 'Nov', forecast: 92 },
    { month: 'Dec', forecast: 95 },
  ];

  return (
    <div className="space-y-5 animate-slide-in">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--sapFontColor)' }}>Analytics & EVM</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
          Earned Value Management, forecasting, and performance analytics
        </p>
      </div>

      {/* EVM Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <EVMCard label="BAC" value={`$${(totalBudget / 1000000).toFixed(0)}M`} sublabel="Budget at Completion" icon={<Target size={14} />} />
        <EVMCard label="EV" value={`$${(totalSpent * 0.96 / 1000000).toFixed(0)}M`} sublabel="Earned Value" icon={<TrendingUp size={14} />} color="green" />
        <EVMCard label="PV" value={`$${(totalSpent / 1000000).toFixed(0)}M`} sublabel="Planned Value" icon={<Clock size={14} />} color="blue" />
        <EVMCard label="AC" value={`$${(totalSpent * 1.04 / 1000000).toFixed(0)}M`} sublabel="Actual Cost" icon={<DollarSign size={14} />} color="orange" />
        <EVMCard label="SPI" value={spi.toFixed(2)} sublabel="Schedule Perf. Index" icon={<Activity size={14} />} color={spi < 1 ? 'orange' : 'green'} />
        <EVMCard label="CPI" value={cpi.toFixed(2)} sublabel="Cost Perf. Index" icon={<TrendingDown size={14} />} color={cpi < 1 ? 'red' : 'green'} />
      </div>

      {/* EVM Chart */}
      <div className="sap-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>
              Earned Value Analysis — Cumulative
            </h3>
            <p className="text-xs mt-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
              PV, EV, and AC curves with variance indicators
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-blue-500 rounded" />
              <span style={{ color: 'var(--sapContentLabelColor)' }}>PV</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-green-500 rounded" />
              <span style={{ color: 'var(--sapContentLabelColor)' }}>EV</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-orange-500 rounded" />
              <span style={{ color: 'var(--sapContentLabelColor)' }}>AC</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={evmData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--sapBaseColor)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--sapContentLabelColor)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--sapContentLabelColor)' }} unit="M" />
            <Tooltip
              contentStyle={{
                background: 'var(--sapGroupContentBG)',
                border: '1px solid var(--sapBaseColor)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value: number) => [`$${value}M`]}
            />
            <Bar dataKey="pv" fill="#0070f2" fillOpacity={0.2} name="Planned Value" />
            <Line type="monotone" dataKey="ev" stroke="#107e3e" strokeWidth={2.5} dot={{ r: 4, fill: '#107e3e' }} name="Earned Value" />
            <Line type="monotone" dataKey="ac" stroke="#e9730c" strokeWidth={2.5} dot={{ r: 4, fill: '#e9730c' }} name="Actual Cost" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Forecast and Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Forecast */}
        <div className="sap-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>
                Completion Forecast
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
                Based on current CPI/SPI trends
              </p>
            </div>
            <div className="sap-badge sap-badge-critical">
              <AlertTriangle size={12} className="mr-1" />
              Behind Schedule
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0070f2" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0070f2" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--sapBaseColor)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--sapContentLabelColor)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--sapContentLabelColor)' }} unit="%" />
              <Tooltip
                contentStyle={{
                  background: 'var(--sapGroupContentBG)',
                  border: '1px solid var(--sapBaseColor)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Area type="monotone" dataKey="actual" stroke="#0070f2" fill="url(#forecastGrad)" strokeWidth={2} name="Actual" />
              <Line type="monotone" dataKey="forecast" stroke="#e9730c" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Forecast" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t" style={{ borderColor: 'var(--sapBaseColor)' }}>
            <div className="text-center">
              <div className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>EAC</div>
              <div className="text-sm font-bold" style={{ color: 'var(--sapFontColor)' }}>${(eac / 1000000).toFixed(0)}M</div>
            </div>
            <div className="text-center">
              <div className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>ETC</div>
              <div className="text-sm font-bold" style={{ color: 'var(--sapFontColor)' }}>${(etc / 1000000).toFixed(0)}M</div>
            </div>
            <div className="text-center">
              <div className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>VAC</div>
              <div className="text-sm font-bold text-red-500">${(vac / 1000000).toFixed(0)}M</div>
            </div>
          </div>
        </div>

        {/* Performance Radar */}
        <div className="sap-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>
                Performance Radar
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
                Multi-dimensional project health assessment
              </p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--sapBaseColor)" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: 'var(--sapContentLabelColor)' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: 'var(--sapContentLabelColor)' }} />
              <Radar name="Performance" dataKey="value" stroke="#0070f2" fill="#0070f2" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Project-wise Performance */}
      <div className="sap-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>
            Project-wise Performance Comparison
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={projects.map(p => ({
            name: p.code,
            progress: p.progress,
            budgetUsed: Math.round((p.spent / p.budget) * 100),
            safety: p.safety.score,
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--sapBaseColor)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--sapContentLabelColor)' }} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--sapContentLabelColor)' }} unit="%" />
            <Tooltip
              contentStyle={{
                background: 'var(--sapGroupContentBG)',
                border: '1px solid var(--sapBaseColor)',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="progress" fill="#0070f2" name="Progress %" radius={[4, 4, 0, 0]} />
            <Bar dataKey="budgetUsed" fill="#e9730c" name="Budget Used %" radius={[4, 4, 0, 0]} />
            <Bar dataKey="safety" fill="#107e3e" name="Safety Score" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EVMCard({ label, value, sublabel, icon, color }: {
  label: string; value: string; sublabel: string; icon: React.ReactNode; color?: string;
}) {
  const colorMap: Record<string, string> = {
    green: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    orange: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    red: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="sap-card p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`p-1 rounded ${colorMap[color || 'blue']}`}>
          {icon}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--sapContentLabelColor)' }}>
          {label}
        </span>
      </div>
      <div className="text-lg font-bold" style={{ color: 'var(--sapFontColor)' }}>{value}</div>
      <div className="text-[10px] mt-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>{sublabel}</div>
    </div>
  );
}
