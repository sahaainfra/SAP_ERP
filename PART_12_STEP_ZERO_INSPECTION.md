# Part 12 — Step Zero Inspection Report

## Existing Master Data Tables

Based on `src/config/schema-map.ts`, the following master data tables exist:

### Enterprise Structure
| Business Object | Table | PK | Status Field | Numbering | Soft Delete | Notes |
|---|---|---|---|---|---|---|
| Company | `companies` | id | — | — | — | Top-level org unit |
| Branch | `branches` | id | — | — | — | FK: company_id |
| Department | `departments` | id | — | — | — | FK: company_id, branch_id |
| User | `users` | id | is_active | — | — | FK: company_id, branch_id, department_id |
| Role | `roles` | id | — | — | — | FK: company_id |
| Permission | `permissions` | id | — | — | — | Standalone |

### Project Management
| Business Object | Table | PK | Status Field | Numbering | Soft Delete | Notes |
|---|---|---|---|---|---|---|
| Project | `projects` | id | status | project_code | deleted_at | FK: company_id, branch_id, client_id |
| Package | `packages` | id | status | package_code | — | FK: project_id |
| Site | `sites` | id | — | site_code | — | FK: project_id, package_id |
| Contract | `contracts` | id | status | contract_number | — | FK: project_id, client_id |

### Procurement Masters
| Business Object | Table | PK | Status Field | Numbering | Soft Delete | Notes |
|---|---|---|---|---|---|---|
| Vendor | `vendors` | id | status | vendor_code | — | FK: company_id, has GST/PAN |

### Material Masters
| Business Object | Table | PK | Status Field | Numbering | Soft Delete | Notes |
|---|---|---|---|---|---|---|
| Material | `material_master` | id | — | material_code | — | FK: company_id, has UoM, category |
| Store | `stores` | id | — | store_code | — | FK: project_id, site_id |

### HR Masters
| Business Object | Table | PK | Status Field | Numbering | Soft Delete | Notes |
|---|---|---|---|---|---|---|
| Employee | `employees` | id | status | employee_code | — | FK: company_id, branch_id, department_id |
| Labour | `labour` | id | status | labour_code | — | FK: project_id, site_id |

### Equipment Masters
| Business Object | Table | PK | Status Field | Numbering | Soft Delete | Notes |
|---|---|---|---|---|---|---|
| Equipment | `plant_equipment` | id | status | equipment_code | — | FK: company_id, has category |

### Finance Masters
| Business Object | Table | PK | Status Field | Numbering | Soft Delete | Notes |
|---|---|---|---|---|---|---|
| Chart of Accounts | `chart_of_accounts` | id | — | account_code | — | FK: company_id, has parent hierarchy |

---

## Missing Master Data (GAP LIST)

### Critical Gaps for Part 12

1. **Enterprise Hierarchy Materialization**
   - ❌ No closure/path table for fast subtree queries
   - ❌ No unified org node structure
   - **Need:** `dx_org_node` table with materialized paths

2. **Project Extensions**
   - ❌ No project profile (contract details, retention, LD, escalation)
   - ❌ No project configuration (behavior switches)
   - ❌ No project geofence
   - ❌ No project closure tracking
   - **Need:** `dx_project_profile`, `dx_project_config`

3. **BOQ Master**
   - ❌ No BOQ items table
   - ❌ No BOQ version control
   - ❌ No BOQ item extensions (cost code, WBS, measurement method)
   - **Need:** `dx_boq_item`, `dx_boq_version`, `dx_boq_item_extension`

4. **Item Master Extensions**
   - ❌ No category tree
   - ❌ No specification attributes (JSONB)
   - ❌ No HSN/SAC codes
   - ❌ No alternate UoMs with conversion
   - ❌ No brand/make alternatives
   - ❌ No shelf life, hazardous flag
   - ❌ No reorder defaults
   - ❌ No standard rate with effective dating
   - **Need:** `dx_item_extension`, `dx_item_category`, `dx_item_spec_attribute`

5. **UoM Governance**
   - ❌ No UoM master table
   - ❌ No UoM conversion table
   - **Need:** `dx_uom`, `dx_uom_conversion`

6. **Vendor/Client Extensions**
   - ❌ No compliance document tracking (GST, PAN, MSME, etc.)
   - ❌ No vendor performance scorecard
   - ❌ No vendor category
   - ❌ No approved vendor list per project
   - ❌ No client master (only referenced in projects/contracts)
   - **Need:** `dx_party_compliance`, `dx_vendor_scorecard`, `dx_vendor_category`, `dx_project_approved_vendor`, `dx_client`

7. **Cost Code Master**
   - ❌ No cost code table
   - ❌ No cost code hierarchy
   - **Need:** `dx_cost_code`

8. **Rate Masters**
   - ❌ No rate master table
   - ❌ No effective dating
   - ❌ No rate types (item, labour, equipment, subcontract, transport, overhead)
   - ❌ No rate contracts
   - **Need:** `dx_rate_master`, `dx_rate_contract`

9. **Numbering Series**
   - ❌ No numbering series governance
   - ❌ No series patterns
   - ❌ No gap tracking
   - **Need:** `dx_number_series`, `dx_number_gap`

10. **Master Data Governance**
    - ❌ No governance configuration
    - ❌ No change request workflow
    - ❌ No master audit trail (separate from general audit)
    - ❌ No duplicate detection
    - ❌ No merge tracking
    - **Need:** `dx_master_governance`, `dx_master_change_request`, `dx_master_audit`, `dx_master_merge`

11. **Data Quality**
    - ❌ No quality metrics
    - ❌ No duplicate candidate tracking
    - ❌ No orphan reference tracking
    - **Need:** `dx_master_quality_metric`, `dx_master_duplicate_candidate`

---

## Existing Hierarchy Edges

### Current Parent-Child Relationships
- `branches.company_id` → `companies.id`
- `departments.company_id` → `companies.id`
- `departments.branch_id` → `branches.id`
- `users.company_id` → `companies.id`
- `users.branch_id` → `branches.id`
- `users.department_id` → `departments.id`
- `projects.company_id` → `companies.id`
- `projects.branch_id` → `branches.id`
- `packages.project_id` → `projects.id`
- `sites.project_id` → `projects.id`
- `sites.package_id` → `packages.id`
- `contracts.project_id` → `projects.id`
- `employees.company_id` → `companies.id`
- `employees.branch_id` → `branches.id`
- `employees.department_id` → `departments.id`
- `chart_of_accounts.parent_account_id` → `chart_of_accounts.id` (self-referencing)

### Implicit Hierarchies (Need Materialization)
- Project → Package → Site (3 levels, no area/workfront/WBS/activity/costcode)
- Chart of Accounts (self-referencing, but no depth/path tracking)

---

## Existing Approval Behavior

### Current State
- **Masters are directly editable** — no approval workflow
- Only transactional documents (PO, GRN, MB, Bill) have approval workflows
- No governance on master data changes

### Required for Part 12
- Configurable approval on master create/update/deactivate
- Controlled fields that always require approval
- Change request workflow with approval routing
- Audit trail for all master changes

---

## Existing Uniqueness Constraints

### Current Constraints (from schema inspection)
- `vendors.vendor_code` — likely unique (not explicit in schema map)
- `material_master.material_code` — likely unique
- `employees.employee_code` — likely unique
- `equipment.equipment_code` — likely unique
- `chart_of_accounts.account_code` + `company_id` — likely unique

### Required for Part 12
- Cannot add constraints to existing tables
- New uniqueness rules enforced in application + `dx_` tables
- Duplicate detection via normalization + fuzzy matching

---

## Duplicate Scan Results

**Status:** Not yet performed (requires database access)

**Planned Queries:**
```sql
-- Vendor duplicates by GSTIN
SELECT gst_number, COUNT(*) as cnt
FROM vendors
WHERE gst_number IS NOT NULL
GROUP BY gst_number
HAVING COUNT(*) > 1;

-- Vendor duplicates by normalized name
SELECT UPPER(TRIM(REGEXP_REPLACE(vendor_name, '[^a-zA-Z0-9]', '', 'g'))) as normalized,
       COUNT(*) as cnt
FROM vendors
GROUP BY normalized
HAVING COUNT(*) > 1;

-- Material duplicates by code
SELECT material_code, COUNT(*) as cnt
FROM material_master
GROUP BY material_code
HAVING COUNT(*) > 1;

-- Employee duplicates by PAN (if exists)
-- Note: PAN field not in current schema, would need extension
```

**Action:** Report counts only, do not modify data.

---

## Orphan Scan Results

**Status:** Not yet performed (requires database access)

**Planned Queries:**
```sql
-- Projects with missing company
SELECT p.id, p.project_code
FROM projects p
LEFT JOIN companies c ON p.company_id = c.id
WHERE c.id IS NULL;

-- Sites with missing project
SELECT s.id, s.site_code
FROM sites s
LEFT JOIN projects p ON s.project_id = p.id
WHERE p.id IS NULL;

-- Vendors with missing company
SELECT v.id, v.vendor_code
FROM vendors v
LEFT JOIN companies c ON v.company_id = c.id
WHERE c.id IS NULL;
```

**Action:** Report counts only, do not modify data.

---

## Summary

### What Exists
✅ Basic enterprise structure (company, branch, department)
✅ Project, package, site hierarchy
✅ Vendor master with GST/PAN
✅ Material master with UoM
✅ Employee and labour masters
✅ Equipment master
✅ Chart of accounts with hierarchy

### What's Missing (Critical for Part 12)
❌ Enterprise hierarchy materialization (closure table)
❌ Project profile and configuration
❌ BOQ master with versioning
❌ Item master extensions (category, specs, HSN, conversions)
❌ UoM master and conversions
❌ Vendor/client compliance tracking
❌ Cost code master
❌ Rate masters with effective dating
❌ Numbering series governance
❌ Master data governance engine
❌ Duplicate detection and merge
❌ Data quality dashboard

### What Must Be Preserved
✅ All existing master screens continue to work
✅ Existing codes, IDs, references unchanged
✅ Existing integrations read same shape
✅ Existing edit paths still succeed
✅ Governance defaults to OFF (no behavior change on day one)

---

## Next Steps

1. Create `dx_org_node` for hierarchy materialization
2. Create `dx_project_profile` and `dx_project_config`
3. Create BOQ master tables
4. Create item/UoM extension tables
5. Create vendor compliance and scorecard tables
6. Create cost code master
7. Create rate master tables
8. Create numbering series tables
9. Create governance engine tables
10. Create data quality tables
11. Build UI components for all masters
12. Implement governance workflows
13. Implement duplicate detection
14. Build data quality dashboard

**Ready to proceed with implementation.**
