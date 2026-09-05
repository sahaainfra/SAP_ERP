/* Part 1 · Commercial & Contracts — contracts, variations, extras, escalation, advances, rate analysis */
import { useMemo, useState } from "react";
import { useERP } from "../store";
import { CONTRACTS, fmtNum } from "../data";
import { Widget, Pill, Bar, cx, useToast } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Field, inputCls, Btn, Stat } from "./core";
import type { Col } from "./core";
import { IStamp } from "../icons";

const L = (v: number) => "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 2 });

type Tab = "contracts" | "variations" | "extras" | "escalation" | "advances" | "rates";

export default function CommercialPage() {
  const { s, can, log } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("contracts");
  const [q, setQ] = useState("");
  /* rate analysis state */
  const [ra, setRa] = useState({ item: "RCC M40 in pier caps & piers", unit: "Cu.M", mat: 4120, lab: 1480, mach: 620, carr: 210, waste: 2, oh: 5, profit: 8, gst: 18 });

  const contracts = useMemo(() => CONTRACTS.filter((c) => (c.name + c.client).toLowerCase().includes(q.toLowerCase())), [q]);
  const variations = s.variations.filter((v) => (v.project + v.no + v.desc).toLowerCase().includes(q.toLowerCase()));
  const extras = s.extras.filter((e) => (e.project + e.no + e.desc).toLowerCase().includes(q.toLowerCase()));

  const varPct = (v: any) => v.origQty ? +(((v.revQty - v.origQty) / v.origQty) * 100).toFixed(1) : 0;

  const cCols: Col[] = [
    { key: "name", label: "Contract / Client", render: (c) => <div><p className="text-[12.5px] font-semibold text-ink-900">{c.name}</p><p className="text-[10.5px] text-ink-400">{c.client}</p></div> },
    { key: "base", label: "Base (₹ Cr)", align: "right", sort: (c) => c.base, render: (c) => <span className="num text-[12.5px] font-semibold">{fmtNum(c.base, 1)}</span> },
    { key: "variation", label: "Variations", align: "right", sort: (c) => c.variation, render: (c) => <span className="num text-[12px] text-amber-600 font-semibold">+{c.variation.toFixed(1)}</span> },
    { key: "revised", label: "Revised", align: "right", sort: (c) => c.base + c.variation, render: (c) => <span className="num text-[12px] font-semibold">{fmtNum(c.base + c.variation, 1)}</span> },
    { key: "certified", label: "Certified", align: "right", sort: (c) => c.certified, render: (c) => <span className="num text-[12px]">{fmtNum(c.certified, 1)}</span> },
    { key: "margin", label: "Margin", align: "right", sort: (c) => c.margin, render: (c) => <span className={cx("num text-[11px] font-bold px-1.5 py-0.5 rounded", c.margin >= 11 ? "bg-ok-100 text-ok-600" : "bg-amber-100 text-amber-600")}>{c.margin}%</span> },
  ];

  const vCols: Col[] = [
    { key: "no", label: "VO No.", render: (v) => <span className="num text-[12px] font-bold text-brand-700">{v.no}</span> },
    { key: "project", label: "Project", render: (v) => <span className="num text-[12px] text-ink-500">{v.project}</span> },
    { key: "desc", label: "Description", render: (v) => <span className="text-[12.5px] font-medium text-ink-900">{v.desc}</span> },
    { key: "origQty", label: "Orig → Rev Qty", align: "right", sort: (v) => v.revQty, render: (v) => <span className="num text-[12px]">{v.origQty.toLocaleString("en-IN")} → <b>{v.revQty.toLocaleString("en-IN")}</b></span> },
    { key: "pct", label: "Var %", align: "right", sort: varPct, render: (v) => { const p = varPct(v); return <span className={cx("num text-[12px] font-bold", Math.abs(p) > 10 ? "text-danger-600" : p < 0 ? "text-ok-600" : "text-amber-600")}>{p > 0 ? "+" : ""}{p}%</span>; } },
    { key: "amount", label: "Value (₹ Cr)", align: "right", sort: (v) => v.amount, render: (v) => <span className="num text-[12.5px] font-semibold">{v.amount >= 0 ? "+" : ""}{v.amount.toFixed(2)}</span> },
    { key: "status", label: "Status", render: (v) => <Pill value={v.status === "Approved" ? "Completed" : v.status === "Proposed" ? "Pending" : "Submitted"} />, csv: (v) => v.status },
  ];

  const eCols: Col[] = [
    { key: "no", label: "EI No.", render: (e) => <span className="num text-[12px] font-bold text-brand-700">{e.no}</span> },
    { key: "project", label: "Project", render: (e) => <span className="num text-[12px] text-ink-500">{e.project}</span> },
    { key: "desc", label: "Extra Item", render: (e) => <div><p className="text-[12.5px] font-semibold text-ink-900">{e.desc}</p><p className="text-[10.5px] text-ink-400 mt-0.5">{e.spec} · dwg {e.drawing}</p></div> },
    { key: "qty", label: "Qty", align: "right", sort: (e) => e.qty, render: (e) => <span className="num text-[12px]">{e.qty.toLocaleString("en-IN")} {e.unit}</span> },
    { key: "rate", label: "Rate", align: "right", sort: (e) => e.rate, render: (e) => <span className="num text-[12px]">{e.rate.toLocaleString("en-IN")}</span> },
    { key: "amt", label: "Amount", align: "right", sort: (e) => e.qty * e.rate, render: (e) => <span className="num text-[12.5px] font-semibold">{L(e.qty * e.rate)}</span> },
    { key: "status", label: "Status", render: (e) => <Pill value={e.status === "Billed" ? "Completed" : e.status === "Execution" ? "On Track" : "Pending"} pulse={e.status === "Client Approval"} />, csv: (e) => e.status },
  ];

  /* rate analysis maths */
  const base = ra.mat + ra.lab + ra.mach + ra.carr;
  const withWaste = base * (1 + ra.waste / 100);
  const withOh = withWaste * (1 + ra.oh / 100);
  const withProfit = withOh * (1 + ra.profit / 100);
  const gstAmt = withProfit * (ra.gst / 100);
  const working = withProfit + gstAmt;

  const saveRate = () => {
    log("Commercial", "Rate Analysis Saved", ra.item, `Working rate ${L(working)}/${ra.unit} · source DSR 2024 + market`);
    toast("success", `Working rate ${L(working)}/${ra.unit} saved as reusable analysis`);
  };

  return (
    <div className="fade-up">
      <PageHead title="Commercial & Contracts" crumbs={["Meridian", "Commercial"]}
        desc="Contract values, variation orders, extra items, escalation claims, advance recoveries and CPWD DSR / DAR style rate analysis.">
        <Stat label="Contract value" value={`₹${fmtNum(CONTRACTS.reduce((a, c) => a + c.base + c.variation, 0), 0)} Cr`} />
        <Stat label="Variations" value={`${variations.length}`} tone="warn" />
        <Stat label="Extra items" value={`${extras.length}`} />
        <Stat label="Avg margin" value={`${(CONTRACTS.reduce((a, c) => a + c.margin, 0) / CONTRACTS.length).toFixed(1)}%`} tone="ok" />
      </PageHead>

      <Widget title={tab === "contracts" ? "Client Contracts" : tab === "variations" ? "Variation Orders" : tab === "extras" ? "Extra Items" : tab === "escalation" ? "Price Escalation Claims" : tab === "advances" ? "Advances & Recoveries" : "Rate Analysis — CPWD DSR / DAR / Market"}
        subtitle={tab === "rates" ? "Material + Labour + Machinery + Carriage, then wastage, overheads, profit and GST → working rate" : "Revised values never overwrite approved revisions — every change is versioned"}>
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={[
          { k: "contracts" as Tab, l: "Contracts", n: CONTRACTS.length }, { k: "variations" as Tab, l: "Variations", n: s.variations.length },
          { k: "extras" as Tab, l: "Extra Items", n: s.extras.length }, { k: "escalation" as Tab, l: "Escalation", n: s.escalations.length },
          { k: "advances" as Tab, l: "Advances", n: s.advances.length }, { k: "rates" as Tab, l: "Rate Analysis" }]} /></div>

        {tab !== "rates" && <FilterBar pageKey={"com-" + tab} q={q} onQ={setQ} filters={[]} />}

        {tab === "contracts" && <DataTable pageKey="contracts" rows={contracts} cols={cCols} />}
        {tab === "variations" && <DataTable pageKey="variations" rows={variations} cols={vCols} empty={{ title: "No variation orders", note: "Variations raised against BOQ quantities appear here with approval status." }} />}
        {tab === "extras" && <DataTable pageKey="extras" rows={extras} cols={eCols} empty={{ title: "No extra items", note: "Extra items require rate analysis and client approval before billing." }} />}

        {tab === "escalation" && (
          <DataTable pageKey="escalation" rows={s.escalations} cols={[
            { key: "no", label: "Claim", render: (e) => <span className="num text-[12px] font-bold text-brand-700">{e.no}</span> },
            { key: "project", label: "Project", render: (e) => <span className="num text-[12px] text-ink-500">{e.project}</span> },
            { key: "head", label: "Head", render: (e) => <span className="text-[12.5px] font-semibold text-ink-900">{e.head}</span> },
            { key: "idx", label: "Base → Current Index", align: "right", render: (e) => <span className="num text-[12px]">{e.baseIndex} → <b>{e.currentIndex}</b></span> },
            { key: "w", label: "Weightage", align: "right", sort: (e) => e.weightage, render: (e) => <span className="num text-[12px]">{e.weightage}%</span> },
            { key: "factor", label: "Factor", align: "right", render: (e) => <span className="num text-[12px] font-semibold">{(e.currentIndex / e.baseIndex).toFixed(3)}</span> },
            { key: "amt", label: "Eligible (₹ Cr)", align: "right", sort: (e) => e.eligibleAmt, render: (e) => <span className="num text-[12.5px] font-semibold">{(e.eligibleAmt / 1e7).toFixed(2)}</span> },
          ] as Col[]} />
        )}

        {tab === "advances" && (
          <DataTable pageKey="advances" rows={s.advances} cols={[
            { key: "no", label: "Advance", render: (a) => <span className="num text-[12px] font-bold text-brand-700">{a.no}</span> },
            { key: "project", label: "Project", render: (a) => <span className="num text-[12px] text-ink-500">{a.project}</span> },
            { key: "kind", label: "Type", render: (a) => <span className="text-[10.5px] font-bold uppercase bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{a.kind}</span> },
            { key: "paid", label: "Paid (₹ Cr)", align: "right", sort: (a) => a.paid, render: (a) => <span className="num text-[12.5px] font-semibold">{(a.paid / 1e7).toFixed(2)}</span> },
            { key: "recPct", label: "Recovery %", align: "right", render: (a) => <span className="num text-[12px]">{a.recPct}% / bill</span> },
            { key: "recovered", label: "Recovered", render: (a) => { const pct = (a.recovered / a.paid) * 100; return (
              <div className="w-[140px]"><div className="flex justify-between text-[10.5px] mb-1"><span className="num text-ink-400">{(a.recovered / 1e7).toFixed(2)} Cr</span><span className="num font-semibold text-ink-700">{pct.toFixed(0)}%</span></div><Bar value={pct} h={5} /></div>); } },
            { key: "bal", label: "Balance (₹ Cr)", align: "right", sort: (a) => a.paid - a.recovered, render: (a) => <span className="num text-[12.5px] font-bold text-ink-900">{((a.paid - a.recovered) / 1e7).toFixed(2)}</span> },
          ] as Col[]} />
        )}

        {tab === "rates" && (
          <div className="grid lg:grid-cols-[1fr_360px] gap-5">
            <div className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="BOQ item"><input className={inputCls} value={ra.item} onChange={(e) => setRa({ ...ra, item: e.target.value })} /></Field>
                <Field label="Unit"><input className={inputCls} value={ra.unit} onChange={(e) => setRa({ ...ra, unit: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([["mat", "Material (₹)"], ["lab", "Labour (₹)"], ["mach", "Machinery (₹)"], ["carr", "Carriage/Lead (₹)"]] as const).map(([k, l]) => (
                  <Field key={k} label={l}><input type="number" className={inputCls} value={ra[k]} onChange={(e) => setRa({ ...ra, [k]: parseFloat(e.target.value) || 0 })} /></Field>))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([["waste", "Wastage %"], ["oh", "Overheads %"], ["profit", "Contractor Profit %"], ["gst", "GST %"]] as const).map(([k, l]) => (
                  <Field key={k} label={l}><input type="number" className={inputCls} value={ra[k]} onChange={(e) => setRa({ ...ra, [k]: parseFloat(e.target.value) || 0 })} /></Field>))}
              </div>
              <p className="text-[11px] text-ink-400 bg-canvas border border-line rounded-md px-3 py-2">
                Sources preserved separately: CPWD DSR 2024 base rates, DAR district factors and last market quotations remain on record — only the working rate is adjustable by authorized users.
              </p>
              <div className="flex justify-end"><Btn kind="primary" disabled={!can("commercial", "create")} onClick={saveRate}><IStamp size={13} /> Save Reusable Analysis</Btn></div>
            </div>
            <div className="rounded-xl border border-line bg-canvas/40 p-4 self-start">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-3">Analysis — {ra.item}</p>
              {[
                ["Material", ra.mat], ["Labour", ra.lab], ["Machinery", ra.mach], ["Carriage / Lead", ra.carr],
              ].map(([k, v]) => <div key={k as string} className="flex justify-between text-[12px] py-1"><span className="text-ink-500">{k}</span><span className="num font-semibold text-ink-900">{L(v as number)}</span></div>)}
              <div className="flex justify-between text-[12px] py-1 border-t border-line mt-1 pt-2"><span className="text-ink-500">+ Wastage {ra.waste}%</span><span className="num">{L(withWaste - base)}</span></div>
              <div className="flex justify-between text-[12px] py-1"><span className="text-ink-500">+ Overheads {ra.oh}%</span><span className="num">{L(withOh - withWaste)}</span></div>
              <div className="flex justify-between text-[12px] py-1"><span className="text-ink-500">+ Contractor profit {ra.profit}%</span><span className="num">{L(withProfit - withOh)}</span></div>
              <div className="flex justify-between text-[12px] py-1"><span className="text-ink-500">+ GST {ra.gst}%</span><span className="num">{L(gstAmt)}</span></div>
              <div className="flex justify-between items-center border-t-2 border-line-strong mt-2 pt-3">
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">Working rate / {ra.unit}</span>
                <span className="num text-[22px] font-bold text-ink-900">{L(working)}</span>
              </div>
            </div>
          </div>
        )}
      </Widget>
    </div>
  );
}
