import { useMemo, useState } from "react";
import { useERP, dStr } from "../store";
import type { Employee } from "../store";
import { Pill, Widget, useToast, cx } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat, AddBtn } from "./shell";
import type { Col } from "./shell";
import { IChevD, ICheck, IXCircle } from "../icons";

/* ═══ HR & People ═════════════════════════════════════════════ */
export function HRPage() {
  const { s, setS, can, log, notify, user } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<"dir" | "leave" | "recruit">("dir");
  const [q, setQ] = useState("");
  const [fDept, setFDept] = useState("");
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", dept: "Site Workforce", desig: "", project: "P1", base: "" });
  const [emp, setEmp] = useState<Employee | null>(null);

  const depts = [...new Set(s.employees.map((e) => e.dept))];
  const rows = useMemo(() => s.employees.filter((e) =>
    (e.name + e.empId + e.desig + e.dept).toLowerCase().includes(q.toLowerCase()) && (!fDept || e.dept === fDept)), [s.employees, q, fDept]);

  const cols: Col[] = [
    { key: "empId", label: "Emp ID", render: (e) => <span className="num text-[12px] font-bold text-brand-700">{e.empId}</span> },
    { key: "name", label: "Employee", render: (e) => (
      <div><p className="text-[12.5px] font-semibold text-ink-900">{e.name}</p><p className="text-[10.5px] text-ink-400">{e.phone}</p></div>) },
    { key: "desig", label: "Designation", render: (e) => <span className="text-[12px] text-ink-500">{e.desig}</span> },
    { key: "dept", label: "Department", render: (e) => <span className="text-[10.5px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{e.dept}</span> },
    { key: "project", label: "Project", render: (e) => <span className="text-[12px] num text-ink-500">{e.project}</span> },
    { key: "joined", label: "Joined", render: (e) => <span className="num text-[11.5px] text-ink-500">{e.joined}</span> },
    { key: "base", label: "Basic (₹)", align: "right", sort: (e) => e.base, render: (e) => <span className="num text-[12px] font-semibold">{e.base.toLocaleString("en-IN")}</span> },
    { key: "status", label: "Status", render: (e) => <Pill value={e.status === "Active" ? "On Track" : e.status === "On Leave" ? "Submitted" : "Delayed"} />, csv: (e) => e.status },
  ];

  const addEmployee = () => {
    if (!form.name.trim()) { toast("error", "Employee name is mandatory"); return; }
    const empId = `EMP-0${220 + s.employees.length}`;
    setS((p) => ({ ...p, employees: [...p.employees, { id: "e" + Date.now(), empId, name: form.name, dept: form.dept, desig: form.desig || "Helper", project: form.project, joined: dStr(0), status: "Active", phone: "—", base: parseFloat(form.base) || 14000 }] }));
    log("HR", "Employee Onboarded", empId, `${form.name} — ${form.dept}, ${form.project}`);
    notify("system", `${form.name} onboarded to ${form.project}`);
    toast("success", `${empId} created for ${form.name}`);
    setAdding(false); setForm({ name: "", dept: "Site Workforce", desig: "", project: "P1", base: "" });
  };

  const decideLeave = (id: string, ok: boolean) => {
    setS((p) => ({ ...p, leaves: p.leaves.map((l) => l.id === id ? { ...l, status: ok ? "Approved" : "Rejected" } : l) }));
    const l = s.leaves.find((x) => x.id === id);
    log("HR", ok ? "Leave Approved" : "Leave Rejected", l?.emp ?? id, `${l?.type} leave · ${l?.days} day(s)`);
    notify("approval", `Leave ${ok ? "approved" : "rejected"} for ${l?.emp}`);
    toast(ok ? "success" : "info", `Leave ${ok ? "approved" : "rejected"} — ${l?.emp}`);
  };

  return (
    <div className="fade-up">
      <PageHead title="HR & People" crumbs={["Meridian", "Human Resources"]} desc="Employee master, leave management and recruitment pipeline with document records.">
        <Stat label="Employees" value={`${s.employees.length * 145}`} sub="org-wide roster" />
        <Stat label="On leave" value={`${s.employees.filter((e) => e.status === "On Leave").length}`} />
        <Stat label="Pending leaves" value={`${s.leaves.filter((l) => l.status === "Pending").length}`} tone="warn" />
        <Stat label="Open positions" value="6" />
        <AddBtn label="Onboard Employee" disabled={!can("hr", "create")} tip="No create permission" onClick={() => setAdding(true)} />
      </PageHead>

      <Widget title={tab === "dir" ? "Employee Directory" : tab === "leave" ? "Leave Management" : "Recruitment"}
        subtitle={tab === "dir" ? "Employee master with project allocation and cost-to-company" : tab === "leave" ? "Requests route through the configured approval workflow" : "Open requisitions across projects"}>
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={[
          { k: "dir" as const, l: "Directory", n: s.employees.length }, { k: "leave" as const, l: "Leave", n: s.leaves.length }, { k: "recruit" as const, l: "Recruitment", n: 6 },
        ]} /></div>

        {tab === "dir" && <>
          <FilterBar pageKey="hr" q={q} onQ={setQ} filters={[{ key: "dept", label: "Department", value: fDept, options: depts, onChange: setFDept }]} />
          <DataTable pageKey="hr-dir" rows={rows} cols={cols} onRow={(e) => setEmp(e)} />
        </>}

        {tab === "leave" && (
          <div className="space-y-2">
            {s.leaves.map((l) => (
              <div key={l.id} className="flex items-center gap-3 border border-line rounded-lg px-3.5 py-3 hover:border-line-strong transition-all">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ink-900">{l.emp} <span className="text-ink-400 font-normal text-[11px]">· {l.type} leave · {l.days} day(s)</span></p>
                  <p className="text-[11px] text-ink-400 num mt-0.5">{l.from} → {l.to} · applied by {l.by}</p>
                </div>
                <Pill value={l.status} pulse={l.status === "Pending"} />
                {l.status === "Pending" && can("hr", "approve") && (
                  <span className="flex gap-1.5">
                    <Btn sm kind="ok" onClick={() => decideLeave(l.id, true)}><ICheck size={11} /> Approve</Btn>
                    <Btn sm kind="danger" onClick={() => decideLeave(l.id, false)}><IXCircle size={11} /> Reject</Btn>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === "recruit" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              ["Site Engineer — P2", "Project Execution", 2, "28 days open", 14],
              ["Batching Operator — RMC", "RMC Operations", 1, "12 days open", 9],
              ["Surveyor — P5", "Project Execution", 1, "9 days open", 6],
              ["Accounts Executive — HO", "Finance & Accounts", 1, "21 days open", 22],
              ["Safety Officer — P1", "HSE", 1, "5 days open", 4],
            ].map(([t, d, n, age, apps]) => (
              <div key={t as string} className="rounded-lg border border-line bg-canvas/50 p-3.5 hover:shadow-lift hover:-translate-y-[2px] transition-all duration-200">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12.5px] font-bold text-ink-900">{t}</p>
                  <span className="num text-[10.5px] font-bold bg-brand-50 text-brand-700 rounded-full px-2 py-0.5">{n} open</span>
                </div>
                <p className="text-[11px] text-ink-400 mt-1">{d} · {age}</p>
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 h-[5px] rounded-full bg-line overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, (apps as number) * 4)}%` }} />
                  </div>
                  <span className="num text-[10.5px] font-semibold text-ink-500">{apps} applicants</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Widget>

      <Drawer open={adding} onClose={() => setAdding(false)} title="Onboard Employee" sub="Employee master record · ID auto-generated">
        <div className="space-y-4">
          <Field label="Full name"><input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sandeep Waghmare" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <div className="relative">
                <select className={selectCls} value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}>
                  {["Site Workforce", "Plant & Machinery", "RMC Operations", "Human Resources", "Store Management", "Finance & Accounts"].map((d) => <option key={d}>{d}</option>)}
                </select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
              </div>
            </Field>
            <Field label="Designation"><input className={inputCls} value={form.desig} onChange={(e) => setForm({ ...form, desig: e.target.value })} placeholder="e.g. Mason — Grade I" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Project">
              <div className="relative">
                <select className={selectCls} value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
                  {s.projects.map((p) => <option key={p.code} value={p.code}>{p.code}</option>)}
                  <option>HO</option><option>RMC-1</option>
                </select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
              </div>
            </Field>
            <Field label="Basic salary (₹/mo)"><input type="number" className={inputCls} value={form.base} onChange={(e) => setForm({ ...form, base: e.target.value })} placeholder="15000" /></Field>
          </div>
          <div className="flex justify-end gap-2"><Btn onClick={() => setAdding(false)}>Cancel</Btn><Btn kind="primary" onClick={addEmployee}>Onboard</Btn></div>
        </div>
      </Drawer>

      <Drawer open={!!emp} onClose={() => setEmp(null)} title={emp?.name ?? ""} sub={emp ? `${emp.empId} · ${emp.desig}` : ""}>
        {emp && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {[["Department", emp.dept], ["Project", emp.project], ["Joined", emp.joined], ["Status", emp.status], ["Phone", emp.phone], ["Basic", `₹${emp.base.toLocaleString("en-IN")}`]].map(([l, v]) => (
                <div key={l} className="rounded-md border border-line bg-canvas/50 px-2.5 py-2">
                  <p className="text-[9.5px] font-bold uppercase tracking-wide text-ink-300">{l}</p>
                  <p className="text-[12px] font-semibold text-ink-700 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Documents</p>
              {["Aadhaar — verified", "PAN — verified", "Appointment letter — signed", "Skill certificate — pending"].map((d, i) => (
                <div key={d} className="flex items-center gap-2 border border-line rounded-md px-3 py-2 mb-1.5">
                  <span className={cx("h-1.5 w-1.5 rounded-full", i === 3 ? "bg-amber-500" : "bg-ok-500")} />
                  <span className="text-[12px] text-ink-700">{d}</span>
                </div>
              ))}
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">History</p>
              <ol className="relative">
                {[["Joined — " + emp.joined, "Onboarded to " + emp.project], ["Transferred", "P7 → " + emp.project + " (Oct 2025)"], ["Skill upgrade", "Grade II certification (Jan 2026)"]].map(([t, sub], i, arr) => (
                  <li key={t} className="relative flex gap-3 pb-3 last:pb-0">
                    {i < arr.length - 1 && <span className="absolute left-[5px] top-4 bottom-0 w-px bg-line" />}
                    <span className="h-[11px] w-[11px] rounded-full bg-brand-500 border-2 border-surface mt-1 shrink-0" />
                    <div><p className="text-[12px] font-semibold text-ink-900">{t}</p><p className="text-[11px] text-ink-400">{sub}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

/* ═══ Attendance ══════════════════════════════════════════════ */
export function AttendancePage() {
  const { s, setS, can, log, notify, user } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<"board" | "approve" | "leave">("board");
  const now = () => new Date().toTimeString().slice(0, 5);

  const present = s.attendance.filter((a) => a.status === "Present" || a.status === "Late").length;
  const pending = s.attendance.filter((a) => a.appr === "Pending").length;
  const ot = s.attendance.reduce((a, x) => a + x.ot, 0);

  const punchIn = (empId: string) => {
    const e = s.employees.find((x) => x.empId === empId);
    if (!e) return;
    const t = now();
    const late = t > "08:30";
    setS((p) => ({ ...p, attendance: [{ id: "a" + Date.now(), empId, name: e.name, project: e.project, date: "Today", checkIn: t, checkOut: "—", hours: 0, ot: 0, status: late ? "Late" as const : "Present" as const, method: "GPS Punch", gps: "18.5204° N, 73.8567° E", appr: "Pending" as const }, ...p.attendance] }));
    log("Attendance", "Punch In", empId, `${e.name} checked in at ${t} via GPS (${e.project})`);
    toast("success", `${e.name} punched in at ${t}`);
  };

  const punchOut = (id: string) => {
    const a = s.attendance.find((x) => x.id === id);
    const t = now();
    setS((p) => ({ ...p, attendance: p.attendance.map((x) => x.id === id ? { ...x, checkOut: t, hours: 9, ot: 1 } : x) }));
    if (a) log("Attendance", "Punch Out", a.empId, `${a.name} checked out at ${t}`);
    toast("success", "Punch out recorded");
  };

  const decide = (id: string, ok: boolean) => {
    const a = s.attendance.find((x) => x.id === id);
    setS((p) => ({ ...p, attendance: p.attendance.map((x) => x.id === id ? { ...x, appr: ok ? "Approved" : "Rejected" } : x) }));
    if (a) { log("Attendance", ok ? "Attendance Approved" : "Attendance Rejected", a.empId, `${a.name} · ${a.hours || 8} hrs · OT ${a.ot} hrs`); notify("approval", `Attendance ${ok ? "approved" : "rejected"} for ${a.name}`); }
    toast(ok ? "success" : "info", `Attendance ${ok ? "approved" : "rejected"} — feeds payroll`);
  };

  const roster = s.employees.filter((e) => e.dept !== "Human Resources").slice(0, 8);

  return (
    <div className="fade-up">
      <PageHead title="Real-time Attendance" crumbs={["Meridian", "HR", "Attendance"]}
        desc="GPS, QR and biometric punches with manager verification — approved hours flow straight into payroll.">
        <Stat label="Marked today" value={`${present}/${roster.length + 2}`} sub="site + plant roster" />
        <Stat label="Late arrivals" value={`${s.attendance.filter((a) => a.status === "Late").length}`} tone="warn" />
        <Stat label="OT hours" value={`${ot.toFixed(1)} h`} />
        <Stat label="To verify" value={`${pending}`} tone={pending ? "warn" : "ok"} />
      </PageHead>

      <Widget title={tab === "board" ? "Live Punch Board" : tab === "approve" ? "Verification Queue" : "Leave Requests"}
        subtitle={tab === "board" ? "Punch in/out updates instantly — GPS location is captured on mobile punch" : tab === "approve" ? "Approved hours are picked up by the payroll engine" : "Self-service leave applications"}>
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={[
          { k: "board" as const, l: "Punch Board" }, { k: "approve" as const, l: "Verify", n: pending }, { k: "leave" as const, l: "Leave", n: s.leaves.filter((l) => l.status === "Pending").length },
        ]} /></div>

        {tab === "board" && (
          <div className="grid sm:grid-cols-2 gap-2">
            {roster.map((e) => {
              const att = s.attendance.find((a) => a.empId === e.empId);
              return (
                <div key={e.id} className={cx("flex items-center gap-3 rounded-lg border px-3.5 py-3 transition-all", att ? "border-line bg-surface" : "border-dashed border-line-strong bg-canvas/40")}>
                  <span className={cx("h-2 w-2 rounded-full shrink-0", !att ? "bg-ink-300" : att.status === "Late" ? "bg-amber-500" : att.status === "Absent" ? "bg-danger-500" : "bg-ok-500", att && att.status !== "Absent" && "animate-pulse")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-semibold text-ink-900 truncate">{e.name}</p>
                    <p className="text-[10.5px] text-ink-400 num mt-0.5">{e.empId} · {e.project} · {e.desig}</p>
                  </div>
                  {att ? (
                    <div className="text-right shrink-0">
                      <p className="num text-[11px] font-semibold text-ink-700">In {att.checkIn} · Out {att.checkOut}</p>
                      {att.checkOut === "—" ? (
                        <Btn sm className="mt-1" onClick={() => punchOut(att.id)}>Punch Out</Btn>
                      ) : (
                        <p className="text-[10px] text-ink-400 num mt-0.5">{att.hours} hrs · OT {att.ot} h · {att.method}</p>
                      )}
                    </div>
                  ) : (
                    <Btn sm kind="primary" onClick={() => punchIn(e.empId)} disabled={!can("attendance", "create")} className="shrink-0">Punch In</Btn>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === "approve" && (
          <div className="space-y-2">
            {s.attendance.filter((a) => a.appr === "Pending").length === 0 && (
              <p className="text-[12px] text-ink-400 border border-dashed border-line rounded-md p-4 text-center">Queue clear — all punches verified.</p>
            )}
            {s.attendance.filter((a) => a.appr === "Pending").map((a) => (
              <div key={a.id} className="flex items-center gap-3 border border-line rounded-lg px-3.5 py-3 hover:border-line-strong transition-all">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ink-900">{a.name} <span className="text-[10.5px] font-bold uppercase tracking-wide bg-amber-100 text-amber-600 rounded px-1.5 py-0.5 ml-1">{a.status}</span></p>
                  <p className="text-[10.5px] text-ink-400 num mt-0.5">{a.empId} · {a.project} · in {a.checkIn} · {a.method} · {a.gps}</p>
                </div>
                {can("attendance", "approve") ? (
                  <span className="flex gap-1.5 shrink-0">
                    <Btn sm kind="ok" onClick={() => decide(a.id, true)}><ICheck size={11} /> Verify</Btn>
                    <Btn sm kind="danger" onClick={() => decide(a.id, false)}><IXCircle size={11} /> Reject</Btn>
                  </span>
                ) : <Pill value="Pending" pulse />}
              </div>
            ))}
          </div>
        )}

        {tab === "leave" && (
          <div className="space-y-2">
            {s.leaves.map((l) => (
              <div key={l.id} className="flex items-center gap-3 border border-line rounded-lg px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ink-900">{l.emp} <span className="text-ink-400 font-normal text-[11px]">· {l.type} · {l.days} day(s)</span></p>
                  <p className="text-[10.5px] text-ink-400 num mt-0.5">{l.from} → {l.to}</p>
                </div>
                <Pill value={l.status} pulse={l.status === "Pending"} />
              </div>
            ))}
          </div>
        )}
      </Widget>
    </div>
  );
}

/* ═══ Payroll ═════════════════════════════════════════════════ */
export function PayrollPage() {
  const { s, setS, can, log, notify } = useERP();
  const toast = useToast();
  const [slip, setSlip] = useState<Employee | null>(null);

  const otHours = s.attendance.filter((a) => a.appr === "Approved").reduce((a, x) => a + x.ot, 0);

  const register = s.employees.map((e) => {
    const att = s.attendance.find((a) => a.empId === e.empId);
    const otH = att?.ot ?? 0;
    const otPay = Math.round(otH * (e.base / 26 / 8) * 1.5);
    const hra = Math.round(e.base * 0.2);
    const gross = e.base + hra + otPay;
    const pf = Math.round(e.base * 0.12);
    const pt = 200;
    return { ...e, otH, otPay, hra, gross, pf, pt, net: gross - pf - pt };
  });
  const totals = register.reduce((a, r) => ({ gross: a.gross + r.gross, ded: a.ded + r.pf + r.pt, net: a.net + r.net }), { gross: 0, ded: 0, net: 0 });

  const runPayroll = () => {
    setS((p) => ({ ...p, payroll: [{ id: "p" + Date.now(), period: "Apr 2026", status: "Draft" as const, employees: register.length, gross: +(totals.gross / 1e5).toFixed(2), deductions: +(totals.ded / 1e5).toFixed(2), net: +(totals.net / 1e5).toFixed(2), date: dStr(0) }, ...p.payroll] }));
    log("Payroll", "Payroll Run Created", "Apr 2026", `${register.length} employees · gross ₹${(totals.gross / 1e5).toFixed(2)} L (approved OT ${otHours.toFixed(1)} h included)`);
    notify("system", "Apr 2026 payroll computed — pending approval");
    toast("success", "Payroll computed from approved attendance");
  };

  const approveRun = (id: string) => {
    setS((p) => ({ ...p, payroll: p.payroll.map((r) => r.id === id ? { ...r, status: "Paid" as const } : r) }));
    const r = s.payroll.find((x) => x.id === id);
    log("Payroll", "Payroll Disbursed", r?.period ?? id, `Net ₹${r?.net} Cr → labour cost posted to project cost centres`);
    notify("payment", `Payroll ${r?.period} disbursed — labour cost posted`);
    toast("success", "Payroll approved & disbursed — posted to project costs");
  };

  const cols: Col[] = [
    { key: "empId", label: "Emp ID", render: (r) => <span className="num text-[12px] font-bold text-brand-700">{r.empId}</span> },
    { key: "name", label: "Employee", render: (r) => <span className="text-[12.5px] font-semibold text-ink-900">{r.name}</span> },
    { key: "base", label: "Basic", align: "right", sort: (r) => r.base, render: (r) => <span className="num text-[12px]">{r.base.toLocaleString("en-IN")}</span> },
    { key: "hra", label: "HRA", align: "right", sort: (r) => r.hra, render: (r) => <span className="num text-[12px]">{r.hra.toLocaleString("en-IN")}</span> },
    { key: "otPay", label: "OT", align: "right", sort: (r) => r.otPay, render: (r) => <span className="num text-[12px] text-ok-600 font-semibold">{r.otPay > 0 ? "+" + r.otPay.toLocaleString("en-IN") : "—"}</span> },
    { key: "gross", label: "Gross", align: "right", sort: (r) => r.gross, render: (r) => <span className="num text-[12px] font-semibold">{r.gross.toLocaleString("en-IN")}</span> },
    { key: "ded", label: "Deductions", align: "right", sort: (r) => r.pf + r.pt, render: (r) => <span className="num text-[12px] text-danger-600">−{(r.pf + r.pt).toLocaleString("en-IN")}</span> },
    { key: "net", label: "Net Pay", align: "right", sort: (r) => r.net, render: (r) => <span className="num text-[12.5px] font-bold text-ink-900">₹{r.net.toLocaleString("en-IN")}</span> },
  ];

  return (
    <div className="fade-up">
      <PageHead title="Payroll" crumbs={["Meridian", "HR", "Payroll"]} desc="Monthly payroll computed from approved attendance — OT hours, allowances and statutory deductions.">
        <Stat label="Gross (roster)" value={`₹${(totals.gross / 1e5).toFixed(2)} L`} />
        <Stat label="Deductions" value={`₹${(totals.ded / 1e5).toFixed(2)} L`} />
        <Stat label="Net payable" value={`₹${(totals.net / 1e5).toFixed(2)} L`} tone="ok" />
        <Stat label="Approved OT" value={`${otHours.toFixed(1)} h`} sub="from attendance" />
        <Btn kind="primary" onClick={runPayroll} disabled={!can("payroll", "create")}>Run Apr 2026 Payroll</Btn>
      </PageHead>

      <Widget title="Payroll Runs" subtitle="Each run posts labour cost to project cost centres on disbursal">
        <div className="space-y-2 mb-4">
          {s.payroll.map((r) => (
            <div key={r.id} className="flex items-center gap-3 border border-line rounded-lg px-3.5 py-3 hover:border-line-strong transition-all">
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-ink-900">{r.period} <span className="text-ink-400 font-normal text-[11px]">· {r.employees} employees · {r.date}</span></p>
                <p className="text-[10.5px] text-ink-400 num mt-0.5">Gross ₹{r.gross} L · deductions ₹{r.deductions} L · net ₹{r.net} L</p>
              </div>
              <Pill value={r.status === "Paid" ? "Completed" : r.status === "Approved" ? "Submitted" : "Pending"} pulse={r.status === "Draft"} />
              {(r.status === "Draft" || r.status === "Approved") && can("payroll", "approve") && <Btn sm kind="primary" onClick={() => approveRun(r.id)}>Approve & Pay</Btn>}
            </div>
          ))}
        </div>
        <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Salary register — current roster (click for payslip)</p>
        <DataTable pageKey="payroll" rows={register} cols={cols} onRow={(r) => setSlip(r)} />
      </Widget>

      <Drawer open={!!slip} onClose={() => setSlip(null)} title="Payslip" sub={slip ? `${slip.name} · ${slip.empId} · Apr 2026` : ""}>
        {slip && (() => {
          const r = register.find((x) => x.id === slip.id)!;
          return (
            <div>
              <div className="rounded-lg border border-line overflow-hidden">
                <div className="bg-side-800 text-brand-50 px-4 py-3 flex justify-between items-center">
                  <div>
                    <p className="font-display font-bold text-[13px]">SAHAA INFRA Ltd.</p>
                    <p className="text-[10px] text-brand-200 mt-0.5">Payslip — April 2026</p>
                  </div>
                  <span className="num text-[11px] bg-brand-600 rounded px-2 py-1">{r.empId}</span>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400 mb-1.5">Earnings</p>
                    {[["Basic", r.base], ["HRA (20%)", r.hra], [`Overtime (${r.otH} h × 1.5)`, r.otPay]].map(([l, v]) => (
                      <div key={l as string} className="flex justify-between text-[12px] py-1 border-b border-line/60"><span className="text-ink-500">{l}</span><span className="num font-semibold text-ink-900">₹{(v as number).toLocaleString("en-IN")}</span></div>
                    ))}
                    <div className="flex justify-between text-[12px] py-1.5"><span className="font-bold text-ink-700">Gross</span><span className="num font-bold text-ink-900">₹{r.gross.toLocaleString("en-IN")}</span></div>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400 mb-1.5">Deductions</p>
                    {[["Provident Fund (12%)", r.pf], ["Professional Tax", r.pt]].map(([l, v]) => (
                      <div key={l as string} className="flex justify-between text-[12px] py-1 border-b border-line/60"><span className="text-ink-500">{l}</span><span className="num font-semibold text-danger-600">−₹{(v as number).toLocaleString("en-IN")}</span></div>
                    ))}
                  </div>
                  <div className="flex justify-between items-center rounded-lg bg-brand-50 border border-brand-200 px-3.5 py-3">
                    <span className="text-[12px] font-bold text-brand-700 uppercase tracking-wide">Net Pay</span>
                    <span className="num text-[19px] font-bold text-ink-900">₹{r.net.toLocaleString("en-IN")}</span>
                  </div>
                  <p className="text-[10px] text-ink-300">Paid via NEFT to HDFC •••• 7742 · generated by payroll engine · computer-generated payslip</p>
                </div>
              </div>
            </div>
          );
        })()}
      </Drawer>
    </div>
  );
}
