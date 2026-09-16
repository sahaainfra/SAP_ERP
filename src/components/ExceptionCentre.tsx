import { useState } from 'react';
import {
  AlertTriangle, AlertCircle, Info, XCircle,
  Filter, Search, ChevronRight, Clock, User,
  ExternalLink, Shield
} from 'lucide-react';

interface Exception {
  id: string;
  type: 'compliance' | 'safety' | 'budget' | 'schedule' | 'quality';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  project: string;
  raisedBy: string;
  raisedDate: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  sla: string;
}

const exceptions: Exception[] = [
  {
    id: 'EXC-001',
    type: 'budget',
    severity: 'critical',
    title: 'Budget overrun exceeds 10% threshold',
    description: 'Water Treatment Plant project has exceeded budget allocation by 12.3% due to unforeseen ground conditions.',
    project: 'WTP-04',
    raisedBy: 'System (Auto-detected)',
    raisedDate: '2025-02-09',
    status: 'open',
    sla: '4 hours'
  },
  {
    id: 'EXC-002',
    type: 'safety',
    severity: 'high',
    title: 'Safety incident — Fall from height',
    description: 'Minor injury reported at Highway Bridge site. Worker fell from scaffolding. First aid administered.',
    project: 'HBR-01',
    raisedBy: 'Tom Brown',
    raisedDate: '2025-02-09',
    status: 'investigating',
    sla: '2 hours'
  },
  {
    id: 'EXC-003',
    type: 'schedule',
    severity: 'high',
    title: 'Critical path delay — Foundation works',
    description: 'Foundation piling work delayed by 5 days due to equipment breakdown. Impact on project milestone M-12.',
    project: 'WTP-04',
    raisedBy: 'Lisa Anderson',
    raisedDate: '2025-02-08',
    status: 'investigating',
    sla: '8 hours'
  },
  {
    id: 'EXC-004',
    type: 'quality',
    severity: 'medium',
    title: 'Concrete test failure — Batch #445',
    description: 'Compressive strength test returned 22 MPa vs required 25 MPa. Batch quarantined pending review.',
    project: 'CTC-03',
    raisedBy: 'Mike Johnson',
    raisedDate: '2025-02-07',
    status: 'open',
    sla: '24 hours'
  },
  {
    id: 'EXC-005',
    type: 'compliance',
    severity: 'medium',
    title: 'Environmental permit renewal pending',
    description: 'Noise permit for Airport Terminal night works expires in 3 days. Renewal application submitted.',
    project: 'ATE-05',
    raisedBy: 'Emma Rodriguez',
    raisedDate: '2025-02-06',
    status: 'open',
    sla: '3 days'
  },
  {
    id: 'EXC-006',
    type: 'budget',
    severity: 'low',
    title: 'Subcontractor rate variation',
    description: 'Electrical subcontractor requesting 8% rate increase due to material cost escalation.',
    project: 'MLE-P2',
    raisedBy: 'Sarah Chen',
    raisedDate: '2025-02-05',
    status: 'resolved',
    sla: 'Met'
  },
];

export default function ExceptionCentre() {
  const [filter, setFilter] = useState<string>('all');
  const [selectedException, setSelectedException] = useState<Exception | null>(null);

  const filtered = exceptions.filter(e => filter === 'all' || e.status === filter);

  const severityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-500',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-500',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-500',
    low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-500',
  };

  const typeIcons: Record<string, React.ReactNode> = {
    compliance: <Shield size={16} className="text-purple-600" />,
    safety: <AlertTriangle size={16} className="text-red-600" />,
    budget: <AlertCircle size={16} className="text-orange-600" />,
    schedule: <Clock size={16} className="text-blue-600" />,
    quality: <Info size={16} className="text-yellow-600" />,
  };

  const statusColors: Record<string, string> = {
    open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    investigating: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    resolved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    closed: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  };

  return (
    <div className="space-y-5 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--sapFontColor)' }}>Exception Centre</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
            Monitor and resolve project exceptions, violations, and threshold breaches
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="sap-card p-4 border-l-4 border-l-red-500">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContentLabelColor)' }}>Critical</div>
          <div className="text-2xl font-bold text-red-600">
            {exceptions.filter(e => e.severity === 'critical' && e.status !== 'closed').length}
          </div>
        </div>
        <div className="sap-card p-4 border-l-4 border-l-orange-500">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContentLabelColor)' }}>High Priority</div>
          <div className="text-2xl font-bold text-orange-600">
            {exceptions.filter(e => e.severity === 'high' && e.status !== 'closed').length}
          </div>
        </div>
        <div className="sap-card p-4 border-l-4 border-l-yellow-500">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContentLabelColor)' }}>Open</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapFontColor)' }}>
            {exceptions.filter(e => e.status === 'open').length}
          </div>
        </div>
        <div className="sap-card p-4 border-l-4 border-l-blue-500">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContentLabelColor)' }}>SLA at Risk</div>
          <div className="text-2xl font-bold text-blue-600">
            {exceptions.filter(e => e.status === 'open' || e.status === 'investigating').length}
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--sapBaseColor)' }}>
        {['all', 'open', 'investigating', 'resolved', 'closed'].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === tab ? 'bg-white dark:bg-gray-800 shadow-sm' : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
            style={{ color: filter === tab ? 'var(--sapFontColor)' : 'var(--sapContentLabelColor)' }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Exception List */}
      <div className="sap-card overflow-hidden">
        <div className="divide-y" style={{ borderColor: 'var(--sapBaseColor)' }}>
          {filtered.map((exception) => (
            <div
              key={exception.id}
              className="flex items-start gap-4 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors cursor-pointer"
              onClick={() => setSelectedException(exception)}
            >
              {/* Type Icon */}
              <div className="p-2.5 rounded-lg shrink-0" style={{ background: 'var(--sapBaseColor)' }}>
                {typeIcons[exception.type]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-medium" style={{ color: 'var(--sapFontColor)' }}>
                    {exception.title}
                  </h4>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${severityColors[exception.severity]}`}>
                    {exception.severity}
                  </span>
                </div>
                <p className="text-xs mt-1 leading-relaxed line-clamp-2" style={{ color: 'var(--sapContentLabelColor)' }}>
                  {exception.description}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>
                  <span className="flex items-center gap-1">
                    <User size={10} /> {exception.raisedBy}
                  </span>
                  <span>•</span>
                  <span>{exception.project}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> SLA: {exception.sla}
                  </span>
                </div>
              </div>

              {/* Status */}
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[exception.status]}`}>
                  {exception.status.charAt(0).toUpperCase() + exception.status.slice(1)}
                </span>
                <ChevronRight size={16} style={{ color: 'var(--sapContentLabelColor)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedException && (
        <div className="sap-card p-5 border-l-4" style={{ borderLeftColor: selectedException.severity === 'critical' ? 'var(--sapNegative)' : selectedException.severity === 'high' ? 'var(--sapCritical)' : 'var(--sapBrand)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold" style={{ color: 'var(--sapContentLabelColor)' }}>
                {selectedException.id}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${severityColors[selectedException.severity]}`}>
                {selectedException.severity}
              </span>
            </div>
            <button
              onClick={() => setSelectedException(null)}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <XCircle size={16} style={{ color: 'var(--sapContentLabelColor)' }} />
            </button>
          </div>
          <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--sapFontColor)' }}>
            {selectedException.title}
          </h3>
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--sapContentLabelColor)' }}>
            {selectedException.description}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="font-medium mb-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>Project</div>
              <div style={{ color: 'var(--sapFontColor)' }}>{selectedException.project}</div>
            </div>
            <div>
              <div className="font-medium mb-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>Raised By</div>
              <div style={{ color: 'var(--sapFontColor)' }}>{selectedException.raisedBy}</div>
            </div>
            <div>
              <div className="font-medium mb-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>Date</div>
              <div style={{ color: 'var(--sapFontColor)' }}>{selectedException.raisedDate}</div>
            </div>
            <div>
              <div className="font-medium mb-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>SLA</div>
              <div style={{ color: 'var(--sapFontColor)' }}>{selectedException.sla}</div>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: 'var(--sapBaseColor)' }}>
            <button className="px-3 py-1.5 text-xs font-medium rounded-lg text-white" style={{ background: 'var(--sapBrand)' }}>
              Assign to Me
            </button>
            <button className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
              style={{ borderColor: 'var(--sapBaseColor)', color: 'var(--sapFontColor)' }}>
              <span className="flex items-center gap-1">
                <ExternalLink size={12} /> Open Full Record
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
