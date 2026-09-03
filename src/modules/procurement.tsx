import { useEffect, useMemo, useState } from "react";
import { useERP, PROC_STAGES, PROC_LABEL as PROC_LABEL_T, dStr } from "../store";
const PROC_LABEL: Record<string, string> = PROC_LABEL_T;
import type { ProcDoc, ProcType } from "../store";
import { Pill, Widget, useToast, cx } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat, AddBtn } from "./shell";
import type { Col } from "./shell";
import { IChevD, ICheck, ITruck, IReceipt, IRupee, IStamp, IEye } from "../icons";



export default function ProcurementPage() {
  const { s, setS, can, log, notify, nextCode, intent, setIntent, user } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<"all" | ProcType>("all");
  const [q, setQ] = useState("");
  const [fProj, setFProj] = useState("");
  const [chain, setChain] = useState<ProcDoc | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ material: "", qty: "", project: "P1", need: "" });

  useEffect(() => { if (intent?.route === "procurement" && intent.kind === "new") { setCreating(true); setIntent(null); } }, [intent, setIntent]);

  const docs = s.proc;
  const projects = [...new Set(docs.map((d) => d.project))];
  const rows = useMemo(() => docs.filter((d) =>
    (tab === "all" || d.type === tab) &&
    (!fProj || d.project === fProj) &&
    (d.code + d.party + d.items + d.project).toLowerCase().includes(q.toLowerCase())
  ), [docs, tab, fProj, q]);

  const pendingApprovals = docs.filter((d) => d.status === "Pending Approval").length;
  const poValue = docs.filter((d) => d.type === "PO").reduce((a, d) => a + d.amount, 0);

  /* ── chain navigation ── */
  const lineage = (d: ProcDoc): ProcDoc[] => {
    const list: ProcDoc[] = [d];
    let cur = d;
    while (cur.ref) { const parent = docs.find((x) => x.code === cur.ref); if (!parent) break; list.unshift(parent); cur = parent; }
    cur = d;
    for (let guard = 0; guard < 8; guard++) {
      const child = docs.find((x) => x.ref === cur.code);
      if (!child) break; list.push(child); cur = child;
    }
    return list.sort((a, b) => PROC_STAGES.indexOf(a.type) - PROC_STAGES.indexOf(b.type));
  };

  const push = (fn: (p: ReturnType<typeof useERP>["s"]) => ReturnType<typeof useERP>["s"]) => setS(fn as any);

  /* ── workflow actions ── */
  const setStatus = (d: ProcDoc, status: string) => push((p) => ({ ...p, proc: p.proc.map((x) => x.id === d.id ? { ...x, status } : x) }));

  const addDoc = (d: Omit<ProcDoc, "id">) => push((p) => ({ ...p, proc: [...p.proc, { ...d, id: "d" + Date.now() + Math.floor(Math.random() * 99) }] }));

  const approvePR = (d: ProcDoc) => { setStatus(d, "Approved"); log("Procurement", "PR Approved", d.code, `${d.items} — ${d.qty} ${d.unit} for ${d.project}`); notify("approval", `${d.code} approved — raise RFQ to continue`); toast("success", `${d.code} approved`); };

  const raiseRFQ = (d: ProcDoc) => { const code = nextCode("RFQ"); addDoc({ code, type: "RFQ", ref: d.code, project: d.project, party: "3 vendors invited", items: d.items, qty: d.qty, unit: d.unit, amount: d.amount, date: dStr(0), status: "Open", by: user.name }); log("Procurement", "RFQ Floated", code, `Against ${d.code} — ${d.items}`); toast("success", `${code} floated to vendors`); };

  const prepareCS = (d: ProcDoc) => { const code = nextCode("CS"); setStatus(d, "Closed"); addDoc({ code, type: "CS", ref: d.code, project: d.project, party: "L1 — best quote", items: d.items, qty: d.qty, unit: d.unit, amount: +(d.amount * 0.982).toFixed(1), date: dStr(0), status: "L1 Recommended", by: user.name }); log("Procurement", "Comparative Statement", code, `Quotations compared for ${d.ref} — L1 recommended`); toast("success", `${code} prepared — L1 recommended`); };

  const raisePO = (d: ProcDoc) => { const code = nextCode("PO"); addDoc({ code, type: "PO", ref: d.code, project: d.project, party: d.party.includes("L1") ? "Negotiated vendor" : d.party, items: d.items, qty: d.qty, unit: d.unit, amount: d.amount, date: dStr(0), status: "Pending Approval", by: user.name }); log("Procurement", "PO Raised", code, `₹${d.amount} L — awaiting approval`); notify("approval", `${code} (₹${d.amount} L) awaiting approval`); toast("success", `${code} raised — sent for approval`); };

  const approvePO = (d: ProcDoc) => { setStatus(d, "Approved"); log("Procurement", "PO Approved", d.code, `₹${d.amount} L — ${d.party}`); notify("approval", `${d.code} approved — goods can be received`); toast("success", `${d.code} approved`); };

  const receiveGRN = (d: ProcDoc) => {
    const code = nextCode("GRN");
    const received = Math.round(d.qty * 0.985 * 10) / 10;
    push((p) => {
      const mat = p.materials.find((m) => d.items.toLowerCase().includes(m.name.split(" ")[0].toLowerCase()));
      const stock = mat
        ? p.stock.some((st) => st.material === mat.name)
          ? p.stock.map((st) => st.material === mat.name ? { ...st, onHand: +(st.onHand + received).toFixed(1), value: +(st.value + received * mat.rate).toFixed(1) } : st)
          : [...p.stock, { material: mat.name, store: `Store — ${d.project}`, onHand: received, unit: d.unit, value: +(received * mat.rate).toFixed(1) }]
        : p.stock;
      return {
        ...p, stock,
        mTxns: [{ id: "x" + Date.now(), code, kind: "Inward" as const, material: mat?.name ?? d.items, qty: received, unit: d.unit, project: d.project, date: dStr(0), by: user.name }, ...p.mTxns],
        proc: [...p.proc, { id: "d" + Date.now(), code, type: "GRN" as ProcType, ref: d.code, project: d.project, party: d.party, items: d.items, qty: received, unit: d.unit, amount: d.amount, date: dStr(0), status: "Received", by: user.name }],
      };
    });
    log("Procurement", "GRN Posted", code, `${received} ${d.unit} received against ${d.code} — stock updated in Store module`);
    notify("stock", `GRN ${code}: ${received} ${d.unit} of ${d.items} added to stock`);
    toast("success", `${code} posted — stock updated automatically`);
  };

  const bookInvoice = (d: ProcDoc) => {
    const code = nextCode("INV-V");
    push((p) => ({
      ...p,
      apInvoices: [{ id: "ap" + Date.now(), no: code, vendor: d.party, ref: d.ref ?? d.code, amount: d.amount, due: dStr(-30), status: "Booked" as const }, ...p.apInvoices],
      proc: [...p.proc, { id: "d" + Date.now(), code, type: "PINV" as ProcType, ref: d.code, project: d.project, party: d.party, items: d.items, qty: d.qty, unit: d.unit, amount: d.amount, date: dStr(0), status: "Booked", by: user.name }],
      journals: [{ id: "j" + Date.now(), no: nextCode("JV"), date: dStr(0), debit: "Inventory — Materials", credit: "Sundry Creditors", amount: d.amount, narr: `${code} booked against ${d.ref}`, by: user.name }, ...p.journals],
    }));
    log("Finance", "Vendor Invoice Booked", code, `₹${d.amount} L — ${d.party} posted to Accounts Payable`);
    notify("payment", `Vendor invoice ${code} (₹${d.amount} L) booked to AP`);
    toast("success", `${code} booked — payable created`);
  };

  const schedulePay = (d: ProcDoc) => {
    const code = nextCode("PAY");
    push((p) => ({
      ...p,
      payments: [{ id: "py" + Date.now(), no: code, party: d.party, ref: d.code, amount: d.amount, date: dStr(0), mode: "NEFT", status: "Pending" as const }, ...p.payments],
      proc: p.proc.map((x) => x.id === d.id ? { ...x, status: "Scheduled" } : x).concat([{ id: "d" + Date.now(), code, type: "PAY" as ProcType, ref: d.code, project: d.project, party: d.party, items: "Against " + d.code, qty: 1, unit: "—", amount: d.amount, date: dStr(0), status: "Pending", by: user.name }]),
    }));
    log("Finance", "Payment Scheduled", code, `₹${d.amount} L → ${d.party}`);
    toast("success", `${code} scheduled for release`);
  };

  const releasePay = (d: ProcDoc) => {
    setStatus(d, "Released");
    push((p) => ({ ...p, payments: p.payments.map((x) => x.ref === d.ref ? { ...x, status: "Released" as const } : x) }));
    log("Finance", "Payment Released", d.code, `₹${d.amount} L → ${d.party} via NEFT`);
    notify("payment", `Payment ${d.code} released to ${d.party}`);
    toast("success", `Payment ${d.code} released`);
  };

  const actionsFor = (d: ProcDoc) => {
    const ok = can("procurement", "approve") || can("finance", "approve");
    if (d.type === "PR" && d.status === "Pending Approval") return ok ? <Btn sm kind="ok" onClick={(e: any) => { e.stopPropagation(); approvePR(d); }}><ICheck size={11} /> Approve</Btn> : null;
    if (d.type === "PR" && d.status === "Approved" && !docs.some((x) => x.ref === d.code)) return can("procurement", "create") ? <Btn sm onClick={(e: any) => { e.stopPropagation(); raiseRFQ(d); }}>Raise RFQ</Btn> : null;
    if (d.type === "RFQ" && d.status === "Open") return can("procurement", "create") ? <Btn sm onClick={(e: any) => { e.stopPropagation(); prepareCS(d); }}>Prepare CS</Btn> : null;
    if (d.type === "CS" && !docs.some((x) => x.ref === d.code)) return can("procurement", "create") ? <Btn sm onClick={(e: any) => { e.stopPropagation(); raisePO(d); }}>Raise PO</Btn> : null;
    if (d.type === "PO" && d.status === "Pending Approval") return ok ? <Btn sm kind="ok" onClick={(e: any) => { e.stopPropagation(); approvePO(d); }}><ICheck size={11} /> Approve</Btn> : null;
    if (d.type === "PO" && d.status === "Approved" && !docs.some((x) => x.ref === d.code)) return <Btn sm onClick={(e: any) => { e.stopPropagation(); receiveGRN(d); }}><ITruck size={12} /> Receive (GRN)</Btn>;
    if (d.type === "GRN" && !docs.some((x) => x.ref === d.code)) return can("finance", "create") || can("procurement", "create") ? <Btn sm onClick={(e: any) => { e.stopPropagation(); bookInvoice(d); }}><IReceipt size={12} /> Book Invoice</Btn> : null;
    if (d.type === "PINV" && d.status === "Booked" && !docs.some((x) => x.ref === d.code)) return can("finance", "create") ? <Btn sm onClick={(e: any) => { e.stopPropagation(); schedulePay(d); }}><IRupee size={12} /> Schedule Pay</Btn> : null;
    if (d.type === "PAY" && d.status === "Pending") return can("finance", "approve") ? <Btn sm kind="primary" onClick={(e: any) => { e.stopPropagation(); releasePay(d); }}><ICheck size={11} /> Release</Btn> : null;
    return null;
  };

  const cols: Col[] = [
    { key: "code", label: "Document", w: "120px", render: (d) => <span className="num text-[12.5px] font-bold text-brand-700">{d.code}</span> },
    { key: "type", label: "Stage", render: (d) => <span className="text-[10.5px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{PROC_LABEL[d.type]}</span> },
    { key: "project", label: "Project", render: (d) => <span className="text-[12px] text-ink-500">{d.project}</span> },
    { key: "items", label: "Items / Party", render: (d) => (
      <div><p className="text-[12.5px] font-semibold text-ink-900">{d.items}</p><p className="text-[10.5px] text-ink-400 mt-0.5">{d.party} · by {d.by}</p></div>) },
    { key: "qty", label: "Qty", align: "right", sort: (d) => d.qty, render: (d) => <span className="num text-[12px]">{d.qty.toLocaleString("en-IN")} {d.unit}</span> },
    { key: "amount", label: "Value (₹ L)", align: "right", sort: (d) => d.amount, render: (d) => <span className="num text-[12.5px] font-semibold text-ink-900">{d.amount.toFixed(1)}</span> },
    { key: "date", label: "Date", render: (d) => <span className="num text-[11.5px] text-ink-500">{d.date}</span> },
    { key: "status", label: "Status", render: (d) => <Pill value={d.status} pulse={d.status === "Pending Approval"} /> },
    { key: "act", label: "Action", render: (d) => <div className="flex items-center gap-1.5 justify-end">{actionsFor(d)}<button className="h-7 w-7 grid place-items-center rounded-md border border-line text-ink-400 hover:text-brand-700 hover:border-brand-200 transition-all active:scale-90" onClick={(e) => { e.stopPropagation(); setChain(d); }} title="View chain"><IEye size={12} /></button></div> },
  ];

  const createPR = () => {
    const mat = s.materials.find((m) => m.name === form.material);
    if (!mat || !form.qty) { toast("error", "Select a material and quantity"); return; }
    const qty = parseFloat(form.qty);
    const amount = +(qty * mat.rate * 10).toFixed(1); // rate is ₹ Cr/unit → ₹ L
    const code = nextCode("PR");
    addDoc({ code, type: "PR", project: form.project, party: mat.cat, items: mat.name, qty, unit: mat.unit, amount, date: dStr(0), status: "Pending Approval", by: user.name });
    log("Procurement", "PR Raised", code, `${mat.name} — ${qty} ${mat.unit} for ${form.project}`);
    notify("approval", `${code} (₹${amount} L) awaiting approval`);
    toast("success", `${code} raised — routed for approval`);
    setCreating(false);
    setForm({ material: "", qty: "", project: "P1", need: "" });
  };

  return (
    <div className="fade-up">
      <PageHead title="Procurement Management" crumbs={["Meridian", "Supply Chain", "Procurement"]}
        desc="End-to-end chain: Requisition → RFQ → Comparative Statement → Purchase Order → Receipt → Invoice → Payment. Every step posts to linked modules.">
        <Stat label="Pending approvals" value={`${pendingApprovals}`} tone={pendingApprovals ? "warn" : "ok"} />
        <Stat label="PO value (open+)" value={`₹${poValue.toFixed(0)} L`} />
        <Stat label="Avg cycle time" value="9.2 d" sub="PR → PO" />
        <Stat label="Savings YTD" value="₹84.6 L" tone="ok" sub="vs budgeted rates" />
        <AddBtn label="New Requisition" disabled={!can("procurement", "create")} tip="No create permission for your role" onClick={() => setCreating(true)} />
      </PageHead>

      {/* pipeline */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-4">
        {PROC_STAGES.map((t, i) => {
          const n = docs.filter((d) => d.type === t).length;
          const pending = docs.filter((d) => d.type === t && d.status === "Pending Approval").length;
          return (
            <button key={t} onClick={() => { setTab(t); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={cx("relative rounded-lg border px-3 py-2.5 text-left transition-all hover:-translate-y-[2px] hover:shadow-lift active:scale-[0.98]", tab === t ? "border-brand-500 bg-brand-50" : "border-line bg-surface")}>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.08em] text-ink-400">{PROC_LABEL[t]}</p>
              <p className="num text-[18px] font-semibold text-ink-900 mt-0.5">{n}</p>
              {pending > 0 && <span className="absolute top-2 right-2 num text-[9.5px] font-bold bg-amber-100 text-amber-600 rounded-full px-1.5 py-px">{pending} to approve</span>}
              {i < 6 && <span className="hidden md:block absolute top-1/2 -right-[7px] z-10 h-px w-[10px] bg-line-strong" />}
            </button>
          );
        })}
      </div>

      <Widget title="Procurement Documents" subtitle="Approve and advance documents down the chain — receipts update store stock, invoices post to payables.">
        <FilterBar pageKey="proc" q={q} onQ={setQ}
          filters={[{ key: "project", label: "Project", value: fProj, options: projects, onChange: setFProj }]}
          right={
            <Seg value={tab} onChange={setTab} options={[
              { k: "all" as const, l: "All", n: docs.length },
              ...PROC_STAGES.map((t) => ({ k: t as any, l: t, n: docs.filter((d) => d.type === t).length })),
            ] as any} />
          } />
        <DataTable pageKey="proc" rows={rows} cols={cols} onRow={(d) => setChain(d)} />
      </Widget>

      {/* chain drawer */}
      <Drawer wide open={!!chain} onClose={() => setChain(null)} title={`Document chain · ${chain?.code ?? ""}`} sub="Inter-module audit trail for this transaction">
        {chain && (
          <div>
            <ol className="relative">
              {lineage(chain).map((d, i, arr) => (
                <li key={d.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {i < arr.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-line" />}
                  <span className={cx("relative z-10 h-8 w-8 rounded-full grid place-items-center shrink-0 text-[10px] font-bold", d.type === chain.type ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700 border border-brand-200")}>{d.type}</span>
                  <div className="flex-1 min-w-0 border border-line rounded-lg px-3.5 py-2.5 bg-canvas/40">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="num text-[12.5px] font-bold text-ink-900">{d.code}</span>
                      <span className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400">{PROC_LABEL[d.type]}</span>
                      <span className="ml-auto"><Pill value={d.status} /></span>
                    </div>
                    <p className="text-[12px] text-ink-500 mt-1">{d.items} · {d.qty} {d.unit} · <b className="num text-ink-900">₹{d.amount.toFixed(1)} L</b></p>
                    <p className="text-[10.5px] text-ink-300 mt-1 num">{d.date} · {d.by} · {d.project}</p>
                    {d.type === "GRN" && <p className="text-[10.5px] font-semibold text-ok-600 mt-1">↳ Posted to store stock & material ledger</p>}
                    {d.type === "PINV" && <p className="text-[10.5px] font-semibold text-ok-600 mt-1">↳ Posted to Accounts Payable & GL journal</p>}
                  </div>
                </li>
              ))}
            </ol>
            <p className="text-[11px] text-ink-400 bg-canvas border border-line rounded-md px-3 py-2 mt-2">Audit reference: every stage transition is logged in Audit Trail with user, timestamp and IP.</p>
          </div>
        )}
      </Drawer>

      {/* create PR drawer */}
      <Drawer open={creating} onClose={() => setCreating(false)} title="New Purchase Requisition" sub="Material requirement → routed to approval workflow">
        <div className="space-y-4">
          <Field label="Material">
            <div className="relative">
              <select className={selectCls} value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}>
                <option value="">Select material…</option>
                {s.materials.map((m) => <option key={m.code} value={m.name}>{m.name} ({m.cat})</option>)}
              </select>
              <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Quantity"><input type="number" className={inputCls} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="0" /></Field>
            <Field label="Project / Cost centre">
              <div className="relative">
                <select className={selectCls} value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
                  {s.projects.map((p) => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
                </select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
              </div>
            </Field>
          </div>
          <Field label="Required by"><input className={inputCls} value={form.need} onChange={(e) => setForm({ ...form, need: e.target.value })} placeholder="e.g. 15 Apr 2026" /></Field>
          {form.material && form.qty && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-3 fade-up">
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-brand-700">Estimated value</p>
              <p className="num text-[18px] font-semibold text-ink-900 mt-0.5">₹{(parseFloat(form.qty || "0") * (s.materials.find((m) => m.name === form.material)?.rate ?? 0) * 10).toFixed(1)} L</p>
              <p className="text-[10.5px] text-ink-400 mt-0.5">At standard rate · final value from vendor quotations</p>
            </div>
          )}
          <div className="flex justify-end gap-2"><Btn onClick={() => setCreating(false)}>Cancel</Btn><Btn kind="primary" onClick={createPR}><IStamp size={13} /> Raise Requisition</Btn></div>
        </div>
      </Drawer>
    </div>
  );
}
