import { useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, AlertTriangle, DollarSign,
  FileText, ArrowRight, Filter, Search, ChevronDown,
  MoreHorizontal, Eye
} from 'lucide-react';
import { approvals } from '../data/mockData';
import type { Approval } from '../data/mockData';

export default function ApprovalCentre() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);

  const filtered = approvals.filter(a => filter === 'all' || a.status === filter);
  const pendingCount = approvals.filter(a => a.status === 'pending').length;
  const totalValue = filtered.reduce((sum, a) => sum + a.amount, 0);

  const typeIcons: Record<string, React.ReactNode> = {
    'purchase': <DollarSign size={14} className="text-blue-600" />,
    'change-order': <FileText size={14} className="text-purple-600" />,
    'payment': <DollarSign size={14} className="text-green-600" />,
    'variation': <AlertTriangle size={14} className="text-orange-600" />,
  };

  const typeLabels: Record<string, string> = {
    'purchase': 'Purchase Order',
    'change-order': 'Change Order',
    'payment': 'Payment',
    'variation': 'Variation',
  };

  return (
    <div className="space-y-5 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--sapFontColor)' }}>Approval Centre</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
            Review and process pending approvals across all projects
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="sap-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <Clock size={14} className="text-yellow-600" />
            </div>
            <span className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>Pending</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapFontColor)' }}>{pendingCount}</div>
        </div>
        <div className="sap-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 size={14} className="text-green-600" />
            </div>
            <span className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>Approved</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapFontColor)' }}>
            {approvals.filter(a => a.status === 'approved').length}
          </div>
        </div>
        <div className="sap-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <DollarSign size={14} className="text-blue-600" />
            </div>
            <span className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>Total Value</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapFontColor)' }}>
            ${(totalValue / 1000000).toFixed(1)}M
          </div>
        </div>
        <div className="sap-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
              <AlertTriangle size={14} className="text-red-600" />
            </div>
            <span className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>Urgent</span>
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapFontColor)' }}>
            {approvals.filter(a => a.priority === 'urgent' && a.status === 'pending').length}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-lg w-fit" style={{ background: 'var(--sapBaseColor)' }}>
        {(['all', 'pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === tab
                ? 'bg-white dark:bg-gray-800 shadow-sm'
                : 'hover:bg-white/50 dark:hover:bg-gray-700/50'
            }`}
            style={{ color: filter === tab ? 'var(--sapFontColor)' : 'var(--sapContentLabelColor)' }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'pending' && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Approval List */}
      <div className="sap-card overflow-hidden">
        <div className="divide-y" style={{ borderColor: 'var(--sapBaseColor)' }}>
          {filtered.map((approval) => (
            <div
              key={approval.id}
              className="flex items-center gap-4 p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors"
            >
              {/* Type Icon */}
              <div className="p-2.5 rounded-lg" style={{ background: 'var(--sapBaseColor)' }}>
                {typeIcons[approval.type]}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium truncate" style={{ color: 'var(--sapFontColor)' }}>
                    {approval.title}
                  </h4>
                  {approval.priority === 'urgent' && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 font-medium shrink-0">
                      URGENT
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>
                  <span>{typeLabels[approval.type]}</span>
                  <span>•</span>
                  <span>{approval.requester}</span>
                  <span>•</span>
                  <span>{approval.project}</span>
                  <span>•</span>
                  <span>{approval.submittedDate}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold" style={{ color: 'var(--sapFontColor)' }}>
                  ${(approval.amount / 1000000).toFixed(2)}M
                </div>
                <div className="text-[10px]" style={{ color: 'var(--sapContentLabelColor)' }}>
                  {approval.status === 'pending' ? 'Awaiting review' : approval.status}
                </div>
              </div>

              {/* Actions */}
              {approval.status === 'pending' && (
                <div className="flex items-center gap-1 shrink-0">
                  <button className="p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 transition-colors">
                    <CheckCircle2 size={18} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500 transition-colors">
                    <XCircle size={18} />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    style={{ color: 'var(--sapContentLabelColor)' }}>
                    <Eye size={18} />
                  </button>
                </div>
              )}
              {approval.status !== 'pending' && (
                <span className={`text-xs px-2 py-1 rounded-full font-medium shrink-0 ${
                  approval.status === 'approved'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
