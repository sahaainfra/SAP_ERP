import { useMemo, useState } from "react";
import { useERP, dStr } from "../store";
import { CONTRACTS } from "../data";
import { Pill, Widget, useToast, cx } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat, AddBtn } from "./shell";
import type { Col } from "./shell";
import { IChevD } from "../icons";
import { printDocument } from "../print";

/* ═══ Commercial & Contracts ══════════════════════════════════ */
export function CommercialPage() {
  const { s } = useERP();
  const [tab, setTab] = useState<"contracts" | "variations" | "subs">("contracts");
  const [q, setQ] = useState("");

  const contractRows = useMemo(() => CONTRACTS.filter((c) => c.name.toLowerCase().includes(q.toLowerCase())), [q]);
  const varRows = useMemo(() => s.variations.filter((v) => (v.project + v.desc).toLowerCase().includes(q.toLowerCase())), [s.variations, q]);
  const subRows = useMemo(() => s.subBills.filter((b) => (b.sub + b.scope).toLowerCase().includes(q.toLowerCase())), [s.subBills, q]);

  const cCols: Col[] = [
    { key: "name", label: "Contract / Project", render: (c) => <div><p className="text-[12.5px] font-semibold text-ink-900">{c.name}</p><p className="text-[10.5px] text-ink-400">{c.client}</p></div> },
    { key: "base", label: "Base (₹ Cr)", align: "right", sort: (c) => c.base, render: (c) => <span className="num text-[12.5px] font-semibold">{c.base.toFixed(1)}</span> },
    { key: "variation", label: "Variations", align: "right", sort: (c) => c.variation, render: (c) => <span className="num text-[12px] text-amber-600 font-semibold">+{c.variation.toFixed(1)}</span> },
    { key: "certified", label: "Certified", align: "right", sort: (c) => c.certified, render: (c) => <span className="num text-[12px]">{c.certified.toFixed(1)}</span> },
    { key: "billed", label: "Billed", align: "right", sort: (c) => c.billed, render: (c) => <span className="num text-[12px]">{c.billed.toFixed(1)}</span> },
    { key: "margin", label: "Margin", align: "right", sort: (c) => c.margin, render: (c) => <span className={cx("num text-[11px] font-bold px-1.5 py-0.5 rounded", c.margin >= 11 ? "bg-ok-100 text-ok-600" : "bg-amber-100 text-amber-600")}>{c.margin}%</span> },
  ];

  const vCols: Col[] = [
    { key: "project", label: "Project", render: (v) => <span className="num text-[12px] font-bold text-brand-700">{v.project}</span> },
    { key: "desc", label: "Variation / Extra Item", render: (v) => <span className="text-[12.5px] font-medium text-ink-900">{v.desc}</span> },
    { key: "amount", label: "Value (₹ Cr)", align: "right", sort: (v) => v.amount, render: (v) => <span className="num text-[12.5px] font-semibold">{v.amount.toFixed(1)}</span> },
    { key: "status", label: "Status", render: (v) => <Pill value={v.status === "Approved" ? "Completed" : v.status === "Submitted" ? "Submitted" : "Pending"} pulse={v.status === "Under Review"} />, csv: (v) => v.status },
  ];

  const sCols: Col[] = [
    { key: "no", label: "Bill", render: (b) => <span className="num text-[12px] font-bold text-brand-700">{b.no}</span> },
    { key: "sub", label: "Subcontractor", render: (b) => <div><p className="text-[12.5px] font-semibold text-ink-900">{b.sub}</p><p className="text-[10.5px] text-ink-400">{b.scope}</p></div> },
    { key: "amount", label: "Measured (₹ Cr)", align: "right", sort: (b) => b.amount, render: (b) => <span className="num text-[12.5px] font-semibold">{b.amount.toFixed(2)}</span> },
    { key: "adv", label: "Advance Rec.", align: "right", sort: (b) => b.adv, render: (b) => <span className="num text-[12px] text-danger-600">−{b.adv.toFixed(2)}</span> },
    { key: "retention", label: "Retention", align: "right", sort: (b) => b.retention, render: (b) => <span className="num text-[12px] text-danger-600">−{b.retention.toFixed(2)}</span> },
    { key: "net", label: "Net Payable", align: "right", sort: (b) => b.net, render: (b) => <span className="num text-[12.5px] font-bold text-ink-900">{b.net.toFixed(2)}</span> },
    { key: "status", label: "Status", render: (b) => <Pill value={b.status === "Paid" ? "Completed" : b.status === "Submitted" ? "Submitted" : "Pending"} />, csv: (b) => b.status },
  ];

  return (
    <div className="fade-up">
      <PageHead title="Commercial & Contracts" crumbs={["Meridian", "Commercial"]}
        desc="Client contracts, variation claims, extra items and subcontractor billing with certification tracking.">
        <Stat label="Contract value" value={`₹${CONTRACTS.reduce((a, c) => a + c.base + c.variation, 0).toFixed(0)} Cr`} />
        <Stat label="Variations" value={`₹${s.variations.reduce((a, v) => a + v.amount, 0).toFixed(1)} Cr`} tone="warn" />
        <Stat label="Certified" value={`₹${CONTRACTS.reduce((a, c) => a + c.certified, 0).toFixed(0)} Cr`} />
        <Stat label="Avg margin" value={`${(CONTRACTS.reduce((a, c) => a + c.margin, 0) / CONTRACTS.length).toFixed(1)}%`} tone="ok" />
      </PageHead>
      <Widget title={tab === "contracts" ? "Client Contracts" : tab === "variations" ? "Variations & Extra Items" : "Subcontractor Billing"}
        subtitle={tab === "contracts" ? "Base scope plus approved variations with certification position" : tab === "variations" ? "Claims tracked through approval to certification" : "Running bills with advance and retention recoveries"}>
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={[
          { k: "contracts" as const, l: "Contracts", n: CONTRACTS.length }, { k: "variations" as const, l: "Variations", n: s.variations.length }, { k: "subs" as const, l: "Subcontractors", n: s.subBills.length },
        ]} /></div>
        <FilterBar pageKey={"com-" + tab} q={q} onQ={setQ} filters={[]} />
        {tab === "contracts" && <DataTable pageKey="contracts" rows={contractRows} cols={cCols} />}
        {tab === "variations" && <DataTable pageKey="variations" rows={varRows} cols={vCols} />}
        {tab === "subs" && <DataTable pageKey="subbills" rows={subRows} cols={sCols} />}
      </Widget>
    </div>
  );
}

/* ═══ Billing & RA Bills ══════════════════════════════════════ */
export function BillingPage() {
  const { s, setS, can, log, notify, user } = useERP();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [form, setForm] = useState({ project: "P1", current: "5.0" });

  const rows = useMemo(() => s.raBills.filter((r) => (r.no + r.project + r.client).toLowerCase().includes(q.toLowerCase())), [s.raBills, q]);
  const project = s.projects.find((p) => p.code === form.project);
  const lastBill = s.raBills.filter((r) => r.project === form.project).sort((a, b) => b.no.localeCompare(a.no))[0];
  const prev = lastBill ? lastBill.gross : 0;
  const cur = parseFloat(form.current) || 0;
  const gross = prev + cur;
  const retention = gross * 0.05;
  const sd = gross * 0.025;
  const adv = gross * 0.02;
  const gst = (gross - adv) * 0.18;
  const other = 0.3;
  const net = gross - retention - sd - adv - gst - other;

  const cols: Col[] = [
    { key: "no", label: "RA Bill", render: (r) => <span className="num text-[12.5px] font-bold text-brand-700">{r.no}</span> },
    { key: "project", label: "Project / Client", render: (r) => <div><p className="text-[12.5px] font-semibold text-ink-900">{r.project}</p><p className="text-[10.5px] text-ink-400">{r.client}</p></div> },
    { key: "prev", label: "Previous (₹ Cr)", align: "right", sort: (r) => r.prev, render: (r) => <span className="num text-[12px]">{r.prev.toFixed(2)}</span> },
    { key: "current", label: "Current (₹ Cr)", align: "right", sort: (r) => r.current, render: (r) => <span className="num text-[12px] font-semibold text-ok-600">+{r.current.toFixed(2)}</span> },
    { key: "gross", label: "Gross (₹ Cr)", align: "right", sort: (r) => r.gross, render: (r) => <span className="num text-[12.5px] font-semibold">{r.gross.toFixed(2)}</span> },
    { key: "ded", label: "Deductions", align: "right", sort: (r) => r.gross - r.net, render: (r) => <span className="num text-[12px] text-danger-600">−{(r.gross - r.net).toFixed(2)}</span> },
    { key: "net", label: "Net (₹ Cr)", align: "right", sort: (r) => r.net, render: (r) => <span className="num text-[12.5px] font-bold text-ink-900">{r.net.toFixed(2)}</span> },
    { key: "date", label: "Date", render: (r) => <span className="num text-[11.5px] text-ink-500">{r.date}</span> },
    { key: "status", label: "Status", render: (r) => <Pill value={r.status} pulse={r.status === "Submitted"} />, csv: (r) => r.status },
  ];

  const submitRA = () => {
    if (cur <= 0) { toast("error", "Enter the current period work value"); return; }
    const no = `RA-0${43 + s.raBills.length}`;
    const client = project?.client ?? "Client";
    setS((p) => ({
      ...p,
      raBills: [{ id: "r" + Date.now(), no, project: form.project, client, prev: +prev.toFixed(2), current: +cur.toFixed(2), gross: +gross.toFixed(2), retention: +retention.toFixed(2), sd: +sd.toFixed(2), adv: +adv.toFixed(2), gst: +gst.toFixed(2), other, net: +net.toFixed(2), status: "Submitted" as const, date: dStr(0) }, ...p.raBills],
      arInvoices: [{ id: "ar" + Date.now(), no: "INV-C-" + (2221 + s.arInvoices.length), client, ref: no, amount: +net.toFixed(2), due: dStr(-30), status: "Raised" as const, received: 0 }, ...p.arInvoices],
    }));
    log("Billing", "RA Bill Submitted", no, `${form.project} · gross ₹${gross.toFixed(2)} Cr · net ₹${net.toFixed(2)} Cr after deductions`);
    notify("approval", `${no} (₹${net.toFixed(2)} Cr) submitted to ${client} — receivable created`);
    toast("success", `${no} generated — client invoice & receivable posted`);
    setCreating(false);
  };

  return (
    <div className="fade-up">
      <PageHead title="Billing & RA Bills" crumbs={["Meridian", "Commercial", "RA Billing"]}
        desc="Running account bills with automatic deduction schedules — certification, invoicing and receivables in one flow.">
        <Stat label="Billed YTD" value={`₹${s.raBills.reduce((a, r) => a + r.net, 0).toFixed(1)} Cr`} />
        <Stat label="Awaiting certification" value={`${s.raBills.filter((r) => r.status === "Submitted").length}`} tone="warn" />
        <Stat label="Receivables" value={`₹${s.arInvoices.reduce((a, r) => a + (r.amount - r.received), 0).toFixed(1)} Cr`} />
        <AddBtn label="Generate RA Bill" disabled={!can("billing", "create")} tip="No create permission" onClick={() => setCreating(true)} />
      </PageHead>

      <Widget title="RA Bill Register" subtitle="Previous bill + current work = gross · less retention, security deposit, advance recovery, GST">
        <FilterBar pageKey="billing" q={q} onQ={setQ} filters={[]} />
        <DataTable pageKey="billing" rows={rows} cols={cols} onRow={(r) => setDetail(r)} />
      </Widget>

      <Drawer open={creating} onClose={() => setCreating(false)} title="Generate RA Bill" sub="Deduction engine computes the net bill live">
        <div className="space-y-4">
          <Field label="Project">
            <div className="relative">
              <select className={selectCls} value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
                {s.projects.filter((p) => p.status !== "Completed").map((p) => <option key={p.code} value={p.code}>{p.code} — {p.name}</option>)}
              </select>
              <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
            </div>
          </Field>
          <Field label="Current period work done (₹ Cr)"><input type="number" className={inputCls} value={form.current} onChange={(e) => setForm({ ...form, current: e.target.value })} placeholder="0.0" /></Field>
          <div className="rounded-lg border border-line p-4 space-y-1.5 bg-canvas/40">
            {[
              ["Previous bill (cumulative)", prev, ""],
              ["+ Current work done", cur, "text-ok-600"],
              ["= Gross work done", gross, "font-bold"],
              ["− Retention (5%)", -retention, "text-danger-600"],
              ["− Security deposit (2.5%)", -sd, "text-danger-600"],
              ["− Mobilisation advance (2%)", -adv, "text-danger-600"],
              ["− GST @18% (net of advance)", -gst, "text-danger-600"],
              ["− Other recoveries", -other, "text-danger-600"],
            ].map(([l, v, cls]) => (
              <div key={l as string} className={cx("flex justify-between text-[12px]", cls as string)}>
                <span className="text-ink-500">{l}</span>
                <span className={cx("num font-semibold", (v as number) < 0 ? "text-danger-600" : "text-ink-900")}>₹{Math.abs(v as number).toFixed(2)} Cr</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2.5 mt-2 border-t border-line">
              <span className="text-[12px] font-bold uppercase tracking-wide text-brand-700">Net payable</span>
              <span className="num text-[20px] font-bold text-ink-900">₹{net.toFixed(2)} Cr</span>
            </div>
          </div>
          <p className="text-[11px] text-ink-400">On submit: RA bill abstract, quantity sheet and deduction statement are filed to Documents; a client invoice is raised and posted to receivables.</p>
          <div className="flex justify-end gap-2"><Btn onClick={() => setCreating(false)}>Cancel</Btn><Btn kind="primary" onClick={submitRA}>Submit RA Bill</Btn></div>
        </div>
      </Drawer>

      <Drawer open={!!detail} onClose={() => setDetail(null)} title={`RA Bill ${detail?.no ?? ""}`} sub={detail ? `${detail.project} · ${detail.client} · ${detail.date}` : ""}>
        {detail && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Stat label="Gross" value={`₹${detail.gross.toFixed(2)} Cr`} />
              <Stat label="Net" value={`₹${detail.net.toFixed(2)} Cr`} tone="ok" />
            </div>
            <div className="rounded-lg border border-line p-4 space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Deduction statement</p>
              {[["Retention (5%)", detail.retention], ["Security deposit (2.5%)", detail.sd], ["Mobilisation advance", detail.adv], ["GST @18%", detail.gst], ["Other recoveries", detail.other]].map(([l, v]) => (
                <div key={l as string} className="flex justify-between text-[12px]"><span className="text-ink-500">{l}</span><span className="num font-semibold text-danger-600">−₹{(v as number).toFixed(2)} Cr</span></div>
              ))}
            </div>
            <p className="text-[11px] text-ink-400 bg-canvas border border-line rounded-md px-3 py-2">Linked invoice: INV-C vs {detail.no} · receivable tracks payment in Finance → Receivables.</p>
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setDetail(null)}>Close</Btn>
              <Btn kind="primary" onClick={() => printDocument({
                title: "Running Account Bill", docNo: detail.no, date: detail.date, project: `${detail.project} — ${detail.client}`,
                meta: [["Bill Type", "Running Account"], ["Currency", "INR (₹ Cr)"]],
                cols: [{ label: "Particulars" }, { label: "Amount (₹ Cr)", align: "right" }],
                rows: [
                  ["Previous bill (cumulative)", detail.prev], ["Current period work done", detail.current],
                  ["Gross work done", detail.gross], ["Less: Retention @ 5%", -detail.retention],
                  ["Less: Security deposit @ 2.5%", -detail.sd], ["Less: Mobilisation advance", -detail.adv],
                  ["Less: GST @ 18%", -detail.gst], ["Less: Other recoveries", -detail.other],
                ],
                totalsLabel: "Net Payable", totals: [detail.net],
                note: "Subject to client certification. Deductions as per contract agreement; retention release on defect-liability completion.",
                generatedBy: user.name,
              })}>Print RA Bill</Btn>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
