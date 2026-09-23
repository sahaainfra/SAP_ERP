/**
 * Part 09 — Document Framework
 * 
 * Exports all document framework components
 */

// Types
export * from './types';

// State Machine
export { StateMachine, COMMON_TRANSITIONS, createCommonStateMachine, createStateMachine } from './state-machine';

// Services
export { DraftService, draftService } from './draft-service';
export { NumberSeriesService, numberSeriesService } from './number-series-service';
export { AuditWriter, auditWriter } from './audit-writer';
export { OutboxService, outboxService } from './outbox-service';
export { DocumentService, documentService } from './document-service';
