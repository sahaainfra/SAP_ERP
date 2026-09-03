import { useMemo, useState } from "react";
import { useERP, dStr } from "../store";
import { Pill, Widget, useToast, cx } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat, AddBtn } from "./shell";
import type { Col } from "./shell";
import { IChevD, ICheck } from "../icons";

type Tab = "gl" | "payables" | "receivables" | "bank";

export default function FinancePage() {
  const { s, setS, can, log, notify, nextCode, user } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("gl");
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("");
  const [journal, setJournal] = useState(false);
  const [jForm, setJForm] = useState({ debit: "", credit: "", amount: "", narr: "" });

  const glRows = useMemo(() => s.coa.filter((c) => (c.name + c.code + c.type).toLowerCase().includes(q.toLowerCase()) && (!fType || c.type === fType)), [s.coa, q, fType]);
  const apRows = useMemo(() => s.apInvoices.filter((a) => (a.no + a.vendor + a.ref).toLowerCase().includes(q.toLowerCase())), [s.apInvoices, q]);
  const arRows = useMemo(() => s.arInvoices.filter((a) => (a.no + a.client + a.ref).toLowerCase().includes(q.toLowerCase())), [s.arInvoices, q]);

  const receivable = s.arInvoices.reduce((a, x) => a + (x.amount - x.received), 0);
  const overdue = s.arInvoices.filter((a) => a.status === "Overdue").reduce((a, x) => a + x.amount, 0);
  const payable = s.apInvoices.filter((a) => a.status !== "Paid").reduce((a, x) => a + x.amount, 0);
  const cash = s.banks.reduce((a, b) => a + b.balance, 0);

  const glCols: Col[] = [
    { key: "code", label: "Code", render: (c) => <span className="num text-[12px] font-bold text-brand-700">{c.code}</span> },
    { key: "name", label: "Head", render: (c) => <span className="text-[12.5px] font-semibold text-ink-900">{c.name}</span> },
    { key: "type", label: "Type", render: (c) => <span className="text-[10.5px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{c.type}</span> },
    { key: "balance", label: "Balance (₹ Cr)", align: "right", sort: (c) => c.balance, render: (c) => <span className={cx("num text-[12.5px] font-semibold", c.balance < 0 ? "text-danger-600" : "text-ink-900")}>{c.balance.toFixed(1)}</span> },
  ];

  const apCols: Col[] = [
    { key: "no", label: "Invoice", render: (a) => <span className="num text-[12px] font-bold text-brand-700">{a.no}</span> },
    { key: "vendor", label: "Vendor", render: (a) => <span className="text-[12.5px] font-semibold text-ink-900">{a.vendor}</span> },
    { key: "ref", label: "Against", render: (a) => <span className="text-[11.5px] num text-ink-500">{a.ref}</span> },
    { key: "amount", label: "Amount (₹ L)", align: "right", sort: (a) => a.amount, render: (a) => <span className="num text-[12.5px] font-semibold">{a.amount.toFixed(1)}</span> },
    { key: "due", label: "Due", render: (a) => <span className="num text-[11.5px] text-ink-500">{a.due}</span> },
    { key: "status", label: "Status", render: (a) => <Pill value={a.status === "Paid" ? "Completed" : a.status === "Booked" ? "Pending" : "Submitted"} />, csv: (a) => a.status },
    { key: "act", label: "", render: (a) => a.status !== "Paid" && can("finance", "approve") ? (
      <Btn sm onClick={(e: any) => {
        e.stopPropagation();
        const code = nextCode("PAY");
        setS((p) => ({
          ...p,
          apInvoices: p.apInvoices.map((x) => x.id === a.id ? { ...x, status: "Scheduled" as const } : x),
          payments: [{ id: "py" + Date.now(), no: code, party: a.vendor, ref: a.no, amount: a.amount, date: dStr(0), mode: "NEFT", status: "Pending" as const }, ...p.payments],
        }));
        log("Finance", "Payment Requested", code, `₹${a.amount} L → ${a.vendor} against ${a.no}`);
        notify("payment", `Payment request ${code} raised for ${a.vendor}`);
        toast("success", `Payment request ${code} created`);
      }}><ICheck size={11} /> Request Pay</Btn>
    ) : null },
  ];

  const arCols: Col[] = [
    { key: "no", label: "Invoice", render: (a) => <span className="num text-[12px] font-bold text-brand-700">{a.no}</span> },
    { key: "client", label: "Client", render: (a) => <span className="text-[12.5px] font-semibold text-ink-900">{a.client}</span> },
    { key: "ref", label: "RA Bill", render: (a) => <span className="text-[11.5px] num text-ink-500">{a.ref}</span> },
    { key: "amount", label: "Billed (₹ Cr)", align: "right", sort: (a) => a.amount, render: (a) => <span className="num text-[12.5px] font-semibold">{a.amount.toFixed(2)}</span> },
    { key: "received", label: "Received", align: "right", sort: (a) => a.received, render: (a) => <span className="num text-[12px] text-ok-600 font-semibold">{a.received > 0 ? a.received.toFixed(2) : "—"}</span> },
    { key: "due", label: "Due", render: (a) => <span className={cx("num text-[11.5px]", a.status === "Overdue" ? "text-danger-600 font-semibold" : "text-ink-500")}>{a.due}</span> },
    { key: "status", label: "Status", render: (a) => <Pill value={a.status} pulse={a.status === "Overdue"} />, csv: (a) => a.status },
    { key: "act", label: "", render: (a) => a.status !== "Paid" && can("finance", "edit") ? (
      <Btn sm onClick={(e: any) => {
        e.stopPropagation();
        setS((p) => ({ ...p, arInvoices: p.arInvoices.map((x) => x.id === a.id ? { ...x, received: x.amount, status: "Paid" as const } : x) }));
        log("Finance", "Receipt Recorded", a.no, `₹${(a.amount - a.received).toFixed(2)} Cr received from ${a.client}`);
        notify("payment", `Client receipt recorded against ${a.no}`);
        toast("success", `Receipt recorded — ${a.no} settled`);
      }}>Record Receipt</Btn>
    ) : null },
  ];

  const postJournal = () => {
    const amt = parseFloat(jForm.amount);
    if (!jForm.debit || !jForm.credit || !amt) { toast("error", "Debit, credit and amount are mandatory"); return; }
    const no = nextCode("JV");
    setS((p) => ({ ...p, journals: [{ id: "j" + Date.now(), no, date: dStr(0), debit: jForm.debit, credit: jForm.credit, amount: amt, narr: jForm.narr || "Manual journal entry", by: user.name }, ...p.journals] }));
    log("Finance", "Journal Entry Posted", no, `Dr ${jForm.debit} / Cr ${jForm.credit} — ₹${amt} L`);
    toast("success", `Journal ${no} posted to GL`);
    setJournal(false);
    setJForm({ debit: "", credit: "", amount: "", narr: "" });
  };

  const heads = s.coa.map((c) => c.name);

  return (
    <div className="fade-up">
      <PageHead title="Finance & Accounts" crumbs={["Meridian", "Finance"]}
        desc="Chart of accounts, general ledger, payables, receivables and cash management with full approval routing.">
        <Stat label="Receivables" value={`₹${receivable.toFixed(1)} Cr`} tone={overdue > 20 ? "warn" : undefined} sub={`₹${overdue.toFixed(1)} Cr overdue`} />
        <Stat label="Payables" value={`₹${payable.toFixed(1)} Cr`} />
        <Stat label="Cash & bank" value={`₹${cash.toFixed(1)} Cr`} tone={cash < 0 ? "danger" : "ok"} />
        <AddBtn label="Journal Entry" disabled={!can("finance", "create")} tip="No create permission" onClick={() => setJournal(true)} />
      </PageHead>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        {s.banks.map((b) => (
          <div key={b.id} className="rounded-lg border border-line bg-surface px-3.5 py-3 hover:shadow-lift hover:-translate-y-[2px] transition-all duration-200">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold text-ink-700">{b.bank} <span className="num text-ink-400 font-normal">{b.no}</span></p>
              <span className="h-1.5 w-1.5 rounded-full bg-ok-500 tip" data-tip={`Reconciled ${b.reconciled}`} />
            </div>
            <p className="text-[10px] uppercase tracking-wide text-ink-400 mt-0.5">{b.type}</p>
            <p className={cx("num text-[18px] font-semibold mt-1", b.balance < 0 ? "text-danger-600" : "text-ink-900")}>₹{b.balance.toFixed(1)} Cr</p>
            <p className="text-[9.5px] text-ink-300 num mt-0.5">Reconciled {b.reconciled}</p>
          </div>
        ))}
        <div className="rounded-lg border border-dashed border-brand-300 bg-brand-50 px-3.5 py-3 flex flex-col justify-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-700">Cash flow forecast · 4 wks</p>
          <p className="num text-[18px] font-semibold text-ink-900 mt-0.5">+₹11.8 Cr</p>
          <p className="text-[10px] text-ink-400 mt-0.5">Expected receipts ₹41.2 Cr · payments ₹29.4 Cr</p>
        </div>
      </div>

      <Widget title={tab === "gl" ? "Chart of Accounts & General Ledger" : tab === "payables" ? "Accounts Payable" : tab === "receivables" ? "Accounts Receivable" : "Banking"}
        subtitle={tab === "gl" ? `${s.journals.length} journal entries this period` : tab === "payables" ? "Vendor bills posted from procurement invoices" : tab === "receivables" ? "Client invoices raised against certified RA bills" : "Bank positions and reconciliation status"}>
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={[
          { k: "gl" as const, l: "GL & Journals" }, { k: "payables" as const, l: "Payables", n: apRows.length },
          { k: "receivables" as const, l: "Receivables", n: arRows.length }, { k: "bank" as const, l: "Cash & Bank" },
        ]} /></div>

        {tab === "gl" && (
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-5">
            <div>
              <FilterBar pageKey="gl" q={q} onQ={setQ} filters={[{ key: "type", label: "Type", value: fType, options: ["Asset", "Liability", "Equity", "Revenue", "Expense"], onChange: setFType }]} />
              <DataTable pageKey="coa" rows={glRows} cols={glCols} pageSize={7} />
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Recent journal entries</p>
              <div className="space-y-2">
                {s.journals.map((j) => (
                  <div key={j.id} className="flex items-center gap-3 border border-line rounded-lg px-3 py-2.5 hover:border-line-strong transition-all">
                    <span className="num text-[11px] font-bold text-brand-700 w-[70px]">{j.no}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-ink-900 truncate">{j.narr}</p>
                      <p className="text-[10.5px] text-ink-400 num mt-0.5">Dr {j.debit} / Cr {j.credit} · {j.date} · {j.by}</p>
                    </div>
                    <span className="num text-[12.5px] font-semibold text-ink-900">₹{j.amount.toFixed(1)} L</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "payables" && <><FilterBar pageKey="ap" q={q} onQ={setQ} filters={[]} /><DataTable pageKey="ap" rows={apRows} cols={apCols} /></>}
        {tab === "receivables" && <><FilterBar pageKey="ar" q={q} onQ={setQ} filters={[]} /><DataTable pageKey="ar" rows={arRows} cols={arCols} /></>}

        {tab === "bank" && (
          <div>
            <p className="text-[12px] text-ink-500 mb-3">Bank reconciliation status — statement lines matched automatically; unmatched items route to accounts for review.</p>
            <div className="space-y-2">
              {s.banks.map((b) => (
                <div key={b.id} className="flex items-center gap-4 border border-line rounded-lg px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-ink-900">{b.bank} <span className="num text-ink-400 text-[11px] font-normal">{b.no}</span></p>
                    <p className="text-[11px] text-ink-400 mt-0.5">{b.type} · last reconciled {b.reconciled}</p>
                  </div>
                  <div className="w-[140px] hidden sm:block">
                    <div className="flex justify-between text-[10px] text-ink-400 mb-1"><span>Matched</span><span className="num font-semibold text-ok-600">96%</span></div>
                    <div className="h-[5px] rounded-full bg-line overflow-hidden"><div className="h-full bg-ok-500 rounded-full" style={{ width: "96%" }} /></div>
                  </div>
                  <span className={cx("num text-[15px] font-semibold", b.balance < 0 ? "text-danger-600" : "text-ink-900")}>₹{b.balance.toFixed(1)} Cr</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Widget>

      <Drawer open={journal} onClose={() => setJournal(false)} title="New Journal Entry" sub="Double-entry posting to the general ledger">
        <div className="space-y-4">
          {(["debit", "credit"] as const).map((side) => (
            <Field key={side} label={side === "debit" ? "Debit head" : "Credit head"}>
              <div className="relative">
                <select className={selectCls} value={jForm[side]} onChange={(e) => setJForm({ ...jForm, [side]: e.target.value })}>
                  <option value="">Select account head…</option>
                  {heads.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
              </div>
            </Field>
          ))}
          <Field label="Amount (₹ L)"><input type="number" className={inputCls} value={jForm.amount} onChange={(e) => setJForm({ ...jForm, amount: e.target.value })} placeholder="0.0" /></Field>
          <Field label="Narration"><input className={inputCls} value={jForm.narr} onChange={(e) => setJForm({ ...jForm, narr: e.target.value })} placeholder="e.g. Provision for site overheads — P2" /></Field>
          <div className="flex justify-end gap-2"><Btn onClick={() => setJournal(false)}>Cancel</Btn><Btn kind="primary" onClick={postJournal}>Post Entry</Btn></div>
        </div>
      </Drawer>
    </div>
  );
}
