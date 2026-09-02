import { useEffect, useMemo, useState } from "react";
import { useERP, STAGE_LABEL, dStr } from "../store";
import type { Tender } from "../store";
import { Pill, Widget, useToast, cx } from "../ui";
import { PageHead, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat, AddBtn, Modal } from "./shell";
import type { Col } from "./shell";
import { IChevD, ICheck, IFlask, IClock } from "../icons";

/* ═══ Tender Management ═══════════════════════════════════════ */
export function TendersPage() {
  const { s, setS, can, log, notify, nextCode, user } = useERP();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<Tender | null>(null);
  const [reg, setReg] = useState(false);
  const [rate, setRate] = useState(false);
  const [form, setForm] = useState({ authority: "", nit: "", value: "", emd: "", deadline: "" });
  const [ra, setRa] = useState({ qty: 100, material: 3250, labour: 480, machine: 260, transport: 140, wastage: 2.5, overhead: 6, profit: 8, gst: 18 });

  const rows = useMemo(() => s.tenders.filter((t) => (t.no + t.authority + t.nit + t.status).toLowerCase().includes(q.toLowerCase())), [s.tenders, q]);
  const live = s.tenders.filter((t) => t.stage < 9);

  const advance = (t: Tender) => {
    const next = Math.min(9, t.stage + 1);
    setS((p) => ({ ...p, tenders: p.tenders.map((x) => x.id === t.id ? { ...x, stage: next, status: STAGE_LABEL[next] } : x) }));
    setDetail((d) => (d?.id === t.id ? { ...d, stage: next, status: STAGE_LABEL[next] } : d));
    log("Tenders", "Stage Advanced", t.no, `${t.authority} → ${STAGE_LABEL[next]}`);
    if (next === 8) notify("project", `Bid submitted — ${t.no} (${t.authority})`);
    if (next === 9) notify("project", `Result recorded for ${t.no}`);
    toast("success", `${t.no} moved to “${STAGE_LABEL[next]}”`);
  };

  const toggleDoc = (t: Tender, doc: string) => {
    setS((p) => ({ ...p, tenders: p.tenders.map((x) => x.id === t.id ? { ...x, docs: { ...x.docs, [doc]: !x.docs[doc] } } : x) }));
    setDetail((d) => (d?.id === t.id ? { ...d, docs: { ...d.docs, [doc]: !d.docs[doc] } } : d));
    toast("info", `${doc} ${t.docs[doc] ? "marked pending" : "received & filed"}`);
  };

  const register = () => {
    if (!form.authority || !form.value) { toast("error", "Authority and tender value are mandatory"); return; }
    const no = `TND-2026-0${18 + s.tenders.length}`;
    setS((p) => ({ ...p, tenders: [{ id: "t" + Date.now(), no, authority: form.authority, nit: form.nit || "NIT/2025-26/—" , value: parseFloat(form.value), emd: parseFloat(form.emd) || 0, fee: 0.2, deadline: form.deadline || dStr(-10), opening: dStr(-12), stage: 1, status: "Registered", docs: { NIT: false, BOQ: false, Drawings: false, Specifications: false, "Eligibility Docs": false, "Pre-bid Queries": false } }, ...p.tenders] }));
    log("Tenders", "Tender Registered", no, `${form.authority} · est. ₹${form.value} Cr`);
    notify("project", `Tender ${no} registered — download documents to begin`);
    toast("success", `${no} registered`);
    setReg(false); setForm({ authority: "", nit: "", value: "", emd: "", deadline: "" });
  };

  const unitRate = ra.material + ra.labour + ra.machine + ra.transport;
  const withWastage = unitRate * (1 + ra.wastage / 100);
  const withOH = withWastage * (1 + ra.overhead / 100);
  const withProfit = withOH * (1 + ra.profit / 100);
  const finalRate = withProfit * (1 + ra.gst / 100);

  const cols: Col[] = [
    { key: "no", label: "Tender", render: (t) => <div><p className="num text-[12.5px] font-bold text-brand-700">{t.no}</p><p className="text-[10.5px] text-ink-400 num mt-0.5">{t.nit}</p></div> },
    { key: "authority", label: "Authority", render: (t) => <span className="text-[12.5px] font-semibold text-ink-900">{t.authority}</span> },
    { key: "value", label: "Est. Value (₹ Cr)", align: "right", sort: (t) => t.value, render: (t) => <span className="num text-[12.5px] font-semibold">{t.value.toFixed(0)}</span> },
    { key: "emd", label: "EMD (₹ L)", align: "right", sort: (t) => t.emd, render: (t) => <span className="num text-[12px] text-ink-500">{t.emd.toFixed(2)}</span> },
    { key: "deadline", label: "Submission", render: (t) => <span className="num text-[11.5px] text-ink-500">{t.deadline}</span> },
    { key: "stage", label: "Stage", render: (t) => (
      <div className="w-[150px]">
        <div className="flex justify-between text-[9.5px] font-bold uppercase tracking-wide text-ink-400 mb-1"><span>{STAGE_LABEL[t.stage]}</span><span className="num">{t.stage}/9</span></div>
        <div className="h-[5px] rounded-full bg-line overflow-hidden"><div className={cx("h-full rounded-full transition-[width] duration-500", t.stage === 9 ? "bg-ok-500" : "bg-brand-500")} style={{ width: `${(t.stage / 9) * 100}%` }} /></div>
      </div>) },
    { key: "status", label: "Status", render: (t) => <Pill value={t.status.includes("Awarded") ? "Completed" : t.stage >= 8 ? "Submitted" : "On Track"} />, csv: (t) => t.status },
  ];

  return (
    <div className="fade-up">
      <PageHead title="Tender Management" crumbs={["Meridian", "Business Development", "Tenders"]}
        desc="Discovery to result — registration, document tracking, eligibility, rate analysis and bid submission in one workflow.">
        <Stat label="Live tenders" value={`${live.length}`} />
        <Stat label="Pipeline value" value={`₹${live.reduce((a, t) => a + t.value, 0).toFixed(0)} Cr`} />
        <Stat label="Submitted" value={`${s.tenders.filter((t) => t.stage >= 8).length}`} />
        <Stat label="Hit rate (12 mo)" value="31%" tone="ok" />
        <span className="flex gap-2">
          <Btn onClick={() => setRate(true)}><IFlask size={13} /> Rate Analysis</Btn>
          <AddBtn label="Register Tender" disabled={!can("tenders", "create")} tip="No create permission" onClick={() => setReg(true)} />
        </span>
      </PageHead>

      <Widget title="Tender Register" subtitle="Click a tender for the 10-stage workflow and document checklist">
        <FilterBar pageKey="tenders" q={q} onQ={setQ} filters={[]} />
        <DataTable pageKey="tenders" rows={rows} cols={cols} onRow={(t) => setDetail(t)} />
      </Widget>

      <Drawer wide open={!!detail} onClose={() => setDetail(null)} title={detail?.no ?? ""} sub={detail ? `${detail.authority} · ${detail.nit}` : ""}>
        {detail && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Stat label="Est. value" value={`₹${detail.value.toFixed(0)} Cr`} />
              <Stat label="EMD" value={`₹${detail.emd.toFixed(2)} L`} />
              <Stat label="Fee" value={`₹${detail.fee.toFixed(2)} L`} />
              <Stat label="Opening" value={detail.opening} />
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2.5">Workflow stage</p>
              <div className="grid grid-cols-5 gap-1.5">
                {STAGE_LABEL.map((st, i) => (
                  <div key={st} className={cx("rounded-md border px-2 py-1.5 text-center transition-all", i < detail.stage ? "border-brand-200 bg-brand-50" : i === detail.stage ? "border-brand-500 bg-brand-600" : "border-line bg-canvas/40")}>
                    <p className={cx("text-[8.5px] font-bold uppercase tracking-wide leading-tight", i === detail.stage ? "text-white" : i < detail.stage ? "text-brand-700" : "text-ink-300")}>{st}</p>
                  </div>
                ))}
              </div>
              {detail.stage < 9 && can("tenders", "edit") && (
                <Btn kind="primary" className="mt-3" onClick={() => advance(detail)}>
                  <ICheck size={12} /> Advance to “{STAGE_LABEL[Math.min(9, detail.stage + 1)]}”
                </Btn>
              )}
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Document checklist</p>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {Object.entries(detail.docs).map(([doc, ok]) => (
                  <button key={doc} onClick={() => toggleDoc(detail, doc)}
                    className={cx("flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-left transition-all active:scale-[0.98]", ok ? "border-ok-500/30 bg-ok-100/40" : "border-dashed border-line-strong bg-canvas/40 hover:border-amber-500/50")}>
                    <span className={cx("h-5 w-5 rounded-full grid place-items-center shrink-0", ok ? "bg-ok-500 text-white" : "border border-line-strong text-transparent")}>
                      <ICheck size={11} />
                    </span>
                    <span>
                      <span className={cx("block text-[12px] font-semibold", ok ? "text-ink-900" : "text-ink-500")}>{doc}</span>
                      <span className="block text-[10px] text-ink-300">{ok ? "Received & filed in DMS" : "Pending download"}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer open={reg} onClose={() => setReg(false)} title="Register Tender" sub="Tender discovery → registration">
        <div className="space-y-4">
          <Field label="Tender authority"><input className={inputCls} value={form.authority} onChange={(e) => setForm({ ...form, authority: e.target.value })} placeholder="e.g. NHAI — RO Mumbai" /></Field>
          <Field label="NIT number"><input className={inputCls} value={form.nit} onChange={(e) => setForm({ ...form, nit: e.target.value })} placeholder="NIT/2025-26/…" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Estimated value (₹ Cr)"><input type="number" className={inputCls} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0" /></Field>
            <Field label="EMD (₹ L)"><input type="number" className={inputCls} value={form.emd} onChange={(e) => setForm({ ...form, emd: e.target.value })} placeholder="0" /></Field>
          </div>
          <Field label="Submission deadline"><input className={inputCls} value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="e.g. 28 Apr 2026" /></Field>
          <div className="flex justify-end gap-2"><Btn onClick={() => setReg(false)}>Cancel</Btn><Btn kind="primary" onClick={register}>Register</Btn></div>
        </div>
      </Drawer>

      <Drawer open={rate} onClose={() => setRate(false)} title="Rate Analysis — Working Rate Builder" sub="Material + Labour + Machinery + Transport → Wastage → Overheads → Profit → GST">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Item description"><input className={inputCls} defaultValue="M40 Grade Concrete (RMC)" /></Field>
            <Field label="Unit"><div className="relative"><select className={selectCls} defaultValue="Cum">{["Cum", "MT", "Sqm", "RMT", "Nos"].map((u) => <option key={u}>{u}</option>)}</select><IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div></Field>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {([["material", "Material (₹)"], ["labour", "Labour (₹)"], ["machine", "Machinery (₹)"], ["transport", "Transport (₹)"], ["wastage", "Wastage %"], ["overhead", "Overheads %"], ["profit", "Profit %"], ["gst", "GST %"]] as const).map(([k, l]) => (
              <Field key={k} label={l}><input type="number" className={inputCls} value={(ra as any)[k]} onChange={(e) => setRa({ ...ra, [k]: parseFloat(e.target.value) || 0 })} /></Field>
            ))}
            <Field label="BOQ quantity"><input type="number" className={inputCls} value={ra.qty} onChange={(e) => setRa({ ...ra, qty: parseFloat(e.target.value) || 0 })} /></Field>
          </div>
          <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 space-y-1.5">
            {[
              ["Base cost (M+L+Mach+T)", unitRate],
              [`+ Wastage ${ra.wastage}%`, withWastage],
              [`+ Overheads ${ra.overhead}%`, withOH],
              [`+ Profit ${ra.profit}%`, withProfit],
            ].map(([l, v]) => (
              <div key={l as string} className="flex justify-between text-[12px]"><span className="text-ink-500">{l}</span><span className="num font-semibold text-ink-700">₹{(v as number).toFixed(2)}</span></div>
            ))}
            <div className="flex justify-between text-[13px] pt-2 mt-1 border-t border-brand-200"><span className="font-bold text-brand-700">Rate incl. GST ({ra.gst}%)</span><span className="num font-bold text-ink-900 text-[16px]">₹{finalRate.toFixed(2)}</span></div>
            <div className="flex justify-between text-[12px]"><span className="text-ink-500">BOQ amount ({ra.qty} units)</span><span className="num font-bold text-brand-700">₹{(finalRate * ra.qty / 1e5).toFixed(2)} L</span></div>
          </div>
          <p className="text-[11px] text-ink-400">Basis: CPWD DSR 2025 · project-specific market rates override DSR where recorded.</p>
        </div>
      </Drawer>
    </div>
  );
}

/* ═══ Plant & Machinery ═══════════════════════════════════════ */
export function PlantPage() {
  const { s, setS, can, log, notify } = useERP();
  const toast = useToast();
  const [q, setQ] = useState("");

  const rows = useMemo(() => s.equipment.filter((e) => (e.name + e.code + e.reg + e.project).toLowerCase().includes(q.toLowerCase())), [s.equipment, q]);
  const util = Math.round((s.equipment.filter((e) => e.status === "Operational").length / s.equipment.length) * 100);

  const maint = (code: string) => {
    setS((p) => ({ ...p, equipment: p.equipment.map((e) => e.code === code ? { ...e, status: "Under Maintenance" as const } : e) }));
    log("Plant & Machinery", "Maintenance Scheduled", code, "Preventive maintenance work order issued");
    notify("system", `${code} scheduled for maintenance`);
    toast("info", `${code} moved to maintenance`);
  };
  const deploy = (code: string) => {
    setS((p) => ({ ...p, equipment: p.equipment.map((e) => e.code === code ? { ...e, status: "Operational" as const } : e) }));
    log("Plant & Machinery", "Equipment Deployed", code, "Returned to operational fleet");
    toast("success", `${code} deployed`);
  };

  const cols: Col[] = [
    { key: "code", label: "Code", render: (e) => <span className="num text-[12px] font-bold text-brand-700">{e.code}</span> },
    { key: "name", label: "Equipment", render: (e) => <div><p className="text-[12.5px] font-semibold text-ink-900">{e.name}</p><p className="text-[10.5px] text-ink-400 num">{e.reg}</p></div> },
    { key: "cap", label: "Capacity", render: (e) => <span className="text-[12px] text-ink-500">{e.cap}</span> },
    { key: "project", label: "Allocated", render: (e) => <span className="text-[12px] num text-ink-500">{e.project}</span> },
    { key: "hrs", label: "Hour Metre", align: "right", sort: (e) => e.hrs, render: (e) => <span className="num text-[12px]">{e.hrs.toLocaleString("en-IN")} h</span> },
    { key: "fuel", label: "Fuel (L/hr)", align: "right", sort: (e) => e.fuel, render: (e) => <span className="num text-[12px]">{e.fuel}</span> },
    { key: "maintDue", label: "Next Service", render: (e) => <span className="num text-[11.5px] text-ink-500">{e.maintDue}</span> },
    { key: "status", label: "Status", render: (e) => <Pill value={e.status === "Operational" ? "On Track" : e.status === "Idle" ? "Pending" : e.status === "Under Maintenance" ? "Submitted" : "Delayed"} />, csv: (e) => e.status },
    { key: "act", label: "", render: (e) => can("plant", "edit") ? (
      e.status === "Operational"
        ? <Btn sm onClick={(ev: any) => { ev.stopPropagation(); maint(e.code); }}>Service</Btn>
        : e.status !== "Breakdown" ? <Btn sm kind="ok" onClick={(ev: any) => { ev.stopPropagation(); deploy(e.code); }}><ICheck size={11} /> Deploy</Btn> : null
    ) : null },
  ];

  return (
    <div className="fade-up">
      <PageHead title="Plant & Machinery" crumbs={["Meridian", "Operations", "Plant & Machinery"]}
        desc="Equipment master, allocation, hour metres, fuel consumption and maintenance planning.">
        <Stat label="Fleet" value={`${s.equipment.length}`} />
        <Stat label="Operational" value={`${s.equipment.filter((e) => e.status === "Operational").length}`} tone="ok" />
        <Stat label="Utilisation" value={`${util}%`} />
        <Stat label="In maintenance" value={`${s.equipment.filter((e) => e.status === "Under Maintenance").length}`} tone="warn" />
      </PageHead>
      <Widget title="Equipment Register" subtitle="Utilisation, fuel and service tracking per unit">
        <FilterBar pageKey="plant" q={q} onQ={setQ} filters={[]} />
        <DataTable pageKey="plant" rows={rows} cols={cols} />
      </Widget>
    </div>
  );
}

/* ═══ RMC Plant ═══════════════════════════════════════════════ */
export function RmcPage() {
  const { s, setS, can, log, notify, user } = useERP();
  const toast = useToast();
  const [clock, setClock] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setClock(new Date()), 1000); return () => clearInterval(t); }, []);

  const orderFlow: Record<string, string> = { Scheduled: "Batching", Batching: "In Transit", "In Transit": "Delivered" };

  const advanceOrder = (id: string) => {
    const o = s.rmcOrders.find((x) => x.id === id);
    if (!o) return;
    const next = orderFlow[o.status];
    setS((p) => ({
      ...p,
      rmcOrders: p.rmcOrders.map((x) => x.id === id ? { ...x, status: next as any } : x),
      batches: next === "Batching" ? [{ id: "bt" + Date.now(), order: o.no, grade: o.grade, qty: 6, cement: +(o.grade === "M40" ? 2.4 : 1.9).toFixed(1), sand: 3.8, agg: 6.1, admix: o.grade === "M40" ? 24 : 15, time: new Date().toTimeString().slice(0, 5), slump: 110 + Math.floor(Math.random() * 20), cubes: "3 × 150 mm" }, ...p.batches] : p.batches,
    }));
    log("RMC", `Order → ${next}`, o.no, `${o.grade} · ${o.qty} m³ for ${o.customer}`);
    if (next === "In Transit") notify("stock", `Dispatch ${o.no} left plant — ${o.qty} m³ ${o.grade}`);
    if (next === "Delivered") notify("project", `Concrete delivered — ${o.no} (${o.qty} m³)`);
    toast("success", `${o.no} → ${next}`);
  };

  const oCols: Col[] = [
    { key: "no", label: "Order", render: (o) => <span className="num text-[12px] font-bold text-brand-700">{o.no}</span> },
    { key: "customer", label: "Customer / Site", render: (o) => <div><p className="text-[12.5px] font-semibold text-ink-900">{o.customer}</p><p className="text-[10.5px] text-ink-400">{o.site}</p></div> },
    { key: "grade", label: "Grade", render: (o) => <span className="text-[10.5px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{o.grade}</span> },
    { key: "qty", label: "Qty (m³)", align: "right", sort: (o) => o.qty, render: (o) => <span className="num text-[12.5px] font-semibold">{o.qty}</span> },
    { key: "time", label: "Slot", render: (o) => <span className="num text-[11.5px] text-ink-500">{o.time}</span> },
    { key: "status", label: "Status", render: (o) => (
      <span className={cx("inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wide rounded-full px-2 py-0.5 border",
        o.status === "Delivered" ? "bg-ok-100 text-ok-600 border-ok-500/25" : o.status === "In Transit" ? "bg-brand-50 text-brand-700 border-brand-200" : o.status === "Batching" ? "bg-amber-100 text-amber-600 border-amber-500/25" : "bg-canvas text-ink-500 border-line")}>
        {o.status === "Batching" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />}
        {o.status === "In Transit" && <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse" />}
        {o.status}
      </span>) },
    { key: "act", label: "", render: (o) => o.status !== "Delivered" && can("rmc", "edit") ? (
      <Btn sm onClick={(ev: any) => { ev.stopPropagation(); advanceOrder(o.id); }}>{orderFlow[o.status] === "Batching" ? "Start Batching" : orderFlow[o.status] === "In Transit" ? "Dispatch" : "Mark Delivered"}</Btn>
    ) : null },
  ];

  const bCols: Col[] = [
    { key: "id", label: "Batch", render: (b) => <span className="num text-[11px] text-ink-400">B-{String(b.id).slice(-4)}</span> },
    { key: "order", label: "Order", render: (b) => <span className="num text-[12px] font-bold text-brand-700">{b.order}</span> },
    { key: "grade", label: "Grade", render: (b) => <span className="text-[12px] font-semibold text-ink-900">{b.grade}</span> },
    { key: "mix", label: "Mix (C/S/A kg per m³)", render: (b) => <span className="num text-[11.5px] text-ink-500">{(b.cement * 66).toFixed(0)} / {(b.sand * 66).toFixed(0)} / {(b.agg * 66).toFixed(0)}</span> },
    { key: "qty", label: "m³", align: "right", sort: (b) => b.qty, render: (b) => <span className="num text-[12px]">{b.qty}</span> },
    { key: "time", label: "Batched", render: (b) => <span className="num text-[11.5px] text-ink-500">{b.time}</span> },
    { key: "slump", label: "Slump (mm)", align: "right", sort: (b) => b.slump, render: (b) => <span className={cx("num text-[12px] font-semibold", b.slump < 100 || b.slump > 130 ? "text-amber-600" : "text-ok-600")}>{b.slump}</span> },
    { key: "cubes", label: "QC Cubes", render: (b) => <span className="text-[11.5px] text-ink-500">{b.cubes}</span> },
  ];

  return (
    <div className="fade-up">
      <PageHead title="RMC Plant — Unit 1" crumbs={["Meridian", "Operations", "RMC Plant"]}
        desc="Concrete orders, batching, transit dispatch and quality control for the ready-mix plant.">
        <span className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-md border border-line bg-surface num text-[12px] font-semibold text-ink-700">
          <IClock size={13} className="text-brand-600" /> {clock.toLocaleTimeString("en-IN")} · Plant online
        </span>
        <Stat label="Batched today" value="642 m³" sub="target 660 m³" />
        <Stat label="In transit" value={`${s.rmcOrders.filter((o) => o.status === "In Transit").length} loads`} />
        <Stat label="Plant utilisation" value="82%" tone="ok" />
        <Stat label="Cost / m³" value="₹5,840" />
      </PageHead>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Widget title="Concrete Orders & Dispatch" subtitle="Advance orders through batching → dispatch → delivery">
            <DataTable pageKey="rmc-orders" rows={s.rmcOrders} cols={oCols} pageSize={6} />
          </Widget>
        </div>
        <div className="space-y-4">
          <Widget title="Batch Records & QC" subtitle="Live from the batching console">
            <div className="space-y-2">
              {s.batches.slice(0, 4).map((b) => (
                <div key={b.id} className="border border-line rounded-lg px-3 py-2.5 hover:border-brand-200 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="num text-[11.5px] font-bold text-brand-700">{b.order} · {b.grade}</span>
                    <span className="num text-[10.5px] text-ink-400">{b.time}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10.5px] text-ink-500">
                    <span className="num">{b.qty} m³</span>
                    <span>Slump <b className={cx("num", b.slump >= 100 && b.slump <= 130 ? "text-ok-600" : "text-amber-600")}>{b.slump} mm</b></span>
                    <span>{b.cubes}</span>
                    <span className="ml-auto tip" data-tip="Cement / Sand / Aggregate per m³"><IFlask size={12} /></span>
                  </div>
                </div>
              ))}
            </div>
          </Widget>
          <Widget title="Raw Material Levels" subtitle="Silo & yard positions">
            <div className="space-y-2.5">
              {[["Cement (Silo 1)", 62, "186 MT"], ["Cement (Silo 2)", 38, "114 MT"], ["Fly Ash", 74, "96 MT"], ["20 mm Aggregate", 55, "410 MT"], ["M-Sand", 41, "260 MT"], ["Admixture PCE", 28, "2.1 KL"]].map(([l, v, q]) => (
                <div key={l as string}>
                  <div className="flex justify-between text-[11px] mb-1"><span className="font-medium text-ink-700">{l}</span><span className="num text-ink-500">{q} · <b className={cx((v as number) < 35 ? "text-danger-600" : "text-ink-700")}>{v}%</b></span></div>
                  <div className="h-[5px] rounded-full bg-line overflow-hidden"><div className={cx("h-full rounded-full transition-[width] duration-700", (v as number) < 35 ? "bg-danger-500" : (v as number) < 50 ? "bg-amber-500" : "bg-brand-500")} style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
          </Widget>
        </div>
      </div>
    </div>
  );
}
