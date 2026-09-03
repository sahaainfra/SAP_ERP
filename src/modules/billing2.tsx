/* ── Meridian ERP · Billing & RA Bill Management Suite ────────
   Contract → BOQ → Measurement → Abstract → RA Bill →
   Certification → Receivable → Payment → Reconciliation        */
import { useMemo, useState } from "react";
import { useERP, dStr } from "../store";
import { Pill, Widget, useToast, cx } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat, AddBtn } from "./shell";
import type { Col } from "./shell";
import { printDocument, amountInWords } from "../print";
import { ICheck, IXCircle, IChevD, IPlus, IPrinter, IEye, IAlert, IStamp, IReceipt, IRupee, ICalCheck } from "../icons";

/* ── types & seed ────────────────────────────────────────────── */
interface BillContract {
  id: string; no: string; woNo: string; date: string; client: string; project: string; code: string; type: string;
  original: number; revised: number; start: string; completion: string; revCompletion: string; dlp: string;
  retention: number; sd: number; mobAdv: number; matAdv: number; gst: number; tds: number; cess: number; status: string;
}
interface BOQLine { boqNo: string; desc: string; unit: string; contractQty: number; revisedQty: number; rate: number; prevQty: number }
interface BillLine { boqNo: string; desc: string; unit: string; contractQty: number; rate: number; prev: number; current: number }
interface DeductRow { name: string; opening: number; current: number; cumulative: number; balance: number }
interface RABill {
  id: string; no: string; ref: string; rev: number; contractId: string; period: string; date: string; type: string;
  lines: BillLine[]; extras: number; escalation: number; deductions: DeductRow[];
  gross: number; gstTaxable: number; cgst: number; sgst: number; net: number;
  status: string; submitted?: string; certified?: string; certifiedAmt?: number; due?: string; received?: string; receivedAmt?: number;
  returns: { date: string; reason: string; by: string; response?: string }[];
  checklist: Record<string, boolean>; history: { ts: number; action: string; by: string }[];
}
interface MBEntry { id: string; page: string; date: string; project: string; location: string; boqNo: string; desc: string; drawing: string; nos: number; l: number; b: number; h: number; qty: number; status: string; by: string }

const Cr = (v: number) => v / 1e7;
const money = (v: number) => "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 }) + " Cr";

const CONTRACTS: BillContract[] = [
  { id: "c1", no: "MSRDC/MS3/2023-24/118", woNo: "WO/2023/441", date: "12 Aug 2023", client: "MSRDC", project: "Pune Metro Viaduct — Package 3", code: "P1", type: "Item Rate", original: 186, revised: 198.4, start: "01 Sep 2023", completion: "31 Aug 2026", revCompletion: "30 Nov 2026", dlp: "12 months", retention: 5, sd: 2.5, mobAdv: 8.6, matAdv: 2.4, gst: 18, tds: 2, cess: 1, status: "Active — EOT granted" },
  { id: "c2", no: "NHAI/RO-PUNE/2024/062", woNo: "WO/2024/087", date: "02 Feb 2024", client: "NHAI — RO Pune", project: "Katraj Bypass Viaduct", code: "P2", type: "Hybrid Annuity", original: 214, revised: 214, start: "15 Mar 2024", completion: "14 Mar 2027", revCompletion: "14 Mar 2027", dlp: "18 months", retention: 3, sd: 2, mobAdv: 0, matAdv: 0, gst: 18, tds: 2, cess: 1, status: "Active" },
  { id: "c4", no: "KSL/BLDG/2024/114", woNo: "WO/2024/356", date: "22 Jul 2024", client: "Kesoram Industries", project: "Industrial Park — Ph 2, Bhiwandi", code: "P4", type: "Lump Sum", original: 78, revised: 81.2, start: "01 Sep 2024", completion: "31 Dec 2025", revCompletion: "31 Dec 2025", dlp: "12 months", retention: 5, sd: 2.5, mobAdv: 4.0, matAdv: 0, gst: 18, tds: 2, cess: 1, status: "Active — LD clause invoked" },
  { id: "c7", no: "PMC/WTP/2025/009", woNo: "WO/2025/122", date: "10 Jan 2025", client: "Pune Municipal Corp.", project: "Water Treatment Plant — 120 MLD", code: "P7", type: "Item Rate", original: 46, revised: 47.8, start: "01 Feb 2025", completion: "31 Jan 2027", revCompletion: "31 Jan 2027", dlp: "12 months", retention: 5, sd: 2.5, mobAdv: 2.3, matAdv: 1.1, gst: 18, tds: 2, cess: 1, status: "Active" },
];

const BOQS: Record<string, BOQLine[]> = {
  c1: [
    { boqNo: "2.1", desc: "Earthwork in excavation for foundations", unit: "Cu.M", contractQty: 18500, revisedQty: 18500, rate: 485, prevQty: 17960 },
    { boqNo: "2.4", desc: "RCC M30 in piers, pier caps & deck", unit: "Cu.M", contractQty: 12400, revisedQty: 12820, rate: 7850, prevQty: 9140 },
    { boqNo: "2.6", desc: "TMT reinforcement Fe-550D (12–25 mm)", unit: "MT", contractQty: 2100, revisedQty: 2160, rate: 61500, prevQty: 1486 },
    { boqNo: "3.2", desc: "Structural steel formwork & staging", unit: "Sqm", contractQty: 41000, revisedQty: 41000, rate: 685, prevQty: 30150 },
    { boqNo: "4.1", desc: "Asphaltic wearing course 40 mm", unit: "Sqm", contractQty: 28500, revisedQty: 28500, rate: 812, prevQty: 8400 },
    { boqNo: "5.3", desc: "Anti-carbonation protective coating", unit: "Sqm", contractQty: 16200, revisedQty: 16200, rate: 245, prevQty: 4100 },
    { boqNo: "6.1", desc: "Bridge bearings — elastomeric", unit: "Nos", contractQty: 240, revisedQty: 252, rate: 42500, prevQty: 120 },
    { boqNo: "7.2", desc: "Street lighting & electrical works", unit: "LS", contractQty: 1, revisedQty: 1, rate: 8600000, prevQty: 0.35 },
  ],
  c2: [
    { boqNo: "1.1", desc: "Structural excavation in all soils", unit: "Cu.M", contractQty: 42000, revisedQty: 42000, rate: 420, prevQty: 36800 },
    { boqNo: "1.4", desc: "PCC M15 in foundations", unit: "Cu.M", contractQty: 5400, revisedQty: 5400, rate: 5200, prevQty: 4690 },
    { boqNo: "2.2", desc: "RCC M35 in segmental box girder", unit: "Cu.M", contractQty: 16800, revisedQty: 16800, rate: 8450, prevQty: 8760 },
    { boqNo: "2.5", desc: "TMT reinforcement Fe-550D", unit: "MT", contractQty: 2650, revisedQty: 2650, rate: 61500, prevQty: 1290 },
    { boqNo: "3.4", desc: "Segmental launching girder erection", unit: "Span", contractQty: 46, revisedQty: 46, rate: 3200000, prevQty: 21 },
    { boqNo: "4.2", desc: "Expansion joints — modular", unit: "RM", contractQty: 920, revisedQty: 920, rate: 14500, prevQty: 340 },
  ],
  c4: [
    { boqNo: "1.2", desc: "RCC framed structure — M25", unit: "Cu.M", contractQty: 9800, revisedQty: 10150, rate: 7250, prevQty: 7420 },
    { boqNo: "1.5", desc: "Brick masonry in CM 1:6", unit: "Cu.M", contractQty: 3200, revisedQty: 3200, rate: 3850, prevQty: 2680 },
    { boqNo: "2.1", desc: "Precast roofing sheets with insulation", unit: "Sqm", contractQty: 48000, revisedQty: 48000, rate: 385, prevQty: 39400 },
    { boqNo: "3.1", desc: "Epoxy flooring 3 mm", unit: "Sqm", contractQty: 26000, revisedQty: 27100, rate: 465, prevQty: 17800 },
    { boqNo: "4.1", desc: "HVAC & ventilation system", unit: "LS", contractQty: 1, revisedQty: 1, rate: 12400000, prevQty: 0.6 },
  ],
  c7: [
    { boqNo: "1.1", desc: "Excavation for tanks & intake well", unit: "Cu.M", contractQty: 68000, revisedQty: 69400, rate: 340, prevQty: 61200 },
    { boqNo: "2.2", desc: "RCC M30 in clarifiers & filter beds", unit: "Cu.M", contractQty: 8600, revisedQty: 8900, rate: 7650, prevQty: 5980 },
    { boqNo: "2.4", desc: "TMT reinforcement Fe-500D", unit: "MT", contractQty: 1450, revisedQty: 1490, rate: 59500, prevQty: 990 },
    { boqNo: "3.3", desc: "SS piping & valves", unit: "MT", contractQty: 380, revisedQty: 380, rate: 285000, prevQty: 148 },
    { boqNo: "5.1", desc: "SCADA & instrumentation", unit: "LS", contractQty: 1, revisedQty: 1, rate: 9200000, prevQty: 0.25 },
  ],
};

const SEED_BILLS: RABill[] = [
  {
    id: "b1", no: "RA-06/P1/2025-26", ref: "SAHAA/RA/P1/06", rev: 0, contractId: "c1", period: "01 Nov – 30 Nov 2025", date: "02 Dec 2025", type: "RA Bill",
    lines: [
      { boqNo: "2.1", desc: "Earthwork in excavation for foundations", unit: "Cu.M", contractQty: 18500, rate: 485, prev: 17420, current: 540 },
      { boqNo: "2.4", desc: "RCC M30 in piers, pier caps & deck", unit: "Cu.M", contractQty: 12400, rate: 7850, prev: 8320, current: 820 },
      { boqNo: "2.6", desc: "TMT reinforcement Fe-550D", unit: "MT", contractQty: 2100, rate: 61500, prev: 1310, current: 176 },
      { boqNo: "3.2", desc: "Structural steel formwork & staging", unit: "Sqm", contractQty: 41000, rate: 685, prev: 26800, current: 3350 },
    ],
    extras: 0.42, escalation: 0,
    deductions: [
      { name: "Retention @ 5%", opening: 3.42, current: 0.62, cumulative: 4.04, balance: 5.88 },
      { name: "Security deposit @ 2.5%", opening: 1.71, current: 0.31, cumulative: 2.02, balance: 2.94 },
      { name: "Mobilisation advance recovery", opening: 6.88, current: 1.24, cumulative: 8.12, balance: 0.48 },
      { name: "TDS @ 2%", opening: 1.37, current: 0.25, cumulative: 1.62, balance: 0 },
      { name: "Labour cess @ 1%", opening: 0.68, current: 0.12, cumulative: 0.8, balance: 0 },
    ],
    gross: 12.44, gstTaxable: 11.64, cgst: 1.05, sgst: 1.05, net: 13.74,
    status: "Fully Paid", submitted: "05 Dec 2025", certified: "18 Dec 2025", certifiedAmt: 13.58, due: "02 Jan 2026", received: "30 Dec 2025", receivedAmt: 13.58,
    returns: [], checklist: { mb: true, boq: true, drawings: true, site: true, prev: true, extras: true, var: true, ded: true, gst: true, docs: true, appr: true },
    history: [{ ts: Date.now() - 7.9e9, action: "Bill prepared — RA-06", by: "Anil Deshmukh" }, { ts: Date.now() - 7.2e9, action: "Certified by MSRDC — ₹13.58 Cr", by: "Client cell" }, { ts: Date.now() - 6.1e9, action: "Payment received in full", by: "Sneha Kulkarni" }],
  },
  {
    id: "b2", no: "RA-07/P1/2025-26", ref: "SAHAA/RA/P1/07", rev: 1, contractId: "c1", period: "01 Dec – 31 Dec 2025", date: "03 Jan 2026", type: "RA Bill",
    lines: [
      { boqNo: "2.4", desc: "RCC M30 in piers, pier caps & deck", unit: "Cu.M", contractQty: 12400, rate: 7850, prev: 9140, current: 610 },
      { boqNo: "2.6", desc: "TMT reinforcement Fe-550D", unit: "MT", contractQty: 2100, rate: 61500, prev: 1486, current: 112 },
      { boqNo: "4.1", desc: "Asphaltic wearing course 40 mm", unit: "Sqm", contractQty: 28500, rate: 812, prev: 8400, current: 3650 },
      { boqNo: "5.3", desc: "Anti-carbonation protective coating", unit: "Sqm", contractQty: 16200, rate: 245, prev: 4100, current: 2200 },
    ],
    extras: 0.68, escalation: 0.24,
    deductions: [
      { name: "Retention @ 5%", opening: 4.04, current: 0.71, cumulative: 4.75, balance: 5.17 },
      { name: "Security deposit @ 2.5%", opening: 2.02, current: 0.35, cumulative: 2.37, balance: 2.59 },
      { name: "Mobilisation advance recovery", opening: 8.12, current: 0.48, cumulative: 8.6, balance: 0 },
      { name: "Material advance recovery", opening: 1.58, current: 0.42, cumulative: 2.0, balance: 0.4 },
      { name: "TDS @ 2%", opening: 1.62, current: 0.28, cumulative: 1.9, balance: 0 },
      { name: "Labour cess @ 1%", opening: 0.8, current: 0.14, cumulative: 0.94, balance: 0 },
    ],
    gross: 14.18, gstTaxable: 12.24, cgst: 1.1, sgst: 1.1, net: 14.44,
    status: "Under Client Certification", submitted: "08 Jan 2026", certified: undefined, due: "23 Jan 2026",
    returns: [{ date: "12 Jan 2026", reason: "Measurement sheets for asphalt layer not attached; chainage register missing for Sqm 8,400–12,050.", by: "MSRDC — EE (Bridges)", response: "MB pages 41–46 and chainage register attached; resubmitted as Rev-01 on 15 Jan 2026." }],
    checklist: { mb: true, boq: true, drawings: true, site: true, prev: true, extras: true, var: true, ded: true, gst: true, docs: true, appr: true },
    history: [{ ts: Date.now() - 3.2e9, action: "Bill prepared — RA-07 Rev-00", by: "Anil Deshmukh" }, { ts: Date.now() - 2.8e9, action: "Returned by client — measurement query", by: "Client cell" }, { ts: Date.now() - 2.5e9, action: "Rev-01 resubmitted with MB annexures", by: "Anil Deshmukh" }],
  },
  {
    id: "b3", no: "RA-03/P2/2025-26", ref: "SAHAA/RA/P2/03", rev: 0, contractId: "c2", period: "01 Nov – 31 Dec 2025", date: "28 Jan 2026", type: "RA Bill",
    lines: [
      { boqNo: "2.2", desc: "RCC M35 in segmental box girder", unit: "Cu.M", contractQty: 16800, rate: 8450, prev: 8760, current: 1240 },
      { boqNo: "2.5", desc: "TMT reinforcement Fe-550D", unit: "MT", contractQty: 2650, rate: 61500, prev: 1290, current: 210 },
      { boqNo: "3.4", desc: "Segmental launching girder erection", unit: "Span", contractQty: 46, rate: 3200000, prev: 21, current: 5 },
      { boqNo: "4.2", desc: "Expansion joints — modular", unit: "RM", contractQty: 920, rate: 14500, prev: 340, current: 120 },
    ],
    extras: 0, escalation: 0.86,
    deductions: [
      { name: "Retention @ 3%", opening: 1.84, current: 0.44, cumulative: 2.28, balance: 4.14 },
      { name: "Security deposit @ 2%", opening: 1.23, current: 0.29, cumulative: 1.52, balance: 2.76 },
      { name: "TDS @ 2%", opening: 1.23, current: 0.29, cumulative: 1.52, balance: 0 },
      { name: "Labour cess @ 1%", opening: 0.61, current: 0.15, cumulative: 0.76, balance: 0 },
    ],
    gross: 14.62, gstTaxable: 12.55, cgst: 1.13, sgst: 1.13, net: 14.81,
    status: "Approved", submitted: undefined,
    returns: [], checklist: { mb: true, boq: true, drawings: true, site: true, prev: true, extras: true, var: true, ded: true, gst: true, docs: false, appr: true },
    history: [{ ts: Date.now() - 1.6e9, action: "Internal checking completed", by: "Vikram Salvi" }, { ts: Date.now() - 1.2e9, action: "Approved by Commercial Manager", by: "Vikram Salvi" }],
  },
  {
    id: "b4", no: "RA-02/P2/2025-26", ref: "SAHAA/RA/P2/02", rev: 0, contractId: "c2", period: "01 Sep – 31 Oct 2025", date: "04 Nov 2025", type: "RA Bill",
    lines: [
      { boqNo: "1.1", desc: "Structural excavation in all soils", unit: "Cu.M", contractQty: 42000, rate: 420, prev: 33200, current: 3600 },
      { boqNo: "2.2", desc: "RCC M35 in segmental box girder", unit: "Cu.M", contractQty: 16800, rate: 8450, prev: 7420, current: 1340 },
      { boqNo: "2.5", desc: "TMT reinforcement Fe-550D", unit: "MT", contractQty: 2650, rate: 61500, prev: 1080, current: 210 },
    ],
    extras: 0, escalation: 0.52,
    deductions: [
      { name: "Retention @ 3%", opening: 1.22, current: 0.38, cumulative: 1.6, balance: 4.82 },
      { name: "Security deposit @ 2%", opening: 0.81, current: 0.26, cumulative: 1.07, balance: 3.21 },
      { name: "TDS @ 2%", opening: 0.81, current: 0.26, cumulative: 1.07, balance: 0 },
      { name: "Labour cess @ 1%", opening: 0.41, current: 0.13, cumulative: 0.54, balance: 0 },
    ],
    gross: 12.74, gstTaxable: 11.15, cgst: 1.0, sgst: 1.0, net: 13.15,
    status: "Partially Paid", submitted: "10 Nov 2025", certified: "24 Nov 2025", certifiedAmt: 12.92, due: "09 Dec 2025", received: "18 Dec 2025", receivedAmt: 7.5,
    returns: [], checklist: { mb: true, boq: true, drawings: true, site: true, prev: true, extras: true, var: true, ded: true, gst: true, docs: true, appr: true },
    history: [{ ts: Date.now() - 5.4e9, action: "Certified ₹12.92 Cr — ₹0.23 Cr disallowed (excavation lead)", by: "Client cell" }, { ts: Date.now() - 4.1e9, action: "Part payment ₹7.50 Cr received", by: "Sneha Kulkarni" }],
  },
  {
    id: "b5", no: "RA-04/P7/2025-26", ref: "SAHAA/RA/P7/04", rev: 0, contractId: "c7", period: "01 Dec 2025 – 31 Jan 2026", date: "06 Feb 2026", type: "RA Bill",
    lines: [
      { boqNo: "1.1", desc: "Excavation for tanks & intake well", unit: "Cu.M", contractQty: 68000, rate: 340, prev: 58400, current: 2800 },
      { boqNo: "2.2", desc: "RCC M30 in clarifiers & filter beds", unit: "Cu.M", contractQty: 8600, rate: 7650, prev: 5980, current: 760 },
      { boqNo: "3.3", desc: "SS piping & valves", unit: "MT", contractQty: 380, rate: 285000, prev: 148, current: 54 },
    ],
    extras: 0.18, escalation: 0,
    deductions: [
      { name: "Retention @ 5%", opening: 0.52, current: 0.34, cumulative: 0.86, balance: 1.53 },
      { name: "Security deposit @ 2.5%", opening: 0.26, current: 0.17, cumulative: 0.43, balance: 0.77 },
      { name: "Mobilisation advance recovery", opening: 1.61, current: 0.68, cumulative: 2.29, balance: 0.01 },
      { name: "TDS @ 2%", opening: 0.21, current: 0.14, cumulative: 0.35, balance: 0 },
      { name: "Labour cess @ 1%", opening: 0.1, current: 0.07, cumulative: 0.17, balance: 0 },
    ],
    gross: 6.84, gstTaxable: 5.63, cgst: 0.51, sgst: 0.51, net: 6.65,
    status: "Submitted for Checking", submitted: undefined,
    returns: [], checklist: { mb: true, boq: true, drawings: false, site: true, prev: true, extras: false, var: true, ded: true, gst: true, docs: false, appr: false },
    history: [{ ts: Date.now() - 6.4e8, action: "Bill drafted — under internal checking", by: "Anil Deshmukh" }],
  },
];

const SEED_MB: MBEntry[] = [
  { id: "MB-0148", page: "41/12", date: "22 Jan 2026", project: "P1", location: "Pier 14–16, deck segment", boqNo: "2.4", desc: "RCC M30 in deck slab", drawing: "GAD-14 Rev C", nos: 12, l: 24.5, b: 8.2, h: 1.8, qty: 0, status: "Certified", by: "R. Iyer" },
  { id: "MB-0149", page: "42/08", date: "26 Jan 2026", project: "P1", location: "Ch. 3+200 – 3+850", boqNo: "4.1", desc: "Asphaltic wearing course 40 mm", drawing: "RWY-07 Rev B", nos: 1, l: 650, b: 11.5, h: 0.04, qty: 0, status: "Checked", by: "R. Iyer" },
  { id: "MB-0150", page: "18/05", date: "29 Jan 2026", project: "P2", location: "Span 22–23 box girder", boqNo: "2.2", desc: "RCC M35 segmental box girder", drawing: "SBG-22 Rev A", nos: 26, l: 3.6, b: 12.4, h: 2.9, qty: 0, status: "Certified", by: "S. Kadam" },
  { id: "MB-0151", page: "11/03", date: "02 Feb 2026", project: "P7", location: "Clarifier CW-2 base raft", boqNo: "2.2", desc: "RCC M30 in clarifier raft", drawing: "WTP-STR-09", nos: 1, l: 42, b: 42, h: 0.9, qty: 0, status: "Submitted", by: "A. Pawar" },
  { id: "MB-0152", page: "07/02", date: "04 Feb 2026", project: "P4", location: "Block C epoxy floor", boqNo: "3.1", desc: "Epoxy flooring 3 mm", drawing: "FLR-EP-03", nos: 4, l: 36, b: 22, h: 0.003, qty: 0, status: "Returned", by: "N. Joshi" },
].map((m) => ({ ...m, qty: +(m.nos * m.l * m.b * m.h).toFixed(2) }));

const CHECKLIST = [
  ["mb", "Measurement book completed"], ["boq", "BOQ quantities verified"], ["drawings", "Drawings attached"], ["site", "Site measurements approved"],
  ["prev", "Previous bill reconciled"], ["extras", "Extra items approved"], ["var", "Variations approved"], ["ded", "Deductions verified"],
  ["gst", "GST computation verified"], ["docs", "Supporting documents attached"], ["appr", "Internal approval completed"],
] as const;

const STAGES = ["Contract", "BOQ", "Execution", "Measurement", "RA Bill", "Checking", "Certification", "Payment"] as const;
const stageOf = (b: RABill) =>
  b.status === "Fully Paid" ? 7 : b.status === "Partially Paid" ? 7 : b.status === "Certified" ? 7 :
  b.status === "Under Client Certification" ? 6 : b.status === "Submitted to Client" ? 5 :
  b.status === "Approved" ? 5 : b.status === "Submitted for Checking" ? 5 : 4;

/* ── suite root ──────────────────────────────────────────────── */
export default function BillingSuite() {
  const { s, setS, can, log, notify, user } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState("dashboard");
  const [bills, setBills] = useState<RABill[]>(SEED_BILLS);
  const [mbs, setMbs] = useState<MBEntry[]>(SEED_MB);
  const [view, setView] = useState<RABill | null>(null);
  const [creating, setCreating] = useState(false);

  const patchBill = (b: RABill, patch: Partial<RABill>, action?: string) => {
    setBills((bs) => bs.map((x) => x.id === b.id ? { ...x, ...patch, history: [...x.history, { ts: Date.now(), action: action ?? "Updated", by: user.name }] } : x));
    if (action) log("Billing", action, b.no, `${b.type} · rev ${b.rev}`);
  };

  const certify = (b: RABill, amount: number) => {
    patchBill(b, { status: "Certified", certified: dStr(0), certifiedAmt: +amount.toFixed(2), due: dStr(-30) }, `Client certification recorded — ${money(amount)}`);
    const inv = { id: "ar" + Date.now(), no: "INV-C-" + (2221 + s.arInvoices.length), client: CONTRACTS.find((c) => c.id === b.contractId)!.client, ref: b.no, amount: +amount.toFixed(2), due: dStr(-30), status: "Raised" as const, received: 0 };
    setS((p) => ({ ...p, arInvoices: [inv, ...p.arInvoices] }));
    notify("payment", `${b.no} certified — receivable ${inv.no} (${money(amount)}) posted to client ledger`);
    toast("success", `${b.no} certified — receivable auto-posted to Accounts`);
  };

  const receive = (b: RABill, amount: number) => {
    const full = amount >= (b.certifiedAmt ?? b.net);
    patchBill(b, { status: full ? "Fully Paid" : "Partially Paid", received: dStr(0), receivedAmt: amount }, `Payment of ${money(amount)} received`);
    setS((p) => ({ ...p, arInvoices: p.arInvoices.map((a) => a.ref === b.no ? { ...a, received: amount, status: full ? "Paid" as const : "Partially Paid" as const } : a) }));
    notify("payment", `${money(amount)} received against ${b.no} — client ledger & bank updated`);
    toast("success", `Receipt recorded — ${full ? "bill fully settled" : "part payment booked"}`);
  };

  return (
    <div className="fade-up">
      {tab === "dashboard" && <BillingDashboard bills={bills} onOpen={(b) => setView(b)} onGoto={setTab} />}
      {tab === "contracts" && <ContractsTab bills={bills} />}
      {(tab === "bills") && <BillsTab bills={bills} onOpen={(b) => setView(b)} onCreate={() => setCreating(true)} canCreate={can("billing", "create")} onCertify={certify} onReceive={receive} onPatch={patchBill} />}
      {tab === "mb" && <MBTab mbs={mbs} setMbs={setMbs} />}
      {tab === "extras" && <ExtrasTab />}
      {tab === "advances" && <AdvancesTab bills={bills} />}
      {tab === "cert" && <CertTab bills={bills} onOpen={(b) => setView(b)} />}
      {tab === "forecast" && <ForecastTab />}
      {tab === "reports" && <BillingReports bills={bills} />}

      <BillDrawer bill={view ? bills.find((x) => x.id === view.id) ?? view : null} onClose={() => setView(null)} onCertify={certify} onReceive={receive} onPatch={patchBill}
        canApprove={can("billing", "approve")} onRevise={(b) => { patchBill(b, { rev: b.rev + 1, status: "Under Preparation" }, `Revision Rev-${String(b.rev + 1).padStart(2, "0")} raised — original preserved`); toast("info", `${b.no} revised — Rev-${String(b.rev + 1).padStart(2, "0")} opened, original frozen`); }} />
      <CreateBillDrawer open={creating} onClose={() => setCreating(false)} onSave={(b, status) => {
        setBills((bs) => [{ ...b, status }, ...bs]);
        log("Billing", status === "Draft" ? "Bill Drafted" : "Bill Submitted for Checking", b.no, `${b.type} · gross ${money(b.gross)} · net ${money(b.net)}`);
        if (status === "Submitted for Checking") notify("approval", `${b.no} submitted for internal checking`);
        toast("success", `${b.no} saved as ${status.toLowerCase()}`);
        setCreating(false);
      }} />
    </div>
  );
}

/* ── dashboard ───────────────────────────────────────────────── */
function BillingDashboard({ bills, onOpen, onGoto }: { bills: RABill[]; onOpen: (b: RABill) => void; onGoto: (t: string) => void }) {
  const contractValue = CONTRACTS.reduce((a, c) => a + c.original, 0);
  const revisedValue = CONTRACTS.reduce((a, c) => a + c.revised, 0);
  const billed = bills.reduce((a, b) => a + b.gross, 0);
  const certified = bills.reduce((a, b) => a + (b.certifiedAmt ?? 0), 0);
  const received = bills.reduce((a, b) => a + (b.receivedAmt ?? 0), 0);
  const retention = bills.reduce((a, b) => a + (b.deductions.find((d) => d.name.startsWith("Retention"))?.cumulative ?? 0), 0);
  const deductions = bills.reduce((a, b) => a + b.deductions.reduce((x, d) => x + d.current, 0), 0);
  const outstanding = certified - received;
  const overdue = bills.filter((b) => b.due && b.status.includes("Paid") === false && b.certified).reduce((a, b) => a + (b.certifiedAmt ?? 0) - (b.receivedAmt ?? 0), 0);

  const counts = STAGES.map((_, i) => bills.filter((b) => stageOf(b) === i).length);
  const months = [["Sep", 8.2, 7.1], ["Oct", 11.4, 9.8], ["Nov", 12.4, 13.6], ["Dec", 14.2, 7.5], ["Jan", 14.8, 12.9], ["Feb", 6.8, 4.2]] as const;
  const max = Math.max(...months.map((m) => Math.max(m[1], m[2])));

  const kpis: [string, string, string?][] = [
    ["Contract value", money(contractValue)], ["Revised value", money(revisedValue)],
    ["Work executed", money(billed + 312.4), "incl. prior FYs"], ["Cumulative certified", money(certified + 284.6)],
    ["Retention held", money(retention), "release at DLP"], ["Total deductions", money(deductions)],
    ["Total receivable", money(outstanding + 21.4)], ["Received YTD", money(received + 96.3)],
    ["Outstanding", money(outstanding)], ["Overdue", money(Math.max(0, overdue)), overdue > 0 ? "chase client" : "none"],
  ];

  return (
    <div className="space-y-4">
      {/* lifecycle rail */}
      <div className="bg-surface border border-line rounded-[10px] shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-300">Billing lifecycle</p>
            <h2 className="font-display text-[16px] font-bold text-ink-900 tracking-tight">Contract → Measurement → RA Bill → Certification → Payment</h2>
          </div>
          <span className="hidden sm:block text-[11px] text-ink-400 num">₹{(certified + 284.6).toFixed(1)} Cr certified lifetime · {(bills.filter((b) => ["Fully Paid", "Partially Paid", "Certified", "Under Client Certification", "Submitted to Client", "Approved", "Submitted for Checking"].includes(b.status)).length)} live bills</span>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-8 gap-1.5">
          {STAGES.map((st, i) => {
            const live = i >= 4 && i <= 7;
            const active = i === 6;
            return (
              <button key={st} onClick={() => live && onGoto(i === 4 ? "bills" : i === 6 ? "cert" : i === 5 ? "bills" : "forecast")}
                className={cx("relative rounded-lg border px-2 py-2.5 text-center transition-all hover:-translate-y-[2px] hover:shadow-lift active:scale-[0.97]",
                  active ? "border-brand-500 bg-brand-50" : "border-line bg-canvas/50")}>
                <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-ink-400">{st}</p>
                <p className={cx("num text-[17px] font-bold mt-0.5", active ? "text-brand-700" : "text-ink-900")}>{live ? counts[i] : "—"}</p>
                {active && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand-600 animate-pulse-dot" />}
              </button>);
          })}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {kpis.map(([l, v, sub]) => (
          <div key={l} className="group bg-surface border border-line rounded-[10px] px-3.5 py-3 hover:shadow-lift hover:-translate-y-[2px] transition-all duration-200">
            <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-400">{l}</p>
            <p className="num text-[16.5px] font-bold text-ink-900 mt-1">{v}</p>
            {sub && <p className="text-[9.5px] text-ink-300 mt-0.5">{sub}</p>}
          </div>))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Widget title="Billing vs collection" subtitle="₹ Cr · last 6 months" className="lg:col-span-2">
          <div className="flex items-end gap-4 h-[190px] px-1">
            {months.map(([m, bill, coll]) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-1 h-full">
                  <div className="w-[36%] rounded-t bg-brand-600 group-hover:bg-brand-700 transition-all relative" style={{ height: `${(bill / max) * 100}%` }}>
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 num text-[9px] font-bold text-ink-500 opacity-0 group-hover:opacity-100 transition-opacity">{bill}</span>
                  </div>
                  <div className="w-[36%] rounded-t bg-[#c6d3de] dark:bg-[#41566a] transition-all" style={{ height: `${(coll / max) * 100}%` }} />
                </div>
                <span className="text-[9.5px] font-bold uppercase text-ink-400">{m}</span>
              </div>))}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10.5px] text-ink-400 font-medium">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-brand-600" /> Billed</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#c6d3de] dark:bg-[#41566a]" /> Collected</span>
            <span className="ml-auto num">Collection efficiency <b className="text-ok-600">87%</b></span>
          </div>
        </Widget>

        <Widget title="Project-wise billing" subtitle="Submitted vs certified · ₹ Cr">
          <ul className="space-y-3">
            {CONTRACTS.map((c) => {
              const sub = bills.filter((b) => b.contractId === c.id).reduce((a, b) => a + b.gross, 0);
              const cert = bills.filter((b) => b.contractId === c.id).reduce((a, b) => a + (b.certifiedAmt ?? 0), 0);
              return (
                <li key={c.id}>
                  <div className="flex justify-between text-[11.5px] mb-1"><span className="font-semibold text-ink-700">{c.code} · {c.client}</span><span className="num text-ink-500">{sub.toFixed(1)} / <b className="text-ink-900">{cert.toFixed(1)}</b></span></div>
                  <div className="h-[7px] rounded-full bg-line overflow-hidden relative">
                    <div className="absolute inset-y-0 left-0 bg-[#c6d3de] dark:bg-[#41566a] rounded-full" style={{ width: `${Math.min(100, (sub / c.revised) * 100 * 2.4)}%` }} />
                    <div className="absolute inset-y-0 left-0 bg-brand-600 rounded-full" style={{ width: `${Math.min(100, (cert / c.revised) * 100 * 2.4)}%` }} />
                  </div>
                </li>);
            })}
          </ul>
        </Widget>

        <Widget title="Deduction analysis" subtitle="Running totals across contracts · ₹ Cr">
          <ul className="space-y-2">
            {["Retention", "Security deposit", "Mobilisation advance", "Material advance", "TDS", "Labour cess"].map((name) => {
              const cum = bills.reduce((a, b) => a + (b.deductions.find((d) => d.name.startsWith(name))?.cumulative ?? 0), 0);
              const maxV = 12;
              return (
                <li key={name} className="flex items-center gap-2.5 text-[11.5px]">
                  <span className="text-ink-500 w-[150px] truncate">{name}</span>
                  <span className="flex-1 h-[6px] rounded-full bg-line overflow-hidden"><span className="block h-full rounded-full bg-amber-500/80" style={{ width: `${Math.min(100, (cum / maxV) * 100)}%` }} /></span>
                  <span className="num font-semibold text-ink-900 w-[70px] text-right">{cum.toFixed(2)}</span>
                </li>);
            })}
          </ul>
          <p className="text-[10.5px] text-ink-300 mt-3 border-t border-line pt-2.5">Retention releases tracked against DLP completion per contract in Advances &amp; Retention.</p>
        </Widget>

        <Widget title="Certification & collection efficiency" subtitle="Management KPIs" className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              ["Billing conversion", "94%", "submitted → certified", "ok"], ["Avg certification days", "12.4", "target ≤ 15", "ok"],
              ["Avg collection days", "26.1", "target ≤ 30", "warn"], ["Outstanding days", "31.2", "DSO trend ↓ 6 d", "warn"],
            ].map(([l, v, sub, tone]) => (
              <div key={l as string} className="rounded-lg border border-line bg-canvas/50 p-3 text-center hover:border-line-strong transition-all">
                <p className={cx("num text-[21px] font-bold", tone === "ok" ? "text-ok-600" : "text-amber-600")}>{v}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400 mt-1">{l}</p>
                <p className="text-[9.5px] text-ink-300 mt-0.5">{sub}</p>
              </div>))}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              ["P1 certification delayed", "RA-07 with client 23 days — escalation drafted", "warn"],
              ["Billing ahead of physical", "P4 billing 61% vs physical 54% — verify MB coverage", "warn"],
              ["Physical ahead of billing", "P2 spans 22–27 measured but unbilled — raise RA-03 promptly", "info"],
            ].map(([t, d, tone]) => (
              <span key={t as string} className={cx("flex items-center gap-1.5 text-[10.5px] font-semibold px-2.5 py-1.5 rounded-full border",
                tone === "warn" ? "border-amber-500/30 bg-amber-100/40 text-amber-600" : "border-steel-300/40 bg-steel-100/40 text-steel-600")}>
                <IAlert size={11} /> {t}
              </span>))}
          </div>
        </Widget>
      </div>
    </div>
  );
}

/* ── contracts ───────────────────────────────────────────────── */
function ContractsTab({ bills }: { bills: RABill[] }) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<BillContract | null>(null);
  const rows = CONTRACTS.filter((c) => (c.no + c.client + c.project).toLowerCase().includes(q.toLowerCase()));
  const cols: Col[] = [
    { key: "no", label: "Contract / WO", sort: (c) => c.no, render: (c) => <div><p className="num text-[12px] font-bold text-brand-700">{c.no}</p><p className="text-[10.5px] text-ink-400 num">{c.woNo} · {c.date}</p></div> },
    { key: "client", label: "Client / Project", render: (c) => <div><p className="text-[12.5px] font-semibold text-ink-900">{c.client}</p><p className="text-[10.5px] text-ink-400">{c.project}</p></div> },
    { key: "type", label: "Type", render: (c) => <span className="text-[10.5px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{c.type}</span> },
    { key: "original", label: "Original (₹ Cr)", align: "right", sort: (c) => c.original, render: (c) => <span className="num text-[12px]">{c.original.toFixed(1)}</span> },
    { key: "revised", label: "Revised (₹ Cr)", align: "right", sort: (c) => c.revised, render: (c) => <span className="num text-[12.5px] font-bold text-ink-900">{c.revised.toFixed(1)}</span> },
    { key: "completion", label: "Completion", render: (c) => <div className="text-[11px] num text-ink-500">{c.completion}{c.revCompletion !== c.completion && <p className="text-[9.5px] text-amber-600 font-semibold">→ {c.revCompletion} (EOT)</p>}</div> },
    { key: "retention", label: "Ret / SD", align: "center", render: (c) => <span className="num text-[11px] text-ink-500">{c.retention}% / {c.sd}%</span> },
    { key: "status", label: "Status", render: (c) => <Pill value={c.status.startsWith("Active") ? "On Track" : c.status} /> },
  ];
  return (
    <div>
      <PageHead title="Contract & Work Order Master" crumbs={["Meridian", "Billing", "Contracts"]} desc="Contract terms driving every bill — retention, security deposit, advances, GST, TDS and cess with amendment history.">
        <Stat label="Contracts" value={`${CONTRACTS.length}`} />
        <Stat label="Revised value" value={money(CONTRACTS.reduce((a, c) => a + c.revised, 0))} />
        <Stat label="EOT granted" value="1" tone="warn" />
      </PageHead>
      <Widget title="Contract register" subtitle="Deduction parameters flow automatically into the RA bill engine">
        <FilterBar pageKey="contracts2" q={q} onQ={setQ} filters={[]} />
        <DataTable pageKey="billing-contracts" rows={rows} cols={cols} onRow={(c) => setSel(c)} />
      </Widget>
      <Drawer wide open={!!sel} onClose={() => setSel(null)} title={sel ? `${sel.no}` : ""} sub={sel ? `${sel.woNo} · ${sel.client} · ${sel.project}` : ""}>
        {sel && (() => {
          const boq = BOQS[sel.id] ?? [];
          const boqValue = boq.reduce((a, l) => a + l.revisedQty * l.rate, 0) / 1e7;
          const executed = bills.filter((b) => b.contractId === sel.id).reduce((a, b) => a + b.gross, 0);
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[["Original value", money(sel.original)], ["Revised value", money(sel.revised)], ["BOQ value", money(boqValue)], ["Billed to date", money(executed + 26.4)],
                  ["Retention", `${sel.retention}%`], ["Security deposit", `${sel.sd}%`], ["GST / TDS / Cess", `${sel.gst}% / ${sel.tds}% / ${sel.cess}%`], ["DLP", sel.dlp],
                  ["Mobilisation adv.", money(sel.mobAdv)], ["Material adv.", money(sel.matAdv)], ["Start", sel.start], ["Revised completion", sel.revCompletion]].map(([k, v]) => (
                  <div key={k as string} className="rounded-lg border border-line bg-canvas/50 px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[0.1em] text-ink-400">{k}</p><p className="text-[12.5px] font-semibold text-ink-900 num mt-0.5">{v}</p></div>))}
              </div>
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Billing BOQ — previous / cumulative position</p>
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-left min-w-[720px]">
                    <thead><tr className="text-[9.5px] uppercase tracking-[0.08em] text-ink-400">
                      <th className="font-bold pb-2 pr-3">BOQ Item</th><th className="font-bold pb-2 pr-3">Unit</th><th className="font-bold pb-2 pr-3 text-right">Contract Qty</th>
                      <th className="font-bold pb-2 pr-3 text-right">Revised Qty</th><th className="font-bold pb-2 pr-3 text-right">Rate (₹)</th><th className="font-bold pb-2 pr-3 text-right">Prev Qty</th>
                      <th className="font-bold pb-2 pr-3 text-right">Balance</th><th className="font-bold pb-2 text-right">% Done</th>
                    </tr></thead>
                    <tbody>{boq.map((l) => {
                      const bal = l.revisedQty - l.prevQty;
                      const pct = Math.min(100, (l.prevQty / l.revisedQty) * 100);
                      return (
                        <tr key={l.boqNo} className="border-t border-line/80">
                          <td className="py-2 pr-3"><span className="num text-[10.5px] font-bold text-brand-700">{l.boqNo}</span> <span className="text-[12px] font-medium text-ink-900">{l.desc}</span></td>
                          <td className="py-2 pr-3 text-[11px] text-ink-500">{l.unit}</td>
                          <td className="py-2 pr-3 text-right num text-[11.5px]">{l.contractQty.toLocaleString("en-IN")}</td>
                          <td className="py-2 pr-3 text-right num text-[11.5px]">{l.revisedQty.toLocaleString("en-IN")}{l.revisedQty !== l.contractQty && <span className="text-amber-600 font-bold"> *</span>}</td>
                          <td className="py-2 pr-3 text-right num text-[11.5px]">{l.rate.toLocaleString("en-IN")}</td>
                          <td className="py-2 pr-3 text-right num text-[11.5px] font-semibold">{l.prevQty.toLocaleString("en-IN")}</td>
                          <td className={cx("py-2 pr-3 text-right num text-[11.5px] font-semibold", bal < 0 ? "text-danger-600" : "text-ink-500")}>{bal.toLocaleString("en-IN")}</td>
                          <td className="py-2 w-[110px]"><div className="h-[6px] rounded-full bg-line overflow-hidden"><div className="h-full bg-brand-600 rounded-full" style={{ width: `${pct}%` }} /></div><p className="num text-[9.5px] text-ink-400 text-right mt-0.5">{pct.toFixed(0)}%</p></td>
                        </tr>);
                    })}</tbody>
                  </table>
                </div>
                <p className="text-[10px] text-ink-300 mt-1.5">* Revised quantity includes approved variation orders. Balance = Revised − Cumulative; negative balance requires management approval.</p>
              </div>
            </div>);
        })()}
      </Drawer>
    </div>
  );
}

/* ── RA bills ────────────────────────────────────────────────── */
function BillsTab({ bills, onOpen, onCreate, canCreate, onCertify, onReceive, onPatch }: {
  bills: RABill[]; onOpen: (b: RABill) => void; onCreate: () => void; canCreate: boolean;
  onCertify: (b: RABill, a: number) => void; onReceive: (b: RABill, a: number) => void; onPatch: (b: RABill, p: Partial<RABill>, a?: string) => void;
}) {
  const toast = useToast();
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("");
  const STATUS = ["Draft", "Submitted for Checking", "Approved", "Submitted to Client", "Under Client Certification", "Certified", "Partially Paid", "Fully Paid", "Returned"];
  const rows = bills.filter((b) => (!fStatus || b.status === fStatus) && (b.no + b.ref + CONTRACTS.find((c) => c.id === b.contractId)?.client).toLowerCase().includes(q.toLowerCase()));

  const cols: Col[] = [
    { key: "no", label: "RA Bill", sort: (b) => b.no, render: (b) => <div><p className="num text-[12.5px] font-bold text-brand-700">{b.no}</p><p className="text-[10px] text-ink-400 num">Rev-{String(b.rev).padStart(2, "0")} · {b.ref} · {b.period}</p></div> },
    { key: "client", label: "Client / Project", render: (b) => { const c = CONTRACTS.find((x) => x.id === b.contractId)!; return <div><p className="text-[12.5px] font-semibold text-ink-900">{c.client}</p><p className="text-[10.5px] text-ink-400">{c.code} · {c.project}</p></div>; } },
    { key: "gross", label: "Gross (₹ Cr)", align: "right", sort: (b) => b.gross, render: (b) => <span className="num text-[12px]">{b.gross.toFixed(2)}</span> },
    { key: "ded", label: "Deductions", align: "right", sort: (b) => b.deductions.reduce((a, d) => a + d.current, 0), render: (b) => <span className="num text-[11.5px] text-danger-600">−{b.deductions.reduce((a, d) => a + d.current, 0).toFixed(2)}</span> },
    { key: "gst", label: "GST", align: "right", render: (b) => <span className="num text-[11.5px] text-ink-500">+{(b.cgst + b.sgst).toFixed(2)}</span> },
    { key: "net", label: "Net (₹ Cr)", align: "right", sort: (b) => b.net, render: (b) => <span className="num text-[12.5px] font-bold text-ink-900">{b.net.toFixed(2)}</span> },
    { key: "certified", label: "Certified", align: "right", sort: (b) => b.certifiedAmt ?? 0, render: (b) => b.certifiedAmt ? <span className="num text-[12px] font-semibold text-ok-600">{b.certifiedAmt.toFixed(2)}</span> : <span className="text-[10.5px] text-ink-300">—</span> },
    { key: "status", label: "Status", render: (b) => <Pill value={b.status} pulse={["Under Client Certification", "Submitted for Checking", "Submitted to Client"].includes(b.status)} /> },
    { key: "act", label: "Actions", render: (b: RABill) => (
      <span className="flex items-center gap-1 justify-end">
        {b.status === "Submitted for Checking" && <Btn sm onClick={(e: any) => { e.stopPropagation(); onPatch(b, { status: "Approved" }, "Internal checking completed — approved for submission"); toast("success", `${b.no} approved internally`); }}><ICheck size={11} /> Check</Btn>}
        {b.status === "Approved" && <Btn sm onClick={(e: any) => { e.stopPropagation(); onPatch(b, { status: "Submitted to Client", submitted: dStr(0) }, "Submitted to client"); toast("success", `${b.no} submitted to client`); }}><IStamp size={11} /> Submit</Btn>}
        {["Submitted to Client", "Under Client Certification"].includes(b.status) && <Btn sm kind="ok" onClick={(e: any) => { e.stopPropagation(); onCertify(b, b.net); }}><ICheck size={11} /> Certify</Btn>}
        {(b.status === "Certified" || b.status === "Partially Paid") && <Btn sm kind="primary" onClick={(e: any) => { e.stopPropagation(); onReceive(b, b.certifiedAmt ?? b.net); }}><IRupee size={11} /> Receive</Btn>}
        <Btn sm onClick={(e: any) => { e.stopPropagation(); onOpen(b); }}><IEye size={11} /></Btn>
      </span>) },
  ];

  return (
    <div>
      <PageHead title="RA Bills & Client Billing" crumbs={["Meridian", "Billing", "RA Bills"]} desc="Running account bills with automatic previous/current/cumulative carry-forward, deduction engine and revision control.">
        <Stat label="Live bills" value={`${bills.filter((b) => !["Fully Paid"].includes(b.status)).length}`} />
        <Stat label="Awaiting certification" value={`${bills.filter((b) => ["Submitted to Client", "Under Client Certification"].includes(b.status)).length}`} tone="warn" />
        <Stat label="Billed this FY" value={money(bills.reduce((a, b) => a + b.gross, 0))} />
        <AddBtn label="New RA Bill" disabled={!canCreate} tip="No billing create permission" onClick={onCreate} />
      </PageHead>
      <Widget title="Bill register" subtitle="Certification posts receivables to the client ledger automatically · revisions never overwrite submitted bills">
        <FilterBar pageKey="rabills" q={q} onQ={setQ} filters={[{ key: "status", label: "Status", value: fStatus, options: STATUS, onChange: setFStatus }]} />
        <DataTable pageKey="ra-bills" rows={rows} cols={cols} onRow={onOpen} />
      </Widget>
    </div>
  );
}

/* ── bill detail drawer ──────────────────────────────────────── */
function BillDrawer({ bill, onClose, onCertify, onReceive, onPatch, canApprove, onRevise }: {
  bill: RABill | null; onClose: () => void; onCertify: (b: RABill, a: number) => void; onReceive: (b: RABill, a: number) => void;
  onPatch: (b: RABill, p: Partial<RABill>, a?: string) => void; canApprove: boolean; onRevise: (b: RABill) => void;
}) {
  const toast = useToast();
  const { user } = useERP();
  if (!bill) return null;
  const c = CONTRACTS.find((x) => x.id === bill.contractId)!;

  const printRA = () => printDocument({
    title: "Running Account Bill", docNo: bill.no, rev: String(bill.rev).padStart(2, "0"), date: bill.date, orientation: "landscape",
    project: `${c.code} — ${c.project}`, period: bill.period,
    code: `${bill.ref}-R${bill.rev}`,
    meta: [["Contract No.", c.no], ["Work Order", c.woNo], ["Client", c.client], ["Contractor", "Sahaa Infra Ltd."], ["Bill Type", bill.type], ["Billing Period", bill.period]],
    cols: [
      { label: "BOQ Item", align: "center" }, { label: "Description" }, { label: "Unit", align: "center" }, { label: "Contract Qty", align: "right" },
      { label: "Rate (₹)", align: "right" }, { label: "Previous Qty", align: "right" }, { label: "Current Qty", align: "right" },
      { label: "Cumulative Qty", align: "right" }, { label: "Balance Qty", align: "right" }, { label: "Current Amount (₹)", align: "right" }, { label: "Cumulative Amount (₹)", align: "right" },
    ],
    rows: bill.lines.map((l) => {
      const cum = l.prev + l.current;
      return [l.boqNo, l.desc, l.unit, l.contractQty.toLocaleString("en-IN"), l.rate.toLocaleString("en-IN"), l.prev.toLocaleString("en-IN"), l.current.toLocaleString("en-IN"),
        cum.toLocaleString("en-IN"), ((c.id && (BOQS[c.id]?.find((x) => x.boqNo === l.boqNo)?.revisedQty ?? l.contractQty)) - cum).toLocaleString("en-IN"),
        Math.round(l.current * l.rate).toLocaleString("en-IN"), Math.round(cum * l.rate).toLocaleString("en-IN")];
    }),
    totalsLabel: "Gross work done", totals: [null, null, null, null, null, null, null, null, Math.round(bill.gross * 1e7).toLocaleString("en-IN")],
    terms: bill.deductions.map((d) => `${d.name}: opening ${d.opening.toFixed(2)} + current ${d.current.toFixed(2)} = cumulative ${d.cumulative.toFixed(2)} Cr (balance ${d.balance.toFixed(2)} Cr)`),
    remarks: `Extras ${money(bill.extras)} · Escalation ${money(bill.escalation)} · Taxable ${money(bill.gstTaxable)} · CGST ${money(bill.cgst)} · SGST ${money(bill.sgst)} · Net payable ${money(bill.net)}. Amount in words: ${amountInWords(bill.net * 1e7)}.`,
    signatures: ["Prepared By", "Checked By", "Billing Engineer", "Project Manager", "Commercial Manager", "Accounts Manager", "Authorised Signatory", "Client Representative"],
    note: `Certified that the quantities and values claimed in this Running Account Bill have been checked against the relevant measurements (MB) and supporting records. · ${bill.ref} · Rev-${String(bill.rev).padStart(2, "0")}`,
    generatedBy: user.name,
  });

  const printAbstract = () => printDocument({
    title: "Bill Abstract", docNo: bill.no, rev: String(bill.rev).padStart(2, "0"), date: bill.date, project: `${c.code} — ${c.project}`, code: `${bill.ref}-ABS`,
    meta: [["Contract", c.no], ["Client", c.client], ["Period", bill.period]],
    cols: [{ label: "Particulars" }, { label: "Amount (₹ Cr)", align: "right" }],
    rows: [
      ["A. Original contract work (BOQ)", +(bill.gross - bill.extras - bill.escalation).toFixed(2)],
      ["B. Approved variations & extra items", bill.extras],
      ["F. Price escalation", bill.escalation],
      ["GROSS BILL VALUE", bill.gross],
      ...bill.deductions.map((d) => [`Less: ${d.name}`, -d.current]),
      ["Add: GST (CGST + SGST)", +(bill.cgst + bill.sgst).toFixed(2)],
    ],
    totalsLabel: "Net payable amount", totals: [bill.net.toFixed(2)],
    inWords: bill.net * 1e7,
    remarks: `GST details — Taxable value ${money(bill.gstTaxable)} · CGST @9% ${money(bill.cgst)} · SGST @9% ${money(bill.sgst)}.`,
    signatures: ["Billing Engineer", "Commercial Manager", "Accounts Manager", "Authorised Signatory"],
    generatedBy: user.name,
  });

  return (
    <Drawer wide open={!!bill} onClose={onClose} title={`RA Bill · ${bill.no}`} sub={`Rev-${String(bill.rev).padStart(2, "0")} · ${c.client} · ${bill.period} · ${bill.date}`}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Pill value={bill.status} pulse={["Under Client Certification", "Submitted for Checking"].includes(bill.status)} />
          <span className="num text-[11px] text-ink-400">{bill.ref} · verify code {bill.ref.replace(/\//g, "")}-R{bill.rev}</span>
          <span className="ml-auto flex gap-1.5">
            <Btn sm onClick={printRA}><IPrinter size={11} /> RA Bill</Btn>
            <Btn sm onClick={printAbstract}><IPrinter size={11} /> Abstract</Btn>
          </span>
        </div>

        {/* PCC table */}
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left min-w-[840px]">
            <thead><tr className="text-[9.5px] uppercase tracking-[0.08em] text-ink-400">
              <th className="font-bold pb-2 pr-3">BOQ Item</th><th className="font-bold pb-2 pr-3">Description</th><th className="font-bold pb-2 pr-3">Unit</th>
              <th className="font-bold pb-2 pr-3 text-right">Contract</th><th className="font-bold pb-2 pr-3 text-right">Rate</th>
              <th className="font-bold pb-2 pr-3 text-right">Previous</th><th className="font-bold pb-2 pr-3 text-right">Current</th>
              <th className="font-bold pb-2 pr-3 text-right">Cumulative</th><th className="font-bold pb-2 pr-3 text-right">Balance</th>
              <th className="font-bold pb-2 text-right">Current Amt (₹ Cr)</th>
            </tr></thead>
            <tbody>{bill.lines.map((l) => {
              const revised = BOQS[c.id]?.find((x) => x.boqNo === l.boqNo)?.revisedQty ?? l.contractQty;
              const cum = +(l.prev + l.current).toFixed(3);
              const bal = +(revised - cum).toFixed(3);
              const over = bal < 0;
              return (
                <tr key={l.boqNo} className={cx("border-t border-line/80", over && "bg-danger-100/30")}>
                  <td className="py-2.5 pr-3 num text-[11px] font-bold text-brand-700">{l.boqNo}</td>
                  <td className="py-2.5 pr-3 text-[12px] font-medium text-ink-900 max-w-[230px]">{l.desc}</td>
                  <td className="py-2.5 pr-3 text-[11px] text-ink-500">{l.unit}</td>
                  <td className="py-2.5 pr-3 text-right num text-[11.5px]">{l.contractQty.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 pr-3 text-right num text-[11.5px]">{l.rate.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 pr-3 text-right num text-[11.5px]">{l.prev.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 pr-3 text-right num text-[11.5px] font-bold text-brand-700">{l.current.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 pr-3 text-right num text-[11.5px] font-semibold">{cum.toLocaleString("en-IN")}</td>
                  <td className={cx("py-2.5 pr-3 text-right num text-[11.5px] font-bold", over ? "text-danger-600" : "text-ink-500")}>{bal.toLocaleString("en-IN")}{over && " ⚠"}</td>
                  <td className="py-2.5 text-right num text-[12px] font-semibold text-ink-900">{(l.current * l.rate / 1e7).toFixed(2)}</td>
                </tr>);
            })}
              <tr className="border-t-2 border-line-strong"><td colSpan={9} className="py-2.5 pr-3 text-right text-[10.5px] font-extrabold uppercase tracking-wide text-ink-500">Gross (incl. extras {bill.extras.toFixed(2)} + escalation {bill.escalation.toFixed(2)})</td>
                <td className="py-2.5 text-right num text-[14px] font-bold text-ink-900">{bill.gross.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* deduction engine */}
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Deduction engine · opening / current / cumulative / balance</p>
            <table className="w-full text-left">
              <thead><tr className="text-[9px] uppercase tracking-[0.08em] text-ink-400"><th className="font-bold pb-1.5 pr-2">Deduction</th><th className="font-bold pb-1.5 pr-2 text-right">Opening</th><th className="font-bold pb-1.5 pr-2 text-right">Current</th><th className="font-bold pb-1.5 pr-2 text-right">Cumulative</th><th className="font-bold pb-1.5 text-right">Balance</th></tr></thead>
              <tbody>{bill.deductions.map((d) => (
                <tr key={d.name} className="border-t border-line/70">
                  <td className="py-1.5 pr-2 text-[11px] text-ink-700">{d.name}</td>
                  <td className="py-1.5 pr-2 text-right num text-[11px] text-ink-400">{d.opening.toFixed(2)}</td>
                  <td className="py-1.5 pr-2 text-right num text-[11px] font-semibold text-danger-600">−{d.current.toFixed(2)}</td>
                  <td className="py-1.5 pr-2 text-right num text-[11px] font-semibold">{d.cumulative.toFixed(2)}</td>
                  <td className={cx("py-1.5 text-right num text-[11px]", d.balance < 0.01 && d.name.includes("advance") ? "text-ok-600 font-bold" : "text-ink-500")}>{d.balance.toFixed(2)}</td>
                </tr>))}
                <tr className="border-t-2 border-line-strong"><td className="py-1.5 pr-2 text-[10.5px] font-extrabold uppercase text-ink-500">Net after deductions + GST</td><td /><td /><td /><td className="py-1.5 text-right num text-[13px] font-bold text-ink-900">{bill.net.toFixed(2)}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="space-y-3">
            {/* checklist */}
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Submission checklist · {Object.values(bill.checklist).filter(Boolean).length}/{CHECKLIST.length}</p>
              <div className="grid grid-cols-1 gap-1">
                {CHECKLIST.map(([k, l]) => (
                  <label key={k} className={cx("flex items-center gap-2 text-[11.5px] px-2 py-1 rounded", bill.checklist[k] ? "text-ink-700" : "text-danger-600 bg-danger-100/30")}>
                    <span className={cx("h-3.5 w-3.5 rounded-sm border grid place-items-center shrink-0", bill.checklist[k] ? "bg-ok-500 border-ok-500 text-white" : "border-danger-500/50")}><ICheck size={9} /></span>{l}
                  </label>))}
              </div>
            </div>
            {/* returns */}
            {bill.returns.length > 0 && (
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Queries & returns</p>
                {bill.returns.map((r, i) => (
                  <div key={i} className="rounded-lg border border-amber-500/25 bg-amber-100/25 px-3 py-2.5 mb-2">
                    <p className="text-[11.5px] font-semibold text-amber-700">Returned {r.date} · {r.by}</p>
                    <p className="text-[11.5px] text-ink-700 mt-1">{r.reason}</p>
                    {r.response && <p className="text-[10.5px] text-ok-600 mt-1 font-semibold">↳ {r.response}</p>}
                  </div>))}
              </div>)}
          </div>
        </div>

        {/* timeline */}
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Audit trail</p>
          <ol className="space-y-1.5">{[...bill.history].reverse().map((h, i) => (
            <li key={i} className="flex items-center gap-2.5 text-[12px]"><span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" /><span className="text-ink-700 font-medium">{h.action}</span><span className="ml-auto num text-[10.5px] text-ink-300 shrink-0">{h.by} · {new Date(h.ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span></li>))}</ol>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-line">
          {canApprove && ["Submitted to Client", "Under Client Certification"].includes(bill.status) && <Btn kind="ok" onClick={() => onCertify(bill, bill.net)}><ICheck size={13} /> Record Client Certification</Btn>}
          {["Certified", "Partially Paid"].includes(bill.status) && <Btn kind="primary" onClick={() => onReceive(bill, bill.certifiedAmt ?? bill.net)}><IRupee size={13} /> Record Payment</Btn>}
          {["Certified", "Partially Paid", "Fully Paid"].includes(bill.status) && canApprove && <Btn onClick={() => onRevise(bill)}>Raise Revision</Btn>}
          {bill.status === "Submitted for Checking" && canApprove && <Btn kind="danger" onClick={() => { onPatch(bill, { status: "Returned", returns: [...bill.returns, { date: dStr(0), reason: "Internal query — reconcile previous bill quantities", by: user.name }] }, "Returned by internal checker"); toast("info", `${bill.no} returned for correction`); }}><IXCircle size={13} /> Return</Btn>}
        </div>
      </div>
    </Drawer>
  );
}

/* ── create bill engine ──────────────────────────────────────── */
function CreateBillDrawer({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (b: RABill, status: string) => void }) {
  const { user } = useERP();
  const toast = useToast();
  const [contractId, setContractId] = useState("c1");
  const [current, setCurrent] = useState<Record<string, number>>({});
  const [excessOk, setExcessOk] = useState<Record<string, boolean>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});

  const c = CONTRACTS.find((x) => x.id === contractId)!;
  const boq = BOQS[contractId] ?? [];
  const cur = (b: string) => current[b] ?? 0;

  const lines = boq.filter((l) => cur(l.boqNo) > 0);
  const boqAmt = lines.reduce((a, l) => a + cur(l.boqNo) * l.rate, 0) / 1e7;
  const gross = +boqAmt.toFixed(2);
  const ded = (pct: number, cap: number, opening: number) => {
    const raw = gross * (pct / 100);
    const cur2 = Math.max(0, Math.min(raw, cap - opening));
    return { current: +cur2.toFixed(2), cumulative: +(opening + cur2).toFixed(2), balance: +Math.max(0, cap - opening - cur2).toFixed(2) };
  };
  const ret = ded(c.retention, c.revised * (c.retention / 100), 3.1);
  const sd = ded(c.sd, c.revised * (c.sd / 100), 1.9);
  const mob = ded(10, c.mobAdv, c.mobAdv > 0 ? c.mobAdv * 0.8 : 0);
  const tds = { current: +(gross * c.tds / 100).toFixed(2), cumulative: +(1.4 + gross * c.tds / 100).toFixed(2), balance: 0 };
  const cess = { current: +(gross * c.cess / 100).toFixed(2), cumulative: +(0.7 + gross * c.cess / 100).toFixed(2), balance: 0 };
  const deductions: DeductRow[] = [
    { name: `Retention @ ${c.retention}%`, opening: 3.1, ...ret },
    { name: `Security deposit @ ${c.sd}%`, opening: 1.9, ...sd },
    ...(c.mobAdv ? [{ name: "Mobilisation advance recovery", opening: +(c.mobAdv * 0.8).toFixed(2), ...mob }] : []),
    { name: `TDS @ ${c.tds}%`, opening: 1.4, ...tds },
    { name: `Labour cess @ ${c.cess}%`, opening: 0.7, ...cess },
  ];
  const dedTotal = deductions.reduce((a, d) => a + d.current, 0);
  const taxable = +(gross - deductions.filter((d) => d.name.startsWith("Retention") || d.name.startsWith("Security") || d.name.startsWith("Mobilisation")).reduce((a, d) => a + d.current, 0)).toFixed(2);
  const cgst = +(taxable * 0.09).toFixed(2);
  const sgst = +(taxable * 0.09).toFixed(2);
  const net = +(gross - dedTotal + cgst + sgst).toFixed(2);

  const warnings = lines.flatMap((l) => {
    const bal = l.revisedQty - l.prevQty - cur(l.boqNo);
    const w: string[] = [];
    if (bal < 0) w.push(`${l.boqNo} — cumulative exceeds revised BOQ by ${Math.abs(bal).toLocaleString("en-IN")} ${l.unit} (management approval ${excessOk[l.boqNo] ? "✓ marked" : "required"})`);
    if (l.rate === 0) w.push(`${l.boqNo} — missing rate`);
    return w;
  });
  const blocked = lines.some((l) => l.revisedQty - l.prevQty - cur(l.boqNo) < 0 && !excessOk[l.boqNo]);
  const checklistReady = CHECKLIST.every(([k]) => checks[k]);
  const nextNo = `RA-${String(2 + CONTRACTS.filter((x) => x.id === contractId).length).padStart(2, "0")}/${c.code}/2025-26`;

  const build = (): RABill => ({
    id: "b" + Date.now(), no: nextNo, ref: `SAHAA/RA/${c.code}/${String(Math.floor(10 + Math.random() * 80))}`, rev: 0, contractId, period: "01 Feb – 28 Feb 2026", date: dStr(0), type: "RA Bill",
    lines: lines.map((l) => ({ boqNo: l.boqNo, desc: l.desc, unit: l.unit, contractQty: l.contractQty, rate: l.rate, prev: l.prevQty, current: cur(l.boqNo) })),
    extras: 0, escalation: 0, deductions, gross, gstTaxable: taxable, cgst, sgst, net, status: "Draft",
    returns: [], checklist: { ...checks }, history: [{ ts: Date.now(), action: "Bill drafted by creation engine", by: user.name }],
  });

  return (
    <Drawer wide open={open} onClose={onClose} title="New RA Bill — creation engine" sub={`Auto number series ${nextNo} · previous quantities carried from certified bills`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Contract / project">
            <div className="relative"><select className={selectCls} value={contractId} onChange={(e) => { setContractId(e.target.value); setCurrent({}); setExcessOk({}); setChecks({}); }}>
              {CONTRACTS.map((x) => <option key={x.id} value={x.id}>{x.code} — {x.project}</option>)}</select>
              <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
          </Field>
          <Field label="Bill type">
            <div className="relative"><select className={selectCls}><option>RA Bill</option><option>Interim Bill</option><option>Supplementary Bill</option><option>Final Bill</option></select>
              <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
          </Field>
        </div>

        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">BOQ — enter current period quantities (quantity control live)</p>
          <div className="space-y-1.5">
            {boq.map((l) => {
              const bal = l.revisedQty - l.prevQty - cur(l.boqNo);
              const over = bal < 0;
              return (
                <div key={l.boqNo} className={cx("grid grid-cols-[64px_1fr_repeat(5,90px)] items-center gap-2 rounded-lg border px-3 py-2", over ? "border-danger-500/40 bg-danger-100/25" : "border-line bg-canvas/40")}>
                  <span className="num text-[11px] font-bold text-brand-700">{l.boqNo}</span>
                  <span className="text-[12px] font-medium text-ink-900 truncate">{l.desc} <span className="text-ink-300 text-[10.5px]">· {l.unit}</span></span>
                  <span className="text-right num text-[11px] text-ink-400" title="Revised BOQ qty">{l.revisedQty.toLocaleString("en-IN")}</span>
                  <span className="text-right num text-[11px] text-ink-400" title="Previous cumulative">{l.prevQty.toLocaleString("en-IN")}</span>
                  <input type="number" min={0} placeholder="0" value={cur(l.boqNo) || ""} onChange={(e) => setCurrent((m) => ({ ...m, [l.boqNo]: parseFloat(e.target.value) || 0 }))}
                    className={cx(inputCls, "h-7 text-[11.5px] text-right")} />
                  <span className={cx("text-right num text-[11px] font-semibold", over ? "text-danger-600" : "text-ink-500")} title="Balance after this bill">{bal.toLocaleString("en-IN")}</span>
                  <span className="text-right num text-[11.5px] font-bold text-ink-900">{(cur(l.boqNo) * l.rate / 1e7).toFixed(2)}</span>
                  {over && (
                    <label className="col-span-7 flex items-center gap-2 text-[10.5px] font-semibold text-danger-600 pt-1">
                      <input type="checkbox" className="h-3.5 w-3.5 accent-[#d05252]" checked={!!excessOk[l.boqNo]} onChange={(e) => setExcessOk((m) => ({ ...m, [l.boqNo]: e.target.checked }))} />
                      Quantity deviation — management approval obtained (recorded in audit trail)
                    </label>)}
                </div>);
            })}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[10px] text-ink-300">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-line" /> Columns: BOQ · Revised · Previous · Current · Balance · Amount (₹ Cr)</span>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="rounded-lg border border-danger-500/30 bg-danger-100/25 px-3.5 py-3">
            <p className="text-[10.5px] font-extrabold uppercase tracking-wide text-danger-600 mb-1.5 flex items-center gap-1.5"><IAlert size={12} /> Quantity control</p>
            <ul className="space-y-1">{warnings.map((w) => <li key={w} className="text-[11.5px] text-ink-700">• {w}</li>)}</ul>
          </div>)}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Abstract & deductions (auto)</p>
            <div className="rounded-lg border border-line p-3.5 space-y-1 bg-canvas/40">
              {[["A. Original contract work", boqAmt], ["Gross bill value", gross]].map(([k, v]) => (
                <div key={k as string} className="flex justify-between text-[11.5px]"><span className="text-ink-500">{k}</span><span className={cx("num font-semibold", k === "Gross bill value" ? "text-ink-900 font-bold" : "text-ink-700")}>{(v as number).toFixed(2)}</span></div>))}
              {deductions.map((d) => (
                <div key={d.name} className="flex justify-between text-[11.5px]"><span className="text-ink-500">Less: {d.name}</span><span className="num font-semibold text-danger-600">−{d.current.toFixed(2)}</span></div>))}
              <div className="flex justify-between text-[11.5px]"><span className="text-ink-500">Add: CGST + SGST @18%</span><span className="num font-semibold text-ink-700">+{(cgst + sgst).toFixed(2)}</span></div>
              <div className="flex justify-between items-center pt-2 mt-1 border-t border-line"><span className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">Net payable</span><span className="num text-[18px] font-bold text-ink-900">{money(net)}</span></div>
            </div>
          </div>
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Submission checklist · {Object.values(checks).filter(Boolean).length}/{CHECKLIST.length}</p>
            <div className="grid grid-cols-1 gap-1">
              {CHECKLIST.map(([k, l]) => (
                <label key={k} className="flex items-center gap-2 text-[11.5px] text-ink-700 px-2 py-1 rounded hover:bg-canvas cursor-pointer transition-colors">
                  <input type="checkbox" className="h-3.5 w-3.5 accent-[#0c7264]" checked={!!checks[k]} onChange={(e) => setChecks((m) => ({ ...m, [k]: e.target.checked }))} />{l}
                </label>))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-line">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn disabled={!lines.length} onClick={() => onSave(build(), "Draft")}>Save as Draft</Btn>
          <Btn kind="primary" disabled={!lines.length || blocked || !checklistReady} onClick={() => onSave({ ...build(), status: "Submitted for Checking" }, "Submitted for Checking")}>
            <IStamp size={13} /> Submit for Checking
          </Btn>
        </div>
        {!checklistReady && <p className="text-[10.5px] text-amber-600 text-right -mt-1">Complete the full checklist to enable submission — only authorised users may mark a bill ready.</p>}
      </div>
    </Drawer>
  );
}

/* ── measurement book ────────────────────────────────────────── */
function MBTab({ mbs, setMbs }: { mbs: MBEntry[]; setMbs: React.Dispatch<React.SetStateAction<MBEntry[]>> }) {
  const { log, notify, user } = useERP();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [adding, setAdding] = useState(false);
  const [f, setF] = useState({ project: "P1", boqNo: "2.4", desc: "", location: "", drawing: "", nos: 1, l: 0, b: 0, h: 0 });
  const qty = +(f.nos * f.l * f.b * f.h).toFixed(2);

  const rows = mbs.filter((m) => (!fStatus || m.status === fStatus) && (m.id + m.desc + m.project + m.boqNo).toLowerCase().includes(q.toLowerCase()));
  const cols: Col[] = [
    { key: "id", label: "MB / Page", sort: (m) => m.id, render: (m) => <div><p className="num text-[12px] font-bold text-brand-700">{m.id}</p><p className="text-[10px] text-ink-400 num">Page {m.page} · {m.date}</p></div> },
    { key: "project", label: "Project / Location", render: (m) => <div><p className="text-[12.5px] font-semibold text-ink-900">{m.project} · {m.boqNo}</p><p className="text-[10.5px] text-ink-400">{m.location}</p></div> },
    { key: "desc", label: "Description", render: (m) => <div><p className="text-[12px] text-ink-700">{m.desc}</p><p className="text-[10px] text-ink-300 num">Drg {m.drawing} · by {m.by}</p></div> },
    { key: "dims", label: "Nos × L × B × H/D", render: (m) => <span className="num text-[11px] text-ink-500">{m.nos} × {m.l} × {m.b} × {m.h}</span> },
    { key: "qty", label: "Quantity", align: "right", sort: (m) => m.qty, render: (m) => <span className="num text-[12.5px] font-bold text-ink-900">{m.qty.toLocaleString("en-IN")}</span> },
    { key: "status", label: "Workflow", render: (m) => (
      <span className="flex items-center gap-1">
        <Pill value={m.status} pulse={m.status === "Submitted"} />
        {m.status === "Submitted" && <Btn sm kind="ok" onClick={(e: any) => { e.stopPropagation(); setMbs((ms) => ms.map((x) => x.id === m.id ? { ...x, status: "Checked" } : x)); log("Billing", "MB Checked", m.id, `${m.qty} · ${m.project}`); toast("success", `${m.id} checked — forwarded to commercial`); }}><ICheck size={10} /></Btn>}
        {m.status === "Checked" && <Btn sm kind="primary" onClick={(e: any) => { e.stopPropagation(); setMbs((ms) => ms.map((x) => x.id === m.id ? { ...x, status: "Certified" } : x)); log("Billing", "MB Certified", m.id, `${m.qty} eligible for billing`); notify("approval", `${m.id} certified — quantity available for next RA bill`); toast("success", `${m.id} certified`); }}><ICheck size={10} /> Certify</Btn>}
      </span>) },
    { key: "act", label: "", render: (m: MBEntry) => (
      <Btn sm onClick={(e: any) => { e.stopPropagation(); printDocument({
        title: "Measurement Sheet", docNo: m.id, date: m.date, project: `${m.project} — ${m.desc}`, code: m.id,
        meta: [["Contract", CONTRACTS.find((c) => c.code === m.project)?.no ?? "—"], ["Drawing Ref", m.drawing], ["Location", m.location], ["BOQ Item", m.boqNo]],
        cols: [{ label: "Particular" }, { label: "Nos", align: "right" }, { label: "Length", align: "right" }, { label: "Breadth", align: "right" }, { label: "Height/Depth", align: "right" }, { label: "Calculation", align: "right" }, { label: "Quantity", align: "right" }],
        rows: [[m.desc, m.nos, m.l, m.b, m.h, `${m.nos} × ${m.l} × ${m.b} × ${m.h}`, m.qty]],
        totalsLabel: "Total measured quantity", totals: [m.qty],
        signatures: ["Measured By", "Checked By", "Verified By", "Client Representative"],
        note: "Measurement recorded as per drawing reference; supports RA bill quantities only after certification.",
        generatedBy: user.name,
      }); }}><IPrinter size={11} /></Btn>) },
  ];

  return (
    <div>
      <PageHead title="Measurement Book (MB)" crumbs={["Meridian", "Billing", "Measurement Book"]} desc="Digital measurement sheets — Nos × L × B × H/D auto-quantity, drawing references and a four-stage certification workflow.">
        <Stat label="MB entries" value={`${mbs.length}`} />
        <Stat label="Awaiting check" value={`${mbs.filter((m) => m.status === "Submitted").length}`} tone="warn" />
        <Stat label="Certified" value={`${mbs.filter((m) => m.status === "Certified").length}`} tone="ok" />
        <AddBtn label="New Measurement" onClick={() => setAdding(true)} />
      </PageHead>
      <Widget title="Measurement register" subtitle="Site Engineer → Project Engineer → PM → Billing/Commercial → Client certification">
        <FilterBar pageKey="mb" q={q} onQ={setQ} filters={[{ key: "status", label: "Status", value: fStatus, options: ["Submitted", "Checked", "Certified", "Returned"], onChange: setFStatus }]} />
        <DataTable pageKey="measurement-book" rows={rows} cols={cols} />
      </Widget>
      <Drawer open={adding} onClose={() => setAdding(false)} title="New digital measurement" sub="Quantity = Nos × Length × Breadth × Height/Depth (formula configurable per unit)">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Project"><div className="relative"><select className={selectCls} value={f.project} onChange={(e) => setF({ ...f, project: e.target.value })}>{CONTRACTS.map((c) => <option key={c.code} value={c.code}>{c.code} — {c.project.slice(0, 24)}</option>)}</select><IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div></Field>
            <Field label="BOQ item"><input className={inputCls} value={f.boqNo} onChange={(e) => setF({ ...f, boqNo: e.target.value })} placeholder="e.g. 2.4" /></Field>
            <Field label="Location / grid / chainage"><input className={inputCls} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} placeholder="Ch. 3+200 – 3+850" /></Field>
            <Field label="Drawing reference"><input className={inputCls} value={f.drawing} onChange={(e) => setF({ ...f, drawing: e.target.value })} placeholder="GAD-14 Rev C" /></Field>
          </div>
          <Field label="Description of work"><input className={inputCls} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} placeholder="RCC M30 in deck slab…" /></Field>
          <div className="grid grid-cols-4 gap-3">
            {(["nos", "l", "b", "h"] as const).map((k) => (
              <Field key={k} label={k === "nos" ? "Nos" : k === "l" ? "Length (m)" : k === "b" ? "Breadth (m)" : "Height/Depth (m)"}>
                <input type="number" className={inputCls} value={f[k] || ""} onChange={(e) => setF({ ...f, [k]: parseFloat(e.target.value) || 0 })} />
              </Field>))}
          </div>
          <div className="rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-3 flex items-center justify-between fade-up">
            <span className="text-[10.5px] font-bold uppercase tracking-wide text-brand-700">Computed quantity (m³)</span>
            <span className="num text-[20px] font-bold text-ink-900">{qty.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-end gap-2">
            <Btn onClick={() => setAdding(false)}>Cancel</Btn>
            <Btn kind="primary" disabled={!f.desc || qty <= 0} onClick={() => {
              const id = "MB-" + String(153 + mbs.length);
              setMbs((ms) => [{ id, page: String(7 + mbs.length).padStart(2, "0") + "/04", date: dStr(0), project: f.project, location: f.location, boqNo: f.boqNo, desc: f.desc, drawing: f.drawing, nos: f.nos, l: f.l, b: f.b, h: f.h, qty, status: "Submitted", by: user.name }, ...ms]);
              log("Billing", "Measurement Recorded", id, `${qty} m³ · ${f.project} · ${f.boqNo}`);
              notify("approval", `${id} submitted for checking (${qty.toLocaleString("en-IN")} m³)`);
              toast("success", `${id} recorded — sent to checking workflow`);
              setAdding(false); setF({ project: "P1", boqNo: "2.4", desc: "", location: "", drawing: "", nos: 1, l: 0, b: 0, h: 0 });
            }}><ICalCheck size={13} /> Record Measurement</Btn>
          </div>
        </div>
      </Drawer>
    </div>
  );
}

/* ── extras, variations, escalation ──────────────────────────── */
function ExtrasTab() {
  const [varLimit, setVarLimit] = useState(10);
  const extras = [
    { no: "EI-018/P1", desc: "Additional pile head chipping at pier 9", unit: "Cu.M", qty: 86, rate: 1850, amount: 15.9, status: "Client Approved", appr: "12 Jan 2026" },
    { no: "EI-019/P1", desc: "Temporary traffic diversions (extra shifts)", unit: "LS", qty: 1, rate: 6800000, amount: 68.0, status: "Under Client Review", appr: "—" },
    { no: "EI-007/P4", desc: "Additional epoxy floor — Block D", unit: "Sqm", qty: 2400, rate: 465, amount: 11.2, status: "Internal Approved", appr: "28 Jan 2026" },
  ];
  const vars = [
    { no: "VO-005/P1", desc: "Deck width revision at ramp 2", origQty: 12400, revQty: 12820, unit: "Cu.M", rate: 7850 },
    { no: "VO-002/P4", desc: "Roofing scope addition — mezzanine", origQty: 48000, revQty: 48000, unit: "Sqm", rate: 385 },
    { no: "VO-003/P7", desc: "Intake well depth revision", origQty: 68000, revQty: 69400, unit: "Cu.M", rate: 340 },
  ];
  const esc = [
    { comp: "Steel", base: 61200, current: 63800, weight: 38 }, { comp: "Cement", base: 395, current: 402, weight: 22 },
    { comp: "Labour", base: 620, current: 648, weight: 25 }, { comp: "Diesel", base: 94.2, current: 97.6, weight: 15 },
  ];
  return (
    <div>
      <PageHead title="Extra Items, Variations & Escalation" crumbs={["Meridian", "Billing", "Extras & Variations"]} desc="Unapproved extra items are blocked from certified billing; variations beyond the limit flag management review; escalation computed from contract weightages.">
        <Stat label="Extra items" value={`${extras.length}`} />
        <Stat label="Variation orders" value={`${vars.length}`} />
        <Stat label="Escalation claimed" value="₹0.86 Cr" tone="ok" />
      </PageHead>
      <div className="grid lg:grid-cols-2 gap-4">
        <Widget title="Extra item register" subtitle="Proposal → rate analysis → internal → client approval → billing">
          <div className="space-y-2">
            {extras.map((e) => (
              <div key={e.no} className="flex items-center gap-3 rounded-lg border border-line px-3.5 py-3 hover:border-line-strong transition-all">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ink-900">{e.no} · {e.desc}</p>
                  <p className="text-[10.5px] text-ink-400 num mt-0.5">{e.qty.toLocaleString("en-IN")} {e.unit} @ ₹{e.rate.toLocaleString("en-IN")} · client approval {e.appr}</p>
                </div>
                <span className="num text-[13px] font-bold text-ink-900 shrink-0">₹{(e.amount / 100).toFixed(2)} L</span>
                <Pill value={e.status === "Client Approved" ? "Completed" : e.status === "Under Client Review" ? "Submitted" : "Pending"} pulse={e.status === "Under Client Review"} />
              </div>))}
          </div>
        </Widget>
        <Widget title="Variation orders" subtitle={`Alert limit ±${varLimit}% — configurable`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] font-semibold text-ink-400">Variation alert threshold</span>
            <input type="range" min={5} max={25} value={varLimit} onChange={(e) => setVarLimit(+e.target.value)} className="flex-1 accent-[#0c7264]" />
            <span className="num text-[12px] font-bold text-brand-700 w-10 text-right">±{varLimit}%</span>
          </div>
          <div className="space-y-2">
            {vars.map((v) => {
              const pct = +(((v.revQty - v.origQty) / v.origQty) * 100).toFixed(1);
              const alert = Math.abs(pct) > varLimit;
              const diff = (v.revQty - v.origQty) * v.rate / 1e7;
              return (
                <div key={v.no} className={cx("rounded-lg border px-3.5 py-3 transition-all", alert ? "border-amber-500/40 bg-amber-100/25" : "border-line")}>
                  <div className="flex items-center gap-2">
                    <p className="text-[12.5px] font-semibold text-ink-900 min-w-0 flex-1 truncate">{v.no} · {v.desc}</p>
                    <span className={cx("num text-[11px] font-bold px-1.5 py-0.5 rounded", alert ? "bg-amber-100 text-amber-600" : "bg-ok-100 text-ok-600")}>{pct > 0 ? "+" : ""}{pct}%</span>
                  </div>
                  <p className="text-[10.5px] text-ink-400 num mt-1">{v.origQty.toLocaleString("en-IN")} → {v.revQty.toLocaleString("en-IN")} {v.unit} · value impact {diff >= 0 ? "+" : ""}₹{diff.toFixed(2)} Cr</p>
                  {alert && <p className="text-[10px] font-bold text-amber-600 mt-1 flex items-center gap-1"><IAlert size={10} /> Exceeds threshold — management approval recorded before billing</p>}
                </div>);
            })}
          </div>
        </Widget>
        <Widget title="Price escalation — index method" subtitle="Eligible amount × weightage × factor · history maintained per contract clause">
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-left min-w-[560px]">
              <thead><tr className="text-[9.5px] uppercase tracking-[0.08em] text-ink-400"><th className="font-bold pb-2 pr-3">Component</th><th className="font-bold pb-2 pr-3 text-right">Base Index</th><th className="font-bold pb-2 pr-3 text-right">Current Index</th><th className="font-bold pb-2 pr-3 text-right">Weightage</th><th className="font-bold pb-2 pr-3 text-right">Factor</th><th className="font-bold pb-2 text-right">Eligible (₹ Cr)</th></tr></thead>
              <tbody>{esc.map((e) => {
                const factor = e.current / e.base;
                const eligible = 12.4 * (e.weight / 100) * (factor - 1);
                return (
                  <tr key={e.comp} className="border-t border-line/80">
                    <td className="py-2.5 pr-3 text-[12.5px] font-semibold text-ink-900">{e.comp}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px]">{e.base.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px]">{e.current.toLocaleString("en-IN")}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px]">{e.weight}%</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold text-amber-600">{factor.toFixed(4)}</td>
                    <td className="py-2.5 text-right num text-[12.5px] font-bold text-ink-900">{eligible.toFixed(3)}</td>
                  </tr>);
              })}
                <tr className="border-t-2 border-line-strong"><td colSpan={5} className="py-2 pr-3 text-right text-[10.5px] font-extrabold uppercase text-ink-500">Escalation claimable</td><td className="py-2 text-right num text-[13px] font-bold text-ink-900">₹{(esc.reduce((a, e) => a + 12.4 * (e.weight / 100) * (e.current / e.base - 1), 0)).toFixed(3)} Cr</td></tr>
              </tbody>
            </table>
          </div>
        </Widget>
        <Widget title="Advance & retention registers" subtitle="Recoveries auto-flow into every RA bill">
          <div className="space-y-3">
            {CONTRACTS.filter((c) => c.mobAdv > 0).map((c) => {
              const rec = c.mobAdv * 0.8;
              return (
                <div key={c.id} className="rounded-lg border border-line px-3.5 py-3">
                  <div className="flex justify-between text-[11.5px]"><span className="font-semibold text-ink-700">{c.code} · Mobilisation advance</span><span className="num text-ink-500">{money(rec)} / {money(c.mobAdv)}</span></div>
                  <div className="h-[6px] rounded-full bg-line overflow-hidden mt-1.5"><div className="h-full bg-brand-600 rounded-full" style={{ width: "80%" }} /></div>
                  <p className="text-[10px] text-ink-400 mt-1 num">Recovery 10% per bill · balance {money(+(c.mobAdv - rec).toFixed(2))} {c.matAdv > 0 ? `· material advance ${money(c.matAdv)} recovering @3%` : ""}</p>
                </div>);
            })}
          </div>
        </Widget>
      </div>
    </div>
  );
}

/* ── advances & retention ────────────────────────────────────── */
function AdvancesTab({ bills }: { bills: RABill[] }) {
  const ret = bills.reduce((a, b) => a + (b.deductions.find((d) => d.name.startsWith("Retention"))?.cumulative ?? 0), 0) + 9.4;
  const releases = [
    { contract: "P4", amount: 1.86, event: "DLP half-term release", date: "Sep 2026", status: "Scheduled" },
    { contract: "P1", amount: 4.75, event: "DLP completion — defect clearance", date: "Nov 2027", status: "Tracked" },
  ];
  return (
    <div>
      <PageHead title="Advances & Retention" crumbs={["Meridian", "Billing", "Advances & Retention"]} desc="Mobilisation and material advance recovery with per-bill automation, plus retention held against DLP with release tracking.">
        <Stat label="Retention held" value={money(ret)} />
        <Stat label="Advance outstanding" value={money(3.09)} tone="warn" />
        <Stat label="Releases scheduled" value={`${releases.length}`} />
      </PageHead>
      <div className="grid lg:grid-cols-2 gap-4">
        <Widget title="Retention register" subtitle="Cumulative retention per contract · capped at contract %">
          <ul className="space-y-3">
            {CONTRACTS.map((c) => {
              const held = bills.filter((b) => b.contractId === c.id).reduce((a, b) => a + (b.deductions.find((d) => d.name.startsWith("Retention"))?.cumulative ?? 0), 0) + c.revised * 0.02;
              const cap = c.revised * (c.retention / 100);
              return (
                <li key={c.id}>
                  <div className="flex justify-between text-[11.5px] mb-1"><span className="font-semibold text-ink-700">{c.code} · {c.client}</span><span className="num text-ink-500">{money(held)} <span className="text-ink-300">/ cap {money(cap)}</span></span></div>
                  <div className="h-[7px] rounded-full bg-line overflow-hidden"><div className="h-full bg-amber-500/85 rounded-full" style={{ width: `${Math.min(100, (held / cap) * 100)}%` }} /></div>
                </li>);
            })}
          </ul>
        </Widget>
        <Widget title="Retention release tracking" subtitle="Releases only after DLP & defect-liability clearance">
          <div className="space-y-2">
            {releases.map((r) => (
              <div key={r.contract + r.date} className="flex items-center gap-3 rounded-lg border border-line px-3.5 py-3">
                <span className="h-8 w-8 rounded-lg grid place-items-center bg-brand-50 text-brand-700 border border-brand-100 shrink-0"><IRupee size={14} /></span>
                <div className="min-w-0 flex-1"><p className="text-[12.5px] font-semibold text-ink-900">{r.contract} · {money(r.amount)}</p><p className="text-[10.5px] text-ink-400 mt-0.5">{r.event} · {r.date}</p></div>
                <Pill value={r.status === "Scheduled" ? "Submitted" : "On Track"} />
              </div>))}
            <p className="text-[10.5px] text-ink-300 pt-1">Security deposit register runs in parallel — released with final bill closure after reconciliation of all recoveries.</p>
          </div>
        </Widget>
        <Widget title="Advance recovery statement" subtitle="Opening → current recovery → balance">
          <table className="w-full text-left">
            <thead><tr className="text-[9.5px] uppercase tracking-[0.08em] text-ink-400"><th className="font-bold pb-2 pr-3">Contract</th><th className="font-bold pb-2 pr-3 text-right">Sanctioned</th><th className="font-bold pb-2 pr-3 text-right">Recovered</th><th className="font-bold pb-2 pr-3 text-right">This bill</th><th className="font-bold pb-2 text-right">Balance</th></tr></thead>
            <tbody>{CONTRACTS.filter((c) => c.mobAdv > 0).map((c) => {
              const rec = c.mobAdv * 0.8; const cur = bills.filter((b) => b.contractId === c.id).reduce((a, b) => a + (b.deductions.find((d) => d.name.startsWith("Mobilisation"))?.current ?? 0), 0);
              return (
                <tr key={c.id} className="border-t border-line/80">
                  <td className="py-2.5 pr-3 text-[12px] font-semibold text-ink-900">{c.code} · {c.client}</td>
                  <td className="py-2.5 pr-3 text-right num text-[12px]">{c.mobAdv.toFixed(2)}</td>
                  <td className="py-2.5 pr-3 text-right num text-[12px] text-ok-600 font-semibold">{rec.toFixed(2)}</td>
                  <td className="py-2.5 pr-3 text-right num text-[12px] text-danger-600">{cur.toFixed(2)}</td>
                  <td className="py-2.5 text-right num text-[12.5px] font-bold text-ink-900">{(c.mobAdv - rec).toFixed(2)}</td>
                </tr>);
            })}</tbody>
          </table>
        </Widget>
        <Widget title="Final bill closure gate" subtitle="All checks must clear before contract closure">
          <ul className="grid grid-cols-1 gap-1.5">
            {["BOQ quantities reconciled", "Variations closed", "Extra items settled", "Advances fully recovered", "Retention & SD reconciled", "Client payments reconciled", "Material reconciliation done", "Subcontractor accounts settled"].map((c, i) => (
              <li key={c} className={cx("flex items-center gap-2 text-[11.5px] px-2 py-1 rounded", i < 5 ? "text-ink-700" : "text-amber-600 bg-amber-100/25")}>
                <span className={cx("h-3.5 w-3.5 rounded-sm border grid place-items-center", i < 5 ? "bg-ok-500 border-ok-500 text-white" : "border-amber-500/50")}><ICheck size={9} /></span>{c}
              </li>))}
          </ul>
          <p className="text-[10.5px] text-ink-300 mt-2">Final bill → client certification → final payment → retention release → contract closure. Closure is locked until every gate clears.</p>
        </Widget>
      </div>
    </div>
  );
}

/* ── certification tracker ───────────────────────────────────── */
function CertTab({ bills, onOpen }: { bills: RABill[]; onOpen: (b: RABill) => void }) {
  const rows = bills.filter((b) => b.submitted || ["Certified", "Partially Paid", "Fully Paid", "Under Client Certification", "Submitted to Client"].includes(b.status));
  const cols: Col[] = [
    { key: "no", label: "Bill", render: (b) => <span className="num text-[12px] font-bold text-brand-700">{b.no}</span> },
    { key: "client", label: "Client", render: (b) => <span className="text-[12px] text-ink-700">{CONTRACTS.find((c) => c.id === b.contractId)!.client}</span> },
    { key: "submitted", label: "Submitted", render: (b) => <span className="num text-[11.5px] text-ink-500">{b.submitted ?? "—"}</span> },
    { key: "net", label: "Submitted ₹ Cr", align: "right", sort: (b) => b.net, render: (b) => <span className="num text-[12px] font-semibold">{b.net.toFixed(2)}</span> },
    { key: "certified", label: "Certified ₹ Cr", align: "right", sort: (b) => b.certifiedAmt ?? 0, render: (b) => <span className="num text-[12px] font-semibold text-ok-600">{b.certifiedAmt ? b.certifiedAmt.toFixed(2) : "—"}</span> },
    { key: "gap", label: "Cert. delay", align: "center", render: (b) => {
      if (b.certified || !b.submitted) return <span className="text-[11px] text-ink-300">—</span>;
      const days = Math.floor((Date.now() - new Date(b.date).getTime()) / 864e5);
      return <span className={cx("num text-[11px] font-bold px-1.5 py-0.5 rounded", days > 20 ? "bg-danger-100 text-danger-600" : "bg-amber-100 text-amber-600")}>{days} d</span>;
    } },
    { key: "due", label: "Payment due", render: (b) => <span className="num text-[11.5px] text-ink-500">{b.due ?? "—"}</span> },
    { key: "received", label: "Received ₹ Cr", align: "right", sort: (b) => b.receivedAmt ?? 0, render: (b) => <span className={cx("num text-[12px] font-semibold", b.receivedAmt ? "text-ok-600" : "text-ink-300")}>{b.receivedAmt ? b.receivedAmt.toFixed(2) : "—"}</span> },
    { key: "status", label: "Status", render: (b) => <Pill value={b.status} /> },
  ];
  return (
    <div>
      <PageHead title="Client Certification Tracker" crumbs={["Meridian", "Billing", "Certification"]} desc="Submitted vs certified vs received — with certification delay, payment due dates and ageing at every stage.">
        <Stat label="In certification" value={`${bills.filter((b) => b.status === "Under Client Certification").length}`} tone="warn" />
        <Stat label="Certified unpaid" value={`${bills.filter((b) => ["Certified", "Partially Paid"].includes(b.status)).length}`} />
        <Stat label="Avg cert. days" value="12.4" tone="ok" />
      </PageHead>
      <Widget title="Certification & payment register" subtitle="Certification auto-posts the receivable; payment receipts settle the client ledger">
        <FilterBar pageKey="cert" q={""} onQ={() => { }} filters={[]} />
        <DataTable pageKey="certification" rows={rows} cols={cols} onRow={onOpen} />
      </Widget>
    </div>
  );
}

/* ── forecast & ageing ───────────────────────────────────────── */
function ForecastTab() {
  const months = [["Mar", 15.2, 14.1, 12.8], ["Apr", 16.8, 15.6, 13.9], ["May", 14.6, 13.8, 12.2], ["Jun", 18.4, 17.0, 15.1], ["Jul", 19.2, 17.9, 16.0], ["Aug", 12.4, 11.6, 10.3]] as const;
  const max = Math.max(...months.map((m) => m[1]));
  const buckets = [["0–30", 8.4, 5.2, 21.4], ["31–60", 6.1, 3.8, 12.9], ["61–90", 4.2, 2.1, 8.6], ["91–180", 2.8, 1.4, 6.2], ["181–365", 1.6, 0.8, 4.1], ["365+", 0.9, 0.4, 2.8]] as const;
  return (
    <div>
      <PageHead title="Billing Forecast & Ageing" crumbs={["Meridian", "Billing", "Forecast"]} desc="Expected billing, certification and collection from remaining BOQ and planned progress — with receivable and retention ageing.">
        <Stat label="Forecast H2" value="₹96.6 Cr" />
        <Stat label="Expected collection" value="₹80.3 Cr" tone="ok" />
        <Stat label="Retention ageing 180d+" value="₹4.9 Cr" tone="warn" />
      </PageHead>
      <div className="grid lg:grid-cols-2 gap-4">
        <Widget title="6-month billing forecast" subtitle="From remaining BOQ, planned progress & historical certification ratios">
          <div className="flex items-end gap-3 h-[190px] px-1">
            {months.map(([m, bill, cert, coll]) => (
              <div key={m} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-[3px] h-full">
                  <div className="w-[30%] rounded-t bg-brand-600 group-hover:bg-brand-700 transition-all" style={{ height: `${(bill / max) * 100}%` }} />
                  <div className="w-[30%] rounded-t bg-amber-500/80" style={{ height: `${(cert / max) * 100}%` }} />
                  <div className="w-[30%] rounded-t bg-ok-500/70" style={{ height: `${(coll / max) * 100}%` }} />
                </div>
                <span className="text-[9.5px] font-bold uppercase text-ink-400">{m}</span>
              </div>))}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[10.5px] text-ink-400 font-medium">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-brand-600" /> Expected billing</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-amber-500/80" /> Certification</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-ok-500/70" /> Collection</span>
          </div>
        </Widget>
        <Widget title="Outstanding & retention ageing" subtitle="₹ Cr across submitted bills, receivables and retention">
          <div className="space-y-2.5">
            <div className="grid grid-cols-[70px_1fr_1fr_1fr_70px] gap-2 text-[9.5px] font-bold uppercase tracking-wide text-ink-400 px-1"><span>Bucket</span><span>Submitted</span><span>Receivable</span><span>Retention</span><span className="text-right">Total</span></div>
            {buckets.map(([b, sub, rec, ret]) => (
              <div key={b as string} className="grid grid-cols-[70px_1fr_1fr_1fr_70px] gap-2 items-center text-[11.5px]">
                <span className="num font-bold text-ink-700">{b} d</span>
                {[sub, rec, ret].map((v, i) => (
                  <span key={i} className="h-[14px] rounded bg-line/60 overflow-hidden relative">
                    <span className={cx("absolute inset-y-0 left-0 rounded", i === 0 ? "bg-brand-500/80" : i === 1 ? "bg-amber-500/80" : "bg-steel-600/70")} style={{ width: `${((v as number) / 22) * 100}%` }} />
                    <span className="absolute inset-0 grid place-items-center num text-[9px] font-semibold text-ink-900/80">{(v as number).toFixed(1)}</span>
                  </span>))}
                <span className="num font-bold text-ink-900 text-right">{((sub as number) + (rec as number) + (ret as number)).toFixed(1)}</span>
              </div>))}
          </div>
          <p className="text-[10.5px] text-ink-300 mt-3 border-t border-line pt-2.5">365+ bucket escalated to commercial head — client correspondence filed in Documents under each contract.</p>
        </Widget>
      </div>
    </div>
  );
}

/* ── billing reports ─────────────────────────────────────────── */
function BillingReports({ bills }: { bills: RABill[] }) {
  const { user, log } = useERP();
  const toast = useToast();
  const packs: { cat: string; items: [string, () => { head: string[]; rows: (string | number)[][] }][] }[] = [
    { cat: "Bill Reports", items: [
      ["RA Bill Register", () => ({ head: ["Bill", "Client", "Period", "Gross", "Net", "Status"], rows: bills.map((b) => [b.no, CONTRACTS.find((c) => c.id === b.contractId)!.client, b.period, b.gross, b.net, b.status]) })],
      ["Bill Abstract", () => ({ head: ["Bill", "Particular", "Amount (₹ Cr)"], rows: bills.flatMap((b) => [["Gross", b.gross], ...b.deductions.map((d) => [`Less ${d.name}`, -d.current]), ["Net", b.net]].map(([k, v]) => [b.no, k, v] as (string | number)[])) })],
      ["Deduction Statement", () => ({ head: ["Bill", "Deduction", "Opening", "Current", "Cumulative", "Balance"], rows: bills.flatMap((b) => b.deductions.map((d) => [b.no, d.name, d.opening, d.current, d.cumulative, d.balance])) })],
    ] },
    { cat: "Quantity Reports", items: [
      ["Previous / Current / Cumulative", () => ({ head: ["Bill", "BOQ", "Unit", "Previous", "Current", "Cumulative"], rows: bills.flatMap((b) => b.lines.map((l) => [b.no, l.boqNo, l.unit, l.prev, l.current, +(l.prev + l.current).toFixed(3)])) })],
      ["Balance Quantity Report", () => ({ head: ["Contract", "BOQ", "Revised Qty", "Billed Qty", "Balance"], rows: Object.entries(BOQS).flatMap(([cid, ls]) => ls.map((l) => [CONTRACTS.find((c) => c.id === cid)!.code, l.boqNo, l.revisedQty, l.prevQty, +(l.revisedQty - l.prevQty).toFixed(3)])) })],
      ["Extra Item Register", () => ({ head: ["No.", "Description", "Qty", "Rate", "Amount (₹ L)", "Status"], rows: [["EI-018/P1", "Pile head chipping", 86, 1850, 15.9, "Client Approved"], ["EI-019/P1", "Traffic diversions", 1, 6800000, 68, "Under Review"], ["EI-007/P4", "Epoxy floor Block D", 2400, 465, 11.2, "Internal Approved"]] })],
    ] },
    { cat: "Financial Reports", items: [
      ["Certified vs Paid", () => ({ head: ["Bill", "Certified", "Received", "Outstanding"], rows: bills.filter((b) => b.certifiedAmt).map((b) => [b.no, b.certifiedAmt, b.receivedAmt ?? 0, +((b.certifiedAmt ?? 0) - (b.receivedAmt ?? 0)).toFixed(2)]) })],
      ["Retention Statement", () => ({ head: ["Contract", "Retention %", "Held (₹ Cr)", "Cap (₹ Cr)"], rows: CONTRACTS.map((c) => [c.code, c.retention, +(bills.filter((b) => b.contractId === c.id).reduce((a, b) => a + (b.deductions.find((d) => d.name.startsWith("Retention"))?.cumulative ?? 0), 0) + c.revised * 0.02).toFixed(2), +(c.revised * c.retention / 100).toFixed(2)]) })],
      ["Project Billing Summary", () => ({ head: ["Project", "Contract", "Billed", "Certified", "Received", "Billing %"], rows: CONTRACTS.map((c) => { const bl = bills.filter((b) => b.contractId === c.id); const bill = bl.reduce((a, b) => a + b.gross, 0); return [c.code, c.revised, +bill.toFixed(2), +bl.reduce((a, b) => a + (b.certifiedAmt ?? 0), 0).toFixed(2), +bl.reduce((a, b) => a + (b.receivedAmt ?? 0), 0).toFixed(2), +((bill / c.revised) * 100).toFixed(1)]; }) })],
    ] },
  ];
  const [preview, setPreview] = useState<{ name: string; head: string[]; rows: (string | number)[][] } | null>(null);
  return (
    <div>
      <PageHead title="Billing Report Centre" crumbs={["Meridian", "Billing", "Reports"]} desc="Registers, quantity statements and financial packs — exportable, printable, and filed to the audit trail.">
        <Stat label="Report packs" value={`${packs.reduce((a, p) => a + p.items.length, 0)}`} />
        <Stat label="Scheduled" value="2" sub="weekly to MD" />
      </PageHead>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {packs.map((g) => (
          <Widget key={g.cat} title={g.cat} bodyClass="p-3">
            <ul className="space-y-1.5">
              {g.items.map(([name, gen]) => (
                <li key={name} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 hover:border-brand-200 hover:bg-brand-50/30 transition-all">
                  <div className="min-w-0 flex-1"><p className="text-[12px] font-semibold text-ink-900 leading-snug">{name}</p><p className="text-[10px] text-ink-300 mt-0.5">XLSX · PDF · print</p></div>
                  <Btn sm onClick={() => { const r = gen(); setPreview({ name, ...r }); log("Reports", "Billing Report Generated", name, `${r.rows.length} rows`); }}>Preview</Btn>
                </li>))}
            </ul>
          </Widget>))}
      </div>
      <Drawer wide open={!!preview} onClose={() => setPreview(null)} title={preview?.name ?? ""} sub="Live preview · print uses the official document template">
        {preview && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-left">
                <thead className="bg-canvas"><tr>{preview.head.map((h) => <th key={h} className="text-[10px] uppercase tracking-wide font-bold text-ink-400 px-3 py-2 whitespace-nowrap">{h}</th>)}</tr></thead>
                <tbody>{preview.rows.map((r, i) => (
                  <tr key={i} className="border-t border-line/70">{r.map((c, j) => <td key={j} className={cx("px-3 py-2 text-[11.5px] whitespace-nowrap", typeof c === "number" ? "num text-right font-semibold" : "text-ink-700")}>{typeof c === "number" ? c.toLocaleString("en-IN") : c}</td>)}</tr>))}</tbody>
              </table>
            </div>
            <div className="flex justify-end gap-2">
              <Btn onClick={() => {
                const blob = new Blob([["\uFEFF", preview.head.join(","), ...preview.rows.map((r) => r.join(","))].join("\n")], { type: "text/csv" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = preview.name.replace(/\s+/g, "-").toLowerCase() + ".csv"; a.click();
                toast("success", "Exported to Excel (CSV)");
              }}>Excel</Btn>
              <Btn kind="primary" onClick={() => printDocument({
                title: preview.name, docNo: "RPT-" + Date.now().toString().slice(-6), date: dStr(0), orientation: preview.head.length > 5 ? "landscape" : "portrait",
                cols: preview.head.map((h) => ({ label: h, align: h === preview.head[0] ? "left" as const : "right" as const })),
                rows: preview.rows, generatedBy: user.name, note: "Generated from Meridian ERP billing ledger with filters applied at run time.",
              })}><IPrinter size={12} /> Print / PDF</Btn>
            </div>
          </div>)}
      </Drawer>
    </div>
  );
}
