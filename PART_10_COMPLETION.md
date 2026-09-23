# Part 10 Completion Summary

## Part 10: Workflow & Approval Engine

**Status:** ✅ COMPLETE  
**Date:** 2026-01-XX  
**Progress:** 10 of 69 parts (14.5%)

---

## What Was Delivered

### Database Layer

**Migration:** `migrations/010_create_workflow_engine.sql`

Created 7 new tables:
1. **dx_workflow_definition** — Workflow definitions with versioning
2. **dx_workflow_step** — Steps with approver rules, SLA, escalation
3. **dx_workflow_instance** — Running workflow instances (immutable)
4. **dx_workflow_task** — Tasks assigned to approvers
5. **dx_workflow_log** — Immutable audit log
6. **dx_substitution** — Out-of-office substitution rules
7. **dx_working_calendar** — Working days/hours for SLA

### Core Components

**1. Approver Resolver** (`approver-resolver.ts`)
- 9 approver rule types (AME-style action types):
  - PERMISSION — Users with specific permission
  - AUTHORITY_CHAIN — Walk up approval authority chain
  - RESPONSIBILITY — Users with responsibility template
  - SUPERVISOR_HIERARCHY — Walk up supervisor hierarchy
  - SPECIFIC_USERS — Explicit user list
  - APPROVAL_GROUP — Approval group members
  - DOCUMENT_FIELD — User from document field
  - COST_CODE_OWNER — Cost code owner
  - AUTO_APPROVE — System auto-approval
- Sanitization rules:
  - Remove self-approval
  - Remove SoD conflicts
  - Apply substitutions
  - Report gaps

**2. Workflow Engine** (`workflow-engine.ts`)
- `start()` — Initialize workflow on document submission
- `activateNextStep()` — Evaluate preconditions, resolve approvers, create tasks
- `decide()` — Process 6 decision actions
- `handleNegative()` — Handle rejection and return logic
- Immutable workflow history
- Content hash tamper detection

**3. SLA Service** (`sla-service.ts`)
- Working calendar support (project-specific)
- Due date calculation (skips non-working hours/days)
- Overdue duration tracking
- Default calendar: Mon-Fri, 9am-6pm

**4. Workflow Seeds** (`workflow-seeds.ts`)
- PO_APPROVAL_WORKFLOW — Budget verification → Commercial review → Value authority chain
- CLIENT_BILL_WORKFLOW — QS check → PM approval → Commercial head (for large bills)
- SC_BILL_WORKFLOW — Site engineer → PM → Finance
- MB_WORKFLOW — Site engineer check → PM certification
- PAYMENT_WORKFLOW — Accounts verification → Finance manager

### Six Decision Actions

| Action | Behavior |
|--------|----------|
| **Approve** | Standard approval with optional note |
| **Reject** | Mandatory reason, terminates workflow |
| **Return for correction** | Mandatory reason, document returns to draft |
| **Request information** | Pauses SLA, creates query task |
| **Delegate** | Reassign to another eligible user |
| **Approve with conditions** | Approve + create follow-up task |

### Key Features

**Value-Driven Authority Chain**
```typescript
// PO worth ₹7.5 lakh
// Authority chain:
// - Level 1: ₹1 lakh limit (skip)
// - Level 2: ₹5 lakh limit (skip)
// - Level 3: ₹10 lakh limit (approve) ← stops here
```

**Escalation Rules**
```typescript
escalationRule: {
  stages: [
    { afterHours: 24, action: 'REMIND' },
    { afterHours: 48, action: 'NOTIFY_SUPERVISOR' },
    { afterHours: 96, action: 'REASSIGN', target: { ... } },
  ]
}
```

**Substitution (Out of Office)**
- Substitute must independently hold permission and authority
- Two-deep chain limit (then escalates)
- Every substituted decision records both users

**Content Hash Tamper Detection**
- Document content hash computed at submission
- Re-validated at every decision
- Prevents: submit ₹2L PO → get approval → edit to ₹20L

**Working Calendar Support**
- Project-specific working days and holidays
- SLA calculation skips non-working hours
- Example: 8-hour SLA at 4pm Friday with Sunday holiday → due Monday

**Approval Card Contract**
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

---

## Business Rules Enforced

| Rule | Severity | Description |
|------|----------|-------------|
| WF-01 | BLOCK | Submitter can never approve own document |
| WF-02 | BLOCK | SoD conflicts removed from approver list |
| WF-03 | BLOCK | Document exceeding all authority fails submission |
| WF-04 | BLOCK | DOCUMENT_CHANGED_SINCE_SUBMISSION if content hash changed |
| WF-05 | BLOCK | Rejection requires reason |
| WF-06 | BLOCK | Editing active workflow not permitted |
| WF-07 | BLOCK | AUTO_APPROVE only for explicitly declared types |
| WF-08 | WARN | Approver on leave with no substitute reported as gap |
| WF-09 | BLOCK | Bulk approval capped at 20 items |

---

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

---

## Build Verification

```bash
npm run build
```

**Result:** ✅ Build successful
- TypeScript compiles without errors
- All workflow components compile correctly
- Output: 695KB JS, 58KB CSS

---

## What Part 10 Does NOT Do

- ❌ Does not implement actual database persistence (uses in-memory Maps)
- ❌ Does not implement actual working calendar queries
- ❌ Does not implement actual escalation batch job
- ❌ Does not implement actual notification sending (emits events)
- ❌ Does not implement Approval Centre UI (Part 23)

**Part 10 defines the workflow engine contracts and services. Actual database integration and UI happen in later parts.**

---

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

---

## Next Steps

**Part 11: Posting Engines**
- Stock ledger posting service
- General ledger posting service
- Period lock service

---

**Part 10 of 69 — Complete** ✅  
**Progress: 14.5% of total build**  
**Next: Part 11 — Posting Engines**
