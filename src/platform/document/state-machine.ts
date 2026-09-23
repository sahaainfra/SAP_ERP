/**
 * Part 09 — State Machine
 * 
 * Implements the 19-state vocabulary and state transition validation.
 * Every document uses a subset of these states with declared transitions.
 */

import { DocumentState, StateTransition, TERMINAL_STATES } from './types';

export class StateMachine {
  private transitions: StateTransition[];

  constructor(transitions: StateTransition[]) {
    this.transitions = transitions;
  }

  /**
   * Assert that a state transition is valid
   */
  assert(from: DocumentState, to: DocumentState, action: string): void {
    const ok = this.transitions.some(
      t => t.from === from && t.to === to && t.action === action
    );
    if (!ok) {
      const allowed = this.allowedFrom(from);
      throw new Error(
        `Invalid state transition: ${from} → ${to} via ${action}. ` +
        `Allowed transitions from ${from}: ${allowed.map(t => `${t.to} (via ${t.action})`).join(', ') || 'none'}`
      );
    }
  }

  /**
   * Get all allowed transitions from a state
   */
  allowedFrom(from: DocumentState): StateTransition[] {
    return this.transitions.filter(t => t.from === from);
  }

  /**
   * Check if a state is terminal (immutable)
   */
  isTerminal(state: DocumentState): boolean {
    return TERMINAL_STATES.includes(state);
  }

  /**
   * Check if a transition is valid
   */
  isValid(from: DocumentState, to: DocumentState, action: string): boolean {
    return this.transitions.some(
      t => t.from === from && t.to === to && t.action === action
    );
  }

  /**
   * Get all states reachable from a given state
   */
  reachableFrom(from: DocumentState): DocumentState[] {
    return this.allowedFrom(from).map(t => t.to);
  }

  /**
   * Get all actions available from a given state
   */
  actionsFrom(from: DocumentState): string[] {
    return this.allowedFrom(from).map(t => t.action);
  }
}

/**
 * Common state transitions for documents
 */
export const COMMON_TRANSITIONS: StateTransition[] = [
  // Draft lifecycle
  { from: 'DRAFT', to: 'SUBMITTED', action: 'submit' },
  { from: 'DRAFT', to: 'CANCELLED', action: 'cancel' },
  
  // Approval workflow
  { from: 'SUBMITTED', to: 'PENDING_APPROVAL', action: 'submit' },
  { from: 'PENDING_APPROVAL', to: 'APPROVED', action: 'approve' },
  { from: 'PENDING_APPROVAL', to: 'PARTIALLY_APPROVED', action: 'approve' },
  { from: 'PENDING_APPROVAL', to: 'REJECTED', action: 'reject' },
  { from: 'PENDING_APPROVAL', to: 'RETURNED', action: 'return' },
  
  // After approval
  { from: 'APPROVED', to: 'RELEASED', action: 'release' },
  { from: 'APPROVED', to: 'CANCELLED', action: 'cancel' },
  { from: 'PARTIALLY_APPROVED', to: 'APPROVED', action: 'approve' },
  { from: 'PARTIALLY_APPROVED', to: 'REJECTED', action: 'reject' },
  
  // Execution
  { from: 'RELEASED', to: 'IN_PROGRESS', action: 'start' },
  { from: 'IN_PROGRESS', to: 'EXECUTED', action: 'complete' },
  { from: 'IN_PROGRESS', to: 'PARTIALLY_EXECUTED', action: 'partial_complete' },
  { from: 'PARTIALLY_EXECUTED', to: 'EXECUTED', action: 'complete' },
  { from: 'EXECUTED', to: 'CERTIFIED', action: 'certify' },
  
  // Posting
  { from: 'CERTIFIED', to: 'POSTED', action: 'post' },
  { from: 'APPROVED', to: 'POSTED', action: 'post' },
  
  // Payment
  { from: 'POSTED', to: 'PARTIALLY_PAID', action: 'partial_pay' },
  { from: 'POSTED', to: 'PAID', action: 'pay' },
  { from: 'PARTIALLY_PAID', to: 'PAID', action: 'pay' },
  
  // Closure
  { from: 'PAID', to: 'CLOSED', action: 'close' },
  { from: 'EXECUTED', to: 'CLOSED', action: 'close' },
  { from: 'CERTIFIED', to: 'CLOSED', action: 'close' },
  
  // Hold
  { from: 'DRAFT', to: 'ON_HOLD', action: 'hold' },
  { from: 'SUBMITTED', to: 'ON_HOLD', action: 'hold' },
  { from: 'ON_HOLD', to: 'DRAFT', action: 'resume' },
  { from: 'ON_HOLD', to: 'SUBMITTED', action: 'resume' },
  
  // Supersede
  { from: 'DRAFT', to: 'SUPERSEDED', action: 'supersede' },
  { from: 'SUBMITTED', to: 'SUPERSEDED', action: 'supersede' },
];

/**
 * Create a state machine with common transitions
 */
export function createCommonStateMachine(): StateMachine {
  return new StateMachine(COMMON_TRANSITIONS);
}

/**
 * Create a custom state machine
 */
export function createStateMachine(transitions: StateTransition[]): StateMachine {
  return new StateMachine(transitions);
}
