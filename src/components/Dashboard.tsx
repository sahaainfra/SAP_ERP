import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import {
  DollarSign, FolderKanban, TrendingUp, Percent,
  Shield, Clock, Users, FileSearch, ArrowUpRight,
  AlertTriangle, CheckCircle2, XCircle, MoreHorizontal,
  Activity, Zap
} from 'lucide-react';
import KPICard, { MiniKPICard } from './KPICard';
import {
  kpiData, projects, monthlyProgress, budgetBreakdown,
  recentActivity, alerts, approvals, evmData, resourceAllocation
} from '../data/mockData';

interface DashboardProps {
  currentProject: string;
}

const COLORS = ['#0070f2', '#107e3e', '#e9730c', '#bb0000', '#6a6d70', '#5b9bd5'];

export default function Dashboard({ currentProject }: DashboardProps) {
  const filteredProjects = currentProject === 'all'
    ? projects
    : projects.filter(p => p.code === currentProject);

  const totalBudget = filteredProjects.reduce((sum, p) => sum + p.budget, 0);
  const totalSpent = filteredProjects.reduce((sum, p) => sum + p.spent, 0);

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--sapFontColor)' }}>
            Executive Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
            Real-time project portfolio overview • Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20">
            <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">Live</span>
          </div>
          <button className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            style={{ borderColor: 'var(--sapBaseColor)', color: 'var(--sapFontColor)' }}>
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard data={kpiData.totalRevenue} icon={<DollarSign size={18} className="text-blue-600" />} />
        <KPICard data={kpiData.activeProjects} icon={<FolderKanban size={18} className="text-green-600" />} />
        <KPICard data={kpiData.avgProgress} icon={<TrendingUp size={18} className="text-purple-600" />} />
        <KPICard data={kpiData.budgetUtilization} icon={<Percent size={18} className="text-orange-600" />} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniKPICard label="Safety Score" value="94.8%" change="+1.2%" positive />
        <MiniKPICard label="On-Time Delivery" value="78%" change="-2.4%" positive={false} />
        <MiniKPICard label="Resource Util." value="86%" change="+4.5%" positive />
        <MiniKPICard label="Open RFIs" value="23" change="-8" positive />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Planned vs Actual Progress */}
        <div className="lg:col-span-2 sap-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>
                Planned vs Actual Progress
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
                Portfolio-wide cumulative progress tracking
              </p>
            </div>
            <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <MoreHorizontal size={16} style={{ color: 'var(--sapContentLabelColor)' }} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyProgress}>
              <defs>
                <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0070f2" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#0070f2" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#107e3e" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#107e3e" stopOpacity={0} />
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
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="planned" stroke="#0070f2" fill="url(#plannedGrad)" strokeWidth={2} name="Planned" />
              <Area type="monotone" dataKey="actual" stroke="#107e3e" fill="url(#actualGrad)" strokeWidth={2} name="Actual" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Budget Breakdown */}
        <div className="sap-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>
              Budget Allocation
            </h3>
            <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
              <MoreHorizontal size={16} style={{ color: 'var(--sapContentLabelColor)' }} />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={budgetBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="budget"
                nameKey="category"
              >
                {budgetBreakdown.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--sapGroupContentBG)',
                  border: '1px solid var(--sapBaseColor)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
                formatter={(value: number) => [`${value}%`, 'Budget']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {budgetBreakdown.map((item, i) => (
              <div key={item.category} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                <span style={{ color: 'var(--sapContentLabelColor)' }}>{item.category}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* EVM and Projects Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Earned Value Management */}
        <div className="sap-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>
                Earned Value Management
              </h3>
              <p className="text-xs mt-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
                PV / EV / AC Analysis (in $M)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span style={{ color: 'var(--sapContentLabelColor)' }}>PV</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span style={{ color: 'var(--sapContentLabelColor)' }}>EV</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span style={{ color: 'var(--sapContentLabelColor)' }}>AC</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={evmData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--sapBaseColor)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--sapContentLabelColor)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--sapContentLabelColor)' }} />
              <Tooltip
                contentStyle={{
                  background: 'var(--sapGroupContentBG)',
                  border: '1px solid var(--sapBaseColor)',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Line type="monotone" dataKey="pv" stroke="#0070f2" strokeWidth={2} dot={{ r: 3 }} name="Planned Value" />
              <Line type="monotone" dataKey="ev" stroke="#107e3e" strokeWidth={2} dot={{ r: 3 }} name="Earned Value" />
              <Line type="monotone" dataKey="ac" stroke="#e9730c" strokeWidth={2} dot={{ r: 3 }} name="Actual Cost" />
            </LineChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t" style={{ borderColor: 'var(--sapBaseColor)' }}>
            <div className="text-center">
              <div className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>SPI</div>
              <div className="text-lg font-bold text-orange-500">0.96</div>
            </div>
            <div className="text-center">
              <div className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>CPI</div>
              <div className="text-lg font-bold text-red-500">0.94</div>
            </div>
            <div className="text-center">
              <div className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>EAC</div>
              <div className="text-lg font-bold" style={{ color: 'var(--sapFontColor)' }}>$972M</div>
            </div>
          </div>
        </div>

        {/* Project Status Overview */}
        <div className="sap-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>
              Project Status Overview
            </h3>
            <button className="text-xs font-medium" style={{ color: 'var(--sapBrand)' }}>View All</button>
          </div>
          <div className="space-y-3">
            {filteredProjects.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <div className={`w-2 h-8 rounded-full ${
                  project.status === 'active' ? 'bg-green-500' :
                  project.status === 'delayed' ? 'bg-red-500' :
                  project.status === 'on-hold' ? 'bg-yellow-500' : 'bg-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate" style={{ color: 'var(--sapFontColor)' }}>
                      {project.name}
                    </span>
                    <span className="text-xs font-medium ml-2" style={{ color: 'var(--sapContentLabelColor)' }}>
                      {project.progress}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sapBaseColor)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${project.progress}%`,
                          background: project.progress > 80 ? 'var(--sapPositive)' :
                                     project.progress > 50 ? 'var(--sapBrand)' : 'var(--sapCritical)'
                        }}
                      />
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      project.risk === 'critical' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                      project.risk === 'high' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                      project.risk === 'medium' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {project.risk.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Activity, Alerts, Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Activity */}
        <div className="sap-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-blue-600" />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>
                Recent Activity
              </h3>
            </div>
            <span className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>Live feed</span>
          </div>
          <div className="space-y-3">
            {recentActivity.slice(0, 6).map((item, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="text-[10px] font-mono pt-0.5 w-10 shrink-0" style={{ color: 'var(--sapContentLabelColor)' }}>
                  {item.time}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs leading-snug" style={{ color: 'var(--sapFontColor)' }}>{item.action}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
                    {item.user} • {item.project}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical Alerts */}
        <div className="sap-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-orange-600" />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>
                Active Alerts
              </h3>
            </div>
            <span className="sap-badge sap-badge-negative">{alerts.filter(a => !a.read).length} new</span>
          </div>
          <div className="space-y-2">
            {alerts.filter(a => !a.read).map((alert) => (
              <div key={alert.id} className={`p-2.5 rounded-lg border-l-3 ${
                alert.type === 'critical' ? 'border-l-red-500 bg-red-50/50 dark:bg-red-900/10' :
                alert.type === 'warning' ? 'border-l-orange-500 bg-orange-50/50 dark:bg-orange-900/10' :
                'border-l-blue-500 bg-blue-50/50 dark:bg-blue-900/10'
              }`}>
                <p className="text-xs leading-snug" style={{ color: 'var(--sapFontColor)' }}>{alert.message}</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--sapContentLabelColor)' }}>{alert.timestamp}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="sap-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-green-600" />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>
                Pending Approvals
              </h3>
            </div>
            <span className="sap-badge sap-badge-information">{approvals.filter(a => a.status === 'pending').length}</span>
          </div>
          <div className="space-y-2">
            {approvals.filter(a => a.status === 'pending').slice(0, 4).map((approval) => (
              <div key={approval.id} className="p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium truncate" style={{ color: 'var(--sapFontColor)' }}>
                    {approval.title}
                  </span>
                  {approval.priority === 'urgent' && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 shrink-0">
                      URGENT
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px]" style={{ color: 'var(--sapContentLabelColor)' }}>
                    {approval.requester} • ${(approval.amount / 1000000).toFixed(1)}M
                  </span>
                  <div className="flex gap-1">
                    <button className="p-1 rounded hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600">
                      <CheckCircle2 size={14} />
                    </button>
                    <button className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500">
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Resource Utilization */}
      <div className="sap-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-purple-600" />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>
              Resource Utilization
            </h3>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {resourceAllocation.map((resource) => {
            const utilization = Math.round((resource.utilized / resource.allocated) * 100);
            return (
              <div key={resource.role} className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-2">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="var(--sapBaseColor)"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke={utilization > 90 ? 'var(--sapCritical)' : utilization > 70 ? 'var(--sapPositive)' : 'var(--sapBrand)'}
                      strokeWidth="3"
                      strokeDasharray={`${utilization}, 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color: 'var(--sapFontColor)' }}>
                    {utilization}%
                  </span>
                </div>
                <div className="text-xs font-medium" style={{ color: 'var(--sapFontColor)' }}>{resource.role}</div>
                <div className="text-[10px]" style={{ color: 'var(--sapContentLabelColor)' }}>
                  {resource.utilized}/{resource.allocated}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
