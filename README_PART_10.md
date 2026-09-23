# Part 10: Workflow & Approval Engine

## Overview

Part 10 implements the complete workflow and approval engine that routes all document approvals through configuration-driven workflows. This is a critical platform engine that ensures:

- **Approval routing is configuration, not code** — companies can change delegation of authority without code releases
- **Approver lists are computed and frozen at submission** — ensuring auditability
- **Re-validated at every decision** — catching revoked permissions
- **Every approval instance is immutable history** — steps are never edited

## Key Components

### 1. Database Schema

Created 7 new tables:

- **dx_workflow_definition** — Workflow definitions with versioning
- **dx_workflow_step** — Steps within a workflow (approvers, SLA, escalation)
- **dx_workflow_instance** — Running workflow instances (immutable)
- **dx_workflow_task** — Tasks assigned to approvers
- **dx_workflow_log** — Immutable audit log for workflow events
- **dx_substitution** — Out-of-office substitution rules
- **dx_working_calendar** — Working days/hours for SLA calculation

### 2. Approver Resolver (9 Rule Types)

The `ApproverResolver` implements 9 AME-style approver rule types:

1. **PERMISSION** — Users with a specific permission (e.g., `procure.po.approve`)
2. **AUTHORITY_CHAIN** — Walk up approval authority chain based on document value
3. **RESPONSIBILITY** — Users with a specific responsibility template
4. **SUPERVISOR_HIERARCHY** — Walk up the supervisor hierarchy
5. **SPECIFIC_USERS** — Explicit list of user IDs
6. **APPROVAL_GROUP** — Users in an approval group
7. **DOCUMENT_FIELD** — User ID from a document field (e.g., `projectManagerId`)
8. **COST_CODE_OWNER** — Owner of the cost code
9. **AUTO_APPROVE** — System auto-approval (explicit, logged)

**Sanitization Rules:**
- Removes self-approval (unless explicitly allowed)
- Removes SoD conflicts (anyone who performed conflicting action)
- Applies substitutions (inactive users, users on leave)
- Reports gaps rather than silently closing them

### 3. Workflow Engine

The `WorkflowEngine` implements the core workflow execution:

**Key Methods:**
- `start()` — Called when document is submitted, creates instance and activates first step
- `activateNextStep()` — Evaluates preconditions, resolves approvers, creates tasks
- `decide()` — Processes approval/rejection/return decisions
- `handleNegative()` — Handles rejection and return logic

**12-Step Execution Path:**
1. Permission check
2. Initialize context
3. Run determinations
4. Run validations
5. Allocate number (if applicable)
6. Set initial state
7. Persist document
8. Audit CREATE
9. Emit events
10. Start workflow (this part)
11. Activate first step
12. Assign tasks to approvers

### 4. SLA Service

The `SlaService` calculates due dates based on working calendars:

- Supports project-specific working days and holidays
- Skips non-working hours and days
- Calculates overdue duration
- Default calendar: Mon-Fri, 9am-6pm

### 5. Workflow Definitions (Seeds)

Shipped with 5 pre-configured workflows:

1. **PO_APPROVAL_WORKFLOW** — Purchase order approval with budget verification, commercial review, and value authority chain
2. **CLIENT_BILL_WORKFLOW** — Client bill approval with QS check, PM approval, and commercial head for large bills
3. **SC_BILL_WORKFLOW** — Subcontractor bill approval with site engineer verification, PM approval, and finance approval
4. **MB_WORKFLOW** — Measurement book certification with site engineer check and PM certification
5. **PAYMENT_WORKFLOW** — Payment approval with accounts verification and finance manager approval

### 6. Six Decision Actions

| Action | Behavior |
|--------|----------|
| **Approve** | Standard approval with optional note |
| **Reject** | Mandatory reason, terminates workflow |
| **Return for correction** | Mandatory reason, document returns to draft, new instance on resubmission |
| **Request information** | Pauses SLA clock, creates query task |
| **Delegate** | Reassign task to another eligible user |
| **Approve with conditions** | Approve and create follow-up task |

### 7. Approval Card Contract

The `ApprovalCard` interface defines what the API returns for each pending item:

- Document details (type, number, title, URL)
- Project and submitter information
- Value and currency
- Key figures for decision context
- Budget impact analysis
- Comparison with reference values
- Risk flags (computed server-side)
- Overrides applied (what submitter bypassed)
- Prior decisions in the workflow
- Attachments
- Allowed actions (computed from policy)

## Business Rules Enforced

| Rule | Severity | Description |
|------|----------|-------------|
| WF-01 | BLOCK | Submitter can never approve their own document (unless explicitly permitted) |
| WF-02 | BLOCK | Anyone who performed conflicting action is removed from approver list |
| WF-03 | BLOCK | Document exceeding all authority limits fails with NO_APPROVER_WITH_SUFFICIENT_AUTHORITY |
| WF-04 | BLOCK | DOCUMENT_CHANGED_SINCE_SUBMISSION if content hash changed |
| WF-05 | BLOCK | Rejection requires a reason |
| WF-06 | BLOCK | Editing active workflow definition not permitted (new version required) |
| WF-07 | BLOCK | AUTO_APPROVE on SLA breach only for explicitly declared document types |
| WF-08 | WARN | Approver on leave with no substitute reported as gap |
| WF-09 | BLOCK | Bulk approval capped at 20 items, each evaluated individually |

## Key Features

### Value-Driven Authority Chain

The most used rule type walks up the approval authority chain based on document value:

```typescript
// Example: PO worth ₹7.5 lakh
// Authority chain:
// - Level 1: ₹1 lakh limit (skip)
// - Level 2: ₹5 lakh limit (skip)
// - Level 3: ₹10 lakh limit (approve) ← stops here
```

### Escalation Rules

Configurable escalation stages:

```typescript
escalationRule: {
  stages: [
    { afterHours: 24, action: 'REMIND' },
    { afterHours: 48, action: 'NOTIFY_SUPERVISOR' },
    { afterHours: 96, action: 'REASSIGN', target: { ... } },
  ]
}
```

### Substitution (Out of Office)

- Substitute must independently hold permission and authority
- Substitution transfers the task, never the right
- Two-deep chain limit (then escalates)
- Every substituted decision records both users

### Content Hash Tamper Detection

- Document content hash computed at submission
- Re-validated at every decision
- Prevents: submit ₹2L PO → get approval → edit to ₹20L

### Working Calendar Support

- Project-specific working days and holidays
- SLA calculation skips non-working hours
- Example: 8-hour SLA set at 4pm Friday with Sunday holiday → due Monday

## File Structure

```
src/platform/workflow/
├── types.ts                    # All workflow types
├── approver-resolver.ts        # 9 approver rule types
├── workflow-engine.ts          # Core workflow execution
├── sla-service.ts              # SLA calculation with calendars
├── workflow-seeds.ts           # Pre-configured workflows
└── index.ts                    # Module exports

migrations/
└── 010_create_workflow_engine.sql  # Database schema
```

## Usage Examples

### Starting a Workflow

```typescript
// When document is submitted
const instance = await workflowEngine.start(ctx, {
  documentType: 'PO',
  id: 123,
  projectId: 456,
  value: 750000,
  submittedBy: 101,
  attributes: { budgetStatus: 'OK', isNonL1: false },
  contentHash: 'abc123...',
});
```

### Processing a Decision

```typescript
// Approver makes a decision
await workflowEngine.decide(ctx, taskId, {
  type: 'APPROVE',
  note: 'Approved within budget',
});
```

### Querying Pending Tasks

```typescript
// Get all pending tasks for a user
const tasks = workflowEngine.getTasksForUser(userId, 'PENDING');
```

## Testing Requirements

1. **Routing tests** — Data-driven suite: (value, project, flags) → expected approver chain
2. **No-approver test** — Document exceeding all authority fails submission
3. **Self-approval test** — Submitter excluded from every step
4. **SoD test** — PO creator removed from approver list
5. **Concurrency test** — Two approvers hit ANY-completion simultaneously → exactly one decision
6. **Tamper test** — Approve after editing → DOCUMENT_CHANGED_SINCE_SUBMISSION
7. **Permission-revocation test** — Revoke approver permission after assignment → decision refused
8. **Substitution test** — Substitute with lower authority → escalation, not approval
9. **Calendar test** — 8-hour SLA at 4pm Friday with Sunday holiday → due Monday
10. **Version-freeze test** — Activating new definition doesn't alter running instances
11. **Return-and-resubmit test** — Prior approvals not carried forward

## Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All workflow components compile correctly
- Output: 695KB JS, 58KB CSS

## What Part 10 Does NOT Do

- ❌ Does not implement actual database persistence (uses in-memory Maps)
- ❌ Does not implement actual working calendar queries
- ❌ Does not implement actual escalation batch job
- ❌ Does not implement actual notification sending (emits events)
- ❌ Does not implement Approval Centre UI (Part 23)

**Part 10 defines the workflow engine contracts and services. Actual database integration and UI happen in later parts.**

## Next Steps

**Part 11: Posting Engines**
- Stock ledger posting service
- General ledger posting service
- Period lock service

---

**Part 10 of 69 — Complete** ✅  
**Progress: 14.5% of total build**  
**Next: Part 11 — Posting Engines**
