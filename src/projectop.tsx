/* Meridian ERP · Project Object Page — full drill-down record */
import { useERP } from "./store";
import type { Project } from "./data";
import { Pill, Widget, cx } from "./ui";
import { ObjectPage, DocumentFlow, FieldRow, ProgressPair, navTo } from "./objectpage";
import { Stat } from "./modules/core";

const L = (v: number) => "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export default function ProjectObjectPage({ p, onBack }: { p: Project; onBack: () => void }) {
  const { s } = useERP();

  const boq = s.billBoq.filter((b) => b.project === p.id);
  const mbs = s.mbs.filter((m) => m.project === p.id);
  const bills = s.billDocs.filter((b) => b.project === p.id);
  const proc = s.proc.filter((d) => d.project === p.id);
  const txns = s.mTxns.filter((t) => t.project === p.id);
  const att = s.attendance.filter((a) => a.project === p.id);
  const equip = s.equipment.filter((e) => e.project === p.id);
  const qual = s.quality.filter((q) => q.project === p.id);
  const safe = s.safety.filter((x) => x.project === p.id);
  const audit = s.audit.filter((a) => a.entity.includes(p.id) || a.detail.includes(p.id) || a.entity.includes(p.code));

  const executed = boq.reduce((a, b) => a + (b.prevQty + b.currentQty) * b.rate, 0) / 1e7;
  const outstanding = bills.reduce((a, b) => a + (b.certifiedAmt ?? b.net) - (b.received ?? 0), 0);

  const th = (t: string) => <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-400">{t}</p>;

  return (
    <ObjectPage
      title={p.name} code={p.code} subtitle={`${p.client} · ${p.location} · PM ${p.pm} · Completion ${p.end}`}
      status={p.status}
      onBack={onBack}
      kpis={[
        { label: "Contract", value: L(p.contractValue) + " Cr" },
        { label: "Executed", value: L(executed) + " Cr" },
        { label: "Certified", value: L(p.certified) + " Cr" },
        { label: "Received", value: L(p.received) + " Cr" },
        { label: "Outstanding", value: L(Math.max(0, outstanding)) + " Cr", tone: outstanding > 0 ? "warn" : "ok" },
        { label: "Progress", value: p.progress + "%" },
        { label: "Budget Util", value: p.budgetUtil + "%", tone: p.budgetUtil > 85 ? "danger" : p.budgetUtil > 70 ? "warn" : undefined },
        { label: "Margin", value: p.margin + "%", tone: "ok" },
      ]}
      actions={[
        { label: "+ DPR", onClick: () => navTo("projects") },
        { label: "+ Measurement", onClick: () => navTo("billing") },
        { label: "+ RA Bill", onClick: () => navTo("billing"), primary: true },
        { label: "+ PR", onClick: () => navTo("procurement") },
        { label: "Receivables", onClick: () => navTo("accounts") },
      ]}
      tabs={[
        {
          id: "overview", label: "Overview", content: (
            <div className="grid lg:grid-cols-3 gap-4">
              <Widget title="Progress" subtitle="Planned vs physical">
                <ProgressPair planned={p.planned} actual={p.progress} />
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <Stat label="Manpower" value={p.manpower.toLocaleString("en-IN")} />
                  <Stat label="Status" value={p.status} />
                </div>
              </Widget>
              <Widget title="Contract" subtitle="Key commercial terms">
                <FieldRow label="Client">{p.client}</FieldRow>
                <FieldRow label="Contract Value">{L(p.contractValue)} Cr</FieldRow>
                <FieldRow label="Certified">{L(p.certified)} Cr</FieldRow>
                <FieldRow label="Received">{L(p.received)} Cr</FieldRow>
                <FieldRow label="Billing Status">{p.billing}</FieldRow>
              </Widget>
              <Widget title="Document Flow" subtitle="Execution → billing → receivable">
                <DocumentFlow stages={[
                  { label: "Contract", state: "done" },
                  { label: "BOQ", state: "done", ref: `${boq.length} items` },
                  { label: "Execution", state: "done", ref: p.progress + "%" },
                  { label: "Measurement", state: mbs.length ? "done" : "current", ref: `${mbs.length} MB` },
                  { label: "RA Bill", state: bills.length ? "done" : "pending", ref: bills[0]?.no?.split("/")[0] },
                  { label: "Certified", state: bills.some((b) => b.certifiedAmt) ? "done" : "current" },
                  { label: "Receivable", state: outstanding > 0 ? "current" : bills.some((b) => b.received) ? "done" : "pending" },
                ]} />
              </Widget>
            </div>
          ),
        },
        {
          id: "boq", label: "BOQ", count: boq.length, content: (
            <Widget title="Bill of Quantities" subtitle="Contract vs executed — cumulative validated">
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-left min-w-[720px]">
                  <thead><tr className="text-[10px] uppercase tracking-wide text-ink-400">
                    <th className="font-bold pb-2 pr-3">Item</th><th className="font-bold pb-2 pr-3">Unit</th>
                    <th className="font-bold pb-2 pr-3 text-right">Contract Qty</th><th className="font-bold pb-2 pr-3 text-right">Rate</th>
                    <th className="font-bold pb-2 pr-3 text-right">Cumulative</th><th className="font-bold pb-2 w-[140px]">Progress</th>
                  </tr></thead>
                  <tbody>{boq.map((b) => {
                    const cum = b.prevQty + b.currentQty;
                    const pct = Math.min(100, Math.round((cum / b.contractQty) * 100));
                    return (
                      <tr key={b.id} className="border-t border-line/80 hover:bg-brand-50/30 transition-colors">
                        <td className="py-2.5 pr-3"><p className="text-[12px] font-semibold text-ink-900">{b.itemNo} · {b.desc}</p><p className="text-[10px] text-ink-400">{b.spec}</p></td>
                        <td className="py-2.5 pr-3 text-[11px] text-ink-500">{b.unit}</td>
                        <td className="py-2.5 pr-3 text-right num text-[12px]">{b.contractQty.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 pr-3 text-right num text-[12px]">{b.rate.toLocaleString("en-IN")}</td>
                        <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold">{cum.toLocaleString("en-IN")}</td>
                        <td className="py-2.5"><div className="flex items-center gap-2"><div className="flex-1"><ProgressThin v={pct} /></div><span className="num text-[10.5px] font-semibold w-8 text-right">{pct}%</span></div></td>
                      </tr>);
                  })}</tbody>
                </table>
              </div>
            </Widget>
          ),
        },
        {
          id: "mb", label: "Measurements", count: mbs.length, content: (
            <Widget title="Measurement Book" subtitle="Certified measurements drive billing">
              <div className="space-y-2">
                {mbs.map((m) => {
                  const qty = m.meas.reduce((a, x) => a + x.nos * x.l * x.b * x.h, 0);
                  return (
                    <div key={m.id} className="border border-line rounded-lg px-3.5 py-3 hover:border-line-strong transition-all">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="num text-[12.5px] font-bold text-brand-700">{m.mbNo}</span>
                        <span className="text-[12px] text-ink-700 flex-1 min-w-[160px]">{m.boqNo} — {m.boqItem}</span>
                        <span className="num text-[12px] font-semibold">{qty.toFixed(1)} {m.unit}</span>
                        <Pill value={m.status === "Certified" ? "Completed" : "Submitted"} />
                      </div>
                      <p className="text-[10.5px] text-ink-400 mt-1">{m.location} · {m.drawing} · by {m.by} · {m.date}</p>
                    </div>);
                })}
                {mbs.length === 0 && <EmptyRow text="No measurements recorded for this project yet." />}
              </div>
            </Widget>
          ),
        },
        {
          id: "billing", label: "Billing", count: bills.length, content: (
            <Widget title="RA Bills" subtitle="Submission → certification → receivable">
              <div className="space-y-2">
                {bills.map((b) => (
                  <div key={b.id} className="border border-line rounded-lg px-3.5 py-3 hover:border-line-strong transition-all">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="num text-[12.5px] font-bold text-brand-700">{b.no}</span>
                      <span className="text-[11.5px] text-ink-500 flex-1">{b.period}</span>
                      <span className="num text-[12px]">Gross {L(b.gross)}</span>
                      <span className="num text-[12px] font-bold">Net {L(b.net)}</span>
                      {b.certifiedAmt && <span className="num text-[11.5px] text-ok-600 font-semibold">Certified {L(b.certifiedAmt)}</span>}
                      <Pill value={b.status} />
                    </div>
                  </div>))}
                {bills.length === 0 && <EmptyRow text="No RA bills raised for this project yet." />}
              </div>
            </Widget>
          ),
        },
        {
          id: "proc", label: "Procurement", count: proc.length, content: (
            <Widget title="Procurement Chain" subtitle="PR → RFQ → PO → GRN → Invoice → Payment">
              <div className="space-y-2">
                {proc.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 border border-line rounded-lg px-3.5 py-2.5 hover:border-line-strong transition-all">
                    <span className="text-[10px] font-bold uppercase bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{d.type}</span>
                    <span className="num text-[12px] font-bold text-brand-700">{d.code}</span>
                    <span className="text-[12px] text-ink-700 flex-1 min-w-0 truncate">{d.items}</span>
                    <span className="num text-[12px] font-semibold">{L(d.amount / 10)} L</span>
                    <Pill value={d.status} />
                  </div>))}
                {proc.length === 0 && <EmptyRow text="No procurement documents against this project." />}
              </div>
            </Widget>
          ),
        },
        {
          id: "mat", label: "Materials", count: txns.length, content: (
            <Widget title="Material Movements" subtitle="Inward / outward against this project">
              <div className="space-y-2">
                {txns.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 border border-line rounded-lg px-3.5 py-2.5 hover:border-line-strong transition-all">
                    <span className={cx("text-[10px] font-bold uppercase rounded px-1.5 py-0.5 border", t.kind === "Inward" ? "bg-ok-100 text-ok-600 border-ok-500/25" : "bg-amber-100 text-amber-600 border-amber-500/25")}>{t.kind}</span>
                    <span className="num text-[12px] font-bold text-brand-700">{t.code}</span>
                    <span className="text-[12px] text-ink-700 flex-1 min-w-0 truncate">{t.material}</span>
                    <span className="num text-[12px] font-semibold">{t.qty.toLocaleString("en-IN")} {t.unit}</span>
                    <span className="num text-[10.5px] text-ink-400">{t.date}</span>
                  </div>))}
                {txns.length === 0 && <EmptyRow text="No material transactions for this project." />}
              </div>
            </Widget>
          ),
        },
        {
          id: "labour", label: "Labour", count: att.length, content: (
            <Widget title="Labour & Attendance" subtitle="Deployed workforce on this project">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <Stat label="Marked" value={String(att.length)} />
                <Stat label="Approved" value={String(att.filter((a) => a.appr === "Approved").length)} tone="ok" />
                <Stat label="Pending" value={String(att.filter((a) => a.appr === "Pending").length)} tone="warn" />
                <Stat label="OT Hrs" value={att.reduce((a, x) => a + x.ot, 0).toFixed(1)} />
              </div>
              <div className="space-y-2">
                {att.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 border border-line rounded-lg px-3.5 py-2.5">
                    <span className="text-[12.5px] font-semibold text-ink-900 flex-1">{a.name}</span>
                    <span className="num text-[11.5px] text-ink-500">{a.hours || 0} hrs{a.ot ? ` + ${a.ot} OT` : ""}</span>
                    <Pill value={a.status} /><Pill value={a.appr} />
                  </div>))}
                {att.length === 0 && <EmptyRow text="No attendance captured against this project." />}
              </div>
            </Widget>
          ),
        },
        {
          id: "plant", label: "Plant", count: equip.length, content: (
            <Widget title="Plant & Equipment" subtitle="Allocated to this project">
              <div className="space-y-2">
                {equip.map((e) => (
                  <div key={e.code} className="flex items-center gap-3 border border-line rounded-lg px-3.5 py-2.5 hover:border-line-strong transition-all">
                    <span className="num text-[12px] font-bold text-brand-700">{e.code}</span>
                    <span className="text-[12.5px] font-semibold text-ink-900 flex-1">{e.name}</span>
                    <span className="num text-[11.5px] text-ink-500">{e.hrs.toLocaleString("en-IN")} hrs</span>
                    <span className="num text-[11.5px] text-ink-500">{e.fuel} L/day</span>
                    <Pill value={e.status} pulse={e.status === "Breakdown"} />
                  </div>))}
                {equip.length === 0 && <EmptyRow text="No equipment allocated to this project." />}
              </div>
            </Widget>
          ),
        },
        {
          id: "qs", label: "Quality & Safety", count: qual.length + safe.length, content: (
            <div className="grid lg:grid-cols-2 gap-4">
              <Widget title="Quality" subtitle="Inspections & tests">
                <div className="space-y-2">
                  {qual.map((q) => (
                    <div key={q.id} className="border border-line rounded-lg px-3.5 py-2.5">
                      <div className="flex items-center gap-2"><span className="num text-[12px] font-bold text-brand-700">{q.no}</span><Pill value={q.status} pulse={q.status === "Failed"} /></div>
                      <p className="text-[12px] text-ink-700 mt-1">{q.item}</p>
                    </div>))}
                  {qual.length === 0 && <EmptyRow text="No quality records." />}
                </div>
              </Widget>
              <Widget title="Safety" subtitle="Observations & incidents">
                <div className="space-y-2">
                  {safe.map((x) => (
                    <div key={x.id} className="border border-line rounded-lg px-3.5 py-2.5">
                      <div className="flex items-center gap-2"><span className="text-[10px] font-bold uppercase bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{x.kind}</span><Pill value={x.status} /></div>
                      <p className="text-[12px] text-ink-700 mt-1">{x.desc}</p>
                    </div>))}
                  {safe.length === 0 && <EmptyRow text="No safety records." />}
                </div>
              </Widget>
            </div>
          ),
        },
        {
          id: "audit", label: "Audit History", count: audit.length, content: (
            <Widget title="Audit Trail" subtitle="Every action on this project — immutable">
              <div className="space-y-2">
                {audit.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 border border-line rounded-lg px-3.5 py-2.5">
                    <span className="num text-[11px] font-bold text-brand-700 w-[64px] shrink-0">{a.id}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-ink-900">{a.action} · <span className="num">{a.entity}</span></p>
                      <p className="text-[10.5px] text-ink-400 truncate">{a.detail}</p>
                    </div>
                    <span className="text-[10.5px] text-ink-400 num shrink-0">{a.user}</span>
                  </div>))}
                {audit.length === 0 && <EmptyRow text="No audit entries reference this project yet." />}
              </div>
            </Widget>
          ),
        },
      ]}
    />
  );
}

function ProgressThin({ v }: { v: number }) {
  return (
    <div className="h-[5px] rounded-full bg-line/70 overflow-hidden">
      <div className={cx("h-full rounded-full transition-all duration-500", v >= 100 ? "bg-ok-500" : v > 80 ? "bg-brand-600" : "bg-steel-300")} style={{ width: `${Math.min(100, v)}%` }} />
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <p className="text-[12px] text-ink-400 border border-dashed border-line rounded-lg px-4 py-6 text-center">{text}</p>;
}
