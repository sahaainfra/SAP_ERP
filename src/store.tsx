/* ── Meridian ERP · central data store ─────────────────────────
   One interconnected state: every transaction writes an audit
   entry, raises notifications and updates linked modules.       */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ACCESS, MODULES, PROJECTS, ROLES } from "./data";
import type { ModuleId, Project, RoleId } from "./data";

/* ── types ───────────────────────────────────────────────────── */
export type ProcType = "PR" | "RFQ" | "CS" | "PO" | "GRN" | "PINV" | "PAY";
export interface ProcDoc { id: string; code: string; type: ProcType; ref?: string; project: string; party: string; items: string; qty: number; unit: string; amount: number; date: string; status: string; by: string }
export interface Material { code: string; name: string; cat: string; unit: string; rol: number; rate: number }
export interface StockRow { material: string; store: string; onHand: number; unit: string; value: number }
export interface MTxn { id: string; code: string; kind: "Inward" | "Outward" | "Transfer" | "Return"; material: string; qty: number; unit: string; project: string; date: string; by: string }
export interface Employee { id: string; empId: string; name: string; dept: string; desig: string; project: string; joined: string; status: "Active" | "On Leave" | "Exited"; phone: string; base: number }
export interface AttRow { id: string; empId: string; name: string; project: string; date: string; checkIn: string; checkOut: string; hours: number; ot: number; status: "Present" | "Late" | "Absent" | "Half Day"; method: string; gps: string; appr: "Pending" | "Approved" | "Rejected" }
export interface LeaveReq { id: string; emp: string; type: "Casual" | "Sick" | "Earned"; from: string; to: string; days: number; status: "Pending" | "Approved" | "Rejected"; by: string }
export interface PayRun { id: string; period: string; status: "Draft" | "Processing" | "Approved" | "Paid"; employees: number; gross: number; deductions: number; net: number; date: string }
export interface RABill { id: string; no: string; project: string; client: string; prev: number; current: number; gross: number; retention: number; sd: number; adv: number; gst: number; other: number; net: number; status: "Submitted" | "Certified" | "Paid" | "Draft"; date: string }
export interface ARInv { id: string; no: string; client: string; ref: string; amount: number; due: string; status: "Raised" | "Partially Paid" | "Paid" | "Overdue"; received: number }
export interface APInv { id: string; no: string; vendor: string; ref: string; amount: number; due: string; status: "Booked" | "Scheduled" | "Paid" }
export interface Payment { id: string; no: string; party: string; ref: string; amount: number; date: string; mode: string; status: "Pending" | "Released" }
export interface BankAcc { id: string; bank: string; no: string; type: string; balance: number; reconciled: string }
export interface CoaRow { code: string; name: string; type: "Asset" | "Liability" | "Equity" | "Revenue" | "Expense"; balance: number }
export interface Journal { id: string; no: string; date: string; debit: string; credit: string; amount: number; narr: string; by: string }
export interface Tender { id: string; no: string; authority: string; nit: string; value: number; emd: number; fee: number; deadline: string; opening: string; stage: number; status: string; docs: Record<string, boolean> }
export interface Equip { code: string; name: string; reg: string; cap: string; project: string; hrs: number; fuel: number; status: "Operational" | "Idle" | "Under Maintenance" | "Breakdown"; maintDue: string }
export interface RmcOrder { id: string; no: string; customer: string; site: string; grade: string; qty: number; time: string; status: "Scheduled" | "Batching" | "In Transit" | "Delivered" }
export interface Batch { id: string; order: string; grade: string; qty: number; cement: number; sand: number; agg: number; admix: number; time: string; slump: number; cubes: string }
export interface DocFile { id: string; name: string; folder: string; type: string; ver: number; size: string; uploaded: string; by: string; expiry?: string }
export interface UserRec { id: string; name: string; email: string; role: RoleId; dept: string; project: string; active: boolean; lastLogin: string }
export interface Workflow { id: string; name: string; module: string; levels: string; basis: string; active: boolean }
export interface SeriesRec { doc: string; prefix: string; next: number }
export interface AuditEntry { id: string; ts: string; user: string; role: string; module: string; action: string; entity: string; detail: string; ip: string }
export interface Notif { id: string; ts: string; type: "approval" | "payment" | "stock" | "project" | "system"; text: string; read: boolean }
export type Perms = Record<string, Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean; approve: boolean; export: boolean }>>;

export const STAGE_LABEL = ["Discovery", "Registered", "Docs Downloaded", "Eligibility Check", "Technical Review", "BOQ Import", "Rate Analysis", "Cost Estimation", "Bid Submitted", "Result"];
export const PROC_STAGES: ProcType[] = ["PR", "RFQ", "CS", "PO", "GRN", "PINV", "PAY"];
export const PROC_LABEL: Record<ProcType, string> = { PR: "Purchase Requisition", RFQ: "Request for Quotation", CS: "Comparative Statement", PO: "Purchase Order", GRN: "Material Receipt", PINV: "Vendor Invoice", PAY: "Payment" };

/* ── seed helpers ────────────────────────────────────────────── */
let seedN = 0;
const sid = (p: string) => `${p}${++seedN}`;
const today = new Date();
const dISO = (offsetMin: number) => new Date(today.getTime() - offsetMin * 60000).toISOString();
const dStr = (daysAgo: number) => { const d = new Date(today.getTime() - daysAgo * 864e5); return `${String(d.getDate()).padStart(2, "0")} ${d.toLocaleString("en", { month: "short" })} ${d.getFullYear()}`; };

const defaultPerms = (): Perms => {
  const p: Perms = {};
  const mgr: RoleId[] = ["SUPER_ADMIN", "MD", "ACCOUNTS", "PROCUREMENT", "HR", "COMMERCIAL", "RMC", "PM"];
  for (const r of ROLES) {
    p[r.id] = {};
    for (const m of MODULES) {
      const has = ACCESS[r.id].includes(m);
      p[r.id][m] = {
        view: has,
        create: has && r.id !== "EMPLOYEE" && r.id !== "STORE" ? true : r.id === "STORE" ? has && (m === "materials" || m === "stores") : has && m === "attendance",
        edit: has && ["SUPER_ADMIN", "MD", "ACCOUNTS", "PROCUREMENT", "HR", "COMMERCIAL", "RMC", "PM"].includes(r.id) && mgr.includes(r.id),
        delete: r.id === "SUPER_ADMIN" && has,
        approve: has && mgr.includes(r.id) && r.id !== "PM" ? true : r.id === "PM" && ["approvals", "attendance", "billing"].includes(m),
        export: has && r.id !== "EMPLOYEE",
      };
    }
  }
  return p;
};

const seed = () => ({
  projects: PROJECTS as Project[],
  tenders: [
    { id: "t1", no: "TND-2026-014", authority: "NHAI — RO Pune", nit: "NIT/2025-26/1189", value: 214, emd: 2.1, fee: 0.5, deadline: dStr(-6), opening: dStr(-8), stage: 8, status: "Bid Submitted", docs: { NIT: true, BOQ: true, Drawings: true, Specifications: true, "Eligibility Docs": true, "Pre-bid Queries": true } },
    { id: "t2", no: "TND-2026-015", authority: "MSRDC", nit: "NIT/2025-26/1244", value: 86, emd: 0.86, fee: 0.25, deadline: dStr(-3), opening: dStr(-5), stage: 6, status: "Rate Analysis", docs: { NIT: true, BOQ: true, Drawings: true, Specifications: false, "Eligibility Docs": true, "Pre-bid Queries": false } },
    { id: "t3", no: "TND-2026-011", authority: "Pune Municipal Corp.", nit: "NIT/2025-26/1102", value: 42, emd: 0.42, fee: 0.2, deadline: dStr(12), opening: dStr(10), stage: 9, status: "Awarded — L1", docs: { NIT: true, BOQ: true, Drawings: true, Specifications: true, "Eligibility Docs": true, "Pre-bid Queries": true } },
    { id: "t4", no: "TND-2026-016", authority: "Indian Railways", nit: "NIT/2025-26/1310", value: 128, emd: 1.28, fee: 0.35, deadline: dStr(-11), opening: dStr(-13), stage: 4, status: "Technical Review", docs: { NIT: true, BOQ: true, Drawings: false, Specifications: false, "Eligibility Docs": false, "Pre-bid Queries": false } },
    { id: "t5", no: "TND-2026-017", authority: "ZP Solapur — Roads", nit: "NIT/2025-26/1377", value: 24, emd: 0.24, fee: 0.1, deadline: dStr(-15), opening: dStr(-16), stage: 2, status: "Docs Downloaded", docs: { NIT: true, BOQ: false, Drawings: false, Specifications: false, "Eligibility Docs": false, "Pre-bid Queries": false } },
  ] as Tender[],
  proc: [
    { id: "d1", code: "PR-1041", type: "PR", project: "P1", party: "Cement — OPC 53", items: "OPC 53 Grade Cement", qty: 120, unit: "MT", amount: 46.8, date: dStr(26), status: "Approved", by: "Sunita Deshmukh" },
    { id: "d2", code: "RFQ-0911", type: "RFQ", ref: "PR-1041", project: "P1", party: "3 vendors", items: "OPC 53 Grade Cement", qty: 120, unit: "MT", amount: 46.8, date: dStr(24), status: "Closed", by: "Imran Shaikh" },
    { id: "d3", code: "CS-0311", type: "CS", ref: "RFQ-0911", project: "P1", party: "UltraTech Cement", items: "OPC 53 Grade Cement", qty: 120, unit: "MT", amount: 45.9, date: dStr(22), status: "L1 Recommended", by: "Imran Shaikh" },
    { id: "d4", code: "PO-1281", type: "PO", ref: "CS-0311", project: "P1", party: "UltraTech Cement", items: "OPC 53 Grade Cement", qty: 120, unit: "MT", amount: 45.9, date: dStr(20), status: "Approved", by: "Rajesh Malhotra" },
    { id: "d5", code: "GRN-2041", type: "GRN", ref: "PO-1281", project: "P1", party: "UltraTech Cement", items: "OPC 53 Grade Cement", qty: 118, unit: "MT", amount: 45.1, date: dStr(16), status: "Received", by: "Dinesh Pawar" },
    { id: "d6", code: "INV-V-3311", type: "PINV", ref: "GRN-2041", project: "P1", party: "UltraTech Cement", items: "OPC 53 Grade Cement", qty: 118, unit: "MT", amount: 45.1, date: dStr(14), status: "Booked", by: "Prakash Rao" },
    { id: "d7", code: "PAY-0871", type: "PAY", ref: "INV-V-3311", project: "P1", party: "UltraTech Cement", items: "Against Vendor Invoice", qty: 1, unit: "—", amount: 45.1, date: dStr(9), status: "Released", by: "Prakash Rao" },
    { id: "d8", code: "PR-1044", type: "PR", project: "P2", party: "TMT Steel Fe550D", items: "TMT Bars 12–25 mm", qty: 85, unit: "MT", amount: 57.4, date: dStr(11), status: "Approved", by: "Anil More" },
    { id: "d9", code: "RFQ-0921", type: "RFQ", ref: "PR-1044", project: "P2", party: "4 vendors", items: "TMT Bars 12–25 mm", qty: 85, unit: "MT", amount: 57.4, date: dStr(9), status: "Closed", by: "Imran Shaikh" },
    { id: "d10", code: "CS-0318", type: "CS", ref: "RFQ-0921", project: "P2", party: "Tata Steel", items: "TMT Bars 12–25 mm", qty: 85, unit: "MT", amount: 56.1, date: dStr(7), status: "L1 Recommended", by: "Imran Shaikh" },
    { id: "d11", code: "PO-1287", type: "PO", ref: "CS-0318", project: "P2", party: "Tata Steel", items: "TMT Bars 12–25 mm", qty: 85, unit: "MT", amount: 56.1, date: dStr(5), status: "Pending Approval", by: "Imran Shaikh" },
    { id: "d12", code: "PR-1046", type: "PR", project: "P5", party: "Bitumen VG-30", items: "Bitumen VG-30", qty: 40, unit: "MT", amount: 21.6, date: dStr(4), status: "Approved", by: "Vikram Singh" },
    { id: "d13", code: "RFQ-0933", type: "RFQ", ref: "PR-1046", project: "P5", party: "3 vendors", items: "Bitumen VG-30", qty: 40, unit: "MT", amount: 21.6, date: dStr(2), status: "Open", by: "Imran Shaikh" },
    { id: "d14", code: "PR-1047", type: "PR", project: "P4", party: "Formwork Plywood", items: "18 mm Shuttering Plywood", qty: 800, unit: "Nos", amount: 9.6, date: dStr(1), status: "Pending Approval", by: "Sunita Deshmukh" },
    { id: "d15", code: "PO-1284", type: "PO", project: "P3", party: "Sika India", items: "RMC Admixture — PCE", qty: 2.4, unit: "KL", amount: 18.2, date: dStr(8), status: "Approved", by: "Rajesh Malhotra" },
    { id: "d16", code: "GRN-2044", type: "GRN", ref: "PO-1284", project: "P3", party: "Sika India", items: "RMC Admixture — PCE", qty: 2.4, unit: "KL", amount: 18.2, date: dStr(3), status: "Received", by: "Dinesh Pawar" },
  ] as ProcDoc[],
  materials: [
    { code: "MAT-001", name: "OPC Cement 53", cat: "Cement", unit: "MT", rol: 80, rate: 0.39 },
    { code: "MAT-002", name: "TMT Bars Fe550D", cat: "Steel", unit: "MT", rol: 40, rate: 0.66 },
    { code: "MAT-003", name: "M-Sand", cat: "Aggregates", unit: "MT", rol: 300, rate: 0.11 },
    { code: "MAT-004", name: "Coarse Aggregate 20 mm", cat: "Aggregates", unit: "MT", rol: 350, rate: 0.13 },
    { code: "MAT-005", name: "Bitumen VG-30", cat: "Road Material", unit: "MT", rol: 30, rate: 0.54 },
    { code: "MAT-006", name: "Shuttering Plywood 18 mm", cat: "Formwork", unit: "Nos", rol: 500, rate: 0.0012 },
    { code: "MAT-007", name: "Binding Wire", cat: "Consumables", unit: "kg", rol: 600, rate: 0.00008 },
    { code: "MAT-008", name: "PCE Admixture", cat: "Chemicals", unit: "Ltr", rol: 1500, rate: 0.0075 },
    { code: "MAT-009", name: "Curing Compound", cat: "Chemicals", unit: "Ltr", rol: 400, rate: 0.0022 },
    { code: "MAT-010", name: "Stone Dust", cat: "Aggregates", unit: "MT", rol: 200, rate: 0.07 },
  ] as Material[],
  stock: [
    { material: "OPC Cement 53", store: "Store A — P1", onHand: 96, unit: "MT", value: 37.4 },
    { material: "TMT Bars Fe550D", store: "Store B — P2", onHand: 28, unit: "MT", value: 18.5 },
    { material: "M-Sand", store: "Store A — P1", onHand: 410, unit: "MT", value: 4.5 },
    { material: "Coarse Aggregate 20 mm", store: "Store A — P1", onHand: 365, unit: "MT", value: 4.7 },
    { material: "Bitumen VG-30", store: "Store C — P5", onHand: 18, unit: "MT", value: 9.7 },
    { material: "Shuttering Plywood 18 mm", store: "Store B — P2", onHand: 320, unit: "Nos", value: 3.8 },
    { material: "PCE Admixture", store: "RMC Yard", onHand: 2100, unit: "Ltr", value: 1.6 },
    { material: "Binding Wire", store: "Store B — P2", onHand: 210, unit: "kg", value: 1.7 },
  ] as StockRow[],
  mTxns: [
    { id: "x1", code: "GRN-2041", kind: "Inward", material: "OPC Cement 53", qty: 118, unit: "MT", project: "P1", date: dStr(16), by: "Dinesh Pawar" },
    { id: "x2", code: "ISS-4471", kind: "Outward", material: "OPC Cement 53", qty: 40, unit: "MT", project: "P1", date: dStr(12), by: "Dinesh Pawar" },
    { id: "x3", code: "GRN-2044", kind: "Inward", material: "PCE Admixture", qty: 2400, unit: "Ltr", project: "P3", date: dStr(3), by: "Dinesh Pawar" },
    { id: "x4", code: "ISS-4489", kind: "Outward", material: "TMT Bars Fe550D", qty: 12, unit: "MT", project: "P2", date: dStr(6), by: "S. Gaikwad" },
    { id: "x5", code: "TRF-0181", kind: "Transfer", material: "M-Sand", qty: 60, unit: "MT", project: "P1 → P4", date: dStr(5), by: "Dinesh Pawar" },
    { id: "x6", code: "ISS-4502", kind: "Outward", material: "Binding Wire", qty: 80, unit: "kg", project: "P2", date: dStr(2), by: "S. Gaikwad" },
    { id: "x7", code: "RET-0092", kind: "Return", material: "Shuttering Plywood 18 mm", qty: 40, unit: "Nos", project: "P4", date: dStr(4), by: "Dinesh Pawar" },
    { id: "x8", code: "ISS-4511", kind: "Outward", material: "PCE Admixture", qty: 300, unit: "Ltr", project: "P3", date: dStr(1), by: "RMC Ops" },
  ] as MTxn[],
  employees: [
    { id: "e1", empId: "EMP-0114", name: "Ravi Kumar", dept: "Site Workforce", desig: "Mason — Grade II", project: "P1", joined: "12 Apr 2023", status: "Active", phone: "98220 44710", base: 18500 },
    { id: "e2", empId: "EMP-0121", name: "Santosh Jadhav", dept: "Site Workforce", desig: "Bar Bender", project: "P2", joined: "03 Jul 2023", status: "Active", phone: "97650 11230", base: 17800 },
    { id: "e3", empId: "EMP-0139", name: "Mahesh Gaikwad", dept: "Site Workforce", desig: "Carpenter", project: "P4", joined: "19 Jan 2024", status: "Active", phone: "90110 82341", base: 19200 },
    { id: "e4", empId: "EMP-0152", name: "Anita Pawar", dept: "Site Workforce", desig: "Helper", project: "P1", joined: "08 Sep 2024", status: "Active", phone: "95612 77450", base: 14200 },
    { id: "e5", empId: "EMP-0161", name: "Suresh Yadav", dept: "Plant & Machinery", desig: "JCB Operator", project: "P5", joined: "22 Feb 2022", status: "Active", phone: "98812 30476", base: 21500 },
    { id: "e6", empId: "EMP-0177", name: "Vinod Chavan", dept: "RMC Operations", desig: "Batching Operator", project: "RMC-1", joined: "30 Nov 2021", status: "Active", phone: "97300 55128", base: 22800 },
    { id: "e7", empId: "EMP-0183", name: "Priya Nair", dept: "Human Resources", desig: "HR Executive", project: "HO", joined: "15 May 2023", status: "Active", phone: "98190 44873", base: 32000 },
    { id: "e8", empId: "EMP-0190", name: "Imran Bagwan", dept: "Site Workforce", desig: "Mason — Grade I", project: "P2", joined: "27 Jun 2022", status: "On Leave", phone: "90960 11874", base: 20100 },
    { id: "e9", empId: "EMP-0204", name: "Ganesh Shinde", dept: "Site Workforce", desig: "Welder", project: "P3", joined: "05 Mar 2024", status: "Active", phone: "91300 67214", base: 21000 },
    { id: "e10", empId: "EMP-0211", name: "Kiran Rathod", dept: "Store Management", desig: "Store Assistant", project: "HO", joined: "11 Aug 2023", status: "Active", phone: "96650 28930", base: 19800 },
  ] as Employee[],
  attendance: [
    { id: "a1", empId: "EMP-0114", name: "Ravi Kumar", project: "P1", date: "Today", checkIn: "08:02", checkOut: "17:30", hours: 9.5, ot: 1.5, status: "Present", method: "GPS Punch", gps: "18.5204° N, 73.8567° E", appr: "Approved" },
    { id: "a2", empId: "EMP-0121", name: "Santosh Jadhav", project: "P2", date: "Today", checkIn: "08:41", checkOut: "—", hours: 8.0, ot: 0, status: "Late", method: "QR Punch", gps: "18.5089° N, 73.9250° E", appr: "Pending" },
    { id: "a3", empId: "EMP-0139", name: "Mahesh Gaikwad", project: "P4", date: "Today", checkIn: "07:58", checkOut: "17:12", hours: 9.2, ot: 1.2, status: "Present", method: "Biometric", gps: "18.6280° N, 73.8101° E", appr: "Approved" },
    { id: "a4", empId: "EMP-0152", name: "Anita Pawar", project: "P1", date: "Today", checkIn: "08:05", checkOut: "—", hours: 8.0, ot: 0, status: "Present", method: "Mobile Punch", gps: "18.5211° N, 73.8571° E", appr: "Pending" },
    { id: "a5", empId: "EMP-0161", name: "Suresh Yadav", project: "P5", date: "Today", checkIn: "06:48", checkOut: "—", hours: 10.4, ot: 2.4, status: "Present", method: "GPS Punch", gps: "17.7312° N, 75.0241° E", appr: "Pending" },
    { id: "a6", empId: "EMP-0177", name: "Vinod Chavan", project: "RMC-1", date: "Today", checkIn: "05:55", checkOut: "—", hours: 11.1, ot: 3.1, status: "Present", method: "Biometric", gps: "18.4712° N, 73.8901° E", appr: "Approved" },
    { id: "a7", empId: "EMP-0190", name: "Ganesh Shinde", project: "P3", date: "Today", checkIn: "—", checkOut: "—", hours: 0, ot: 0, status: "Absent", method: "—", gps: "—", appr: "Pending" },
    { id: "a8", empId: "EMP-0204", name: "Kiran Rathod", project: "HO", date: "Today", checkIn: "09:12", checkOut: "18:00", hours: 8.9, ot: 0, status: "Present", method: "Mobile Punch", gps: "18.5302° N, 73.8470° E", appr: "Approved" },
  ] as AttRow[],
  leaves: [
    { id: "l1", emp: "Imran Bagwan", type: "Sick", from: dStr(2), to: dStr(-2), days: 5, status: "Approved", by: "Sunita Deshmukh" },
    { id: "l2", emp: "Anita Pawar", type: "Casual", from: dStr(-9), to: dStr(-10), days: 2, status: "Pending", by: "Self" },
    { id: "l3", emp: "Suresh Yadav", type: "Earned", from: dStr(-20), to: dStr(-26), days: 7, status: "Pending", by: "Self" },
    { id: "l4", emp: "Ganesh Shinde", type: "Casual", from: dStr(6), to: dStr(5), days: 2, status: "Rejected", by: "Anil More" },
  ] as LeaveReq[],
  payroll: [
    { id: "p1", period: "Feb 2026", status: "Paid", employees: 1428, gross: 2.62, deductions: 0.41, net: 2.21, date: dStr(34) },
    { id: "p2", period: "Mar 2026", status: "Approved", employees: 1451, gross: 2.71, deductions: 0.43, net: 2.28, date: dStr(6) },
  ] as PayRun[],
  raBills: [
    { id: "r1", no: "RA-041", project: "P1", client: "NHAI", prev: 46.2, current: 8.4, gross: 54.6, retention: 2.73, sd: 1.37, adv: 1.2, gst: 9.16, other: 0.3, net: 39.84, status: "Paid", date: dStr(40) },
    { id: "r2", no: "RA-042", project: "P1", client: "NHAI", prev: 54.6, current: 7.8, gross: 62.4, retention: 3.12, sd: 1.56, adv: 1.2, gst: 10.48, other: 0.3, net: 45.74, status: "Certified", date: dStr(12) },
    { id: "r3", no: "RA-018", project: "P2", client: "MSRDC", prev: 28.4, current: 6.2, gross: 34.6, retention: 1.73, sd: 0.87, adv: 0.9, gst: 5.79, other: 0.2, net: 25.11, status: "Submitted", date: dStr(4) },
    { id: "r4", no: "RA-007", project: "P3", client: "Pune Smart City", prev: 6.8, current: 3.1, gross: 9.9, retention: 0.5, sd: 0.25, adv: 0.4, gst: 1.6, other: 0.1, net: 7.05, status: "Draft", date: dStr(1) },
  ] as RABill[],
  arInvoices: [
    { id: "ar1", no: "INV-C-2214", client: "NHAI", ref: "RA-042", amount: 45.74, due: dStr(-22), status: "Raised", received: 0 },
    { id: "ar2", no: "INV-C-2210", client: "MSRDC", ref: "RA-040", amount: 18.6, due: dStr(38), status: "Overdue", received: 0 },
    { id: "ar3", no: "INV-C-2207", client: "NHAI", ref: "RA-041", amount: 39.84, due: dStr(21), status: "Paid", received: 39.84 },
    { id: "ar4", no: "INV-C-2218", client: "Pune Municipal Corp.", ref: "RA-011", amount: 12.4, due: dStr(-9), status: "Partially Paid", received: 6.0 },
    { id: "ar5", no: "INV-C-2220", client: "Pune Smart City", ref: "RA-006", amount: 8.9, due: dStr(12), status: "Overdue", received: 0 },
  ] as ARInv[],
  apInvoices: [
    { id: "ap1", no: "INV-V-3311", vendor: "UltraTech Cement", ref: "PO-1281", amount: 45.1, due: dStr(-16), status: "Paid" },
    { id: "ap2", no: "INV-V-3327", vendor: "Tata Steel", ref: "PO-1287", amount: 56.1, due: dStr(-24), status: "Booked" },
    { id: "ap3", no: "INV-V-3330", vendor: "Vulcan Equipment", ref: "PO-1279", amount: 8.4, due: dStr(-8), status: "Scheduled" },
    { id: "ap4", no: "INV-V-3318", vendor: "Bharat Bitumen", ref: "PO-1275", amount: 21.6, due: dStr(14), status: "Paid" },
    { id: "ap5", no: "INV-V-3333", vendor: "Sika India", ref: "PO-1284", amount: 18.2, due: dStr(-19), status: "Booked" },
  ] as APInv[],
  payments: [
    { id: "py1", no: "PAY-0871", party: "UltraTech Cement", ref: "INV-V-3311", amount: 45.1, date: dStr(9), mode: "NEFT", status: "Released" },
    { id: "py2", no: "PAY-0872", party: "Bharat Bitumen", ref: "INV-V-3318", amount: 21.6, date: dStr(7), mode: "RTGS", status: "Released" },
    { id: "py3", no: "PAY-0874", party: "Vulcan Equipment", ref: "INV-V-3330", amount: 8.4, date: dStr(2), mode: "NEFT", status: "Pending" },
    { id: "py4", no: "PAY-0875", party: "Labour — P2 Wages", ref: "Payroll Feb", amount: 2.21, date: dStr(33), mode: "Bulk NEFT", status: "Released" },
  ] as Payment[],
  banks: [
    { id: "b1", bank: "HDFC Bank", no: "•••• 4471", type: "Current — HO", balance: 14.2, reconciled: dStr(2) },
    { id: "b2", bank: "ICICI Bank", no: "•••• 8820", type: "Current — Projects", balance: 22.6, reconciled: dStr(5) },
    { id: "b3", bank: "SBI", no: "•••• 1293", type: "OD Facility", balance: -8.4, reconciled: dStr(9) },
  ] as BankAcc[],
  coa: [
    { code: "1000", name: "Fixed Assets — Plant", type: "Asset", balance: 84.2 },
    { code: "1100", name: "Sundry Debtors", type: "Asset", balance: 186.4 },
    { code: "1200", name: "Cash & Bank", type: "Asset", balance: 28.4 },
    { code: "1300", name: "Inventory — Materials", type: "Asset", balance: 81.9 },
    { code: "2000", name: "Sundry Creditors", type: "Liability", balance: 93.4 },
    { code: "2100", name: "GST Payable", type: "Liability", balance: 11.8 },
    { code: "2200", name: "Secured Loans", type: "Liability", balance: 46.0 },
    { code: "3000", name: "Share Capital", type: "Equity", balance: 25.0 },
    { code: "3100", name: "Reserves & Surplus", type: "Equity", balance: 118.3 },
    { code: "4000", name: "Revenue — RA Billing", type: "Revenue", balance: 32.4 },
    { code: "5000", name: "Material Consumption", type: "Expense", balance: 13.1 },
    { code: "5100", name: "Labour & Wages", type: "Expense", balance: 11.2 },
  ] as CoaRow[],
  journals: [
    { id: "j1", no: "JV-0344", date: dStr(9), debit: "Sundry Creditors", credit: "HDFC Bank", amount: 45.1, narr: "Payment — UltraTech Cement INV-V-3311", by: "Prakash Rao" },
    { id: "j2", no: "JV-0341", date: dStr(12), debit: "Sundry Debtors", credit: "Revenue — RA Billing", amount: 45.74, narr: "RA-042 certified — NHAI", by: "Meera Krishnan" },
    { id: "j3", no: "JV-0338", date: dStr(16), debit: "Inventory — Materials", credit: "Sundry Creditors", amount: 45.1, narr: "GRN-2041 Cement stock-in", by: "Prakash Rao" },
    { id: "j4", no: "JV-0335", date: dStr(21), debit: "Labour & Wages", credit: "Bank — Payroll", amount: 2.21, narr: "Feb 2026 payroll disbursal", by: "Kavita Iyer" },
  ] as Journal[],
  subBills: [
    { id: "s1", no: "SB-118", sub: "Shree Piling Co.", scope: "Bored Piles — P3", amount: 14.8, adv: 1.5, retention: 0.74, net: 12.56, status: "Paid" },
    { id: "s2", no: "SB-121", sub: "Anand Earthworks", scope: "Earthwork — P5", amount: 9.2, adv: 0.9, retention: 0.46, net: 7.84, status: "Pending Certification" },
    { id: "s3", no: "SB-124", sub: "Vertex Waterproofing", scope: "Waterproofing — P1", amount: 4.6, adv: 0.4, retention: 0.23, net: 3.97, status: "Submitted" },
  ],
  variations: [
    { id: "v1", project: "P1", desc: "Additional box culvert at KM 12+400", amount: 3.8, status: "Approved" },
    { id: "v2", project: "P2", desc: "Scope change — junction widening", amount: 5.2, status: "Submitted" },
    { id: "v3", project: "P4", desc: "Extra item — rock excavation", amount: 2.1, status: "Under Review" },
    { id: "v4", project: "P5", desc: "Granular sub-base qty increase", amount: 1.4, status: "Approved" },
  ],
  equipment: [
    { code: "EQ-011", name: "Excavator CAT 320", reg: "MH-12-AB-4471", cap: "20 T", project: "P1", hrs: 1240, fuel: 18, status: "Operational", maintDue: dStr(-22) },
    { code: "EQ-014", name: "JCB 3DX", reg: "MH-13-CD-8820", cap: "7.5 T", project: "P5", hrs: 986, fuel: 11, status: "Operational", maintDue: dStr(6) },
    { code: "EQ-021", name: "Hydra Crane 14 T", reg: "MH-12-EF-1293", cap: "14 T", project: "P2", hrs: 1512, fuel: 14, status: "Under Maintenance", maintDue: dStr(3) },
    { code: "EQ-027", name: "Transit Mixer 6 m³", reg: "MH-12-GH-7745", cap: "6 m³", project: "RMC-1", hrs: 2210, fuel: 22, status: "Operational", maintDue: dStr(-4) },
    { code: "EQ-031", name: "Concrete Pump 36 m", reg: "MH-12-IJ-3302", cap: "60 m³/hr", project: "RMC-1", hrs: 1875, fuel: 26, status: "Operational", maintDue: dStr(15) },
    { code: "EQ-036", name: "Paver — Vogele", reg: "MH-13-KL-9918", cap: "6 m", project: "P5", hrs: 730, fuel: 16, status: "Idle", maintDue: dStr(30) },
  ] as Equip[],
  rmcOrders: [
    { id: "o1", no: "CO-2291", customer: "Internal — P1", site: "Viaduct Deck P4-P5", grade: "M40", qty: 120, time: "06:30", status: "In Transit" },
    { id: "o2", no: "CO-2292", customer: "Internal — P3", site: "Foundation Raft B2", grade: "M30", qty: 90, time: "08:00", status: "Batching" },
    { id: "o3", no: "CO-2289", customer: "Kalyani Builders", site: "RCC Slab L3", grade: "M25", qty: 60, time: "05:45", status: "Delivered" },
    { id: "o4", no: "CO-2293", customer: "Internal — P2", site: "Pile Cap PC-114", grade: "M35", qty: 75, time: "10:30", status: "Scheduled" },
    { id: "o5", no: "CO-2288", customer: "Rohan Infra", site: "Footings F-21", grade: "M20", qty: 45, time: "05:15", status: "Delivered" },
  ] as RmcOrder[],
  batches: [
    { id: "bt1", order: "CO-2291", grade: "M40", qty: 6, cement: 2.4, sand: 3.6, agg: 5.9, admix: 24, time: "07:12", slump: 120, cubes: "3 × 150 mm" },
    { id: "bt2", order: "CO-2291", grade: "M40", qty: 6, cement: 2.4, sand: 3.6, agg: 5.9, admix: 24, time: "07:34", slump: 115, cubes: "3 × 150 mm" },
    { id: "bt3", order: "CO-2289", grade: "M25", qty: 6, cement: 1.9, sand: 4.2, agg: 6.4, admix: 15, time: "06:05", slump: 100, cubes: "3 × 150 mm" },
    { id: "bt4", order: "CO-2288", grade: "M20", qty: 5, cement: 1.6, sand: 4.0, agg: 6.2, admix: 10, time: "05:31", slump: 95, cubes: "3 × 150 mm" },
  ] as Batch[],
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
    { id: "u1", name: "Arvind Nair", email: "arvind.n@sahaainfra.com", role: "SUPER_ADMIN", dept: "IT & Systems", project: "HO", active: true, lastLogin: "Today 09:12" },
    { id: "u2", name: "Rajesh Malhotra", email: "rajesh.m@sahaainfra.com", role: "MD", dept: "Executive Office", project: "HO", active: true, lastLogin: "Today 08:41" },
    { id: "u3", name: "Sunita Deshmukh", email: "sunita.d@sahaainfra.com", role: "PM", dept: "Project Execution", project: "P1", active: true, lastLogin: "Today 08:03" },
    { id: "u4", name: "Kavita Iyer", email: "kavita.i@sahaainfra.com", role: "HR", dept: "Human Resources", project: "HO", active: true, lastLogin: "Today 09:30" },
    { id: "u5", name: "Prakash Rao", email: "prakash.r@sahaainfra.com", role: "ACCOUNTS", dept: "Finance & Accounts", project: "HO", active: true, lastLogin: "Today 09:02" },
    { id: "u6", name: "Imran Shaikh", email: "imran.s@sahaainfra.com", role: "PROCUREMENT", dept: "Supply Chain", project: "HO", active: true, lastLogin: "Today 08:55" },
    { id: "u7", name: "Dinesh Pawar", email: "dinesh.p@sahaainfra.com", role: "STORE", dept: "Store Management", project: "P1", active: true, lastLogin: "Today 07:48" },
    { id: "u8", name: "Meera Krishnan", email: "meera.k@sahaainfra.com", role: "COMMERCIAL", dept: "Commercial & Contracts", project: "HO", active: true, lastLogin: "Today 09:21" },
    { id: "u9", name: "Sandeep Kulkarni", email: "sandeep.k@sahaainfra.com", role: "RMC", dept: "RMC Operations", project: "RMC-1", active: true, lastLogin: "Today 06:12" },
    { id: "u10", name: "Rohan Bhosale", email: "rohan.b@sahaainfra.com", role: "SITE_ENG", dept: "Project Execution", project: "P2", active: true, lastLogin: "Today 08:16" },
  ] as UserRec[],
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
  notifs: [
    { id: "n1", ts: dISO(12), type: "approval", text: "PO-1287 (₹56.1 L — Tata Steel) awaiting your approval", read: false },
    { id: "n2", ts: dISO(38), type: "stock", text: "TMT Bars Fe550D below reorder level at Store B", read: false },
    { id: "n3", ts: dISO(71), type: "payment", text: "MSRDC invoice INV-C-2210 overdue by 38 days (₹18.6 L)", read: false },
    { id: "n4", ts: dISO(120), type: "project", text: "P4 behind plan by 4% — billing pending", read: true },
    { id: "n5", ts: dISO(180), type: "approval", text: "3 attendance corrections pending verification", read: true },
    { id: "n6", ts: dISO(240), type: "system", text: "Nightly backup completed successfully (02:00 IST)", read: true },
  ] as Notif[],
});

export type ERPState = ReturnType<typeof seed>;

/* ── context ─────────────────────────────────────────────────── */
interface ERP {
  s: ERPState;
  role: RoleId;
  user: { name: string; title: string; dept: string };
  dark: boolean; setDark: (v: boolean) => void;
  can: (mod: ModuleId | string, perm: keyof Perms[string][string]) => boolean;
  log: (module: string, action: string, entity: string, detail: string) => void;
  notify: (type: Notif["type"], text: string) => void;
  markRead: (id?: string) => void;
  setS: React.Dispatch<React.SetStateAction<ERPState>>;
  perms: Perms; setPerms: React.Dispatch<React.SetStateAction<Perms>>;
  nextCode: (prefix: string) => string;
  intent: { route: string; kind: string } | null;
  setIntent: (i: { route: string; kind: string } | null) => void;
  resetAll: () => void;
}

const Ctx = createContext<ERP | null>(null);
export const useERP = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("ERP context missing");
  return c;
};

const LS_KEY = "mer.erp.v3";

export function ERPProvider({ role, children }: { role: RoleId; children: ReactNode }) {
  const [s, setS] = useState<ERPState>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) { const p = JSON.parse(raw); if (p && p.v === 3 && p.data) return p.data as ERPState; }
    } catch { /* fall through to seed */ }
    return seed();
  });
  const [dark, setDarkState] = useState(() => localStorage.getItem("mer.theme") === "dark");
  const [intent, setIntent] = useState<{ route: string; kind: string } | null>(null);
  const idRef = useRef(1000);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify({ v: 3, data: s })); } catch { /* storage full — ignore */ }
  }, [s]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("mer.theme", dark ? "dark" : "light");
  }, [dark]);

  const roleInfo = ROLES.find((r) => r.id === role) ?? ROLES[0];
  const [perms, setPerms] = useState<Perms>(() => {
    try {
      const raw = localStorage.getItem("mer.perms.v3");
      if (raw) return JSON.parse(raw) as Perms;
    } catch { /* ignore corrupted storage */ }
    return defaultPerms();
  });
  useEffect(() => { try { localStorage.setItem("mer.perms.v3", JSON.stringify(perms)); } catch { /* ignore */ } }, [perms]);

  const can = (mod: string, perm: keyof Perms[string][string]) =>
    role === "SUPER_ADMIN" ? ACCESS.SUPER_ADMIN.includes(mod as ModuleId) : !!perms[role]?.[mod]?.[perm];

  const nextCode = (prefix: string) => {
    idRef.current += 1;
    return `${prefix}-${idRef.current}`;
  };

  const log = (module: string, action: string, entity: string, detail: string) =>
    setS((p) => ({
      ...p,
      audit: [{ id: `A-${5242 + p.audit.length}`, ts: new Date().toISOString(), user: roleInfo.person, role: roleInfo.label, module, action, entity, detail, ip: "10.20.4." + (10 + (p.audit.length % 40)) }, ...p.audit],
    }));

  const notify = (type: Notif["type"], text: string) =>
    setS((p) => ({ ...p, notifs: [{ id: `n${Date.now()}`, ts: new Date().toISOString(), type, text, read: false }, ...p.notifs] }));

  const markRead = (id?: string) =>
    setS((p) => ({ ...p, notifs: p.notifs.map((n) => (id ? (n.id === id ? { ...n, read: true } : n) : { ...n, read: true })) }));

  const resetAll = () => { localStorage.removeItem(LS_KEY); localStorage.removeItem("mer.perms.v3"); window.location.reload(); };

  const value = useMemo<ERP>(() => ({
    s, role, user: { name: roleInfo.person, title: roleInfo.title, dept: roleInfo.dept },
    dark, setDark: setDarkState, can, log, notify, markRead, setS, perms, setPerms, nextCode, intent, setIntent, resetAll,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [s, role, dark, intent]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export { dStr, dISO };
