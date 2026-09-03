/* Part 1 · Operations — Tenders, Plant & Machinery, RMC Plant */
import { useMemo, useState } from "react";
import { useERP, dStr } from "../store";
import { fmtNum } from "../data";
import { Widget, Pill, Bar, Empty, cx, useToast } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Drawer, Btn, Stat } from "./core";
import type { Col } from "./core";
import { printDocument } from "../print";
import { ICheck, IChevR, IPrinter, IEye, IAlert } from "../icons";

const money = (v: number) => "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 1 });

/* ══════════ TENDERS ══════════ */
const TSTAGES = ["Identified", "Qualification", "Documents", "BOQ & Rates", "Estimation", "Internal Approval", "Ready", "Submitted", "Opened", "Result"];

export function TenderPage() {
  const { s, setS, can, log, notify, user } = useERP();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [view, setView] = useState<any>(null);

  const rows = useMemo(() => s.tenders.filter((t) => (t.no + t.authority + t.nit + t.status).toLowerCase().includes(q.toLowerCase())), [s.tenders, q]);
  const pipeline = s.tenders.filter((t) => !["Won", "Lost", "Cancelled"].includes(t.status));
  const won = s.tenders.filter((t) => t.status === "Won").length;
  const decided = s.tenders.filter((t) => ["Won", "Lost"].includes(t.status)).length;

  const advance = (t: any) => {
    const next = Math.min(t.stage + 1, TSTAGES.length - 1);
    const status = next >= 7 ? "Bid Submitted" : next === 6 ? "Ready for Submission" : next === 5 ? "Under Approval" : "Under Evaluation";
    setS((p) => ({ ...p, tenders: p.tenders.map((x) => x.id === t.id ? { ...x, stage: next, status } : x) }));
    log("Tenders", "Stage Advanced", t.no, `${TSTAGES[t.stage]} → ${TSTAGES[next]}`);
    if (next === 7) notify("project", `${t.no} submitted — opening ${t.opening}`);
    toast("success", `${t.no} moved to “${TSTAGES[next]}”`);
  };

  const setResult = (t: any, res: "Won" | "Lost") => {
    setS((p) => ({ ...p, tenders: p.tenders.map((x) => x.id === t.id ? { ...x, status: res } : x) }));
    log("Tenders", res === "Won" ? "Tender Won" : "Tender Lost", t.no, `${money(t.value)} Cr · ${t.authority}`);
    notify("project", res === "Won" ? `${t.no} awarded — create project from contract` : `${t.no} marked as lost`);
    toast(res === "Won" ? "success" : "info", `${t.no} marked ${res}`);
    setView(null);
  };

  const printTender = (t: any) => printDocument({
    title: "Tender Summary Sheet", docNo: t.no, date: dStr(0),
    meta: [["Authority", t.authority], ["NIT No.", t.nit], ["Tender Value", `₹${t.value} Cr`], ["EMD", `₹${t.emd} Cr`], ["Tender Fee", `₹${t.fee} L`], ["Submission Deadline", t.deadline], ["Opening Date", t.opening], ["Stage", TSTAGES[t.stage]]],
    cols: [{ label: "Document" }, { label: "Status", align: "center" }],
    rows: Object.entries(t.docs).map(([k, v]) => [k, v ? "Received ✓" : "Pending"]),
    note: "Eligibility and qualification criteria to be verified against the NIT before bid approval.",
    generatedBy: user.name,
  });

  const cols: Col[] = [
    { key: "no", label: "Tender / NIT", render: (t) => <div><p className="num text-[12.5px] font-bold text-brand-700">{t.no}</p><p className="text-[10.5px] num text-ink-400 mt-0.5">{t.nit}</p></div> },
    { key: "authority", label: "Authority", render: (t) => <span className="text-[12px] text-ink-700">{t.authority}</span> },
    { key: "value", label: "Value (₹ Cr)", align: "right", sort: (t) => t.value, render: (t) => <span className="num text-[12.5px] font-semibold text-ink-900">{fmtNum(t.value, 0)}</span> },
    { key: "emd", label: "EMD (₹ Cr)", align: "right", sort: (t) => t.emd, render: (t) => <span className="num text-[12px] text-ink-500">{t.emd}</span> },
    { key: "deadline", label: "Deadline", render: (t) => {
      const days = Math.round((new Date(t.deadline.replace(/(\d{2}) (\w{3}) (\d{4})/, "$2 $1, $3")).getTime() - Date.now()) / 864e5);
      const urgent = days >= 0 && days <= 7;
      return <span className={cx("num text-[11.5px] font-semibold flex items-center gap-1", urgent ? "text-danger-600" : "text-ink-500")}>{t.deadline}{urgent && <IAlert size={11} />}</span>;
    } },
    { key: "docs", label: "Docs", align: "center", render: (t) => {
      const ok = Object.values(t.docs).filter(Boolean).length;
      return <span className="num text-[11px] font-bold bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{ok}/6</span>;
    } },
    { key: "stage", label: "Pipeline", render: (t) => (
      <div className="flex items-center gap-1">{TSTAGES.slice(0, 8).map((_, i) => (
        <span key={i} className={cx("h-[5px] flex-1 min-w-[8px] rounded-full transition-colors", i <= Math.min(t.stage, 7) ? "bg-brand-500" : "bg-line")} />))}
      </div>) },
    { key: "status", label: "Status", render: (t) => <Pill value={t.status} pulse={t.status === "Under Approval"} /> },
    { key: "act", label: "", render: (t: any) => (
      <span className="flex gap-1 justify-end">
        {can("tenders", "edit") && !["Won", "Lost", "Cancelled"].includes(t.status) && t.stage < TSTAGES.length - 1 && (
          <Btn sm onClick={(e: any) => { e.stopPropagation(); advance(t); }}><IChevR size={11} /> Advance</Btn>)}
        <Btn sm onClick={(e: any) => { e.stopPropagation(); setView(t); }}><IEye size={11} /></Btn>
        <Btn sm onClick={(e: any) => { e.stopPropagation(); printTender(t); }}><IPrinter size={11} /></Btn>
      </span>) },
  ];

  return (
    <div className="fade-up">
      <PageHead title="Tender Management" crumbs={["Meridian", "Commercial", "Tenders"]}
        desc="Identification → qualification → BOQ & rate analysis → approval → submission → award. Deadlines, EMD and document checklists tracked per tender.">
        <Stat label="Pipeline value" value={`₹${fmtNum(pipeline.reduce((a, t) => a + t.value, 0), 0)} Cr`} />
        <Stat label="In pipeline" value={`${pipeline.length}`} />
        <Stat label="Opening ≤ 7 days" value={`${s.tenders.filter((t) => { const d = Math.round((new Date(t.deadline.replace(/(\d{2}) (\w{3}) (\d{4})/, "$2 $1, $3")).getTime() - Date.now()) / 864e5); return d >= 0 && d <= 7; }).length}`} tone="warn" />
        <Stat label="Win rate" value={decided ? `${Math.round((won / decided) * 100)}%` : "—"} tone="ok" sub={`${won} of ${decided} decided`} />
      </PageHead>

      <Widget title="Tender Register" subtitle="Advance tenders through the pipeline — each stage change is audit-logged">
        <FilterBar pageKey="tenders" q={q} onQ={setQ} filters={[]} />
        <DataTable pageKey="tenders" rows={rows} cols={cols} onRow={(t) => setView(t)} />
      </Widget>

      <Drawer open={!!view} onClose={() => setView(null)} title={`Tender · ${view?.no}`} sub={view ? `${view.authority} · NIT ${view.nit}` : ""}>
        {view && (() => { const t = s.tenders.find((x) => x.id === view.id) ?? view; return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[["Value", `₹${t.value} Cr`], ["EMD", `₹${t.emd} Cr`], ["Fee", `₹${t.fee} L`], ["Deadline", t.deadline], ["Opening", t.opening], ["Stage", TSTAGES[t.stage]]].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line bg-canvas/50 px-3 py-2"><p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-400">{k}</p><p className="text-[12.5px] font-semibold text-ink-900 num mt-0.5">{v}</p></div>))}
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Pipeline</p>
              <ol className="space-y-1.5">{TSTAGES.map((st, i) => (
                <li key={st} className={cx("flex items-center gap-2.5 text-[12px] rounded-md px-2 py-1.5", i === t.stage ? "bg-brand-50 border border-brand-200 font-semibold text-brand-700" : i < t.stage ? "text-ok-600" : "text-ink-300")}>
                  <span className={cx("h-4.5 w-4.5 h-5 w-5 rounded-full grid place-items-center text-[9px] font-bold shrink-0", i < t.stage ? "bg-ok-500 text-white" : i === t.stage ? "bg-brand-600 text-white" : "bg-line text-ink-400")}>{i < t.stage ? <ICheck size={10} /> : i + 1}</span>
                  {st}
                </li>))}</ol>
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Document checklist</p>
              <div className="grid grid-cols-2 gap-1.5">{Object.entries(t.docs).map(([k, v]) => (
                <span key={k} className={cx("flex items-center gap-1.5 text-[11.5px] rounded-md border px-2 py-1.5", v ? "border-ok-500/25 bg-ok-100/40 text-ok-600" : "border-amber-500/25 bg-amber-100/40 text-amber-600")}>
                  {v ? <ICheck size={11} /> : <IAlert size={11} />} {k}</span>))}</div>
            </div>
            {t.stage >= 8 && !["Won", "Lost"].includes(t.status) && can("tenders", "approve") && (
              <div className="flex gap-2 justify-end pt-2 border-t border-line">
                <Btn kind="danger" onClick={() => setResult(t, "Lost")}>Mark Lost</Btn>
                <Btn kind="primary" onClick={() => setResult(t, "Won")}><ICheck size={13} /> Mark Awarded</Btn>
              </div>)}
          </div>); })()}
      </Drawer>
    </div>
  );
}

/* ══════════ PLANT & MACHINERY ══════════ */
export function PlantPage() {
  const { s, setS, log } = useERP();
  const toast = useToast();
  const [q, setQ] = useState("");
  const rows = s.equipment.filter((e) => (e.code + e.name + e.reg + e.project).toLowerCase().includes(q.toLowerCase()));
  const util = (e: any) => Math.min(100, Math.round((e.hrs / 1600) * 100));

  const cols: Col[] = [
    { key: "code", label: "Equipment", render: (e) => <div><p className="text-[12.5px] font-semibold text-ink-900">{e.name}</p><p className="text-[10.5px] num text-ink-400 mt-0.5">{e.code} · {e.reg}</p></div> },
    { key: "cap", label: "Capacity", render: (e) => <span className="text-[12px] text-ink-500">{e.cap}</span> },
    { key: "project", label: "Project", render: (e) => <span className="num text-[12px] text-ink-500">{e.project}</span> },
    { key: "hrs", label: "Utilisation", render: (e) => (
      <div className="w-[130px]"><div className="flex justify-between text-[10.5px] mb-1"><span className="num text-ink-400">{e.hrs.toLocaleString("en-IN")} hrs</span><span className="num font-semibold text-ink-700">{util(e)}%</span></div><Bar value={util(e)} h={5} /></div>) },
    { key: "fuel", label: "Fuel (L/day)", align: "right", sort: (e) => e.fuel, render: (e) => <span className="num text-[12px]">{e.fuel}</span> },
    { key: "maintDue", label: "Maint. due", render: (e) => <span className={cx("num text-[11.5px] font-semibold", e.maintDue.startsWith("-") ? "text-danger-600" : "text-ink-500")}>{e.maintDue}</span> },
    { key: "status", label: "Status", render: (e) => <Pill value={e.status === "Operational" ? "On Track" : e.status === "Under Maintenance" ? "Pending" : "Delayed"} />, csv: (e) => e.status },
    { key: "act", label: "", render: (e: any) => (
      <Btn sm onClick={(ev: any) => { ev.stopPropagation(); setS((p) => ({ ...p, equipment: p.equipment.map((x) => x.code === e.code ? { ...x, status: x.status === "Operational" ? "Under Maintenance" : "Operational" } : x) })); log("Plant", "Status Changed", e.code, e.status === "Operational" ? "Sent to maintenance" : "Returned to service"); toast("info", `${e.code} ${e.status === "Operational" ? "moved to maintenance" : "returned to service"}`); }}>
        {e.status === "Operational" ? "To Maint." : "Release"}</Btn>) },
  ];

  const due = s.equipment.filter((e) => e.maintDue.startsWith("-") || e.status === "Under Maintenance");
  return (
    <div className="fade-up">
      <PageHead title="Plant & Machinery" crumbs={["Meridian", "Operations", "Plant & Machinery"]}
        desc="Fleet allocation, hour-meter utilisation, fuel consumption and preventive maintenance schedule.">
        <Stat label="Fleet size" value={`${s.equipment.length}`} />
        <Stat label="Operational" value={`${s.equipment.filter((e) => e.status === "Operational").length}`} tone="ok" />
        <Stat label="Under maintenance" value={`${s.equipment.filter((e) => e.status === "Under Maintenance").length}`} tone="warn" />
        <Stat label="Maint. overdue" value={`${due.length}`} tone={due.length ? "danger" : "ok"} />
      </PageHead>
      <Widget title="Equipment Register" subtitle="Hour-meter based utilisation against a 1,600 hr annual benchmark">
        <FilterBar pageKey="plant" q={q} onQ={setQ} filters={[]} />
        <DataTable pageKey="plant" rows={rows} cols={cols} />
      </Widget>
    </div>
  );
}

/* ══════════ RMC PLANT ══════════ */
export function RmcPage() {
  const { s, setS, log, notify } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<"orders" | "batches" | "qc">("orders");

  const oCols: Col[] = [
    { key: "no", label: "Order", render: (o) => <span className="num text-[12.5px] font-bold text-brand-700">{o.no}</span> },
    { key: "customer", label: "Customer / Site", render: (o) => <div><p className="text-[12.5px] font-semibold text-ink-900">{o.customer}</p><p className="text-[10.5px] text-ink-400">{o.site}</p></div> },
    { key: "grade", label: "Grade", render: (o) => <span className="text-[10.5px] font-bold uppercase bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{o.grade}</span> },
    { key: "qty", label: "Qty (m³)", align: "right", sort: (o) => o.qty, render: (o) => <span className="num text-[12.5px] font-semibold">{o.qty}</span> },
    { key: "time", label: "First pour", render: (o) => <span className="num text-[11.5px] text-ink-500">{o.time}</span> },
    { key: "status", label: "Status", render: (o) => <Pill value={o.status === "Delivered" ? "Completed" : o.status === "In Transit" ? "Submitted" : "Pending"} pulse={o.status !== "Delivered"} />, csv: (o) => o.status },
    { key: "act", label: "", render: (o: any) => o.status !== "Delivered" ? (
      <Btn sm onClick={(e: any) => { e.stopPropagation(); setS((p) => ({ ...p, rmcOrders: p.rmcOrders.map((x) => x.id === o.id ? { ...x, status: x.status === "Scheduled" ? "In Transit" : "Delivered" } : x) })); log("RMC", o.status === "Scheduled" ? "Dispatch Started" : "Delivery Completed", o.no, `${o.qty} m³ ${o.grade} → ${o.customer}`); notify("project", `${o.no} ${o.status === "Scheduled" ? "dispatched" : "delivered"} — ${o.qty} m³`); toast("success", `${o.no} ${o.status === "Scheduled" ? "in transit" : "delivered"}`); }}>
        {o.status === "Scheduled" ? "Dispatch" : "Delivered"}</Btn>) : null },
  ];

  const bCols: Col[] = [
    { key: "time", label: "Batch time", render: (b) => <span className="num text-[12px] font-semibold text-ink-900">{b.time}</span> },
    { key: "order", label: "Order", render: (b) => <span className="num text-[11.5px] text-brand-700 font-bold">{b.order}</span> },
    { key: "grade", label: "Grade", render: (b) => <span className="text-[10.5px] font-bold uppercase bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{b.grade}</span> },
    { key: "qty", label: "Batch (m³)", align: "right", render: (b) => <span className="num text-[12px] font-semibold">{b.qty}</span> },
    { key: "mix", label: "Mix — Cement/Sand/Agg (kg)", render: (b) => <span className="num text-[11.5px] text-ink-500">{(b.cement * 1000).toLocaleString("en-IN")} / {(b.sand * 1000).toLocaleString("en-IN")} / {(b.agg * 1000).toLocaleString("en-IN")}</span> },
    { key: "admix", label: "Admix (L)", align: "right", render: (b) => <span className="num text-[11.5px]">{b.admix}</span> },
  ];

  const produced = s.batches.reduce((a, b) => a + b.qty, 0);
  const dispatched = s.rmcOrders.filter((o) => o.status === "Delivered").reduce((a, o) => a + o.qty, 0);

  return (
    <div className="fade-up">
      <PageHead title="RMC Plant — Kharadi" crumbs={["Meridian", "Operations", "RMC Plant"]}
        desc="Concrete orders, batching production and quality control for the ready-mix plant.">
        <Stat label="Batched today" value={`${produced} m³`} />
        <Stat label="Delivered" value={`${dispatched} m³`} tone="ok" />
        <Stat label="Avg slump" value={`${Math.round(s.batches.reduce((a, b) => a + b.slump, 0) / (s.batches.length || 1))} mm`} />
        <Stat label="Cube sets" value={`${s.batches.length * 2}`} sub="7 & 28 day" />
      </PageHead>
      <Widget title={tab === "orders" ? "Customer Orders & Dispatch" : tab === "batches" ? "Production Batches" : "Quality Control"}
        subtitle={tab === "orders" ? "Scheduled → In Transit → Delivered, linked to dispatch registers" : tab === "batches" ? "Batch-wise mix consumption from the batching PLC" : "Slump tests and cube specimens per batch"}>
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={[{ k: "orders" as const, l: "Orders & Dispatch", n: s.rmcOrders.length }, { k: "batches" as const, l: "Batches", n: s.batches.length }, { k: "qc" as const, l: "Quality" }]} /></div>
        {tab === "orders" && <DataTable pageKey="rmc-orders" rows={s.rmcOrders} cols={oCols} />}
        {tab === "batches" && <DataTable pageKey="rmc-batches" rows={s.batches} cols={bCols} />}
        {tab === "qc" && (
          <div className="space-y-2">
            {s.batches.map((b) => (
              <div key={b.id} className="flex items-center gap-4 border border-line rounded-lg px-4 py-3 hover:border-line-strong transition-all">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ink-900">{b.order} · {b.grade} <span className="num text-ink-400 font-normal">— {b.time}</span></p>
                  <p className="text-[11px] text-ink-400 mt-0.5">Cube specimens: {b.cubes} · marked &amp; cured on site</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400">Slump</p>
                  <p className={cx("num text-[15px] font-semibold", b.slump >= 100 && b.slump <= 130 ? "text-ok-600" : "text-amber-600")}>{b.slump} mm</p>
                </div>
                <Pill value={b.slump >= 100 && b.slump <= 130 ? "On Track" : "Pending"} />
              </div>))}
            {s.batches.length === 0 && <Empty title="No batches today" note="Batches appear here as the plant runs production." />}
          </div>)}
      </Widget>
    </div>
  );
}
