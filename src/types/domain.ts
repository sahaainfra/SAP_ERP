/**
 * Part 01 — Document State Vocabulary
 * 
 * The canonical set of document states. No module may introduce new states
 * outside this vocabulary without explicit justification in DB_CHANGELOG.md.
 * Terminal states are immutable — there is no unlock action.
 */

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

// ─── Module Registry ─────────────────────────────────────────────────────────

export const MODULE_NAMESPACES = [
  'admin', 'asset', 'audit', 'bd', 'bill', 'chat', 'config', 'dms',
  'finance', 'hr', 'hse', 'integration', 'knowledge', 'legal', 'lifecycle',
  'master', 'mb', 'numbering', 'permission', 'plan', 'plant', 'portal',
  'procure', 'project', 'qa', 'qs', 'report', 'rmc', 'sc', 'statutory',
  'store', 'tax', 'training', 'user', 'welfare', 'workflow',
] as const;

export type ModuleNamespace = typeof MODULE_NAMESPACES[number];

// ─── Action Verbs ────────────────────────────────────────────────────────────

export const ACTION_VERBS = [
  'view', 'create', 'edit', 'submit', 'verify', 'approve', 'reject',
  'post', 'cancel', 'print', 'export', 'delete', 'delegate', 'release',
  'certify', 'amend', 'override',
] as const;

export type ActionVerb = typeof ACTION_VERBS[number];

// ─── Permission Key Validator ────────────────────────────────────────────────

export function isValidPermissionKey(key: string): boolean {
  const parts = key.split('.');
  if (parts.length < 3) return false;
  const [module] = parts;
  return MODULE_NAMESPACES.includes(module as ModuleNamespace);
}

// ─── Event Type Validator ────────────────────────────────────────────────────

export function isValidEventType(type: string): boolean {
  const parts = type.split('.');
  if (parts.length < 3) return false;
  const [module] = parts;
  return MODULE_NAMESPACES.includes(module as ModuleNamespace);
}
