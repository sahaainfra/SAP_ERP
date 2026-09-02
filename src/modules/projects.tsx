import { useEffect, useMemo, useState } from "react";
import { useERP } from "../store";
import type { Project } from "../data";
import { Bar, Pill, Widget, useToast, cx } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat, AddBtn } from "./shell";
import type { Col } from "./shell";
import { IChevD } from "../icons";

const WBS = [
  { id: "1", pkg: "Mobilisation & Site Setup", start: "Apr 2024", end: "Jun 2024", prog: 100, status: "Completed" },
  { id: "2", pkg: "Earthwork & Sub-grade", start: "May 2024", end: "Oct 2024", prog: 92, status: "On Track" },
  { id: "3", pkg: "Piling & Foundations", start: "Aug 2024", end: "Mar 2025", prog: 78, status: "On Track" },
  { id: "4", pkg: "Piers & Pier Caps", start: "Jan 2025", end: "Sep 2025", prog: 54, status: "Attention Required" },
  { id: "5", pkg: "Superstructure — Girders", start: "Jun 2025", end: "Feb 2026", prog: 31, status: "On Track" },
  { id: "6", pkg: "Deck Slab & Finishes", start: "Oct 2025", end: "Jul 2026", prog: 12, status: "Delayed" },
  { id: "7", pkg: "Roadwork & Handover", start: "Mar 2026", end: "Sep 2026", prog: 0, status: "Not Started" },
];

const BOQ = [
  { no: "1.1", desc: "Piling — Bored cast-in-situ 1200 mm", unit: "RMT", qty: 4820, rate: 18400 },
  { no: "2.3", desc: "PSC Girders — 30 m span", unit: "Nos", qty: 96, rate: 920000 },
  { no: "3.1", desc: "M40 Grade Concrete (RMC)", unit: "Cum", qty: 12400, rate: 5850 },
  { no: "3.4", desc: "High-yield deformed bars Fe550D", unit: "MT", qty: 2150, rate: 68400 },
  { no: "4.2", desc: "Deck slab formwork & staging", unit: "Sqm", qty: 31800, rate: 640 },
  { no: "5.1", desc: "Wearing course — SMA 11.5", unit: "MT", qty: 3900, rate: 7250 },
];

export default function ProjectsPage() {
  const { s, setS, can, log, notify, intent, setIntent, user } = useERP();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fClient, setFClient] = useState("");
  const [detail, setDetail] = useState<Project | null>(null);
  const [tab, setTab] = useState<"overview" | "wbs" | "boq" | "billing" | "reports">("overview");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", client: "", value: "", pm: "", end: "", type: "Highway / Viaduct" });

  useEffect(() => { if (intent?.route === "projects" && intent.kind === "new") { setCreating(true); setIntent(null); } }, [intent, setIntent]);

  const rows = useMemo(() => s.projects.filter((p) =>
    (p.name + p.client + p.code + p.pm).toLowerCase().includes(q.toLowerCase()) &&
    (!fStatus || p.status === fStatus) && (!fClient || p.client === fClient)
  ), [s.projects, q, fStatus, fClient]);

  const clients = [...new Set(s.projects.map((p) => p.client))];
  const totalValue = s.projects.reduce((a, p) => a + p.contractValue, 0);
  const active = s.projects.filter((p) => p.status !== "Completed");

  const cols: Col[] = [
    { key: "name", label: "Project", w: "240px", render: (p) => (
      <div>
        <p className="text-[12.5px] font-semibold text-ink-900 leading-tight">{p.name}</p>
        <p className="text-[10.5px] text-ink-400 num mt-0.5">{p.code} · {p.manpower} manpower on site</p>
      </div>) },
    { key: "client", label: "Client", render: (p) => <span className="text-[12px] text-ink-500">{p.client}</span> },
    { key: "contractValue", label: "Contract", align: "right", sort: (p) => p.contractValue, render: (p) => <span className="num text-[12.5px] font-semibold text-ink-900">₹{p.contractValue.toFixed(1)} Cr</span> },
    { key: "progress", label: "Progress", w: "150px", sort: (p) => p.progress, render: (p) => (
      <div className="flex items-center gap-2"><div className="flex-1"><Bar value={p.progress} /></div><span className="num text-[11px] font-semibold text-ink-700 w-8 text-right">{p.progress}%</span></div>) },
    { key: "planned", label: "Planned", align: "right", sort: (p) => p.planned, render: (p) => <span className={cx("num text-[11.5px] font-semibold", p.progress < p.planned ? "text-amber-600" : "text-ink-500")}>{p.planned}%</span> },
    { key: "billing", label: "Billing", render: (p) => <Pill value={p.billing} pulse={p.billing === "Overdue"} /> },
    { key: "pm", label: "Manager", render: (p) => <span className="text-[12px] text-ink-500">{p.pm}</span> },
    { key: "end", label: "Completion", render: (p) => <span className="text-[12px] num text-ink-500">{p.end}</span> },
    { key: "status", label: "Status", render: (p) => <Pill value={p.status} pulse={p.status === "Delayed"} /> },
  ];

  const createProject = () => {
    if (!form.name.trim() || !form.client.trim()) { toast("error", "Project name and client are mandatory"); return; }
    const code = `P${s.projects.length + 1}`;
    setS((p) => ({ ...p, projects: [...p.projects, { id: "pj" + Date.now(), code, name: form.name, client: form.client, contractValue: parseFloat(form.value) || 0, progress: 0, planned: 0, budgetUtil: 0, billing: "Pending", pm: form.pm || user.name, end: form.end || "—", status: "On Track", receivable: 0, payable: 0, manpower: 0, margin: 0 }] }));
    log("Projects", "Project Created", code, `${form.name} — ${form.client} · ₹${form.value || 0} Cr`);
    notify("project", `Project ${code} “${form.name}” created`);
    toast("success", `Project ${code} created and added to portfolio`);
    setCreating(false);
    setForm({ name: "", client: "", value: "", pm: "", end: "", type: "Highway / Viaduct" });
  };

  const raFor = (code: string) => s.raBills.filter((r) => r.project === code);
  const arFor = (code: string) => s.arInvoices.filter((a) => s.raBills.some((r) => r.project === code && r.no === a.ref));

  return (
    <div className="fade-up">
      <PageHead title="Project Management" crumbs={["Meridian", "Projects"]} desc="Project master, WBS planning, BOQ snapshot, billing and site reporting across the portfolio.">
        <Stat label="Portfolio" value={`${s.projects.length}`} sub={`${active.length} active`} />
        <Stat label="Contract value" value={`₹${totalValue.toFixed(0)} Cr`} />
        <Stat label="Avg progress" value={`${Math.round(active.reduce((a, p) => a + p.progress, 0) / Math.max(1, active.length))}%`} />
        <Stat label="Attention" value={`${s.projects.filter((p) => p.status === "Delayed" || p.status === "Attention Required").length}`} tone="warn" />
        <AddBtn label="New Project" disabled={!can("projects", "create")} tip="No create permission for your role" onClick={() => setCreating(true)} />
      </PageHead>

      <Widget title="Project Master" subtitle={`${rows.length} projects in view · click a row for WBS, BOQ, billing and site reports`}>
        <FilterBar pageKey="projects" q={q} onQ={setQ}
          filters={[
            { key: "status", label: "Status", value: fStatus, options: ["On Track", "Delayed", "Attention Required", "Completed"], onChange: setFStatus },
            { key: "client", label: "Client", value: fClient, options: clients, onChange: setFClient },
          ]} />
        <DataTable pageKey="projects" rows={rows} cols={cols} onRow={(p) => { setDetail(p); setTab("overview"); }} />
      </Widget>

      {/* create drawer */}
      <Drawer open={creating} onClose={() => setCreating(false)} title="Create Project" sub="Project master record · auto-numbered">
        <div className="space-y-4">
          <Field label="Project name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Nagpur Metro — Reach 4" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client"><input className={inputCls} value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="e.g. MSRDC" /></Field>
            <Field label="Contract value (₹ Cr)"><input type="number" className={inputCls} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0.0" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Project type">
              <div className="relative">
                <select className={selectCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  {["Highway / Viaduct", "Metro / Rail", "Building", "Water / Irrigation", "RMC Supply"].map((t) => <option key={t}>{t}</option>)}
                </select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
              </div>
            </Field>
            <Field label="Project manager"><input className={inputCls} value={form.pm} onChange={(e) => setForm({ ...form, pm: e.target.value })} placeholder={user.name} /></Field>
          </div>
          <Field label="Expected completion"><input className={inputCls} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} placeholder="e.g. Sep 2027" /></Field>
          <p className="text-[11px] text-ink-400 bg-canvas border border-line rounded-md px-3 py-2">A project cost centre, default WBS template and document folder are provisioned automatically on save.</p>
          <div className="flex justify-end gap-2 pt-1">
            <Btn onClick={() => setCreating(false)}>Cancel</Btn>
            <Btn kind="primary" onClick={createProject}>Create Project</Btn>
          </div>
        </div>
      </Drawer>

      {/* detail drawer */}
      <Drawer wide open={!!detail} onClose={() => setDetail(null)} title={detail?.name ?? ""} sub={detail ? `${detail.code} · ${detail.client} · PM ${detail.pm}` : ""}>
        {detail && (
          <div>
            <Seg value={tab} onChange={setTab} options={[
              { k: "overview", l: "Overview" }, { k: "wbs", l: "WBS & Progress" }, { k: "boq", l: "BOQ" },
              { k: "billing", l: `Billing (${raFor(detail.code).length})` }, { k: "reports", l: "Site Reports" },
            ] as any} />
            <div className="mt-4">
              {tab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <Stat label="Contract" value={`₹${detail.contractValue.toFixed(1)} Cr`} />
                    <Stat label="Margin" value={`${detail.margin}%`} tone="ok" />
                    <Stat label="Receivable" value={`₹${detail.receivable.toFixed(1)} Cr`} tone={detail.receivable > 30 ? "warn" : undefined} />
                    <Stat label="Payable" value={`₹${detail.payable.toFixed(1)} Cr`} />
                  </div>
                  <div className="rounded-lg border border-line p-4">
                    <div className="flex justify-between text-[11.5px] mb-2"><span className="font-bold uppercase tracking-wide text-ink-400">Physical progress</span><span className="num font-semibold text-ink-900">{detail.progress}% <span className="text-ink-400 font-normal">/ planned {detail.planned}%</span></span></div>
                    <Bar value={detail.progress} h={8} color={detail.progress < detail.planned ? "var(--color-warn-500)" : "var(--color-brand-500)"} />
                    <div className="flex justify-between text-[11.5px] mt-3 mb-2"><span className="font-bold uppercase tracking-wide text-ink-400">Budget utilisation</span><span className="num font-semibold text-ink-900">{detail.budgetUtil}%</span></div>
                    <Bar value={detail.budgetUtil} h={8} warn={detail.budgetUtil > 85} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[12px]">
                    {[["Status", detail.status], ["Billing", detail.billing], ["Completion", detail.end], ["Manpower", `${detail.manpower}`], ["Type", "Highway / Viaduct"], ["Location", "Pune, MH"]].map(([l, v]) => (
                      <div key={l} className="rounded-md border border-line bg-canvas/50 px-2.5 py-2">
                        <p className="text-[9.5px] font-bold uppercase tracking-wide text-ink-300">{l}</p>
                        <p className="text-[12px] font-semibold text-ink-700 mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tab === "wbs" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[560px]">
                    <thead><tr className="text-[10.5px] uppercase tracking-[0.08em] text-ink-400">
                      <th className="font-bold pb-2 pr-3">WBS</th><th className="font-bold pb-2 pr-3">Work package</th>
                      <th className="font-bold pb-2 pr-3">Window</th><th className="font-bold pb-2 pr-3 w-[140px]">Progress</th><th className="font-bold pb-2">Status</th>
                    </tr></thead>
                    <tbody>{WBS.map((w) => (
                      <tr key={w.id} className="border-t border-line/80">
                        <td className="py-2.5 pr-3 num text-[11.5px] text-ink-400">{w.id}</td>
                        <td className="py-2.5 pr-3 text-[12.5px] font-semibold text-ink-900">{w.pkg}</td>
                        <td className="py-2.5 pr-3 text-[11.5px] num text-ink-500">{w.start} → {w.end}</td>
                        <td className="py-2.5 pr-3"><div className="flex items-center gap-2"><div className="flex-1"><Bar value={w.prog} /></div><span className="num text-[11px] font-semibold w-8 text-right">{w.prog}%</span></div></td>
                        <td className="py-2.5"><Pill value={w.status} /></td>
                      </tr>))}
                    </tbody>
                  </table>
                </div>
              )}
              {tab === "boq" && (
                <div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[560px]">
                      <thead><tr className="text-[10.5px] uppercase tracking-[0.08em] text-ink-400">
                        <th className="font-bold pb-2 pr-3">Item</th><th className="font-bold pb-2 pr-3">Description</th>
                        <th className="font-bold pb-2 pr-3">Unit</th><th className="font-bold pb-2 pr-3 text-right">Qty</th>
                        <th className="font-bold pb-2 pr-3 text-right">Rate (₹)</th><th className="font-bold pb-2 text-right">Amount</th>
                      </tr></thead>
                      <tbody>{BOQ.map((b) => (
                        <tr key={b.no} className="border-t border-line/80">
                          <td className="py-2.5 pr-3 num text-[11.5px] text-ink-400">{b.no}</td>
                          <td className="py-2.5 pr-3 text-[12.5px] font-medium text-ink-900">{b.desc}</td>
                          <td className="py-2.5 pr-3 text-[11.5px] text-ink-500">{b.unit}</td>
                          <td className="py-2.5 pr-3 text-right num text-[12px]">{b.qty.toLocaleString("en-IN")}</td>
                          <td className="py-2.5 pr-3 text-right num text-[12px]">{b.rate.toLocaleString("en-IN")}</td>
                          <td className="py-2.5 text-right num text-[12px] font-semibold">{(b.qty * b.rate / 1e7).toFixed(2)} Cr</td>
                        </tr>))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-ink-400 mt-3">Showing key BOQ lines · full BOQ with rate analysis available in Commercial & Contracts → BOQ.</p>
                </div>
              )}
              {tab === "billing" && (
                <div className="space-y-4">
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">RA Bills</p>
                    {raFor(detail.code).length === 0 ? <p className="text-[12px] text-ink-400 border border-dashed border-line rounded-md p-3">No RA bills raised for this project yet.</p> : (
                      <table className="w-full text-left">
                        <thead><tr className="text-[10.5px] uppercase tracking-[0.08em] text-ink-400"><th className="font-bold pb-2 pr-3">Bill</th><th className="font-bold pb-2 pr-3 text-right">Gross</th><th className="font-bold pb-2 pr-3 text-right">Net</th><th className="font-bold pb-2">Status</th></tr></thead>
                        <tbody>{raFor(detail.code).map((r) => (
                          <tr key={r.id} className="border-t border-line/80">
                            <td className="py-2.5 pr-3 text-[12.5px] font-semibold text-ink-900">{r.no}<span className="text-ink-400 font-normal text-[11px] ml-2 num">{r.date}</span></td>
                            <td className="py-2.5 pr-3 text-right num text-[12px]">₹{r.gross.toFixed(2)} Cr</td>
                            <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold">₹{r.net.toFixed(2)} Cr</td>
                            <td className="py-2.5"><Pill value={r.status} /></td>
                          </tr>))}
                        </tbody>
                      </table>
                    )}
                  </div>
                  <div>
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Client Invoices</p>
                    {arFor(detail.code).length === 0 ? <p className="text-[12px] text-ink-400 border border-dashed border-line rounded-md p-3">No invoices linked.</p> : arFor(detail.code).map((a) => (
                      <div key={a.id} className="flex items-center gap-3 border border-line rounded-md px-3 py-2 mb-1.5">
                        <span className="text-[12.5px] font-semibold text-ink-900">{a.no}</span>
                        <span className="text-[11px] text-ink-400">vs {a.ref}</span>
                        <span className="ml-auto num text-[12px] font-semibold">₹{a.amount.toFixed(2)} Cr</span>
                        <Pill value={a.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {tab === "reports" && (
                <div className="space-y-2">
                  {[
                    ["DPR-0912", "Daily Progress Report — Piers P4/P5", "Yesterday 18:05", "Girder launch gantry shifted; 3 pile caps cast"],
                    ["DPR-0911", "Daily Progress Report — Deck Slab", "2 days ago", "Curing completed for segment D-12 to D-14"],
                    ["MR-0448", "Material Report — Cement", "2 days ago", "Consumption 38 MT/day vs plan 42 MT/day"],
                    ["EQ-0231", "Equipment Report — Excavator EQ-011", "3 days ago", "1,240 hour-metre · fuel 18 L/hr average"],
                    ["SI-0087", "Site Issue — Right-of-way at KM 12", "4 days ago", "Encroachment clearance pending with authority"],
                  ].map(([id, t, when, note]) => (
                    <div key={id} className="flex items-start gap-3 border border-line rounded-lg px-3 py-2.5 hover:border-line-strong transition-all">
                      <span className="num text-[10px] font-bold bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500 mt-0.5">{id}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-semibold text-ink-900">{t}</p>
                        <p className="text-[11.5px] text-ink-500 mt-0.5">{note}</p>
                        <p className="text-[10px] text-ink-300 mt-1">{when} · filed by site engineering</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
