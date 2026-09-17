/**
 * Object Page Component - Part 6
 * 
 * Universal template for displaying detailed information about any business object.
 * Includes header, sections, approval history, audit trail, and document chain.
 */

import { useState } from 'react';
import { 
  ChevronDown, ChevronRight, Edit, Check, X, 
  History, Link2, MessageSquare
} from 'lucide-react';
import { purchaseOrderObjectPage } from '../data/dashboardData';
import type { ObjectPageData, ObjectSection } from '../types/dashboard';
import SmartTable from './SmartTable';
import { Timeline } from './SupportingComponents';

export default function ObjectPage() {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['general', 'line_items']));
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'chain' | 'comments'>('details');

  const toggleSection = (key: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedSections(newExpanded);
  };

  const { header, sections, approvalHistory, auditTrail, documentChain } = purchaseOrderObjectPage;

  return (
    <div className="space-y-6">
      {/* Object Header */}
      <ObjectHeader data={header} />

      {/* Tab Navigation */}
      <div className="sap-card">
        <div className="flex border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          {[
            { key: 'details', label: 'Details', icon: Edit },
            { key: 'history', label: 'Approval History', icon: History },
            { key: 'chain', label: 'Document Chain', icon: Link2 },
            { key: 'comments', label: 'Comments', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key ? 'border-[var(--sapSelectedColor)]' : 'border-transparent'
                }`}
                style={{ 
                  color: activeTab === tab.key ? 'var(--sapSelectedColor)' : 'var(--sapContent_LabelColor)',
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'details' && (
            <ObjectSections 
              sections={sections} 
              expandedSections={expandedSections}
              onToggle={toggleSection}
            />
          )}
          {activeTab === 'history' && (
            <ApprovalHistory history={approvalHistory} />
          )}
          {activeTab === 'chain' && (
            <DocumentChain chain={documentChain} />
          )}
          {activeTab === 'comments' && (
            <CommentsSection />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Object Header ───────────────────────────────────────────────────────────

function ObjectHeader({ data }: { data: ObjectPageData['header'] }) {
  const statusColors = {
    draft: { bg: 'var(--sapNeutralBackground)', text: 'var(--sapNeutralTextColor)', border: 'var(--sapNeutralBorderColor)' },
    pending: { bg: 'var(--sapWarningBackground)', text: 'var(--sapCriticalTextColor)', border: 'var(--sapWarningBorderColor)' },
    approved: { bg: 'var(--sapSuccessBackground)', text: 'var(--sapPositiveTextColor)', border: 'var(--sapSuccessBorderColor)' },
    rejected: { bg: 'var(--sapErrorBackground)', text: 'var(--sapNegativeTextColor)', border: 'var(--sapErrorBorderColor)' },
    completed: { bg: 'var(--sapInformationBackground)', text: 'var(--sapInformativeTextColor)', border: 'var(--sapInformationBorderColor)' },
  };

  const statusColor = statusColors[data.status as keyof typeof statusColors] || statusColors.draft;

  return (
    <div className="sap-card p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-sm font-mono" style={{ color: 'var(--sapContent_LabelColor)' }}>
              {data.objectNumber}
            </span>
            <span
              className="px-3 py-1 rounded-full text-xs font-medium uppercase"
              style={{ background: statusColor.bg, color: statusColor.text, border: `1px solid ${statusColor.border}` }}
            >
              {data.status}
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--sapTextColor)' }}>
            {data.title}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {data.actions.map((action) => (
            <button
              key={action.key}
              disabled={action.disabled}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                action.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
              style={{
                background: action.variant === 'primary' 
                  ? 'var(--sapButton_Emphasized_Background)' 
                  : action.variant === 'danger'
                  ? 'var(--sapButton_Reject_Background)'
                  : 'var(--sapButton_Background)',
                color: action.variant === 'primary'
                  ? 'var(--sapButton_Emphasized_TextColor)'
                  : action.variant === 'danger'
                  ? 'var(--sapButton_Reject_TextColor)'
                  : 'var(--sapButton_TextColor)',
                border: action.variant === 'secondary' ? '1px solid var(--sapButton_BorderColor)' : 'none',
              }}
              title={action.disabled ? action.disabledReason : undefined}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Facts */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t" style={{ borderColor: 'var(--sapGroup_ContentBorderColor)' }}>
        {data.keyFacts.map((fact) => (
          <div key={fact.label}>
            <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
              {fact.label}
            </div>
            <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              {fact.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Object Sections ─────────────────────────────────────────────────────────

function ObjectSections({ 
  sections, 
  expandedSections,
  onToggle 
}: { 
  sections: ObjectSection[];
  expandedSections: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div key={section.key} className="sap-card overflow-hidden">
          <button
            onClick={() => onToggle(section.key)}
            className="w-full p-4 flex items-center justify-between hover:bg-[var(--sapList_Hover_Background)] transition-colors"
          >
            <h3 className="text-base font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              {section.title}
            </h3>
            {expandedSections.has(section.key) ? (
              <ChevronDown size={20} style={{ color: 'var(--sapContent_LabelColor)' }} />
            ) : (
              <ChevronRight size={20} style={{ color: 'var(--sapContent_LabelColor)' }} />
            )}
          </button>

          {expandedSections.has(section.key) && (
            <div className="p-4 pt-0 border-t" style={{ borderColor: 'var(--sapGroup_ContentBorderColor)' }}>
              <SectionContent section={section} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function SectionContent({ section }: { section: ObjectSection }) {
  if (section.key === 'line_items' && Array.isArray(section.content)) {
    // Render as table
    const columns = [
      { key: 'item', label: 'Item', type: 'text' as const },
      { key: 'quantity', label: 'Quantity', type: 'number' as const },
      { key: 'uom', label: 'UOM', type: 'text' as const },
      { key: 'rate', label: 'Rate', type: 'currency' as const },
      { key: 'amount', label: 'Amount', type: 'currency' as const },
    ];

    return (
      <SmartTable
        columns={columns}
        data={section.content}
        totalCount={section.content.length}
        page={1}
        pageSize={10}
        filters={[]}
        sort={[]}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
        onFilterChange={() => {}}
        onSortChange={() => {}}
        views={[]}
        onViewChange={() => {}}
        onViewSave={() => {}}
        onExport={() => {}}
      />
    );
  }

  if (section.key === 'financial' && typeof section.content === 'object') {
    // Render as key-value pairs
    return (
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(section.content).map(([key, value]) => (
          <div key={key}>
            <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
            </div>
            <div className="text-base font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              {typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : String(value)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (section.key === 'schedule' && Array.isArray(section.content)) {
    // Render as list
    return (
      <div className="space-y-2">
        {section.content.map((item: any, i: number) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--sapList_Background)' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                {item.item}
              </div>
              <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {new Date(item.deliveryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                {item.quantity} units
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: item.status === 'received' ? 'var(--sapSuccessBackground)' : 'var(--sapWarningBackground)',
                  color: item.status === 'received' ? 'var(--sapPositiveTextColor)' : 'var(--sapCriticalTextColor)',
                }}
              >
                {item.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default: render as key-value pairs
  if (typeof section.content === 'object' && section.content !== null) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(section.content).map(([key, value]) => (
          <div key={key}>
            <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
            </div>
            <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
              {String(value)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return <div>{String(section.content)}</div>;
}

// ─── Approval History ────────────────────────────────────────────────────────

function ApprovalHistory({ history }: { history: ObjectPageData['approvalHistory'] }) {
  return (
    <div>
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
        Approval History
      </h3>
      <Timeline
        items={history.map((item) => ({
          id: item.id.toString(),
          actor: item.approver,
          action: item.action,
          timestamp: item.timestamp,
          comment: item.comment,
        }))}
      />
    </div>
  );
}

// ─── Document Chain ──────────────────────────────────────────────────────────

function DocumentChain({ chain }: { chain: ObjectPageData['documentChain'] }) {
  return (
    <div>
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
        Document Chain
      </h3>
      <div className="flex items-center gap-2 overflow-x-auto pb-4">
        {chain.map((node, i) => (
          <div key={node.id} className="flex items-center gap-2">
            <a
              href={node.hasAccess ? node.route : undefined}
              className={`flex-shrink-0 sap-card p-4 min-w-[200px] ${
                node.hasAccess ? 'hover:shadow-lg cursor-pointer' : 'opacity-50'
              } transition-shadow`}
            >
              <div className="text-xs font-mono mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {node.type.replace('_', ' ').toUpperCase()}
              </div>
              <div className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                {node.number}
              </div>
              <div className="flex items-center justify-between">
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: node.status === 'approved' ? 'var(--sapSuccessBackground)' : 'var(--sapWarningBackground)',
                    color: node.status === 'approved' ? 'var(--sapPositiveTextColor)' : 'var(--sapCriticalTextColor)',
                  }}
                >
                  {node.status}
                </span>
                {node.value && (
                  <span className="text-xs font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                    ₹{(node.value / 100000).toFixed(1)}L
                  </span>
                )}
              </div>
              <div className="text-xs mt-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {new Date(node.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </a>
            {i < chain.length - 1 && (
              <ChevronRight size={20} style={{ color: 'var(--sapContent_LabelColor)' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Comments Section ────────────────────────────────────────────────────────

function CommentsSection() {
  const [newComment, setNewComment] = useState('');

  const comments = [
    {
      id: 1,
      user: 'Sarah Chen',
      avatar: 'SC',
      timestamp: '2026-02-10T10:30:00Z',
      comment: 'Vendor has confirmed delivery schedule. All materials will be delivered as per PO terms.',
    },
    {
      id: 2,
      user: 'Mike Johnson',
      avatar: 'MJ',
      timestamp: '2026-02-09T15:45:00Z',
      comment: 'Please expedite the delivery of TMT Bar 25mm. We need it for the foundation work next week.',
    },
  ];

  return (
    <div>
      <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
        Comments
      </h3>

      {/* New Comment Input */}
      <div className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="w-full p-3 rounded-lg border resize-none"
          style={{
            background: 'var(--sapField_Background)',
            borderColor: 'var(--sapField_BorderColor)',
            color: 'var(--sapField_TextColor)',
          }}
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <button
            disabled={!newComment.trim()}
            className="px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
            style={{
              background: 'var(--sapButton_Emphasized_Background)',
              color: 'var(--sapButton_Emphasized_TextColor)',
            }}
          >
            Post Comment
          </button>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3">
            <div
              className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: 'var(--sapAccentColor6)' }}
            >
              {comment.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {comment.user}
                </span>
                <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {new Date(comment.timestamp).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                {comment.comment}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
