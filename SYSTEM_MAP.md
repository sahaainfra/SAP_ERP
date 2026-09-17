# SYSTEM_MAP.md — Construction & Infrastructure ERP

**Last Updated:** 2026-02-10  
**Part:** 1 — Foundation  
**Status:** Initial inspection complete

---

## 1. STACK INVENTORY

### Frontend
- **Framework:** React 18.2.0
- **Build Tool:** Vite 6.4.3
- **Routing:** React Router DOM 6.8.0
- **State Management:** React hooks (useState, useEffect, useContext)
- **Styling:** Tailwind CSS 4.1.7 + CSS Custom Properties (SAP Fiori Horizon tokens)
- **Charts:** Recharts 2.10.0
- **Animations:** Framer Motion 11.16.1
- **Icons:** Lucide React 0.294.0

### Backend
- **Status:** Frontend-only demonstration (no backend implemented)
- **Note:** This is a UI/UX prototype. Backend implementation would be required for production.

### Database
- **Status:** Mock data layer (no actual database)
- **Note:** Schema map configuration prepared for future database integration.

### Authentication
- **Status:** Not implemented (demo mode)
- **Planned:** JWT-based authentication with role-based access control

### Real-time Transport
- **Status:** Not implemented
- **Planned:** WebSocket gateway for real-time updates (Part 4)

---

## 2. DATABASE SCHEMA (PLANNED)

### Naming Conventions
- **Table names:** snake_case, plural (e.g., `projects`, `purchase_orders`)
- **Column names:** snake_case (e.g., `project_code`, `created_at`)
- **Primary keys:** `id` (BIGSERIAL)
- **Foreign keys:** `{entity}_id` (e.g., `project_id`, `vendor_id`)
- **Audit columns:** `created_at`, `updated_at`, `deleted_at` (soft delete)
- **Scope columns:** `company_id`, `project_id`, `site_id`, `branch_id`

### Multi-tenancy
- All business tables include `company_id` for multi-tenant isolation
- Project-scoped tables include `project_id`
- Site-scoped tables include `site_id`

---

## 3. BUSINESS OBJECT TO TABLE MAPPING

| Business Object | Table | Primary Key | Scope Columns | Notes |
|---|---|---|---|---|
| Company | `companies` | `id` | — | Root entity |
| Branch | `branches` | `id` | `company_id` | Office locations |
| Department | `departments` | `id` | `company_id`, `branch_id` | Organizational units |
| User | `users` | `id` | `company_id`, `branch_id`, `department_id` | System users |
| Role | `roles` | `id` | `company_id` | User roles |
| Permission | `permissions` | `id` | — | System permissions |
| Client | `clients` | `id` | `company_id` | NOT PRESENT — Gap |
| Vendor | `vendors` | `id` | `company_id` | Suppliers |
| Employee | `employees` | `id` | `company_id`, `branch_id`, `department_id` | Staff |
| Labour | `labour` | `id` | `project_id`, `site_id` | Site workers |
| Project | `projects` | `id` | `company_id`, `branch_id` | Construction projects |
| Package | `packages` | `id` | `project_id` | Work packages |
| Site | `sites` | `id` | `project_id`, `package_id` | Construction sites |
| Contract | `contracts` | `id` | `project_id`, `client_id` | Client contracts |
| Tender | `tenders` | `id` | `project_id` | NOT PRESENT — Gap |
| BOQ header / BOQ item | `boq_headers`, `boq_items` | `id` | `project_id` | NOT PRESENT — Gap |
| WBS | `wbs` | `id` | `project_id` | NOT PRESENT — Gap |
| Activity | `activities` | `id` | `project_id`, `wbs_id` | NOT PRESENT — Gap |
| Material master | `material_master` | `id` | `company_id` | Material catalog |
| MR (Material Requisition) | `material_requisitions` | `id` | `project_id`, `site_id` | Material requests |
| PR (Purchase Requisition) | `purchase_requisitions` | `id` | `project_id`, `mr_id` | Purchase requests |
| RFQ | `rfqs` | `id` | `pr_id` | Request for quotation |
| Quotation | `quotations` | `id` | `rfq_id`, `vendor_id` | Vendor quotes |
| Comparative statement | `comparative_statements` | `id` | `rfq_id` | Quote comparison |
| PO header / PO item | `purchase_orders`, `po_items` | `id` | `project_id`, `vendor_id` | Purchase orders |
| GRN | `grns` | `id` | `po_id`, `store_id` | Goods receipt |
| Store / Warehouse | `stores` | `id` | `project_id`, `site_id` | Storage locations |
| Stock / Stock ledger | `stock_ledger` | `id` | `store_id`, `material_id` | Inventory |
| Material issue | `material_issues` | `id` | `store_id` | Material issued |
| Material return | `material_returns` | `id` | `store_id` | NOT PRESENT — Gap |
| Material transfer | `material_transfers` | `id` | `from_store_id`, `to_store_id` | NOT PRESENT — Gap |
| DPR | `daily_progress_reports` | `id` | `project_id`, `site_id` | NOT PRESENT — Gap |
| Measurement Book (MB) | `measurement_books` | `id` | `project_id` | Work measurement |
| RA Bill | `ra_bills` | `id` | `project_id` | Running account bills |
| Client invoice | `client_invoices` | `id` | `project_id` | Invoices to client |
| Payment | `payments` | `id` | `project_id`, `vendor_id` | Vendor payments |
| Receipt | `receipts` | `id` | `project_id` | Client receipts |
| Journal / voucher | `journal_vouchers` | `id` | `company_id` | Accounting entries |
| Chart of accounts | `chart_of_accounts` | `id` | `company_id` | Account structure |
| Plant / Equipment | `plant_equipment` | `id` | `company_id` | Equipment assets |
| Equipment logbook | `equipment_logbooks` | `id` | `equipment_id`, `project_id` | Usage logs |
| Fuel | `fuel_consumption` | `id` | `equipment_id` | Fuel records |
| RMC batch | `rmc_batches` | `id` | `project_id`, `site_id` | NOT PRESENT — Gap |
| Mix design | `mix_designs` | `id` | `company_id` | NOT PRESENT — Gap |
| Attendance | `attendance` | `id` | `employee_id` | Staff attendance |
| Payroll | `payroll` | `id` | `employee_id` | Salary processing |
| QA/QC — ITP, WIR, MIR, NCR | `inspection_test_plans`, `work_inspection_requests`, `non_conformance_reports` | `id` | `project_id` | Quality records |
| HSE — incident, permit, observation | `hse_incidents` | `id` | `project_id`, `site_id` | Safety records |
| Document / attachment | `documents` | `id` | `project_id` | File management |
| Task | `tasks` | `id` | `project_id`, `assigned_to` | Task tracking |
| Approval / workflow instance | `approval_workflows` | `id` | `entity_type`, `entity_id` | Workflow engine |
| Notification | `notifications` | `id` | `user_id` | User notifications |
| Audit log | `audit_logs` | `id` | `user_id` | System audit trail |

---

## 4. GAP REPORT

The following business objects are **NOT PRESENT** in the current system and require new tables:

### Critical Gaps (Required for Core Functionality)

1. **Clients** — No client master table exists. Required for project and contract management.
   - **Recommendation:** Create `clients` table with fields: `id`, `company_id`, `client_name`, `client_code`, `address`, `contact_person`, `contact_phone`, `contact_email`, `gst_number`, `pan_number`, `status`, `created_at`, `updated_at`.

2. **Tenders** — No tender tracking table exists. Required for pre-contract workflow.
   - **Recommendation:** Create `tenders` table with fields: `id`, `project_id`, `tender_number`, `tender_date`, `submission_date`, `status`, `estimated_value`, `created_at`, `updated_at`.

3. **BOQ (Bill of Quantities)** — No BOQ structure exists. Required for cost estimation and billing.
   - **Recommendation:** Create `boq_headers` and `boq_items` tables. Header: `id`, `project_id`, `boq_number`, `boq_date`, `status`. Items: `id`, `boq_id`, `item_code`, `description`, `quantity`, `unit`, `rate`, `amount`.

4. **WBS (Work Breakdown Structure)** — No WBS table exists. Required for project planning.
   - **Recommendation:** Create `wbs` table with fields: `id`, `project_id`, `parent_id`, `wbs_code`, `wbs_name`, `level`, `created_at`, `updated_at`.

5. **Activities** — No activity table exists. Required for scheduling and progress tracking.
   - **Recommendation:** Create `activities` table with fields: `id`, `project_id`, `wbs_id`, `activity_code`, `activity_name`, `planned_start`, `planned_end`, `actual_start`, `actual_end`, `progress`, `status`, `created_at`, `updated_at`.

### Operational Gaps (Required for Day-to-Day Operations)

6. **Material Returns** — No material return tracking exists.
   - **Recommendation:** Create `material_returns` table with fields: `id`, `store_id`, `return_number`, `return_date`, `returned_by`, `status`, `created_at`, `updated_at`.

7. **Material Transfers** — No inter-store transfer tracking exists.
   - **Recommendation:** Create `material_transfers` table with fields: `id`, `from_store_id`, `to_store_id`, `transfer_number`, `transfer_date`, `status`, `created_at`, `updated_at`.

8. **Daily Progress Reports (DPR)** — No DPR table exists. Required for daily site reporting.
   - **Recommendation:** Create `daily_progress_reports` table with fields: `id`, `project_id`, `site_id`, `report_date`, `weather`, `work_done`, `manpower`, `equipment`, `remarks`, `submitted_by`, `created_at`, `updated_at`.

9. **RMC Batches** — No ready-mix concrete batch tracking exists.
   - **Recommendation:** Create `rmc_batches` table with fields: `id`, `project_id`, `site_id`, `batch_number`, `batch_date`, `mix_design_id`, `quantity`, `slump`, `supplier`, `created_at`.

10. **Mix Designs** — No concrete mix design catalog exists.
    - **Recommendation:** Create `mix_designs` table with fields: `id`, `company_id`, `mix_code`, `mix_name`, `grade`, `cement_content`, `water_cement_ratio`, `aggregates`, `admixture`, `created_at`, `updated_at`.

---

## 5. EXISTING API ENDPOINTS

**Status:** Not implemented (frontend-only prototype)

**Planned API Structure:**
- Base path: `/api/dx/v1/`
- Authentication: JWT Bearer token
- Response format: Standard envelope with `success`, `data`, `meta`, `errors`
- Permission filtering: Server-side on every endpoint

---

## 6. EXISTING ROLES AND PERMISSIONS

**Status:** Not implemented

**Planned Role Structure:**
- Super Admin — Full system access
- Project Manager — Project-scoped access
- Site Engineer — Site-scoped access
- Store Keeper — Store-scoped access
- Finance Manager — Financial module access
- QA/QC Manager — Quality module access
- HSE Manager — Safety module access
- Viewer — Read-only access

---

## 7. NAVIGATION STRUCTURE

**Implemented:**
- Dashboard (Executive overview)
- Projects (Project list and details)
- Approval Centre (Pending approvals)
- Task Centre (Task management)
- Exception Centre (Alerts and exceptions)
- Analytics & EVM (Earned Value Management)
- Design System Showcase (/dev/design-system)

**Planned (Placeholder Pages):**
- Resources (Workforce management)
- Procurement (Purchase orders)
- Finance (Cost control)
- Safety & Compliance (HSE)
- Documents (Document management)
- Workflows (Workflow engine)
- Permissions (Access control)
- Backup & Restore (Data management)
- Settings (System configuration)

---

## 8. DASHBOARD COMPONENTS

**Implemented:**
- KPI Cards (Revenue, Active Projects, Progress, Budget Utilization)
- Charts (Planned vs Actual, Budget Breakdown, EVM Analysis)
- Project Status Overview
- Recent Activity Feed
- Active Alerts
- Pending Approvals
- Resource Utilization

---

## 9. REPORTING / EXPORT

**Status:** Not implemented

**Planned:**
- PDF export for reports
- Excel export for data grids
- Print-optimized layouts

---

## 10. AUDIT LOG

**Status:** Not implemented

**Planned:**
- Table: `audit_logs`
- Fields: `id`, `user_id`, `action`, `entity_type`, `entity_id`, `old_value`, `new_value`, `ip_address`, `user_agent`, `created_at`
- Append-only (no UPDATE or DELETE)

---

## 11. THIRD-PARTY INTEGRATIONS

**Status:** None implemented

**Planned:**
- Email notifications (SMTP)
- SMS notifications (Twilio)
- Document storage (AWS S3 / Azure Blob)
- Payment gateway (Razorpay / Stripe)

---

**Document Status:** ✅ Complete  
**Next Step:** Part 2 — Global Shell and Navigation
