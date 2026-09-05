/* Meridian ERP · Identity Admin — users, management chain, assignments, delegation */
import { useMemo, useState } from "react";
import { useERP, demoHash, dStr } from "./store";
import type { AssignmentRec, DelegationRec } from "./store";
import { ROLES } from "./data";
import { Widget, Pill, cx, useToast, Empty } from "./ui";
import { PageHead, Seg, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat, AddBtn } from "./modules/core";
import type { Col } from "./modules/core";
import { IChevD, ICheck, IXCircle, ILock, IUsers } from "./icons";
import { SessionManager } from "./auth";

export { };

/* ══════════ USER MANAGEMENT ══════════ */
export function UsersPage() {
  const { s, setS, can, log, notify, user } = useERP();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [fRole, setFRole] = useState("");
  const [fDept, setFDept] = useState("");
  const [view, setView] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [newCred, setNewCred] = useState<{ name: string; username: string; temp: string } | null>(null);

  const rows = useMemo(() => s.users.filter((u) =>
    (!fRole || u.role === fRole) && (!fDept || u.dept === fDept) &&
    (u.name + u.email + u.dept + u.project).toLowerCase().includes(q.toLowerCase())), [s.users, q, fRole, fDept]);

  const setActive = (u: any, on: boolean) => {
    setS((p) => ({
      ...p,
      users: p.users.map((x) => x.id === u.id ? { ...x, active: on } : x),
      creds: { ...p.creds, [u.id]: { ...p.creds[u.id], status: on ? "Active" : "Inactive", failed: 0, lockedUntil: undefined } },
    }));
    log("Identity", on ? "Account Activated" : "Account Deactivated", u.email, `by ${user.name}`);
    notify("system", `${u.name}'s account ${on ? "activated" : "deactivated"}`);
    toast(on ? "success" : "info", `${u.name} ${on ? "activated" : "deactivated"}`);
  };

  const resetPw = (u: any) => {
    const temp = "Tmp@" + Math.floor(10000 + Math.random() * 89999);
    setS((p) => ({ ...p, creds: { ...p.creds, [u.id]: { ...p.creds[u.id], hash: demoHash(temp), mustChange: true, failed: 0, lockedUntil: undefined, status: "Active" } } }));
    setS((p) => ({ ...p, loginHistory: [{ id: "lh" + Date.now(), user: u.name, ts: new Date().toISOString(), device: "Admin console", ip: "10.20.4.10", status: "Password Changed" }, ...p.loginHistory] }));
    log("Identity", "Password Reset", u.email, `Temporary password issued by ${user.name} — user must change on first login`);
    toast("success", `Temporary password issued for ${u.name} (must change on login)`);
  };

  const unlock = (u: any) => {
    setS((p) => ({ ...p, creds: { ...p.creds, [u.id]: { ...p.creds[u.id], lockedUntil: undefined, failed: 0, status: "Active" } } }));
    log("Identity", "Account Unlocked", u.email, `by ${user.name}`);
    toast("success", `${u.name} unlocked`);
  };

  const cols: Col[] = [
    { key: "name", label: "User", render: (u) => (
      <div className="flex items-center gap-2.5">
        <span className="h-8 w-8 rounded-full grid place-items-center text-[10px] font-bold text-white shrink-0" style={{ background: "#0c7264" }}>{u.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}</span>
        <div><p className="text-[12.5px] font-semibold text-ink-900">{u.name}</p><p className="text-[10.5px] num text-ink-400">{u.email}</p></div>
      </div>) },
    { key: "role", label: "Role", render: (u) => <span className="text-[10.5px] font-bold uppercase tracking-wide bg-brand-50 text-brand-700 border border-brand-100 rounded px-1.5 py-0.5">{ROLES.find((r) => r.id === u.role)?.label ?? u.role}</span> },
    { key: "dept", label: "Department", render: (u) => <span className="text-[12px] text-ink-500">{u.dept}</span> },
    { key: "project", label: "Project / Site", render: (u) => <div><p className="num text-[11.5px] font-semibold text-ink-700">{u.project}</p><p className="text-[10px] text-ink-400">{u.site}</p></div> },
    { key: "office", label: "Office", render: (u) => <span className="text-[11px] text-ink-500">{u.office}</span> },
    { key: "finLimit", label: "Fin. Limit", align: "right", sort: (u) => u.finLimit, render: (u) => <span className="num text-[12px] font-semibold">{u.finLimit ? `₹${u.finLimit} L` : "—"}</span> },
    { key: "credStatus", label: "Account", render: (u) => {
      const c = s.creds[u.id];
      const st = c?.status ?? "Active";
      return <Pill value={st === "Active" && u.active ? "On Track" : st === "Locked" ? "Attention Required" : "Submitted"} pulse={st === "Locked"} />;
    }, csv: (u) => s.creds[u.id]?.status ?? "Active" },
    { key: "lastLogin", label: "Last Login", render: (u) => <span className="num text-[10.5px] text-ink-400">{u.lastLogin}</span> },
    { key: "act", label: "Actions", render: (u: any) => (
      <span className="flex gap-1 justify-end">
        {(s.creds[u.id]?.status === "Locked" || (s.creds[u.id]?.lockedUntil ?? 0) > Date.now()) && <Btn sm onClick={(e: any) => { e.stopPropagation(); unlock(u); }}><ILock size={11} /> Unlock</Btn>}
        <Btn sm onClick={(e: any) => { e.stopPropagation(); resetPw(u); }}>Reset PW</Btn>
        <Btn sm kind={u.active ? "danger" : "ok"} onClick={(e: any) => { e.stopPropagation(); setActive(u, !u.active); }}>{u.active ? "Deactivate" : "Activate"}</Btn>
      </span>) },
  ];

  return (
    <div className="fade-up">
      <PageHead title="User Administration" crumbs={["Meridian", "Administration", "Users"]}
        desc="Individual accounts only — every action is attributable to a person, with sessions, lockout and login history.">
        <Stat label="Total users" value={`${s.users.length}`} />
        <Stat label="Active" value={`${s.users.filter((u) => u.active).length}`} tone="ok" />
        <Stat label="Locked / Inactive" value={`${s.users.filter((u) => !u.active || s.creds[u.id]?.status === "Locked").length}`} tone="warn" />
        <Stat label="Open sessions" value={`${s.sessions.length}`} />
        <AddBtn label="New User Account" disabled={!can("settings", "create")} tip="Super Admin / HR only" onClick={() => { setCreating(true); setNewCred(null); }} />
      </PageHead>

      <Widget title="User Accounts" subtitle="Passwords are stored as salted hashes — never displayed in plain text">
        <FilterBar pageKey="users-adm" q={q} onQ={setQ} filters={[
          { key: "role", label: "Role", value: fRole, options: ROLES.map((r) => r.id), onChange: setFRole },
          { key: "dept", label: "Department", value: fDept, options: [...new Set(s.users.map((u) => u.dept))], onChange: setFDept },
        ]} />
        <DataTable pageKey="users-admin" rows={rows} cols={cols} onRow={(u) => setView(u)} />
      </Widget>

      {/* user dossier */}
      <Drawer wide open={!!view} onClose={() => setView(null)} title={view?.name ?? ""} sub={view ? `${view.email} · ${ROLES.find((r) => r.id === view.role)?.label}` : ""}>
        {view && (() => {
          const u = s.users.find((x) => x.id === view.id) ?? view;
          const c = s.creds[u.id];
          const hist = s.loginHistory.filter((h) => h.user === u.name).slice(0, 8);
          const asg = s.assignments.filter((a) => a.user === u.name);
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[["Username", c?.username], ["Mobile", c?.mobile], ["Joined", c?.joinDate], ["Office", u.office], ["Reports to", u.manager ?? "—"], ["Fin. limit", u.finLimit ? `₹${u.finLimit} L` : "—"]].map(([k, v]) => (
                  <div key={k} className="rounded-lg border border-line bg-canvas/50 px-3 py-2"><p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-400">{k}</p><p className="text-[12.5px] font-semibold text-ink-900 mt-0.5 num">{v}</p></div>))}
              </div>
              <div className="flex items-center gap-2">
                <span className={cx("h-2.5 w-2.5 rounded-full", u.active && c?.status === "Active" ? "bg-ok-500 animate-pulse-dot" : "bg-danger-500")} />
                <p className="text-[12px] font-bold text-ink-700">{u.active ? (c?.status === "Locked" ? "Account locked — failed attempts" : "Account active") : "Account deactivated"}</p>
                <span className="ml-auto"><Pill value={c?.mustChange ? "Attention Required" : "On Track"} /></span>
              </div>

              {asg.length > 0 && (
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-400 mb-2">Project assignments (history preserved)</p>
                  <ul className="space-y-1.5">{asg.map((a) => (
                    <li key={a.id} className="flex items-center gap-3 border border-line rounded-lg px-3 py-2">
                      <span className="num text-[11px] font-bold text-brand-700 w-[46px]">{a.project}</span>
                      <span className="text-[12px] text-ink-700 flex-1 truncate">{a.role} · {a.site}</span>
                      <span className="num text-[10.5px] text-ink-400">{a.from} → {a.to === "—" ? "current" : a.to}</span>
                      <Pill value={a.status === "Active" ? "On Track" : "Completed"} />
                    </li>))}</ul>
                </div>)}

              <div>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-400 mb-2">Login history</p>
                <ul className="space-y-1.5">{hist.length ? hist.map((h) => (
                  <li key={h.id} className="flex items-center gap-3 border border-line rounded-lg px-3 py-2">
                    <span className={cx("h-2 w-2 rounded-full shrink-0", h.status === "Success" ? "bg-ok-500" : h.status === "Failed" ? "bg-amber-500" : "bg-danger-500")} />
                    <span className="text-[11.5px] text-ink-700 flex-1 truncate">{h.device}</span>
                    <span className="num text-[10px] text-ink-400">{h.ip}</span>
                    <span className="num text-[10.5px] text-ink-500 w-[130px] text-right">{new Date(h.ts).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                    <Pill value={h.status === "Success" ? "On Track" : h.status === "Failed" ? "Submitted" : "Attention Required"} />
                  </li>)) : <li className="text-[11.5px] text-ink-400">No logins recorded yet.</li>}</ul>
              </div>

              <SessionManager />
            </div>);
        })()}
      </Drawer>

      <CreateUser open={creating} onClose={() => { setCreating(false); setNewCred(null); }} created={newCred} setCreated={setNewCred} />
    </div>
  );
}

function CreateUser({ open, onClose, created, setCreated }: { open: boolean; onClose: () => void; created: { name: string; username: string; temp: string } | null; setCreated: (c: any) => void }) {
  const { s, setS, log, notify, user } = useERP();
  const toast = useToast();
  const [f, setF] = useState({ name: "", email: "", mobile: "", role: "SITE_ENG", dept: "Project Execution", designation: "Site Engineer", project: "P1", site: "Pachgaon Site", office: "Site Office", manager: "Sunita Deshmukh", finLimit: "2" });

  const submit = () => {
    if (!f.name.trim() || !f.email.trim()) { toast("error", "Name and official email are mandatory"); return; }
    if (s.users.some((u) => u.email.toLowerCase() === f.email.toLowerCase())) { toast("error", "Email already exists — duplicate accounts are not allowed"); return; }
    const id = "u" + (s.users.length + 1) + Date.now().toString().slice(-2);
    const username = f.email.split("@")[0];
    const temp = "Tmp@" + Math.floor(10000 + Math.random() * 89999);
    setS((p) => ({
      ...p,
      users: [...p.users, { id, name: f.name, email: f.email, role: f.role as any, dept: f.dept, project: f.project, site: f.site, office: f.office as any, finLimit: parseFloat(f.finLimit) || 0, active: true, lastLogin: "Never", manager: f.manager }],
      creds: { ...p.creds, [id]: { username, hash: demoHash(temp), mobile: f.mobile, mustChange: true, failed: 0, joinDate: dStr(0), status: "Active" } },
      assignments: [...p.assignments, { id: "as" + Date.now(), user: f.name, empId: id, project: f.project, site: f.site, role: ROLES.find((r) => r.id === f.role)?.label ?? f.designation, responsibility: "As per role matrix", manager: f.manager, finLimit: f.finLimit ? `₹${f.finLimit} L` : "—", from: dStr(0), to: "—", status: "Active" }],
    }));
    log("Identity", "User Account Created", f.email, `${ROLES.find((r) => r.id === f.role)?.label} · ${f.project} · by ${user.name}`);
    notify("system", `New account provisioned — ${f.name} (${f.project})`);
    setCreated({ name: f.name, username, temp });
  };

  if (!open) return null;
  return (
    <Drawer wide open={open} onClose={onClose} title={created ? "Account provisioned" : "New User Account"} sub={created ? "Share these credentials securely — the password will be masked after this screen" : "Auto-generates User ID, official email & temporary password"}>
      {!created ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Full name"><input className={inputCls} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="e.g. Priya Kulkarni" /></Field>
            <Field label="Official email"><input className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="priya.k@sahaainfra.com" /></Field>
            <Field label="Mobile"><input className={inputCls} value={f.mobile} onChange={(e) => setF({ ...f, mobile: e.target.value })} placeholder="+91 …" /></Field>
            <Field label="Role">
              <div className="relative"><select className={selectCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>
                {ROLES.map((r) => <option key={r.id} value={r.id}>{r.label}</option>)}</select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
            </Field>
            <Field label="Department"><input className={inputCls} value={f.dept} onChange={(e) => setF({ ...f, dept: e.target.value })} /></Field>
            <Field label="Designation"><input className={inputCls} value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} /></Field>
            <Field label="Assigned project">
              <div className="relative"><select className={selectCls} value={f.project} onChange={(e) => {
                const pr = s.projects.find((p) => p.id === e.target.value);
                setF({ ...f, project: e.target.value, site: pr?.location ?? f.site });
              }}>
                <option value="HO">Head Office</option>
                {s.projects.map((p) => <option key={p.id} value={p.id}>{p.code} — {p.name.slice(0, 24)}</option>)}</select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
            </Field>
            <Field label="Site"><input className={inputCls} value={f.site} onChange={(e) => setF({ ...f, site: e.target.value })} /></Field>
            <Field label="Reporting manager"><input className={inputCls} value={f.manager} onChange={(e) => setF({ ...f, manager: e.target.value })} /></Field>
            <Field label="Financial limit (₹ L)"><input type="number" className={inputCls} value={f.finLimit} onChange={(e) => setF({ ...f, finLimit: e.target.value })} /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Btn onClick={onClose}>Cancel</Btn>
            <Btn kind="primary" onClick={submit}>Provision Account</Btn>
          </div>
        </div>
      ) : (
        <div className="text-center py-4 fade-up">
          <span className="h-14 w-14 rounded-full grid place-items-center bg-ok-100 text-ok-600 mx-auto"><ICheck size={26} /></span>
          <h3 className="font-display font-bold text-[18px] text-ink-900 mt-3">{created.name} can now sign in</h3>
          <p className="text-[12px] text-ink-400 mt-1">Project assignment, role permissions and approval authority are active immediately.</p>
          <div className="max-w-[320px] mx-auto mt-5 rounded-xl border border-brand-200 bg-brand-50/60 p-4 space-y-2 text-left">
            {[["Username", created.username], ["Temporary password", created.temp], ["First login", "Password change required"]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 text-[12.5px]"><span className="text-ink-500 font-semibold">{k}</span><span className="num font-bold text-ink-900">{v}</span></div>))}
          </div>
          <p className="text-[10.5px] text-ink-300 mt-3">This is the only time the temporary password is shown. It is stored as a hash.</p>
          <Btn kind="primary" className="mt-5" onClick={onClose}>Done</Btn>
        </div>
      )}
    </Drawer>
  );
}

/* ══════════ MANAGEMENT CHAIN & DELEGATION ══════════ */
export function ChainPage() {
  const { s, setS, can, log, notify, user } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<"chain" | "delegation" | "authority">("chain");
  const [del, setDel] = useState(false);
  const [df, setDf] = useState({ from: "", to: "", txn: "Purchase Requisition", project: "All", fromD: dStr(0), toD: dStr(14), reason: "" });

  /* build tree: group users by manager */
  const byManager = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const u of s.users) {
      const m = u.manager ?? "Management";
      if (!map.has(m)) map.set(m, []);
      map.get(m)!.push(u);
    }
    return map;
  }, [s.users]);

  const roots = s.users.filter((u) => ["MD", "SUPER_ADMIN"].includes(u.role));

  const submitDelegation = () => {
    if (!df.from || !df.to) { toast("error", "Select both the original approver and the delegate"); return; }
    if (df.from === df.to) { toast("error", "Cannot delegate to the same person"); return; }
    const rec: DelegationRec = { id: "dl" + Date.now(), from: df.from, to: df.to, txn: df.txn, project: df.project, fromD: df.fromD, toD: df.toD, reason: df.reason || "Temporary delegation", status: "Active", approvedBy: user.name };
    setS((p) => ({ ...p, delegations: [rec, ...p.delegations] }));
    log("Identity", "Approval Delegated", `${df.from} → ${df.to}`, `${df.txn} · ${df.project} · till ${df.toD}`);
    notify("approval", `${df.to} is now the delegated approver for ${df.txn} (${df.project})`);
    toast("success", "Delegation active — visible in all approval histories");
    setDel(false);
    setDf({ from: "", to: "", txn: "Purchase Requisition", project: "All", fromD: dStr(0), toD: dStr(14), reason: "" });
  };

  const renderNode = (u: any, depth: number): React.ReactNode => {
    const reports = byManager.get(u.name) ?? [];
    return (
      <div key={u.id} style={{ marginLeft: depth * 22 }} className="relative">
        {depth > 0 && <span className="absolute left-[-14px] top-0 bottom-0 w-px bg-line" />}
        {depth > 0 && <span className="absolute left-[-14px] top-[19px] w-[14px] h-px bg-line" />}
        <div className="flex items-center gap-3 my-1.5 group">
          <span className="h-9 w-9 rounded-full grid place-items-center text-[10px] font-bold text-white shrink-0" style={{ background: depth === 0 ? "#0c7264" : depth === 1 ? "#128574" : "#3ba391" }}>
            {u.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-bold text-ink-900 leading-tight">{u.name}
              <span className="ml-2 text-[9.5px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-400">{ROLES.find((r) => r.id === u.role)?.label}</span>
            </p>
            <p className="text-[10.5px] text-ink-400 num">{u.dept} · {u.project} · {u.site}</p>
          </div>
          <span className="num text-[10px] text-ink-300 opacity-0 group-hover:opacity-100 transition-opacity">{reports.length ? `${reports.length} report${reports.length > 1 ? "s" : ""}` : ""}</span>
        </div>
        {reports.map((r) => renderNode(r, depth + 1))}
      </div>
    );
  };

  return (
    <div className="fade-up">
      <PageHead title="Management Chain & Authority" crumbs={["Meridian", "Administration", "Management Chain"]}
        desc="Reporting hierarchy drives approval routing, attendance authority and escalation — configurable without code changes.">
        <Stat label="Active delegations" value={`${s.delegations.filter((d) => d.status === "Active").length}`} tone={s.delegations.some((d) => d.status === "Active") ? "warn" : "ok"} />
        <Stat label="Authority rules" value={`${s.matrix.length}`} />
        <Stat label="Reporting levels" value="6" sub="MD → Labour" />
        <Btn kind="primary" onClick={() => setDel(true)}>Delegate Approval</Btn>
      </PageHead>

      <Widget title={tab === "chain" ? "Reporting Hierarchy" : tab === "delegation" ? "Approval Delegation" : "Approval Authority Matrix"}
        subtitle={tab === "chain" ? "Approvals auto-route up this chain by project, amount and transaction type" : tab === "delegation" ? "Temporary transfers of approval authority — always recorded" : "Who can approve what, and up to how much"}>
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={[{ k: "chain" as const, l: "Hierarchy" }, { k: "delegation" as const, l: "Delegation", n: s.delegations.length }, { k: "authority" as const, l: "Authority Matrix", n: s.matrix.length }]} /></div>

        {tab === "chain" && (
          <div className="rounded-xl border border-line bg-canvas/40 p-4 overflow-x-auto">
            {roots.length ? roots.map((r) => renderNode(r, 0)) : <Empty title="No hierarchy defined" note="Assign reporting managers to users to build the chain." />}
            <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-line text-[10.5px] text-ink-400">
              {["Management / Director", "Department Head", "Project Manager", "Site Engineer", "Supervisor", "Employee / Labour"].map((l, i) => (
                <span key={l} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: i < 2 ? "#0c7264" : i < 4 ? "#128574" : "#3ba391" }} /> L{i + 1} · {l}</span>))}
            </div>
          </div>)}

        {tab === "delegation" && (
          <DataTable pageKey="delegation" rows={s.delegations} cols={[
            { key: "from", label: "Original Approver", render: (d) => <span className="text-[12.5px] font-semibold text-ink-900">{d.from}</span> },
            { key: "to", label: "Delegated To", render: (d) => <span className="text-[12.5px] font-semibold text-brand-700">→ {d.to}</span> },
            { key: "txn", label: "Transaction", render: (d) => <span className="text-[12px] text-ink-700">{d.txn}</span> },
            { key: "project", label: "Project", render: (d) => <span className="num text-[11.5px] text-ink-500">{d.project}</span> },
            { key: "period", label: "Period", render: (d) => <span className="num text-[11px] text-ink-500">{d.fromD} → {d.toD}</span> },
            { key: "reason", label: "Reason", render: (d) => <span className="text-[11.5px] text-ink-500 truncate max-w-[180px] block">{d.reason}</span> },
            { key: "status", label: "Status", render: (d) => <Pill value={d.status === "Active" ? "On Track" : "Completed"} pulse={d.status === "Active"} />, csv: (d) => d.status },
            { key: "by", label: "Approved By", render: (d) => <span className="text-[10.5px] text-ink-400">{d.approvedBy}</span> },
          ] as Col[]} empty={{ title: "No delegations", note: "Delegate approval authority temporarily — e.g. during leave." }} />
        )}

        {tab === "authority" && (
          <div className="space-y-2.5">
            {s.matrix.map((m: any) => (
              <div key={m.id} className="rounded-xl border border-line bg-surface p-4 hover:border-line-strong transition-all">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="font-display font-bold text-[14px] text-ink-900">{m.doc}</p>
                  <span className="text-[10px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-400">{m.levels.length} levels</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {m.levels.map((lv: any, i: number) => (
                    <span key={i} className="flex items-center gap-2">
                      <span className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50/60 px-3 py-2">
                        <span className="num text-[9.5px] font-bold bg-brand-600 text-white rounded-full h-5 w-5 grid place-items-center">{i + 1}</span>
                        <span>
                          <span className="block text-[11.5px] font-bold text-ink-900 leading-tight">{lv.role}</span>
                          <span className="block text-[9.5px] text-ink-400 num">≤ {lv.limit} · backup: {lv.backup}</span>
                        </span>
                      </span>
                      {i < m.levels.length - 1 && <span className="text-brand-500 font-bold">→</span>}
                    </span>))}
                </div>
              </div>))}
          </div>)}
      </Widget>

      {/* delegation form */}
      <Drawer open={del} onClose={() => setDel(false)} title="Delegate Approval Authority" sub="Temporary — shown in every approval history while active">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Original approver">
              <div className="relative"><select className={selectCls} value={df.from} onChange={(e) => setDf({ ...df, from: e.target.value })}>
                <option value="">Select…</option>{s.users.filter((u) => u.finLimit > 0).map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
            </Field>
            <Field label="Delegate to">
              <div className="relative"><select className={selectCls} value={df.to} onChange={(e) => setDf({ ...df, to: e.target.value })}>
                <option value="">Select…</option>{s.users.filter((u) => u.name !== df.from && u.finLimit > 0).map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}</select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
            </Field>
            <Field label="Transaction type">
              <div className="relative"><select className={selectCls} value={df.txn} onChange={(e) => setDf({ ...df, txn: e.target.value })}>
                {["Purchase Requisition", "Purchase Order", "Vendor Payment", "Material Request", "Attendance Correction", "RA Bill", "Leave"].map((t) => <option key={t}>{t}</option>)}</select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
            </Field>
            <Field label="Project">
              <div className="relative"><select className={selectCls} value={df.project} onChange={(e) => setDf({ ...df, project: e.target.value })}>
                <option>All</option>{s.projects.map((p) => <option key={p.id} value={p.code}>{p.code}</option>)}</select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div>
            </Field>
            <Field label="From"><input className={inputCls} value={df.fromD} onChange={(e) => setDf({ ...df, fromD: e.target.value })} /></Field>
            <Field label="Until"><input className={inputCls} value={df.toD} onChange={(e) => setDf({ ...df, toD: e.target.value })} /></Field>
          </div>
          <Field label="Reason"><input className={inputCls} value={df.reason} onChange={(e) => setDf({ ...df, reason: e.target.value })} placeholder="e.g. On leave — coverage required" /></Field>
          <div className="flex justify-end gap-2 pt-2 border-t border-line">
            <Btn onClick={() => setDel(false)}>Cancel</Btn>
            <Btn kind="primary" onClick={submitDelegation}><ICheck size={13} /> Activate Delegation</Btn>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
