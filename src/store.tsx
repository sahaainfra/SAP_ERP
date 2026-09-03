/* Meridian ERP · central store — one interconnected state for all modules */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ACCESS, MODULES, PROJECTS, ROLES } from "./data";
import type { ModuleId, RoleId } from "./data";
import type { Project } from "./data";

/* ── helpers ─────────────────────────────────────────────────── */
export const dStr = (offsetDays: number) => {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
export const dISO = (minAgo: number) => new Date(Date.now() - minAgo * 60000).toISOString();
const nowHrs = (offset: number) => new Date(Date.now() + offset * 3600e3);

/* ── types ───────────────────────────────────────────────────── */
export interface Notif { id: string; ts: string; type: "approval" | "stock" | "payment" | "project" | "hr" | "system"; text: string; read: boolean }
export interface AuditEntry { id: string; ts: string; user: string; role: string; module: string; action: string; entity: string; detail: string; ip: string }
export interface UserRec {
  id: string; name: string; email: string; role: RoleId; dept: string; project: string; site: string;
  office: "Head Office" | "Site Office" | "RMC Plant" | "Warehouse" | "Regional Office";
  finLimit: number; active: boolean; lastLogin: string; manager?: string;
  signature?: { svg: string; ver: number; active: boolean; updated: string };
}
export interface Workflow { id: string; name: string; module: string; levels: string; basis: string; active: boolean }
export interface SeriesRec { doc: string; prefix: string; next: number }
export interface DocFile { id: string; name: string; folder: string; type: string; ver: number; size: string; uploaded: string; by: string; expiry?: string }

export type ProcType = "PR" | "RFQ" | "CS" | "PO" | "GRN" | "PINV" | "PAY";
export const PROC_STAGES: ProcType[] = ["PR", "RFQ", "CS", "PO", "GRN", "PINV", "PAY"];
export const PROC_LABEL: Record<ProcType, string> = { PR: "Requisition", RFQ: "RFQ", CS: "Comparison", PO: "Order", GRN: "Receipt", PINV: "Invoice", PAY: "Payment" };
export interface ProcDoc { id: string; code: string; type: ProcType; ref?: string; project: string; party: string; items: string; qty: number; unit: string; amount: number; date: string; status: string; by: string }

export type PRStatus = "Draft" | "Submitted" | "Under Approval" | "Approved" | "Partially Converted" | "Fully Converted" | "Closed" | "Rejected" | "Returned";
export interface PRLine { id: string; code: string; desc: string; spec: string; brand: string; unit: string; boqRef: string; boqNo: string; qty: number; rate: number; remarks: string }
export interface PRDoc {
  id: string; no: string; date: string; project: string; dept: string; site: string; by: string;
  need: string; priority: "Normal" | "Urgent" | "Critical"; purpose: string; costCentre: string;
  lines: PRLine[]; status: PRStatus; ts: number; history: { ts: number; action: string; by: string }[];
}
export type POStatus = "Draft" | "Pending Approval" | "Approved" | "Dispatched" | "Closed";
export interface POLine { id: string; code: string; desc: string; spec: string; brand: string; unit: string; boqRef: string; boqNo: string; qty: number; prevQty: number; rate: number; disc: number; gst: number; schedule: string }
export interface PODoc {
  id: string; no: string; date: string; vendor: string; vendorAddr: string; gst: string; contact: string; email: string; phone: string;
  project: string; site: string; costCentre: string; prRef: string; rfqRef: string; quotRef: string; quotDate: string; negoRef: string;
  lines: POLine[]; freight: number; loading: number; other: number; terms: string[]; termsLocked: boolean;
  status: POStatus; ts: number; acceptedBy?: string;
}

export interface Punch { id: string; user: string; date: string; inAt?: string; outAt?: string; breakStart?: string; breakEnd?: string; method: string; project: string; status: "Present" | "Late" | "Half Day" | "On Leave" | "Holiday" }
export interface Msg {
  id: string; ch: string; user: string; role: string; ts: string;
  kind: "text" | "update" | "issue" | "file";
  text: string;
  meta?: { work?: string; manpower?: string; issues?: string; plan?: string; file?: string };
  reactions: Record<string, number>;
  replyTo?: string; pinned?: boolean;
}

/* identity & authority */
/* Salted, iterated one-way hash for demo credentials — never stored or rendered in plain text */
export const demoHash = (s: string) => {
  const salted = "sahaa$m3r1d1an$" + s + "#v2";
  let h = 0x811c9dc5;
  for (let round = 0; round < 64; round++) {
    for (let i = 0; i < salted.length; i++) { h ^= salted.charCodeAt(i) ^ (round * 31); h = Math.imul(h, 0x01000193) >>> 0; }
  }
  return "pbk$64$" + h.toString(16).padStart(8, "0") + "$" + (h ^ 0x5bd1e995).toString(16).padStart(8, "0");
};
export interface Cred { username: string; hash: string; mobile: string; mustChange: boolean; failed: number; lockedUntil?: number; joinDate: string; status: "Active" | "Inactive" | "Locked" }
export interface LoginRec { id: string; user: string; ts: string; device: string; ip: string; status: "Success" | "Failed" | "Locked" | "Password Changed" }
export interface SessionRec { id: string; user: string; device: string; ip: string; started: string; lastActive: string; current?: boolean }
export interface AssignmentRec { id: string; user: string; empId: string; project: string; site: string; role: string; responsibility: string; manager: string; finLimit: string; from: string; to: string; status: "Active" | "Closed" }
export interface DelegationRec { id: string; from: string; to: string; txn: string; project: string; fromD: string; toD: string; reason: string; status: "Active" | "Expired"; approvedBy: string }
export interface AttLock { period: string; lockedBy: string; ts: string; reason: string; unlockedBy?: string }
export interface MatrixLevel { role: string; limit: string; backup: string }
export interface MatrixRow { id: string; doc: string; levels: MatrixLevel[] }

/* billing */
export type BillStatus = "Draft" | "Under Preparation" | "Submitted for Checking" | "Under Approval" | "Approved" | "Submitted to Client" | "Under Client Certification" | "Certified" | "Partially Paid" | "Fully Paid" | "Returned for Correction" | "Rejected" | "Cancelled";
export interface BillBoqLine { id: string; project: string; itemNo: string; desc: string; spec: string; unit: string; contractQty: number; rate: number; prevQty: number; currentQty: number }
export interface MBEntry { id: string; mbNo: string; page: string; date: string; project: string; location: string; boqItem: string; boqNo: string; desc: string; drawing: string; unit: string; by: string; status: "Contractor" | "Internal" | "Client" | "Certified"; meas: { id: string; nos: number; l: number; b: number; h: number }[] }
export interface ExtraItem { id: string; no: string; project: string; desc: string; spec: string; unit: string; qty: number; rate: number; justification: string; drawing: string; status: string; approvalDate?: string }
export interface VariationItem { id: string; no: string; project: string; desc: string; origQty: number; revQty: number; origRate: number; revRate: number; amount: number; status: string }
export interface EscalationItem { id: string; no: string; project: string; head: string; baseIndex: number; currentIndex: number; weightage: number; eligibleAmt: number }
export interface AdvanceItem { id: string; no: string; project: string; kind: "Mobilization" | "Material"; sanctioned: number; paid: number; recPct: number; recovered: number }
export interface DeductionCfg { id: string; head: string; basis: string; value: number; active: boolean }
export interface BillDoc {
  id: string; no: string; rev: number; project: string; client: string; period: string; date: string; type: string;
  gross: number; deductions: number; gst: number; net: number; certifiedAmt?: number; certifiedDate?: string; received?: number;
  status: BillStatus; by: string; ts: number; checklist: Record<string, boolean>; lines: { itemNo: string; desc: string; unit: string; prevQty: number; currentQty: number; rate: number }[];
}

/* workspace */
export interface Task { id: string; title: string; due: string; status: "Open" | "Overdue" | "Done"; forRole: RoleId; forUser?: string; link?: string }
export interface QueryRec { id: string; docRef: string; raisedBy: string; text: string; field?: string; priority?: string; due?: string; status: "Open" | "Responded" | "Resolved"; response?: string; ts: number }
export interface VersionRec { id: string; docRef: string; ver: number; date: string; user: string; reason: string; status: string }
export interface SignLog { id: string; docRef: string; name: string; desig: string; role: string; date: string; time: string; svg: string; ip: string; comment: string; action: "Approved" | "Rejected" | "Certified" }
export interface AccessFlags { v: boolean; c: boolean; e: boolean; a: boolean; s: boolean }

export const PURCHASE_MEMORY: Record<string, { vendor: string; rate: number; po: string; date: string }> = {
  "OPC 53 Cement": { vendor: "UltraTech Cement", rate: 390, po: "PO-1284", date: "22 Jan 2026" },
  "TMT Steel Fe-550D": { vendor: "Tata Steel", rate: 61500, po: "PO-1281", date: "14 Jan 2026" },
  "M-Sand": { vendor: "Deccan Aggregates", rate: 1450, po: "PO-1279", date: "08 Jan 2026" },
  "Admixture (PCE)": { vendor: "Sika India", rate: 92, po: "PO-1276", date: "19 Dec 2025" },
  "Binding Wire": { vendor: "Sudarshan Traders", rate: 78, po: "PO-1274", date: "12 Dec 2025" },
  "Plywood Formwork": { vendor: "GreenPly Industries", rate: 1850, po: "PO-1271", date: "02 Dec 2025" },
};

export const TERMS_LIBRARY: { id: string; scope: string; text: string }[] = [
  { id: "t1", scope: "Standard", text: "Prices are firm and inclusive of all taxes unless stated; any statutory change in GST after PO date shall be adjusted on actuals with documentary proof." },
  { id: "t2", scope: "Standard", text: "Delivery within the schedule stated against each line item; delay beyond 7 days attracts liquidated damages of 0.5% of delayed value per week, capped at 5%." },
  { id: "t3", scope: "Standard", text: "Delivery at project site, unloaded, stacked and secured as directed by the Site In-charge. Transit insurance to be arranged by the vendor." },
  { id: "t4", scope: "Quality", text: "Material must conform to the referenced IS codes / approved make list; Mill Test Certificates and batch-wise QC records to accompany each consignment." },
  { id: "t5", scope: "Quality", text: "Company reserves the right to test material at NABL-accredited labs; material failing test shall be replaced within 72 hours at vendor's cost including re-testing." },
  { id: "t6", scope: "Standard", text: "Quantity tolerance ±3% for bulk materials; short / excess supply will be reconciled at site measurement and settled on actuals." },
  { id: "t7", scope: "Payment", text: "Payment within 30 days from receipt of original tax invoice, GRN copy and e-way bill, subject to deduction of advances and recoveries." },
  { id: "t8", scope: "Payment", text: "No interest shall be payable on delayed payments beyond the agreed credit period." },
  { id: "t9", scope: "Standard", text: "Rejected material shall be removed from site within 48 hours at vendor's risk and cost; failing which Company may dispose it off on behalf of the vendor." },
  { id: "t10", scope: "Compliance", text: "Vendor shall comply with all statutory obligations (GST, EPF, ESI, Labour Laws) and safety norms of the site; violations are at vendor's sole risk." },
  { id: "t11", scope: "Standard", text: "Company may cancel unexecuted balance with 15 days' notice without liability; Force Majeure events shall be settled as per Contract Act." },
  { id: "t12", scope: "Legal", text: "Subject to Pune jurisdiction. This PO is governed by the General Terms (Rev 4) available at Company's vendor portal." },
];

/* ── seed ────────────────────────────────────────────────────── */
const seed = () => ({
  projects: PROJECTS as Project[],
  tenders: [
    { id: "t1", no: "TND-2026-014", authority: "NHAI — RO Pune", nit: "NIT/2025-26/1189", value: 214, emd: 2.1, fee: 0.5, deadline: dStr(-6), opening: dStr(-8), stage: 8, status: "Bid Submitted", docs: { NIT: true, BOQ: true, Drawings: true, Specifications: true, "Eligibility Docs": true, "Pre-bid Queries": true } },
    { id: "t2", no: "TND-2026-015", authority: "MSRDC", nit: "NIT/2025-26/1244", value: 86, emd: 0.86, fee: 0.25, deadline: dStr(-3), opening: dStr(-5), stage: 6, status: "Rate Analysis", docs: { NIT: true, BOQ: true, Drawings: true, Specifications: false, "Eligibility Docs": true, "Pre-bid Queries": false } },
    { id: "t3", no: "TND-2026-011", authority: "Pune Municipal Corp.", nit: "NIT/2025-26/1102", value: 42, emd: 0.42, fee: 0.2, deadline: dStr(12), opening: dStr(10), stage: 9, status: "Awarded — L1", docs: { NIT: true, BOQ: true, Drawings: true, Specifications: true, "Eligibility Docs": true, "Pre-bid Queries": true } },
    { id: "t4", no: "TND-2026-016", authority: "Indian Railways", nit: "NIT/2025-26/1310", value: 128, emd: 1.28, fee: 0.35, deadline: dStr(-11), opening: dStr(-13), stage: 4, status: "Technical Review", docs: { NIT: true, BOQ: true, Drawings: false, Specifications: false, "Eligibility Docs": false, "Pre-bid Queries": false } },
  ],
  proc: [
    { id: "pc1", code: "PR-0086", type: "PR", project: "P1", party: "RMC Operations", items: "Admixture (PCE)", qty: 800, unit: "Ltr", amount: 7.4, date: dStr(-15), status: "Approved", by: "Sandeep Kulkarni" },
    { id: "pc2", code: "RFQ-0405", type: "RFQ", ref: "PR-0086", project: "P1", party: "3 vendors invited", items: "Admixture (PCE)", qty: 800, unit: "Ltr", amount: 7.3, date: dStr(-13), status: "Closed", by: "Imran Shaikh" },
    { id: "pc3", code: "CS-0188", type: "CS", ref: "RFQ-0405", project: "P1", party: "L1 — Sika India", items: "Admixture (PCE)", qty: 800, unit: "Ltr", amount: 7.2, date: dStr(-12), status: "L1 Recommended", by: "Imran Shaikh" },
    { id: "pc4", code: "PO-1276", type: "PO", ref: "CS-0188", project: "P1", party: "Sika India", items: "Admixture (PCE)", qty: 800, unit: "Ltr", amount: 7.2, date: dStr(-11), status: "Approved", by: "Imran Shaikh" },
    { id: "pc5", code: "GRN-2041", type: "GRN", ref: "PO-1276", project: "P1", party: "Sika India", items: "Admixture (PCE)", qty: 800, unit: "Ltr", amount: 7.2, date: dStr(-8), status: "Received", by: "Dinesh Pawar" },
    { id: "pc6", code: "INV-V-3320", type: "PINV", ref: "GRN-2041", project: "P1", party: "Sika India", items: "Admixture (PCE)", qty: 800, unit: "Ltr", amount: 7.2, date: dStr(-7), status: "Booked", by: "Prakash Rao" },
    { id: "pc7", code: "PR-0093", type: "PR", project: "P1", party: "Project Execution", items: "TMT Steel Fe-550D", qty: 42, unit: "MT", amount: 25.8, date: dStr(-1), status: "Pending Approval", by: "Vikas Thorat" },
    { id: "pc8", code: "PR-0089", type: "PR", project: "P3", party: "Project Execution", items: "M-Sand", qty: 350, unit: "Cu.M", amount: 5.1, date: dStr(-6), status: "Approved", by: "Sunita Deshmukh" },
    { id: "pc9", code: "PO-1288", type: "PO", ref: "PR-0089", project: "P3", party: "UltraTech Cement", items: "M-Sand (via UTC)", qty: 350, unit: "Cu.M", amount: 5.0, date: dStr(-1), status: "Pending Approval", by: "Imran Shaikh" },
  ] as ProcDoc[],
  prs: [
    { id: "pr1", no: "PR-0093", date: dStr(-1), project: "P1", dept: "Project Execution", site: "Site Office — Pachgaon", by: "Vikas Thorat", need: dStr(9), priority: "Critical", purpose: "Urgent requirement for pier cap concreting — piling sequence slips if steel is not on site within a week.", costCentre: "CC-P1-MAT", status: "Under Approval", ts: nowHrs(-30).getTime(), lines: [
      { id: "l1", code: "MAT-014", desc: "TMT Steel Fe-550D", spec: "IS 1786:2008, CRS ribbed, bend tested", brand: "Tata / JSW", unit: "MT", boqRef: "BOQ-P1", boqNo: "2.4", qty: 42, rate: 61500, remarks: "MTC mandatory" },
      { id: "l2", code: "MAT-021", desc: "Binding Wire", spec: "20 gauge annealed", brand: "Any approved", unit: "kg", boqRef: "BOQ-P1", boqNo: "2.6", qty: 900, rate: 78, remarks: "" },
    ], history: [{ ts: nowHrs(-30).getTime(), action: "Submitted", by: "Vikas Thorat" }, { ts: nowHrs(-6).getTime(), action: "Forwarded to Procurement Manager", by: "Sunita Deshmukh" }] },
    { id: "pr2", no: "PR-0092", date: dStr(-2), project: "P4", dept: "Project Execution", site: "Site Office — Wagholi", by: "Amit Bhosale", need: dStr(14), priority: "Urgent", purpose: "Retaining wall concreting planned for next fortnight; cement and admixture to reach store before 20th.", costCentre: "CC-P4-MAT", status: "Submitted", ts: nowHrs(-52).getTime(), lines: [
      { id: "l1", code: "MAT-002", desc: "OPC 53 Cement", spec: "IS 12269, fresh stock < 30 days", brand: "UltraTech / ACC", unit: "Bag", boqRef: "BOQ-P4", boqNo: "3.1", qty: 1200, rate: 390, remarks: "Silos preferred" },
      { id: "l2", code: "MAT-031", desc: "Admixture (PCE)", spec: "IS 9103, retarder cum plasticiser", brand: "Sika / BASF", unit: "Ltr", boqRef: "BOQ-P4", boqNo: "3.4", qty: 400, rate: 92, remarks: "Lab trial done" },
    ], history: [{ ts: nowHrs(-52).getTime(), action: "Submitted", by: "Amit Bhosale" }] },
    { id: "pr3", no: "PR-0091", date: dStr(0), project: "P2", dept: "Plant & Machinery", site: "Central Store — Chakan", by: "Dinesh Pawar", need: dStr(21), priority: "Normal", purpose: "Formwork material for deck slab cycle 2; plywood sheets as per approved formwork drawings.", costCentre: "CC-P2-PLT", status: "Draft", ts: nowHrs(-2).getTime(), lines: [
      { id: "l1", code: "MAT-042", desc: "Plywood Formwork", spec: "18 mm, film-faced, WBP grade", brand: "GreenPly", unit: "Sheet", boqRef: "BOQ-P2", boqNo: "5.2", qty: 260, rate: 1850, remarks: "8×4 ft size" },
    ], history: [{ ts: nowHrs(-2).getTime(), action: "Saved as Draft", by: "Dinesh Pawar" }] },
    { id: "pr4", no: "PR-0089", date: dStr(-6), project: "P3", dept: "Project Execution", site: "Site Office — Talegaon", by: "Sunita Deshmukh", need: dStr(3), priority: "Urgent", purpose: "Final stretch bituminous works — M-Sand consumption higher than planned due to sub-base correction.", costCentre: "CC-P3-MAT", status: "Approved", ts: nowHrs(-150).getTime(), lines: [
      { id: "l1", code: "MAT-008", desc: "M-Sand", spec: "Zone II, < 3% fines, washed", brand: "Deccan", unit: "Cu.M", boqRef: "BOQ-P3", boqNo: "7.3", qty: 350, rate: 1450, remarks: "In 2 equal lots" },
    ], history: [{ ts: nowHrs(-150).getTime(), action: "Submitted", by: "Sunita Deshmukh" }, { ts: nowHrs(-140).getTime(), action: "Approved", by: "Imran Shaikh" }] },
    { id: "pr5", no: "PR-0086", date: dStr(-15), project: "P1", dept: "RMC Operations", site: "RMC Plant — Kharadi", by: "Sandeep Kulkarni", need: dStr(-5), priority: "Normal", purpose: "Monthly replenishment of admixture stock against production plan.", costCentre: "CC-RMC-MAT", status: "Fully Converted", ts: nowHrs(-360).getTime(), lines: [
      { id: "l1", code: "MAT-031", desc: "Admixture (PCE)", spec: "IS 9103", brand: "Sika", unit: "Ltr", boqRef: "BOQ-RMC", boqNo: "1.8", qty: 800, rate: 92, remarks: "" },
    ], history: [{ ts: nowHrs(-360).getTime(), action: "Approved", by: "Imran Shaikh" }, { ts: nowHrs(-330).getTime(), action: "Converted to PO-1276", by: "Imran Shaikh" }] },
    { id: "pr6", no: "PR-0084", date: dStr(-19), project: "P5", dept: "Project Execution", site: "Site Office — Hadapsar", by: "Vikas Thorat", need: dStr(-8), priority: "Normal", purpose: "Site consumables replenishment.", costCentre: "CC-P5-MAT", status: "Rejected", ts: nowHrs(-460).getTime(), lines: [
      { id: "l1", code: "MAT-055", desc: "Safety Net", spec: "HDPE braided, green", brand: "Any", unit: "Sq.M", boqRef: "—", boqNo: "—", qty: 600, rate: 22, remarks: "" },
    ], history: [{ ts: nowHrs(-460).getTime(), action: "Rejected — duplicate of PR-0082", by: "Imran Shaikh" }] },
  ] as PRDoc[],
  pos: [
    { id: "po1", no: "PO-1288", date: dStr(-1), vendor: "UltraTech Cement", vendorAddr: "Birla Bhavan, M.P. Nagar, Mumbai 400021", gst: "27AAACU1901R1ZK", contact: "Rohit Salunkhe", email: "r.salunkhe@ultratech.com", phone: "+91 98220 44120", project: "P3", site: "Talegaon Batching Plant", costCentre: "CC-P3-MAT", prRef: "PR-0089", rfqRef: "RFQ-0412", quotRef: "UTC/Q/8841", quotDate: dStr(-4), negoRef: "Negotiated on 12 Mar — 2% off list", lines: [
      { id: "l1", code: "MAT-008", desc: "M-Sand", spec: "Zone II, washed, < 3% fines", brand: "Deccan (via UTC)", unit: "Cu.M", boqRef: "BOQ-P3", boqNo: "7.3", qty: 350, prevQty: 0, rate: 1420, disc: 1, gst: 5, schedule: "Lot 1 — 175 Cu.M by 18 Mar; Lot 2 by 25 Mar" },
    ], freight: 18000, loading: 4000, other: 0, terms: ["t1", "t2", "t4", "t6", "t7", "t9", "t12"].map((id) => TERMS_LIBRARY.find((t) => t.id === id)!.text), termsLocked: false, status: "Pending Approval", ts: nowHrs(-26).getTime() },
    { id: "po2", no: "PO-1287", date: dStr(-5), vendor: "Tata Steel", vendorAddr: "Bombay House, 24 Homi Mody St, Mumbai 400001", gst: "27AAACT2727Q1ZW", contact: "Priya Nair", email: "priya.nair@tatasteel.com", phone: "+91 98333 71210", project: "P1", site: "Pachgaon Yard", costCentre: "CC-P1-MAT", prRef: "PR-0093", rfqRef: "RFQ-0409", quotRef: "TS/EST/4471", quotDate: dStr(-9), negoRef: "L1 — base rate as quoted", lines: [
      { id: "l1", code: "MAT-014", desc: "TMT Steel Fe-550D", spec: "IS 1786:2008 CRS, 12–25 mm mix as per BBS", brand: "Tata Tiscon", unit: "MT", boqRef: "BOQ-P1", boqNo: "2.4", qty: 42, prevQty: 18, rate: 61500, disc: 0, gst: 18, schedule: "Single lot — 10 days from PO" },
      { id: "l2", code: "MAT-021", desc: "Binding Wire", spec: "20 gauge annealed, 5 kg coils", brand: "Tata", unit: "kg", boqRef: "BOQ-P1", boqNo: "2.6", qty: 900, prevQty: 300, rate: 78, disc: 2, gst: 18, schedule: "Along with steel lot" },
    ], freight: 0, loading: 0, other: 6000, terms: ["t1", "t3", "t4", "t5", "t7", "t10", "t12"].map((id) => TERMS_LIBRARY.find((t) => t.id === id)!.text), termsLocked: true, status: "Approved", ts: nowHrs(-120).getTime(), acceptedBy: "Priya Nair · Tata Steel · " + dStr(-3) },
    { id: "po3", no: "PO-1284", date: dStr(-24), vendor: "UltraTech Cement", vendorAddr: "Birla Bhavan, M.P. Nagar, Mumbai 400021", gst: "27AAACU1901R1ZK", contact: "Rohit Salunkhe", email: "r.salunkhe@ultratech.com", phone: "+91 98220 44120", project: "P4", site: "Wagholi Store", costCentre: "CC-P4-MAT", prRef: "PR-0088", rfqRef: "RFQ-0401", quotRef: "UTC/Q/8620", quotDate: dStr(-28), negoRef: "—", lines: [
      { id: "l1", code: "MAT-002", desc: "OPC 53 Cement", spec: "IS 12269, 50 kg bags", brand: "UltraTech", unit: "Bag", boqRef: "BOQ-P4", boqNo: "3.1", qty: 1500, prevQty: 3200, rate: 390, disc: 0, gst: 18, schedule: "300 bags weekly" },
    ], freight: 22000, loading: 0, other: 0, terms: ["t1", "t2", "t7", "t12"].map((id) => TERMS_LIBRARY.find((t) => t.id === id)!.text), termsLocked: true, status: "Closed", ts: nowHrs(-580).getTime(), acceptedBy: "Rohit Salunkhe · UltraTech · " + dStr(-23) },
  ] as PODoc[],
  punches: [
    { id: "pu1", user: "Sunita Deshmukh", date: dStr(-1), inAt: "09:02", outAt: "18:24", method: "GPS punch", project: "P1", status: "Present" },
    { id: "pu2", user: "Sunita Deshmukh", date: dStr(-2), inAt: "09:41", outAt: "18:05", method: "Web punch", project: "P1", status: "Late" },
    { id: "pu3", user: "Sunita Deshmukh", date: dStr(-3), inAt: "08:55", outAt: "20:10", method: "GPS punch", project: "P1", status: "Present" },
  ] as Punch[],
  matrix: [
    { id: "mx1", doc: "Purchase Requisition", levels: [{ role: "Site Engineer", limit: "≤ ₹2 L", backup: "Project Engineer" }, { role: "Project Manager", limit: "≤ ₹10 L", backup: "Sr. Project Manager" }, { role: "Procurement Manager", limit: "≤ ₹50 L", backup: "Supply Chain Head" }, { role: "Managing Director", limit: "> ₹50 L", backup: "—" }] },
    { id: "mx2", doc: "Purchase Order", levels: [{ role: "Procurement Manager", limit: "≤ ₹25 L", backup: "Supply Chain Head" }, { role: "Accounts Manager", limit: "All (parallel)", backup: "—" }, { role: "Commercial Manager", limit: "≤ ₹75 L", backup: "—" }, { role: "Managing Director", limit: "> ₹75 L", backup: "—" }] },
    { id: "mx3", doc: "Vendor Payment", levels: [{ role: "Accounts Executive", limit: "≤ ₹5 L", backup: "Accounts Manager" }, { role: "Accounts Manager", limit: "≤ ₹25 L", backup: "Finance Controller" }, { role: "Managing Director", limit: "> ₹25 L", backup: "—" }] },
    { id: "mx4", doc: "Attendance", levels: [{ role: "Reporting Manager", limit: "All", backup: "Site Supervisor" }, { role: "HR Manager", limit: "Final lock", backup: "—" }] },
    { id: "mx5", doc: "RA Bill", levels: [{ role: "Site Engineer", limit: "Measurement", backup: "Project Engineer" }, { role: "Project Manager", limit: "Verification", backup: "—" }, { role: "Commercial Manager", limit: "≤ ₹5 Cr", backup: "—" }, { role: "Management", limit: "> ₹5 Cr", backup: "—" }] },
  ] as MatrixRow[],

  materials: [
    { code: "MAT-002", name: "OPC 53 Cement", cat: "Cement", subCat: "OPC", type: "Material", group: "Binding Material", trade: "Concrete", unit: "Bag", altUom: "MT", conv: 20, rol: 3000, rate: 0.00039, shortDesc: "OPC 53 grade cement, 50 kg bag", fullDesc: "Ordinary Portland Cement of 53 grade conforming to IS 12269, packed in 50 kg moisture-proof bags, fresh stock, free from lumps and foreign matter, suitable for RCC, PSC and general construction.", grade: "53", size: "50 kg", brand: "UltraTech", mfr: "UltraTech Cement Ltd.", isCode: "IS 12269", application: "RCC / PSC / Mortar", hsn: "2523", gst: 28, cgst: 14, sgst: 14, igst: 28, cess: 0, taxInclusive: false, reverseCharge: false, cpwdRef: "DSR 2024 · Ch-1 · 1.1", cpwdYear: "2024", cpwdDesc: "Portland cement OPC 53 grade", cpwdRate: 382, cpwdUnit: "Bag", cpwdSource: "CPWD DSR 2024", cpwdEff: "01 Oct 2023", stdRate: 390, workingRate: 395, workingEff: "01 Mar 2026", lastRate: 388, lastPO: "PO-1288", avgRate: 391, status: "Active", docs: [{ name: "IS 12269 Specification.pdf", type: "Standard", ver: 2 }, { name: "UltraTech Datasheet.pdf", type: "Datasheet", ver: 1 }, { name: "Test Certificate — Mar.pdf", type: "Test Cert", ver: 1 }] },
    { code: "MAT-008", name: "M-Sand", cat: "Aggregates", subCat: "Manufactured Sand", type: "Material", group: "Fine Aggregate", trade: "Concrete", unit: "Cu.M", altUom: "MT", conv: 1.6, rol: 600, rate: 0.000145, shortDesc: "Manufactured sand, Zone II", fullDesc: "Machine-crushed manufactured sand (M-Sand) of Zone II grading conforming to IS 383, washed, with fines below 3%, suitable for concrete and mortar, free from clay, silt and organic impurities.", grade: "Zone II", size: "4.75 mm max", brand: "Deccan", mfr: "Deccan Aggregates", isCode: "IS 383", application: "Concrete / Mortar", hsn: "2505", gst: 5, cgst: 2.5, sgst: 2.5, igst: 5, cess: 0, taxInclusive: false, reverseCharge: false, cpwdRef: "DSR 2024 · Ch-2 · 2.3", cpwdYear: "2024", cpwdDesc: "Sand (manufactured / river) for concrete", cpwdRate: 1380, cpwdUnit: "Cu.M", cpwdSource: "CPWD DSR 2024", cpwdEff: "01 Oct 2023", stdRate: 1450, workingRate: 1480, workingEff: "01 Mar 2026", lastRate: 1460, lastPO: "PO-1281", avgRate: 1455, status: "Active", docs: [{ name: "Sieve Analysis Report.pdf", type: "Test Cert", ver: 3 }] },
    { code: "MAT-014", name: "TMT Steel Fe-550D", cat: "Steel", subCat: "Reinforcement Steel", type: "Material", group: "TMT Bars", trade: "Reinforcement", unit: "MT", altUom: "kg", conv: 1000, rol: 120, rate: 0.00615, shortDesc: "TMT bars Fe-550D, CRS", fullDesc: "Thermo-Mechanically Treated (TMT) deformed steel bars of grade Fe-550D conforming to IS 1786:2008, cold-rolled ribs, 12–25 mm diameter mix as per bar bending schedule, with mill test certificate.", grade: "Fe-550D", size: "12–25 mm", brand: "Tata Tiscon", mfr: "Tata Steel Ltd.", isCode: "IS 1786:2008", application: "RCC Reinforcement", hsn: "7214", gst: 18, cgst: 9, sgst: 9, igst: 18, cess: 0, taxInclusive: false, reverseCharge: false, cpwdRef: "DSR 2024 · Ch-3 · 3.2", cpwdYear: "2024", cpwdDesc: "TMT steel Fe-550D reinforcement bars", cpwdRate: 60200, cpwdUnit: "MT", cpwdSource: "CPWD DSR 2024", cpwdEff: "01 Oct 2023", stdRate: 61500, workingRate: 62400, workingEff: "01 Mar 2026", lastRate: 61500, lastPO: "PO-1287", avgRate: 61100, status: "Active", docs: [{ name: "Mill Test Certificate.pdf", type: "Test Cert", ver: 4 }, { name: "IS 1786 Extract.pdf", type: "Standard", ver: 1 }] },
    { code: "MAT-021", name: "Binding Wire", cat: "Consumables", subCat: "Binding Wire", type: "Consumable", group: "Binding Wire", trade: "Reinforcement", unit: "kg", altUom: "MT", conv: 0.001, rol: 500, rate: 0.0000078, shortDesc: "Soft annealed binding wire, 20 gauge", fullDesc: "Soft annealed mild steel binding wire of 20 gauge conforming to IS 280, supplied in 10 kg coils, free from rust and kinks, for tying reinforcement bars.", grade: "20 gauge", size: "0.9 mm", brand: "SAIL", mfr: "SAIL", isCode: "IS 280", application: "Rebar tying", hsn: "7217", gst: 18, cgst: 9, sgst: 9, igst: 18, cess: 0, taxInclusive: false, reverseCharge: false, cpwdRef: "DSR 2024 · Ch-3 · 3.9", cpwdYear: "2024", cpwdDesc: "Binding wire (annealed)", cpwdRate: 74, cpwdUnit: "kg", cpwdSource: "CPWD DSR 2024", cpwdEff: "01 Oct 2023", stdRate: 78, workingRate: 80, workingEff: "01 Mar 2026", lastRate: 79, lastPO: "PO-1265", avgRate: 78, status: "Active", docs: [] },
    { code: "MAT-031", name: "Admixture (PCE)", cat: "Admixtures", subCat: "Superplasticizer", type: "Material", group: "Chemical Admixture", trade: "Concrete", unit: "Ltr", altUom: "Kg", conv: 1.05, rol: 1500, rate: 0.0000092, shortDesc: "PCE-based superplasticizer", fullDesc: "Polycarboxylate Ether (PCE) based high-range water reducing superplasticizer conforming to IS 9103 (Type F), for high-performance and pumped concrete, supplied in 250 kg barrels.", grade: "Type F", size: "250 kg barrel", brand: "Sika ViscoCrete", mfr: "Sika India Pvt. Ltd.", isCode: "IS 9103", application: "RMC / High-performance concrete", hsn: "3824", gst: 18, cgst: 9, sgst: 9, igst: 18, cess: 0, taxInclusive: false, reverseCharge: false, cpwdRef: "DSR 2024 · Ch-1 · 1.8", cpwdYear: "2024", cpwdDesc: "Superplasticizer (PCE based)", cpwdRate: 88, cpwdUnit: "Ltr", cpwdSource: "CPWD DSR 2024", cpwdEff: "01 Oct 2023", stdRate: 92, workingRate: 95, workingEff: "01 Mar 2026", lastRate: 93, lastPO: "PO-1276", avgRate: 91, status: "Active", docs: [{ name: "Sika Technical Datasheet.pdf", type: "Datasheet", ver: 2 }] },
    { code: "MAT-042", name: "Plywood Formwork", cat: "Formwork", subCat: "Film-faced Plywood", type: "Material", group: "Formwork Panels", trade: "Formwork", unit: "Sheet", altUom: "Sq.M", conv: 2.97, rol: 400, rate: 0.000185, shortDesc: "18 mm film-faced shuttering plywood", fullDesc: "18 mm thick, 8 ft × 4 ft film-faced shuttering plywood of WBP grade conforming to IS 4990, high-density hardwood core with phenolic film on both faces, for RCC formwork with mirror finish.", grade: "WBP", size: "8 × 4 ft × 18 mm", brand: "GreenPly", mfr: "GreenPly Industries", isCode: "IS 4990", application: "RCC Formwork", hsn: "4412", gst: 18, cgst: 9, sgst: 9, igst: 18, cess: 0, taxInclusive: false, reverseCharge: false, cpwdRef: "DSR 2024 · Ch-8 · 8.4", cpwdYear: "2024", cpwdDesc: "Shuttering plywood 18 mm film-faced", cpwdRate: 1790, cpwdUnit: "Sheet", cpwdSource: "CPWD DSR 2024", cpwdEff: "01 Oct 2023", stdRate: 1850, workingRate: 1880, workingEff: "01 Mar 2026", lastRate: 1860, lastPO: "PO-1270", avgRate: 1845, status: "Active", docs: [{ name: "GreenPly Catalogue.pdf", type: "Catalogue", ver: 1 }] },
    { code: "MAT-055", name: "Safety Net", cat: "Safety", subCat: "Fall Protection", type: "Consumable", group: "Safety Netting", trade: "Safety", unit: "Sq.M", altUom: "Roll", conv: 50, rol: 800, rate: 0.0000022, shortDesc: "HDPE construction safety net", fullDesc: "High-density polyethylene (HDPE) braided construction safety net, green colour, 2.5 m wide rolls, UV-stabilised, for fall protection and debris containment at height.", grade: "HDPE", size: "2.5 m wide", brand: "Safetex", mfr: "Safetex Industries", isCode: "IS 11762", application: "Fall / debris protection", hsn: "5608", gst: 12, cgst: 6, sgst: 6, igst: 12, cess: 0, taxInclusive: false, reverseCharge: false, cpwdRef: "DSR 2024 · Ch-12 · 12.6", cpwdYear: "2024", cpwdDesc: "Safety netting (HDPE)", cpwdRate: 20, cpwdUnit: "Sq.M", cpwdSource: "CPWD DSR 2024", cpwdEff: "01 Oct 2023", stdRate: 22, workingRate: 24, workingEff: "01 Mar 2026", lastRate: 23, lastPO: "PO-1259", avgRate: 22, status: "Active", docs: [] },
  ],
  matRates: [
    { id: "mr1", material: "OPC 53 Cement", date: "01 Mar 2026", type: "Working", rate: 395, gst: 28, total: 505.6, source: "Market survey", project: "All", by: "Meera Kulkarni" },
    { id: "mr2", material: "OPC 53 Cement", date: "12 Jan 2026", type: "Last Purchase", rate: 388, gst: 28, total: 496.6, source: "PO-1288", project: "P1", by: "System" },
    { id: "mr3", material: "TMT Steel Fe-550D", date: "01 Mar 2026", type: "Working", rate: 62400, gst: 18, total: 73632, source: "Vendor quotation", project: "All", by: "Meera Kulkarni" },
    { id: "mr4", material: "TMT Steel Fe-550D", date: "20 Feb 2026", type: "Last Purchase", rate: 61500, gst: 18, total: 72570, source: "PO-1287", project: "P1", by: "System" },
    { id: "mr5", material: "M-Sand", date: "15 Feb 2026", type: "Standard", rate: 1450, gst: 5, total: 1522.5, source: "Company standard", project: "All", by: "Vikram Sethi" },
    { id: "mr6", material: "Admixture (PCE)", date: "01 Mar 2026", type: "Working", rate: 95, gst: 18, total: 112.1, source: "Sika India quote", project: "RMC-1", by: "Sandeep Kulkarni" },
    { id: "mr7", material: "Plywood Formwork", date: "10 Jan 2026", type: "Last Purchase", rate: 1860, gst: 18, total: 2194.8, source: "PO-1270", project: "P2", by: "System" },
  ],
  matSubs: [
    { id: "ms1", original: "OPC 53 Cement", proposed: "PPC Cement (MAT-003)", origSpec: "IS 12269 · 53 grade", altSpec: "IS 1489 · PPC", origRate: 390, altRate: 360, diff: -30, reason: "Cost saving for mass concrete (non-structural)", vendor: "UltraTech", engRec: "Approved — suitable for PCC & mass concrete", qcRec: "Pending cube validation", clientAppr: "Not required", status: "Under Review" },
    { id: "ms2", original: "River Sand", proposed: "M-Sand (MAT-008)", origSpec: "IS 383 · Zone II", altSpec: "IS 383 · M-Sand Zone II", origRate: 1650, altRate: 1450, diff: -200, reason: "River sand unavailable within economic lead", vendor: "Deccan", engRec: "Approved", qcRec: "Approved", clientAppr: "Approved", status: "Approved" },
  ],
  cpwdDb: [
    { id: "cp1", year: "2024", schedule: "DSR", section: "Building", chapter: "Cement & Binding", item: "1.1", desc: "Portland cement OPC 53 grade", spec: "IS 12269", unit: "Bag", rate: 382, mat: 382, labour: 0, plant: 0, source: "CPWD DSR 2024 (Delhi)", eff: "01 Oct 2023" },
    { id: "cp2", year: "2024", schedule: "DSR", section: "Building", chapter: "Sand & Aggregate", item: "2.3", desc: "Sand (manufactured / river) for concrete", spec: "IS 383", unit: "Cu.M", rate: 1380, mat: 1380, labour: 0, plant: 0, source: "CPWD DSR 2024 (Delhi)", eff: "01 Oct 2023" },
    { id: "cp3", year: "2024", schedule: "DSR", section: "Building", chapter: "Steel", item: "3.2", desc: "TMT steel Fe-550D reinforcement bars", spec: "IS 1786", unit: "MT", rate: 60200, mat: 60200, labour: 0, plant: 0, source: "CPWD DSR 2024 (Delhi)", eff: "01 Oct 2023" },
    { id: "cp4", year: "2024", schedule: "DSR", section: "Building", chapter: "Steel", item: "3.9", desc: "Binding wire (annealed)", spec: "IS 280", unit: "kg", rate: 74, mat: 74, labour: 0, plant: 0, source: "CPWD DSR 2024 (Delhi)", eff: "01 Oct 2023" },
    { id: "cp5", year: "2024", schedule: "DSR", section: "Building", chapter: "Admixture", item: "1.8", desc: "Superplasticizer (PCE based)", spec: "IS 9103", unit: "Ltr", rate: 88, mat: 88, labour: 0, plant: 0, source: "CPWD DSR 2024 (Delhi)", eff: "01 Oct 2023" },
    { id: "cp6", year: "2024", schedule: "DSR", section: "Building", chapter: "Formwork", item: "8.4", desc: "Shuttering plywood 18 mm film-faced", spec: "IS 4990", unit: "Sheet", rate: 1790, mat: 1790, labour: 0, plant: 0, source: "CPWD DSR 2024 (Delhi)", eff: "01 Oct 2023" },
    { id: "cp7", year: "2024", schedule: "DSR", section: "Roads", chapter: "Bitumen", item: "5.1", desc: "Bitumen VG-30 paving grade", spec: "IS 73", unit: "MT", rate: 52400, mat: 52400, labour: 0, plant: 0, source: "CPWD DSR 2024 (Delhi)", eff: "01 Oct 2023" },
    { id: "cp8", year: "2024", schedule: "DSR", section: "Roads", chapter: "Aggregate", item: "5.6", desc: "Coarse aggregate 20 mm (crushed)", spec: "IS 383", unit: "Cu.M", rate: 1520, mat: 1520, labour: 0, plant: 0, source: "CPWD DSR 2024 (Delhi)", eff: "01 Oct 2023" },
    { id: "cp9", year: "2023", schedule: "DSR", section: "Building", chapter: "Cement & Binding", item: "1.1", desc: "Portland cement OPC 53 grade", spec: "IS 12269", unit: "Bag", rate: 365, mat: 365, labour: 0, plant: 0, source: "CPWD DSR 2023 (Delhi)", eff: "01 Oct 2022" },
    { id: "cp10", year: "2023", schedule: "DSR", section: "Building", chapter: "Steel", item: "3.2", desc: "TMT steel Fe-550D reinforcement bars", spec: "IS 1786", unit: "MT", rate: 57800, mat: 57800, labour: 0, plant: 0, source: "CPWD DSR 2023 (Delhi)", eff: "01 Oct 2022" },
    { id: "cp11", year: "2024", schedule: "DAR", section: "Electrical", chapter: "Cables", item: "E-2.4", desc: "FR-LS copper cable 3-core 4 sq.mm", spec: "IS 8130", unit: "R.M", rate: 96, mat: 96, labour: 0, plant: 0, source: "CPWD DAR 2024", eff: "01 Oct 2023" },
  ],
  stock: [
    { material: "OPC 53 Cement", store: "Store A — Pune", onHand: 2150, unit: "Bags", value: 8.4 },
    { material: "TMT Steel Fe-550D", store: "Store A — Pune", onHand: 184, unit: "MT", value: 11.3 },
    { material: "M-Sand", store: "Store B — Talegaon", onHand: 940, unit: "Cu.M", value: 1.4 },
    { material: "Admixture (PCE)", store: "RMC Yard", onHand: 2400, unit: "Ltr", value: 2.2 },
    { material: "Plywood Formwork", store: "Store A — Pune", onHand: 310, unit: "Sheets", value: 5.7 },
    { material: "Binding Wire", store: "Store C — Nashik", onHand: 820, unit: "kg", value: 0.6 },
  ],
  mTxns: [
    { id: "x1", code: "GRN-2044", kind: "Inward", material: "Admixture (PCE)", qty: 2400, unit: "Ltr", project: "P1", date: dStr(0), by: "Dinesh Pawar" },
    { id: "x2", code: "ISS-5521", kind: "Outward", material: "OPC 53 Cement", qty: 340, unit: "Bags", project: "P1", date: dStr(0), by: "Dinesh Pawar" },
    { id: "x3", code: "GRN-2043", kind: "Inward", material: "M-Sand", qty: 180, unit: "Cu.M", project: "P3", date: dStr(-1), by: "Dinesh Pawar" },
    { id: "x4", code: "TRF-0310", kind: "Transfer", material: "Binding Wire", qty: 120, unit: "kg", project: "P2", date: dStr(-1), by: "Dinesh Pawar" },
    { id: "x5", code: "ISS-5518", kind: "Outward", material: "TMT Steel Fe-550D", qty: 12.4, unit: "MT", project: "P1", date: dStr(-2), by: "Dinesh Pawar" },
  ],
  equipment: [
    { code: "EQ-011", name: "Excavator CAT 320", reg: "MH-12-AB-4471", cap: "20 T", project: "P1", hrs: 1240, fuel: 18, status: "Operational", maintDue: dStr(-22) },
    { code: "EQ-014", name: "JCB 3DX", reg: "MH-13-CD-8820", cap: "7.5 T", project: "P5", hrs: 986, fuel: 11, status: "Operational", maintDue: dStr(6) },
    { code: "EQ-021", name: "Hydra Crane 14 T", reg: "MH-12-EF-1293", cap: "14 T", project: "P2", hrs: 1512, fuel: 14, status: "Under Maintenance", maintDue: dStr(3) },
    { code: "EQ-027", name: "Concrete Pump 36 m", reg: "MH-14-GH-0092", cap: "90 m³/h", project: "P1", hrs: 2210, fuel: 26, status: "Operational", maintDue: dStr(18) },
    { code: "EQ-031", name: "Transit Mixer 6 m³", reg: "MH-12-IJ-3341", cap: "6 m³", project: "RMC-1", hrs: 3105, fuel: 32, status: "Idle", maintDue: dStr(-4) },
  ],
  rmcOrders: [
    { id: "o1", no: "CO-2291", customer: "Internal — P1", site: "Pier Cap PC-114", grade: "M40", qty: 96, time: "06:30", status: "In Transit" },
    { id: "o2", no: "CO-2292", customer: "Shree Construction", site: "RCC Slab L2", grade: "M25", qty: 48, time: "07:15", status: "Batching" },
    { id: "o3", no: "CO-2289", customer: "Kalyani Builders", site: "RCC Slab L3", grade: "M25", qty: 60, time: "05:45", status: "Delivered" },
    { id: "o4", no: "CO-2293", customer: "Internal — P2", site: "Pile Cap PC-115", grade: "M35", qty: 75, time: "10:30", status: "Scheduled" },
    { id: "o5", no: "CO-2288", customer: "Rohan Infra", site: "Footings F-21", grade: "M20", qty: 45, time: "05:15", status: "Delivered" },
  ],
  batches: [
    { id: "bt1", order: "CO-2291", grade: "M40", qty: 6, cement: 2.4, sand: 3.6, agg: 5.9, admix: 24, time: "07:12", slump: 120, cubes: "3 × 150 mm" },
    { id: "bt2", order: "CO-2291", grade: "M40", qty: 6, cement: 2.4, sand: 3.6, agg: 5.9, admix: 24, time: "07:34", slump: 115, cubes: "3 × 150 mm" },
    { id: "bt3", order: "CO-2289", grade: "M25", qty: 6, cement: 1.9, sand: 4.2, agg: 6.4, admix: 15, time: "06:05", slump: 100, cubes: "3 × 150 mm" },
    { id: "bt4", order: "CO-2288", grade: "M20", qty: 5, cement: 1.6, sand: 4.0, agg: 6.2, admix: 10, time: "05:31", slump: 95, cubes: "3 × 150 mm" },
  ],

  billBoq: [
    { id: "b1", project: "P1", itemNo: "2.1", desc: "Piling — Bored cast-in-situ (M30)", spec: "IS 2911", unit: "R.M", contractQty: 4200, rate: 18400, prevQty: 2860, currentQty: 320 },
    { id: "b2", project: "P1", itemNo: "2.4", desc: "RCC M40 in pier caps & piers", spec: "IS 456", unit: "Cu.M", contractQty: 6800, rate: 9650, prevQty: 3910, currentQty: 410 },
    { id: "b3", project: "P1", itemNo: "2.7", desc: "Structural steel Fe-550D", spec: "IS 1786", unit: "MT", contractQty: 2150, rate: 74800, prevQty: 1180, currentQty: 140 },
    { id: "b4", project: "P2", itemNo: "3.2", desc: "RCC M35 in deck slab", spec: "IS 456", unit: "Cu.M", contractQty: 5200, rate: 8900, prevQty: 2180, currentQty: 260 },
    { id: "b5", project: "P2", itemNo: "3.5", desc: "Formwork & staging", spec: "Steel", unit: "Sq.M", contractQty: 62000, rate: 410, prevQty: 26500, currentQty: 3200 },
    { id: "b6", project: "P3", itemNo: "7.3", desc: "Granular sub-base (M-Sand)", spec: "MORTH", unit: "Cu.M", contractQty: 18000, rate: 1150, prevQty: 13900, currentQty: 900 },
    { id: "b7", project: "P3", itemNo: "8.1", desc: "Dense bituminous macadam", spec: "VG-40", unit: "MT", contractQty: 14500, rate: 6400, prevQty: 8700, currentQty: 640 },
    { id: "b8", project: "P5", itemNo: "4.4", desc: "RCC M30 in clarifier walls", spec: "IS 456", unit: "Cu.M", contractQty: 4100, rate: 8750, prevQty: 2050, currentQty: 240 },
    { id: "b9", project: "P4", itemNo: "5.1", desc: "PSC girders — casting & erection", spec: "IRC 18", unit: "Nos", contractQty: 24, rate: 2850000, prevQty: 8, currentQty: 2 },
    { id: "b10", project: "P5", itemNo: "6.2", desc: "PCC M15 in footings", spec: "IS 456", unit: "Cu.M", contractQty: 3100, rate: 5400, prevQty: 2480, currentQty: 120 },
  ] as BillBoqLine[],
  mbs: [
    { id: "m1", mbNo: "MB-1204/12", page: "12", date: dStr(-3), project: "P1", location: "Pier P4-P5, span 3", boqItem: "RCC M40 in pier caps & piers", boqNo: "2.4", desc: "Pier cap PC-114 concrete", drawing: "GFC-118 Rev C", unit: "Cu.M", by: "Rohan Bhosale", status: "Certified", meas: [{ id: "mm1", nos: 4, l: 8.2, b: 3.4, h: 1.6 }, { id: "mm2", nos: 2, l: 6.5, b: 3.4, h: 1.4 }] },
    { id: "m2", mbNo: "MB-1204/13", page: "13", date: dStr(-2), project: "P1", location: "Pile cap zone B", boqItem: "Piling — Bored cast-in-situ (M30)", boqNo: "2.1", desc: "Bored pile P-217 to P-224", drawing: "GFC-102 Rev B", unit: "R.M", by: "Rohan Bhosale", status: "Client", meas: [{ id: "mm1", nos: 8, l: 24.5, b: 1, h: 1 }] },
    { id: "m3", mbNo: "MB-1205/4", page: "4", date: dStr(-1), project: "P3", location: "Ch 12+400 to 12+900", boqItem: "Granular sub-base (M-Sand)", boqNo: "7.3", desc: "GSB layer 250 mm", drawing: "DWG-308", unit: "Cu.M", by: "Amit Bhosale", status: "Internal", meas: [{ id: "mm1", nos: 1, l: 500, b: 12.5, h: 0.25 }] },
  ] as MBEntry[],
  extras: [
    { id: "e1", no: "EI-041", project: "P1", desc: "Boulder apron below pier — additional scope", spec: "M20 PCC + rubble", unit: "Cu.M", qty: 320, rate: 4850, justification: "Ground condition at P4 required apron not in BOQ", drawing: "GFC-121", status: "Client Approval", approvalDate: dStr(-9) },
    { id: "e2", no: "EI-042", project: "P3", desc: "Additional catch pit at low point", spec: "RCC M25 precast", unit: "Nos", qty: 6, rate: 88000, justification: "Drainage survey revision", drawing: "DWG-312", status: "Execution" },
    { id: "e3", no: "EI-039", project: "P2", desc: "Extra shuttering cycles for deck", spec: "Steel formwork", unit: "Sq.M", qty: 4200, rate: 210, justification: "Cycle time revised by client", drawing: "GFC-204", status: "Billed", approvalDate: dStr(-40) },
  ] as ExtraItem[],
  variations: [
    { id: "v1", no: "VO-018", project: "P1", desc: "Increase in pile depth — rocky strata", origQty: 4200, revQty: 4620, origRate: 18400, revRate: 18400, amount: 0.77, status: "Approved" },
    { id: "v2", no: "VO-019", project: "P3", desc: "Asphalt grade VG-10 → VG-40", origQty: 14500, revQty: 14500, origRate: 6100, revRate: 6400, amount: 0.44, status: "Approved" },
    { id: "v3", no: "VO-020", project: "P2", desc: "Column size revision C-12", origQty: 9200, revQty: 8970, origRate: 6800, revRate: 6800, amount: -0.16, status: "Proposed" },
  ] as VariationItem[],
  escalations: [
    { id: "es1", no: "ESC-007", project: "P1", head: "Steel (TMT)", baseIndex: 132.4, currentIndex: 141.9, weightage: 18, eligibleAmt: 38400000 },
    { id: "es2", no: "ESC-008", project: "P1", head: "Cement", baseIndex: 118.2, currentIndex: 122.6, weightage: 12, eligibleAmt: 21700000 },
    { id: "es3", no: "ESC-009", project: "P3", head: "Bitumen", baseIndex: 96.8, currentIndex: 103.1, weightage: 22, eligibleAmt: 17200000 },
  ] as EscalationItem[],
  advances: [
    { id: "ad1", no: "ADV-011", project: "P1", kind: "Mobilization", sanctioned: 120000000, paid: 120000000, recPct: 2, recovered: 46000000 },
    { id: "ad2", no: "ADV-012", project: "P1", kind: "Material", sanctioned: 35000000, paid: 35000000, recPct: 5, recovered: 9800000 },
    { id: "ad3", no: "ADV-013", project: "P3", kind: "Mobilization", sanctioned: 60000000, paid: 60000000, recPct: 2, recovered: 18400000 },
  ] as AdvanceItem[],
  deductionCfg: [
    { id: "dcg1", head: "Retention", basis: "Pct of Gross", value: 5, active: true },
    { id: "dcg2", head: "Security Deposit", basis: "Pct of Gross", value: 2.5, active: true },
    { id: "dcg3", head: "Mobilization Advance Recovery", basis: "Cumulative Recovery", value: 2, active: true },
    { id: "dcg4", head: "Material Advance Recovery", basis: "Cumulative Recovery", value: 5, active: true },
    { id: "dcg5", head: "TDS @ 2%", basis: "Pct of Gross", value: 2, active: true },
    { id: "dcg6", head: "Labour Cess", basis: "Pct of Gross", value: 1, active: true },
    { id: "dcg7", head: "GST TDS", basis: "Pct of Gross", value: 0, active: false },
  ] as DeductionCfg[],
  billDocs: [
    { id: "bd1", no: "RA-07/PRJ-018/2026", rev: 1, project: "P2", client: "NHAI", period: "01–29 Feb 2026", date: dStr(-12), type: "RA Bill", gross: 5.42, deductions: 0.96, gst: 0.8, net: 5.26, status: "Under Client Certification", by: "Meera Krishnan", ts: nowHrs(-290).getTime(), checklist: { "Measurement completed": true, "BOQ quantities verified": true, "Drawings attached": true, "Previous bill reconciled": true, "Deductions verified": true, "GST verified": true, "Internal approval completed": true }, lines: [{ itemNo: "3.2", desc: "RCC M35 in deck slab", unit: "Cu.M", prevQty: 1920, currentQty: 260, rate: 8900 }, { itemNo: "3.5", desc: "Formwork & staging", unit: "Sq.M", prevQty: 23300, currentQty: 3200, rate: 410 }] },
    { id: "bd2", no: "RA-05/PRJ-016/2026", rev: 2, project: "P1", client: "MahaMetro", period: "01–28 Feb 2026", date: dStr(-4), type: "RA Bill", gross: 8.86, deductions: 1.57, gst: 1.31, net: 8.6, status: "Approved", by: "Meera Krishnan", ts: nowHrs(-100).getTime(), checklist: { "Measurement completed": true, "BOQ quantities verified": true, "Drawings attached": true, "Previous bill reconciled": true, "Deductions verified": true, "GST verified": true, "Internal approval completed": true }, lines: [{ itemNo: "2.1", desc: "Piling — Bored cast-in-situ (M30)", unit: "R.M", prevQty: 2540, currentQty: 320, rate: 18400 }, { itemNo: "2.4", desc: "RCC M40 in pier caps & piers", unit: "Cu.M", prevQty: 3500, currentQty: 410, rate: 9650 }] },
    { id: "bd3", no: "RA-09/PRJ-021/2026", rev: 1, project: "P3", client: "MIDC", period: "01–25 Feb 2026", date: dStr(-18), type: "RA Bill", gross: 6.77, deductions: 1.2, gst: 1.0, net: 6.57, certifiedAmt: 6.31, certifiedDate: dStr(-9), status: "Certified", by: "Meera Krishnan", ts: nowHrs(-430).getTime(), checklist: { "Measurement completed": true, "BOQ quantities verified": true, "Drawings attached": true, "Previous bill reconciled": true, "Deductions verified": true, "GST verified": true, "Internal approval completed": true }, lines: [{ itemNo: "7.3", desc: "Granular sub-base (M-Sand)", unit: "Cu.M", prevQty: 13000, currentQty: 900, rate: 1150 }, { itemNo: "8.1", desc: "Dense bituminous macadam", unit: "MT", prevQty: 8060, currentQty: 640, rate: 6400 }] },
    { id: "bd4", no: "RA-06/PRJ-024/2026", rev: 1, project: "P5", client: "Pune Municipal Corp.", period: "01–31 Jan 2026", date: dStr(-42), type: "RA Bill", gross: 4.48, deductions: 0.8, gst: 0.66, net: 4.34, certifiedAmt: 4.34, certifiedDate: dStr(-30), received: 4.34, status: "Fully Paid", by: "Meera Krishnan", ts: nowHrs(-1000).getTime(), checklist: { "Measurement completed": true, "BOQ quantities verified": true, "Drawings attached": true, "Previous bill reconciled": true, "Deductions verified": true, "GST verified": true, "Internal approval completed": true }, lines: [{ itemNo: "4.4", desc: "RCC M30 in clarifier walls", unit: "Cu.M", prevQty: 1810, currentQty: 240, rate: 8750 }, { itemNo: "6.2", desc: "PCC M15 in footings", unit: "Cu.M", prevQty: 2360, currentQty: 120, rate: 5400 }] },
    { id: "bd5", no: "RA-04/PRJ-016/2026", rev: 1, project: "P1", client: "MahaMetro", period: "01–31 Dec 2025", date: dStr(-60), type: "RA Bill", gross: 7.12, deductions: 1.27, gst: 1.05, net: 6.9, status: "Returned for Correction", by: "Sunita Deshmukh", ts: nowHrs(-1400).getTime(), checklist: { "Measurement completed": true, "BOQ quantities verified": false, "Drawings attached": true, "Previous bill reconciled": true, "Deductions verified": true, "GST verified": false, "Internal approval completed": false }, lines: [{ itemNo: "2.7", desc: "Structural steel Fe-550D", unit: "MT", prevQty: 1040, currentQty: 140, rate: 74800 }] },
  ] as BillDoc[],

  coa: [
    { code: "1000", name: "Cash & Bank", type: "Asset", balance: 42.8 }, { code: "1200", name: "Accounts Receivable", type: "Asset", balance: 186.4 },
    { code: "1400", name: "Inventory — Materials", type: "Asset", balance: 27.4 }, { code: "1600", name: "Plant & Machinery", type: "Asset", balance: 96.2 },
    { code: "2000", name: "Sundry Creditors", type: "Liability", balance: -93.4 }, { code: "2200", name: "GST Payable", type: "Liability", balance: -8.6 },
    { code: "2400", name: "Retention Payable", type: "Liability", balance: -14.2 }, { code: "3000", name: "Share Capital", type: "Equity", balance: -120 },
    { code: "4000", name: "Project Revenue", type: "Revenue", balance: -312.5 }, { code: "5000", name: "Material Cost", type: "Expense", balance: 128.9 },
    { code: "5200", name: "Labour Cost", type: "Expense", balance: 74.6 }, { code: "5400", name: "Plant & Equipment Cost", type: "Expense", balance: 28.4 },
    { code: "5600", name: "Overheads", type: "Expense", balance: 18.7 },
  ],
  journals: [
    { id: "j1", no: "JV-0344", date: dStr(0), debit: "Inventory — Materials", credit: "Sundry Creditors", amount: 7.2, narr: "INV-V-3320 booked against GRN-2041 — Sika India", by: "Prakash Rao" },
    { id: "j2", no: "JV-0343", date: dStr(-1), debit: "Accounts Receivable", credit: "Project Revenue", amount: 54.6, narr: "RA-042 certified — NHAI PRJ-018", by: "Prakash Rao" },
    { id: "j3", no: "JV-0342", date: dStr(-2), debit: "Labour Cost", credit: "Cash & Bank", amount: 22.8, narr: "Feb payroll — site workforce batch 2", by: "Prakash Rao" },
    { id: "j4", no: "JV-0341", date: dStr(-3), debit: "Plant & Equipment Cost", credit: "Sundry Creditors", amount: 4.1, narr: "EQ fuel cards — March allocation", by: "Prakash Rao" },
  ],
  apInvoices: [
    { id: "ap1", no: "INV-V-3320", vendor: "Sika India", ref: "GRN-2041", amount: 7.2, due: dStr(-26), status: "Booked" as const },
    { id: "ap2", no: "INV-V-3318", vendor: "Bharat Bitumen", ref: "PO-1272", amount: 21.6, due: dStr(-12), status: "Scheduled" as const },
    { id: "ap3", no: "INV-V-3311", vendor: "UltraTech Cement", ref: "PO-1284", amount: 6.8, due: dStr(-30), status: "Paid" as const },
    { id: "ap4", no: "INV-V-3308", vendor: "Deccan Aggregates", ref: "PO-1279", amount: 5.1, due: dStr(-6), status: "Booked" as const },
  ],
  arInvoices: [
    { id: "ar1", no: "INV-C-2214", client: "NHAI", ref: "RA-07/PRJ-018/2026", amount: 5.26, due: dStr(-22), status: "Raised" as const, received: 0 },
    { id: "ar2", no: "INV-C-2210", client: "MIDC", ref: "RA-09/PRJ-021/2026", amount: 6.31, due: dStr(-4), status: "Overdue" as const, received: 0 },
    { id: "ar3", no: "INV-C-2204", client: "Pune Municipal Corp.", ref: "RA-06/PRJ-024/2026", amount: 4.34, due: dStr(-20), status: "Paid" as const, received: 4.34 },
    { id: "ar4", no: "INV-C-2198", client: "MahaMetro", ref: "RA-03/PRJ-016/2026", amount: 12.8, due: dStr(-15), status: "Partially Paid" as const, received: 6.4 },
  ],
  banks: [
    { id: "bk1", bank: "HDFC Bank", no: "…4471", type: "Current", balance: 24.6, reconciled: dStr(-1) },
    { id: "bk2", bank: "ICICI Bank", no: "…8820", type: "Current", balance: 12.9, reconciled: dStr(-2) },
    { id: "bk3", bank: "SBI", no: "…1293", type: "OD / CC", balance: -9.4, reconciled: dStr(-1) },
    { id: "bk4", bank: "Axis Bank", no: "…0092", type: "Current", balance: 5.3, reconciled: dStr(-3) },
  ],
  payments: [
    { id: "py1", no: "PAY-0875", party: "Bharat Bitumen", ref: "INV-V-3318", amount: 21.6, date: dStr(0), mode: "NEFT", status: "Pending" as const },
    { id: "py2", no: "PAY-0872", party: "Deccan Aggregates", ref: "INV-V-3308", amount: 5.1, date: dStr(-1), mode: "NEFT", status: "Pending" as const },
    { id: "py3", no: "PAY-0869", party: "UltraTech Cement", ref: "INV-V-3311", amount: 6.8, date: dStr(-6), mode: "RTGS", status: "Released" as const },
  ],
  employees: [
    { id: "EMP-0114", name: "Sunita Deshmukh", dept: "Project Execution", designation: "Project Manager", project: "P1", joined: "2019-04-12", base: 1.85, role: "PM" },
    { id: "EMP-0207", name: "Rohan Bhosale", dept: "Project Execution", designation: "Site Engineer", project: "P2", joined: "2021-08-02", base: 0.72, role: "SITE_ENG" },
    { id: "EMP-0318", name: "Dinesh Pawar", dept: "Store Management", designation: "Store In-charge", project: "P1", joined: "2018-01-15", base: 0.54, role: "STORE" },
    { id: "EMP-0421", name: "Kavita Iyer", dept: "Human Resources", designation: "HR Manager", project: "HO", joined: "2017-06-01", base: 1.42, role: "HR" },
    { id: "EMP-0522", name: "Prakash Rao", dept: "Finance & Accounts", designation: "Accounts Manager", project: "HO", joined: "2016-11-21", base: 1.68, role: "ACCOUNTS" },
    { id: "EMP-0633", name: "Imran Shaikh", dept: "Procurement", designation: "Procurement Manager", project: "HO", joined: "2020-02-10", base: 1.51, role: "PROCUREMENT" },
    { id: "EMP-0741", name: "Meera Krishnan", dept: "Commercial", designation: "Commercial Manager", project: "HO", joined: "2019-09-30", base: 1.74, role: "COMMERCIAL" },
    { id: "EMP-0856", name: "Sandeep Kulkarni", dept: "RMC Operations", designation: "Plant Manager", project: "RMC-1", joined: "2018-05-14", base: 1.12, role: "RMC" },
  ],
  leaves: [
    { id: "lv1", emp: "Rohan Bhosale", type: "Earned Leave", from: dStr(6), to: dStr(8), days: 3, status: "Pending", reason: "Family function" },
    { id: "lv2", emp: "Dinesh Pawar", type: "Sick Leave", from: dStr(-4), to: dStr(-3), days: 2, status: "Approved", reason: "Fever — certificate attached" },
    { id: "lv3", emp: "Sandeep Kulkarni", type: "Casual Leave", from: dStr(12), to: dStr(12), days: 1, status: "Pending", reason: "Personal work" },
    { id: "lv4", emp: "Kavita Iyer", type: "Earned Leave", from: dStr(-12), to: dStr(-10), days: 3, status: "Approved", reason: "Vacation" },
  ],
  attendance: [
    { id: "at1", empId: "EMP-0207", name: "Rohan Bhosale", project: "P2", hours: 9.2, ot: 1.2, status: "Present", appr: "Pending" },
    { id: "at2", empId: "EMP-0318", name: "Dinesh Pawar", project: "P1", hours: 8.0, ot: 0, status: "Present", appr: "Approved" },
    { id: "at3", empId: "EMP-0856", name: "Sandeep Kulkarni", project: "RMC-1", hours: 10.5, ot: 2.5, status: "Present", appr: "Pending" },
    { id: "at4", empId: "EMP-0114", name: "Sunita Deshmukh", project: "P1", hours: 9.0, ot: 1.0, status: "Present", appr: "Approved" },
    { id: "at5", empId: "EMP-0741", name: "Meera Krishnan", project: "HO", hours: 0, ot: 0, status: "On Leave", appr: "Approved" },
  ],
  payRuns: [
    { id: "pyr1", period: "Feb 2026", status: "Paid", employees: 1451, gross: 2.61, deductions: 0.33, net: 2.28, date: dStr(-9) },
    { id: "pyr2", period: "Jan 2026", status: "Paid", employees: 1407, gross: 2.52, deductions: 0.31, net: 2.21, date: dStr(-38) },
    { id: "pyr3", period: "Mar 2026", status: "Processing", employees: 1478, gross: 2.68, deductions: 0.34, net: 2.34, date: dStr(6) },
  ],

  tasks: [
    { id: "tk1", title: "Verify MB-1204/13 measurements for pile caps", due: dStr(0), status: "Open", forRole: "PM", link: "billing" },
    { id: "tk2", title: "Approve PO-1288 — M-Sand, Talegaon", due: dStr(0), status: "Overdue", forRole: "PROCUREMENT", link: "pro-po" },
    { id: "tk3", title: "Resubmit RA-04 after BOQ correction", due: dStr(-1), status: "Overdue", forRole: "COMMERCIAL", link: "billing" },
    { id: "tk4", title: "Raise PR for deck slab cycle-2 plywood", due: dStr(1), status: "Open", forRole: "STORE", link: "pro-pr" },
    { id: "tk5", title: "Lock Feb attendance after HR verification", due: dStr(0), status: "Open", forRole: "HR", link: "attendance" },
    { id: "tk6", title: "Review vendor quotation comparison — RFQ-0412", due: dStr(1), status: "Open", forRole: "PROCUREMENT", link: "procurement" },
    { id: "tk7", title: "Cube test results — batch BT-0291 to 0296", due: dStr(0), status: "Open", forRole: "RMC", link: "rmc" },
    { id: "tk8", title: "Submit DPR for pier cap PC-114", due: dStr(0), status: "Open", forRole: "SITE_ENG", link: "projects" },
    { id: "tk9", title: "Reconcile P1 material consumption vs BOQ", due: dStr(2), status: "Open", forRole: "ACCOUNTS", link: "materials" },
    { id: "tk10", title: "Update safety training register", due: dStr(-2), status: "Done", forRole: "HR", link: "hr" },
  ] as Task[],
  queries: [
    { id: "q1", docRef: "RA-04/PRJ-016/2026", raisedBy: "Meera Krishnan", text: "BOQ item 2.7 cumulative quantity exceeds previous certified by 12 MT — verify against MB-1204/11 and resubmit.", field: "Structural steel qty", priority: "High", due: dStr(1), status: "Open", ts: nowHrs(-1300).getTime() },
    { id: "q2", docRef: "PR-0092", raisedBy: "Imran Shaikh", text: "Please attach the approved mix design reference for the PCE admixture specification.", field: "Specification", priority: "Normal", due: dStr(2), status: "Responded", response: "Mix design MD-P4-118 attached to the PR.", ts: nowHrs(-40).getTime() },
    { id: "q3", docRef: "PO-1284", raisedBy: "Prakash Rao", text: "Freight charged twice in invoice — reconcile with e-way bill before payment.", field: "Freight", priority: "High", status: "Resolved", response: "Credit note received; invoice revised to ₹6.8 L.", ts: nowHrs(-400).getTime() },
  ] as QueryRec[],
  versions: [
    { id: "vr1", docRef: "RA-05/PRJ-016/2026", ver: 1, date: dStr(-9), user: "Meera Krishnan", reason: "Initial submission", status: "Superseded" },
    { id: "vr2", docRef: "RA-05/PRJ-016/2026", ver: 2, date: dStr(-4), user: "Meera Krishnan", reason: "Quantity revised per certified MB-1204/12", status: "Approved" },
    { id: "vr3", docRef: "RA-04/PRJ-016/2026", ver: 1, date: dStr(-60), user: "Sunita Deshmukh", reason: "Initial submission", status: "Returned for Correction" },
    { id: "vr4", docRef: "PO-1287", ver: 1, date: dStr(-5), user: "Imran Shaikh", reason: "Raised from PR-0093", status: "Approved" },
  ] as VersionRec[],
  signedLog: [
    { id: "sg1", docRef: "PO-1287", name: "Rajesh Malhotra", desig: "Managing Director", role: "MD", date: dStr(-4), time: "11:42", svg: "", ip: "10.20.4.03", comment: "Approved within delegated limit", action: "Approved" },
    { id: "sg2", docRef: "RA-05/PRJ-016/2026", name: "Meera Krishnan", desig: "Commercial Manager", role: "COMMERCIAL", date: dStr(-4), time: "16:05", svg: "", ip: "10.20.4.22", comment: "Quantities verified with MB", action: "Approved" },
  ] as SignLog[],
  announcements: [
    { id: "an1", text: "FY 2025–26 year-end closing begins 28 Mar — freeze all material issues by 26 Mar, 18:00.", ts: nowHrs(-20).getTime(), kind: "Finance" },
    { id: "an2", text: "New GST e-invoicing threshold applies from 01 Apr — update vendor master records.", ts: nowHrs(-44).getTime(), kind: "Compliance" },
    { id: "an3", text: "Quarterly safety audit — all sites, week of 24 Mar. HSE cell will share checklists.", ts: nowHrs(-70).getTime(), kind: "HSE" },
  ],
  userAccess: {
    u3: { DPR: { v: true, c: true, e: true, a: true, s: true }, MB: { v: true, c: true, e: true, a: true, s: true }, "RA Bill": { v: true, c: false, e: false, a: false, s: false }, Payment: { v: true, c: false, e: false, a: false, s: false } },
    u8: { "RA Bill": { v: true, c: true, e: true, a: true, s: true }, MB: { v: true, c: false, e: false, a: true, s: true }, Payment: { v: true, c: false, e: false, a: false, s: false }, DPR: { v: true, c: false, e: false, a: false, s: false } },
    u5: { Payment: { v: true, c: true, e: true, a: true, s: true }, "RA Bill": { v: true, c: false, e: false, a: false, s: false }, GRN: { v: true, c: false, e: false, a: false, s: false }, DPR: { v: false, c: false, e: false, a: false, s: false } },
    u7: { GRN: { v: true, c: true, e: true, a: false, s: false }, "Material Issue": { v: true, c: true, e: true, a: false, s: false }, DPR: { v: false, c: false, e: false, a: false, s: false }, Payment: { v: false, c: false, e: false, a: false, s: false } },
  } as Record<string, Record<string, AccessFlags>>,

  folders: ["Contracts & Work Orders", "Drawings — GFC", "BOQ & Estimates", "Invoices & Bills", "Certificates", "HR Records"],
  docs: [
    { id: "dc1", name: "Work Order — NHAI Pune Viaduct.pdf", folder: "Contracts & Work Orders", type: "PDF", ver: 3, size: "2.4 MB", uploaded: dStr(120), by: "Meera Krishnan" },
    { id: "dc2", name: "GFC — Pier Cap P4-P5.dwg", folder: "Drawings — GFC", type: "DWG", ver: 2, size: "8.1 MB", uploaded: dStr(31), by: "Rohan Bhosale", expiry: dStr(-60) },
    { id: "dc3", name: "BOQ — MSRDC Junction (Rev C).xlsx", folder: "BOQ & Estimates", type: "XLSX", ver: 3, size: "1.1 MB", uploaded: dStr(44), by: "Meera Krishnan" },
    { id: "dc4", name: "RA-042 — NHAI.pdf", folder: "Invoices & Bills", type: "PDF", ver: 1, size: "640 KB", uploaded: dStr(12), by: "Prakash Rao" },
    { id: "dc5", name: "Completion Certificate — P7.pdf", folder: "Certificates", type: "PDF", ver: 1, size: "310 KB", uploaded: dStr(80), by: "Sunita Deshmukh" },
    { id: "dc6", name: "Insurance — Plant Machinery.pdf", folder: "Contracts & Work Orders", type: "PDF", ver: 2, size: "1.8 MB", uploaded: dStr(200), by: "Arvind Nair", expiry: dStr(-21) },
    { id: "dc7", name: "Rate Analysis — M40 Concrete.xlsx", folder: "BOQ & Estimates", type: "XLSX", ver: 5, size: "480 KB", uploaded: dStr(18), by: "Commercial Cell" },
    { id: "dc8", name: "Safety Audit Report — Feb.pdf", folder: "Certificates", type: "PDF", ver: 1, size: "2.9 MB", uploaded: dStr(28), by: "HSE Cell" },
  ] as DocFile[],
  users: [
    { id: "u1", name: "Arvind Nair", email: "arvind.n@sahaainfra.com", role: "SUPER_ADMIN", dept: "IT & Systems", project: "HO", site: "Head Office", office: "Head Office", finLimit: 0, active: true, lastLogin: "Today 09:12" },
    { id: "u2", name: "Rajesh Malhotra", email: "rajesh.m@sahaainfra.com", role: "MD", dept: "Executive Office", project: "HO", site: "Head Office", office: "Head Office", finLimit: 999, active: true, lastLogin: "Today 08:41" },
    { id: "u3", name: "Sunita Deshmukh", email: "sunita.d@sahaainfra.com", role: "PM", dept: "Project Execution", project: "P1", site: "Pachgaon Site", office: "Site Office", finLimit: 10, active: true, lastLogin: "Today 08:03", manager: "Rajesh Malhotra" },
    { id: "u4", name: "Kavita Iyer", email: "kavita.i@sahaainfra.com", role: "HR", dept: "Human Resources", project: "HO", site: "Head Office", office: "Head Office", finLimit: 2, active: true, lastLogin: "Today 09:30" },
    { id: "u5", name: "Prakash Rao", email: "prakash.r@sahaainfra.com", role: "ACCOUNTS", dept: "Finance & Accounts", project: "HO", site: "Head Office", office: "Head Office", finLimit: 25, active: true, lastLogin: "Today 09:02" },
    { id: "u6", name: "Imran Shaikh", email: "imran.s@sahaainfra.com", role: "PROCUREMENT", dept: "Supply Chain", project: "HO", site: "Head Office", office: "Head Office", finLimit: 25, active: true, lastLogin: "Today 08:55" },
    { id: "u7", name: "Dinesh Pawar", email: "dinesh.p@sahaainfra.com", role: "STORE", dept: "Store Management", project: "P1", site: "Pachgaon Store", office: "Warehouse", finLimit: 0.5, active: true, lastLogin: "Today 07:48", manager: "Sunita Deshmukh" },
    { id: "u8", name: "Meera Krishnan", email: "meera.k@sahaainfra.com", role: "COMMERCIAL", dept: "Commercial & Contracts", project: "HO", site: "Head Office", office: "Head Office", finLimit: 50, active: true, lastLogin: "Today 09:21" },
    { id: "u9", name: "Sandeep Kulkarni", email: "sandeep.k@sahaainfra.com", role: "RMC", dept: "RMC Operations", project: "RMC-1", site: "Kharadi Plant", office: "RMC Plant", finLimit: 1, active: true, lastLogin: "Today 06:12" },
    { id: "u10", name: "Rohan Bhosale", email: "rohan.b@sahaainfra.com", role: "SITE_ENG", dept: "Project Execution", project: "P2", site: "Nashik Site", office: "Site Office", finLimit: 2, active: true, lastLogin: "Today 08:16", manager: "Vikas Thorat" },
    { id: "u11", name: "Ganesh More", email: "ganesh.m@sahaainfra.com", role: "EMPLOYEE", dept: "Site Workforce", project: "P1", site: "Pachgaon Site", office: "Site Office", finLimit: 0, active: true, lastLogin: "Today 07:55", manager: "Sunita Deshmukh" },
    { id: "u12", name: "Aarav Joshi", email: "aarav.j@sahaainfra.com", role: "SITE_ENG", dept: "Project Execution", project: "P3", site: "Solapur Site", office: "Site Office", finLimit: 2, active: true, lastLogin: "Never", manager: "Nilesh Kamble" },
  ] as UserRec[],
  creds: {
    u1: { username: "arvind.n", hash: demoHash("Welcome@123"), mobile: "+91 98220 11001", mustChange: false, failed: 0, joinDate: "01 Apr 2019", status: "Active" },
    u2: { username: "rajesh.m", hash: demoHash("Welcome@123"), mobile: "+91 98220 11002", mustChange: false, failed: 0, joinDate: "12 Jan 2018", status: "Active" },
    u3: { username: "sunita.d", hash: demoHash("Welcome@123"), mobile: "+91 98220 11003", mustChange: false, failed: 0, joinDate: "03 Jul 2020", status: "Active" },
    u4: { username: "kavita.i", hash: demoHash("Welcome@123"), mobile: "+91 98220 11004", mustChange: false, failed: 0, joinDate: "21 Sep 2021", status: "Active" },
    u5: { username: "prakash.r", hash: demoHash("Welcome@123"), mobile: "+91 98220 11005", mustChange: false, failed: 0, joinDate: "15 Feb 2020", status: "Active" },
    u6: { username: "imran.s", hash: demoHash("Welcome@123"), mobile: "+91 98220 11006", mustChange: false, failed: 0, joinDate: "08 Nov 2021", status: "Active" },
    u7: { username: "dinesh.p", hash: demoHash("Welcome@123"), mobile: "+91 98220 11007", mustChange: false, failed: 0, joinDate: "25 May 2022", status: "Active" },
    u8: { username: "meera.k", hash: demoHash("Welcome@123"), mobile: "+91 98220 11008", mustChange: false, failed: 0, joinDate: "17 Mar 2021", status: "Active" },
    u9: { username: "sandeep.k", hash: demoHash("Welcome@123"), mobile: "+91 98220 11009", mustChange: false, failed: 0, joinDate: "30 Aug 2022", status: "Active" },
    u10: { username: "rohan.b", hash: demoHash("Welcome@123"), mobile: "+91 98220 11010", mustChange: false, failed: 0, joinDate: "11 Dec 2022", status: "Active" },
    u11: { username: "ganesh.m", hash: demoHash("Welcome@123"), mobile: "+91 98220 11011", mustChange: false, failed: 0, joinDate: "05 Jun 2023", status: "Active" },
    u12: { username: "aarav.j", hash: demoHash("Temp@90210"), mobile: "+91 98220 11012", mustChange: true, failed: 0, joinDate: "01 Mar 2026", status: "Active" },
  } as Record<string, Cred>,
  loginHistory: [
    { id: "lh1", user: "Rajesh Malhotra", ts: new Date(Date.now() - 5 * 36e5).toISOString(), device: "Chrome · Windows 11 · Head Office", ip: "10.20.4.18", status: "Success" },
    { id: "lh2", user: "Sunita Deshmukh", ts: new Date(Date.now() - 6 * 36e5).toISOString(), device: "Safari · iPad · Pachgaon Site", ip: "10.20.9.44", status: "Success" },
    { id: "lh3", user: "ganesh.m", ts: new Date(Date.now() - 8 * 36e5).toISOString(), device: "Chrome · Android · Pachgaon Site", ip: "10.20.9.51", status: "Success" },
    { id: "lh4", user: "prakash.r", ts: new Date(Date.now() - 26 * 36e5).toISOString(), device: "Edge · Windows 11 · Head Office", ip: "10.20.4.22", status: "Failed" },
    { id: "lh5", user: "Aarav Joshi", ts: new Date(Date.now() - 30 * 36e5).toISOString(), device: "Provisioning · HR Console", ip: "10.20.4.10", status: "Password Changed" },
  ] as LoginRec[],
  sessions: [
    { id: "ss1", user: "Rajesh Malhotra", device: "Chrome · Windows 11", ip: "10.20.4.18", started: new Date(Date.now() - 5 * 36e5).toISOString(), lastActive: "2 min ago" },
    { id: "ss2", user: "Sunita Deshmukh", device: "Safari · iPad", ip: "10.20.9.44", started: new Date(Date.now() - 6 * 36e5).toISOString(), lastActive: "14 min ago" },
    { id: "ss3", user: "Imran Shaikh", device: "Chrome · macOS", ip: "10.20.4.31", started: new Date(Date.now() - 9 * 36e5).toISOString(), lastActive: "3 hr ago" },
  ] as SessionRec[],
  assignments: [
    { id: "as1", user: "Sunita Deshmukh", empId: "u3", project: "P1", site: "Pachgaon Site", role: "Project Manager", responsibility: "Full execution authority — DPR, MB, billing, procurement", manager: "Rajesh Malhotra", finLimit: "₹10 L", from: "01 Jul 2024", to: "—", status: "Active" },
    { id: "as2", user: "Rohan Bhosale", empId: "u10", project: "P2", site: "Nashik Site", role: "Site Engineer", responsibility: "DPR, measurements, material requests, labour attendance", manager: "Vikas Thorat", finLimit: "₹2 L", from: "15 Dec 2024", to: "—", status: "Active" },
    { id: "as3", user: "Rohan Bhosale", empId: "u10", project: "P3", site: "Solapur Site", role: "Site Engineer", responsibility: "DPR & measurements (temporary support)", manager: "Nilesh Kamble", finLimit: "₹2 L", from: "12 Dec 2022", to: "14 Dec 2024", status: "Closed" },
    { id: "as4", user: "Dinesh Pawar", empId: "u7", project: "P1", site: "Pachgaon Store", role: "Store Keeper", responsibility: "GRN, issue, returns, physical verification", manager: "Sunita Deshmukh", finLimit: "₹0.5 L", from: "25 May 2022", to: "—", status: "Active" },
    { id: "as5", user: "Ganesh More", empId: "u11", project: "P1", site: "Pachgaon Site", role: "Supervisor — Civil", responsibility: "Gang supervision, attendance marking, site issues", manager: "Sunita Deshmukh", finLimit: "—", from: "05 Jun 2023", to: "—", status: "Active" },
    { id: "as6", user: "Sandeep Kulkarni", empId: "u9", project: "RMC-1", site: "Kharadi Plant", role: "RMC Plant Manager", responsibility: "Production, dispatch, QC, raw materials", manager: "Rajesh Malhotra", finLimit: "₹1 L", from: "30 Aug 2022", to: "—", status: "Active" },
  ] as AssignmentRec[],
  delegations: [
    { id: "dl1", from: "Rajesh Malhotra", to: "Prakash Rao", txn: "Vendor Payments ≤ ₹25 L", project: "All", fromD: "10 Mar 2026", toD: "24 Mar 2026", reason: "On leave — Diwali break coverage", status: "Active", approvedBy: "Arvind Nair (Super Admin)" },
    { id: "dl2", from: "Sunita Deshmukh", to: "Rohan Bhosale", txn: "Material Requests", project: "P1", fromD: "01 Feb 2026", toD: "28 Feb 2026", reason: "Site audit week", status: "Expired", approvedBy: "Rajesh Malhotra" },
  ] as DelegationRec[],
  attLocks: [
    { period: "Feb 2026", lockedBy: "Kavita Iyer", ts: new Date(Date.now() - 12 * 864e5).toISOString(), reason: "Monthly close — payroll processed" },
    { period: "Jan 2026", lockedBy: "Kavita Iyer", ts: new Date(Date.now() - 42 * 864e5).toISOString(), reason: "Monthly close — payroll processed" },
  ] as AttLock[],
  attRules: {
    workHrs: 9, breakHrs: 1, graceMin: 15, lateAfter: "09:15", halfDayBelow: 4.5, otAfter: 9,
    weeklyOff: "Sunday", gpsRadius: 300, lockDay: 5, cutoff: "23:59",
    methods: { "Web punch": true, "Mobile punch": true, "QR code": true, "GPS punch": true, "Biometric": true, "Manual": false },
  },
  workflows: [
    { id: "w1", name: "Purchase Requisition", module: "Procurement", levels: "PM → Procurement Head → MD (>₹25 L)", basis: "Amount-tiered", active: true },
    { id: "w2", name: "Purchase Order", module: "Procurement", levels: "Procurement → Accounts → MD (>₹50 L)", basis: "Amount-tiered", active: true },
    { id: "w3", name: "Vendor Payment", module: "Finance", levels: "Accounts Manager → MD (parallel CFO)", basis: "Sequential + Parallel", active: true },
    { id: "w4", name: "Attendance Correction", module: "HR", levels: "Site Supervisor → HR Manager", basis: "Sequential", active: true },
    { id: "w5", name: "RA Bill Submission", module: "Billing", levels: "Commercial → Accounts → MD", basis: "Sequential", active: true },
    { id: "w6", name: "Leave Request", module: "HR", levels: "Reporting Manager → HR", basis: "Sequential", active: false },
  ] as Workflow[],
  series: [
    { doc: "Purchase Requisition", prefix: "PR", next: 1048 },
    { doc: "Purchase Order", prefix: "PO", next: 1288 },
    { doc: "Material Receipt", prefix: "GRN", next: 2045 },
    { doc: "RA Bill", prefix: "RA", next: 43 },
    { doc: "Journal Voucher", prefix: "JV", next: 345 },
    { doc: "Payment Voucher", prefix: "PAY", next: 876 },
  ] as SeriesRec[],
  settings: { company: "SAHAA INFRA Ltd.", address: "Meridian House, Baner Road, Pune 411045", gstin: "27AAACS1429B1ZQ", currency: "INR (₹)", fy: "FY 2025–26", email: true, sms: false, whatsapp: false, backup: "Daily 02:00 IST — last run today" },
  audit: [
    { id: "A-5241", ts: dISO(14), user: "Prakash Rao", role: "Accounts Manager", module: "Finance", action: "Payment Released", entity: "PAY-0872", detail: "₹21.6 L → Bharat Bitumen against INV-V-3318", ip: "10.20.4.18" },
    { id: "A-5240", ts: dISO(52), user: "Dinesh Pawar", role: "Store Keeper", module: "Materials", action: "GRN Posted", entity: "GRN-2044", detail: "PCE Admixture +2,400 Ltr at RMC Yard (stock updated)", ip: "10.20.9.31" },
    { id: "A-5239", ts: dISO(95), user: "Imran Shaikh", role: "Procurement Manager", module: "Procurement", action: "PO Raised", entity: "PO-1287", detail: "₹56.1 L Tata Steel — awaiting MD approval", ip: "10.20.4.07" },
    { id: "A-5238", ts: dISO(140), user: "Meera Krishnan", role: "Commercial Manager", module: "Billing", action: "RA Bill Certified", entity: "RA-042", detail: "NHAI certified gross ₹62.4 L, net ₹45.74 L", ip: "10.20.4.22" },
    { id: "A-5237", ts: dISO(200), user: "Kavita Iyer", role: "HR Manager", module: "HR", action: "Payroll Approved", entity: "Mar 2026", detail: "1,451 employees · Net ₹2.28 Cr", ip: "10.20.4.11" },
    { id: "A-5236", ts: dISO(260), user: "Sunita Deshmukh", role: "Project Manager", module: "Projects", action: "Progress Updated", entity: "P1", detail: "Physical progress 62% → 64% (weekly DPR)", ip: "10.20.9.12" },
    { id: "A-5235", ts: dISO(330), user: "Rohan Bhosale", role: "Site Engineer", module: "Attendance", action: "Punch Verified", entity: "P2 roster", detail: "38 punches verified for morning shift", ip: "10.20.9.44" },
    { id: "A-5234", ts: dISO(410), user: "Arvind Nair", role: "Super Admin", module: "Settings", action: "Permissions Changed", entity: "STORE role", detail: "Export disabled on Finance module", ip: "10.20.4.02" },
  ] as AuditEntry[],
  messages: [
    { id: "mg1", ch: "all", user: "Rajesh Malhotra", role: "Managing Director", ts: new Date(Date.now() - 26 * 36e5).toISOString(), kind: "text", text: "Team — Safety Week starts Monday. Every site to run toolbox talks daily and log observations in the Safety module. Zero-harm is non-negotiable.", reactions: { "👍": 12, "✅": 6 }, pinned: true },
    { id: "mg2", ch: "all", user: "Anjali Verma", role: "HR Manager", ts: new Date(Date.now() - 22 * 36e5).toISOString(), kind: "text", text: "Reminder: April attendance locks Friday 6 PM. Site supervisors, please clear pending corrections before then.", reactions: { "👍": 7 } },
    { id: "mg3", ch: "P1", user: "Rohan Bhosale", role: "Site Engineer", ts: new Date(Date.now() - 19 * 36e5).toISOString(), kind: "issue", text: "Formwork alignment rework needed at pier cap P4-P5 — staging certified, but cover blocks short by 80 nos.", reactions: { "⚠️": 3 } },
    { id: "mg4", ch: "P1", user: "Sunita Deshmukh", role: "Project Manager", ts: new Date(Date.now() - 18.4 * 36e5).toISOString(), kind: "text", text: "Noted. @Dinesh Pawar can Store release 100 cover blocks from Reserve Stock tomorrow 7 AM? Log an MR against BOQ 2.4.", reactions: { "✅": 2 }, replyTo: "mg3" },
    { id: "mg5", ch: "P1", user: "Dinesh Pawar", role: "Store Keeper", ts: new Date(Date.now() - 17.8 * 36e5).toISOString(), kind: "text", text: "Yes — MR-1187 raised, will issue at gate 2. Batch CB-09 has test certificate attached.", reactions: { "👍": 4 }, replyTo: "mg4" },
    { id: "mg6", ch: "P1", user: "Sunita Deshmukh", role: "Project Manager", ts: new Date(Date.now() - 15 * 36e5).toISOString(), kind: "update", text: "Daily update — Pier Cap PC-114 concreting completed 16:40, cube samples to lab.", meta: { work: "PC-114 concreting 96 Cu.M (M40) · de-shuttering PC-109 · rebar for PC-115 at 60%", manpower: "342 present · 12 bar benders short for night shift", issues: "Cover block shortage (resolved via MR-1187) · pump line wear flagged", plan: "Start PC-115 rebar tomorrow 6 AM · MB entry for PC-109 · cube test results by 4 PM" }, reactions: { "👍": 9, "✅": 3 } },
    { id: "mg7", ch: "P1", user: "Rohan Bhosale", role: "Site Engineer", ts: new Date(Date.now() - 5 * 36e5).toISOString(), kind: "file", text: "Revised GFC for junction widening received from client.", meta: { file: "GFC-118_RevD_junction-widening.pdf" }, reactions: {} },
    { id: "mg8", ch: "Procurement", user: "Meera Kulkarni", role: "Procurement Manager", ts: new Date(Date.now() - 8 * 36e5).toISOString(), kind: "text", text: "Tata Steel quoted ₹61,500/MT for Fe-550D (valid 15 days). Comparative statement CS-0231 ready — L1 confirmed, requesting approval to raise PO.", reactions: { "✅": 2 } },
    { id: "mg9", ch: "Procurement", user: "Prakash Rao", role: "Accounts Manager", ts: new Date(Date.now() - 7.2 * 36e5).toISOString(), kind: "text", text: "Payment terms 30-day credit confirmed with vendor. Budget head CC-P1-MAT has ₹14.2 L free — cleared from accounts side.", reactions: { "👍": 3 }, replyTo: "mg8" },
    { id: "mg10", ch: "RMC", user: "Sandeep Kulkarni", role: "RMC Plant Manager", ts: new Date(Date.now() - 3 * 36e5).toISOString(), kind: "update", text: "Morning shift closed — 312 Cu.M batched.", meta: { work: "M40 for P1 pier caps 192 Cu.M · M25 PCC for P3 120 Cu.M", manpower: "18 plant crew · 14 mixers on road", issues: "Mixer TM-06 hydraulic hose seepage — mechanic dispatched", plan: "Night batch 96 Cu.M for P1 deck slab starting 22:00" }, reactions: { "👍": 5 } },
  ] as Msg[],
  notifs: [
    { id: "n1", ts: dISO(12), type: "approval", text: "PO-1288 (₹5.2 L — UltraTech) awaiting your approval", read: false },
    { id: "n2", ts: dISO(38), type: "stock", text: "OPC 53 Cement below reorder level at Store A — Pune", read: false },
    { id: "n3", ts: dISO(71), type: "payment", text: "MIDC invoice INV-C-2210 overdue by 4 days (₹6.31 L)", read: false },
    { id: "n4", ts: dISO(120), type: "project", text: "RA-04/PRJ-016 returned for correction — quantity query open", read: false },
    { id: "n5", ts: dISO(300), type: "hr", text: "Mar 2026 payroll processing — verify overtime by Friday", read: true },
  ] as Notif[],

  /* ── Part 2 collections ─────────────────────────────────────── */
  costCentres: [
    { code: "CC-P1", name: "Pune Metro Viaduct — Pkg 4", kind: "Project" },
    { code: "CC-P2", name: "NH-60 Flyover & Junction", kind: "Project" },
    { code: "CC-P3", name: "Industrial Park — Phase II", kind: "Project" },
    { code: "CC-P5", name: "Water Treatment Plant 40 MLD", kind: "Project" },
    { code: "HO", name: "Head Office — Admin", kind: "Company" },
  ],
  vouchers: [
    { id: "vc1", no: "PV-0876", type: "Payment", date: dStr(-1), debit: "Sundry Creditors", credit: "Cash & Bank", amount: 21.6, costCentre: "CC-P3", project: "P3", narr: "Bharat Bitumen — INV-V-3318", by: "Prakash Rao", status: "Posted" },
    { id: "vc2", no: "RV-0412", type: "Receipt", date: dStr(-2), debit: "Cash & Bank", credit: "Accounts Receivable", amount: 6.4, costCentre: "CC-P1", project: "P1", narr: "MahaMetro — part payment INV-C-2198", by: "Prakash Rao", status: "Posted" },
    { id: "vc3", no: "CN-0108", type: "Credit Note", date: dStr(-4), debit: "Sundry Creditors", credit: "Inventory — Materials", amount: 0.6, costCentre: "CC-P1", project: "P1", narr: "UltraTech — freight double-charge reversal", by: "Prakash Rao", status: "Posted" },
    { id: "vc4", no: "JV-0345", type: "Journal", date: dStr(0), debit: "Project Revenue", credit: "GST Payable", amount: 8.6, costCentre: "HO", project: "HO", narr: "GST provision — March billing", by: "Prakash Rao", status: "Draft" },
  ],
  pf: [
    { id: "pf1", emp: "Sunita Deshmukh", pfNo: "MHAPP0012345", month: "Feb 2026", wage: 15417, empShare: 1850, erShare: 1850, status: "Paid", paidOn: dStr(-9) },
    { id: "pf2", emp: "Rohan Bhosale", pfNo: "MHAPP0009821", month: "Feb 2026", wage: 6000, empShare: 720, erShare: 720, status: "Paid", paidOn: dStr(-9) },
    { id: "pf3", emp: "Dinesh Pawar", pfNo: "MHAPP0007712", month: "Mar 2026", wage: 4500, empShare: 540, erShare: 540, status: "Pending", paidOn: "" },
    { id: "pf4", emp: "Kavita Iyer", pfNo: "MHAPP0005501", month: "Mar 2026", wage: 11833, empShare: 1420, erShare: 1420, status: "Pending", paidOn: "" },
    { id: "pf5", emp: "Prakash Rao", pfNo: "MHAPP0003310", month: "Mar 2026", wage: 14000, empShare: 1680, erShare: 1680, status: "Pending", paidOn: "" },
  ],
  corrections: [
    { id: "cr1", emp: "Rohan Bhosale", date: dStr(-2), existing: "Absent (missed punch)", requested: "Present — 8.5 hrs", reason: "Biometric device offline at Nashik gate", status: "Pending" },
    { id: "cr2", emp: "Dinesh Pawar", date: dStr(-5), existing: "Half Day", requested: "Present — 9 hrs", reason: "Store audit extended the shift; supervisor confirmed", status: "Approved" },
    { id: "cr3", emp: "Sandeep Kulkarni", date: dStr(-1), existing: "In 07:02", requested: "In 06:12", reason: "Batching started early; kiosk clock drift", status: "Pending" },
  ],
  salaryHist: [
    { id: "sh1", emp: "Sunita Deshmukh", effective: "Apr 2025", basic: 128000, allowances: 57000, gross: 185000, pf: 15417, net: 167233, reason: "Annual revision FY 2025–26", by: "Kavita Iyer" },
    { id: "sh2", emp: "Sunita Deshmukh", effective: "Apr 2024", basic: 118000, allowances: 50000, gross: 168000, pf: 14000, net: 151800, reason: "Annual revision FY 2024–25", by: "Kavita Iyer" },
    { id: "sh3", emp: "Rohan Bhosale", effective: "Aug 2025", basic: 42000, allowances: 18000, gross: 60000, pf: 5040, net: 53460, reason: "Promotion — Site Engineer II", by: "Kavita Iyer" },
  ],
  exits: [
    { id: "ex1", emp: "Vinay Kadam", lastDay: dStr(-45), reason: "Resignation — personal", fnf: 1.24, status: "Completed" },
    { id: "ex2", emp: "Sagar Jadhav", lastDay: dStr(12), reason: "Contract completion — P7", fnf: 0.86, status: "In Progress" },
  ],
  quality: [
    { id: "qa1", no: "QI-118", type: "Inspection", project: "P1", item: "Pier cap P4-P5 — formwork & reinforcement", date: dStr(-1), status: "Passed", result: "Cover blocks OK; staging certified by SE" },
    { id: "qa2", no: "NCR-021", type: "NCR", project: "P3", item: "GSB layer compaction below specification", date: dStr(-3), status: "Open", result: "Root cause: roller breakdown; re-rolling scheduled" },
    { id: "qa3", no: "CT-0291", type: "Cube Test", project: "RMC-1", item: "M40 — Batch BT-0291 (7-day)", date: dStr(-2), status: "Passed", result: "31.2 MPa vs 26.7 MPa target" },
    { id: "qa4", no: "CT-0287", type: "Cube Test", project: "RMC-1", item: "M25 — Batch BT-0287 (28-day)", date: dStr(-6), status: "Failed", result: "19.8 MPa vs 22.5 MPa target — mix design review raised" },
    { id: "qa5", no: "QI-121", type: "Inspection", project: "P5", item: "Clarifier wall waterproofing", date: dStr(0), status: "Pending", result: "" },
  ],
  safety: [
    { id: "sf1", kind: "Toolbox Talk", project: "P1", date: dStr(0), desc: "Working at height — harness & lifeline checks", severity: "—", status: "Completed" },
    { id: "sf2", kind: "Near Miss", project: "P2", date: dStr(-2), desc: "Scaffold tag missing on junction span — barricaded immediately", severity: "Medium", status: "Closed" },
    { id: "sf3", kind: "Observation", project: "P4", date: dStr(-1), desc: "Housekeeping poor near rebar yard", severity: "Low", status: "Open" },
    { id: "sf4", kind: "Incident", project: "P3", date: dStr(-9), desc: "Minor hand injury — first aid given, no lost time", severity: "High", status: "Closed" },
  ],
  fuel: [
    { id: "fu1", eq: "EQ-011", date: dStr(-1), type: "Diesel", ltrs: 38, hrs: 7.5, cost: 3610 },
    { id: "fu2", eq: "EQ-014", date: dStr(-1), type: "Diesel", ltrs: 22, hrs: 6.0, cost: 2090 },
    { id: "fu3", eq: "EQ-021", date: dStr(-3), type: "Diesel", ltrs: 0, hrs: 0, cost: 0 },
  ],
  maint: [
    { id: "mt1", eq: "EQ-011", service: "500-hr service", due: dStr(6), cost: 1.8, status: "Scheduled" },
    { id: "mt2", eq: "EQ-021", service: "Hydraulic hose replacement", due: dStr(-2), cost: 0.9, status: "Overdue" },
    { id: "mt3", eq: "EQ-014", service: "1000-hr overhaul", due: dStr(21), cost: 4.2, status: "Planned" },
  ],
});

export type ERPState = ReturnType<typeof seed>;

/* ── permissions ─────────────────────────────────────────────── */
export interface Perm { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean; export: boolean }
export type Perms = Record<RoleId, Record<string, Perm>>;

function buildPerms(): Perms {
  const out = {} as Perms;
  for (const r of ROLES) {
    const rec: Record<string, Perm> = {};
    for (const m of MODULES) {
      const has = ACCESS[r.id].includes(m);
      rec[m] = {
        view: has,
        create: has && r.id !== "EMPLOYEE" && r.id !== "STORE" ? true : r.id === "STORE" ? has && (m === "materials" || m === "stores") : has && m === "attendance",
        edit: has && r.id !== "EMPLOYEE",
        delete: has && r.id === "SUPER_ADMIN",
        approve: has && ["SUPER_ADMIN", "MD", "HR", "ACCOUNTS", "PROCUREMENT", "PM", "COMMERCIAL", "RMC"].includes(r.id) && ["approvals", "procurement", "finance", "billing", "hr", "attendance", "materials", "commercial"].includes(m),
        export: has && r.id !== "EMPLOYEE" && !(r.id === "STORE" && m === "finance"),
      };
    }
    out[r.id] = rec;
  }
  return out;
}

/* ── context ─────────────────────────────────────────────────── */
interface ERP {
  s: ERPState;
  role: RoleId;
  user: { name: string; title: string; dept: string };
  userRec: UserRec;
  dark: boolean; setDark: (v: boolean) => void;
  can: (mod: ModuleId | string, perm: keyof Perm) => boolean;
  log: (module: string, action: string, entity: string, detail: string) => void;
  notify: (type: Notif["type"], text: string) => void;
  markRead: (id?: string) => void;
  setS: React.Dispatch<React.SetStateAction<ERPState>>;
  perms: Perms; setPerms: React.Dispatch<React.SetStateAction<Perms>>;
  nextCode: (prefix: string) => string;
  intent: { route: string; kind?: string } | null; setIntent: (v: { route: string; kind?: string } | null) => void;
  resetAll: () => void;
}

const Ctx = createContext<ERP | null>(null);
export const useERP = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useERP outside provider");
  return c;
};

const LS_KEY = "meridian.erp.v5";

export function ERPProvider({ role, children }: { role: RoleId; children: ReactNode }) {
  const [s, setS] = useState<ERPState>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { const p = JSON.parse(raw); if (p && p.v === 8 && p.data) return p.data as ERPState; }
    } catch { /* fall through to seed */ }
    return seed();
  });
  const [dark, setDarkState] = useState(() => { try { return localStorage.getItem("mer.dark") === "1"; } catch { return false; } });
  const [perms, setPerms] = useState<Perms>(buildPerms);
  const [intent, setIntent] = useState<{ route: string; kind?: string } | null>(null);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ v: 8, data: s })); } catch { /* storage full — ignore */ }
  }, [s]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try { localStorage.setItem("mer.dark", dark ? "1" : "0"); } catch { /* noop */ }
  }, [dark]);

  const r = ROLES.find((x) => x.id === role)!;
  const user = { name: r.person, title: r.title, dept: r.dept };
  const userRec = useMemo(() => s.users.find((u) => u.role === role) ?? ({ id: "u0", name: r.person, email: "", role, dept: r.dept, project: "HO", site: "Head Office", office: "Head Office", finLimit: 0, active: true, lastLogin: "Now" } as UserRec), [s.users, role, r]);

  const can = useCallback((mod: ModuleId | string, perm: keyof Perm) => {
    const rec = perms[role];
    if (!rec) return false;
    if (role === "SUPER_ADMIN") return true;
    return !!rec[mod]?.[perm];
  }, [perms, role]);

  const log = useCallback((module: string, action: string, entity: string, detail: string) => {
    setS((p) => ({
      ...p,
      audit: [{ id: "A-" + (5300 + p.audit.length), ts: new Date().toISOString(), user: r.person, role: r.label, module, action, entity, detail, ip: "10.20." + (4 + (r.person.length % 6)) + "." + (10 + r.person.length) }, ...p.audit],
    }));
  }, [r]);

  const notify = useCallback((type: Notif["type"], text: string) => {
    setS((p) => ({ ...p, notifs: [{ id: "n" + Date.now(), ts: new Date().toISOString(), type, text, read: false }, ...p.notifs] }));
  }, []);

  const markRead = useCallback((id?: string) => {
    setS((p) => ({ ...p, notifs: p.notifs.map((n) => (!id || n.id === id) ? { ...n, read: true } : n) }));
  }, []);

  const nextCode = useCallback((prefix: string) => {
    let code = prefix + "-0001";
    setS((p) => {
      const idx = p.series.findIndex((x) => x.prefix === prefix);
      if (idx >= 0) {
        const next = p.series[idx].next + 1;
        code = `${prefix}-${String(p.series[idx].next).padStart(4, "0")}`;
        return { ...p, series: p.series.map((x, i) => i === idx ? { ...x, next } : x) };
      }
      return p;
    });
    const cur = s.series.find((x) => x.prefix === prefix);
    return cur ? `${prefix}-${String(cur.next).padStart(4, "0")}` : code;
  }, [s.series]);

  const resetAll = useCallback(() => {
    try { localStorage.removeItem(LS_KEY); } catch { /* noop */ }
    setS(seed());
    window.location.reload();
  }, []);

  const value: ERP = {
    s, setS, role, user, userRec, dark, setDark: setDarkState, can, log, notify, markRead, perms, setPerms, nextCode, intent, setIntent, resetAll,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
