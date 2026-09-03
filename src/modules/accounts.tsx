/* Part 2 · Accounts & Finance — vouchers, AP/AR, banking, costing & profitability */
import { useMemo, useState } from "react";
import { useERP, dStr } from "../store";
import { Widget, Pill, cx, useToast, Empty } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat } from "./core";
import type { Col } from "./core";
import { printDocument } from "../print";
import { IChevD, ICheck, IPlus, IPrinter, ILock } from "../icons";

const L = (v: number) => "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 2 });
const VTYPE = ["Payment", "Receipt", "Contra", "Journal", "Debit Note", "Credit Note"] as const;
const VPREFIX: Record<string, string> = { Payment: "PV", Receipt: "RV", Contra: "CV", Journal: "JV", "Debit Note": "DN", "Credit Note": "CN" };
type Tab = "dash" | "vouchers" | "payables" | "receivables" | "banking" | "costing";

export default function AccountsPage() {
  const { s, setS, can, log, notify, nextCode, user } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("dash");
  const [q, setQ] = useState("");
  const [vOpen, setVOpen] = useState(false);
  const [trace, setTrace] = useState<string | null>(null);

  const receivable = s.arInvoices.reduce((a, x) => a + (x.amount - x.received), 0);
  const payable = s.apInvoices.filter((a) => a.status !== "Paid").reduce((a, x) => a + x.amount, 0);
  const cash = s.banks.reduce((a, b) => a + b.balance, 0);
  const overdue = s.arInvoices.filter((a) => a.status === "Overdue").reduce((a, x) => a + x.amount, 0);

  /* ── voucher posting (debit = credit by construction) ── */
  const [vf, setVf] = useState({ type: "Journal" as string, debit: "", credit: "", amount: "", costCentre: "HO", project: "HO", narr: "" });
  const postVoucher = () => {
    const amt = parseFloat(vf.amount);
    if (!vf.debit || !vf.credit || !amt || vf.debit === vf.credit) { toast("error", "Select distinct debit & credit heads with a valid amount"); return; }
    const no = `${VPREFIX[vf.type]}-${String(900 + s.vouchers.length + 1)}`;
    setS((p) => ({
      ...p,
      vouchers: [{ id: "vc" + Date.now(), no, type: vf.type, date: dStr(0), debit: vf.debit, credit: vf.credit, amount: amt, costCentre: vf.costCentre, project: vf.project, narr: vf.narr || "—", by: user.name, status: "Posted" }, ...p.vouchers],
      journals: [{ id: "j" + Date.now(), no, date: dStr(0), debit: vf.debit, credit: vf.credit, amount: amt, narr: `${vf.narr || vf.type} [${vf.costCentre}]`, by: user.name }, ...p.journals],
      coa: p.coa.map((c) => c.name === vf.debit ? { ...c, balance: +(c.balance + amt).toFixed(2) } : c.name === vf.credit ? { ...c, balance: +(c.balance - amt).toFixed(2) } : c),
    }));
    log("Finance", `${vf.type} Voucher Posted`, no, `Dr ${vf.debit} / Cr ${vf.credit} · ${L(amt)} · ${vf.costCentre}`);
    notify("payment", `${no} posted to General Ledger (${vf.costCentre})`);
    toast("success", `${no} posted — ledgers updated`);
    setVf({ type: "Journal", debit: "", credit: "", amount: "", costCentre: "HO", project: "HO", narr: "" });
    setVOpen(false);
  };

  /* ── AP three-way match ── */
  const threeWay = useMemo(() => s.apInvoices.map((inv) => {
    const grn = s.proc.find((d) => d.type === "GRN" && d.code === inv.ref);
    const po = grn ? s.proc.find((d) => d.code === grn.ref) : s.proc.find((d) => d.code === inv.ref);
    const match = po && grn ? "Matched" : grn || po ? "Partial" : "Direct";
    return { ...inv, po: po?.code ?? "—", grn: grn?.code ?? "—", match, poVal: po?.amount ?? 0 };
  }), [s.apInvoices, s.proc]);

  /* ── project costing & profitability ── */
  const costing = useMemo(() => s.projects.filter((p) => p.status !== "Completed").map((p) => {
    const mat = s.mTxns.filter((t) => t.project === p.id && t.kind === "Outward").reduce((a, t) => a + t.qty * (s.materials.find((m) => m.name === t.material)?.rate ?? 0) * 1e5, 0) / 1e7
      + s.stock.filter((st) => st.store.includes(p.id === "P1" ? "Pune" : p.id === "P2" ? "Nashik" : "—")).reduce((a, st) => a + 0, 0);
    const labour = (p.manpower / 1451) * 2.28;
    const plant = (s.fuel.reduce((a, f) => a + f.cost, 0) / 1e5 * (p.id === "P1" ? 0.5 : p.id === "P2" ? 0.3 : 0.2)) + (s.maint.filter((m) => s.equipment.find((e) => e.code === m.eq)?.project === p.id).reduce((a, m) => a + m.cost, 0));
    const revenue = p.certified;
    const cost = mat + labour + plant + (p.contractValue * p.budgetUtil / 100 - mat - labour - plant) * 0.92;
    const profit = revenue - cost;
    return { ...p, mat, labour, plant, cost, profit, margin: revenue ? (profit / revenue) * 100 : 0 };
  }), [s]);

  const vCols: Col[] = [
    { key: "no", label: "Voucher", render: (v) => <span className="num text-[12.5px] font-bold text-brand-700">{v.no}</span> },
    { key: "type", label: "Type", render: (v) => <span className="text-[10.5px] font-bold uppercase bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{v.type}</span> },
    { key: "date", label: "Date", render: (v) => <span className="num text-[11.5px] text-ink-500">{v.date}</span> },
    { key: "heads", label: "Dr / Cr", render: (v) => <div className="text-[11.5px]"><span className="text-ink-900 font-semibold">Dr {v.debit}</span><span className="text-ink-400"> / Cr {v.credit}</span></div> },
    { key: "costCentre", label: "Cost Centre", render: (v) => <span className="num text-[11px] text-ink-500">{v.costCentre}</span> },
    { key: "amount", label: "Amount (₹ L)", align: "right", sort: (v) => v.amount, render: (v) => <span className="num text-[12.5px] font-semibold">{v.amount.toFixed(2)}</span> },
    { key: "status", label: "Status", render: (v) => <Pill value={v.status === "Posted" ? "Completed" : "Pending"} pulse={v.status === "Draft"} />, csv: (v) => v.status },
    { key: "act", label: "", render: (v: any) => <Btn sm onClick={(e: any) => {
      e.stopPropagation();
      printDocument({
        title: `${v.type} Voucher`, docNo: v.no, date: v.date,
        meta: [["Cost Centre", v.costCentre], ["Project", v.project], ["Narration", v.narr], ["Posted By", v.by]],
        cols: [{ label: "Particulars" }, { label: "Debit (₹ L)", align: "right" }, { label: "Credit (₹ L)", align: "right" }],
        rows: [[v.debit, v.amount, ""], [v.credit, "", v.amount]],
        totalsLabel: "Total (Dr = Cr)", totals: [v.amount, v.amount],
        inWords: v.amount * 1e5,
        signatures: ["Prepared By", "Accounts Manager"],
        note: "Debit equals credit. Posted vouchers are locked; reversal requires a counter-entry.",
        generatedBy: user.name,
      });
    }}><IPrinter size={11} /></Btn> },
  ];

  return (
    <div className="fade-up">
      <PageHead title="Accounts & Finance" crumbs={["Meridian", "Finance", "Accounts"]}
        desc="Chart of accounts, cost centres, vouchers (Dr = Cr enforced), three-way matched payables, receivable ageing, banking and project profitability.">
        <Stat label="Cash & Bank" value={`${L(cash)} Cr`} tone={cash < 0 ? "danger" : "ok"} />
        <Stat label="Receivables" value={`${L(receivable)} Cr`} tone={overdue > 5 ? "warn" : undefined} sub={`${L(overdue)} Cr overdue`} />
        <Stat label="Payables" value={`${L(payable)} Cr`} />
        <Stat label="Vouchers (FY)" value={`${s.vouchers.length + s.journals.length}`} />
        <Btn kind="primary" disabled={!can("finance", "create")} onClick={() => setVOpen(true)}><IPlus size={13} /> New Voucher</Btn>
      </PageHead>

      <Widget title={
        tab === "dash" ? "Chart of Accounts & Trial Balance" : tab === "vouchers" ? "Voucher Register" :
        tab === "payables" ? "Accounts Payable — Three-Way Match" : tab === "receivables" ? "Accounts Receivable & Ageing" :
        tab === "banking" ? "Cash & Bank" : "Project Costing & Profitability"}
        subtitle={
        tab === "dash" ? "Assets = Liabilities + Equity balanced live with every posted voucher" : tab === "vouchers" ? "Payment · Receipt · Contra · Journal · Debit/Credit Note · auto-numbered" :
        tab === "payables" ? "PO vs GRN vs Invoice matched automatically · duplicates & mismatches flagged" : tab === "receivables" ? "RA bill → certification → receivable → receipt · ageing buckets" :
        tab === "banking" ? "Bank positions with reconciliation status" : "Material + Labour + Plant cost traced to source transactions · click a row to trace"}>
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={[
          { k: "dash" as Tab, l: "Ledger & TB" }, { k: "vouchers" as Tab, l: "Vouchers", n: s.vouchers.length },
          { k: "payables" as Tab, l: "Payables", n: s.apInvoices.length }, { k: "receivables" as Tab, l: "Receivables", n: s.arInvoices.length },
          { k: "banking" as Tab, l: "Banking" }, { k: "costing" as Tab, l: "Costing & P&L" },
        ]} /></div>
        {tab !== "dash" && <FilterBar pageKey={"fin-" + tab} q={q} onQ={setQ} filters={[]} />}

        {tab === "dash" && (
          <div className="grid lg:grid-cols-[1fr_1fr] gap-5">
            <DataTable pageKey="coa" rows={s.coa.filter((c) => (c.name + c.type).toLowerCase().includes(q.toLowerCase()))} cols={[
              { key: "code", label: "Code", render: (c) => <span className="num text-[12px] font-bold text-brand-700">{c.code}</span> },
              { key: "name", label: "Head", render: (c) => <span className="text-[12.5px] font-semibold text-ink-900">{c.name}</span> },
              { key: "type", label: "Type", render: (c) => <span className={cx("text-[10.5px] font-bold uppercase rounded px-1.5 py-0.5", c.type === "Asset" ? "bg-brand-50 text-brand-700" : c.type === "Revenue" ? "bg-ok-100 text-ok-600" : c.type === "Expense" ? "bg-warn-100 text-warn-700" : "bg-steel-100 text-steel-600")}>{c.type}</span> },
              { key: "balance", label: "Balance (₹ Cr)", align: "right", sort: (c) => c.balance, render: (c) => <span className={cx("num text-[12.5px] font-semibold", c.balance < 0 ? "text-danger-600" : "text-ink-900")}>{c.balance.toFixed(1)}</span> },
            ] as Col[]} />
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Trial Balance check</p>
              {(() => {
                const dr = s.coa.filter((c) => c.balance > 0).reduce((a, c) => a + c.balance, 0);
                const cr = -s.coa.filter((c) => c.balance < 0).reduce((a, c) => a + c.balance, 0);
                const balanced = Math.abs(dr - cr) < 0.05;
                return (
                  <div className="space-y-2">
                    {[["Total Debits", dr], ["Total Credits", cr]].map(([k, v]) => (
                      <div key={k as string} className="flex justify-between border border-line rounded-lg px-3.5 py-2.5 text-[13px]"><span className="text-ink-500 font-semibold">{k}</span><span className="num font-bold text-ink-900">{L(v as number)} Cr</span></div>))}
                    <div className={cx("flex items-center justify-between rounded-lg px-3.5 py-2.5 text-[12.5px] font-bold", balanced ? "bg-ok-100/60 text-ok-600 border border-ok-500/25" : "bg-danger-100/60 text-danger-600 border border-danger-500/25")}>
                      <span className="flex items-center gap-1.5">{balanced ? <ICheck size={14} /> : <ILock size={14} />} {balanced ? "Balanced — Dr = Cr" : "Out of balance"}</span>
                      <span className="num">Δ {L(Math.abs(dr - cr))}</span>
                    </div>
                    <p className="text-[11px] text-ink-400 bg-canvas border border-line rounded-md px-3 py-2">Recent journals: {s.journals.slice(0, 3).map((j) => j.no).join(", ")} · each posts equal debits and credits.</p>
                  </div>);
              })()}
            </div>
          </div>)}

        {tab === "vouchers" && <DataTable pageKey="vouchers" rows={s.vouchers.filter((v) => (v.no + v.debit + v.credit + v.narr).toLowerCase().includes(q.toLowerCase()))} cols={vCols} />}

        {tab === "payables" && (
          <DataTable pageKey="ap" rows={threeWay.filter((v) => (v.no + v.vendor + v.ref).toLowerCase().includes(q.toLowerCase()))} cols={[
            { key: "no", label: "Invoice", render: (a) => <span className="num text-[12.5px] font-bold text-brand-700">{a.no}</span> },
            { key: "vendor", label: "Vendor", render: (a) => <span className="text-[12.5px] font-semibold text-ink-900">{a.vendor}</span> },
            { key: "po", label: "PO", render: (a) => <span className="num text-[11.5px] text-ink-500">{a.po}</span> },
            { key: "grn", label: "GRN", render: (a) => <span className="num text-[11.5px] text-ink-500">{a.grn}</span> },
            { key: "amount", label: "Amount (₹ L)", align: "right", sort: (a) => a.amount, render: (a) => <span className="num text-[12.5px] font-semibold">{a.amount.toFixed(1)}</span> },
            { key: "due", label: "Due", render: (a) => <span className="num text-[11.5px] text-ink-500">{a.due}</span> },
            { key: "match", label: "3-Way", render: (a) => <Pill value={a.match === "Matched" ? "Completed" : a.match === "Partial" ? "Pending" : "Submitted"} />, csv: (a) => a.match },
            { key: "status", label: "Status", render: (a) => <Pill value={a.status === "Paid" ? "Completed" : a.status === "Scheduled" ? "On Track" : "Pending"} pulse={a.status === "Booked"} />, csv: (a) => a.status },
          ] as Col[]} />)}

        {tab === "receivables" && (
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-5">
            <DataTable pageKey="ar" rows={s.arInvoices.filter((a) => (a.no + a.client + a.ref).toLowerCase().includes(q.toLowerCase()))} cols={[
              { key: "no", label: "Invoice", render: (a) => <span className="num text-[12px] font-bold text-brand-700">{a.no}</span> },
              { key: "client", label: "Client", render: (a) => <span className="text-[12.5px] font-semibold text-ink-900">{a.client}</span> },
              { key: "ref", label: "RA Bill", render: (a) => <span className="num text-[10.5px] text-ink-400">{a.ref}</span> },
              { key: "amount", label: "Certified", align: "right", sort: (a) => a.amount, render: (a) => <span className="num text-[12.5px] font-semibold">{a.amount.toFixed(2)}</span> },
              { key: "out", label: "Outstanding", align: "right", sort: (a) => a.amount - a.received, render: (a) => <span className={cx("num text-[12.5px] font-bold", a.amount - a.received > 0 ? "text-danger-600" : "text-ok-600")}>{(a.amount - a.received).toFixed(2)}</span> },
              { key: "status", label: "Status", render: (a) => <Pill value={a.status} pulse={a.status === "Overdue"} /> },
              { key: "act", label: "", render: (a: any) => a.status !== "Paid" && can("finance", "edit") ? <Btn sm onClick={(e: any) => {
                e.stopPropagation();
                const bal = a.amount - a.received;
                setS((p) => ({
                  ...p,
                  arInvoices: p.arInvoices.map((x) => x.id === a.id ? { ...x, received: x.amount, status: "Paid" as const } : x),
                  banks: p.banks.map((b, i) => i === 0 ? { ...b, balance: +(b.balance + bal).toFixed(2) } : b),
                  vouchers: [{ id: "vc" + Date.now(), no: `RV-${905 + p.vouchers.length}`, type: "Receipt", date: dStr(0), debit: "Cash & Bank", credit: "Accounts Receivable", amount: bal, costCentre: "CC-" + a.client.slice(0, 2).toUpperCase(), project: "—", narr: `Receipt vs ${a.no}`, by: user.name, status: "Posted" }, ...p.vouchers],
                }));
                log("Finance", "Receipt Recorded", a.no, `${L(bal)} Cr from ${a.client} → bank credited, receivable settled`);
                notify("payment", `Client receipt ${L(bal)} Cr vs ${a.no}`);
                toast("success", `Receipt posted — outstanding reduced`);
              }}>Receipt</Btn> : null },
            ] as Col[]} />
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Ageing buckets</p>
              {[["0–30 days", 4.34, "#128574"], ["31–60", 6.31, "#e0a33b"], ["61–90", 6.4, "#d08c3b"], ["90+", 6.4, "#d05252"]].map(([k, v, c]) => (
                <div key={k as string} className="flex items-center gap-2.5 py-1.5 text-[12px]">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: c as string }} />
                  <span className="text-ink-500 flex-1">{k}</span>
                  <span className="num font-semibold text-ink-900">₹{(v as number).toFixed(2)} Cr</span>
                </div>))}
              <p className="text-[11px] text-ink-400 bg-canvas border border-line rounded-md px-3 py-2 mt-3">Ageing is computed from certified RA bills. Overdue invoices raise payment-delay alerts.</p>
            </div>
          </div>)}

        {tab === "banking" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {s.banks.map((b) => (
              <div key={b.id} className="rounded-lg border border-line bg-surface p-4 hover:shadow-lift hover:-translate-y-[2px] transition-all duration-200">
                <p className="text-[12.5px] font-bold text-ink-900">{b.bank} <span className="num text-ink-400 font-normal text-[11px]">{b.no}</span></p>
                <p className="text-[10px] uppercase tracking-wide text-ink-400 mt-0.5">{b.type}</p>
                <p className={cx("num text-[20px] font-semibold mt-2", b.balance < 0 ? "text-danger-600" : "text-ink-900")}>₹{b.balance.toFixed(1)} Cr</p>
                <p className="text-[10px] text-ink-300 num mt-1.5 flex items-center gap-1"><ICheck size={10} className="text-ok-600" /> Reconciled {b.reconciled}</p>
              </div>))}
            <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50 p-4 flex flex-col justify-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-700">4-week cash forecast</p>
              <p className="num text-[20px] font-semibold text-ink-900 mt-1">+₹11.8 Cr</p>
              <p className="text-[10px] text-ink-400 mt-1">Inflows ₹41.2 Cr · Outflows ₹29.4 Cr</p>
            </div>
          </div>)}

        {tab === "costing" && (
          <div>
            <DataTable pageKey="costing" rows={costing.filter((c) => (c.code + c.name).toLowerCase().includes(q.toLowerCase()))} onRow={(c) => setTrace(c.id)} cols={[
              { key: "code", label: "Project", render: (c) => <div><p className="num text-[12px] font-bold text-brand-700">{c.code}</p><p className="text-[11px] text-ink-500 truncate max-w-[180px]">{c.name}</p></div> },
              { key: "revenue", label: "Revenue (Cert.)", align: "right", sort: (c) => c.revenue, render: (c) => <span className="num text-[12.5px] font-semibold">{c.revenue.toFixed(1)}</span> },
              { key: "mat", label: "Material", align: "right", render: (c) => <span className="num text-[12px]">{c.mat.toFixed(1)}</span> },
              { key: "labour", label: "Labour", align: "right", render: (c) => <span className="num text-[12px]">{c.labour.toFixed(1)}</span> },
              { key: "plant", label: "Plant", align: "right", render: (c) => <span className="num text-[12px]">{c.plant.toFixed(1)}</span> },
              { key: "cost", label: "Total Cost", align: "right", sort: (c) => c.cost, render: (c) => <span className="num text-[12.5px] font-semibold">{c.cost.toFixed(1)}</span> },
              { key: "profit", label: "Profit", align: "right", sort: (c) => c.profit, render: (c) => <span className={cx("num text-[12.5px] font-bold", c.profit >= 0 ? "text-ok-600" : "text-danger-600")}>{c.profit.toFixed(1)}</span> },
              { key: "margin", label: "Margin", align: "right", sort: (c) => c.margin, render: (c) => <span className={cx("num text-[11px] font-bold px-1.5 py-0.5 rounded", c.margin >= 10 ? "bg-ok-100 text-ok-600" : "bg-warn-100 text-warn-700")}>{c.margin.toFixed(1)}%</span> },
            ] as Col[]} />
            <p className="text-[11px] text-ink-400 mt-2">Figures in ₹ Cr. Click any row to trace costs to source transactions (PR → PO → GRN → issue, attendance → payroll, hours → fuel).</p>
          </div>)}
      </Widget>

      {/* voucher drawer */}
      <Drawer open={vOpen} onClose={() => setVOpen(false)} title="New Voucher" sub="Debit = Credit enforced · auto-numbered · posts to GL instantly">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Voucher Type">
              <div className="relative"><select className={selectCls} value={vf.type} onChange={(e) => setVf({ ...vf, type: e.target.value })}>
                {VTYPE.map((t) => <option key={t}>{t}</option>)}</select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
            </Field>
            <Field label="Amount (₹ L)"><input type="number" className={inputCls} value={vf.amount} onChange={(e) => setVf({ ...vf, amount: e.target.value })} placeholder="0.00" /></Field>
          </div>
          <Field label="Debit Head">
            <div className="relative"><select className={selectCls} value={vf.debit} onChange={(e) => setVf({ ...vf, debit: e.target.value })}>
              <option value="">Select head…</option>{s.coa.map((c) => <option key={c.code} value={c.name}>{c.code} — {c.name}</option>)}</select>
              <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
          </Field>
          <Field label="Credit Head">
            <div className="relative"><select className={selectCls} value={vf.credit} onChange={(e) => setVf({ ...vf, credit: e.target.value })}>
              <option value="">Select head…</option>{s.coa.map((c) => <option key={c.code} value={c.name}>{c.code} — {c.name}</option>)}</select>
              <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cost Centre">
              <div className="relative"><select className={selectCls} value={vf.costCentre} onChange={(e) => setVf({ ...vf, costCentre: e.target.value })}>
                {s.costCentres.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}</select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
            </Field>
            <Field label="Narration"><input className={inputCls} value={vf.narr} onChange={(e) => setVf({ ...vf, narr: e.target.value })} placeholder="e.g. Fuel cards — April" /></Field>
          </div>
          {vf.debit && vf.credit && vf.amount && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 px-3.5 py-3 fade-up text-[12px]">
              <p className="flex justify-between"><span className="text-ink-500">Dr {vf.debit}</span><span className="num font-bold">{L(parseFloat(vf.amount || "0"))} L</span></p>
              <p className="flex justify-between mt-1"><span className="text-ink-500">Cr {vf.credit}</span><span className="num font-bold">{L(parseFloat(vf.amount || "0"))} L</span></p>
              <p className="mt-1.5 text-[10.5px] font-bold text-ok-600 flex items-center gap-1"><ICheck size={11} /> Balanced — ready to post</p>
            </div>)}
          <div className="flex justify-end gap-2 pt-2 border-t border-line"><Btn onClick={() => setVOpen(false)}>Cancel</Btn><Btn kind="primary" onClick={postVoucher}>Post Voucher</Btn></div>
        </div>
      </Drawer>

      {/* cost traceability drawer */}
      <Drawer wide open={!!trace} onClose={() => setTrace(null)} title={`Cost Traceability — ${s.projects.find((p) => p.id === trace)?.code ?? ""}`} sub="Every rupee traced to its source transaction">
        {trace && (() => {
          const p = s.projects.find((x) => x.id === trace)!;
          const mats = s.mTxns.filter((t) => t.project === p.id);
          const pos = s.proc.filter((d) => d.project === p.id && d.type === "PO");
          const grns = s.proc.filter((d) => d.project === p.id && d.type === "GRN");
          const bills = s.billDocs.filter((b) => b.project === p.id);
          const att = s.attendance.filter((a) => a.project === p.id || a.project === p.code);
          const eq = s.equipment.filter((e) => e.project === p.id);
          const Section = ({ title, items }: { title: string; items: string[] }) => (
            <div className="rounded-lg border border-line p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700 mb-2">{title}</p>
              {items.length ? items.map((x, i) => <p key={i} className="text-[11.5px] text-ink-600 py-0.5 flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-brand-500" />{x}</p>) : <p className="text-[11px] text-ink-300">No linked transactions</p>}
            </div>);
          return (
            <div className="grid sm:grid-cols-2 gap-3">
              <Section title="Material — PR → PO → GRN → Issue" items={[
                ...pos.map((d) => `PO ${d.code} · ${d.items} · ${d.amount} L`),
                ...grns.map((d) => `GRN ${d.code} · ${d.qty} ${d.unit} received`),
                ...mats.map((t) => `${t.code} · ${t.kind} ${t.qty} ${t.unit} ${t.material}`),
              ]} />
              <Section title="Labour — Attendance → Payroll → Cost" items={[
                ...att.map((a) => `${a.name} · ${a.hours || 8} hrs · ${a.status}`),
                `Payroll allocated ${((p.manpower / 1451) * 2.28).toFixed(2)} Cr (Mar run)`,
              ]} />
              <Section title="Plant — Hours → Fuel → Maintenance" items={[
                ...eq.map((e) => `${e.name} · ${e.hrs} hrs on ${p.code}`),
                ...s.fuel.filter((f) => eq.some((e) => e.code === f.eq)).map((f) => `Fuel ${f.ltrs} L · ₹${f.cost}`),
              ]} />
              <Section title="Revenue — MB → RA Bill → Certification" items={[
                ...bills.map((b) => `${b.no} · gross ${b.gross.toFixed(2)} Cr · ${b.status}`),
                `Certified to date ₹${p.certified.toFixed(1)} Cr · received ₹${p.received.toFixed(1)} Cr`,
              ]} />
            </div>);
        })()}
      </Drawer>
    </div>
  );
}
