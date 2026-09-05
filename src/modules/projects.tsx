/* Projects module — master, WBS/BOQ, billing, site issues */
import { useMemo, useState } from "react";
import { useERP } from "../store";
import type { Project } from "../data";
import { fmtNum } from "../data";
import { Bar, Pill, Widget, cx, useToast } from "../ui";
import { PageHead, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat, AddBtn, TrafficLight } from "./core";
import type { Col } from "./core";
import { IChevD, IHardhat } from "../icons";
import ProjectObjectPage from "../projectop";

export default function ProjectsPage() {
  const { s, setS, can, log, user } = useERP();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [obj, setObj] = useState<Project | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", client: "", location: "", contractValue: "", pm: "Sunita Deshmukh", end: "Dec 2027" });

  const rows = useMemo(() => s.projects.filter((p) =>
    (!fStatus || p.status === fStatus) &&
    (p.name + p.client + p.code + p.pm).toLowerCase().includes(q.toLowerCase())
  ), [s.projects, q, fStatus]);

  const cols: Col[] = [
    { key: "code", label: "Project", render: (p) => (
      <div>
        <div className="flex items-center gap-2"><TrafficLight status={p.status === "On Track" || p.status === "Completed" ? "green" : p.status === "Delayed" || p.status === "Attention Required" ? (p.budgetUtil > 85 || p.planned - p.progress > 4 ? "red" : "amber") : "green"} />
          <span className="num text-[11px] font-bold text-brand-700">{p.code}</span></div>
        <p className="text-[12.5px] font-semibold text-ink-900 leading-tight mt-0.5">{p.name}</p>
        <p className="text-[10.5px] text-ink-400">{p.location} · {p.manpower} manpower</p>
      </div>) },
    { key: "client", label: "Client", render: (p) => <span className="text-[12px] text-ink-500">{p.client}</span> },
    { key: "contractValue", label: "Contract (₹ Cr)", align: "right", sort: (p) => p.contractValue, render: (p) => <span className="num text-[12.5px] font-semibold text-ink-900">{fmtNum(p.contractValue, 0)}</span> },
    { key: "progress", label: "Progress", sort: (p) => p.progress, render: (p) => (
      <div className="w-[130px]"><div className="flex justify-between text-[10.5px] mb-1"><span className="num text-ink-500">plan {p.planned}%</span><span className="num font-bold text-ink-700">{p.progress}%</span></div><Bar value={p.progress} color={p.progress < p.planned ? "var(--color-warn-500)" : "var(--color-brand-500)"} h={5} /></div>) },
    { key: "budgetUtil", label: "Budget util.", align: "right", sort: (p) => p.budgetUtil, render: (p) => <span className={cx("num text-[12px] font-semibold", p.budgetUtil > 85 ? "text-danger-600" : "text-ink-700")}>{p.budgetUtil}%</span> },
    { key: "billing", label: "Billing", render: (p) => <Pill value={p.billing} pulse={p.billing === "Overdue"} /> },
    { key: "pm", label: "Manager", render: (p) => <span className="text-[12px] text-ink-500">{p.pm}</span> },
    { key: "end", label: "Expected", render: (p) => <span className="num text-[11.5px] text-ink-500">{p.end}</span> },
    { key: "margin", label: "Margin", align: "right", sort: (p) => p.margin, render: (p) => <span className={cx("num text-[11px] font-bold px-1.5 py-0.5 rounded", p.margin >= 11 ? "bg-ok-100 text-ok-600" : "bg-warn-100 text-warn-600")}>{p.margin}%</span> },
    { key: "status", label: "Status", render: (p) => <Pill value={p.status} pulse={p.status === "Delayed"} /> },
  ];

  const createProject = () => {
    if (!form.name || !form.code || !form.client) { toast("error", "Code, name and client are mandatory"); return; }
    setS((st) => ({
      ...st,
      projects: [...st.projects, {
        id: "p" + Date.now(), code: form.code, name: form.name, client: form.client, location: form.location || "Maharashtra",
        contractValue: parseFloat(form.contractValue) || 0, progress: 0, planned: 2, budgetUtil: 3, billing: "On Track",
        pm: form.pm, end: form.end, status: "On Track", manpower: 0, margin: 10.5, certified: 0, received: 0,
      }],
    }));
    log("Projects", "Project Created", form.code, `${form.name} · ${form.client}`);
    toast("success", `${form.code} created — cost centres & BOQ shell generated`);
    setCreating(false);
    setForm({ code: "", name: "", client: "", location: "", contractValue: "", pm: "Sunita Deshmukh", end: "Dec 2027" });
  };

  if (obj) return <ProjectObjectPage p={s.projects.find((x) => x.id === obj.id) ?? obj} onBack={() => setObj(null)} />;

  return (
    <div className="fade-up">
      <PageHead title="Project Management" crumbs={["Meridian", "Projects"]}
        desc="Project master with WBS, BOQ quantity progress, billing position and site issues — one dossier per project.">
        <Stat label="Active" value={`${s.projects.filter((p) => !["Completed"].includes(p.status)).length}`} />
        <Stat label="Contract value" value={`₹${fmtNum(s.projects.reduce((a, p) => a + p.contractValue, 0), 0)} Cr`} />
        <Stat label="Certified" value={`₹${fmtNum(s.projects.reduce((a, p) => a + p.certified, 0), 0)} Cr`} tone="ok" />
        <Stat label="At risk" value={`${s.projects.filter((p) => p.planned - p.progress > 3).length}`} tone="warn" />
        <AddBtn label="New Project" disabled={!can("projects", "create")} tip="No create permission" onClick={() => setCreating(true)} />
      </PageHead>

      <Widget title="Project Master" subtitle={`${rows.length} projects · click a row for WBS, BOQ, billing and site reports`}>
        <FilterBar pageKey="projects" q={q} onQ={setQ}
          filters={[{ key: "status", label: "Status", value: fStatus, options: ["On Track", "Delayed", "Attention Required", "Completed"], onChange: setFStatus }]} />
        <DataTable pageKey="projects" rows={rows} cols={cols} onRow={(p) => setObj(p)} pageSize={8} />
      </Widget>

      {/* Create */}
      <Drawer open={creating} onClose={() => setCreating(false)} title="New Project" sub="Registers cost centres and BOQ shell on save">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Project code"><input className={inputCls} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="PRJ-0XX" /></Field>
            <Field label="Contract value (₹ Cr)"><input type="number" className={inputCls} value={form.contractValue} onChange={(e) => setForm({ ...form, contractValue: e.target.value })} /></Field>
          </div>
          <Field label="Project name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Client"><input className={inputCls} value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} /></Field>
            <Field label="Location"><input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
            <Field label="Project manager"><input className={inputCls} value={form.pm} onChange={(e) => setForm({ ...form, pm: e.target.value })} /></Field>
            <Field label="Expected completion">
              <div className="relative">
                <select className={selectCls} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })}>
                  {["Jun 2026", "Dec 2026", "Jun 2027", "Dec 2027", "Jun 2028"].map((o) => <option key={o}>{o}</option>)}
                </select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
              </div>
            </Field>
          </div>
          <div className="flex justify-end gap-2"><Btn onClick={() => setCreating(false)}>Cancel</Btn><Btn kind="primary" onClick={createProject}><IHardhat size={13} /> Create Project</Btn></div>
        </div>
      </Drawer>
    </div>
  );
}

function Dossier({ p }: { p: Project; onUser: string }) {
  const { s } = useERP();
  const [tab, setTab] = useState<"overview" | "boq" | "billing" | "issues">("overview");
  const boq = s.billBoq.filter((b) => b.project === p.code);
  const bills = s.billDocs.filter((b) => b.project === p.code);
  const issues = [
    { id: "ISS-101", text: "Pier cap formwork alignment rework at P4-P5", sev: "High", age: "2 d" },
    { id: "ISS-103", text: "M-Sand quality variance in latest lot", sev: "Medium", age: "1 d" },
  ];
  const tabs = [["overview", "Overview"], ["boq", "WBS & BOQ"], ["billing", "Billing"], ["issues", "Site Issues"]] as const;

  return (
    <div>
      <div className="flex gap-1 mb-4 bg-canvas border border-line rounded-lg p-1 w-fit max-w-full overflow-x-auto">
        {tabs.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={cx("px-3.5 h-8 rounded-md text-[12px] font-semibold transition-all whitespace-nowrap", tab === k ? "bg-surface shadow-card text-ink-900" : "text-ink-400 hover:text-ink-700")}>{l}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="space-y-4 fade-up">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Stat label="Contract value" value={`₹${fmtNum(p.contractValue, 0)} Cr`} />
            <Stat label="Certified" value={`₹${fmtNum(p.certified, 1)} Cr`} />
            <Stat label="Received" value={`₹${fmtNum(p.received, 1)} Cr`} tone="ok" />
            <Stat label="Outstanding" value={`₹${fmtNum(p.certified - p.received, 1)} Cr`} tone={p.certified - p.received > 20 ? "warn" : undefined} />
            <Stat label="Manpower" value={fmtNum(p.manpower, 0)} />
            <Stat label="Margin" value={`${p.margin}%`} tone="ok" />
          </div>
          <div>
            <div className="flex justify-between text-[11.5px] mb-1.5"><span className="font-semibold text-ink-700">Physical progress</span><span className="num text-ink-500">plan {p.planned}% · actual {p.progress}%</span></div>
            <Bar value={p.progress} h={8} color={p.progress < p.planned ? "var(--color-warn-500)" : "var(--color-brand-500)"} />
            <p className="text-[10.5px] text-ink-400 mt-1.5">{p.progress >= p.planned ? "Ahead of / on baseline schedule" : `${p.planned - p.progress}% behind baseline — delay analysis in Reports`}</p>
          </div>
          <div>
            <div className="flex justify-between text-[11.5px] mb-1.5"><span className="font-semibold text-ink-700">Financial progress (cost vs budget)</span><span className="num text-ink-500">{p.budgetUtil}% consumed</span></div>
            <Bar value={p.budgetUtil} h={8} warn={p.budgetUtil > 85} />
          </div>
          <div className="rounded-lg border border-line p-3.5 bg-canvas/40">
            <p className="text-[10.5px] font-bold uppercase tracking-wide text-ink-400 mb-2">Milestones</p>
            {[["Foundation & substructure", 100], ["Superstructure", Math.min(100, p.progress + 8)], ["Finishes & handover", Math.max(0, p.progress - 22)]].map(([m, v]) => (
              <div key={m as string} className="flex items-center gap-3 py-1.5">
                <span className={cx("h-5 w-5 rounded-full grid place-items-center text-[9px] font-bold shrink-0", (v as number) >= 100 ? "bg-ok-100 text-ok-600" : "bg-brand-50 text-brand-700 border border-brand-200")}>{(v as number) >= 100 ? "✓" : `${v}%`}</span>
                <span className="text-[12px] text-ink-700 flex-1">{m}</span>
                <span className="w-[90px]"><Bar value={v as number} h={4} /></span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "boq" && (
        <div className="fade-up overflow-x-auto -mx-5 px-5">
          {boq.length === 0 ? <p className="text-[12px] text-ink-400 py-6 text-center">No BOQ lines yet — import from the Billing module's BOQ manager.</p> : (
            <table className="w-full text-left min-w-[720px]">
              <thead><tr className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
                <th className="font-bold pb-2 pr-3">Item</th><th className="font-bold pb-2 pr-3">Description</th><th className="font-bold pb-2 pr-3 text-right">Contract Qty</th>
                <th className="font-bold pb-2 pr-3 text-right">Prev</th><th className="font-bold pb-2 pr-3 text-right">Current</th><th className="font-bold pb-2 pr-3 text-right">Cumulative</th>
                <th className="font-bold pb-2 pr-3 text-right">Balance</th><th className="font-bold pb-2 text-right">% Done</th>
              </tr></thead>
              <tbody>{boq.map((b) => {
                const cum = b.prevQty + b.currentQty;
                const bal = b.contractQty - cum;
                const pct = (cum / b.contractQty) * 100;
                return (
                  <tr key={b.id} className="border-t border-line/80">
                    <td className="py-2.5 pr-3 num text-[11px] font-bold text-brand-700">{b.itemNo}</td>
                    <td className="py-2.5 pr-3"><p className="text-[12px] font-semibold text-ink-900">{b.desc}</p><p className="text-[10px] text-ink-400">{b.spec} · {b.unit} · ₹{fmtNum(b.rate, 0)}</p></td>
                    <td className="py-2.5 pr-3 text-right num text-[12px]">{fmtNum(b.contractQty, 0)}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px] text-ink-500">{fmtNum(b.prevQty, 0)}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold text-ok-600">+{fmtNum(b.currentQty, 0)}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold">{fmtNum(cum, 0)}</td>
                    <td className={cx("py-2.5 pr-3 text-right num text-[12px]", bal < 0 ? "text-danger-600 font-bold" : "text-ink-500")}>{fmtNum(bal, 0)}</td>
                    <td className="py-2.5 w-[90px]"><div className="flex items-center gap-2"><Bar value={pct} h={5} /><span className="num text-[10.5px] font-semibold text-ink-700 w-9">{pct.toFixed(0)}%</span></div></td>
                  </tr>);
              })}</tbody>
            </table>
          )}
        </div>
      )}

      {tab === "billing" && (
        <div className="space-y-2 fade-up">
          {bills.length === 0 && <p className="text-[12px] text-ink-400 py-6 text-center">No RA bills raised for this project yet.</p>}
          {bills.map((b) => (
            <div key={b.id} className="flex items-center gap-3 rounded-lg border border-line px-3.5 py-3 hover:border-line-strong transition-all">
              <div className="min-w-0 flex-1">
                <p className="num text-[12.5px] font-bold text-ink-900">{b.no} <span className="text-[10px] text-ink-400 font-normal">Rev {b.rev}</span></p>
                <p className="text-[10.5px] text-ink-400 mt-0.5">{b.period} · raised {b.date} by {b.by}</p>
              </div>
              <div className="text-right">
                <p className="num text-[13px] font-bold text-ink-900">₹{b.net.toFixed(2)} L</p>
                <p className="text-[10px] text-ink-400">gross ₹{b.gross.toFixed(2)} L</p>
              </div>
              <Pill value={b.status} pulse={b.status === "Under Client Certification" || b.status === "Returned for Correction"} />
            </div>
          ))}
        </div>
      )}

      {tab === "issues" && (
        <ul className="space-y-2 fade-up">
          {issues.map((i) => (
            <li key={i.id} className="flex items-center gap-3 rounded-lg border border-line bg-canvas/40 px-3 py-2.5">
              <Pill value={i.sev} />
              <div className="min-w-0 flex-1"><p className="text-[12px] font-medium text-ink-900 truncate">{i.text}</p><p className="text-[10.5px] text-ink-400 num mt-0.5">{i.id} · open {i.age}</p></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
