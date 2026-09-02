/* ── Meridian ERP · mock domain data ─────────────────────────── */

export type RoleId =
  | "SUPER_ADMIN" | "MD" | "PM" | "HR" | "ACCOUNTS"
  | "PROCUREMENT" | "STORE" | "COMMERCIAL" | "RMC"
  | "SITE_ENG" | "EMPLOYEE";

/** Module keys used for RBAC gating + routes */
export const MODULES = [
  "dashboard", "projects", "tenders", "commercial", "procurement", "materials",
  "stores", "plant", "rmc", "attendance", "hr", "finance", "billing", "payroll",
  "approvals", "reports", "analytics", "documents", "settings",
] as const;
export type ModuleId = (typeof MODULES)[number];

/** Module-level menu access per role */
export const ACCESS: Record<RoleId, ModuleId[]> = {
  SUPER_ADMIN: [...MODULES],
  MD: ["dashboard", "projects", "tenders", "commercial", "procurement", "materials", "finance", "billing", "approvals", "reports", "analytics", "documents"],
  PM: ["dashboard", "projects", "materials", "stores", "plant", "attendance", "hr", "billing", "approvals", "reports", "documents"],
  HR: ["dashboard", "attendance", "hr", "payroll", "approvals", "reports"],
  ACCOUNTS: ["dashboard", "projects", "procurement", "materials", "finance", "billing", "approvals", "reports", "analytics"],
  PROCUREMENT: ["dashboard", "procurement", "materials", "stores", "approvals", "reports"],
  STORE: ["dashboard", "materials", "stores", "reports"],
  COMMERCIAL: ["dashboard", "projects", "tenders", "commercial", "billing", "finance", "approvals", "reports"],
  RMC: ["dashboard", "rmc", "materials", "plant", "reports"],
  SITE_ENG: ["dashboard", "projects", "attendance", "materials", "reports", "documents"],
  EMPLOYEE: ["dashboard", "attendance", "payroll", "hr"],
};

export interface RoleInfo { id: RoleId; label: string; person: string; title: string; dept: string }

export const ROLES: RoleInfo[] = [
  { id: "SUPER_ADMIN", label: "Super Admin", person: "Arvind Nair", title: "System Administrator", dept: "IT & Systems" },
  { id: "MD", label: "Managing Director", person: "Rajesh Malhotra", title: "Managing Director", dept: "Executive Office" },
  { id: "PM", label: "Project Manager", person: "Sunita Deshmukh", title: "Project Manager — P4", dept: "Project Execution" },
  { id: "HR", label: "HR Manager", person: "Kavita Iyer", title: "HR Manager", dept: "Human Resources" },
  { id: "ACCOUNTS", label: "Accounts Manager", person: "Prakash Rao", title: "Accounts Manager", dept: "Finance & Accounts" },
  { id: "PROCUREMENT", label: "Procurement Manager", person: "Imran Shaikh", title: "Procurement Manager", dept: "Supply Chain" },
  { id: "STORE", label: "Store Keeper", person: "Dinesh Pawar", title: "Store In-charge — Pune", dept: "Store Management" },
  { id: "COMMERCIAL", label: "Commercial Manager", person: "Meera Krishnan", title: "Commercial Manager", dept: "Commercial & Contracts" },
  { id: "RMC", label: "RMC Plant Manager", person: "Sandeep Kulkarni", title: "Plant Manager — RMC-1", dept: "RMC Operations" },
  { id: "SITE_ENG", label: "Site Engineer", person: "Rohan Bhosale", title: "Site Engineer — P2", dept: "Project Execution" },
  { id: "EMPLOYEE", label: "Employee / Labour", person: "Ravi Kumar", title: "Mason — Grade II", dept: "Site Workforce" },
];

export type ProjectStatus = "On Track" | "Delayed" | "Attention Required" | "Completed";

export interface Project {
  id: string; code: string; name: string; client: string;
  contractValue: number; progress: number; planned: number; budgetUtil: number;
  billing: "Billed" | "Submitted" | "Pending" | "Overdue";
  pm: string; end: string; status: ProjectStatus;
  receivable: number; payable: number; manpower: number; margin: number;
}

export const PROJECTS: Project[] = [
  { id: "P1", code: "PRJ-014", name: "NH-47 Elevated Corridor — Pkg 2", client: "NHAI", contractValue: 412.5, progress: 64, planned: 68, budgetUtil: 71, billing: "Billed", pm: "Sunita Deshmukh", end: "Dec 2026", status: "On Track", receivable: 38.4, payable: 22.1, manpower: 412, margin: 11.8 },
  { id: "P2", code: "PRJ-016", name: "Metro Viaduct Section — Line 3", client: "Pune Metro Rail", contractValue: 286.0, progress: 41, planned: 52, budgetUtil: 58, billing: "Submitted", pm: "Alok Bhatt", end: "Aug 2027", status: "Delayed", receivable: 24.6, payable: 18.9, manpower: 268, margin: 9.4 },
  { id: "P3", code: "PRJ-019", name: "Industrial Water Treatment Plant", client: "MIDC Maharashtra", contractValue: 148.2, progress: 77, planned: 75, budgetUtil: 82, billing: "Billed", pm: "Farhan Qureshi", end: "Jun 2026", status: "On Track", receivable: 12.8, payable: 9.6, manpower: 154, margin: 13.1 },
  { id: "P4", code: "PRJ-021", name: "Township Development — Phase 1", client: "Skyline Developers", contractValue: 196.8, progress: 23, planned: 30, budgetUtil: 44, billing: "Pending", pm: "Sunita Deshmukh", end: "Mar 2028", status: "Attention Required", receivable: 8.2, payable: 14.7, manpower: 186, margin: 7.2 },
  { id: "P5", code: "PRJ-022", name: "River Bridge Rehabilitation", client: "PWD Gujarat", contractValue: 96.4, progress: 88, planned: 86, budgetUtil: 91, billing: "Billed", pm: "Rohit Verma", end: "Apr 2026", status: "On Track", receivable: 6.4, payable: 3.8, manpower: 92, margin: 10.6 },
  { id: "P6", code: "PRJ-023", name: "Solar Park Civil Works — 120 MW", client: "NTPC Renewables", contractValue: 124.0, progress: 52, planned: 50, budgetUtil: 49, billing: "Submitted", pm: "Alok Bhatt", end: "Nov 2026", status: "On Track", receivable: 9.8, payable: 7.2, manpower: 138, margin: 12.4 },
  { id: "P7", code: "PRJ-025", name: "Flyover Package — Ring Road", client: "MSRDC", contractValue: 174.6, progress: 35, planned: 47, budgetUtil: 52, billing: "Overdue", pm: "Rohit Verma", end: "Feb 2027", status: "Delayed", receivable: 21.2, payable: 12.4, manpower: 204, margin: 8.1 },
  { id: "P8", code: "PRJ-011", name: "Warehouse Park — Bhiwandi", client: "LogiPark India", contractValue: 68.9, progress: 100, planned: 100, budgetUtil: 97, billing: "Billed", pm: "Farhan Qureshi", end: "Oct 2025", status: "Completed", receivable: 0, payable: 1.9, manpower: 0, margin: 14.2 },
  { id: "P9", code: "PRJ-027", name: "RMC Supply Contract — Kharadi", client: "Skyline Developers", contractValue: 42.5, progress: 58, planned: 55, budgetUtil: 61, billing: "Submitted", pm: "Sandeep Kulkarni", end: "Sep 2026", status: "On Track", receivable: 3.6, payable: 2.8, manpower: 24, margin: 16.8 },
];

/* ── KPI library ─────────────────────────────────────────────── */

const wave = (base: number, amp: number, seed: number) =>
  Array.from({ length: 10 }, (_, i) => +(base + amp * Math.sin(i * 1.1 + seed) + (i * amp) / 6).toFixed(1));

export interface Kpi {
  id: string; label: string; value: number; unit?: string; prefix?: string; decimals?: number;
  delta: number; goodWhenUp?: boolean; prev: string; spark: number[]; hint: string;
}

const K = (id: string, label: string, value: number, unit: string, delta: number, prev: string, hint: string, opts: Partial<Kpi> = {}): Kpi =>
  ({ id, label, value, unit, delta, prev, hint, spark: wave(value || 10, Math.max(2, value * 0.08), id.length), goodWhenUp: delta >= 0, ...opts });

export const KPI_LIB: Record<string, Kpi> = {
  totalProjects: K("totalProjects", "Total Projects", 9, "", 12.5, "8 in FY 24–25", "All projects across portfolios", { decimals: 0 }),
  activeProjects: K("activeProjects", "Active Projects", 7, "", 16.7, "6 last month", "Excludes completed & on-hold", { decimals: 0 }),
  contractValue: K("contractValue", "Total Contract Value", 1549.9, "Cr", 8.2, "₹1,432.0 Cr prev", "Sum of signed contracts", { prefix: "₹", decimals: 1 }),
  monthRevenue: K("monthRevenue", "Revenue — Feb 2026", 86.4, "Cr", 6.8, "₹80.9 Cr in Jan", "Recognised revenue this month", { prefix: "₹", decimals: 1 }),
  receivables: K("receivables", "Receivables", 125.0, "Cr", -4.1, "₹130.3 Cr prev", "Outstanding client dues", { prefix: "₹", decimals: 1, goodWhenUp: false }),
  payables: K("payables", "Payables", 93.4, "Cr", 2.6, "₹91.0 Cr prev", "Vendor & subcontractor dues", { prefix: "₹", decimals: 1, goodWhenUp: false }),
  pendingRA: K("pendingRA", "Pending RA Bills", 14, "", -12.5, "16 last month", "Running account bills awaiting certification", { decimals: 0 }),
  cashFlow: K("cashFlow", "Cash Flow Position", 41.2, "Cr", 9.3, "₹37.7 Cr prev", "Net cash position today", { prefix: "₹", decimals: 1 }),
  progressAvg: K("progressAvg", "Avg Physical Progress", 54.2, "%", 3.4, "50.8% last month", "Weighted across active projects", { decimals: 1 }),
  manpowerOnsite: K("manpowerOnsite", "Manpower On Site", 1478, "", 5.2, "1,405 yesterday", "Direct + subcontract labour", { decimals: 0 }),
  costUtil: K("costUtil", "Cost Utilisation", 68.4, "%", 1.8, "66.6% last month", "Budget consumed vs earned value", { decimals: 1, goodWhenUp: false }),
  openIssues: K("openIssues", "Open Site Issues", 11, "", -15.4, "13 last week", "Unresolved execution issues", { decimals: 0, goodWhenUp: false }),
  attendanceToday: K("attendanceToday", "Attendance Today", 91.6, "%", 1.2, "90.4% yesterday", "Present / marked strength", { decimals: 1 }),
  onLeave: K("onLeave", "On Leave", 38, "", 8.6, "35 last week", "Approved leaves today", { decimals: 0, goodWhenUp: false }),
  openPositions: K("openPositions", "Open Positions", 12, "", 0, "12 last month", "Active recruitment requisitions", { decimals: 0 }),
  payrollProgress: K("payrollProgress", "Payroll Processed", 76, "%", 22.0, "54% last week", "Feb 2026 payroll run status", { decimals: 0 }),
  overdueReceivables: K("overdueReceivables", "Overdue Receivables", 46.8, "Cr", -6.2, "₹49.9 Cr prev", "Invoices beyond 60 days", { prefix: "₹", decimals: 1, goodWhenUp: false }),
  invoicesRaised: K("invoicesRaised", "Invoices Raised (MTD)", 22, "", 10.0, "20 last month", "Customer invoices generated", { decimals: 0 }),
  paymentsReleased: K("paymentsReleased", "Payments Released (MTD)", 64.2, "Cr", 3.1, "₹62.3 Cr prev", "Vendor payments processed", { prefix: "₹", decimals: 1 }),
  pendingPR: K("pendingPR", "Pending Requisitions", 23, "", -8.0, "25 last week", "Purchase requisitions in queue", { decimals: 0, goodWhenUp: false }),
  openRFQ: K("openRFQ", "Open RFQs", 9, "", 12.5, "8 last week", "Requests for quotation live", { decimals: 0 }),
  poValueMonth: K("poValueMonth", "PO Value (MTD)", 38.6, "Cr", 11.4, "₹34.6 Cr prev", "Purchase orders issued", { prefix: "₹", decimals: 1 }),
  savingsYTD: K("savingsYTD", "Negotiation Savings YTD", 4.8, "Cr", 14.3, "₹4.2 Cr prev", "Savings vs last purchase price", { prefix: "₹", decimals: 1 }),
  stockValue: K("stockValue", "Stock Value", 27.4, "Cr", 2.2, "₹26.8 Cr prev", "All stores, at weighted cost", { prefix: "₹", decimals: 1 }),
  lowStockItems: K("lowStockItems", "Low Stock Items", 17, "", 21.4, "14 last week", "Below reorder level", { decimals: 0, goodWhenUp: false }),
  inwardToday: K("inwardToday", "GRN Today", 26, "", 8.3, "24 yesterday", "Goods receipts booked", { decimals: 0 }),
  pendingMR: K("pendingMR", "Pending Material Requests", 14, "", -6.7, "15 yesterday", "Site requests awaiting issue", { decimals: 0, goodWhenUp: false }),
  productionToday: K("productionToday", "Production Today", 642, "m³", 6.1, "605 m³ yesterday", "RMC batched across plants", { decimals: 0 }),
  dispatchToday: K("dispatchToday", "Dispatch Today", 588, "m³", 4.8, "561 m³ yesterday", "Transit mixers delivered", { decimals: 0 }),
  plantUtil: K("plantUtil", "Plant Utilisation", 82.4, "%", 3.6, "78.8% last week", "Batching capacity used", { decimals: 1 }),
  prodCost: K("prodCost", "Production Cost", 2840, "/m³", -1.4, "₹2,880 prev", "Average cost per cubic metre", { prefix: "₹", decimals: 0 }),
  variationsValue: K("variationsValue", "Variations Pending", 18.6, "Cr", 5.7, "₹17.6 Cr prev", "Extra items awaiting approval", { prefix: "₹", decimals: 1 }),
  certifiedValue: K("certifiedValue", "Certified This Month", 74.2, "Cr", 7.9, "₹68.8 Cr prev", "RA bills certified by client", { prefix: "₹", decimals: 1 }),
  marginPct: K("marginPct", "Portfolio Margin", 11.2, "%", 0.8, "10.4% last quarter", "Blended projected margin", { decimals: 1 }),
  overtimeHrs: K("overtimeHrs", "Overtime Hours (WK)", 1240, "hrs", 4.4, "1,188 hrs prev week", "Approved overtime across sites", { decimals: 0 }),
  trainingDue: K("trainingDue", "Safety Training Due", 46, "", -9.8, "51 last month", "Mandatory refreshers pending", { decimals: 0, goodWhenUp: false }),
  mixerFleet: K("mixerFleet", "Mixers Operational", 12, "", 0, "12 last week", "Transit mixers in service of 14", { decimals: 0 }),
  attrition: K("attrition", "Attrition (TTM)", 4.6, "%", -0.8, "5.4% prev quarter", "Rolling 12-month voluntary attrition", { decimals: 1, goodWhenUp: false }),
};

export const ROLE_KPIS: Record<RoleId, string[]> = {
  SUPER_ADMIN: ["totalProjects", "activeProjects", "contractValue", "monthRevenue", "receivables", "payables", "pendingRA", "cashFlow"],
  MD: ["totalProjects", "activeProjects", "contractValue", "monthRevenue", "receivables", "payables", "pendingRA", "cashFlow"],
  PM: ["activeProjects", "progressAvg", "manpowerOnsite", "costUtil", "monthRevenue", "pendingRA", "openIssues", "attendanceToday"],
  HR: ["manpowerOnsite", "attendanceToday", "onLeave", "openPositions", "payrollProgress", "overtimeHrs", "trainingDue", "attrition"],
  ACCOUNTS: ["monthRevenue", "receivables", "overdueReceivables", "payables", "cashFlow", "pendingRA", "invoicesRaised", "paymentsReleased"],
  PROCUREMENT: ["pendingPR", "openRFQ", "poValueMonth", "savingsYTD", "payables", "pendingMR", "lowStockItems", "stockValue"],
  STORE: ["stockValue", "lowStockItems", "inwardToday", "pendingMR", "productionToday", "plantUtil", "pendingPR", "manpowerOnsite"],
  COMMERCIAL: ["contractValue", "variationsValue", "certifiedValue", "pendingRA", "receivables", "monthRevenue", "marginPct", "cashFlow"],
  RMC: ["productionToday", "dispatchToday", "plantUtil", "prodCost", "mixerFleet", "lowStockItems", "pendingMR", "stockValue"],
  SITE_ENG: ["activeProjects", "progressAvg", "manpowerOnsite", "attendanceToday", "costUtil", "pendingMR", "openIssues", "stockValue"],
  EMPLOYEE: ["attendanceToday", "overtimeHrs", "onLeave", "trainingDue", "payrollProgress", "manpowerOnsite", "openIssues", "pendingMR"],
};

/* ── Approvals ───────────────────────────────────────────────── */

export type ApprovalType = "Purchase Request" | "Purchase Order" | "Material Request" | "Attendance" | "Leave" | "RA Bill" | "Vendor Payment" | "Expense Claim";
export const APPROVAL_TYPES: ApprovalType[] = ["Purchase Request", "Purchase Order", "Material Request", "Attendance", "Leave", "RA Bill", "Vendor Payment", "Expense Claim"];

export interface Approval {
  id: string; ref: string; type: ApprovalType; projectId: string; by: string;
  amount?: number; date: string; urgent?: boolean; dept: string;
}

export const APPROVALS: Approval[] = [
  { id: "A1", ref: "PR-2612", type: "Purchase Request", projectId: "P1", by: "S. Deshmukh", amount: 18.4, date: "18 Feb 2026", urgent: true, dept: "Procurement" },
  { id: "A2", ref: "PO-8841", type: "Purchase Order", projectId: "P7", by: "I. Shaikh", amount: 42.6, date: "18 Feb 2026", urgent: true, dept: "Procurement" },
  { id: "A3", ref: "MR-3320", type: "Material Request", projectId: "P2", by: "A. Bhatt", date: "17 Feb 2026", dept: "Store" },
  { id: "A4", ref: "ATT-0217", type: "Attendance", projectId: "P4", by: "K. Iyer", date: "17 Feb 2026", dept: "HR" },
  { id: "A5", ref: "LV-1198", type: "Leave", projectId: "P3", by: "F. Qureshi", date: "17 Feb 2026", dept: "HR" },
  { id: "A6", ref: "RA-0772", type: "RA Bill", projectId: "P1", by: "M. Krishnan", amount: 24.8, date: "16 Feb 2026", urgent: true, dept: "Commercial" },
  { id: "A7", ref: "VP-5527", type: "Vendor Payment", projectId: "P5", by: "P. Rao", amount: 12.3, date: "16 Feb 2026", dept: "Finance" },
  { id: "A8", ref: "EXP-2291", type: "Expense Claim", projectId: "P6", by: "A. Bhatt", amount: 0.86, date: "15 Feb 2026", dept: "Finance" },
  { id: "A9", ref: "PO-8839", type: "Purchase Order", projectId: "P3", by: "I. Shaikh", amount: 9.7, date: "15 Feb 2026", dept: "Procurement" },
  { id: "A10", ref: "MR-3318", type: "Material Request", projectId: "P7", by: "R. Verma", date: "14 Feb 2026", dept: "Store" },
  { id: "A11", ref: "RA-0771", type: "RA Bill", projectId: "P6", by: "M. Krishnan", amount: 16.2, date: "14 Feb 2026", dept: "Commercial" },
  { id: "A12", ref: "LV-1195", type: "Leave", projectId: "P2", by: "A. Bhatt", date: "13 Feb 2026", dept: "HR" },
];

/* ── Activity feed ───────────────────────────────────────────── */

export interface Activity { id: string; kind: "po" | "grn" | "attendance" | "invoice" | "payment" | "project" | "approval"; text: string; meta: string; time: string; projectId: string; dept: string }

export const ACTIVITIES: Activity[] = [
  { id: "T1", kind: "po", text: "Purchase order PO-8838 released to UltraTech Cement", meta: "₹14.2 Cr · Cement & Clinker", time: "24 min ago", projectId: "P1", dept: "Procurement" },
  { id: "T2", kind: "grn", text: "GRN-5512 booked — 18 MT TMT steel received", meta: "Store Pune · Tata Steel", time: "1 hr ago", projectId: "P2", dept: "Store" },
  { id: "T3", kind: "invoice", text: "Invoice INV-2287 generated for RA Bill 14", meta: "₹24.8 Cr · NHAI", time: "2 hrs ago", projectId: "P1", dept: "Commercial" },
  { id: "T4", kind: "attendance", text: "Site attendance submitted — 412 workers marked", meta: "96.4% present · Supervisor V. Jadhav", time: "3 hrs ago", projectId: "P1", dept: "HR" },
  { id: "T5", kind: "payment", text: "Payment of ₹6.4 Cr released to Shree Construction", meta: "Subcontractor · UTI transfer", time: "5 hrs ago", projectId: "P5", dept: "Finance" },
  { id: "T6", kind: "project", text: "Pier P-14 girder launching completed", meta: "Milestone 22 of 34 · on schedule", time: "Yesterday", projectId: "P2", dept: "Execution" },
  { id: "T7", kind: "approval", text: "PR-2604 approved — formwork material", meta: "Approved by Commercial Manager", time: "Yesterday", projectId: "P7", dept: "Procurement" },
  { id: "T8", kind: "grn", text: "RMC dispatch 605 m³ logged against P9", meta: "M25 grade · Pump + transit mixers", time: "Yesterday", projectId: "P9", dept: "RMC" },
];

/* ── Alerts & exceptions ─────────────────────────────────────── */

export interface AlertItem { id: string; severity: "Critical" | "Warning" | "Info"; category: string; text: string; detail: string; projectId?: string }

export const ALERTS: AlertItem[] = [
  { id: "AL1", severity: "Critical", category: "Over Budget", text: "PRJ-021 cost utilisation trending +6% over baseline", detail: "Township Phase 1 · earthwork package", projectId: "P4" },
  { id: "AL2", severity: "Critical", category: "Overdue Receivables", text: "₹21.2 Cr beyond 60 days on PRJ-025", detail: "MSRDC · RA Bills 9–11 uncertified", projectId: "P7" },
  { id: "AL3", severity: "Warning", category: "Delayed Project", text: "PRJ-016 running 11% behind planned progress", detail: "Metro Viaduct · girder casting slot slipped", projectId: "P2" },
  { id: "AL4", severity: "Warning", category: "Low Stock", text: "OPC 53 cement below reorder level — Pune store", detail: "On hand 42 MT · ROL 60 MT", projectId: "P1" },
  { id: "AL5", severity: "Warning", category: "Maintenance Due", text: "Schwing pump S-04 service overdue by 6 days", detail: "RMC Plant 1 · 250 hr service", projectId: "P9" },
  { id: "AL6", severity: "Info", category: "Contract Expiry", text: "Rate contract RC-118 (bitumen) expires in 18 days", detail: "Renewal RFQ recommended", projectId: "P7" },
  { id: "AL7", severity: "Info", category: "Approvals", text: "3 urgent approvals pending > 48 hrs", detail: "PR-2612 · PO-8841 · RA-0772" },
];

/* ── Chart series ────────────────────────────────────────────── */

export const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
export const REV_EXP = [
  { m: "Jul", revenue: 62.4, expense: 54.1 }, { m: "Aug", revenue: 66.8, expense: 57.2 },
  { m: "Sep", revenue: 71.2, expense: 58.6 }, { m: "Oct", revenue: 69.4, expense: 61.8 },
  { m: "Nov", revenue: 76.9, expense: 63.4 }, { m: "Dec", revenue: 82.1, expense: 66.2 },
  { m: "Jan", revenue: 80.9, expense: 64.8 }, { m: "Feb", revenue: 86.4, expense: 68.9 },
];
export const CASHFLOW = [
  { m: "Jul", inflow: 58.2, outflow: 51.4 }, { m: "Aug", inflow: 63.5, outflow: 55.1 },
  { m: "Sep", inflow: 68.0, outflow: 54.9 }, { m: "Oct", inflow: 61.8, outflow: 58.7 },
  { m: "Nov", inflow: 72.4, outflow: 60.2 }, { m: "Dec", inflow: 78.6, outflow: 63.5 },
  { m: "Jan", inflow: 74.1, outflow: 61.8 }, { m: "Feb", inflow: 81.7, outflow: 66.3 },
];
export const AGING = [
  { bucket: "0–30 days", value: 42.6, color: "#128574" },
  { bucket: "31–60 days", value: 35.6, color: "#6FBFAD" },
  { bucket: "61–90 days", value: 24.3, color: "#E0A33B" },
  { bucket: "90+ days", value: 22.5, color: "#D05252" },
];
export const BUDGET_ACTUAL = [
  { head: "Materials", budget: 46.2, actual: 48.6 }, { head: "Labour", budget: 22.8, actual: 21.4 },
  { head: "Subcontracts", budget: 18.4, actual: 17.1 }, { head: "Plant & Machinery", budget: 8.6, actual: 9.8 },
  { head: "Overheads", budget: 5.2, actual: 4.6 },
];
export const PLANNED_ACTUAL = [
  { m: "Sep", planned: 38, actual: 36 }, { m: "Oct", planned: 43, actual: 40 },
  { m: "Nov", planned: 47, actual: 45 }, { m: "Dec", planned: 52, actual: 48 },
  { m: "Jan", planned: 56, actual: 52 }, { m: "Feb", planned: 60, actual: 54.2 },
];

/* ── Role-specific datasets ──────────────────────────────────── */

export const VENDORS = [
  { name: "UltraTech Cement", cat: "Cement", pos: 34, onTime: 96, rating: 4.6 },
  { name: "Tata Steel TMT", cat: "Steel", pos: 22, onTime: 92, rating: 4.4 },
  { name: "Shree Construction", cat: "Subcontract", pos: 18, onTime: 84, rating: 3.9 },
  { name: "ACC Limited", cat: "Cement", pos: 12, onTime: 94, rating: 4.3 },
  { name: "Kirloskar Pumps", cat: "Equipment", pos: 8, onTime: 78, rating: 3.6 },
];

export const STOCK = [
  { item: "OPC 53 Cement", unit: "MT", onHand: 42, rol: 60, value: 14.8, loc: "Pune" },
  { item: "TMT Fe-550D 12mm", unit: "MT", onHand: 186, rol: 80, value: 32.6, loc: "Pune" },
  { item: "M-Sand", unit: "m³", onHand: 940, rol: 400, value: 4.2, loc: "RMC-1" },
  { item: "Aggregates 20mm", unit: "m³", onHand: 210, rol: 350, value: 3.1, loc: "RMC-1" },
  { item: "Shuttering Ply", unit: "nos", onHand: 1450, rol: 600, value: 8.4, loc: "Nashik" },
  { item: "Binding Wire", unit: "kg", onHand: 820, rol: 900, value: 1.2, loc: "Pune" },
];

export const PRODUCTION = [
  { d: "Mon", target: 620, actual: 598 }, { d: "Tue", target: 620, actual: 636 },
  { d: "Wed", target: 640, actual: 605 }, { d: "Thu", target: 640, actual: 662 },
  { d: "Fri", target: 660, actual: 641 }, { d: "Sat", target: 660, actual: 688 },
];

export const CONTRACTS = [
  { name: "NH-47 Pkg 2", base: 412.5, variation: 14.2, certified: 268.4, billed: 246.1, margin: 11.8 },
  { name: "Metro Viaduct L3", base: 286.0, variation: 6.8, certified: 122.6, billed: 104.3, margin: 9.4 },
  { name: "Ring Road Flyover", base: 174.6, variation: 4.6, certified: 62.8, billed: 48.2, margin: 8.1 },
  { name: "Water Treatment", base: 148.2, variation: 2.1, certified: 112.4, billed: 101.8, margin: 13.1 },
];

export const TRADES = [
  { trade: "Carpenters", present: 286, total: 312 }, { trade: "Masons", present: 244, total: 260 },
  { trade: "Steel Fixers", present: 198, total: 232 }, { trade: "Operators", present: 86, total: 90 },
  { trade: "Helpers", present: 412, total: 468 }, { trade: "Supervisors", present: 58, total: 62 },
];

export const SITE_ISSUES = [
  { id: "ISS-118", text: "Right-of-way blocked at chainage 12+400", project: "PRJ-016", sev: "High", age: "6 d" },
  { id: "ISS-121", text: "Girder casting bed repair pending", project: "PRJ-016", sev: "High", age: "3 d" },
  { id: "ISS-114", text: "Dewatering pump failure — basement zone", project: "PRJ-021", sev: "Medium", age: "2 d" },
  { id: "ISS-109", text: "Drawing RFI-88 response awaited from consultant", project: "PRJ-025", sev: "Medium", age: "9 d" },
  { id: "ISS-104", text: "Labour camp water supply intermittent", project: "PRJ-022", sev: "Low", age: "1 d" },
];

/* ── Navigation ──────────────────────────────────────────────── */

export interface NavChild { id: string; label: string }
export interface NavItem { id: string; label: string; icon: string; roles?: RoleId[]; children?: NavChild[] }

export const NAV: NavItem[] = [
  { id: "dashboard", label: "Overview / Dashboard", icon: "grid" },
  { id: "projects", label: "Projects", icon: "hardhat", children: [{ id: "prj-all", label: "All Projects" }, { id: "prj-dash", label: "Project Dashboard" }, { id: "prj-wbs", label: "WBS & BOQ" }] },
  { id: "tenders", label: "Tender Management", icon: "gavel", roles: ["SUPER_ADMIN", "MD", "COMMERCIAL"] },
  { id: "commercial", label: "Commercial & Contracts", icon: "contract", roles: ["SUPER_ADMIN", "MD", "COMMERCIAL", "ACCOUNTS"], children: [{ id: "com-contracts", label: "Contracts" }, { id: "com-variation", label: "Variations" }, { id: "com-claims", label: "Claims" }] },
  { id: "procurement", label: "Procurement", icon: "cart", roles: ["SUPER_ADMIN", "MD", "PROCUREMENT", "ACCOUNTS"], children: [{ id: "pro-pr", label: "Purchase Requisitions" }, { id: "pro-rfq", label: "RFQ & Quotations" }, { id: "pro-po", label: "Purchase Orders" }, { id: "pro-vendor", label: "Vendors" }] },
  { id: "materials", label: "Materials", icon: "cube", children: [{ id: "mat-master", label: "Material Masters" }, { id: "mat-grn", label: "Goods Receipt" }] },
  { id: "stores", label: "Store Management", icon: "warehouse", roles: ["SUPER_ADMIN", "MD", "STORE", "PROCUREMENT", "PM"], children: [{ id: "st-stock", label: "Stock Overview" }, { id: "st-mr", label: "Material Requests" }, { id: "st-recon", label: "Reconciliation" }] },
  { id: "plant", label: "Plant & Machinery", icon: "crane", roles: ["SUPER_ADMIN", "MD", "PM", "RMC"] },
  { id: "rmc", label: "RMC Plant", icon: "mixer", roles: ["SUPER_ADMIN", "MD", "RMC", "STORE"] },
  { id: "attendance", label: "Attendance", icon: "calcheck", roles: ["SUPER_ADMIN", "MD", "HR", "PM"] },
  { id: "hr", label: "HR & People", icon: "users", roles: ["SUPER_ADMIN", "MD", "HR"], children: [{ id: "hr-emp", label: "Employees" }, { id: "hr-leave", label: "Leave" }, { id: "hr-recruit", label: "Recruitment" }] },
  { id: "finance", label: "Finance & Accounts", icon: "ledger", roles: ["SUPER_ADMIN", "MD", "ACCOUNTS", "COMMERCIAL"], children: [{ id: "fin-ap", label: "Payables" }, { id: "fin-ar", label: "Receivables" }, { id: "fin-ledger", label: "General Ledger" }] },
  { id: "billing", label: "Billing & RA Bills", icon: "receipt", roles: ["SUPER_ADMIN", "MD", "ACCOUNTS", "COMMERCIAL"] },
  { id: "payroll", label: "Payroll", icon: "note", roles: ["SUPER_ADMIN", "MD", "HR", "ACCOUNTS"] },
  { id: "approvals", label: "Approvals", icon: "stamp" },
  { id: "reports", label: "Reports", icon: "chart" },
  { id: "analytics", label: "Analytics & Insights", icon: "trend", roles: ["SUPER_ADMIN", "MD", "COMMERCIAL", "ACCOUNTS"] },
  { id: "documents", label: "Documents", icon: "files" },
  { id: "settings", label: "Settings", icon: "cog", roles: ["SUPER_ADMIN", "MD"] },
];

/* ── Widget presets per role ─────────────────────────────────── */

export const ROLE_WIDGETS: Record<RoleId, string[]> = {
  SUPER_ADMIN: ["kpis", "projects", "alerts", "approvals", "revexp", "cashflow", "aging", "planned", "utilization", "performance", "budgetactual", "activity"],
  MD: ["kpis", "projects", "alerts", "revexp", "cashflow", "aging", "approvals", "performance", "budgetactual", "activity"],
  PM: ["kpis", "projects", "planned", "utilization", "siteissues", "approvals", "alerts", "activity"],
  HR: ["kpis", "manpower", "approvals", "activity", "alerts"],
  ACCOUNTS: ["kpis", "aging", "cashflow", "approvals", "budgetactual", "activity", "alerts"],
  PROCUREMENT: ["kpis", "vendors", "approvals", "alerts", "activity"],
  STORE: ["kpis", "stock", "approvals", "alerts", "activity"],
  COMMERCIAL: ["kpis", "contracts", "aging", "approvals", "revexp", "performance", "alerts"],
  RMC: ["kpis", "production", "stock", "approvals", "alerts", "activity"],
  SITE_ENG: ["kpis", "projects", "planned", "siteissues", "approvals", "activity"],
  EMPLOYEE: ["kpis", "activity", "approvals", "alerts"],
};

/* ── Helpers ─────────────────────────────────────────────────── */

export const fmtNum = (n: number, d = 1) =>
  n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtMoney = (n: number) => (n >= 100 ? `₹${fmtNum(n, 1)} Cr` : n >= 1 ? `₹${fmtNum(n, 2)} Cr` : `₹${fmtNum(n * 100, 1)} L`);

export const projectById = (id: string) => PROJECTS.find((p) => p.id === id);

export const DEPARTMENTS = ["All Departments", "Procurement", "Store", "HR", "Finance", "Commercial", "Execution", "RMC"];

export const DATE_RANGES = ["This Month", "This Quarter", "Year to Date", "FY 2025–26"];

export const FYEARS = ["FY 2025–26", "FY 2024–25", "FY 2023–24"];
