/* Part 1 · Control — Reports, Analytics, Documents, Settings */
import { useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { useERP, dStr } from "../store";
import { MODULES, ROLES } from "../data";
import type { ModuleId, RoleId } from "../data";
import { Widget, Pill, cx, useToast, Empty } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Field, inputCls, selectCls, Btn, Stat, Modal } from "./core";
import type { Col } from "./core";
import { printDocument } from "../print";
import { IFiles, IDownload, IPrinter, ICheck, IAlert } from "../icons";

/* ══════════ REPORTS ══════════ */
export function ReportsPage() {
  const { s, log } = useERP();
  const toast = useToast();
  const [preview, setPreview] = useState<string | null>(null);

  const gen = (name: string): { head: string[]; rows: any[][] } => {
    if (name.includes("Tender")) return { head: ["Tender", "Authority", "Value (₹ Cr)", "EMD", "Deadline", "Status"], rows: s.tenders.map((t) => [t.no, t.authority, t.value, t.emd, t.deadline, t.status]) };
    if (name.includes("Stock")) return { head: ["Material", "Store", "On Hand", "Unit", "Value (₹ Cr)"], rows: s.stock.map((x) => [x.material, x.store, x.onHand, x.unit, x.value]) };
    if (name.includes("PO Register") || name.includes("Purchase")) return { head: ["Doc", "Type", "Project", "Party", "Qty", "Value (₹ L)", "Status"], rows: s.proc.map((p) => [p.code, p.type, p.project, p.party, `${p.qty} ${p.unit}`, p.amount, p.status]) };
    if (name.includes("RA")) return { head: ["Bill", "Project", "Client", "Gross", "Net", "Status"], rows: s.billDocs.map((b) => [b.no, b.project, b.client, b.gross, b.net, b.status]) };
    if (name.includes("Receivable")) return { head: ["Invoice", "Client", "Ref", "Amount", "Due", "Status"], rows: s.arInvoices.map((a) => [a.no, a.client, a.ref, a.amount, a.due, a.status]) };
    if (name.includes("Payable")) return { head: ["Invoice", "Vendor", "Ref", "Amount", "Due", "Status"], rows: s.apInvoices.map((a) => [a.no, a.vendor, a.ref, a.amount, a.due, a.status]) };
    if (name.includes("Attendance")) return { head: ["Employee", "Project", "Hours", "OT", "Status", "Approval"], rows: s.attendance.map((a) => [a.name, a.project, a.hours, a.ot, a.status, a.appr]) };
    if (name.includes("Payroll")) return { head: ["Period", "Employees", "Gross", "Deductions", "Net", "Status"], rows: s.payRuns.map((r) => [r.period, r.employees, r.gross, r.deductions, r.net, r.status]) };
    if (name.includes("PF")) return { head: ["Employee", "PF No.", "Month", "PF Wage", "Employee", "Employer", "Status"], rows: s.pf.map((p) => [p.emp, p.pfNo, p.month, p.wage, p.empShare, p.erShare, p.status]) };
    if (name.includes("Quality")) return { head: ["Ref", "Type", "Project", "Item", "Date", "Status", "Result"], rows: s.quality.map((q) => [q.no, q.type, q.project, q.item, q.date, q.status, q.result || "—"]) };
    if (name.includes("Safety")) return { head: ["Kind", "Project", "Date", "Description", "Severity", "Status"], rows: s.safety.map((x) => [x.kind, x.project, x.date, x.desc, x.severity, x.status]) };
    if (name.includes("Maintenance")) return { head: ["Equipment", "Service", "Due", "Cost (₹ L)", "Status"], rows: s.maint.map((m) => [m.eq, m.service, m.due, m.cost, m.status]) };
    if (name.includes("Fuel")) return { head: ["Equipment", "Date", "Litres", "Hours", "L/hr", "Cost (₹)"], rows: s.fuel.map((f) => [f.eq, f.date, f.ltrs, f.hrs, f.hrs ? (f.ltrs / f.hrs).toFixed(1) : "—", f.cost]) };
    if (name.includes("Labour Cost")) return { head: ["Employee", "Project", "Designation", "Gross (₹/yr)", "PF", "Net"], rows: s.employees.map((e) => [e.name, e.project, e.designation, (e.base * 1e5).toFixed(0), (e.base * 1e5 * 0.12).toFixed(0), (e.base * 1e5 * 0.88).toFixed(0)]) };
    if (name.includes("Trial Balance")) return { head: ["Code", "Head", "Type", "Balance (₹ Cr)"], rows: s.coa.map((c) => [c.code, c.name, c.type, c.balance]) };
    if (name.includes("Voucher")) return { head: ["Voucher", "Type", "Date", "Dr", "Cr", "Amount (₹ L)", "Cost Centre", "Status"], rows: s.vouchers.map((v) => [v.no, v.type, v.date, v.debit, v.credit, v.amount, v.costCentre, v.status]) };
    if (name.includes("Corrections")) return { head: ["Employee", "Date", "Existing", "Requested", "Status"], rows: s.corrections.map((c) => [c.emp, c.date, c.existing, c.requested, c.status]) };
    if (name.includes("Location Verified")) return { head: ["Employee", "Date", "Project/Site", "In", "Out", "Distance (m)", "Accuracy (m)", "Geo"], rows: s.punches.filter((p) => p.geo === "Verified").map((p) => [p.user, p.date, `${p.project} · ${p.site ?? ""}`, p.inAt ?? "—", p.outAt ?? "—", p.dist ?? "—", p.acc ?? "—", p.geo]) };
    if (name.includes("Outside Geofence")) return { head: ["User", "Date", "Time", "Site", "Distance (m)", "Radius (m)", "Accuracy (m)", "Result"], rows: s.locAttempts.map((a) => [a.user, a.date, a.time, `${a.project} · ${a.site}`, a.dist, a.radius, a.acc, a.result]) };
    if (name.includes("GPS Accuracy")) return { head: ["Employee", "Date", "Accuracy (m)", "Site", "Distance (m)", "Device"], rows: s.punches.filter((p) => p.acc).map((p) => [p.user, p.date, p.acc, p.site ?? "—", p.dist ?? "—", p.device ?? "—"]) };
    if (name.includes("Geofence")) return { head: ["Loc ID", "Project", "Site", "Type", "Lat", "Lng", "Radius (m)", "Status"], rows: s.attLocations.map((l) => [l.locId, l.projectId, l.site, l.type, l.lat, l.lng, l.radius, l.status]) };
    if (name.includes("Project")) return { head: ["Code", "Project", "Client", "Value (₹ Cr)", "Progress %", "Status"], rows: s.projects.map((p) => [p.code, p.name, p.client, p.contractValue, p.progress, p.status]) };
    return { head: ["Material", "Category", "Unit", "ROL", "Rate"], rows: s.materials.map((m) => [m.name, m.cat, m.unit, m.rol, m.rate]) };
  };

  const GROUPS: { cat: string; items: string[] }[] = [
    { cat: "Project", items: ["Project Register", "Project Progress Report"] },
    { cat: "Commercial", items: ["RA Bill Register", "Contract & Variation Report"] },
    { cat: "Procurement", items: ["Purchase Register", "PO Register"] },
    { cat: "Store", items: ["Stock Register", "Low Stock Report"] },
    { cat: "Finance", items: ["Receivable Ageing", "Payable Ageing", "Trial Balance", "Voucher Register"] },
    { cat: "HR & Payroll", items: ["Attendance Report", "Payroll Register", "PF Register", "Labour Cost", "Attendance Corrections"] },
    { cat: "Geo Attendance", items: ["Location Verified Attendance", "Outside Geofence Attempts", "GPS Accuracy Report", "Geofence Master"] },
    { cat: "Plant & RMC", items: ["Maintenance Schedule", "Fuel Register"] },
    { cat: "Quality & Safety", items: ["Quality Report", "Safety Report"] },
    { cat: "Tenders", items: ["Tender Register & Pipeline"] },
  ];

  return (
    <div className="fade-up">
      <PageHead title="Report Centre" crumbs={["Meridian", "Control", "Reports"]}
        desc="Live reports generated from the connected database — filtered, exportable to Excel and printable as branded PDFs.">
        <Stat label="Report templates" value={`${GROUPS.reduce((a, g) => a + g.items.length, 0)}`} />
        <Stat label="Source tables" value={`${MODULES.length}`} sub="live data" />
      </PageHead>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {GROUPS.map((g) => (
          <Widget key={g.cat} title={g.cat} bodyClass="p-3">
            <ul className="space-y-1.5">
              {g.items.map((name) => (
                <li key={name} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2.5 hover:border-brand-200 hover:bg-brand-50/30 transition-all group">
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold text-ink-900 leading-snug">{name}</p>
                    <p className="text-[9.5px] text-ink-300 mt-0.5">XLSX · PDF · Print</p>
                  </div>
                  <Btn sm onClick={() => { setPreview(name); log("Reports", "Report Generated", name, "On-demand run with current filters"); }}>Run</Btn>
                </li>))}
            </ul>
          </Widget>))}
      </div>

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview ?? ""} wide>
        {preview && (() => {
          const r = gen(preview);
          return (
            <div>
              <div className="overflow-auto max-h-[340px] rounded-lg border border-line">
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-canvas"><tr>{r.head.map((h) => <th key={h} className="text-[9.5px] uppercase tracking-wide font-bold text-ink-400 px-3 py-2 whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>{r.rows.map((row, i) => (
                    <tr key={i} className="border-t border-line/70 hover:bg-canvas/60">{row.map((c, j) => <td key={j} className={cx("px-3 py-2 text-[11.5px] whitespace-nowrap", typeof c === "number" ? "num text-right" : "text-ink-700")}>{typeof c === "number" ? c.toLocaleString("en-IN") : c}</td>)}</tr>))}</tbody>
                </table>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Btn onClick={() => {
                  const blob = new Blob([["\uFEFF", r.head.join(","), ...r.rows.map((x) => x.join(","))].join("\n")], { type: "text/csv" });
                  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = preview.replace(/\s+/g, "-").toLowerCase() + ".csv"; a.click();
                  toast("success", "Report exported to Excel (CSV)");
                }}><IDownload size={12} /> Excel</Btn>
                <Btn kind="primary" onClick={() => printDocument({
                  title: preview, docNo: preview.replace(/\s+/g, "").slice(0, 10).toUpperCase(), date: dStr(0),
                  cols: r.head.map((h) => ({ label: h })), rows: r.rows,
                  note: "Generated from the live ERP database with current project & period filters applied.",
                  generatedBy: "Report Centre",
                })}><IPrinter size={12} /> Print / PDF</Btn>
              </div>
            </div>);
        })()}
      </Modal>
    </div>
  );
}

/* ══════════ ANALYTICS ══════════ */
export function AnalyticsPage() {
  const { s, dark } = useERP();
  const grid = dark ? "#243140" : "#e7ecf1";
  const axis = { stroke: dark ? "#7d92a5" : "#8ca0b0", fontSize: 10.5, fontFamily: "IBM Plex Mono", tickLine: false, axisLine: false } as const;
  const marginTrend = [{ m: "Nov", margin: 9.8 }, { m: "Dec", margin: 10.4 }, { m: "Jan", margin: 10.1 }, { m: "Feb", margin: 11.2 }, { m: "Mar", margin: 11.6 }];
  const billing = [{ m: "Nov", billed: 28.4, certified: 26.1 }, { m: "Dec", billed: 32.0, certified: 29.4 }, { m: "Jan", billed: 24.8, certified: 22.9 }, { m: "Feb", billed: 36.2, certified: 33.6 }, { m: "Mar", billed: 41.5, certified: 38.2 }];
  const mix = s.projects.filter((p) => p.status !== "Completed").slice(0, 5).map((p) => ({ name: p.code, value: p.contractValue }));
  const COLORS = ["#0c7264", "#128574", "#3ba391", "#e0a33b", "#7e93a5"];
  const tipStyle = { background: "#101b24", border: "1px solid #2b3f4f", borderRadius: 8, fontSize: 12 } as const;

  return (
    <div className="fade-up">
      <PageHead title="Analytics & Insights" crumbs={["Meridian", "Control", "Analytics"]}
        desc="Cross-module analytics — profitability, billing vs certification, portfolio mix and decision signals.">
        <Stat label="Portfolio margin" value="11.6%" tone="ok" sub="+1.5 pts vs Nov" />
        <Stat label="Certification ratio" value={`${Math.round((billing.reduce((a, b) => a + b.certified, 0) / billing.reduce((a, b) => a + b.billed, 0)) * 100)}%`} />
        <Stat label="At-risk projects" value={`${s.projects.filter((p) => p.progress < p.planned).length}`} tone="warn" />
      </PageHead>
      <div className="grid lg:grid-cols-2 gap-4">
        <Widget title="Blended margin trend" subtitle="Portfolio-level projected margin, monthly">
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={marginTrend} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
              <defs><linearGradient id="mg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#128574" stopOpacity={0.25} /><stop offset="100%" stopColor="#128574" stopOpacity={0.02} /></linearGradient></defs>
              <CartesianGrid stroke={grid} vertical={false} /><XAxis dataKey="m" {...axis} dy={6} /><YAxis {...axis} domain={[8, 13]} unit="%" />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: "#8fa6b8" }} /><Area dataKey="margin" stroke="#128574" strokeWidth={2.2} fill="url(#mg2)" name="Margin %" />
            </AreaChart>
          </ResponsiveContainer>
        </Widget>
        <Widget title="Billing vs certification" subtitle="₹ Cr per month — gap indicates certification lag">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={billing} margin={{ top: 6, right: 6, left: -10, bottom: 0 }} barSize={15}>
              <CartesianGrid stroke={grid} vertical={false} /><XAxis dataKey="m" {...axis} dy={6} /><YAxis {...axis} />
              <Tooltip contentStyle={tipStyle} labelStyle={{ color: "#8fa6b8" }} />
              <Bar dataKey="billed" fill="#0c7264" radius={[3, 3, 0, 0]} name="Billed" />
              <Bar dataKey="certified" fill={dark ? "#41566a" : "#c6d3de"} radius={[3, 3, 0, 0]} name="Certified" />
            </BarChart>
          </ResponsiveContainer>
        </Widget>
        <Widget title="Contract value mix" subtitle="Active portfolio share by project">
          <div className="flex items-center gap-5">
            <div className="relative shrink-0" style={{ width: 160, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={mix} dataKey="value" nameKey="name" innerRadius={54} outerRadius={76} paddingAngle={2.5} strokeWidth={0}>{mix.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie>
                  <Tooltip contentStyle={tipStyle} /></PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 grid place-items-center text-center"><div><p className="num text-[16px] font-semibold text-ink-900">₹{mix.reduce((a, x) => a + x.value, 0).toFixed(0)}</p><p className="text-[9px] uppercase tracking-wide text-ink-400">Cr active</p></div></div>
            </div>
            <ul className="space-y-2 flex-1">{mix.map((x, i) => (
              <li key={x.name} className="flex items-center gap-2 text-[12px]"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: COLORS[i % COLORS.length] }} /><span className="text-ink-500">{x.name}</span><span className="num ml-auto font-semibold text-ink-700">₹{x.value} Cr</span></li>))}</ul>
          </div>
        </Widget>
        <Widget title="Decision signals" subtitle="Auto-generated from live module data">
          <ul className="space-y-2">
            {[
              ["Certification lag within norm", "Average 9 days from submission to certification across clients.", "ok"],
              ["P2 needs attention", "7% behind plan with billing pending — recommend client coordination this week.", "warn"],
              ["M-Sand consumption variance", "P3 consumption 6% above BOQ theoretical — reconciliation advised.", "info"],
              ["Receivables velocity improving", "DSO reduced after MIDC follow-up escalation.", "ok"],
            ].map(([t, d, tone]) => (
              <li key={t as string} className="flex gap-3 rounded-lg border border-line px-3.5 py-3 hover:border-line-strong transition-all">
                <span className={cx("h-7 w-7 rounded-md grid place-items-center shrink-0", tone === "ok" ? "bg-ok-100 text-ok-600" : tone === "warn" ? "bg-amber-100 text-amber-600" : "bg-steel-100 text-steel-600")}><IAlert size={13} /></span>
                <div><p className="text-[12.5px] font-semibold text-ink-900">{t}</p><p className="text-[11.5px] text-ink-500 mt-0.5">{d}</p></div>
              </li>))}
          </ul>
        </Widget>
      </div>
    </div>
  );
}

/* ══════════ DOCUMENTS ══════════ */
export function DocumentsPage() {
  const { s, setS, can, log, user } = useERP();
  const toast = useToast();
  const [folder, setFolder] = useState(s.folders[0]);
  const [q, setQ] = useState("");
  const rows = s.docs.filter((d) => d.folder === folder && d.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="fade-up">
      <PageHead title="Document Management" crumbs={["Meridian", "Control", "Documents"]}
        desc="Versioned contracts, drawings, BOQs, invoices and certificates with expiry alerts — downloads are audit-logged.">
        <Stat label="Documents" value={`${s.docs.length}`} />
        <Stat label="Expiring ≤30 d" value={`${s.docs.filter((d) => d.expiry).length}`} tone="warn" />
      </PageHead>
      <div className="grid md:grid-cols-[230px_1fr] gap-4">
        <Widget title="Folders" bodyClass="p-2.5">
          <ul className="space-y-0.5">
            {s.folders.map((f) => (
              <li key={f}>
                <button onClick={() => setFolder(f)} className={cx("w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-left text-[12px] font-medium transition-all active:scale-[0.98]", folder === f ? "bg-brand-50 text-brand-700 border border-brand-200" : "text-ink-500 hover:bg-canvas border border-transparent")}>
                  <IFiles size={13} /> <span className="truncate flex-1">{f}</span>
                  <span className="num text-[10px] text-ink-300">{s.docs.filter((d) => d.folder === f).length}</span>
                </button>
              </li>))}
          </ul>
        </Widget>
        <Widget title={folder} subtitle="Controlled copies with version history">
          <FilterBar pageKey="docs" q={q} onQ={setQ} filters={[]} />
          <DataTable pageKey="docs" rows={rows} cols={[
            { key: "name", label: "Document", render: (d) => (
              <div className="flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-md grid place-items-center bg-brand-50 text-brand-700 border border-brand-100 shrink-0 text-[9px] font-bold">{d.type}</span>
                <div><p className="text-[12.5px] font-semibold text-ink-900">{d.name}</p><p className="text-[10.5px] text-ink-400 num">v{d.ver} · {d.size} · {d.uploaded} · {d.by}</p></div>
              </div>) },
            { key: "ver", label: "Version", align: "center", sort: (d) => d.ver, render: (d) => <span className="num text-[11px] font-bold bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">v{d.ver}</span> },
            { key: "expiry", label: "Expiry", render: (d) => d.expiry ? <span className="num text-[11px] font-semibold text-amber-600">{d.expiry}</span> : <span className="text-[11px] text-ink-300">—</span> },
            { key: "act", label: "", render: (d: any) => (
              <span className="flex gap-1.5 justify-end">
                <Btn sm onClick={(e: any) => {
                  e.stopPropagation();
                  const blob = new Blob([`${d.name}\n\nSAHAA INFRA — controlled copy (demo)\nFolder: ${d.folder} · v${d.ver}`], { type: "text/plain" });
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
          ] as Col[]} empty={{ title: "Folder is empty", note: "Documents uploaded from their module appear here." }} />
        </Widget>
      </div>
    </div>
  );
}

/* ══════════ SETTINGS ══════════ */
export function SettingsPage() {
  const { s, setS, perms, setPerms, can, log, resetAll, user } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<"company" | "users" | "rbac" | "wf" | "series" | "audit" | "system">("company");
  const [roleSel, setRoleSel] = useState<RoleId>("MD");
  const [co, setCo] = useState({ ...s.settings });
  const [confirmReset, setConfirmReset] = useState(false);
  const [aq, setAq] = useState("");

  const auditRows = s.audit.filter((a) => (a.user + a.action + a.entity + a.module + a.detail).toLowerCase().includes(aq.toLowerCase()));
  const PERMS: { k: "view" | "create" | "edit" | "delete" | "approve" | "export"; l: string }[] = [
    { k: "view", l: "View" }, { k: "create", l: "Create" }, { k: "edit", l: "Edit" }, { k: "delete", l: "Delete" }, { k: "approve", l: "Approve" }, { k: "export", l: "Export" },
  ];

  return (
    <div className="fade-up">
      <PageHead title="System Settings" crumbs={["Meridian", "Control", "Settings"]}
        desc="Company master, users, role permissions, approval workflows, number series and the immutable audit trail.">
        <Stat label="Users" value={`${s.users.length}`} />
        <Stat label="Roles" value={`${ROLES.length}`} />
        <Stat label="Audit records" value={`${s.audit.length}`} sub="append-only" />
      </PageHead>

      <Widget title="Administration" bodyClass="p-4">
        <div className="mb-4"><Seg value={tab} onChange={setTab} options={[
          { k: "company" as const, l: "Company" }, { k: "users" as const, l: "Users" }, { k: "rbac" as const, l: "Roles & Permissions" },
          { k: "wf" as const, l: "Workflows" }, { k: "series" as const, l: "Number Series" }, { k: "audit" as const, l: "Audit Trail", n: s.audit.length }, { k: "system" as const, l: "System" }]} /></div>

        {tab === "company" && (
          <div className="max-w-[560px] space-y-4">
            <Field label="Company name"><input className={inputCls} value={co.company} onChange={(e) => setCo({ ...co, company: e.target.value })} /></Field>
            <Field label="Registered address"><input className={inputCls} value={co.address} onChange={(e) => setCo({ ...co, address: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="GSTIN"><input className={inputCls} value={co.gstin} onChange={(e) => setCo({ ...co, gstin: e.target.value })} /></Field>
              <Field label="Currency"><input className={inputCls} value={co.currency} onChange={(e) => setCo({ ...co, currency: e.target.value })} /></Field>
            </div>
            <Field label="Financial year"><input className={inputCls} value={co.fy} onChange={(e) => setCo({ ...co, fy: e.target.value })} /></Field>
            <Btn kind="primary" disabled={!can("settings", "edit")} onClick={() => { setS((p) => ({ ...p, settings: co })); log("Settings", "Company Profile Updated", co.company, `by ${user.name}`); toast("success", "Company profile saved"); }}>Save Changes</Btn>
          </div>)}

        {tab === "users" && (
          <DataTable pageKey="users" rows={s.users} cols={[
            { key: "name", label: "User", render: (u) => <div><p className="text-[12.5px] font-semibold text-ink-900">{u.name}</p><p className="text-[10.5px] text-ink-400">{u.email}</p></div> },
            { key: "role", label: "Role", render: (u) => <span className="text-[10px] font-bold uppercase tracking-wide bg-brand-50 text-brand-700 border border-brand-100 rounded px-1.5 py-0.5">{ROLES.find((r) => r.id === u.role)?.label}</span> },
            { key: "office", label: "Office", render: (u) => <span className="text-[12px] text-ink-500">{u.office}</span> },
            { key: "project", label: "Project / Site", render: (u) => <span className="num text-[12px] text-ink-500">{u.project} · {u.site}</span> },
            { key: "finLimit", label: "Limit (₹ L)", align: "right", sort: (u) => u.finLimit, render: (u) => <span className="num text-[12px] font-semibold">{u.finLimit || "—"}</span> },
            { key: "active", label: "Active", render: (u: any) => (
              <button disabled={!can("settings", "edit")} onClick={(e) => {
                e.stopPropagation();
                setS((p) => ({ ...p, users: p.users.map((x) => x.id === u.id ? { ...x, active: !x.active } : x) }));
                log("Settings", u.active ? "User Deactivated" : "User Activated", u.email, `by ${user.name}`);
                toast("info", `${u.name} ${u.active ? "deactivated" : "activated"}`);
              }} className={cx("relative w-9 h-5 rounded-full transition-colors disabled:opacity-40", u.active ? "bg-ok-500" : "bg-line-strong")}>
                <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", u.active ? "left-[18px]" : "left-0.5")} />
              </button>) },
          ] as Col[]} />)}

        {tab === "rbac" && (
          <div>
            <div className="flex items-end gap-3 mb-3">
              <Field label="Role" w="w-[220px]">
                <div className="relative">
                  <select className={selectCls} value={roleSel} onChange={(e) => setRoleSel(e.target.value as RoleId)} disabled={!can("settings", "edit")}>
                    {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}
                  </select>
                  <IChevDLocal />
                </div>
              </Field>
              <p className="text-[11px] text-ink-400 pb-2 hidden sm:block">Module × permission matrix · changes apply immediately and are audit-logged.</p>
            </div>
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-left min-w-[680px]">
                <thead><tr className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
                  <th className="font-bold pb-2 pr-3">Module</th>{PERMS.map((p) => <th key={p.k} className="font-bold pb-2 pr-3 text-center">{p.l}</th>)}
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
                          }} className={cx("h-5 w-5 rounded border inline-grid place-items-center transition-all active:scale-90 disabled:opacity-40", on ? "bg-brand-600 border-brand-600 text-white" : "border-line-strong text-transparent hover:border-brand-400")}>
                            <ICheck size={10} />
                          </button>
                        </td>);
                    })}
                  </tr>))}
                </tbody>
              </table>
            </div>
            <p className="text-[10.5px] text-ink-300 mt-2">Super Admin permissions are locked. Project & site scoping is inherited from each user's assignment.</p>
          </div>)}

        {tab === "wf" && (
          <div className="space-y-2">
            {s.workflows.map((w) => (
              <div key={w.id} className="flex items-center gap-3 border border-line rounded-lg px-3.5 py-3 hover:border-line-strong transition-all">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ink-900">{w.name} <span className="text-[10px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-400 ml-1">{w.module}</span></p>
                  <p className="text-[11px] text-ink-500 mt-0.5 num">{w.levels} · {w.basis}</p>
                </div>
                <button disabled={!can("settings", "edit")} onClick={() => {
                  setS((p) => ({ ...p, workflows: p.workflows.map((x) => x.id === w.id ? { ...x, active: !x.active } : x) }));
                  log("Settings", w.active ? "Workflow Disabled" : "Workflow Enabled", w.name, `by ${user.name}`);
                  toast("info", `${w.name} ${w.active ? "disabled" : "enabled"}`);
                }} className={cx("relative w-9 h-5 rounded-full transition-colors disabled:opacity-40 shrink-0", w.active ? "bg-ok-500" : "bg-line-strong")}>
                  <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", w.active ? "left-[18px]" : "left-0.5")} />
                </button>
              </div>))}
          </div>)}

        {tab === "series" && (
          <DataTable pageKey="series" rows={s.series} cols={[
            { key: "doc", label: "Document Type", render: (r) => <span className="text-[12.5px] font-semibold text-ink-900">{r.doc}</span> },
            { key: "prefix", label: "Prefix", render: (r) => <span className="num text-[11px] font-bold bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{r.prefix}</span> },
            { key: "next", label: "Next Number", render: (r) => <span className="num text-[12.5px] font-bold text-brand-700">{r.prefix}-{String(r.next).padStart(4, "0")}</span> },
            { key: "fmt", label: "Format", render: (r) => <span className="num text-[11px] text-ink-400">{r.prefix}-####</span> },
          ] as Col[]} />)}

        {tab === "audit" && (
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <input className={cx(inputCls, "w-[240px]")} placeholder="Search audit trail…" value={aq} onChange={(e) => setAq(e.target.value)} />
              <span className="text-[10.5px] text-ink-300 ml-auto flex items-center gap-1.5"><IAlert size={12} className="text-amber-500" /> Append-only — records cannot be edited or deleted.</span>
            </div>
            <DataTable pageKey="audit" rows={auditRows} cols={[
              { key: "id", label: "Ref", render: (a) => <span className="num text-[11px] font-bold text-brand-700">{a.id}</span> },
              { key: "ts", label: "When", render: (a) => <span className="num text-[10.5px] text-ink-500 whitespace-nowrap">{new Date(a.ts).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span> },
              { key: "user", label: "User", render: (a) => <div><p className="text-[12px] font-semibold text-ink-900">{a.user}</p><p className="text-[10px] text-ink-400">{a.role}</p></div> },
              { key: "module", label: "Module", render: (a) => <span className="text-[10px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{a.module}</span> },
              { key: "action", label: "Action", render: (a) => <span className="text-[12px] font-semibold text-ink-700">{a.action}</span> },
              { key: "entity", label: "Entity", render: (a) => <span className="num text-[11.5px] text-ink-500">{a.entity}</span> },
              { key: "detail", label: "Detail", render: (a) => <span className="text-[11px] text-ink-500">{a.detail}</span> },
              { key: "ip", label: "IP", render: (a) => <span className="num text-[10px] text-ink-300">{a.ip}</span> },
            ] as Col[]} />
          </div>)}

        {tab === "system" && (
          <div className="grid sm:grid-cols-2 gap-4 max-w-[760px]">
            <div className="rounded-lg border border-line p-4">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400">Backup</p>
              <p className="text-[12.5px] font-semibold text-ink-900 mt-1.5">{s.settings.backup}</p>
              <p className="text-[11px] text-ink-400 mt-0.5">Encrypted snapshots · 30-day retention · offline queue sync ready for Part 2</p>
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
                    const on = !!s.settings[k];
                    setS((p) => ({ ...p, settings: { ...p.settings, [k]: !on } }));
                    setCo((c) => ({ ...c, [k]: !on }));
                    log("Settings", "Channel Toggled", l, `${on ? "disabled" : "enabled"} by ${user.name}`);
                    toast("info", `${l} ${on ? "disabled" : "enabled"}`);
                  }} className={cx("relative w-9 h-5 rounded-full transition-colors disabled:opacity-40", s.settings[k] ? "bg-ok-500" : "bg-line-strong")}>
                    <span className={cx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", s.settings[k] ? "left-[18px]" : "left-0.5")} />
                  </button>
                </div>))}
              <p className="text-[10.5px] text-ink-300 mt-2">In-app notifications are always on.</p>
            </div>
            <div className="rounded-lg border border-danger-500/30 bg-danger-100/20 p-4 sm:col-span-2">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-danger-600">Danger Zone</p>
              <p className="text-[12px] text-ink-500 mt-1">Reset the demonstration dataset — transactions, audit entries and customisations return to seed values.</p>
              <Btn kind="danger" sm className="mt-2.5" disabled={!can("settings", "delete")} onClick={() => setConfirmReset(true)}>Reset Demo Data</Btn>
            </div>
          </div>)}
      </Widget>

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset demo data?"
        footer={<><Btn onClick={() => setConfirmReset(false)}>Cancel</Btn><Btn kind="danger" onClick={() => { log("Settings", "Dataset Reset", "System", `by ${user.name}`); resetAll(); setConfirmReset(false); }}>Yes, reset everything</Btn></>}>
        <p className="text-[12.5px] text-ink-500">This clears all locally stored transactions, approvals, audit entries and layout preferences, then reloads seed data. This cannot be undone.</p>
      </Modal>
    </div>
  );
}

function IChevDLocal() {
  return <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none"><path d="m6 9.5 6 6 6-6" /></svg>;
}
