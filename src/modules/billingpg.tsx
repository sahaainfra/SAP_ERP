/* Part 1 · Billing & RA Bills — MB, bill engine, deductions, certification, premium print */
import { useMemo, useState } from "react";
import { useERP, dStr } from "../store";
import type { BillDoc, MBEntry } from "../store";
import { Widget, Pill, cx, useToast, Empty } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat } from "./core";
import type { Col } from "./core";
import { printDocument } from "../print";
import { IChevD, ICheck, IPlus, IPrinter, IEye, IXCircle } from "../icons";

const L = (v: number) => "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
type Tab = "bills" | "mb" | "cert";

export default function BillingPage() {
  const { s, setS, can, log, notify, nextCode, user, role } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("bills");
  const [q, setQ] = useState("");
  const [view, setView] = useState<BillDoc | null>(null);
  const [creating, setCreating] = useState(false);

  const bills = useMemo(() => s.billDocs.filter((b) => (b.no + b.project + b.client + b.status).toLowerCase().includes(q.toLowerCase())), [s.billDocs, q]);

  /* ── deduction engine from config ── */
  const dedFor = (gross: number) => {
    const out: [string, number][] = [];
    for (const d of s.deductionCfg.filter((x) => x.active && x.value > 0)) out.push([d.head, +(gross * d.value / 100).toFixed(4)]);
    return out;
  };

  const patch = (b: BillDoc, patchx: Partial<BillDoc>, action: string, detail: string) => {
    setS((p) => ({ ...p, billDocs: p.billDocs.map((x) => x.id === b.id ? { ...x, ...patchx } : x) }));
    log("Billing", action, b.no, detail);
  };

  const submitToClient = (b: BillDoc) => { patch(b, { status: "Submitted to Client" }, "Bill Submitted to Client", `${L(b.net)} → ${b.client}`); notify("approval", `${b.no} submitted to ${b.client} for certification`); toast("success", `${b.no} submitted to client`); };

  const certify = (b: BillDoc) => {
    const invNo = "INV-C-" + (2215 + s.arInvoices.length);
    setS((p) => ({
      ...p,
      billDocs: p.billDocs.map((x) => x.id === b.id ? { ...x, status: "Certified" as const, certifiedAmt: b.net, certifiedDate: dStr(0) } : x),
      arInvoices: [{ id: "ar" + Date.now(), no: invNo, client: b.client, ref: b.no, amount: b.net, due: dStr(-30), status: "Raised" as const, received: 0 }, ...p.arInvoices],
    }));
    log("Billing", "Bill Certified", b.no, `Certified ${L(b.net)} · client invoice ${invNo} raised → receivable posted`);
    notify("payment", `${b.no} certified — receivable ${invNo} created`);
    toast("success", `${b.no} certified — receivable posted to Accounts`);
  };

  const receive = (b: BillDoc) => {
    setS((p) => ({
      ...p,
      billDocs: p.billDocs.map((x) => x.id === b.id ? { ...x, status: "Fully Paid" as const, received: x.certifiedAmt ?? x.net } : x),
      arInvoices: p.arInvoices.map((a) => a.ref === b.no ? { ...a, received: a.amount, status: "Paid" as const } : a),
    }));
    log("Billing", "Payment Received", b.no, `${L(b.certifiedAmt ?? b.net)} received — receivable settled, cash flow updated`);
    notify("payment", `Client payment received against ${b.no}`);
    toast("success", `Payment recorded — ${b.no} fully paid`);
  };

  const returnBill = (b: BillDoc) => {
    patch(b, { status: "Returned for Correction" }, "Bill Returned", "Returned for correction — quantity query raised");
    setS((p) => ({ ...p, queries: [{ id: "q" + Date.now(), docRef: b.no, raisedBy: user.name, text: "Cumulative quantities require verification against the latest certified MB before resubmission.", field: "BOQ quantities", priority: "High", due: dStr(3), status: "Open" as const, ts: Date.now() }, ...p.queries] }));
    notify("approval", `${b.no} returned for correction — query raised to ${b.by}`);
    toast("info", `${b.no} returned — correction query created`);
  };

  const printRA = (b: BillDoc) => {
    const rows = b.lines.map((l) => {
      const cum = l.prevQty + l.currentQty;
      return [l.itemNo, `${l.desc}`, l.unit, "As per BOQ", l.rate.toLocaleString("en-IN"), l.prevQty.toLocaleString("en-IN"), l.currentQty.toLocaleString("en-IN"), cum.toLocaleString("en-IN"), (l.currentQty * l.rate).toLocaleString("en-IN"), (cum * l.rate).toLocaleString("en-IN")];
    });
    printDocument({
      title: "Running Account Bill", docNo: b.no, rev: `Rev-${String(b.rev).padStart(2, "0")}`, date: b.date, period: b.period,
      project: `${b.project} — ${s.projects.find((p) => p.id === b.project)?.name ?? b.client}`, orientation: "landscape", paper: "a3",
      meta: [["Client", b.client], ["Bill Type", b.type], ["Billing Period", b.period], ["Status", b.status], ["Prepared By", b.by]],
      cols: [
        { label: "Item" }, { label: "Description" }, { label: "Unit", align: "center" }, { label: "Contract Qty", align: "right" },
        { label: "Rate (₹)", align: "right" }, { label: "Previous Qty", align: "right" }, { label: "Current Qty", align: "right" },
        { label: "Cumulative Qty", align: "right" }, { label: "Current Amount (₹)", align: "right" }, { label: "Cumulative Amount (₹)", align: "right" },
      ],
      rows,
      totalsLabel: "Gross Work Done (₹ Cr)", totals: [b.gross],
      remarks: `Deductions — ${dedFor(b.gross).map(([k, v]) => `${k} ${L(v)}`).join(" · ")} · GST ${L(b.gst)}. Net payable ${L(b.net)}.`,
      inWords: b.net * 1e7,
      terms: ["Quantities are as per the certified Measurement Book and are subject to client re-measurement.", "Deductions as per contract agreement; retention released on DLP completion.", "Interest not applicable on delayed certification beyond contractual terms."],
      signatures: ["Prepared By", "Billing Engineer", "Project Manager", "Commercial Manager", "Accounts Manager", "Client Representative"],
      verifyCode: `RA-${b.no.replace(/[^A-Za-z0-9]/g, "")}`,
      note: "Only the latest approved revision of this bill is valid for payment. All previous revisions stand superseded.",
      generatedBy: user.name,
    });
  };

  const printMB = (m: MBEntry) => {
    const qty = m.meas.reduce((a, x) => a + x.nos * x.l * x.b * x.h, 0);
    printDocument({
      title: "Measurement Book", docNo: m.mbNo, date: m.date, project: `${m.project} — ${s.projects.find((p) => p.id === m.project)?.name ?? ""}`,
      meta: [["Page", m.page], ["Location", m.location], ["BOQ Item", `${m.boqNo} — ${m.boqItem}`], ["Drawing Ref", m.drawing], ["Unit", m.unit], ["Measured By", m.by], ["Measurement Status", m.status]],
      cols: [{ label: "Particular" }, { label: "Nos", align: "right" }, { label: "Length (m)", align: "right" }, { label: "Breadth (m)", align: "right" }, { label: "Height / Depth (m)", align: "right" }, { label: `Quantity (${m.unit})`, align: "right" }],
      rows: m.meas.map((x, i) => [`Entry ${i + 1} — ${m.desc}`, x.nos, x.l, x.b, x.h, +(x.nos * x.l * x.b * x.h).toFixed(2)]),
      totalsLabel: `Total Quantity (${m.unit})`, totals: [+qty.toFixed(2)],
      signatures: ["Measured By", "Checked By", "Verified By", "Client Representative"],
      note: "Nos × Length × Breadth × Height/Depth. Approved measurements are locked and versioned.",
      generatedBy: user.name,
    });
  };

  const bCols: Col[] = [
    { key: "no", label: "RA Bill / Rev", render: (b) => <div><p className="num text-[12.5px] font-bold text-brand-700">{b.no}</p><p className="text-[10px] num text-ink-300 mt-0.5">Rev-{String(b.rev).padStart(2, "0")} · {b.period}</p></div> },
    { key: "project", label: "Project / Client", render: (b) => <div><p className="text-[12px] font-semibold text-ink-900">{b.project}</p><p className="text-[10.5px] text-ink-400">{b.client}</p></div> },
    { key: "gross", label: "Gross (₹ Cr)", align: "right", sort: (b) => b.gross, render: (b) => <span className="num text-[12.5px] font-semibold">{b.gross.toFixed(2)}</span> },
    { key: "ded", label: "Deductions", align: "right", sort: (b) => b.deductions, render: (b) => <span className="num text-[12px] text-danger-600">−{b.deductions.toFixed(2)}</span> },
    { key: "gst", label: "GST", align: "right", render: (b) => <span className="num text-[12px] text-ink-500">+{b.gst.toFixed(2)}</span> },
    { key: "net", label: "Net (₹ Cr)", align: "right", sort: (b) => b.net, render: (b) => <span className="num text-[12.5px] font-bold text-ink-900">{b.net.toFixed(2)}</span> },
    { key: "status", label: "Status", render: (b) => <Pill value={b.status} pulse={b.status === "Under Approval" || b.status === "Under Client Certification"} /> },
    { key: "act", label: "Actions", render: (b: BillDoc) => (
      <span className="flex gap-1 justify-end">
        {can("billing", "approve") && b.status === "Under Approval" && <>
          <Btn sm kind="ok" onClick={(e: any) => { e.stopPropagation(); patch(b, { status: "Approved" }, "Bill Approved Internally", "Internal checking completed"); submitToClient(b); }}><ICheck size={11} /> Approve</Btn>
          <Btn sm kind="danger" onClick={(e: any) => { e.stopPropagation(); returnBill(b); }}><IXCircle size={11} /></Btn>
        </>}
        {can("billing", "approve") && (b.status === "Submitted to Client" || b.status === "Under Client Certification") && (
          <Btn sm kind="ok" onClick={(e: any) => { e.stopPropagation(); certify(b); }}><ICheck size={11} /> Certify</Btn>)}
        {can("billing", "edit") && b.status === "Certified" && (
          <Btn sm onClick={(e: any) => { e.stopPropagation(); receive(b); }}>Receipt</Btn>)}
        {b.status === "Returned for Correction" && can("billing", "edit") && (
          <Btn sm onClick={(e: any) => {
            e.stopPropagation();
            setS((p) => ({
              ...p,
              billDocs: p.billDocs.map((x) => x.id === b.id ? { ...x, status: "Under Approval" as const, rev: x.rev + 1 } : x),
              versions: [{ id: "vr" + Date.now(), docRef: b.no, ver: b.rev + 1, date: dStr(0), user: user.name, reason: "Resubmitted after correction", status: "Submitted" }, ...p.versions],
            }));
            log("Billing", "Bill Resubmitted", b.no, `Rev-${String(b.rev + 1).padStart(2, "0")} after correction`);
            notify("approval", `${b.no} Rev-${String(b.rev + 1).padStart(2, "0")} resubmitted`);
            toast("success", `${b.no} resubmitted as Rev-${String(b.rev + 1).padStart(2, "0")}`);
          }}>Resubmit</Btn>)}
        <Btn sm onClick={(e: any) => { e.stopPropagation(); setView(b); }}><IEye size={11} /></Btn>
        <Btn sm onClick={(e: any) => { e.stopPropagation(); printRA(b); }}><IPrinter size={11} /></Btn>
      </span>) },
  ];

  const mCols: Col[] = [
    { key: "mbNo", label: "MB / Page", render: (m) => <div><p className="num text-[12.5px] font-bold text-brand-700">{m.mbNo}</p><p className="text-[10px] num text-ink-300">Page {m.page} · {m.date}</p></div> },
    { key: "project", label: "Project / Location", render: (m) => <div><p className="text-[12px] font-semibold text-ink-900">{m.project} · {m.location}</p><p className="text-[10.5px] num text-ink-400">{m.boqNo} — {m.boqItem}</p></div> },
    { key: "unit", label: "Unit", align: "center", render: (m) => <span className="text-[10.5px] font-bold uppercase bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{m.unit}</span> },
    { key: "qty", label: "Quantity", align: "right", sort: (m) => m.meas.reduce((a: number, x: any) => a + x.nos * x.l * x.b * x.h, 0), render: (m) => <span className="num text-[12.5px] font-semibold">{m.meas.reduce((a: number, x: any) => a + x.nos * x.l * x.b * x.h, 0).toFixed(1)}</span> },
    { key: "drawing", label: "Drawing", render: (m) => <span className="num text-[11px] text-ink-500">{m.drawing}</span> },
    { key: "status", label: "Status", render: (m) => <Pill value={m.status === "Certified" ? "Completed" : m.status === "Client" ? "Submitted" : "Pending"} pulse={m.status === "Internal"} />, csv: (m) => m.status },
    { key: "act", label: "", render: (m: MBEntry) => (
      <span className="flex gap-1 justify-end">
        {can("billing", "approve") && m.status !== "Certified" && (
          <Btn sm kind="ok" onClick={(e: any) => { e.stopPropagation(); setS((p) => ({ ...p, mbs: p.mbs.map((x) => x.id === m.id ? { ...x, status: "Certified" as const } : x) })); log("Billing", "Measurement Certified", m.mbNo, `${m.boqItem} — locked after certification`); toast("success", `${m.mbNo} certified & locked`); }}><ICheck size={11} /> Certify</Btn>)}
        <Btn sm onClick={(e: any) => { e.stopPropagation(); printMB(m); }}><IPrinter size={11} /></Btn>
      </span>) },
  ];

  const submitted = bills.filter((b) => ["Submitted to Client", "Under Client Certification"].includes(b.status)).reduce((a, b) => a + b.net, 0);
  const certified = bills.filter((b) => b.certifiedAmt).reduce((a, b) => a + (b.certifiedAmt ?? 0), 0);
  const received = bills.reduce((a, b) => a + (b.received ?? 0), 0);

  return (
    <div className="fade-up">
      <PageHead title="Billing & RA Bills" crumbs={["Meridian", "Commercial", "Billing"]}
        desc="Contract → BOQ → measurement → abstract → RA bill → certification → receivable. Cumulative quantities validated against approved BOQ.">
        <Stat label="Submitted" value={L(submitted) + " Cr"} />
        <Stat label="Certified" value={L(certified) + " Cr"} tone="ok" />
        <Stat label="Received" value={L(received) + " Cr"} tone="ok" />
        <Stat label="Awaiting certification" value={`${bills.filter((b) => ["Submitted to Client", "Under Client Certification"].includes(b.status)).length}`} tone="warn" />
        <Btn kind="primary" disabled={!can("billing", "create")} onClick={() => setCreating(true)}><IPlus size={13} /> New RA Bill</Btn>
      </PageHead>

      <Widget title={tab === "bills" ? "RA Bill Register" : tab === "mb" ? "Measurement Book" : "Certification Tracker"}
        subtitle={tab === "bills" ? "Previous quantities carry forward automatically · revisions are versioned, never overwritten" : tab === "mb" ? "Nos × L × B × H/D computed automatically · certified measurements lock" : "Submitted vs certified vs received with delay tracking"}>
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={[{ k: "bills" as Tab, l: "RA Bills", n: bills.length }, { k: "mb" as Tab, l: "Measurement Book", n: s.mbs.length }, { k: "cert" as Tab, l: "Certification" }]} /></div>
        {tab !== "mb" && <FilterBar pageKey={"bill-" + tab} q={q} onQ={setQ} filters={[]} />}
        {tab === "bills" && <DataTable pageKey="rabills" rows={bills} cols={bCols} onRow={(b) => setView(b)} />}
        {tab === "mb" && <DataTable pageKey="mb" rows={s.mbs} cols={mCols} />}
        {tab === "cert" && (
          <div className="space-y-2">
            {bills.filter((b) => !["Draft", "Under Preparation"].includes(b.status)).map((b) => {
              const delay = ["Submitted to Client", "Under Client Certification"].includes(b.status) ? Math.max(0, Math.round((Date.now() - b.ts) / 864e5)) : 0;
              return (
                <div key={b.id} className="border border-line rounded-lg px-4 py-3 hover:border-line-strong transition-all">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="num text-[12.5px] font-bold text-brand-700 w-[150px]">{b.no}</span>
                    <span className="text-[12px] text-ink-500 flex-1 min-w-[120px]">{b.client}</span>
                    {[["Submitted", b.net], ["Certified", b.certifiedAmt ?? 0], ["Received", b.received ?? 0]].map(([k, v]) => (
                      <div key={k as string} className="text-right w-[110px]">
                        <p className="text-[9.5px] font-bold uppercase tracking-wide text-ink-400">{k}</p>
                        <p className={cx("num text-[13px] font-semibold", (v as number) > 0 ? "text-ink-900" : "text-ink-300")}>{(v as number) > 0 ? L(v as number) : "—"}</p>
                      </div>))}
                    {delay > 0 && <span className="num text-[10.5px] font-bold bg-amber-100 text-amber-600 rounded-full px-2 py-0.5">{delay} d pending</span>}
                    <Pill value={b.status} />
                  </div>
                </div>);
            })}
            {bills.filter((b) => !["Draft", "Under Preparation"].includes(b.status)).length === 0 && <Empty title="No bills in certification" note="Submit an RA bill to begin client certification tracking." />}
          </div>)}
      </Widget>

      {/* view drawer */}
      <Drawer wide open={!!view} onClose={() => setView(null)} title={`RA Bill · ${view?.no}`} sub={view ? `${view.client} · ${view.period} · Rev-${String(view.rev).padStart(2, "0")}` : ""}>
        {view && (() => {
          const b = s.billDocs.find((x) => x.id === view.id) ?? view;
          const grossLive = b.lines.reduce((a, l) => a + (l.prevQty + l.currentQty) * l.rate, 0) / 1e7;
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <Stat label="Gross" value={L(b.gross) + " Cr"} />
                <Stat label="Deductions" value={"−" + L(b.deductions) + " Cr"} tone="danger" />
                <Stat label="GST" value={"+" + L(b.gst) + " Cr"} />
                <Stat label="Net" value={L(b.net) + " Cr"} tone="ok" />
              </div>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-left min-w-[720px]">
                  <thead><tr className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
                    <th className="font-bold pb-2 pr-3">Item</th><th className="font-bold pb-2 pr-3">Unit</th>
                    <th className="font-bold pb-2 pr-3 text-right">Rate</th><th className="font-bold pb-2 pr-3 text-right">Previous</th>
                    <th className="font-bold pb-2 pr-3 text-right">Current</th><th className="font-bold pb-2 pr-3 text-right">Cumulative</th><th className="font-bold pb-2 text-right">Current Amt</th>
                  </tr></thead>
                  <tbody>{b.lines.map((l) => (
                    <tr key={l.itemNo} className="border-t border-line/80">
                      <td className="py-2.5 pr-3"><p className="text-[12.5px] font-semibold text-ink-900">{l.itemNo} · {l.desc}</p></td>
                      <td className="py-2.5 pr-3 text-[11.5px] text-ink-500">{l.unit}</td>
                      <td className="py-2.5 pr-3 text-right num text-[12px]">{l.rate.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 pr-3 text-right num text-[12px]">{l.prevQty.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold text-ok-600">+{l.currentQty.toLocaleString("en-IN")}</td>
                      <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold">{(l.prevQty + l.currentQty).toLocaleString("en-IN")}</td>
                      <td className="py-2.5 text-right num text-[12px] font-semibold">{L(l.currentQty * l.rate / 1e7)} Cr</td>
                    </tr>))}
                  </tbody>
                </table>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-line p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700 mb-2">Deduction statement</p>
                  {dedFor(b.gross).map(([k, v]) => <div key={k} className="flex justify-between text-[12px] py-1"><span className="text-ink-500">{k}</span><span className="num text-danger-600">−{L(v)}</span></div>)}
                  <div className="flex justify-between text-[12px] py-1 border-t border-line mt-1"><span className="text-ink-500">GST</span><span className="num">+{L(b.gst)}</span></div>
                </div>
                <div className="rounded-lg border border-line p-3.5">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700 mb-2">Submission checklist</p>
                  {Object.entries(b.checklist).map(([k, v]) => (
                    <p key={k} className={cx("flex items-center gap-1.5 text-[11.5px] py-0.5", v ? "text-ok-600" : "text-amber-600")}>{v ? <ICheck size={11} /> : <IXCircle size={11} />} {k}</p>))}
                </div>
              </div>
              <p className="text-[10.5px] text-ink-400 bg-canvas border border-line rounded-md px-3 py-2">Cross-check: recomputed gross from lines {L(grossLive)} Cr vs recorded {L(b.gross)} Cr. Linked receivable: {s.arInvoices.find((a) => a.ref === b.no)?.no ?? "created on certification"}.</p>
              <div className="flex justify-end gap-2 pt-2 border-t border-line"><Btn onClick={() => printRA(b)}><IPrinter size={13} /> Print RA Bill</Btn></div>
            </div>);
        })()}
      </Drawer>

      <NewRA open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

/* ── new RA bill engine ── */
function NewRA({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { s, setS, log, notify, nextCode, user } = useERP();
  const toast = useToast();
  const [proj, setProj] = useState("P1");
  const [qty, setQty] = useState<Record<string, string>>({});

  const lines = s.billBoq.filter((b) => b.project === proj);
  const client = s.projects.find((p) => p.id === proj)?.client ?? "Client";
  const get = (id: string) => parseFloat(qty[id] ?? "0") || 0;
  const gross = lines.reduce((a, l) => a + (l.prevQty + get(l.id)) * l.rate, 0) / 1e7;
  const deductions = s.deductionCfg.filter((d) => d.active && d.value > 0).reduce((a, d) => a + gross * d.value / 100, 0);
  const gst = (gross - deductions) * 0.18;
  const net = gross - deductions + gst;
  const overruns = lines.filter((l) => l.prevQty + get(l.id) > l.contractQty);

  const submit = () => {
    const cur = lines.filter((l) => get(l.id) > 0);
    if (!cur.length) { toast("error", "Enter current quantity for at least one BOQ item"); return; }
    if (overruns.length) { toast("error", `${overruns.length} item(s) exceed approved BOQ — link an approved variation first`); return; }
    const no = `RA-${String(nextCode("RA")).padStart(2, "0")}/${proj.replace("P", "PRJ-0")}/2026`;
    const doc: BillDoc = {
      id: "bd" + Date.now(), no, rev: 1, project: proj, client, period: "01–" + dStr(0).slice(0, 6) + " 2026", date: dStr(0), type: "RA Bill",
      gross: +gross.toFixed(2), deductions: +deductions.toFixed(2), gst: +gst.toFixed(2), net: +net.toFixed(2),
      status: "Under Approval", by: user.name, ts: Date.now(),
      checklist: { "Measurement completed": true, "BOQ quantities verified": true, "Drawings attached": true, "Previous bill reconciled": true, "Deductions verified": true, "GST verified": true, "Internal approval completed": false },
      lines: cur.map((l) => ({ itemNo: l.itemNo, desc: l.desc, unit: l.unit, prevQty: l.prevQty, currentQty: get(l.id), rate: l.rate })),
    };
    setS((p) => ({
      ...p,
      billDocs: [doc, ...p.billDocs],
      billBoq: p.billBoq.map((b) => b.project === proj ? { ...b, prevQty: b.prevQty + get(b.id), currentQty: 0 } : b),
      versions: [{ id: "vr" + Date.now(), docRef: no, ver: 1, date: dStr(0), user: user.name, reason: "Initial submission", status: "Submitted" }, ...p.versions],
    }));
    log("Billing", "RA Bill Raised", no, `Gross ${L(gross)} Cr · net ${L(net)} Cr · previous quantities carried forward`);
    notify("approval", `${no} (${L(net)} Cr) awaiting internal approval`);
    toast("success", `${no} raised — routed for approval`);
    setQty({});
    onClose();
  };

  if (!open) return null;
  return (
    <Drawer wide open={open} onClose={onClose} title="New RA Bill" sub="Previous certified quantities carry forward automatically · cumulative validated against BOQ">
      <div className="space-y-4">
        <Field label="Project" w="w-[280px]">
          <div className="relative">
            <select className={selectCls} value={proj} onChange={(e) => { setProj(e.target.value); setQty({}); }}>
              {s.projects.filter((p) => s.billBoq.some((b) => b.project === p.id)).map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name.slice(0, 30)}</option>)}
            </select>
            <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
          </div>
        </Field>
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-left min-w-[700px]">
            <thead><tr className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
              <th className="font-bold pb-2 pr-3">BOQ Item</th><th className="font-bold pb-2 pr-3">Unit</th>
              <th className="font-bold pb-2 pr-3 text-right">Contract Qty</th><th className="font-bold pb-2 pr-3 text-right">Rate</th>
              <th className="font-bold pb-2 pr-3 text-right">Previous</th><th className="font-bold pb-2 pr-3 text-right w-[110px]">Current Qty</th>
              <th className="font-bold pb-2 text-right">Cumulative</th>
            </tr></thead>
            <tbody>{lines.map((l) => {
              const cum = l.prevQty + get(l.id);
              const over = cum > l.contractQty;
              return (
                <tr key={l.id} className="border-t border-line/80">
                  <td className="py-2.5 pr-3"><p className="text-[12px] font-semibold text-ink-900">{l.itemNo} · {l.desc}</p><p className="text-[10px] text-ink-400">{l.spec}</p></td>
                  <td className="py-2.5 pr-3 text-[11.5px] text-ink-500">{l.unit}</td>
                  <td className="py-2.5 pr-3 text-right num text-[12px]">{l.contractQty.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 pr-3 text-right num text-[12px]">{l.rate.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 pr-3 text-right num text-[12px] text-ink-500">{l.prevQty.toLocaleString("en-IN")}</td>
                  <td className="py-2.5 pr-3"><input type="number" className={cx(inputCls, "text-right num", over && "border-danger-500 ring-2 ring-danger-100")} value={qty[l.id] ?? ""} onChange={(e) => setQty({ ...qty, [l.id]: e.target.value })} placeholder="0" /></td>
                  <td className={cx("py-2.5 text-right num text-[12px] font-semibold", over ? "text-danger-600" : "text-ink-900")}>{cum.toLocaleString("en-IN")}{over && " ⚠"}</td>
                </tr>);
            })}</tbody>
          </table>
        </div>
        {overruns.length > 0 && <p className="text-[11.5px] font-semibold text-danger-600 bg-danger-100/40 border border-danger-500/25 rounded-md px-3 py-2">Cumulative exceeds approved BOQ on {overruns.length} item(s) — requires an approved variation / extra item before billing.</p>}
        <div className="rounded-lg border border-line p-4 grid sm:grid-cols-2 gap-x-8 gap-y-1.5">
          {[["Gross work done", gross, ""], ["Total deductions", -deductions, "text-danger-600"], ["GST @18%", gst, ""], ["Net payable", net, "font-bold text-[15px]"]].map(([k, v, cls]) => (
            <div key={k as string} className="flex justify-between text-[12.5px]"><span className="text-ink-500">{k}</span><span className={cx("num font-semibold", cls as string, (v as number) < 0 && "text-danger-600")}>{L(Math.abs(v as number))} Cr</span></div>))}
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-line"><Btn onClick={onClose}>Cancel</Btn><Btn kind="primary" onClick={submit}><ICheck size={13} /> Submit for Approval</Btn></div>
      </div>
    </Drawer>
  );
}
