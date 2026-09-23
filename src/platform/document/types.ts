/**
 * Part 09 — Document Framework Types
 * 
 * Defines the complete document framework including:
 * - Document Definition contract
 * - 19-state vocabulary
 * - State machine
 * - Determinations
 * - Actions
 * - Draft handling
 * - Number series
 * - Audit log
 * - Event outbox
 */

import { PermissionKey } from '../permission/types';
import { Actor } from '../permission/actor';
import { UowContext } from '../uow/UnitOfWork';

// ═══════════════════════════════════════════════════════════════════════════
// 19-STATE VOCABULARY
// ═══════════════════════════════════════════════════════════════════════════

export const DOCUMENT_STATES = [
  'DRAFT',
  'SUBMITTED',
  'PENDING_APPROVAL',
  'PARTIALLY_APPROVED',
  'APPROVED',
  'REJECTED',
  'RETURNED',
  'RELEASED',
  'IN_PROGRESS',
  'PARTIALLY_EXECUTED',
  'EXECUTED',
  'CERTIFIED',
  'POSTED',
  'PARTIALLY_PAID',
  'PAID',
  'CLOSED',
  'CANCELLED',
  'SUPERSEDED',
  'ON_HOLD',
] as const;

export type DocumentState = typeof DOCUMENT_STATES[number];

export const TERMINAL_STATES: DocumentState[] = [
  'CERTIFIED',
  'POSTED',
  'PAID',
  'CLOSED',
  'CANCELLED',
  'SUPERSEDED',
];

export function isTerminalState(state: DocumentState): boolean {
  return TERMINAL_STATES.includes(state);
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE MACHINE
// ═══════════════════════════════════════════════════════════════════════════

export interface StateTransition {
  from: DocumentState;
  to: DocumentState;
  action: string;
}

export class StateMachine {
  constructor(private transitions: StateTransition[]) {}

  assert(from: DocumentState, to: DocumentState, action: string): void {
    const ok = this.transitions.some(
      t => t.from === from && t.to === to && t.action === action
    );
    if (!ok) {
      throw new Error(
        `Invalid state transition: ${from} → ${to} via ${action}. ` +
        `Allowed: ${this.allowedFrom(from).map(t => t.to).join(', ')}`
      );
    }
  }

  allowedFrom(from: DocumentState): StateTransition[] {
    return this.transitions.filter(t => t.from === from);
  }

  isTerminal(state: DocumentState): boolean {
    return isTerminalState(state);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

export interface DocContext<THeader, TLine = any> {
  def: DocumentDefinition<THeader, TLine>;
  header: THeader;
  lines: TLine[];
  actor: Actor;
  isNew: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// DETERMINATION
// ═══════════════════════════════════════════════════════════════════════════

export interface Determination<THeader, TLine = any> {
  name: string;
  triggers: string[]; // field paths that cause re-run
  run(ctx: UowContext, c: DocContext<THeader, TLine>): Promise<DocContext<THeader, TLine>>;
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT ACTION
// ═══════════════════════════════════════════════════════════════════════════

export type DeviceClass = 'PHONE' | 'TABLET' | 'DESKTOP';

export interface DocumentAction<THeader, TLine = any> {
  name: string; // 'submit' | 'approve' | 'release' | 'cancel'
  permission: PermissionKey;
  fromStates: DocumentState[];
  toState: DocumentState | ((c: DocContext<THeader, TLine>) => DocumentState);
  policy?: string; // Part 08 ActionPolicy key
  requiresReason?: boolean;
  requiresTwoPerson?: boolean;
  idempotent: boolean;
  preconditions?: any[]; // BusinessRule<DocContext<THeader, TLine>>[]
  execute(ctx: UowContext, c: DocContext<THeader, TLine>, input: unknown): Promise<void>;
  emits: string[]; // outbox event types
  deviceRestricted?: DeviceClass[];
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT DEFINITION
// ═══════════════════════════════════════════════════════════════════════════

export interface DocumentStorage {
  legacyEntity?: string; // existing table name
  extensionTable?: string; // dx_*_extension
  ownTable?: string; // dx_* when wholly new
  lineStorage?: {
    legacyEntity?: string;
    extensionTable?: string;
    ownTable?: string;
  };
}

export interface DocumentNumbering {
  seriesCode: string;
  allocateOn: 'SUBMIT' | 'CREATE' | 'POST';
}

export interface DocumentDefinition<THeader, TLine = any> {
  type: string; // 'PO', 'MB', 'CLIENT_BILL'
  label: string;
  storage: DocumentStorage;
  numbering: DocumentNumbering;
  states: StateMachine;
  determinations: Determination<THeader, TLine>[];
  validations: any[]; // BusinessRule<DocContext<THeader, TLine>>[]
  actions: DocumentAction<THeader, TLine>[];
  hashFields: (keyof THeader | string)[];
  workflowCode?: string;
  postingRules?: string[];
  permissionPrefix: string; // 'procure.po'
  printTemplates?: string[];
  draftable: boolean;
  offlineCapable: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT INPUT/RESULT
// ═══════════════════════════════════════════════════════════════════════════

export interface DocInput<THeader, TLine = any> {
  header: THeader;
  lines?: TLine[];
}

export interface DocResult<THeader> {
  id: number;
  header: THeader;
  warnings?: any[];
}

export interface ExecOpts {
  overrides?: any[];
}

// ═══════════════════════════════════════════════════════════════════════════
// DRAFT
// ═══════════════════════════════════════════════════════════════════════════

export interface DocumentDraft {
  id: number;
  documentType: string;
  activeId: number | null;
  ownerUserId: number;
  projectId?: number;
  payload: any;
  baseVersion?: string;
  deviceId?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export interface DraftRef {
  id: number;
  expiresAt: string;
}

export interface ActivationResult<THeader> {
  id: number;
  header: THeader;
}

// ═══════════════════════════════════════════════════════════════════════════
// NUMBER SERIES
// ═══════════════════════════════════════════════════════════════════════════

export type SeriesScopeType = 'GLOBAL' | 'COMPANY' | 'PROJECT';

export interface NumberSeries {
  id: number;
  seriesCode: string;
  documentType: string;
  scopeType: SeriesScopeType;
  scopeId?: number;
  fiscalYear?: string;
  pattern: string;
  currentValue: number;
  maxValue?: number;
  padding: number;
  warnThreshold?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SeriesScope {
  projectId?: number;
  projectCode?: string;
  companyId?: number;
  companyCode?: string;
  siteCode?: string;
  date?: Date;
}

export interface NumberAllocation {
  id: number;
  seriesId: number;
  allocatedValue: number;
  documentNumber: string;
  documentType: string;
  allocatedBy: number;
  allocatedAt: string;
  correlationId: string;
}

export interface NumberGap {
  id: number;
  seriesId: number;
  gapValue: number;
  correlationId: string;
  reason?: string;
  detectedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// AUDIT LOG
// ═══════════════════════════════════════════════════════════════════════════

export interface AuditLogEntry {
  id: number;
  entity: string;
  entityId: number;
  action: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  documentType?: string;
  projectId?: number;
  companyId?: number;
  actorUserId: number;
  impersonatedBy?: number;
  correlationId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceClass?: string;
  reason?: string;
  occurredAt: string;
  prevHash: string;
  rowHash: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// EVENT OUTBOX
// ═══════════════════════════════════════════════════════════════════════════

export type OutboxStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED' | 'DEAD';

export interface OutboxEvent {
  id: number;
  eventType: string;
  aggregateType: string;
  aggregateId: number;
  projectId?: number;
  companyId?: number;
  payload: any;
  correlationId: string;
  causationId?: string;
  actorUserId?: number;
  occurredAt: string;
  status: OutboxStatus;
  attempts: number;
  nextAttemptAt?: string;
  lastError?: string;
  processedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// TWO-PERSON ACTION
// ═══════════════════════════════════════════════════════════════════════════

export interface TwoPersonRequest {
  id: number;
  documentType: string;
  documentId: number;
  action: string;
  firstActorId: number;
  expiresAt: string;
  secondActorId?: number;
  completedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// CORRECTION PATH
// ═══════════════════════════════════════════════════════════════════════════

export const CORRECTION_PATH: Record<string, string> = {
  MB: 'Create a revised MB (supersedes; downstream quantities recompute)',
  VOUCHER: 'Create a reversal voucher + fresh posting',
  PAYROLL: 'Create a supplementary payroll run',
  CLIENT_BILL: 'Create adjustment in next RA bill or supplementary bill',
  STOCK_MOVEMENT: 'Create reversal ledger row referencing original',
  INCIDENT: 'Create addendum record',
};
