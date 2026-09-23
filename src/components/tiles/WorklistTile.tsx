/**
 * Part 01 — Worklist Tile
 * 
 * Renders a list of actionable items requiring the user's attention.
 * Items are filtered by permission — the user only sees what they can act on.
 * 
 * Rule 3: If no items exist, show the empty state — never fabricate items.
 */

import React from 'react';
import type { TileDefinition, WorklistItem, WorklistPriority } from '../../types/workspace';
import { usePermission } from '../../contexts/PermissionContext';
import { Clock, ChevronRight, CheckCircle2 } from 'lucide-react';

interface WorklistTileProps {
  tile: TileDefinition;
}

// Demo worklist items — represent the structure, not fabricated transactions
// In production, these come from the workflow engine (Part 10)
const DEMO_WORKLIST_ITEMS: Record<string, WorklistItem[]> = {
  'wl-approvals': [
    {
      id: 'wl-1',
      title: 'PO-2024-0142 — Steel Reinforcement',
      subtitle: '₹24,50,000 • Submitted by Amit Sharma',
      entity: 'procure.po',
      entityId: 'po_142',
      status: 'PENDING_APPROVAL',
      priority: 'high',
      assignee: 'Rajesh Kumar',
      dueDate: '2024-12-20',
      createdAt: '2024-12-18T10:30:00Z',
      drillTarget: '/procurement/po/po_142',
      permissionKey: 'procure.po.approve',
    },
    {
      id: 'wl-2',
      title: 'Indent-2024-0089 — Cement OPC 53',
      subtitle: '500 bags • Site requirement',
      entity: 'procure.indent',
      entityId: 'ind_089',
      status: 'PENDING_APPROVAL',
      priority: 'medium',
      assignee: 'Rajesh Kumar',
      dueDate: '2024-12-21',
      createdAt: '2024-12-18T14:15:00Z',
      drillTarget: '/procurement/indent/ind_089',
      permissionKey: 'procure.po.approve',
    },
    {
      id: 'wl-3',
      title: 'WO-2024-0031 — Shuttering Work',
      subtitle: 'Subcontractor billing milestone',
      entity: 'sc.work_order',
      entityId: 'wo_031',
      status: 'PENDING_APPROVAL',
      priority: 'critical',
      assignee: 'Rajesh Kumar',
      dueDate: '2024-12-19',
      createdAt: '2024-12-17T09:00:00Z',
      drillTarget: '/contracts/wo/wo_031',
      permissionKey: 'procure.po.approve',
    },
  ],
  'wl-inspections': [
    {
      id: 'wl-4',
      title: 'WIR-2024-0234 — Column Reinforcement',
      subtitle: 'Grid A-3 to A-5, Level +6.0m',
      entity: 'qa.inspection',
      entityId: 'wir_234',
      status: 'SUBMITTED',
      priority: 'high',
      dueDate: '2024-12-19',
      createdAt: '2024-12-18T16:00:00Z',
      drillTarget: '/quality/inspection/wir_234',
      permissionKey: 'qa.inspection.view',
    },
    {
      id: 'wl-5',
      title: 'WIR-2024-0235 — Waterproofing',
      subtitle: 'Basement slab, Zone B',
      entity: 'qa.inspection',
      entityId: 'wir_235',
      status: 'SUBMITTED',
      priority: 'medium',
      dueDate: '2024-12-20',
      createdAt: '2024-12-18T17:30:00Z',
      drillTarget: '/quality/inspection/wir_235',
      permissionKey: 'qa.inspection.view',
    },
  ],
};

function getPriorityColor(priority: WorklistPriority): string {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-700 border-red-200';
    case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
    case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
    case 'low': return 'bg-slate-100 text-slate-600 border-slate-200';
  }
}

function getPriorityLabel(priority: WorklistPriority): string {
  switch (priority) {
    case 'critical': return 'URGENT';
    case 'high': return 'HIGH';
    case 'medium': return 'MED';
    case 'low': return 'LOW';
  }
}

function getStateLabel(status: string): string {
  switch (status) {
    case 'PENDING_APPROVAL': return 'Pending Approval';
    case 'SUBMITTED': return 'Submitted';
    case 'DRAFT': return 'Draft';
    case 'APPROVED': return 'Approved';
    default: return status;
  }
}

export function WorklistTile({ tile }: WorklistTileProps) {
  const { hasPermission } = usePermission();

  if (!hasPermission(tile.permissionKey)) return null;

  const worklistId = `wl-${tile.id.replace('tile-', '')}`;
  const items = DEMO_WORKLIST_ITEMS[worklistId] ?? [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">{tile.title}</h3>
          {tile.subtitle && (
            <p className="text-xs text-slate-500">{tile.subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
            {items.length} items
          </span>
          {tile.drillTarget && (
            <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">
              View all <ChevronRight size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-slate-50">
        {items.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <CheckCircle2 size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No items requiring your action</p>
          </div>
        ) : (
          items.map(item => (
            <div
              key={item.id}
              className="px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors group"
            >
              <div className="flex items-start gap-3">
                {/* Priority indicator */}
                <div className={`shrink-0 w-1.5 h-1.5 rounded-full mt-2 ${
                  item.priority === 'critical' ? 'bg-red-500' :
                  item.priority === 'high' ? 'bg-orange-500' :
                  item.priority === 'medium' ? 'bg-blue-500' : 'bg-slate-400'
                }`} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {item.title}
                    </p>
                    <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(item.priority)}`}>
                      {getPriorityLabel(item.priority)}
                    </span>
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-slate-500 truncate">{item.subtitle}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock size={10} />
                      {item.dueDate ? `Due ${item.dueDate}` : ''}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {getStateLabel(item.status)}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight size={16} className="shrink-0 text-slate-300 group-hover:text-slate-500 mt-1" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
