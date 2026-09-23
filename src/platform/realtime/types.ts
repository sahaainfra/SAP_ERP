/**
 * Part 13 — Real-Time Event Types & Catalogue
 * 
 * Defines the event model, event catalogue, and channel types for the real-time engine.
 * Every event is published only after its transaction commits via the outbox.
 */

// ═══════════════════════════════════════════════════════════════════════════
// EVENT ENVELOPE
// ═══════════════════════════════════════════════════════════════════════════

export interface DomainEvent<TPayload = any> {
  eventId: string;                    // ULID for ordering
  eventType: EventType;
  occurredAt: string;                 // ISO timestamp
  actorUserId: number;
  entityType: string;
  entityId: number;
  scope: EventScope;
  changes?: Record<string, { from: any; to: any }>;
  affectedKpis?: string[];
  payload: TPayload;
  version: number;
  sequence?: number;                  // Per-channel monotonic sequence
}

export interface EventScope {
  companyId?: number;
  projectId?: number;
  siteId?: number;
  financialYear?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT TYPE CATALOGUE
// ═══════════════════════════════════════════════════════════════════════════

export type EventType = 
  // Projects
  | 'project.created'
  | 'project.status_changed'
  | 'project.progress_updated'
  | 'project.budget_revised'
  | 'project.milestone_reached'
  | 'project.milestone_missed'
  
  // Procurement
  | 'material_requisition.created'
  | 'material_requisition.submitted'
  | 'material_requisition.approved'
  | 'material_requisition.rejected'
  | 'purchase_requisition.created'
  | 'purchase_requisition.submitted'
  | 'purchase_requisition.approved'
  | 'rfq.issued'
  | 'quotation.received'
  | 'comparative_statement.prepared'
  | 'comparative_statement.approved'
  | 'purchase_order.created'
  | 'purchase_order.submitted'
  | 'purchase_order.approved'
  | 'purchase_order.rejected'
  | 'purchase_order.amended'
  | 'purchase_order.cancelled'
  | 'purchase_order.delivery_overdue'
  | 'work_order.created'
  | 'work_order.completed'
  
  // Materials
  | 'grn.created'
  | 'grn.approved'
  | 'stock.received'
  | 'stock.issued'
  | 'stock.returned'
  | 'stock.transferred'
  | 'stock.adjusted'
  | 'stock.below_reorder'
  | 'stock.negative'
  | 'stock.expiring'
  | 'material_reconciliation.completed'
  
  // Execution
  | 'dpr.submitted'
  | 'dpr.approved'
  | 'measurement_book.created'
  | 'measurement_book.submitted'
  | 'measurement_book.certified'
  | 'measurement_book.disputed'
  | 'progress.updated'
  | 'activity.delayed'
  | 'work_front.opened'
  | 'work_front.closed'
  
  // Billing & Commercial
  | 'ra_bill.created'
  | 'ra_bill.submitted'
  | 'ra_bill.certified'
  | 'ra_bill.approved'
  | 'ra_bill.paid'
  | 'invoice.raised'
  | 'invoice.overdue'
  | 'subcontractor_bill.created'
  | 'subcontractor_bill.approved'
  | 'retention.due'
  | 'claim.raised'
  | 'claim.settled'
  | 'receivable.overdue'
  
  // Finance
  | 'payment.made'
  | 'receipt.received'
  | 'voucher.posted'
  | 'budget.exceeded'
  | 'budget.threshold_breached'
  | 'cash_flow.negative_projected'
  
  // HR & Attendance
  | 'attendance.marked'
  | 'attendance.anomaly'
  | 'payroll.processed'
  | 'leave.applied'
  | 'leave.approved'
  | 'employee.joined'
  | 'employee.exited'
  
  // Plant & Equipment
  | 'equipment.allocated'
  | 'equipment.returned'
  | 'equipment.breakdown'
  | 'maintenance.due'
  | 'maintenance.overdue'
  | 'fuel.consumption_anomaly'
  | 'equipment.idle_threshold_breached'
  
  // RMC
  | 'batch.produced'
  | 'batch.dispatched'
  | 'batch.quality_failed'
  | 'mix_design.approved'
  
  // Quality & Safety
  | 'wir.raised'
  | 'wir.approved'
  | 'wir.rejected'
  | 'ncr.raised'
  | 'ncr.closed'
  | 'ncr.overdue'
  | 'test.failed'
  | 'calibration.due'
  | 'incident.reported'
  | 'permit.issued'
  | 'permit.expired'
  | 'observation.raised'
  
  // Workflow
  | 'approval.requested'
  | 'approval.granted'
  | 'approval.rejected'
  | 'approval.returned'
  | 'approval.escalated'
  | 'task.assigned'
  | 'task.completed'
  | 'task.overdue'
  | 'sla.at_risk'
  | 'sla.breached'
  
  // Admin
  | 'permission.changed'
  | 'assignment.changed'
  | 'backup.completed'
  | 'backup.failed'
  | 'user.login'
  | 'user.logout'
  | 'user.locked'
  
  // System
  | 'permission.invalidated'
  | 'notification.created'
  | 'chat.message.sent'
  | 'system.maintenance'
  | 'system.broadcast';

// ═══════════════════════════════════════════════════════════════════════════
// CHANNEL TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type ChannelType = 
  | 'user'              // Personal notifications, tasks, approvals
  | 'project:kpi'       // Project KPI updates
  | 'project:activity'  // Project activity feed
  | 'project:alerts'    // Project alerts
  | 'site:activity'     // Site-level activity
  | 'company:exec'      // Executive/portfolio KPIs
  | 'module'            // Module-specific streams
  | 'approval'          // Approvals awaiting user
  | 'presence'          // Who is online
  | 'system';           // System broadcasts

export interface Channel {
  type: ChannelType;
  id: string;           // e.g., "user:123", "project:7:kpi"
  permissionKey?: string;
  scope?: EventScope;
}

export function buildChannelId(type: ChannelType, ...parts: (string | number)[]): string {
  return `${type}:${parts.join(':')}`;
}

export function parseChannelId(channelId: string): { type: ChannelType; parts: string[] } {
  const [type, ...parts] = channelId.split(':');
  return { type: type as ChannelType, parts };
}

// ═══════════════════════════════════════════════════════════════════════════
// MESSAGE TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type WebSocketMessageType =
  | 'kpi.update'
  | 'alert.raised'
  | 'alert.cleared'
  | 'notification.new'
  | 'approval.pending'
  | 'approval.resolved'
  | 'task.assigned'
  | 'task.updated'
  | 'activity.new'
  | 'sla.warning'
  | 'sla.breached'
  | 'presence.changed'
  | 'permission.changed'
  | 'system.message'
  | 'connection.status';

export interface WebSocketMessage<TData = any> {
  type: WebSocketMessageType;
  channel: string;
  timestamp: string;
  sequence: number;
  data: TData;
}

// ═══════════════════════════════════════════════════════════════════════════
// CONNECTION STATUS
// ═══════════════════════════════════════════════════════════════════════════

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'offline' | 'failed';

export interface ConnectionState {
  status: ConnectionStatus;
  lastConnectedAt?: string;
  lastDisconnectedAt?: string;
  lastSequence: number;
  reconnectAttempts: number;
  missedEvents: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION
// ═══════════════════════════════════════════════════════════════════════════

export interface Subscription {
  id: string;
  channel: string;
  permissionKey?: string;
  lastSequence: number;
  createdAt: string;
  isActive: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT CATALOGUE METADATA
// ═══════════════════════════════════════════════════════════════════════════

export interface EventCatalogueEntry {
  eventType: EventType;
  description: string;
  payloadSchema: string;        // JSON Schema reference
  channel: ChannelType;
  permissionKey: string;
  requiresOrdering: boolean;    // Whether sequence matters
  affectsKpis?: string[];       // KPIs this event invalidates
}

export const EVENT_CATALOGUE: Record<EventType, EventCatalogueEntry> = {
  // Projects
  'project.created': {
    eventType: 'project.created',
    description: 'A new project was created',
    payloadSchema: 'project-payload',
    channel: 'company:exec',
    permissionKey: 'project.project.view',
    requiresOrdering: false,
    affectsKpis: ['project.count', 'project.active_count'],
  },
  'project.status_changed': {
    eventType: 'project.status_changed',
    description: 'Project status changed',
    payloadSchema: 'project-status-payload',
    channel: 'project:activity',
    permissionKey: 'project.project.view',
    requiresOrdering: true,
    affectsKpis: ['project.active_count', 'project.completed_count'],
  },
  'project.progress_updated': {
    eventType: 'project.progress_updated',
    description: 'Project progress percentage updated',
    payloadSchema: 'project-progress-payload',
    channel: 'project:kpi',
    permissionKey: 'project.project.view',
    requiresOrdering: true,
    affectsKpis: ['project.physical_progress', 'project.cost_variance'],
  },
  
  // Procurement
  'purchase_order.approved': {
    eventType: 'purchase_order.approved',
    description: 'Purchase order was approved',
    payloadSchema: 'po-approval-payload',
    channel: 'project:activity',
    permissionKey: 'procure.po.view',
    requiresOrdering: true,
    affectsKpis: ['procurement.po_value_approved', 'procurement.po_pending_count'],
  },
  'purchase_order.delivery_overdue': {
    eventType: 'purchase_order.delivery_overdue',
    description: 'Purchase order delivery is overdue',
    payloadSchema: 'po-overdue-payload',
    channel: 'project:alerts',
    permissionKey: 'procure.po.view',
    requiresOrdering: false,
    affectsKpis: ['procurement.po_overdue_count', 'procurement.po_overdue_value'],
  },
  
  // Materials
  'grn.approved': {
    eventType: 'grn.approved',
    description: 'Goods receipt note was approved',
    payloadSchema: 'grn-approval-payload',
    channel: 'project:activity',
    permissionKey: 'store.grn.view',
    requiresOrdering: true,
    affectsKpis: ['store.grn_count', 'store.grn_value'],
  },
  'stock.below_reorder': {
    eventType: 'stock.below_reorder',
    description: 'Stock level fell below reorder point',
    payloadSchema: 'stock-reorder-payload',
    channel: 'project:alerts',
    permissionKey: 'store.stock.view',
    requiresOrdering: false,
    affectsKpis: ['store.low_stock_count'],
  },
  
  // Billing
  'ra_bill.certified': {
    eventType: 'ra_bill.certified',
    description: 'RA bill was certified',
    payloadSchema: 'bill-certification-payload',
    channel: 'project:activity',
    permissionKey: 'bill.client.view',
    requiresOrdering: true,
    affectsKpis: ['billing.certified_value', 'billing.pending_certification_count'],
  },
  
  // Finance
  'voucher.posted': {
    eventType: 'voucher.posted',
    description: 'Journal voucher was posted',
    payloadSchema: 'voucher-posting-payload',
    channel: 'project:activity',
    permissionKey: 'finance.voucher.view',
    requiresOrdering: true,
    affectsKpis: ['finance.voucher_count', 'finance.posted_value'],
  },
  
  // Workflow
  'approval.requested': {
    eventType: 'approval.requested',
    description: 'Approval was requested from user',
    payloadSchema: 'approval-request-payload',
    channel: 'approval',
    permissionKey: 'workflow.approval.view',
    requiresOrdering: true,
    affectsKpis: ['workflow.pending_approval_count'],
  },
  'approval.granted': {
    eventType: 'approval.granted',
    description: 'Approval was granted',
    payloadSchema: 'approval-grant-payload',
    channel: 'approval',
    permissionKey: 'workflow.approval.view',
    requiresOrdering: true,
    affectsKpis: ['workflow.pending_approval_count', 'workflow.approved_count'],
  },
  
  // System
  'permission.invalidated': {
    eventType: 'permission.invalidated',
    description: 'User permissions changed - must re-fetch menu and dashboard',
    payloadSchema: 'permission-invalidation-payload',
    channel: 'user',
    permissionKey: 'user.profile.view',
    requiresOrdering: true,
  },
  'notification.created': {
    eventType: 'notification.created',
    description: 'New notification for user',
    payloadSchema: 'notification-payload',
    channel: 'user',
    permissionKey: 'notification.view',
    requiresOrdering: true,
  },
  
  // Add more as needed...
} as Record<EventType, EventCatalogueEntry>;

// ═══════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate a ULID (Universally Unique Lexicographically Sortable Identifier)
 * Simplified version - in production use a proper ULID library
 */
export function generateULID(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 15).toUpperCase();
  return `${timestamp}${random}`.substring(0, 26);
}

/**
 * Check if an event type is valid
 */
export function isValidEventType(eventType: string): eventType is EventType {
  return eventType in EVENT_CATALOGUE;
}

/**
 * Get catalogue entry for an event type
 */
export function getEventCatalogueEntry(eventType: EventType): EventCatalogueEntry | undefined {
  return EVENT_CATALOGUE[eventType];
}
