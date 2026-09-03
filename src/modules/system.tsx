import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { useERP } from "../store";
import { MODULES, ROLES } from "../data";
import type { ModuleId } from "../data";
import { Pill, Widget, useToast, cx } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat, Modal } from "./shell";
import type { Col } from "./shell";
import { IFiles, IDownload, ICheck, IXCircle, IAlert } from "../icons";

/* ═══ Approvals (workflow queue) ══════════════════════════════ */
type QueueItem = { id: string; ref: string; kind: string; module: string; project: string; by: string; amount: string; date: string; doApprove: () => void; doReject?: () => void };

export function ApprovalsPage() {
  const { s, setS, can, log, notify } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");

  const queue: QueueItem[] = useMemo(() => {
    const items: QueueItem[] = [];
    s.proc.filter((d) => d.status === "Pending Approval").forEach((d) => items.push({
      id: d.id, ref: d.code, kind: d.type === "PR" ? "Purchase Request" : "Purchase Order", module: "Procurement", project: d.project, by: d.by, amount: `₹${d.amount.toFixed(1)} L`, date: d.date,
      doApprove: () => { setS((p) => ({ ...p, proc: p.proc.map((x) => x.id === d.id ? { ...x, status: "Approved" } : x) })); log("Approvals", `${d.type} Approved`, d.code, `${d.items} — ${d.project}`); notify("approval", `${d.code} approved from central queue`); toast("success", `${d.code} approved`); },
      doReject: () => { setS((p) => ({ ...p, proc: p.proc.map((x) => x.id === d.id ? { ...x, status: "Rejected" } : x) })); log("Approvals", `${d.type} Rejected`, d.code, `${d.items} — ${d.project}`); toast("info", `${d.code} rejected`); },
    }));
    s.attendance.filter((a) => a.appr === "Pending").forEach((a) => items.push({
      id: a.id, ref: a.empId, kind: "Attendance", module: "HR", project: a.project, by: a.name, amount: `${a.hours || 8} hrs`, date: "Today",
      doApprove: () => { setS((p) => ({ ...p, attendance: p.attendance.map((x) => x.id === a.id ? { ...x, appr: "Approved" } : x) })); log("Approvals", "Attendance Approved", a.empId, `${a.name} · ${a.hours || 8} hrs`); toast("success", `${a.name}'s attendance approved`); },
      doReject: () => { setS((p) => ({ ...p, attendance: p.attendance.map((x) => x.id === a.id ? { ...x, appr: "Rejected" } : x) })); log("Approvals", "Attendance Rejected", a.empId, a.name); toast("info", "Attendance rejected"); },
    }));
    s.leaves.filter((l) => l.status === "Pending").forEach((l) => items.push({
      id: l.id, ref: "LV-" + l.id.slice(1), kind: "Leave", module: "HR", project: "—", by: l.emp, amount: `${l.days} day(s)`, date: l.from,
      doApprove: () => { setS((p) => ({ ...p, leaves: p.leaves.map((x) => x.id === l.id ? { ...x, status: "Approved" } : x) })); log("Approvals", "Leave Approved", l.emp, `${l.type} · ${l.days} day(s)`); toast("success", `Leave approved for ${l.emp}`); },
      doReject: () => { setS((p) => ({ ...p, leaves: p.leaves.map((x) => x.id === l.id ? { ...x, status: "Rejected" } : x) })); log("Approvals", "Leave Rejected", l.emp, l.type); toast("info", "Leave rejected"); },
    }));
    s.raBills.filter((r) => r.status === "Submitted").forEach((r) => items.push({
      id: r.id, ref: r.no, kind: "RA Bill", module: "Billing", project: r.project, by: "Commercial Cell", amount: `₹${r.net.toFixed(2)} Cr`, date: r.date,
      doApprove: () => { setS((p) => ({ ...p, raBills: p.raBills.map((x) => x.id === r.id ? { ...x, status: "Certified" } : x) })); log("Approvals", "RA Bill Certified", r.no, `${r.project} · net ₹${r.net.toFixed(2)} Cr`); notify("approval", `${r.no} certified by client`); toast("success", `${r.no} certified`); },
    }));
    s.payments.filter((p) => p.status === "Pending").forEach((p) => items.push({
      id: p.id, ref: p.no, kind: "Vendor Payment", module: "Finance", project: "—", by: "Accounts", amount: `₹${p.amount.toFixed(1)} L`, date: p.date,
      doApprove: () => { setS((st) => ({ ...st, payments: st.payments.map((x) => x.id === p.id ? { ...x, status: "Released" } : x) })); log("Approvals", "Payment Released", p.no, `₹${p.amount.toFixed(1)} L → ${p.party}`); notify("payment", `${p.no} released to ${p.party}`); toast("success", `${p.no} released`); },
    }));
    return items;
  }, [s, setS, log, notify, toast]);

  const kinds = ["all", ...new Set(queue.map((i) => i.kind))];
  const rows = queue.filter((i) => (tab === "all" || i.kind === tab) && (i.ref + i.by + i.kind + i.project).toLowerCase().includes(q.toLowerCase()));

  const cols: Col[] = [
    { key: "ref", label: "Request", render: (i) => <span className="num text-[12.5px] font-bold text-brand-700">{i.ref}</span> },
    { key: "kind", label: "Type", render: (i) => <span className="text-[10.5px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{i.kind}</span> },
    { key: "module", label: "Module", render: (i) => <span className="text-[12px] text-ink-500">{i.module}</span> },
    { key: "project", label: "Project", render: (i) => <span className="text-[12px] num text-ink-500">{i.project}</span> },
    { key: "by", label: "Requested by", render: (i) => <span className="text-[12px] text-ink-700">{i.by}</span> },
    { key: "amount", label: "Amount", align: "right", render: (i) => <span className="num text-[12.5px] font-semibold text-ink-900">{i.amount}</span> },
    { key: "date", label: "Submitted", render: (i) => <span className="num text-[11.5px] text-ink-500">{i.date}</span> },
    { key: "act", label: "Decision", render: (i: QueueItem) => {
      const allowed = can(i.module.toLowerCase() === "hr" ? "hr" : i.module.toLowerCase() === "billing" ? "billing" : i.module.toLowerCase() === "finance" ? "finance" : "procurement", "approve") || can("approvals", "approve");
      if (!allowed) return <Pill value="Pending" pulse />;
      return (
        <span className="flex gap-1.5 justify-end">
          <Btn sm kind="ok" onClick={(e: any) => { e.stopPropagation(); i.doApprove(); }}><ICheck size={11} /> Approve</Btn>
          {i.doReject && <Btn sm kind="danger" onClick={(e: any) => { e.stopPropagation(); i.doReject?.(); }}><IXCircle size={11} /></Btn>}
        </span>);
    } },
  ];

  return (
    <div className="fade-up">
      <PageHead title="Approval Center" crumbs={["Meridian", "Workflow", "Approvals"]}
        desc="Unified queue across procurement, HR, billing and finance — routed by the configurable workflow engine.">
        <Stat label="In queue" value={`${queue.length}`} tone={queue.length ? "warn" : "ok"} />
        <Stat label="SLA breaches" value="1" tone="danger" sub="PO-1287 > 48 h" />
        <Stat label="Avg decision time" value="6.4 h" tone="ok" />
      </PageHead>
      <Widget title="Pending Approvals" subtitle="Amount-tiered, sequential and parallel rules configured in Settings → Workflows">
        <FilterBar pageKey="approvals" q={q} onQ={setQ} filters={[]}
          right={<Seg value={tab} onChange={setTab} options={kinds.map((k) => ({ k, l: k === "all" ? "All" : k, n: k === "all" ? queue.length : queue.filter((i) => i.kind === k).length })) as any} />} />
        <DataTable pageKey="approvals" rows={rows} cols={cols} empty={{ title: "Queue is clear", note: "New approval requests from every module will appear here in real time." }} />
      </Widget>
    </div>
  );
}

/* ═══ Documents ═══════════════════════════════════════════════ */
export function DocumentsPage() {
  const { s, setS, can, log, user } = useERP();
  const toast = useToast();
  const [folder, setFolder] = useState(s.folders[0]);
  const [q, setQ] = useState("");

  const rows = s.docs.filter((d) => d.folder === folder && d.name.toLowerCase().includes(q.toLowerCase()));
  const cols: Col[] = [
    { key: "name", label: "Document", render: (d) => (
      <div className="flex items-center gap-2.5">
        <span className="h-8 w-8 rounded-md grid place-items-center bg-brand-50 text-brand-700 border border-brand-100 shrink-0 text-[9px] font-bold">{d.type}</span>
        <div><p className="text-[12.5px] font-semibold text-ink-900">{d.name}</p><p className="text-[10.5px] text-ink-400 num">v{d.ver} · {d.size} · {d.uploaded} · {d.by}</p></div>
      </div>) },
    { key: "ver", label: "Version", align: "center", sort: (d) => d.ver, render: (d) => <span className="num text-[11px] font-bold bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">v{d.ver}</span> },
    { key: "expiry", label: "Expiry", render: (d) => d.expiry ? <span className="num text-[11px] font-semibold text-amber-600 tip" data-tip="Expiring document — renewal alert raised">{d.expiry}</span> : <span className="text-[11px] text-ink-300">—</span> },
    { key: "act", label: "", render: (d) => (
      <span className="flex gap-1.5 justify-end">
        <Btn sm onClick={(e: any) => {
          e.stopPropagation();
          const blob = new Blob([`${d.name}\n\nMeridian ERP — controlled copy (demo)\nFolder: ${d.folder} · v${d.ver}`], { type: "text/plain" });
          const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = d.name.replace(/\.[a-z]+$/i, "") + ".txt"; a.click();
          log("Documents", "Downloaded", d.name, `v${d.ver} by ${user.name}`);
          toast("success", `${d.name} downloaded`);
        }}><IDownload size={11} /> Get</Btn>
        {can("documents", "edit") && <Btn sm onClick={(e: any) => {
          e.stopPropagation();
          setS((p) => ({ ...p, docs: p.docs.map((x) => x.id === d.id ? { ...x, ver: x.ver + 1, uploaded: "Today" } : x) }));
          log("Documents", "Version Updated", d.name, `v${d.ver} → v${d.ver + 1}`);
          toast("success", `New version v${d.ver + 1} checked in`);
        }}>New ver.</Btn>}
      </span>) },
  ];

  return (
    <div className="fade-up">
      <PageHead title="Document Management" crumbs={["Meridian", "DMS"]} desc="Versioned contracts, drawings, BOQs, invoices and certificates with expiry alerts.">
        <Stat label="Documents" value={`${s.docs.length}`} />
        <Stat label="Expiring ≤30 d" value={`${s.docs.filter((d) => d.expiry).length}`} tone="warn" />
      </PageHead>
      <div className="grid md:grid-cols-[220px_1fr] gap-4">
        <Widget title="Folders" bodyClass="p-2.5">
          <ul className="space-y-0.5">
            {s.folders.map((f) => (
              <li key={f}>
                <button onClick={() => setFolder(f)} className={cx("w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left text-[12px] font-medium transition-all active:scale-[0.98]", folder === f ? "bg-brand-50 text-brand-700 border border-brand-200" : "text-ink-500 hover:bg-canvas border border-transparent")}>
                  <IFiles size={13} /> <span className="truncate flex-1">{f}</span>
                  <span className="num text-[10px] text-ink-300">{s.docs.filter((d) => d.folder === f).length}</span>
                </button>
              </li>
            ))}
          </ul>
        </Widget>
        <Widget title={folder} subtitle="Controlled copies — downloads are audit-logged">
          <FilterBar pageKey="docs" q={q} onQ={setQ} filters={[]} />
          <DataTable pageKey="docs" rows={rows} cols={cols} empty={{ title: "Folder is empty", note: "Upload documents from the module they belong to." }} />
        </Widget>
      </div>
    </div>
  );
}

/* ═══ Reports ═════════════════════════════════════════════════ */
const REPORTS = [
  { cat: "Project", items: [["Project Progress (planned vs actual)", "progress"], ["Project Cost — Budget vs Actual", "cost"], ["Manpower Deployment", "manpower"]] },
  { cat: "Financial", items: [["Cash Flow Statement", "cash"], ["Receivables Ageing", "ageing"], ["Project Profitability", "profit"]] },
  { cat: "Procurement", items: [["Vendor Performance", "vendor"], ["Purchase Analysis", "purchase"]] },
  { cat: "Material", items: [["Stock Register", "stock"], ["Consumption vs BOQ", "consumption"]] },
  { cat: "HR", items: [["Attendance Summary", "attendance"], ["Monthly Attendance Register", "register"], ["Late Coming & Overtime", "lateot"], ["Payroll Register", "payroll"]] },
  { cat: "Approvals", items: [["Pending Approval Ageing", "ageing-appr"], ["Approval Turnaround Time", "turnaround"], ["Rejection Analysis", "rejection"]] },
] as const;

export function ReportsPage() {
  const { s, log } = useERP();
  const toast = useToast();
  const [preview, setPreview] = useState<string | null>(null);

  const gen = (name: string): { head: string[]; rows: (string | number)[][] } => {
    if (name.includes("Ageing")) return { head: ["Bucket", "Amount (₹ Cr)", "Share %"], rows: [["0–30 days", 58.2, 31], ["31–60", 42.6, 23], ["61–90", 38.1, 20], ["90+", 47.5, 26]] };
    if (name.includes("Stock")) return { head: ["Material", "Store", "On Hand", "Value (₹ Cr)"], rows: s.stock.map((x) => [x.material, x.store, `${x.onHand} ${x.unit}`, x.value]) };
    if (name.includes("Attendance")) return { head: ["Employee", "Project", "Hours", "OT", "Status"], rows: s.attendance.map((a) => [a.name, a.project, a.hours, a.ot, a.status]) };
    if (name.includes("Payroll")) return { head: ["Employee", "Gross", "Deductions", "Net"], rows: s.employees.map((e) => [e.name, e.base * 1.2, e.base * 0.12, e.base * 1.08]) };
    if (name.includes("Register")) return { head: ["Employee", "Project", "P", "A", "L", "HD", "OT hrs"], rows: s.employees.map((e, i) => [e.name, e.project ?? "P" + ((i % 4) + 1), 22 - (i % 3), i % 3, i % 2, i % 2, (i % 4) * 3]) };
    if (name.includes("Late Coming")) return { head: ["Employee", "Project", "Late days", "OT hrs", "Missing punch"], rows: s.employees.slice(0, 6).map((e, i) => [e.name, e.project ?? "P" + ((i % 4) + 1), (i * 7) % 4, (i * 5) % 12, i % 2]) };
    if (name.includes("Ageing")) return { head: ["Request", "Type", "Pending with", "Age (hrs)"], rows: [["PR-0092", "Purchase Requisition", "Procurement Manager", 41], ["PO-1288", "Purchase Order", "Accounts Manager", 26], ["RA-0772", "RA Bill", "Commercial Manager", 52], ["PAY-3341", "Vendor Payment", "Director", 9]] };
    if (name.includes("Turnaround")) return { head: ["Module", "Avg hrs", "SLA hrs", "Compliance %"], rows: [["Procurement", 6.4, 24, 94], ["Finance", 4.1, 12, 97], ["HR", 9.2, 24, 88], ["Billing", 14.6, 48, 91]] };
    if (name.includes("Rejection")) return { head: ["Reason", "Count", "Share %"], rows: [["Duplicate request", 6, 35], ["Not budgeted", 5, 29], ["Specification mismatch", 4, 24], ["Incomplete details", 2, 12]] };
    if (name.includes("Vendor")) return { head: ["Vendor", "Open POs", "On-time %"], rows: [["UltraTech Cement", 2, 96], ["Tata Steel", 1, 92], ["Sika India", 1, 88]] };
    if (name.includes("Cash Flow")) return { head: ["Month", "Inflow", "Outflow", "Net"], rows: [["Nov", 28.4, 26.1, 2.3], ["Dec", 32.0, 29.4, 2.6], ["Jan", 24.8, 27.9, -3.1], ["Feb", 36.2, 30.1, 6.1], ["Mar", 41.5, 33.6, 7.9]] };
    return { head: ["Project", "Value (₹ Cr)", "Status"], rows: s.projects.map((p) => [p.name, p.contractValue, p.status]) };
  };

  return (
    <div className="fade-up">
      <PageHead title="Reports & Analytics" crumbs={["Meridian", "Reports"]} desc="Standard management information packs — filtered by project and period, exportable to Excel and PDF.">
        <Stat label="Report templates" value={`${REPORTS.reduce((a, g) => a + g.items.length, 0)}`} />
        <Stat label="Scheduled" value="4" sub="email every Monday" />
      </PageHead>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map((g) => (
          <Widget key={g.cat} title={`${g.cat} Reports`} bodyClass="p-3">
            <ul className="space-y-1.5">
              {g.items.map(([name, key]) => (
                <li key={key} className="flex items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 hover:border-brand-200 hover:bg-brand-50/30 transition-all group">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-ink-900 leading-snug">{name}</p>
                    <p className="text-[10px] text-ink-300 mt-0.5">PDF · XLSX · scheduled</p>
                  </div>
                  <Btn sm onClick={() => { setPreview(name); log("Reports", "Report Generated", name, "On-demand run with current filters"); }}>Preview</Btn>
                </li>
              ))}
            </ul>
          </Widget>
        ))}
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview ?? ""}>
        {preview && (() => {
          const r = gen(preview);
          return (
            <div>
              <div className="overflow-auto max-h-[300px] rounded-lg border border-line">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-canvas"><tr>{r.head.map((h) => <th key={h} className="text-[10px] uppercase tracking-wide font-bold text-ink-400 px-3 py-2">{h}</th>)}</tr></thead>
                  <tbody>{r.rows.map((row, i) => (
                    <tr key={i} className="border-t border-line/70">{row.map((c, j) => <td key={j} className={cx("px-3 py-2 text-[12px]", typeof c === "number" ? "num text-right" : "text-ink-700")}>{typeof c === "number" ? c.toLocaleString("en-IN") : c}</td>)}</tr>
                  ))}</tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Btn onClick={() => {
                  const blob = new Blob([["\uFEFF", r.head.join(","), ...r.rows.map((x) => x.join(","))].join("\n")], { type: "text/csv" });
                  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = preview.replace(/\s+/g, "-").toLowerCase() + ".csv"; a.click();
                  toast("success", "Report exported to Excel (CSV)");
                }}><IDownload size={12} /> Excel</Btn>
                <Btn kind="primary" onClick={() => { log("Reports", "Report Printed", preview, "PDF via print dialog"); window.print(); }}>Print / PDF</Btn>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}

/* ═══ Analytics ═══════════════════════════════════════════════ */
export function AnalyticsPage() {
  const { s, dark } = useERP();
  const grid = dark ? "#243140" : "#e7ecf1";
  const axis = { stroke: dark ? "#7d92a5" : "#8ca0b0", fontSize: 10.5, fontFamily: "IBM Plex Mono", tickLine: false, axisLine: false } as const;
  const margin = [
    { m: "Nov", margin: 9.8 }, { m: "Dec", margin: 10.4 }, { m: "Jan", margin: 10.1 }, { m: "Feb", margin: 11.2 }, { m: "Mar", margin: 11.6 },
  ];
  const manpower = [
    { m: "Nov", labour: 1310, staff: 142 }, { m: "Dec", labour: 1388, staff: 146 }, { m: "Jan", labour: 1296, staff: 149 }, { m: "Feb", labour: 1428, staff: 151 }, { m: "Mar", labour: 1451, staff: 154 },
  ];
  const share = s.projects.filter((p) => p.status !== "Completed").slice(0, 5).map((p) => ({ name: p.code, value: p.contractValue }));
  const COLORS = ["#0c7264", "#128574", "#3ba391", "#e0a33b", "#7e93a5"];

  return (
    <div className="fade-up">
      <PageHead title="Analytics & Insights" crumbs={["Meridian", "Insights"]} desc="Cross-module analytics — profitability trends, portfolio mix, vendor performance and workforce curves.">
        <Stat label="Portfolio margin" value="11.6%" tone="ok" sub="+1.5 pts vs Nov" />
        <Stat label="Revenue trend" value="+18.2%" tone="ok" />
        <Stat label="At-risk projects" value={`${s.projects.filter((p) => p.progress < p.planned).length}`} tone="warn" />
      </PageHead>
      <div className="grid lg:grid-cols-2 gap-4">
        <Widget title="Blended margin trend" subtitle="Portfolio-level projected margin, monthly">
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={margin} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
              <defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#128574" stopOpacity={0.25} /><stop offset="100%" stopColor="#128574" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="m" {...axis} dy={6} /><YAxis {...axis} domain={[8, 13]} unit="%" />
              <Tooltip contentStyle={{ background: "#101b24", border: "1px solid #2b3f4f", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#8fa6b8" }} />
              <Area dataKey="margin" stroke="#128574" strokeWidth={2.2} fill="url(#mg)" name="Margin %" />
            </AreaChart>
          </ResponsiveContainer>
        </Widget>
        <Widget title="Workforce curve" subtitle="Labour vs staff headcount across sites">
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={manpower} margin={{ top: 6, right: 6, left: -10, bottom: 0 }} barSize={16}>
              <CartesianGrid stroke={grid} vertical={false} />
              <XAxis dataKey="m" {...axis} dy={6} /><YAxis {...axis} />
              <Tooltip contentStyle={{ background: "#101b24", border: "1px solid #2b3f4f", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#8fa6b8" }} />
              <Bar dataKey="labour" fill="#0c7264" radius={[3, 3, 0, 0]} name="Labour" />
              <Bar dataKey="staff" fill={dark ? "#41566a" : "#c6d3de"} radius={[3, 3, 0, 0]} name="Staff" />
            </BarChart>
          </ResponsiveContainer>
        </Widget>
        <Widget title="Contract value mix" subtitle="Share of active portfolio by project">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0" style={{ width: 170, height: 170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={share} dataKey="value" nameKey="name" innerRadius={58} outerRadius={80} paddingAngle={2.5} strokeWidth={0}>{share.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie>
                  <Tooltip contentStyle={{ background: "#101b24", border: "1px solid #2b3f4f", borderRadius: 8, fontSize: 12 }} /></PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center text-center"><div><p className="num text-[17px] font-semibold text-ink-900">₹{share.reduce((a, x) => a + x.value, 0).toFixed(0)}</p><p className="text-[9.5px] uppercase tracking-wide text-ink-400">Cr active</p></div></div>
            </div>
            <ul className="space-y-2 flex-1">{share.map((x, i) => (
              <li key={x.name} className="flex items-center gap-2 text-[12px]"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: COLORS[i % COLORS.length] }} /><span className="text-ink-500">{x.name}</span><span className="num ml-auto font-semibold text-ink-700">₹{x.value.toFixed(0)} Cr</span></li>
            ))}</ul>
          </div>
        </Widget>
        <Widget title="Decision signals" subtitle="Auto-generated from live module data">
          <ul className="space-y-2">
            {[
              ["Receivables velocity improving", "DSO down from 74 → 61 days after MSRDC follow-up escalation.", "ok"],
              ["P4 needs executive attention", "4% behind plan with billing pending — recommend client meeting this week.", "warn"],
              ["Steel procurement window", "TMT prices trending +2.1% MoM — consider advancing PO-1287 approval.", "info"],
              ["RMC waste within norm", "Wastage 0.8% vs 1.5% allowance — saving ≈ ₹0.9 Cr annually.", "ok"],
            ].map(([t, d, tone]) => (
              <li key={t as string} className="flex gap-3 rounded-lg border border-line px-3.5 py-3 hover:border-line-strong transition-all">
                <span className={cx("h-7 w-7 rounded-md grid place-items-center shrink-0", tone === "ok" ? "bg-ok-100 text-ok-600" : tone === "warn" ? "bg-amber-100 text-amber-600" : "bg-steel-100 text-steel-600")}><IAlert size={13} /></span>
                <div><p className="text-[12.5px] font-semibold text-ink-900">{t}</p><p className="text-[11.5px] text-ink-500 mt-0.5">{d}</p></div>
              </li>
            ))}
          </ul>
        </Widget>
      </div>
    </div>
  );
}

/* ═══ Settings ════════════════════════════════════════════════ */
export function SettingsPage() {
  const { s, setS, perms, setPerms, role, can, log, resetAll, user } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<"company" | "users" | "rbac" | "wf" | "series" | "audit" | "system">("company");
  const [roleSel, setRoleSel] = useState<string>("MD");
  const [co, setCo] = useState({ ...s.settings });
  const [confirmReset, setConfirmReset] = useState(false);
  const [aq, setAq] = useState("");
  const [aMod, setAMod] = useState("");

  const auditRows = s.audit.filter((a) => (a.user + a.action + a.entity + a.module + a.detail).toLowerCase().includes(aq.toLowerCase()) && (!aMod || a.module === aMod));
  const aMods = [...new Set(s.audit.map((a) => a.module))];

  const aCols: Col[] = [
    { key: "id", label: "Ref", render: (a) => <span className="num text-[11px] font-bold text-brand-700">{a.id}</span> },
    { key: "ts", label: "Timestamp", render: (a) => <span className="num text-[11px] text-ink-500 whitespace-nowrap">{new Date(a.ts).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span> },
    { key: "user", label: "User", render: (a) => <div><p className="text-[12px] font-semibold text-ink-900">{a.user}</p><p className="text-[10px] text-ink-400">{a.role}</p></div> },
    { key: "module", label: "Module", render: (a) => <span className="text-[10.5px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{a.module}</span> },
    { key: "action", label: "Action", render: (a) => <span className="text-[12px] font-semibold text-ink-700">{a.action}</span> },
    { key: "entity", label: "Entity", render: (a) => <span className="num text-[11.5px] text-ink-500">{a.entity}</span> },
    { key: "detail", label: "Detail", render: (a) => <span className="text-[11.5px] text-ink-500">{a.detail}</span> },
    { key: "ip", label: "IP", render: (a) => <span className="num text-[10.5px] text-ink-300">{a.ip}</span> },
  ];

  const PERMS: { k: "view" | "create" | "edit" | "delete" | "approve" | "export"; l: string }[] = [
    { k: "view", l: "View" }, { k: "create", l: "Create" }, { k: "edit", l: "Edit" }, { k: "delete", l: "Delete" }, { k: "approve", l: "Approve" }, { k: "export", l: "Export" },
  ];

  return (
    <div className="fade-up">
      <PageHead title="System Settings" crumbs={["Meridian", "Administration"]} desc="Company masters, users, role permissions, approval workflows, numbering series and the immutable audit trail.">
        <Stat label="Users" value={`${s.users.length}`} />
        <Stat label="Roles" value={`${ROLES.length}`} />
        <Stat label="Audit records" value={`${s.audit.length}`} sub="append-only" />
      </PageHead>

      <Widget title="Administration" bodyClass="p-4">
        <div className="mb-4"><Seg value={tab} onChange={setTab} options={[
          { k: "company" as const, l: "Company" }, { k: "users" as const, l: "Users" }, { k: "rbac" as const, l: "Roles & Permissions" },
          { k: "wf" as const, l: "Workflows" }, { k: "series" as const, l: "Number Series" }, { k: "audit" as const, l: "Audit Trail", n: s.audit.length }, { k: "system" as const, l: "System" },
        ]} /></div>

        {tab === "company" && (
          <div className="max-w-[560px] space-y-4">
            <Field label="Company name"><input className={inputCls} value={co.company} onChange={(e) => setCo({ ...co, company: e.target.value })} /></Field>
            <Field label="Registered address"><input className={inputCls} value={co.address} onChange={(e) => setCo({ ...co, address: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="GSTIN"><input className={inputCls} value={co.gstin} onChange={(e) => setCo({ ...co, gstin: e.target.value })} /></Field>
              <Field label="Base currency"><input className={inputCls} value={co.currency} onChange={(e) => setCo({ ...co, currency: e.target.value })} /></Field>
            </div>
            <Field label="Active financial year"><input className={inputCls} value={co.fy} onChange={(e) => setCo({ ...co, fy: e.target.value })} /></Field>
            <Btn kind="primary" disabled={!can("settings", "edit")} onClick={() => { setS((p) => ({ ...p, settings: co })); log("Settings", "Company Profile Updated", co.company, `by ${user.name}`); toast("success", "Company profile saved"); }}>Save Changes</Btn>
          </div>
        )}

        {tab === "users" && (
          <DataTable pageKey="users" rows={s.users} pageSize={7} cols={[
            { key: "name", label: "User", render: (u) => <div><p className="text-[12.5px] font-semibold text-ink-900">{u.name}</p><p className="text-[10.5px] text-ink-400">{u.email}</p></div> },
            { key: "role", label: "Role", render: (u) => <span className="text-[10.5px] font-bold uppercase tracking-wide bg-brand-50 text-brand-700 border border-brand-100 rounded px-1.5 py-0.5">{ROLES.find((r) => r.id === u.role)?.label}</span> },
            { key: "dept", label: "Department", render: (u) => <span className="text-[12px] text-ink-500">{u.dept}</span> },
            { key: "project", label: "Project", render: (u) => <span className="text-[12px] num text-ink-500">{u.project}</span> },
            { key: "lastLogin", label: "Last login", render: (u) => <span className="num text-[11px] text-ink-500">{u.lastLogin}</span> },
            { key: "active", label: "Status", render: (u) => (
              <button disabled={!can("settings", "edit")} onClick={(e) => {
                e.stopPropagation();
                setS((p) => ({ ...p, users: p.users.map((x) => x.id === u.id ? { ...x, active: !x.active } : x) }));
                log("Settings", u.active ? "User Deactivated" : "User Activated", u.email, `by ${user.name}`);
                toast("info", `${u.name} ${u.active ? "deactivated" : "activated"}`);
              }} className={cx("relative w-9 h-5 rounded-full transition-colors disabled:opacity-40", u.active ? "bg-ok-500" : "bg-line-strong")}>
                <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", u.active ? "left-[18px]" : "left-0.5")} />
              </button>) },
          ] as Col[]} />
        )}

        {tab === "rbac" && (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Field label="Role" w="w-[220px]">
                <div className="relative">
                  <select className={selectCls} value={roleSel} onChange={(e) => setRoleSel(e.target.value)} disabled={!can("settings", "edit")}>
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                  <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
                </div>
              </Field>
              <p className="text-[11px] text-ink-400 mt-5 hidden sm:block">Module × permission matrix · changes apply immediately and are audit-logged.</p>
            </div>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-left min-w-[680px]">
                <thead><tr className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
                  <th className="font-bold pb-2 pr-3">Module</th>
                  {PERMS.map((p) => <th key={p.k} className="font-bold pb-2 pr-3 text-center">{p.l}</th>)}
                </tr></thead>
                <tbody>{MODULES.map((m) => (
                  <tr key={m} className="border-t border-line/80">
                    <td className="py-2 pr-3 text-[12px] font-semibold text-ink-700 capitalize">{m.replace(/-/g, " ")}</td>
                    {PERMS.map((p) => {
                      const on = !!perms[roleSel]?.[m]?.[p.k];
                      return (
                        <td key={p.k} className="py-2 pr-3 text-center">
                          <button disabled={!can("settings", "edit") || roleSel === "SUPER_ADMIN"} onClick={() => {
                            setPerms((prev) => ({ ...prev, [roleSel]: { ...prev[roleSel], [m]: { ...prev[roleSel]?.[m], [p.k]: !on } } }));
                            log("Settings", "Permission Changed", `${roleSel} · ${m}`, `${p.l} ${on ? "revoked" : "granted"} by ${user.name}`);
                            toast("info", `${p.l} ${on ? "revoked" : "granted"} on ${m} for ${ROLES.find((r) => r.id === roleSel)?.label}`);
                          }} className={cx("h-4.5 w-4.5 h-5 w-5 rounded border inline-grid place-items-center transition-all active:scale-90 disabled:opacity-40", on ? "bg-brand-600 border-brand-600 text-white" : "border-line-strong text-transparent hover:border-brand-400")}>
                            <ICheck size={10} />
                          </button>
                        </td>);
                    })}
                  </tr>))}
                </tbody>
              </table>
            </div>
            <p className="text-[10.5px] text-ink-300 mt-2">Super Admin permissions are locked. Project-wise and department-wise scoping is inherited from the user's assignment.</p>
          </div>
        )}

        {tab === "wf" && (
          <div className="space-y-2">
            {s.workflows.map((w) => (
              <div key={w.id} className="flex items-center gap-3 border border-line rounded-lg px-3.5 py-3 hover:border-line-strong transition-all">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ink-900">{w.name} <span className="text-[10.5px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-400 ml-1">{w.module}</span></p>
                  <p className="text-[11px] text-ink-500 mt-0.5 num">{w.levels} · {w.basis}</p>
                </div>
                <button disabled={!can("settings", "edit")} onClick={() => {
                  setS((p) => ({ ...p, workflows: p.workflows.map((x) => x.id === w.id ? { ...x, active: !x.active } : x) }));
                  log("Settings", w.active ? "Workflow Disabled" : "Workflow Enabled", w.name, `by ${user.name}`);
                  toast("info", `${w.name} ${w.active ? "disabled" : "enabled"}`);
                }} className={cx("relative w-9 h-5 rounded-full transition-colors disabled:opacity-40 shrink-0", w.active ? "bg-ok-500" : "bg-line-strong")}>
                  <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", w.active ? "left-[18px]" : "left-0.5")} />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === "series" && (
          <DataTable pageKey="series" rows={s.series} pageSize={8} cols={[
            { key: "doc", label: "Document Type", render: (r) => <span className="text-[12.5px] font-semibold text-ink-900">{r.doc}</span> },
            { key: "prefix", label: "Prefix", render: (r) => <span className="num text-[11px] font-bold bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{r.prefix}</span> },
            { key: "next", label: "Next Number", render: (r) => <span className="num text-[12.5px] font-bold text-brand-700">{r.prefix}-{String(r.next).padStart(4, "0")}</span> },
            { key: "fmt", label: "Format", render: (r) => <span className="num text-[11px] text-ink-400">{r.prefix}-{"####"}</span> },
          ] as Col[]} />
        )}

        {tab === "audit" && (
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <input className={cx(inputCls, "w-[220px]")} placeholder="Search audit trail…" value={aq} onChange={(e) => setAq(e.target.value)} />
              <div className="relative">
                <select className={cx(selectCls, "w-auto min-w-[140px]")} value={aMod} onChange={(e) => setAMod(e.target.value)}>
                  <option value="">Module: All</option>
                  {aMods.map((m) => <option key={m}>{m}</option>)}
                </select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
              </div>
              <span className="text-[10.5px] text-ink-300 ml-auto flex items-center gap-1.5"><IAlert size={12} className="text-amber-500" /> Records are append-only — they cannot be edited or deleted.</span>
            </div>
            <DataTable pageKey="audit" rows={auditRows} cols={aCols} pageSize={8} />
          </div>
        )}

        {tab === "system" && (
          <div className="grid sm:grid-cols-2 gap-4 max-w-[760px]">
            <div className="rounded-lg border border-line p-4">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Backup</p>
              <p className="text-[12.5px] font-semibold text-ink-900 mt-1.5">{s.settings.backup}</p>
              <p className="text-[11px] text-ink-400 mt-0.5">Encrypted snapshots to object storage · 30-day retention</p>
              <Btn sm className="mt-3" onClick={() => {
                const blob = new Blob([JSON.stringify(s, null, 2)], { type: "application/json" });
                const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "meridian-erp-backup.json"; a.click();
                log("Settings", "Backup Exported", "Full dataset", `by ${user.name}`);
                toast("success", "Backup exported as JSON");
              }}><IDownload size={12} /> Export Backup</Btn>
            </div>
            <div className="rounded-lg border border-line p-4">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Notification Channels</p>
              {([["email", "Email (SMTP)"], ["sms", "SMS gateway"], ["whatsapp", "WhatsApp Business"]] as const).map(([k, l]) => (
                <div key={k} className="flex items-center justify-between py-2 border-b border-line/60 last:border-0">
                  <span className="text-[12px] font-medium text-ink-700">{l}</span>
                  <button disabled={!can("settings", "edit")} onClick={() => {
                    setCo((c) => ({ ...c, [k]: !c[k] }));
                    setS((p) => ({ ...p, settings: { ...p.settings, [k]: !p.settings[k] } }));
                    log("Settings", "Channel Toggled", l, `${p0(s.settings[k]) ? "disabled" : "enabled"} by ${user.name}`);
                    toast("info", `${l} ${p0(s.settings[k]) ? "disabled" : "enabled"}`);
                  }} className={cx("relative w-9 h-5 rounded-full transition-colors disabled:opacity-40", p0(s.settings[k]) ? "bg-ok-500" : "bg-line-strong")}>
                    <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", p0(s.settings[k]) ? "left-[18px]" : "left-0.5")} />
                  </button>
                </div>
              ))}
              <p className="text-[10.5px] text-ink-300 mt-2">In-app notifications are always on.</p>
            </div>
            <div className="rounded-lg border border-danger-500/30 bg-danger-100/20 p-4 sm:col-span-2">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-danger-600">Danger Zone</p>
              <p className="text-[12px] text-ink-500 mt-1">Reset the demonstration dataset — all transactions, audit entries and customisations return to seed values.</p>
              <Btn kind="danger" sm className="mt-2.5" disabled={!can("settings", "delete")} onClick={() => setConfirmReset(true)}>Reset Demo Data</Btn>
            </div>
          </div>
        )}
      </Widget>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo data?"
        footer={<><Btn onClick={() => setConfirmReset(false)}>Cancel</Btn><Btn kind="danger" onClick={() => { log("Settings", "Dataset Reset", "System", `by ${user.name}`); resetAll(); }}>Yes, reset everything</Btn></>}>
        <p className="text-[12.5px] text-ink-500">This clears all locally stored transactions, approvals, audit entries and layout preferences, then reloads with seed data. This cannot be undone.</p>
      </Modal>
    </div>
  );
}
const p0 = (v: unknown) => !!v;
const IChevD = ({ size = 12, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9.5l6 6 6-6" /></svg>
);
