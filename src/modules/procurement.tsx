/* Procurement suite — PR tool, live chain (PR→RFQ→CS→PO→GRN→INV→PAY), PO tool */
import { useEffect, useMemo, useState } from "react";
import { useERP, TERMS_LIBRARY, PURCHASE_MEMORY, dStr, PROC_STAGES, PROC_LABEL } from "../store";
import type { PRDoc, PRLine, PODoc, POLine, ProcDoc, ProcType } from "../store";
import { Pill, Widget, cx, useToast } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat, AddBtn } from "./core";
import type { Col } from "./core";
import { printDocument, inrWords } from "../print";
import { IChevD, ICheck, IXCircle, IPlus, IX, IArrowUp, IArrowDown, IPrinter, IStamp, ICart, IEye, ITruck, IReceipt, IRupee } from "../icons";

const money = (v: number) => "₹" + Math.round(v).toLocaleString("en-IN");
const L = (v: number) => "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 1 }) + " L";

/* ════════ 1 · PURCHASE REQUISITIONS ════════ */
const PR_TABS: { k: string; l: string; m: (s: string) => boolean }[] = [
  { k: "all", l: "All", m: () => true },
  { k: "draft", l: "Drafts", m: (s) => s === "Draft" || s === "Returned" },
  { k: "appr", l: "In Approval", m: (s) => s === "Submitted" || s === "Under Approval" },
  { k: "approved", l: "Approved", m: (s) => s === "Approved" },
  { k: "conv", l: "Converted", m: (s) => s.includes("Converted") },
  { k: "done", l: "Closed / Rejected", m: (s) => s === "Closed" || s === "Rejected" },
];
const prTotal = (p: PRDoc) => p.lines.reduce((a, l) => a + l.qty * l.rate, 0);

export function PRPage({ openCreate }: { openCreate?: boolean }) {
  const { s, setS, can, log, notify, nextCode, user } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [fProj, setFProj] = useState("");
  const [view, setView] = useState<PRDoc | null>(null);
  const [creating, setCreating] = useState(!!openCreate);
  useEffect(() => { if (openCreate) setCreating(true); }, [openCreate]);

  const budgetFor = (code: string) => { const p = s.projects.find((x) => x.code === code); return !p ? "Available" : p.budgetUtil < 75 ? "Available" : p.budgetUtil <= 90 ? "Tight" : "Over Budget"; };
  const stockFor = (desc: string) => s.stock.find((st) => st.material === desc);

  const rows = useMemo(() => s.prs.filter((p) =>
    PR_TABS.find((t) => t.k === tab)!.m(p.status) && (!fProj || p.project === fProj) &&
    (p.no + p.purpose + p.by + p.lines.map((l) => l.desc).join(" ")).toLowerCase().includes(q.toLowerCase())
  ), [s.prs, tab, fProj, q]);

  const setStatus = (p: PRDoc, status: PRDoc["status"], note?: string) => {
    setS((st) => ({ ...st, prs: st.prs.map((x) => x.id === p.id ? { ...x, status, history: [...x.history, { ts: Date.now(), action: note ?? status, by: user.name }] } : x) }));
    log("Procurement", `PR ${status}`, p.no, note ?? `${p.lines.length} items · ${p.project}`);
  };

  const printPR = (p: PRDoc) => printDocument({
    title: "Purchase Requisition", docNo: p.no, date: p.date,
    project: `${p.project} — ${s.projects.find((x) => x.code === p.project)?.name ?? ""}`,
    meta: [["Department", p.dept], ["Site", p.site], ["Requested By", p.by], ["Required By", p.need], ["Priority", p.priority], ["Cost Centre", p.costCentre], ["Budget Status", budgetFor(p.project)]],
    cols: [
      { label: "Item / Description" }, { label: "Specification" }, { label: "Make", align: "center" }, { label: "Unit", align: "center" },
      { label: "Qty", align: "right" }, { label: "BOQ Ref", align: "center" }, { label: "Est. Rate", align: "right" }, { label: "Est. Amount", align: "right" },
    ],
    rows: p.lines.map((l) => [`${l.code} — ${l.desc}`, l.spec || "—", l.brand || "—", l.unit, l.qty, `${l.boqRef} / ${l.boqNo}`, l.rate, l.qty * l.rate]),
    totalsLabel: "Estimated Value", totals: [Math.round(prTotal(p))], inWords: prTotal(p),
    purpose: p.purpose,
    remarks: "Stock checked at raising. Rates suggested from previous purchases; final value to be settled through RFQ → comparative statement → PO as per the approval authority matrix.",
    signatures: ["Prepared By", "Requested By", "Checked By", "Approved By"],
    generatedBy: user.name,
  });

  const cols: Col[] = [
    { key: "no", label: "PR No.", sort: (p) => p.no, render: (p) => (
      <div className="flex items-center gap-2">
        <span className={cx("h-2 w-2 rounded-full shrink-0", p.priority === "Critical" ? "bg-danger-500 animate-pulse-dot" : p.priority === "Urgent" ? "bg-amber-500" : "bg-line-strong")} title={p.priority} />
        <div><p className="num text-[12.5px] font-bold text-brand-700">{p.no}</p><p className="text-[10px] text-ink-300 num">{p.date}</p></div>
      </div>) },
    { key: "project", label: "Project / Dept", render: (p) => <div><p className="text-[12.5px] font-semibold text-ink-900">{p.project} · {p.dept}</p><p className="text-[10.5px] text-ink-400">{p.site}</p></div> },
    { key: "by", label: "Requested by", render: (p) => <span className="text-[12px] text-ink-700">{p.by}</span> },
    { key: "items", label: "Items", align: "center", sort: (p) => p.lines.length, render: (p) => <span className="num text-[12px] font-semibold">{p.lines.length}</span> },
    { key: "amount", label: "Est. Value", align: "right", sort: prTotal, render: (p) => <span className="num text-[12.5px] font-semibold text-ink-900">{money(prTotal(p))}</span> },
    { key: "need", label: "Required by", render: (p) => <span className="num text-[11.5px] text-ink-500">{p.need}</span> },
    { key: "budget", label: "Budget", render: (p) => { const b = budgetFor(p.project); return <span className={cx("text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border", b === "Available" ? "text-ok-600 bg-ok-100 border-ok-500/25" : b === "Tight" ? "text-amber-600 bg-amber-100 border-amber-500/25" : "text-danger-600 bg-danger-100 border-danger-500/25")}>{b}</span>; } },
    { key: "status", label: "Status", render: (p) => <Pill value={p.status} pulse={p.status === "Submitted" || p.status === "Under Approval"} />, csv: (p) => p.status },
    { key: "act", label: "Actions", render: (p: PRDoc) => (
      <span className="flex items-center gap-1 justify-end">
        {can("procurement", "approve") && (p.status === "Submitted" || p.status === "Under Approval") && <>
          <Btn sm kind="ok" onClick={(e: any) => { e.stopPropagation(); setStatus(p, "Approved"); notify("approval", `${p.no} approved — ready for PO conversion`); toast("success", `${p.no} approved`); }}><ICheck size={11} /></Btn>
          <Btn sm kind="danger" onClick={(e: any) => { e.stopPropagation(); setStatus(p, "Rejected", "Rejected — not budgeted / duplicate"); toast("info", `${p.no} rejected`); }}><IXCircle size={11} /></Btn>
          <Btn sm onClick={(e: any) => { e.stopPropagation(); setStatus(p, "Returned", "Returned for correction — verify BOQ reference"); toast("info", `${p.no} returned for correction`); }}>Return</Btn>
        </>}
        <Btn sm onClick={(e: any) => { e.stopPropagation(); setView(p); }}><IEye size={11} /></Btn>
        <Btn sm onClick={(e: any) => { e.stopPropagation(); printPR(p); }}><IPrinter size={11} /></Btn>
      </span>) },
  ];

  const openPRs = s.prs.filter((p) => !["Rejected", "Closed", "Fully Converted"].includes(p.status));

  return (
    <div className="fade-up">
      <PageHead title="Purchase Requisitions" crumbs={["Meridian", "Supply Chain", "Purchase Requisitions"]}
        desc="Material requirements raised against project BOQ & budget — stock-checked, with prior-purchase rate suggestions and a full approval lifecycle.">
        <Stat label="Open PRs" value={`${openPRs.length}`} />
        <Stat label="In approval" value={`${s.prs.filter((p) => ["Submitted", "Under Approval"].includes(p.status)).length}`} tone="warn" />
        <Stat label="Urgent / Critical" value={`${s.prs.filter((p) => p.priority !== "Normal" && !["Closed", "Rejected"].includes(p.status)).length}`} tone="danger" />
        <Stat label="Open value" value={money(openPRs.reduce((a, p) => a + prTotal(p), 0))} />
        <AddBtn label="New PR" disabled={!can("procurement", "create")} tip="No create permission" onClick={() => setCreating(true)} />
      </PageHead>

      <Widget title="Requisition Register" subtitle="Draft → Submitted → Under Approval → Approved → Converted to PO → Closed">
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={PR_TABS.map((t) => ({ k: t.k, l: t.l, n: s.prs.filter((p) => t.m(p.status)).length })) as any} /></div>
        <FilterBar pageKey="pr" q={q} onQ={setQ} filters={[{ key: "project", label: "Project", value: fProj, options: [...new Set(s.prs.map((p) => p.project))], onChange: setFProj }]} />
        <DataTable pageKey="pr-register" rows={rows} cols={cols} onRow={(p) => setView(p)} />
      </Widget>

      <Drawer wide open={!!view} onClose={() => setView(null)} title={`Purchase Requisition · ${view?.no}`} sub={view ? `${view.project} · raised by ${view.by} · ${view.date}` : ""}>
        {view && (() => {
          const p = s.prs.find((x) => x.id === view.id) ?? view;
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[["Priority", p.priority], ["Required by", p.need], ["Cost centre", p.costCentre], ["Department", p.dept], ["Site", p.site], ["Budget", budgetFor(p.project)]].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-line bg-canvas/50 px-3 py-2"><p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-400">{k}</p><p className="text-[12.5px] font-semibold text-ink-900 mt-0.5">{v}</p></div>
                ))}
              </div>
              <div className="rounded-lg border border-brand-200 bg-brand-50/50 p-3.5"><p className="text-[10px] font-bold uppercase tracking-wide text-brand-700">Purpose / Requirement</p><p className="text-[12.5px] text-ink-700 mt-1 leading-relaxed">{p.purpose}</p></div>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-left min-w-[720px]">
                  <thead><tr className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
                    <th className="font-bold pb-2 pr-3">Sr</th><th className="font-bold pb-2 pr-3">Item</th><th className="font-bold pb-2 pr-3">Specification</th>
                    <th className="font-bold pb-2 pr-3">BOQ</th><th className="font-bold pb-2 pr-3 text-right">Qty</th><th className="font-bold pb-2 pr-3 text-right">In Stock</th>
                    <th className="font-bold pb-2 pr-3 text-right">Est. Rate</th><th className="font-bold pb-2 text-right">Est. Amount</th>
                  </tr></thead>
                  <tbody>{p.lines.map((l, i) => {
                    const stk = stockFor(l.desc); const short = stk && stk.onHand < l.qty;
                    return (
                      <tr key={l.id} className="border-t border-line/80 align-top">
                        <td className="py-2.5 pr-3 num text-[11px] text-ink-400">{i + 1}</td>
                        <td className="py-2.5 pr-3"><p className="text-[12.5px] font-semibold text-ink-900">{l.code} · {l.desc}</p><p className="text-[10.5px] text-ink-400 mt-0.5">{l.brand} · {l.unit}</p></td>
                        <td className="py-2.5 pr-3 text-[11.5px] text-ink-500 max-w-[200px]">{l.spec}</td>
                        <td className="py-2.5 pr-3 num text-[11px] text-ink-500">{l.boqRef}<br />{l.boqNo}</td>
                        <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold">{l.qty.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 pr-3 text-right">
                          {stk ? <span className={cx("num text-[11.5px] font-semibold", short ? "text-danger-600" : "text-ok-600")}>{stk.onHand.toLocaleString("en-IN")}</span> : <span className="text-[10.5px] text-ink-300">Not stocked</span>}
                          {short && stk && <p className="text-[9px] font-bold uppercase text-danger-600">short {(l.qty - stk.onHand).toLocaleString("en-IN")}</p>}
                        </td>
                        <td className="py-2.5 pr-3 text-right num text-[12px]">{money(l.rate)}</td>
                        <td className="py-2.5 text-right num text-[12.5px] font-semibold text-ink-900">{money(l.qty * l.rate)}</td>
                      </tr>);
                  })}
                    <tr className="border-t-2 border-line-strong"><td colSpan={7} className="py-2.5 pr-3 text-right text-[11px] font-extrabold uppercase tracking-wide text-ink-500">Estimated Value</td>
                      <td className="py-2.5 text-right num text-[14px] font-bold text-ink-900">{money(prTotal(p))}</td></tr>
                  </tbody>
                </table>
              </div>
              {p.lines.map((l) => PURCHASE_MEMORY[l.desc] ? (
                <p key={l.id} className="text-[11px] text-ink-400 bg-canvas border border-line rounded-md px-3 py-2">
                  <b className="text-ink-700">Previous purchase — {l.desc}:</b> {PURCHASE_MEMORY[l.desc].vendor} @ {money(PURCHASE_MEMORY[l.desc].rate)}/{l.unit} · {PURCHASE_MEMORY[l.desc].po} · {PURCHASE_MEMORY[l.desc].date}
                </p>) : null)}
              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Activity history</p>
                <ol className="space-y-1.5">{[...p.history].reverse().map((h, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-[12px]"><span className="h-1.5 w-1.5 rounded-full bg-brand-500 shrink-0" /><span className="text-ink-700 font-medium">{h.action}</span><span className="ml-auto num text-[10.5px] text-ink-300">{h.by} · {new Date(h.ts).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span></li>
                ))}</ol>
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-line">
                <Btn onClick={() => printPR(p)}><IPrinter size={13} /> Print PR</Btn>
                {can("procurement", "approve") && ["Submitted", "Under Approval"].includes(p.status) && <>
                  <Btn kind="danger" onClick={() => { setStatus(p, "Rejected"); toast("info", `${p.no} rejected`); }}>Reject</Btn>
                  <Btn onClick={() => { setStatus(p, "Returned", "Returned for correction"); toast("info", `${p.no} returned`); }}>Return for Correction</Btn>
                  <Btn kind="ok" onClick={() => { setStatus(p, "Approved"); notify("approval", `${p.no} approved`); toast("success", `${p.no} approved`); }}><ICheck size={13} /> Approve</Btn>
                </>}
              </div>
            </div>
          );
        })()}
      </Drawer>

      <CreatePR open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function CreatePR({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { s, setS, log, notify, nextCode, user } = useERP();
  const toast = useToast();
  const blank: PRLine = { id: "n1", code: "", desc: "", spec: "", brand: "", unit: "", boqRef: "", boqNo: "", qty: 0, rate: 0, remarks: "" };
  const [f, setF] = useState({ project: "PRJ-016", dept: "Project Execution", site: "Site Office", need: dStr(10), priority: "Normal" as PRDoc["priority"], purpose: "", costCentre: "CC-PRJ-016-MAT" });
  const [lines, setLines] = useState<PRLine[]>([{ ...blank }]);
  const setLine = (id: string, patch: Partial<PRLine>) => setLines((ls) => ls.map((l) => l.id === id ? { ...l, ...patch } : l));
  const total = lines.reduce((a, l) => a + l.qty * l.rate, 0);
  const prj = s.projects.find((p) => p.code === f.project);
  const budget = prj ? (prj.budgetUtil < 75 ? "Available" : prj.budgetUtil <= 90 ? "Tight" : "Over Budget") : "Available";

  const pickMaterial = (id: string, name: string) => {
    const m = s.materials.find((x) => x.name === name);
    const mem = PURCHASE_MEMORY[name];
    const stk = s.stock.find((x) => x.material === name);
    const absRate = mem?.rate ?? Math.round((m?.rate ?? 0) * 1e7) / 100;
    setLine(id, { desc: name, code: m?.code ?? "MAT-099", unit: m?.unit ?? "Nos", rate: absRate || 0, spec: mem ? `As per ${mem.po}` : "As per approved specification", brand: mem?.vendor ?? "Any approved", boqRef: `BOQ-${f.project}`, boqNo: "—", remarks: stk ? `In stock: ${stk.onHand} ${m?.unit ?? ""}` : "" });
  };

  const save = (status: "Draft" | "Submitted") => {
    if (!f.purpose.trim()) { toast("error", "Purpose / requirement description is mandatory"); return; }
    const valid = lines.filter((l) => l.desc && l.qty > 0);
    if (!valid.length) { toast("error", "Add at least one line item with quantity"); return; }
    const no = nextCode("PR");
    const doc: PRDoc = { id: "pr" + Date.now(), no, date: dStr(0), project: f.project, dept: f.dept, site: f.site, by: user.name, need: f.need, priority: f.priority, purpose: f.purpose, costCentre: f.costCentre, lines: valid, status, ts: Date.now(), history: [{ ts: Date.now(), action: status === "Draft" ? "Saved as Draft" : "Submitted for approval", by: user.name }] };
    setS((st) => ({ ...st, prs: [doc, ...st.prs] }));
    log("Procurement", status === "Draft" ? "PR Saved as Draft" : "PR Submitted", no, `${valid.length} items · ${money(total)} · ${f.project}`);
    if (status === "Submitted") notify("approval", `${no} (${money(total)}) submitted for approval`);
    toast("success", status === "Draft" ? `${no} saved as draft` : `${no} submitted — routed per authority matrix`);
    setLines([{ ...blank }]); setF({ ...f, purpose: "" });
    onClose();
  };

  return (
    <Drawer wide open={open} onClose={onClose} title="New Purchase Requisition" sub="PR number auto-generated on save · stock & budget verified live">
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Project / Cost centre">
            <div className="relative"><select className={selectCls} value={f.project} onChange={(e) => setF({ ...f, project: e.target.value, costCentre: `CC-${e.target.value}-MAT` })}>
              {s.projects.filter((p) => p.status !== "Completed").map((p) => <option key={p.code} value={p.code}>{p.code} — {p.name.slice(0, 26)}</option>)}</select>
              <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
          </Field>
          <Field label="Department"><input className={inputCls} value={f.dept} onChange={(e) => setF({ ...f, dept: e.target.value })} /></Field>
          <Field label="Site location"><input className={inputCls} value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} /></Field>
          <Field label="Required delivery date"><input className={inputCls} value={f.need} onChange={(e) => setF({ ...f, need: e.target.value })} /></Field>
          <Field label="Priority">
            <div className="relative"><select className={selectCls} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as any })}>
              {["Normal", "Urgent", "Critical"].map((p) => <option key={p}>{p}</option>)}</select>
              <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
          </Field>
          <Field label="Budget availability">
            <div className={cx("h-8 px-2.5 rounded-md border text-[12px] font-bold flex items-center", budget === "Available" ? "border-ok-500/30 bg-ok-100/40 text-ok-600" : budget === "Tight" ? "border-amber-500/30 bg-amber-100/40 text-amber-600" : "border-danger-500/30 bg-danger-100/40 text-danger-600")}>
              {budget}{prj ? ` · utilised ${prj.budgetUtil}%` : ""}
            </div>
          </Field>
        </div>
        <Field label="Purpose / requirement description"><textarea rows={2} className={cx(inputCls, "h-auto py-2")} value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} placeholder="Why is this material required, and the impact if delayed…" /></Field>

        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Item table</p>
            <Btn sm onClick={() => setLines((ls) => [...ls, { ...blank, id: "n" + Date.now() }])}><IPlus size={11} /> Add row</Btn>
          </div>
          <div className="space-y-2">
            {lines.map((l, i) => {
              const stk = s.stock.find((x) => x.material === l.desc);
              const mem = PURCHASE_MEMORY[l.desc];
              return (
                <div key={l.id} className="rounded-lg border border-line p-3 bg-canvas/40 space-y-2">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <Field label={`Item ${i + 1}`}>
                      <div className="relative"><select className={selectCls} value={l.desc} onChange={(e) => pickMaterial(l.id, e.target.value)}>
                        <option value="">Select material…</option>{s.materials.map((m) => <option key={m.code} value={m.name}>{m.name}</option>)}</select>
                        <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
                    </Field>
                    <Field label="Required qty"><input type="number" className={inputCls} value={l.qty || ""} onChange={(e) => setLine(l.id, { qty: parseFloat(e.target.value) || 0 })} /></Field>
                    <Field label={`Est. rate (₹ / ${l.unit || "unit"})`}><input type="number" className={inputCls} value={l.rate || ""} onChange={(e) => setLine(l.id, { rate: parseFloat(e.target.value) || 0 })} /></Field>
                    <Field label="BOQ item no."><input className={inputCls} value={l.boqNo} onChange={(e) => setLine(l.id, { boqNo: e.target.value })} placeholder="e.g. 2.4" /></Field>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <Field label="Specification"><input className={inputCls} value={l.spec} onChange={(e) => setLine(l.id, { spec: e.target.value })} /></Field>
                    <Field label="Make / Brand"><input className={inputCls} value={l.brand} onChange={(e) => setLine(l.id, { brand: e.target.value })} /></Field>
                    <Field label="Remarks"><input className={inputCls} value={l.remarks} onChange={(e) => setLine(l.id, { remarks: e.target.value })} /></Field>
                    <div className="flex items-end gap-2">
                      <div className="flex-1 rounded-md border border-line bg-surface px-2.5 h-8 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-ink-400">Amount</span>
                        <span className="num text-[12px] font-bold text-ink-900">{money(l.qty * l.rate)}</span>
                      </div>
                      <button onClick={() => setLines((ls) => ls.filter((x) => x.id !== l.id))} disabled={lines.length === 1}
                        className="h-8 w-8 grid place-items-center rounded-md border border-line text-ink-400 hover:text-danger-600 hover:border-danger-500/40 disabled:opacity-30 transition-all active:scale-90"><IX size={13} /></button>
                    </div>
                  </div>
                  {l.desc && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px] text-ink-400 pt-1 border-t border-line/60">
                      <span>Available stock: <b className={cx("num", stk && stk.onHand < l.qty ? "text-danger-600" : "text-ok-600")}>{stk ? `${stk.onHand.toLocaleString("en-IN")} ${l.unit}` : "not stocked"}</b></span>
                      {mem && <span>Previous: <b className="text-ink-700">{mem.vendor}</b> @ <b className="num text-ink-700">{money(mem.rate)}</b> · {mem.po}</span>}
                      <span className="num">{l.code} · {l.boqRef}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-3 mt-3">
            <span className="text-[11px] font-bold uppercase tracking-wide text-ink-400">Estimated value</span>
            <span className="num text-[19px] font-bold text-ink-900">{money(total)}</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-line">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => save("Draft")}>Save as Draft</Btn>
          <Btn kind="primary" onClick={() => save("Submitted")}><IStamp size={13} /> Submit for Approval</Btn>
        </div>
      </div>
    </Drawer>
  );
}

/* ════════ 2 · PROCUREMENT CHAIN ════════ */
const STAGES: ProcType[] = PROC_STAGES;
const STAGE_LABEL: Record<string, string> = PROC_LABEL;

export default function ProcurementPage() {
  const { s, setS, can, log, notify, nextCode, user } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<string>("all");
  const [q, setQ] = useState("");
  const [chain, setChain] = useState<ProcDoc | null>(null);

  const docs = s.proc;
  const rows = useMemo(() => docs.filter((d) =>
    (tab === "all" || d.type === tab) && (d.code + d.party + d.items + d.project).toLowerCase().includes(q.toLowerCase())
  ), [docs, tab, q]);

  const addDoc = (d: Omit<ProcDoc, "id">) => setS((p) => ({ ...p, proc: [...p.proc, { ...d, id: "d" + Date.now() + Math.floor(Math.random() * 99) }] }));
  const setStatus = (d: ProcDoc, status: string) => setS((p) => ({ ...p, proc: p.proc.map((x) => x.id === d.id ? { ...x, status } : x) }));

  const lineage = (d: ProcDoc): ProcDoc[] => {
    const list: ProcDoc[] = [d];
    let cur = d;
    while (cur.ref) { const parent = docs.find((x) => x.code === cur.ref); if (!parent) break; list.unshift(parent); cur = parent; }
    cur = d;
    for (let g = 0; g < 8; g++) { const child = docs.find((x) => x.ref === cur.code); if (!child) break; list.push(child); cur = child; }
    return list.sort((a, b) => STAGES.indexOf(a.type as any) - STAGES.indexOf(b.type as any));
  };

  const actionsFor = (d: ProcDoc) => {
    if (d.type === "PR" && d.status === "Approved") return <Btn sm onClick={(e: any) => { e.stopPropagation(); const code = nextCode("RFQ"); addDoc({ code, type: "RFQ", ref: d.code, project: d.project, party: "3 vendors invited", items: d.items, qty: d.qty, unit: d.unit, amount: d.amount, date: dStr(0), status: "Open", by: user.name }); log("Procurement", "RFQ Floated", code, `Against ${d.code} — ${d.items}`); toast("success", `${code} floated`); }}>Raise RFQ</Btn>;
    if (d.type === "RFQ" && d.status === "Open") return <Btn sm onClick={(e: any) => { e.stopPropagation(); const code = nextCode("CS"); setStatus(d, "Closed"); addDoc({ code, type: "CS", ref: d.code, project: d.project, party: "L1 recommended", items: d.items, qty: d.qty, unit: d.unit, amount: +(d.amount * 0.982).toFixed(1), date: dStr(0), status: "L1 Recommended", by: user.name }); log("Procurement", "Comparative Statement", code, `L1 recommended for ${d.ref}`); toast("success", `${code} — L1 recommended`); }}>Prepare CS</Btn>;
    if (d.type === "CS" && !docs.some((x) => x.ref === d.code)) return <Btn sm onClick={(e: any) => { e.stopPropagation(); const code = nextCode("PO"); addDoc({ code, type: "PO", ref: d.code, project: d.project, party: "Negotiated vendor", items: d.items, qty: d.qty, unit: d.unit, amount: d.amount, date: dStr(0), status: "Pending Approval", by: user.name }); log("Procurement", "PO Raised", code, `${L(d.amount)} — awaiting approval`); notify("approval", `${code} (${L(d.amount)}) awaiting approval`); toast("success", `${code} raised`); }}>Raise PO</Btn>;
    if (d.type === "PO" && d.status === "Pending Approval") return can("procurement", "approve") ? <Btn sm kind="ok" onClick={(e: any) => { e.stopPropagation(); setStatus(d, "Approved"); log("Procurement", "PO Approved", d.code, `${L(d.amount)}`); notify("approval", `${d.code} approved — goods can be received`); toast("success", `${d.code} approved`); }}><ICheck size={11} /> Approve</Btn> : null;
    if (d.type === "PO" && d.status === "Approved" && !docs.some((x) => x.ref === d.code)) return <Btn sm onClick={(e: any) => {
      e.stopPropagation();
      const code = nextCode("GRN"); const received = Math.round(d.qty * 0.985 * 10) / 10;
      setS((p) => {
        const mat = p.materials.find((m) => d.items.toLowerCase().includes(m.name.split(" ")[0].toLowerCase()));
        const stock = mat ? (p.stock.some((st) => st.material === mat.name)
          ? p.stock.map((st) => st.material === mat.name ? { ...st, onHand: +(st.onHand + received).toFixed(1), value: +(st.value + received * mat.rate).toFixed(1) } : st)
          : [...p.stock, { material: mat.name, store: `Store — ${d.project}`, onHand: received, unit: d.unit, value: +(received * mat.rate).toFixed(1) }]) : p.stock;
        return { ...p, stock, mTxns: [{ id: "x" + Date.now(), code, kind: "Inward" as const, material: mat?.name ?? d.items, qty: received, unit: d.unit, project: d.project, date: dStr(0), by: user.name }, ...p.mTxns], proc: [...p.proc, { id: "d" + Date.now(), code, type: "GRN" as const, ref: d.code, project: d.project, party: d.party, items: d.items, qty: received, unit: d.unit, amount: d.amount, date: dStr(0), status: "Received", by: user.name }] };
      });
      log("Procurement", "GRN Posted", code, `${received} ${d.unit} received — stock updated in Store module`);
      notify("stock", `GRN ${code}: ${received} ${d.unit} of ${d.items} added to stock`);
      toast("success", `${code} posted — store stock updated automatically`);
    }}><ITruck size={12} /> Receive (GRN)</Btn>;
    if (d.type === "GRN" && !docs.some((x) => x.ref === d.code)) return can("finance", "create") || can("procurement", "create") ? <Btn sm onClick={(e: any) => {
      e.stopPropagation();
      const code = nextCode("INV-V");
      setS((p) => ({ ...p, apInvoices: [{ id: "ap" + Date.now(), no: code, vendor: d.party, ref: d.ref ?? d.code, amount: +(d.amount / 10).toFixed(2), due: dStr(-30), status: "Booked" as const }, ...p.apInvoices], proc: [...p.proc, { id: "d" + Date.now(), code, type: "PINV" as const, ref: d.code, project: d.project, party: d.party, items: d.items, qty: d.qty, unit: d.unit, amount: d.amount, date: dStr(0), status: "Booked", by: user.name }], journals: [{ id: "j" + Date.now(), no: nextCode("JV"), date: dStr(0), debit: "Inventory — Materials", credit: "Sundry Creditors", amount: +(d.amount / 10).toFixed(2), narr: `${code} booked against ${d.ref}`, by: user.name }, ...p.journals] }));
      log("Finance", "Vendor Invoice Booked", code, `${L(d.amount)} — ${d.party} posted to Accounts Payable`);
      notify("payment", `Vendor invoice ${code} booked to AP`);
      toast("success", `${code} booked — payable & GL journal created`);
    }}><IReceipt size={12} /> Book Invoice</Btn> : null;
    if (d.type === "PINV" && d.status === "Booked" && !docs.some((x) => x.ref === d.code)) return can("finance", "create") ? <Btn sm onClick={(e: any) => {
      e.stopPropagation();
      const code = nextCode("PAY");
      setS((p) => ({ ...p, payments: [{ id: "py" + Date.now(), no: code, party: d.party, ref: d.code, amount: +(d.amount / 10).toFixed(2), date: dStr(0), mode: "NEFT", status: "Pending" as const }, ...p.payments], proc: [...p.proc, { id: "d" + Date.now(), code, type: "PAY" as const, ref: d.code, project: d.project, party: d.party, items: "Against " + d.code, qty: 1, unit: "—", amount: d.amount, date: dStr(0), status: "Pending", by: user.name }] }));
      log("Finance", "Payment Scheduled", code, `${L(d.amount)} → ${d.party}`);
      toast("success", `${code} scheduled — release from Approval Centre`);
    }}><IRupee size={12} /> Schedule Pay</Btn> : null;
    if (d.type === "PAY" && d.status === "Pending") return can("finance", "approve") ? <Btn sm kind="primary" onClick={(e: any) => {
      e.stopPropagation();
      setS((p) => ({ ...p, proc: p.proc.map((x) => x.id === d.id ? { ...x, status: "Released" } : x), payments: p.payments.map((x) => x.ref === d.ref ? { ...x, status: "Released" as const } : x) }));
      log("Finance", "Payment Released", d.code, `${L(d.amount)} → ${d.party} via NEFT`);
      notify("payment", `Payment ${d.code} released to ${d.party}`);
      toast("success", `Payment ${d.code} released`);
    }}><ICheck size={11} /> Release</Btn> : null;
    return null;
  };

  const cols: Col[] = [
    { key: "code", label: "Document", render: (d) => <span className="num text-[12.5px] font-bold text-brand-700">{d.code}</span> },
    { key: "type", label: "Stage", render: (d) => <span className="text-[10.5px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{STAGE_LABEL[d.type]}</span> },
    { key: "project", label: "Project", render: (d) => <span className="text-[12px] num text-ink-500">{d.project}</span> },
    { key: "items", label: "Items / Party", render: (d) => <div><p className="text-[12.5px] font-semibold text-ink-900">{d.items}</p><p className="text-[10.5px] text-ink-400 mt-0.5">{d.party} · by {d.by}</p></div> },
    { key: "qty", label: "Qty", align: "right", sort: (d) => d.qty, render: (d) => <span className="num text-[12px]">{d.qty.toLocaleString("en-IN")} {d.unit}</span> },
    { key: "amount", label: "Value (₹ L)", align: "right", sort: (d) => d.amount, render: (d) => <span className="num text-[12.5px] font-semibold text-ink-900">{d.amount.toFixed(1)}</span> },
    { key: "date", label: "Date", render: (d) => <span className="num text-[11.5px] text-ink-500">{d.date}</span> },
    { key: "status", label: "Status", render: (d) => <Pill value={d.status} pulse={d.status === "Pending Approval"} />, csv: (d) => d.status },
    { key: "act", label: "Advance", render: (d: ProcDoc) => <span className="flex items-center gap-1.5 justify-end">{actionsFor(d)}<Btn sm onClick={(e: any) => { e.stopPropagation(); setChain(d); }}><IEye size={11} /></Btn></span> },
  ];

  return (
    <div className="fade-up">
      <PageHead title="Procurement Chain" crumbs={["Meridian", "Supply Chain", "Procurement"]}
        desc="One connected flow: Requisition → RFQ → Comparison → Order → Receipt → Invoice → Payment. Receipts post to store stock; invoices post to payables & GL.">
        <Stat label="Pending approvals" value={`${docs.filter((d) => d.status === "Pending Approval").length}`} tone="warn" />
        <Stat label="Open PO value" value={L(docs.filter((d) => d.type === "PO").reduce((a, d) => a + d.amount, 0))} />
        <Stat label="Avg cycle time" value="9.2 d" sub="PR → PO" />
        <Stat label="Savings YTD" value="₹84.6 L" tone="ok" sub="vs budgeted rates" />
      </PageHead>

      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-4">
        {STAGES.map((t, i) => {
          const n = docs.filter((d) => d.type === t).length;
          const pending = docs.filter((d) => d.type === t && d.status === "Pending Approval").length;
          return (
            <button key={t} onClick={() => { setTab(t); }}
              className={cx("relative rounded-lg border px-3 py-2.5 text-left transition-all duration-200 hover:-translate-y-[2px] hover:shadow-lift active:scale-[0.98]", tab === t ? "border-brand-500 bg-brand-50" : "border-line bg-surface")}>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-ink-400">{STAGE_LABEL[t]}</p>
              <p className="num text-[18px] font-semibold text-ink-900 mt-0.5">{n}</p>
              {pending > 0 && <span className="absolute top-2 right-2 num text-[9.5px] font-bold bg-amber-100 text-amber-600 rounded-full px-1.5 py-px">{pending} to approve</span>}
              {i < 6 && <span className="hidden md:block absolute top-1/2 -right-[7px] z-10 h-px w-[10px] bg-line-strong" />}
            </button>
          );
        })}
      </div>

      <Widget title="Procurement Documents" subtitle="Advance documents down the chain — every transition is audit-logged and cross-posts to linked modules.">
        <FilterBar pageKey="proc" q={q} onQ={setQ} filters={[]}
          right={<Seg value={tab} onChange={setTab} options={[{ k: "all", l: "All", n: docs.length }, ...STAGES.map((t) => ({ k: t, l: t, n: docs.filter((d) => d.type === t).length }))] as any} />} />
        <DataTable pageKey="proc-chain" rows={rows} cols={cols} onRow={(d) => setChain(d)} />
      </Widget>

      <Drawer wide open={!!chain} onClose={() => setChain(null)} title={`Document chain · ${chain?.code ?? ""}`} sub="Inter-module audit trail for this transaction">
        {chain && (
          <ol className="relative">
            {lineage(chain).map((d, i, arr) => (
              <li key={d.id} className="relative flex gap-3 pb-5 last:pb-0">
                {i < arr.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-line" />}
                <span className={cx("relative z-10 h-8 w-8 rounded-full grid place-items-center shrink-0 text-[10px] font-bold", d.type === chain.type ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700 border border-brand-200")}>{d.type}</span>
                <div className="flex-1 min-w-0 border border-line rounded-lg px-3.5 py-2.5 bg-canvas/40">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="num text-[12.5px] font-bold text-ink-900">{d.code}</span>
                    <span className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">{STAGE_LABEL[d.type]}</span>
                    <span className="ml-auto"><Pill value={d.status} /></span>
                  </div>
                  <p className="text-[12px] text-ink-500 mt-1">{d.items} · {d.qty} {d.unit} · <b className="num text-ink-900">{L(d.amount)}</b></p>
                  <p className="text-[10.5px] text-ink-300 mt-1 num">{d.date} · {d.by} · {d.project}</p>
                  {d.type === "GRN" && <p className="text-[10.5px] font-semibold text-ok-600 mt-1">↳ Posted to store stock & material ledger</p>}
                  {d.type === "PINV" && <p className="text-[10.5px] font-semibold text-ok-600 mt-1">↳ Posted to Accounts Payable & GL journal</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Drawer>
    </div>
  );
}

/* ════════ 3 · PURCHASE ORDERS ════════ */
const VENDOR_DIR: Record<string, { addr: string; gst: string; contact: string; email: string; phone: string }> = {
  "UltraTech Cement": { addr: "Birla Bhavan, M.P. Nagar, Mumbai 400021", gst: "27AAACU1901R1ZK", contact: "Rohit Salunkhe", email: "r.salunkhe@ultratech.com", phone: "+91 98220 44120" },
  "Tata Steel": { addr: "Bombay House, 24 Homi Mody St, Mumbai 400001", gst: "27AAACT2727Q1ZW", contact: "Priya Nair", email: "priya.nair@tatasteel.com", phone: "+91 98333 71210" },
  "Sika India": { addr: "Plot 62, MIDC Phase II, Dombivli East 421203", gst: "27AAACS4461F1ZQ", contact: "Arjun Mehta", email: "arjun.mehta@in.sika.com", phone: "+91 99300 21842" },
  "Deccan Aggregates": { addr: "Survey 44, Chakan Industrial Area, Pune 410501", gst: "27AAHCD8812K1Z3", contact: "Mahesh Kale", email: "sales@deccanagg.in", phone: "+91 98500 77310" },
  "GreenPly Industries": { addr: "5 Middleton St, Kolkata 700071", gst: "19AAACG4429P1ZM", contact: "Sourav Das", email: "sourav.das@greenply.com", phone: "+91 98301 55670" },
};
const poTot = (p: PODoc) => {
  const basic = p.lines.reduce((a, l) => a + l.qty * l.rate, 0);
  const disc = p.lines.reduce((a, l) => a + l.qty * l.rate * (l.disc / 100), 0);
  const gst = p.lines.reduce((a, l) => a + l.qty * l.rate * (1 - l.disc / 100) * (l.gst / 100), 0);
  const taxable = basic - disc;
  return { basic, disc, taxable, gst, grand: taxable + gst + p.freight + p.loading + p.other };
};

export function POPage() {
  const { s, setS, can, log, notify, user } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [view, setView] = useState<PODoc | null>(null);
  const [creating, setCreating] = useState<PRDoc | null>(null);

  const TABS = [["all", "All", () => true], ["Draft", "Draft", (p: PODoc) => p.status === "Draft"], ["Pending Approval", "Pending", (p: PODoc) => p.status === "Pending Approval"], ["Approved", "Approved", (p: PODoc) => p.status === "Approved"], ["Dispatched", "Dispatched", (p: PODoc) => p.status === "Dispatched"], ["Closed", "Closed", (p: PODoc) => p.status === "Closed"]] as const;
  const rows = useMemo(() => s.pos.filter((p) => (tab === "all" || p.status === tab) && (p.no + p.vendor + p.project + p.prRef).toLowerCase().includes(q.toLowerCase())), [s.pos, tab, q]);
  const patch = (p: PODoc, px: Partial<PODoc>) => setS((st) => ({ ...st, pos: st.pos.map((x) => x.id === p.id ? { ...x, ...px } : x) }));
  const approvedPRs = s.prs.filter((p) => p.status === "Approved");

  const printPO = (p: PODoc) => {
    const t = poTot(p);
    printDocument({
      title: "Purchase Order", docNo: p.no, date: p.date, orientation: "landscape",
      project: `${p.project} — ${s.projects.find((x) => x.code === p.project)?.name ?? ""}`,
      meta: [
        ["Supplier", p.vendor], ["Vendor GSTIN", p.gst], ["Contact", `${p.contact} · ${p.phone}`], ["Email", p.email],
        ["Site / Delivery", p.site], ["Cost Centre", p.costCentre], ["PR Ref", p.prRef], ["RFQ Ref", p.rfqRef],
        ["Quotation", `${p.quotRef} dt. ${p.quotDate}`], ["Negotiation", p.negoRef || "—"],
      ],
      cols: [
        { label: "Item / Description & Specification" }, { label: "BOQ", align: "center" }, { label: "Make", align: "center" }, { label: "Unit", align: "center" },
        { label: "Prev Qty", align: "right" }, { label: "Order Qty", align: "right" }, { label: "Rate", align: "right" }, { label: "Disc %", align: "right" },
        { label: "GST %", align: "right" }, { label: "Amount (incl. GST)", align: "right" }, { label: "Delivery Schedule" },
      ],
      rows: p.lines.map((l) => [`${l.code} — ${l.desc} · ${l.spec}`, `${l.boqRef}/${l.boqNo}`, l.brand, l.unit, l.prevQty, l.qty, l.rate, l.disc, l.gst,
        Math.round(l.qty * l.rate * (1 - l.disc / 100) * (1 + l.gst / 100)), l.schedule]),
      totalsLabel: "Grand Total (incl. GST)", totals: [Math.round(t.grand)], inWords: t.grand,
      remarks: `Break-up — Basic ${money(t.basic)} · Discount ${money(t.disc)} · GST ${money(t.gst)} · Freight ${money(p.freight)} · Loading/Unloading ${money(p.loading)} · Others ${money(p.other)}. ${inrWords(t.grand)}.`,
      terms: p.terms, signatures: ["Prepared By", "Checked By", "Approved By", "Authorised Signatory"], acceptance: true,
      note: "System generated order — valid only with the authorised digital approval trail of Meridian ERP.",
      generatedBy: user.name,
    });
  };

  const cols: Col[] = [
    { key: "no", label: "PO No.", sort: (p) => p.no, render: (p) => <div><p className="num text-[12.5px] font-bold text-brand-700">{p.no}</p><p className="text-[10px] text-ink-300 num">{p.date}</p></div> },
    { key: "vendor", label: "Vendor", render: (p) => <div><p className="text-[12.5px] font-semibold text-ink-900">{p.vendor}</p><p className="text-[10.5px] text-ink-400">{p.contact} · {p.phone}</p></div> },
    { key: "project", label: "Project / PR", render: (p) => <span className="text-[12px] num text-ink-500">{p.project} · {p.prRef}</span> },
    { key: "items", label: "Lines", align: "center", render: (p) => <span className="num text-[12px] font-semibold">{p.lines.length}</span> },
    { key: "basic", label: "Basic", align: "right", sort: (p) => poTot(p).basic, render: (p) => <span className="num text-[12px]">{money(poTot(p).basic)}</span> },
    { key: "gst", label: "GST", align: "right", sort: (p) => poTot(p).gst, render: (p) => <span className="num text-[12px] text-ink-500">{money(poTot(p).gst)}</span> },
    { key: "grand", label: "Grand Total", align: "right", sort: (p) => poTot(p).grand, render: (p) => <span className="num text-[12.5px] font-bold text-ink-900">{money(poTot(p).grand)}</span> },
    { key: "status", label: "Status", render: (p) => <Pill value={p.status} pulse={p.status === "Pending Approval"} />, csv: (p) => p.status },
    { key: "act", label: "Actions", render: (p: PODoc) => (
      <span className="flex items-center gap-1 justify-end">
        {can("procurement", "approve") && p.status === "Pending Approval" && <Btn sm kind="ok" onClick={(e: any) => { e.stopPropagation(); patch(p, { status: "Approved", termsLocked: true }); log("Procurement", "PO Approved", p.no, `${money(poTot(p).grand)} · ${p.vendor} · terms locked`); notify("approval", `${p.no} approved & terms locked`); toast("success", `${p.no} approved`); }}><ICheck size={11} /> Approve</Btn>}
        {p.status === "Approved" && !p.acceptedBy && <Btn sm onClick={(e: any) => { e.stopPropagation(); patch(p, { acceptedBy: `${p.contact} · ${p.vendor} · ${dStr(0)}`, status: "Dispatched" }); log("Procurement", "Vendor Acceptance Recorded", p.no, `${p.contact} accepted`); toast("success", "Vendor acceptance recorded — Dispatched"); }}>Acceptance</Btn>}
        <Btn sm onClick={(e: any) => { e.stopPropagation(); setView(p); }}><IEye size={11} /></Btn>
        <Btn sm onClick={(e: any) => { e.stopPropagation(); printPO(p); }}><IPrinter size={11} /></Btn>
      </span>) },
  ];

  const open = s.pos.filter((p) => ["Draft", "Pending Approval", "Approved", "Dispatched"].includes(p.status));

  return (
    <div className="fade-up">
      <PageHead title="Purchase Orders" crumbs={["Meridian", "Supply Chain", "Purchase Orders"]}
        desc="GST-engine orders converted from approved requisitions — configurable terms & conditions, vendor acceptance and premium print formats.">
        <Stat label="Open value" value={money(open.reduce((a, p) => a + poTot(p).grand, 0))} />
        <Stat label="Pending approval" value={`${s.pos.filter((p) => p.status === "Pending Approval").length}`} tone="warn" />
        <Stat label="Awaiting acceptance" value={`${s.pos.filter((p) => p.status === "Approved" && !p.acceptedBy).length}`} />
        <Stat label="Approved PRs ready" value={`${approvedPRs.length}`} tone={approvedPRs.length ? "warn" : "ok"} />
        <AddBtn label={approvedPRs.length ? `Convert PR → PO (${approvedPRs.length})` : "New PO"} disabled={!can("procurement", "create") || !approvedPRs.length}
          tip={approvedPRs.length ? "" : "Approve a requisition first"} onClick={() => setCreating(approvedPRs[0] ?? null)} />
      </PageHead>

      <Widget title="Order Book" subtitle="Basic − Discount = Taxable · + GST + Freight/Loading = Grand Total · amounts rendered in words on print">
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={TABS.map(([k, l, m]) => ({ k, l, n: s.pos.filter(m as any).length })) as any} /></div>
        <FilterBar pageKey="po" q={q} onQ={setQ} filters={[]} />
        <DataTable pageKey="po-book" rows={rows} cols={cols} onRow={(p) => setView(p)} empty={{ title: "No purchase orders", note: "Convert an approved requisition from the PR register to raise a PO." }} />
      </Widget>

      <Drawer wide open={!!view} onClose={() => setView(null)} title={`Purchase Order · ${view?.no}`} sub={view ? `${view.vendor} · ${view.project} · ${view.date}` : ""}>
        {view && (() => {
          const p = s.pos.find((x) => x.id === view.id) ?? view;
          const t = poTot(p);
          return (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-line p-3.5"><p className="text-[10px] font-bold uppercase tracking-wide text-brand-700 mb-1.5">Vendor</p>
                  <p className="text-[13px] font-bold text-ink-900">{p.vendor}</p>
                  <p className="text-[11px] text-ink-500 mt-0.5 leading-snug">{p.vendorAddr}</p>
                  <p className="text-[11px] text-ink-500 mt-1 num">GSTIN {p.gst} · {p.contact} · {p.phone} · {p.email}</p></div>
                <div className="rounded-lg border border-line p-3.5"><p className="text-[10px] font-bold uppercase tracking-wide text-brand-700 mb-1.5">References</p>
                  {[["PR", p.prRef], ["RFQ", p.rfqRef], ["Quotation", `${p.quotRef} · ${p.quotDate}`], ["Negotiation", p.negoRef || "—"]].map(([k, v]) => (
                    <p key={k} className="text-[11.5px] text-ink-500 flex justify-between gap-3 py-0.5"><span className="font-bold text-ink-400 uppercase text-[9.5px] tracking-wide mt-0.5">{k}</span><span className="num text-ink-700 text-right">{v}</span></p>))}</div>
              </div>
              <div className="overflow-x-auto -mx-5 px-5">
                <table className="w-full text-left min-w-[820px]">
                  <thead><tr className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
                    <th className="font-bold pb-2 pr-3">Sr</th><th className="font-bold pb-2 pr-3">Item</th><th className="font-bold pb-2 pr-3 text-right">Prev</th>
                    <th className="font-bold pb-2 pr-3 text-right">Qty</th><th className="font-bold pb-2 pr-3 text-right">Rate</th><th className="font-bold pb-2 pr-3 text-right">Disc</th>
                    <th className="font-bold pb-2 pr-3 text-right">GST</th><th className="font-bold pb-2 pr-3 text-right">Taxable</th><th className="font-bold pb-2 text-right">Total</th>
                  </tr></thead>
                  <tbody>{p.lines.map((l, i) => {
                    const taxable = l.qty * l.rate * (1 - l.disc / 100);
                    return (
                      <tr key={l.id} className="border-t border-line/80 align-top">
                        <td className="py-2.5 pr-3 num text-[11px] text-ink-400">{i + 1}</td>
                        <td className="py-2.5 pr-3"><p className="text-[12.5px] font-semibold text-ink-900">{l.code} · {l.desc}</p><p className="text-[10.5px] text-ink-400 mt-0.5">{l.spec} · {l.brand} · {l.boqRef}/{l.boqNo}</p><p className="text-[10px] text-brand-700 mt-0.5 font-semibold">{l.schedule}</p></td>
                        <td className="py-2.5 pr-3 text-right num text-[11.5px] text-ink-400">{l.prevQty}</td>
                        <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold">{l.qty} {l.unit}</td>
                        <td className="py-2.5 pr-3 text-right num text-[12px]">{money(l.rate)}</td>
                        <td className="py-2.5 pr-3 text-right num text-[12px]">{l.disc}%</td>
                        <td className="py-2.5 pr-3 text-right num text-[12px]">{l.gst}%</td>
                        <td className="py-2.5 pr-3 text-right num text-[12px]">{money(taxable)}</td>
                        <td className="py-2.5 text-right num text-[12.5px] font-semibold text-ink-900">{money(taxable * (1 + l.gst / 100))}</td>
                      </tr>);
                  })}</tbody>
                </table>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Terms &amp; Conditions {p.termsLocked && <span className="ml-1 text-[9px] bg-ok-100 text-ok-600 px-1.5 py-px rounded-full uppercase">Locked</span>}</p>
                  <ol className="space-y-1.5">{p.terms.map((t, i) => (
                    <li key={i} className="flex gap-2 text-[11.5px] text-ink-500 leading-snug"><span className="num font-bold text-ink-400 shrink-0 w-4">{i + 1}.</span>{t}</li>))}</ol>
                </div>
                <div className="rounded-lg border border-line p-4 space-y-1.5 self-start">
                  {[["Basic value", t.basic], ["Discount", -t.disc], ["Taxable value", t.taxable], ["GST", t.gst], ["Freight", p.freight], ["Loading / Unloading", p.loading], ["Other charges", p.other]].map(([k, v]) => (
                    <div key={k as string} className="flex justify-between text-[12px]"><span className="text-ink-500">{k}</span><span className={cx("num font-semibold", (v as number) < 0 ? "text-danger-600" : "text-ink-700")}>{(v as number) < 0 ? "−" : ""}{money(Math.abs(v as number))}</span></div>))}
                  <div className="flex justify-between items-center pt-2 mt-1 border-t border-line"><span className="text-[11px] font-extrabold uppercase tracking-wide text-brand-700">Grand Total</span><span className="num text-[19px] font-bold text-ink-900">{money(t.grand)}</span></div>
                  <p className="text-[10.5px] text-ink-400 italic pt-1">{inrWords(t.grand)}</p>
                </div>
              </div>
              {p.acceptedBy && <p className="text-[11.5px] font-semibold text-ok-600 bg-ok-100/50 border border-ok-500/25 rounded-md px-3 py-2">Vendor acceptance recorded — {p.acceptedBy}</p>}
              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-line">
                <Btn onClick={() => printPO(p)}><IPrinter size={13} /> Print PO</Btn>
                {can("procurement", "approve") && p.status === "Pending Approval" && <Btn kind="ok" onClick={() => { patch(p, { status: "Approved", termsLocked: true }); log("Procurement", "PO Approved", p.no, money(t.grand)); toast("success", `${p.no} approved — terms locked`); }}><ICheck size={13} /> Approve &amp; Lock Terms</Btn>}
              </div>
            </div>
          );
        })()}
      </Drawer>

      {creating && <CreatePO pr={creating} onClose={() => setCreating(null)} onConverted={(prNo, poNo) => {
        setS((st) => ({ ...st, prs: st.prs.map((x) => x.no === prNo ? { ...x, status: "Fully Converted", history: [...x.history, { ts: Date.now(), action: `Converted to ${poNo}`, by: user.name }] } : x) }));
        log("Procurement", "PR Fully Converted", prNo, `→ ${poNo}`);
      }} />}
    </div>
  );
}

function CreatePO({ pr, onClose, onConverted }: { pr: PRDoc; onClose: () => void; onConverted: (prNo: string, poNo: string) => void }) {
  const { setS, log, notify, nextCode, user } = useERP();
  const toast = useToast();
  const DEFAULT_TERMS = ["t1", "t2", "t4", "t6", "t7", "t9", "t12"];
  const [vendor, setVendor] = useState(PURCHASE_MEMORY[pr.lines[0]?.desc]?.vendor ?? "UltraTech Cement");
  const [terms, setTerms] = useState<string[]>(DEFAULT_TERMS.map((id) => TERMS_LIBRARY.find((t) => t.id === id)!.text));
  const [freight, setFreight] = useState(0);
  const [loading, setLoading] = useState(0);
  const [lines, setLines] = useState<POLine[]>(pr.lines.map((l) => ({ id: l.id, code: l.code, desc: l.desc, spec: l.spec, brand: l.brand, unit: l.unit, boqRef: l.boqRef, boqNo: l.boqNo, qty: l.qty, prevQty: 0, rate: PURCHASE_MEMORY[l.desc]?.rate ?? l.rate, disc: 0, gst: 18, schedule: "Within required date" })));

  const basic = lines.reduce((a, l) => a + l.qty * l.rate, 0);
  const disc = lines.reduce((a, l) => a + l.qty * l.rate * (l.disc / 100), 0);
  const taxable = basic - disc;
  const gst = lines.reduce((a, l) => a + l.qty * l.rate * (1 - l.disc / 100) * (l.gst / 100), 0);
  const grand = taxable + gst + freight + loading;
  const vd = VENDOR_DIR[vendor] ?? Object.values(VENDOR_DIR)[0];

  const save = (status: "Draft" | "Pending Approval") => {
    if (!lines.length) { toast("error", "Add at least one order line"); return; }
    const no = nextCode("PO");
    const doc: PODoc = {
      id: "po" + Date.now(), no, date: dStr(0), vendor, vendorAddr: vd.addr, gst: vd.gst, contact: vd.contact, email: vd.email, phone: vd.phone,
      project: pr.project, site: pr.site, costCentre: pr.costCentre, prRef: pr.no, rfqRef: "RFQ-" + String(Math.floor(400 + Math.random() * 99)), quotRef: vendor.slice(0, 3).toUpperCase() + "/Q/" + Math.floor(1000 + Math.random() * 9000), quotDate: dStr(-2), negoRef: "L1 basis",
      lines, freight, loading, other: 0, terms, termsLocked: status !== "Draft", status, ts: Date.now(),
    };
    setS((st) => ({ ...st, pos: [doc, ...st.pos] }));
    log("Procurement", status === "Draft" ? "PO Saved as Draft" : "PO Raised", no, `${money(grand)} · ${vendor} · ref ${pr.no}`);
    if (status === "Pending Approval") { onConverted(pr.no, no); notify("approval", `${no} (${money(grand)}) awaiting approval`); }
    toast("success", status === "Draft" ? `${no} saved as draft` : `${no} raised — ${pr.no} marked converted`);
    onClose();
  };

  return (
    <Drawer wide open onClose={onClose} title={`New Purchase Order · from ${pr.no}`} sub="GST engine · terms library · auto number series">
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Vendor">
            <div className="relative"><select className={selectCls} value={vendor} onChange={(e) => setVendor(e.target.value)}>
              {Object.keys(VENDOR_DIR).map((v) => <option key={v}>{v}</option>)}</select>
              <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
          </Field>
          <Field label="GSTIN"><div className={cx(inputCls, "bg-canvas text-ink-400 flex items-center num")}>{vd.gst}</div></Field>
          <Field label="Contact"><div className={cx(inputCls, "bg-canvas text-ink-400 flex items-center")}>{vd.contact} · {vd.phone}</div></Field>
        </div>
        <div className="space-y-2">
          {lines.map((l, i) => {
            const amt = l.qty * l.rate * (1 - l.disc / 100) * (1 + l.gst / 100);
            return (
              <div key={l.id} className="rounded-lg border border-line p-3 bg-canvas/40">
                <div className="flex items-center gap-2 mb-2">
                  <span className="num text-[10px] font-bold bg-brand-50 text-brand-700 border border-brand-100 rounded px-1.5 py-0.5">{i + 1}</span>
                  <p className="text-[12.5px] font-semibold text-ink-900 truncate">{l.code} · {l.desc}</p>
                  <span className="ml-auto num text-[12.5px] font-bold text-ink-900">{money(amt)}</span>
                </div>
                <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                  <Field label="Order qty"><input type="number" className={inputCls} value={l.qty || ""} onChange={(e) => setLines((ls) => ls.map((x) => x.id === l.id ? { ...x, qty: parseFloat(e.target.value) || 0 } : x))} /></Field>
                  <Field label={`Rate (₹/${l.unit})`}><input type="number" className={inputCls} value={l.rate || ""} onChange={(e) => setLines((ls) => ls.map((x) => x.id === l.id ? { ...x, rate: parseFloat(e.target.value) || 0 } : x))} /></Field>
                  <Field label="Disc %"><input type="number" className={inputCls} value={l.disc} onChange={(e) => setLines((ls) => ls.map((x) => x.id === l.id ? { ...x, disc: parseFloat(e.target.value) || 0 } : x))} /></Field>
                  <Field label="GST %">
                    <div className="relative"><select className={selectCls} value={l.gst} onChange={(e) => setLines((ls) => ls.map((x) => x.id === l.id ? { ...x, gst: parseFloat(e.target.value) } : x))}>
                      {[0, 5, 12, 18, 28].map((g) => <option key={g} value={g}>{g}%</option>)}</select>
                      <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
                  </Field>
                  <Field label="Prev qty"><input type="number" className={inputCls} value={l.prevQty} onChange={(e) => setLines((ls) => ls.map((x) => x.id === l.id ? { ...x, prevQty: parseFloat(e.target.value) || 0 } : x))} /></Field>
                  <Field label="Delivery schedule"><input className={inputCls} value={l.schedule} onChange={(e) => setLines((ls) => ls.map((x) => x.id === l.id ? { ...x, schedule: e.target.value } : x))} /></Field>
                </div>
              </div>);
          })}
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Terms &amp; Conditions · central library</p>
            <Btn sm onClick={() => setTerms((tm) => [...tm, "Custom term — enter text here."])}><IPlus size={11} /> Custom term</Btn>
          </div>
          <div className="space-y-1.5 max-h-[220px] overflow-auto pr-1">
            {terms.map((tm, i) => (
              <div key={i} className="flex items-start gap-2 group">
                <span className="num text-[10.5px] font-bold text-ink-400 mt-1.5 w-5 shrink-0">{i + 1}.</span>
                <input className={cx(inputCls, "h-auto py-1.5 text-[11.5px]")} value={tm} onChange={(e) => setTerms((ts2) => ts2.map((x, j) => j === i ? e.target.value : x))} />
                <span className="flex flex-col gap-0.5 shrink-0 pt-0.5">
                  <button onClick={() => setTerms((ts2) => { const a = [...ts2]; if (i > 0) { const t = a[i - 1]; a[i - 1] = a[i]; a[i] = t; } return a; })} disabled={i === 0} className="h-5 w-6 grid place-items-center rounded border border-line text-ink-400 hover:bg-canvas disabled:opacity-30 transition-all"><IArrowUp size={10} /></button>
                  <button onClick={() => setTerms((ts2) => { const a = [...ts2]; if (i < a.length - 1) { const t = a[i + 1]; a[i + 1] = a[i]; a[i] = t; } return a; })} disabled={i === terms.length - 1} className="h-5 w-6 grid place-items-center rounded border border-line text-ink-400 hover:bg-canvas disabled:opacity-30 transition-all"><IArrowDown size={10} /></button>
                </span>
                <button onClick={() => setTerms((ts2) => ts2.filter((_, j) => j !== i))} className="h-6 w-6 mt-0.5 grid place-items-center rounded border border-line text-ink-300 hover:text-danger-600 opacity-0 group-hover:opacity-100 transition-all"><IXCircle size={11} /></button>
              </div>))}
          </div>
          <p className="text-[10px] text-ink-300 mt-1.5">Reorder, edit or delete before approval. Terms lock automatically once the PO is approved.</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Field label="Freight (₹)"><input type="number" className={inputCls} value={freight || ""} onChange={(e) => setFreight(parseFloat(e.target.value) || 0)} /></Field>
          <Field label="Loading / Unloading (₹)"><input type="number" className={inputCls} value={loading || ""} onChange={(e) => setLoading(parseFloat(e.target.value) || 0)} /></Field>
          <div className="col-span-2 rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wide text-brand-700">Grand total (incl. GST)</span>
            <span className="num text-[17px] font-bold text-ink-900">{money(grand)}</span>
          </div>
        </div>
        <p className="text-[11px] text-ink-400">Basic {money(basic)} − Discount {money(disc)} = Taxable {money(taxable)} · GST {money(gst)} · Charges {money(freight + loading)}</p>
        <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-line">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn onClick={() => save("Draft")}>Save as Draft</Btn>
          <Btn kind="primary" onClick={() => save("Pending Approval")}><IStamp size={13} /> Submit for Approval</Btn>
        </div>
      </div>
    </Drawer>
  );
}
