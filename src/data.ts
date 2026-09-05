/* Meridian ERP · central reference data */

export type RoleId =
  | "SUPER_ADMIN" | "MD" | "HR" | "ACCOUNTS" | "PROCUREMENT" | "PM" | "SITE_ENG" | "STORE" | "COMMERCIAL" | "RMC" | "EMPLOYEE";

export interface Role { id: RoleId; label: string; person: string; title: string; dept: string }

export const ROLES: Role[] = [
  { id: "SUPER_ADMIN", label: "Super Admin", person: "Arvind Nair", title: "Head — IT & Systems", dept: "Information Technology" },
  { id: "MD", label: "Managing Director", person: "Rajesh Malhotra", title: "Managing Director", dept: "Executive Office" },
  { id: "HR", label: "HR Manager", person: "Kavita Iyer", title: "Manager — Human Resources", dept: "Human Resources" },
  { id: "ACCOUNTS", label: "Accounts Manager", person: "Prakash Rao", title: "Manager — Finance & Accounts", dept: "Finance & Accounts" },
  { id: "PROCUREMENT", label: "Procurement Manager", person: "Imran Shaikh", title: "Manager — Supply Chain", dept: "Procurement" },
  { id: "PM", label: "Project Manager", person: "Sunita Deshmukh", title: "Project Manager — P1", dept: "Project Execution" },
  { id: "SITE_ENG", label: "Site Engineer", person: "Rohan Bhosale", title: "Site Engineer — P2", dept: "Project Execution" },
  { id: "STORE", label: "Store Keeper", person: "Dinesh Pawar", title: "Store In-charge — P1", dept: "Store Management" },
  { id: "COMMERCIAL", label: "Commercial Manager", person: "Meera Krishnan", title: "Manager — Commercial & Contracts", dept: "Commercial" },
  { id: "RMC", label: "RMC Plant Manager", person: "Sandeep Kulkarni", title: "Plant Manager — Kharadi", dept: "RMC Operations" },
  { id: "EMPLOYEE", label: "Employee / Labour", person: "Ganesh More", title: "Mason — Grade II", dept: "Site Workforce" },
];

export const MODULES = [
  "dashboard", "projects", "tenders", "commercial", "procurement", "materials", "stores", "plant", "rmc",
  "attendance", "hr", "finance", "billing", "payroll", "approvals", "reports", "analytics", "documents", "settings", "access",
] as const;
export type ModuleId = (typeof MODULES)[number];

export const ACCESS: Record<RoleId, ModuleId[]> = {
  SUPER_ADMIN: [...MODULES],
  MD: ["dashboard", "projects", "tenders", "commercial", "procurement", "finance", "billing", "payroll", "approvals", "reports", "analytics", "documents", "settings", "access", "hr", "attendance", "materials", "plant", "rmc"],
  HR: ["dashboard", "attendance", "hr", "payroll", "approvals", "reports", "documents"],
  ACCOUNTS: ["dashboard", "projects", "procurement", "materials", "finance", "billing", "approvals", "reports", "analytics", "documents"],
  PROCUREMENT: ["dashboard", "procurement", "materials", "stores", "approvals", "reports", "documents"],
  PM: ["dashboard", "projects", "procurement", "materials", "stores", "plant", "attendance", "hr", "billing", "approvals", "reports", "documents"],
  SITE_ENG: ["dashboard", "projects", "procurement", "attendance", "materials", "approvals", "reports", "documents"],
  STORE: ["dashboard", "materials", "stores", "reports"],
  COMMERCIAL: ["dashboard", "tenders", "commercial", "billing", "finance", "projects", "approvals", "reports", "analytics", "documents"],
  RMC: ["dashboard", "rmc", "stores", "plant", "materials", "approvals", "reports"],
  EMPLOYEE: ["dashboard", "attendance", "payroll", "hr", "approvals"],
};

export const DATE_RANGES = ["This Month", "This Quarter", "Year to Date", "Last 12 Months"];
export const DEPARTMENTS = ["All Departments", "Project Execution", "Commercial", "Finance & Accounts", "Procurement", "HR", "RMC Operations", "Plant & Machinery", "Store Management"];
export const FYEARS = ["FY 2025–26", "FY 2024–25", "FY 2023–24"];

/* ── Projects ────────────────────────────────────────────────── */
export interface Project {
  id: string; code: string; name: string; client: string; location: string; contractValue: number;
  progress: number; planned: number; budgetUtil: number; billing: string; pm: string; end: string;
  status: string; manpower: number; margin: number; certified: number; received: number;
}

export const PROJECTS: Project[] = [
  { id: "p1", code: "PRJ-016", name: "Pune Metro Viaduct — Package 4", client: "MahaMetro", location: "Pune, MH", contractValue: 412, progress: 64, planned: 62, budgetUtil: 71, billing: "On Track", pm: "Sunita Deshmukh", end: "Aug 2026", status: "On Track", manpower: 342, margin: 12.4, certified: 236.4, received: 198.2 },
  { id: "p2", code: "PRJ-018", name: "NH-60 Flyover & Junction Works", client: "NHAI", location: "Nashik, MH", contractValue: 268, progress: 48, planned: 55, budgetUtil: 63, billing: "Submitted", pm: "Vikas Thorat", end: "Dec 2026", status: "Delayed", manpower: 218, margin: 10.8, certified: 104.1, received: 82.6 },
  { id: "p3", code: "PRJ-021", name: "Industrial Park — Phase II Infra", client: "MIDC", location: "Chakan, MH", contractValue: 186, progress: 79, planned: 76, budgetUtil: 88, billing: "Certified", pm: "Amit Bhosale", end: "May 2026", status: "Attention Required", manpower: 164, margin: 9.6, certified: 138.9, received: 121.4 },
  { id: "p4", code: "PRJ-022", name: "River Bridge Rehabilitation", client: "PWD Maharashtra", location: "Satara, MH", contractValue: 94, progress: 35, planned: 40, budgetUtil: 44, billing: "Overdue", pm: "Sunita Deshmukh", end: "Mar 2027", status: "Delayed", manpower: 96, margin: 11.1, certified: 26.8, received: 18.9 },
  { id: "p5", code: "PRJ-024", name: "Water Treatment Plant — 40 MLD", client: "Pune Municipal Corp.", location: "Hadapsar, MH", contractValue: 152, progress: 58, planned: 56, budgetUtil: 66, billing: "On Track", pm: "Neha Kulkarni", end: "Oct 2026", status: "On Track", manpower: 143, margin: 13.2, certified: 79.6, received: 70.2 },
  { id: "p6", code: "PRJ-025", name: "Township Roads & Drainage", client: "PMRDA", location: "Hinjawadi, MH", contractValue: 76, progress: 91, planned: 90, budgetUtil: 93, billing: "Certified", pm: "Vikas Thorat", end: "Apr 2026", status: "On Track", manpower: 62, margin: 10.2, certified: 67.4, received: 61.8 },
  { id: "p7", code: "PRJ-011", name: "SEZ Boundary & Infrastructure", client: "Gram Panchayat Khopoli", location: "Khopoli, MH", contractValue: 38, progress: 100, planned: 100, budgetUtil: 97, billing: "Closed", pm: "Amit Bhosale", end: "Nov 2025", status: "Completed", manpower: 0, margin: 8.9, certified: 38.0, received: 38.0 },
  { id: "p8", code: "PRJ-013", name: "Railway RUB — Km 118/4", client: "Indian Railways", location: "Lonavala, MH", contractValue: 54, progress: 100, planned: 100, budgetUtil: 95, billing: "Closed", pm: "Neha Kulkarni", end: "Sep 2025", status: "Completed", manpower: 0, margin: 11.7, certified: 54.0, received: 51.3 },
  { id: "p9", code: "PRJ-027", name: "MSRDC Interchange — Km 42", client: "MSRDC", location: "Talegaon, MH", contractValue: 214, progress: 22, planned: 25, budgetUtil: 29, billing: "Submitted", pm: "Sunita Deshmukh", end: "Jul 2027", status: "Attention Required", manpower: 187, margin: 10.5, certified: 33.2, received: 21.7 },
];

export const projectById = (id: string) => PROJECTS.find((p) => p.id === id);
export const fmtNum = (n: number, d = 0) => n.toLocaleString("en-IN", { maximumFractionDigits: d, minimumFractionDigits: d });

/* ── KPI library ─────────────────────────────────────────────── */
export interface Kpi {
  id: string; label: string; value: number; unit?: string; prefix?: string; delta: number; prev: string;
  spark: number[]; hint: string; decimals?: number; goodWhenUp?: boolean;
}
const K = (id: string, label: string, value: number, unit: string | undefined, delta: number, prev: string, hint: string, extra: Partial<Kpi> = {}): Kpi =>
  ({ id, label, value, unit, delta, prev, hint, spark: Array.from({ length: 9 }, (_, i) => Math.max(0.5, 10 + i * (delta / 6) + ((i * 7) % 5) - 2)), ...extra });

export const KPI_LIB: Record<string, Kpi> = {
  totalProjects: K("totalProjects", "Total Projects", 9, "", 0, "9 last month", "All registered projects", { decimals: 0 }),
  activeProjects: K("activeProjects", "Active Projects", 7, "", 2.1, "6 last month", "Projects currently in execution", { decimals: 0 }),
  completedProjects: K("completedProjects", "Completed", 2, "", 0, "2 last quarter", "Handed-over projects", { decimals: 0, spark: [2, 2, 2, 2, 2, 2, 2, 2, 2] }),
  contractValue: K("contractValue", "Total Contract Value", 1494, "Cr", 4.2, "₹1,434 Cr", "Sum of all signed contracts", { decimals: 0, prefix: "₹" }),
  monthlyRevenue: K("monthlyRevenue", "Current Month Revenue", 41.5, "Cr", 18.2, "₹35.1 Cr in Feb", "Certified revenue booked this month", { decimals: 1, prefix: "₹" }),
  receivables: K("receivables", "Receivables", 186.4, "Cr", -6.8, "₹200.0 Cr last month", "Client dues outstanding", { decimals: 1, prefix: "₹", goodWhenUp: false }),
  payables: K("payables", "Payables", 93.4, "Cr", 3.4, "₹90.3 Cr last month", "Vendor dues outstanding", { decimals: 1, prefix: "₹" }),
  pendingRA: K("pendingRA", "Pending RA Bills", 12, "", -14.3, "14 last month", "RA bills awaiting certification", { decimals: 0, goodWhenUp: false }),
  cashFlow: K("cashFlow", "Cash Flow Position", 11.8, "Cr", 22.4, "₹9.6 Cr last month", "Net cash position this month", { decimals: 1, prefix: "₹" }),
  profit: K("profit", "Portfolio Margin", 11.2, "%", 0.8, "10.4% last quarter", "Blended projected margin", { decimals: 1 }),
  progressAvg: K("progressAvg", "Avg. Progress", 58.6, "%", 2.4, "56.2% last month", "Weighted physical progress", { decimals: 1 }),
  costUtil: K("costUtil", "Cost Utilisation", 72.4, "%", 1.8, "70.6% last month", "Budget consumed vs earned value", { decimals: 1 }),
  manpowerOnsite: K("manpowerOnsite", "Manpower On-site", 1451, "", 3.1, "1,407 last week", "Deployed across all sites", { decimals: 0 }),
  attendanceToday: K("attendanceToday", "Attendance Today", 86.9, "%", 1.2, "85.7% yesterday", "Marked present vs deployed", { decimals: 1 }),
  onLeave: K("onLeave", "On Leave", 38, "", 5.6, "36 last week", "Approved leaves today", { decimals: 0, goodWhenUp: false }),
  openPositions: K("openPositions", "Open Positions", 14, "", -6.7, "15 last month", "Active recruitment requisitions", { decimals: 0 }),
  payrollProgress: K("payrollProgress", "Payroll Processed", 96.4, "%", 0, "96.4% last cycle", "Current payroll cycle completion", { decimals: 1 }),
  stockValue: K("stockValue", "Inventory Value", 27.4, "Cr", 2.6, "₹26.7 Cr last month", "Materials across all stores", { decimals: 1, prefix: "₹" }),
  lowStockItems: K("lowStockItems", "Low Stock Items", 6, "", 20, "5 last week", "Items below reorder level", { decimals: 0, goodWhenUp: false }),
  pendingPR: K("pendingPR", "Pending PRs", 9, "", -10, "10 last week", "Purchase requisitions in queue", { decimals: 0, goodWhenUp: false }),
  pendingPO: K("pendingPO", "Open POs", 14, "", 7.7, "13 last week", "Active purchase orders", { decimals: 0 }),
  pendingMR: K("pendingMR", "Material Requests", 11, "", 10, "10 last week", "Pending issue approvals", { decimals: 0, goodWhenUp: false }),
  prodCost: K("prodCost", "Production Cost", 4120, "₹/m³", -1.4, "₹4,178 last month", "Average cost per cubic metre", { decimals: 0, goodWhenUp: false }),
  plantUtil: K("plantUtil", "Plant Utilisation", 81.2, "%", 3.4, "77.8% last month", "Batching plant capacity used", { decimals: 1 }),
  productionToday: K("productionToday", "Production Today", 642, "m³", 4.8, "612 m³ yesterday", "Concrete batched today", { decimals: 0 }),
  dispatchToday: K("dispatchToday", "Dispatch Today", 546, "m³", 3.2, "529 m³ yesterday", "Concrete delivered today", { decimals: 0 }),
  marginPct: K("marginPct", "Portfolio Margin", 11.2, "%", 0.8, "10.4% last quarter", "Blended projected margin", { decimals: 1 }),
  overtimeHrs: K("overtimeHrs", "Overtime Hours (WK)", 1240, "hrs", 4.4, "1,188 hrs prev week", "Approved overtime across sites", { decimals: 0 }),
  trainingDue: K("trainingDue", "Safety Training Due", 46, "", -9.8, "51 last month", "Mandatory refreshers pending", { decimals: 0, goodWhenUp: false }),
  attrition: K("attrition", "Attrition (TTM)", 7.8, "%", -0.6, "8.4% prev quarter", "Rolling 12-month attrition", { decimals: 1, goodWhenUp: false }),
  mixerFleet: K("mixerFleet", "Mixers Operational", 12, "", 0, "12 last week", "Transit mixers in service of 14", { decimals: 0 }),
  pendingApprovals: K("pendingApprovals", "Pending Approvals", 17, "", -5.6, "18 last week", "Awaiting decision in queue", { decimals: 0, goodWhenUp: false }),
  tenderPipeline: K("tenderPipeline", "Tender Pipeline", 648, "Cr", 12.5, "₹576 Cr last month", "Value of bids in pipeline", { decimals: 0, prefix: "₹" }),
  certifiedBilling: K("certifiedBilling", "Certified Billing", 788.4, "Cr", 5.1, "₹750.1 Cr YTD", "Cumulative certified value", { decimals: 1, prefix: "₹" }),
};

export const ROLE_KPIS: Record<RoleId, string[]> = {
  SUPER_ADMIN: ["totalProjects", "contractValue", "monthlyRevenue", "receivables", "payables", "cashFlow", "pendingApprovals", "manpowerOnsite"],
  MD: ["contractValue", "monthlyRevenue", "profit", "receivables", "payables", "cashFlow", "pendingRA", "tenderPipeline"],
  HR: ["manpowerOnsite", "attendanceToday", "onLeave", "openPositions", "payrollProgress", "overtimeHrs", "trainingDue", "attrition"],
  ACCOUNTS: ["receivables", "payables", "cashFlow", "pendingRA", "monthlyRevenue", "costUtil", "stockValue", "pendingApprovals"],
  PROCUREMENT: ["pendingPR", "pendingPO", "pendingMR", "stockValue", "lowStockItems", "costUtil", "pendingApprovals", "contractValue"],
  PM: ["activeProjects", "progressAvg", "costUtil", "manpowerOnsite", "pendingMR", "pendingRA", "receivables", "attendanceToday"],
  SITE_ENG: ["progressAvg", "manpowerOnsite", "attendanceToday", "pendingMR", "lowStockItems", "plantUtil", "productionToday", "pendingApprovals"],
  STORE: ["stockValue", "lowStockItems", "pendingMR", "pendingPO", "pendingApprovals", "manpowerOnsite", "costUtil", "dispatchToday"],
  COMMERCIAL: ["contractValue", "certifiedBilling", "pendingRA", "receivables", "profit", "costUtil", "tenderPipeline", "pendingApprovals"],
  RMC: ["productionToday", "dispatchToday", "plantUtil", "prodCost", "mixerFleet", "lowStockItems", "pendingMR", "stockValue"],
  EMPLOYEE: ["attendanceToday", "overtimeHrs", "onLeave", "trainingDue", "payrollProgress", "manpowerOnsite", "pendingApprovals", "pendingMR"],
};

export const ROLE_WIDGETS: Record<RoleId, string[]> = {
  SUPER_ADMIN: ["kpis", "projects", "alerts", "approvals", "revexp", "cashflow", "aging", "planned", "utilization", "performance", "budgetactual", "activity"],
  MD: ["kpis", "projects", "alerts", "approvals", "revexp", "cashflow", "aging", "performance", "activity"],
  PM: ["kpis", "projects", "planned", "utilization", "siteissues", "approvals", "activity", "alerts"],
  HR: ["kpis", "manpower", "approvals", "alerts", "activity"],
  ACCOUNTS: ["kpis", "aging", "revexp", "cashflow", "budgetactual", "approvals", "activity"],
  PROCUREMENT: ["kpis", "vendors", "approvals", "stock", "alerts", "activity"],
  SITE_ENG: ["kpis", "projects", "planned", "siteissues", "approvals", "activity"],
  STORE: ["kpis", "stock", "approvals", "alerts", "activity"],
  COMMERCIAL: ["kpis", "contracts", "aging", "approvals", "revexp", "activity"],
  RMC: ["kpis", "production", "stock", "approvals", "alerts", "activity"],
  EMPLOYEE: ["kpis", "activity", "approvals", "alerts"],
};

/* ── Navigation ──────────────────────────────────────────────── */
export interface NavChild { id: string; label: string }
export interface NavItem { id: string; label: string; icon: string; roles?: RoleId[]; children?: NavChild[] }

export const NAV: NavItem[] = [
  { id: "dashboard", label: "My Workspace", icon: "grid" },
  { id: "projects", label: "Projects", icon: "hardhat", children: [{ id: "prj-all", label: "All Projects" }, { id: "prj-dash", label: "Project Dashboard" }, { id: "prj-wbs", label: "WBS & BOQ" }] },
  { id: "tenders", label: "Tender Management", icon: "gavel", roles: ["SUPER_ADMIN", "MD", "COMMERCIAL"] },
  { id: "commercial", label: "Commercial & Contracts", icon: "contract", roles: ["SUPER_ADMIN", "MD", "COMMERCIAL", "ACCOUNTS"], children: [{ id: "com-contracts", label: "Contracts" }, { id: "com-variation", label: "Variations" }, { id: "com-subs", label: "Subcontractors" }] },
  { id: "procurement", label: "Procurement", icon: "cart", roles: ["SUPER_ADMIN", "MD", "PROCUREMENT", "ACCOUNTS", "SITE_ENG", "PM"], children: [{ id: "pro-pr", label: "Purchase Requisitions" }, { id: "pro-chain", label: "Procurement Chain" }, { id: "pro-po", label: "Purchase Orders" }] },
  { id: "materials", label: "Materials", icon: "cube", children: [{ id: "mat-master", label: "Material Masters" }, { id: "mat-grn", label: "Goods Receipt" }] },
  { id: "stores", label: "Store Management", icon: "warehouse", roles: ["SUPER_ADMIN", "MD", "STORE", "PROCUREMENT", "PM", "RMC"], children: [{ id: "st-stock", label: "Stock Overview" }, { id: "st-txn", label: "Transactions" }] },
  { id: "plant", label: "Plant & Machinery", icon: "crane", roles: ["SUPER_ADMIN", "MD", "PM", "RMC", "SITE_ENG"] },
  { id: "rmc", label: "RMC Plant", icon: "mixer", roles: ["SUPER_ADMIN", "MD", "RMC", "STORE", "SITE_ENG"] },
  { id: "attendance", label: "Attendance", icon: "calcheck" },
  { id: "hr", label: "HR & People", icon: "users", roles: ["SUPER_ADMIN", "MD", "HR", "PM", "EMPLOYEE"], children: [{ id: "hr-emp", label: "Employees" }, { id: "hr-leave", label: "Leave" }, { id: "hr-recruit", label: "Recruitment" }] },
  { id: "finance", label: "Finance & Accounts", icon: "ledger", roles: ["SUPER_ADMIN", "MD", "ACCOUNTS", "COMMERCIAL"], children: [{ id: "fin-ap", label: "Payables" }, { id: "fin-ar", label: "Receivables" }, { id: "fin-ledger", label: "General Ledger" }] },
  { id: "billing", label: "Billing & RA Bills", icon: "receipt", roles: ["SUPER_ADMIN", "MD", "ACCOUNTS", "COMMERCIAL", "PM"] },
  { id: "payroll", label: "Payroll", icon: "note", roles: ["SUPER_ADMIN", "MD", "HR", "ACCOUNTS", "EMPLOYEE"] },
  { id: "approvals", label: "Approval Centre", icon: "stamp" },
  { id: "reports", label: "Reports", icon: "chart" },
  { id: "analytics", label: "Analytics & Insights", icon: "trend", roles: ["SUPER_ADMIN", "MD", "COMMERCIAL", "ACCOUNTS"] },
  { id: "documents", label: "Documents", icon: "files" },
  { id: "access", label: "User Access Matrix", icon: "shield", roles: ["SUPER_ADMIN", "MD"] },
  { id: "settings", label: "Settings", icon: "cog", roles: ["SUPER_ADMIN", "MD"] },
];

/* ── Dashboard datasets ──────────────────────────────────────── */
export const MONTHS = ["Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];

export const REV_EXP = [
  { m: "Oct", revenue: 26.2, expense: 23.1 }, { m: "Nov", revenue: 28.4, expense: 26.1 }, { m: "Dec", revenue: 32.0, expense: 29.4 },
  { m: "Jan", revenue: 24.8, expense: 27.9 }, { m: "Feb", revenue: 35.1, expense: 30.6 }, { m: "Mar", revenue: 41.5, expense: 33.8 },
];
export const CASHFLOW = [
  { m: "Oct", inflow: 24.6, outflow: 22.8 }, { m: "Nov", inflow: 28.4, outflow: 26.1 }, { m: "Dec", inflow: 32.0, outflow: 29.4 },
  { m: "Jan", inflow: 24.8, outflow: 27.9 }, { m: "Feb", inflow: 36.2, outflow: 30.1 }, { m: "Mar", inflow: 41.5, outflow: 33.6 },
];
export const AGING = [
  { bucket: "0–30 days", value: 58.2, color: "#128574" }, { bucket: "31–60 days", value: 42.6, color: "#6fb5a7" },
  { bucket: "61–90 days", value: 38.1, color: "#e0a33b" }, { bucket: "90+ days", value: 47.5, color: "#d05252" },
];
export const PLANNED_ACTUAL = [
  { m: "Oct", planned: 44.5, actual: 42.1 }, { m: "Nov", planned: 47.8, actual: 45.9 }, { m: "Dec", planned: 50.6, actual: 49.2 },
  { m: "Jan", planned: 53.9, actual: 51.4 }, { m: "Feb", planned: 56.8, actual: 55.7 }, { m: "Mar", planned: 60.2, actual: 58.6 },
];
export const BUDGET_ACTUAL = [
  { head: "Materials", budget: 18.4, actual: 19.8 }, { head: "Labour", budget: 9.2, actual: 8.9 }, { head: "Plant & Equip.", budget: 4.6, actual: 5.1 },
  { head: "Subcontracts", budget: 6.8, actual: 6.2 }, { head: "Overheads", budget: 2.4, actual: 2.6 },
];

export const ACTIVITIES = [
  { id: "a1", kind: "po", text: "PO-1287 approved — ₹26.4 L to Tata Steel", meta: "TMT Steel Fe-550D · 42 MT", time: "12 min ago", projectId: "p1", dept: "Procurement" },
  { id: "a2", kind: "grn", text: "GRN-2044 posted — PCE Admixture received", meta: "2,400 Ltr at RMC Yard", time: "41 min ago", projectId: "p1", dept: "Store Management" },
  { id: "a3", kind: "attendance", text: "Morning shift attendance submitted — PRJ-016", meta: "342 marked · 8 pending verification", time: "1 hr ago", projectId: "p1", dept: "HR" },
  { id: "a4", kind: "invoice", text: "RA-042 certified by NHAI", meta: "Gross ₹62.4 L · Net ₹45.74 L", time: "3 hrs ago", projectId: "p2", dept: "Commercial" },
  { id: "a5", kind: "payment", text: "Payment released — ₹21.6 L to Bharat Bitumen", meta: "NEFT · INV-V-3318", time: "5 hrs ago", projectId: "p3", dept: "Finance & Accounts" },
  { id: "a6", kind: "project", text: "Weekly progress updated — PRJ-021 at 79%", meta: "3 pts ahead of plan", time: "Yesterday", projectId: "p3", dept: "Project Execution" },
  { id: "a7", kind: "approval", text: "Leave approved — 3 requests cleared", meta: "HR queue cleared for the day", time: "Yesterday", projectId: "p5", dept: "HR" },
  { id: "a8", kind: "grn", text: "M-Sand inward — 180 Cu.M at Talegaon", meta: "Against PO-1288 · lot 1", time: "Yesterday", projectId: "p9", dept: "Store Management" },
] as const;

export const ALERTS = [
  { id: "al1", severity: "Critical", category: "Over-budget", text: "PRJ-021 budget utilisation at 88%", detail: "Township package nearing control budget — review M-Sand consumption", project: "p3" },
  { id: "al2", severity: "Critical", category: "Overdue", text: "RA-0772 pending certification 48+ hrs", detail: "Escalated to client coordinator — follow-up call scheduled", project: "p2" },
  { id: "al3", severity: "Warning", category: "Low Stock", text: "OPC 53 below reorder level — Pune store", detail: "2,150 bags on hand vs ROL 3,000 · PR-0092 raised", project: "p4" },
  { id: "al4", severity: "Warning", category: "Delayed", text: "PRJ-022 behind plan by 5%", detail: "Bridge rehabilitation — monsoon window at risk", project: "p4" },
  { id: "al5", severity: "Warning", category: "Contract", text: "Plant insurance expires in 21 days", detail: "EQ fleet policy — renewal quote awaited", project: "p1" },
  { id: "al6", severity: "Info", category: "Maintenance", text: "Hydra Crane 14 T maintenance due", detail: "500-hr service · scheduled Saturday", project: "p2" },
  { id: "al7", severity: "Info", category: "Approvals", text: "3 approvals pending > 24 hrs", detail: "PO-1288, PR-0093 and one payment request", project: "p3" },
] as const;

export const SITE_ISSUES = [
  { id: "ISS-101", text: "Pier cap formwork alignment rework at P4-P5", project: "PRJ-016", sev: "High", age: "2 d" },
  { id: "ISS-102", text: "Client drawing revision pending for junction widening", project: "PRJ-018", sev: "High", age: "4 d" },
  { id: "ISS-103", text: "M-Sand quality variance in latest lot", project: "PRJ-027", sev: "Medium", age: "1 d" },
  { id: "ISS-104", text: "Labour camp water supply intermittent", project: "PRJ-022", sev: "Low", age: "1 d" },
] as const;

export const TRADES = [
  { trade: "Masons", total: 420, present: 384 }, { trade: "Bar Benders", total: 260, present: 231 },
  { trade: "Carpenters", total: 210, present: 189 }, { trade: "Operators", total: 96, present: 91 },
  { trade: "Helpers", total: 465, present: 389 },
];

export const VENDORS = [
  { name: "UltraTech Cement", cat: "Cement", pos: 4, onTime: 96, rating: 4.6 },
  { name: "Tata Steel", cat: "Steel", pos: 2, onTime: 92, rating: 4.4 },
  { name: "Deccan Aggregates", cat: "Aggregates", pos: 3, onTime: 88, rating: 4.1 },
  { name: "Sika India", cat: "Admixtures", pos: 1, onTime: 94, rating: 4.5 },
  { name: "Bharat Bitumen", cat: "Bitumen", pos: 2, onTime: 81, rating: 3.8 },
];

export const STOCK = [
  { item: "OPC 53 Cement", loc: "Store A — Pune", onHand: 2150, unit: "Bags", rol: 3000, value: 8.4 },
  { item: "TMT Steel Fe-550D", loc: "Store A — Pune", onHand: 184, unit: "MT", rol: 120, value: 11.3 },
  { item: "M-Sand", loc: "Store B — Talegaon", onHand: 940, unit: "Cu.M", rol: 600, value: 1.4 },
  { item: "PCE Admixture", loc: "RMC Yard", onHand: 2400, unit: "Ltr", rol: 1500, value: 2.2 },
  { item: "Plywood 18 mm", loc: "Store A — Pune", onHand: 310, unit: "Sheets", rol: 400, value: 5.7 },
  { item: "Binding Wire", loc: "Store C — Nashik", onHand: 820, unit: "kg", rol: 500, value: 0.6 },
];

export const PRODUCTION = [
  { d: "Mon", target: 660, actual: 612 }, { d: "Tue", target: 660, actual: 648 }, { d: "Wed", target: 680, actual: 702 },
  { d: "Thu", target: 680, actual: 655 }, { d: "Fri", target: 700, actual: 689 }, { d: "Sat", target: 640, actual: 642 },
];

export const CONTRACTS = [
  { name: "Pune Metro Viaduct — Pkg 4", client: "MahaMetro", base: 412, variation: 14.2, certified: 236.4, billed: 224.1, margin: 12.4 },
  { name: "NH-60 Flyover & Junction", client: "NHAI", base: 268, variation: 8.6, certified: 104.1, billed: 96.7, margin: 10.8 },
  { name: "Industrial Park Phase II", client: "MIDC", base: 186, variation: 4.1, certified: 138.9, billed: 131.2, margin: 9.6 },
  { name: "Water Treatment Plant 40 MLD", client: "PMC", base: 152, variation: 2.8, certified: 79.6, billed: 74.9, margin: 13.2 },
  { name: "MSRDC Interchange Km 42", client: "MSRDC", base: 214, variation: 0, certified: 33.2, billed: 29.8, margin: 10.5 },
];
