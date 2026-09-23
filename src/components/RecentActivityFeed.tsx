/**
 * Part 01 — Recent Activity Feed
 * 
 * Shows the latest domain events in the workspace. Events are emitted
 * through the Part 09 outbox inside the transaction, published only after
 * commit, delivered by Part 13 with per-subscriber filtering.
 * 
 * For Part 01, we demonstrate the feed structure. Events will come from
 * real transactions once the posting engines (Part 11) are live.
 */

import React, { useState, useEffect } from 'react';
import { usePermission } from '../contexts/PermissionContext';
import {
  Activity,
  Package,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
} from 'lucide-react';

interface ActivityEvent {
  id: string;
  type: string;
  actor: string;
  entity: string;
  entityId: string;
  description: string;
  timestamp: string;
  icon: React.ReactNode;
  color: string;
}

// Demo events — represent the structure the event engine will provide
// In production, these come from the event outbox (Part 09/13)
const DEMO_EVENTS: ActivityEvent[] = [
  {
    id: 'evt_001',
    type: 'procure.po.released',
    actor: 'Amit Sharma',
    entity: 'Purchase Order',
    entityId: 'PO-2024-0140',
    description: 'PO released to vendor — Steel reinforcement 50MT',
    timestamp: '10 min ago',
    icon: <Package size={14} />,
    color: 'text-blue-500 bg-blue-50',
  },
  {
    id: 'evt_002',
    type: 'store.grn.posted',
    actor: 'Suresh Patel',
    entity: 'GRN',
    entityId: 'GRN-2024-0892',
    description: 'GRN posted — Cement OPC 53 Grade, 200 bags received',
    timestamp: '25 min ago',
    icon: <CheckCircle2 size={14} />,
    color: 'text-emerald-500 bg-emerald-50',
  },
  {
    id: 'evt_003',
    type: 'qa.inspection.submitted',
    actor: 'Vikram Singh',
    entity: 'WIR',
    entityId: 'WIR-2024-0234',
    description: 'Inspection request submitted — Column reinforcement Grid A-3',
    timestamp: '45 min ago',
    icon: <FileText size={14} />,
    color: 'text-indigo-500 bg-indigo-50',
  },
  {
    id: 'evt_004',
    type: 'hse.observation.created',
    actor: 'Ravi Kumar',
    entity: 'Safety Observation',
    entityId: 'OBS-2024-0078',
    description: 'Near-miss reported — Unsecured scaffolding at Level +3.0m',
    timestamp: '1 hr ago',
    icon: <AlertTriangle size={14} />,
    color: 'text-amber-500 bg-amber-50',
  },
  {
    id: 'evt_005',
    type: 'finance.voucher.posted',
    actor: 'Priya Mehta',
    entity: 'Payment Voucher',
    entityId: 'PV-2024-0456',
    description: 'Payment posted — Subcontractor bill #12, ₹8,45,000',
    timestamp: '2 hr ago',
    icon: <FileText size={14} />,
    color: 'text-purple-500 bg-purple-50',
  },
];

export function RecentActivityFeed() {
  const { hasPermission } = usePermission();
  const [events, setEvents] = useState<ActivityEvent[]>(DEMO_EVENTS);

  // Filter events by permission
  const visibleEvents = events.filter(event => {
    const module = event.type.split('.')[0];
    const permissionMap: Record<string, string> = {
      procure: 'procure.po.view',
      store: 'store.grn.view',
      qa: 'qa.inspection.view',
      hse: 'hse.incident.view',
      finance: 'finance.voucher.view',
    };
    const permKey = permissionMap[module];
    return permKey ? hasPermission(permKey) : true;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-800">Recent Activity</h3>
        </div>
        <span className="text-[10px] text-slate-400 font-mono">
          {visibleEvents.length} events
        </span>
      </div>

      {/* Events list */}
      <div className="divide-y divide-slate-50 max-h-[340px] overflow-y-auto">
        {visibleEvents.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <Activity size={24} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No recent activity</p>
          </div>
        ) : (
          visibleEvents.map(event => (
            <div key={event.id} className="px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer group">
              <div className="flex items-start gap-3">
                <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${event.color}`}>
                  {event.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-800 leading-snug">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] text-slate-500">{event.actor}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                      <Clock size={9} />
                      {event.timestamp}
                    </span>
                  </div>
                </div>
                <ArrowRight size={14} className="shrink-0 text-slate-300 group-hover:text-slate-500 mt-1" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
        <p className="text-[10px] text-slate-400">
          Events from Part 13 Real-Time Engine • Filtered by your permissions
        </p>
      </div>
    </div>
  );
}
