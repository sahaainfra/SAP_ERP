/**
 * Part 10 — Workflow Definitions (Seed Data)
 * 
 * Configuration-driven workflow definitions for common document types.
 * These are shipped as seeds and can be modified by administrators.
 */

import { WorkflowDefinitionSeed } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// PURCHASE ORDER WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════

export const PO_APPROVAL_WORKFLOW: WorkflowDefinitionSeed = {
  workflowCode: 'PO_STANDARD',
  documentType: 'PO',
  scopeType: 'GLOBAL',
  version: 1,
  description: 'Standard purchase order approval workflow',
  steps: [
    {
      stepNo: 10,
      stepName: 'Budget Verification',
      stepType: 'APPROVAL',
      precondition: { op: 'eq', field: 'budgetStatus', value: 'EXCEEDED' },
      approverRule: {
        type: 'PERMISSION',
        key: 'procure.po.budget_override',
        scope: 'PROJECT',
      },
      slaHours: 8,
      completionRule: 'ANY',
    },
    {
      stepNo: 20,
      stepName: 'Commercial Review',
      stepType: 'APPROVAL',
      precondition: {
        op: 'or',
        children: [
          { op: 'gte', field: 'value', value: 500000 },
          { op: 'eq', field: 'isNonL1', value: true },
        ],
      },
      approverRule: {
        type: 'RESPONSIBILITY',
        templateCode: 'COMMERCIAL_MANAGER',
      },
      slaHours: 16,
      completionRule: 'ALL',
    },
    {
      stepNo: 30,
      stepName: 'Value Authority Chain',
      stepType: 'APPROVAL',
      approverRule: {
        type: 'AUTHORITY_CHAIN',
        documentType: 'PO',
        startLevel: 1,
      },
      slaHours: 24,
      completionRule: 'ALL',
      isFinal: true,
      escalationRule: {
        stages: [
          { afterHours: 24, action: 'REMIND' },
          { afterHours: 48, action: 'NOTIFY_SUPERVISOR' },
          {
            afterHours: 96,
            action: 'REASSIGN',
            target: {
              type: 'PERMISSION',
              key: 'procure.po.approve',
              scope: 'COMPANY',
            },
          },
        ],
      },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// CLIENT BILL WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════

export const CLIENT_BILL_WORKFLOW: WorkflowDefinitionSeed = {
  workflowCode: 'CLIENT_BILL_STD',
  documentType: 'CLIENT_BILL',
  scopeType: 'GLOBAL',
  version: 1,
  description: 'Standard client bill approval workflow',
  steps: [
    {
      stepNo: 10,
      stepName: 'QS Check',
      stepType: 'APPROVAL',
      approverRule: {
        type: 'PERMISSION',
        key: 'bill.client.check',
        scope: 'PROJECT',
      },
      slaHours: 16,
      completionRule: 'ANY',
    },
    {
      stepNo: 20,
      stepName: 'Project Manager Approval',
      stepType: 'APPROVAL',
      approverRule: {
        type: 'RESPONSIBILITY',
        templateCode: 'PROJECT_MANAGER',
      },
      slaHours: 24,
      completionRule: 'ALL',
    },
    {
      stepNo: 30,
      stepName: 'Commercial Head',
      stepType: 'APPROVAL',
      precondition: { op: 'gte', field: 'value', value: 5000000 },
      approverRule: {
        type: 'AUTHORITY_CHAIN',
        documentType: 'CLIENT_BILL',
        startLevel: 2,
      },
      slaHours: 24,
      completionRule: 'ALL',
      isFinal: true,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// SUBCONTRACTOR BILL WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════

export const SC_BILL_WORKFLOW: WorkflowDefinitionSeed = {
  workflowCode: 'SC_BILL_STD',
  documentType: 'SC_BILL',
  scopeType: 'GLOBAL',
  version: 1,
  description: 'Standard subcontractor bill approval workflow',
  steps: [
    {
      stepNo: 10,
      stepName: 'Site Engineer Verification',
      stepType: 'APPROVAL',
      approverRule: {
        type: 'PERMISSION',
        key: 'bill.sc.verify',
        scope: 'PROJECT',
      },
      slaHours: 8,
      completionRule: 'ANY',
    },
    {
      stepNo: 20,
      stepName: 'Project Manager Approval',
      stepType: 'APPROVAL',
      approverRule: {
        type: 'RESPONSIBILITY',
        templateCode: 'PROJECT_MANAGER',
      },
      slaHours: 16,
      completionRule: 'ALL',
    },
    {
      stepNo: 30,
      stepName: 'Finance Approval',
      stepType: 'APPROVAL',
      approverRule: {
        type: 'AUTHORITY_CHAIN',
        documentType: 'SC_BILL',
        startLevel: 1,
      },
      slaHours: 24,
      completionRule: 'ALL',
      isFinal: true,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// MEASUREMENT BOOK WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════

export const MB_WORKFLOW: WorkflowDefinitionSeed = {
  workflowCode: 'MB_STD',
  documentType: 'MB',
  scopeType: 'GLOBAL',
  version: 1,
  description: 'Standard measurement book certification workflow',
  steps: [
    {
      stepNo: 10,
      stepName: 'Site Engineer Check',
      stepType: 'APPROVAL',
      approverRule: {
        type: 'PERMISSION',
        key: 'mb.entry.check',
        scope: 'PROJECT',
      },
      slaHours: 8,
      completionRule: 'ANY',
    },
    {
      stepNo: 20,
      stepName: 'Project Manager Certification',
      stepType: 'APPROVAL',
      approverRule: {
        type: 'RESPONSIBILITY',
        templateCode: 'PROJECT_MANAGER',
      },
      slaHours: 16,
      completionRule: 'ALL',
      isFinal: true,
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// PAYMENT WORKFLOW
// ═══════════════════════════════════════════════════════════════════════════

export const PAYMENT_WORKFLOW: WorkflowDefinitionSeed = {
  workflowCode: 'PAYMENT_STD',
  documentType: 'PAYMENT',
  scopeType: 'GLOBAL',
  version: 1,
  description: 'Standard payment approval workflow',
  steps: [
    {
      stepNo: 10,
      stepName: 'Accounts Verification',
      stepType: 'APPROVAL',
      approverRule: {
        type: 'PERMISSION',
        key: 'finance.payment.verify',
        scope: 'PROJECT',
      },
      slaHours: 8,
      completionRule: 'ANY',
    },
    {
      stepNo: 20,
      stepName: 'Finance Manager Approval',
      stepType: 'APPROVAL',
      approverRule: {
        type: 'AUTHORITY_CHAIN',
        documentType: 'PAYMENT',
        startLevel: 1,
      },
      slaHours: 16,
      completionRule: 'ALL',
      isFinal: true,
      escalationRule: {
        stages: [
          { afterHours: 16, action: 'REMIND' },
          { afterHours: 32, action: 'NOTIFY_SUPERVISOR' },
        ],
      },
    },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL WORKFLOWS
// ═══════════════════════════════════════════════════════════════════════════

export const WORKFLOW_SEEDS: WorkflowDefinitionSeed[] = [
  PO_APPROVAL_WORKFLOW,
  CLIENT_BILL_WORKFLOW,
  SC_BILL_WORKFLOW,
  MB_WORKFLOW,
  PAYMENT_WORKFLOW,
];
