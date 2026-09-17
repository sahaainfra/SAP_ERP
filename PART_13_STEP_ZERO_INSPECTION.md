# Part 13 — Step Zero Inspection Report

## Existing Planning & Scheduling Tables

Based on `src/config/schema-map.ts`, the following planning-related tables exist:

### Activity & Task Management
| Business Object | Table | PK | Status Field | Progress Tracking | Notes |
|---|---|---|---|---|---|
| Task | `tasks` | id | status | — | Generic task management, not construction-specific |
| Activity | NOT PRESENT | — | — | — | No activity table exists |

### Project Progress
| Business Object | Table | PK | Progress Field | Calculation Method | Notes |
|---|---|---|---|---|---|
| Project | `projects` | id | progress_percentage | Unknown | Currently displayed but calculation method not documented |

### Milestones
| Business Object | Table | PK | Notes |
|---|---|---|---|
| Milestone | NOT PRESENT | — | No milestone table exists |

### WBS / Schedule
| Business Object | Table | PK | Notes |
|---|---|---|---|
| WBS | NOT PRESENT | — | No WBS structure exists |
| Schedule Activity | NOT PRESENT | — | No schedule activities exist |
| Activity Relation | NOT PRESENT | — | No dependencies exist |
| Baseline | NOT PRESENT | — | No baseline tracking exists |

### Resource Planning
| Business Object | Table | PK | Notes |
|---|---|---|---|
| Resource Plan | NOT PRESENT | — | No resource planning exists |
| Resource Norm | NOT PRESENT | — | No consumption norms exist |

### Look-ahead & Constraints
| Business Object | Table | PK | Notes |
|---|---|---|---|
| Look-ahead | NOT PRESENT | — | No look-ahead planning exists |
| Constraint | NOT PRESENT | — | No constraint/obstruction tracking exists |

### Progress Measurement
| Business Object | Table | PK | Notes |
|---|---|---|---|
| Progress Entry | NOT PRESENT | — | No progress measurement exists |
| Progress Snapshot | NOT PRESENT | — | No historical progress data exists |

---

## Existing Hierarchy Edges

### Current Parent-Child Relationships
- `packages.project_id` → `projects.id`
- `sites.project_id` → `projects.id`
- `sites.package_id` → `packages.id`
- `dx_org_node.parent_id` → `dx_org_node.id` (enterprise hierarchy from Part 12)

### Missing Hierarchy
- ❌ No WBS hierarchy (work breakdown structure)
- ❌ No activity dependencies (predecessor/successor)
- ❌ No baseline versions
- ❌ No progress roll-up structure

---

## Existing Progress Calculation

### Current State
- `projects.progress_percentage` exists but calculation method is **unknown**
- No documented formula for how progress is derived
- No audit trail for progress changes
- No distinction between planned vs actual progress
- No earned value calculation

### Required for Part 13
- 6 declared progress methods (QUANTITY, MILESTONE, STEP, DURATION, UNITS, MANUAL)
- Progress derived from certified MB quantities (QUANTITY method)
- Progress roll-up through WBS hierarchy
- Baseline-controlled schedule with critical path
- Physical progress measurement with audit trail
- Legacy progress preserved as `legacy_progress_pct`

---

## External Scheduling Tool Integration

### Current State
- ❌ No MS Project import capability
- ❌ No Primavera XER import
- ❌ No Excel schedule import

### Required for Part 13
- MS Project XML import with mapping preview
- Primavera XER import
- Excel import with validation
- Import never overwrites actuals
- Conflict detection for activities with actual dates

---

## GAP LIST

### Critical Gaps for Part 13

1. **WBS Structure**
   - ❌ No WBS table
   - ❌ No WBS-BOQ mapping
   - ❌ No weightage system
   - **Need:** `dx_wbs`, `dx_wbs_boq_map`

2. **Schedule & Baseline**
   - ❌ No schedule activity table
   - ❌ No activity relations (dependencies)
   - ❌ No baseline tracking
   - ❌ No CPM calculation
   - **Need:** `dx_schedule_activity`, `dx_activity_relation`, `dx_baseline`, `dx_baseline_activity`

3. **Physical Progress**
   - ❌ No progress entry table
   - ❌ No progress methods
   - ❌ No progress roll-up
   - ❌ No progress snapshots
   - **Need:** `dx_progress_entry`, `dx_progress_snapshot`

4. **Look-ahead Planning**
   - ❌ No look-ahead table
   - ❌ No look-ahead tasks
   - ❌ No constraint/obstruction tracking
   - ❌ No PPC calculation
   - **Need:** `dx_lookahead`, `dx_lookahead_task`, `dx_constraint`

5. **Resource Planning**
   - ❌ No resource plan table
   - ❌ No resource norms
   - ❌ No material requirement planning
   - ❌ No manpower histogram
   - **Need:** `dx_resource_plan`, `dx_resource_norm`

6. **Progress Calculation**
   - ❌ Unknown current progress calculation
   - ❌ No planned vs actual tracking
   - ❌ No earned value integration
   - **Need:** Document existing method, preserve as `legacy_progress_pct`, implement new methods

---

## Existing Progress Figure Analysis

### Current Display
- `projects.progress_percentage` is displayed in:
  - Project list (ProjectsPage)
  - Project 360 header
  - Dashboard KPIs
  - Analytics EVM panel

### Unknown Aspects
- ❓ How is it calculated? (manual entry? derived from activities? weighted average?)
- ❓ Is it planned or actual progress?
- ❓ Is it physical or financial progress?
- ❓ Is it audited?
- ❓ Can it be overridden?

### Action Required
1. Document the current calculation method
2. Preserve the existing figure as `legacy_progress_pct`
3. Display both legacy and new computed progress side-by-side
4. Allow business to sign off on switchover

---

## Summary

### What Exists
✅ Basic task management (generic, not construction-specific)
✅ Project progress percentage (calculation unknown)
✅ Enterprise hierarchy (from Part 12)
✅ BOQ structure (from Part 12)
✅ Cost codes (from Part 12)

### What's Missing (Critical for Part 13)
❌ WBS structure with weightage
❌ Schedule activities with dependencies
❌ Baseline tracking (immutable snapshots)
❌ CPM calculation (forward/backward pass, float, critical path)
❌ Physical progress measurement (6 methods)
❌ Progress roll-up through WBS
❌ Look-ahead planning (weekly/fortnightly)
❌ Constraint/obstruction tracking
❌ Resource planning (manpower, material, equipment)
❌ Resource norms (consumption standards)
❌ Progress snapshots (daily grain for S-curve)
❌ Schedule import (MS Project, Primavera, Excel)
❌ Gantt chart visualization
❌ S-curve visualization
❌ Resource histogram
❌ DPR auto-assembly

### What Must Be Preserved
✅ Existing task records and IDs
✅ Existing project progress figure as `legacy_progress_pct`
✅ Existing milestone records (if any)
✅ All existing screens showing progress continue to work

---

## Next Steps

1. Create WBS structure tables
2. Create schedule and baseline tables
3. Create progress measurement tables
4. Create look-ahead and constraint tables
5. Create resource planning tables
6. Build WBS tree UI
7. Build Gantt chart UI
8. Build progress entry UI
9. Build look-ahead board UI
10. Build constraint register UI
11. Build S-curve UI
12. Build resource histogram UI
13. Implement CPM calculation
14. Implement progress roll-up
15. Implement baseline management
16. Implement schedule import
17. Build DPR auto-assembly

**Ready to proceed with implementation.**
