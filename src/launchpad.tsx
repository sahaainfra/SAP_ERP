/* Meridian ERP · Launchpad — S/4HANA-inspired enterprise home */
import { useMemo, useState } from "react";
import { useERP } from "./store";
import { KPI_LIB, ROLE_KPIS } from "./data";
import type { RoleId } from "./data";
import { visibleNav, usePendingCount } from "./shell";
import type { Route } from "./shell";
import { Sparkline, Delta, Pill, cx, useToast, Reveal } from "./ui";
import { useCountUp } from "./ui";
import { IChevR, IClock, IBell, IAlert, ICheck, ICart, ICalCheck, IReceipt, ILedger, IMixer, IStamp } from "./icons";
import { fmtNum } from "./data";

const IPin = ({ size = 12, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 4h6l-1 6 3 3v1H7v-1l3-3-1-6z" /><path d="M12 14v6" />
  </svg>
);

const lsGet = <T,>(k: string, fb: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; } };
const lsSet = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ } };

type Recent = { id: string; ts: number }[];

function KpiTile({ id, i }: { id: string; i: number }) {
  const k = KPI_LIB[id];
  const v = useCountUp(k.value);
  if (!k) return null;
  return (
    <Reveal delay={i * 45} className="min-w-0">
      <div className="group relative h-full bg-surface border border-line rounded-[10px] shadow-card p-3.5 overflow-hidden transition-all duration-200 hover:shadow-lift hover:-translate-y-[3px]">
        <span className="absolute inset-x-0 top-0 h-[3px] bg-brand-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
        <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-ink-400 leading-snug">{k.label}</p>
        <p className="num text-[24px] font-semibold text-ink-900 mt-1.5 leading-none">
          {k.prefix}<span>{k.decimals === 0 ? fmtNum(v, 0) : fmtNum(v, k.decimals ?? 1)}</span>
          {k.unit && <span className="text-[11.5px] font-medium text-ink-400 ml-1">{k.unit}</span>}
        </p>
        <div className="flex items-end justify-between mt-2.5">
          <div>
            <Delta value={k.delta} goodWhenUp={k.goodWhenUp} />
            <p className="text-[9.5px] text-ink-300 mt-1 num">{k.prev}</p>
          </div>
          <Sparkline data={k.spark} color={k.delta >= 0 === (k.goodWhenUp ?? true) ? "#128574" : "#d05252"} w={62} h={24} />
        </div>
      </div>
    </Reveal>
  );
}

export default function Launchpad({ go }: { go: (r: Route) => void }) {
  const { s, role, user, dark, setDark } = useERP();
  const toast = useToast();
  const pending = usePendingCount();
  const [favTab, setFavTab] = useState(false);

  const apps = useMemo(() => visibleNav(role).flatMap((g) => g.items).filter((i) => i.id !== "dashboard"), [role]);
  const [favs, setFavs] = useState<string[]>(() => lsGet("mer.favs." + role, [] as string[]));
  const toggleFav = (id: string) => {
    const next = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
    setFavs(next); lsSet("mer.favs." + role, next);
    toast("info", favs.includes(id) ? "Removed from favorites" : "Pinned to favorites");
  };
  const recent: Recent = lsGet("mer.recent", []);
  const recentApps = recent.map((r) => apps.find((a) => a.id === r.id)).filter(Boolean).slice(0, 4);

  const kpis = (ROLE_KPIS[role] ?? []).slice(0, 6);

  /* quick actions by role */
  const quick: { label: string; icon: React.ReactNode; route: Route }[] =
    role === "STORE" ? [
      { label: "Post GRN", icon: <ICart size={15} />, route: "stores" },
      { label: "Material Issue", icon: <ICubeP />, route: "materials" },
      { label: "Stock Check", icon: <ICalCheck size={15} />, route: "stores" },
    ] : role === "HR" ? [
      { label: "Approve Leave", icon: <ICalCheck size={15} />, route: "hr" },
      { label: "Run Payroll", icon: <ILedger size={15} />, route: "payroll" },
      { label: "Attendance", icon: <ICalCheck size={15} />, route: "attendance" },
    ] : role === "RMC" ? [
      { label: "New Order", icon: <IMixer size={15} />, route: "rmc" },
      { label: "Batch Record", icon: <IReceipt size={15} />, route: "rmc" },
      { label: "Cube Test", icon: <ICalCheck size={15} />, route: "quality" },
    ] : role === "ACCOUNTS" ? [
      { label: "New Voucher", icon: <ILedger size={15} />, route: "accounts" },
      { label: "Receipt", icon: <IReceipt size={15} />, route: "accounts" },
      { label: "Trial Balance", icon: <ILedger size={15} />, route: "finance" },
    ] : role === "COMMERCIAL" ? [
      { label: "New RA Bill", icon: <IReceipt size={15} />, route: "billing" },
      { label: "Measurement", icon: <ICalCheck size={15} />, route: "billing" },
      { label: "Rate Analysis", icon: <ILedger size={15} />, route: "commercial" },
    ] : [
      { label: "New PR", icon: <ICart size={15} />, route: "procurement" },
      { label: "New RA Bill", icon: <IReceipt size={15} />, route: "billing" },
      { label: "Approvals", icon: <IStamp size={15} />, route: "approvals" },
    ];

  /* continue unfinished */
  const unfinished = [
    ...s.prs.filter((p) => p.status === "Draft").map((d) => ({ ref: d.no, label: "Purchase Requisition", route: "procurement" as Route, meta: `${d.project} · draft` })),
    ...s.pos.filter((p) => p.status === "Draft").map((d) => ({ ref: d.no, label: "Purchase Order", route: "procurement" as Route, meta: `${d.vendor} · draft` })),
    ...s.billDocs.filter((b) => ["Draft", "Under Preparation"].includes(b.status)).map((b) => ({ ref: b.no, label: "RA Bill", route: "billing" as Route, meta: `${b.project} · ${b.status.toLowerCase()}` })),
    ...s.payRuns.filter((r) => r.status === "Processing").map((r) => ({ ref: r.period, label: "Payroll Run", route: "payroll" as Route, meta: `${r.employees} employees` })),
  ].slice(0, 4);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-5">
      {/* ── Launchpad masthead ── */}
      <Reveal>
        <div className="relative overflow-hidden rounded-[12px] border border-line bg-surface shadow-card px-4 md:px-6 py-5">
          <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "18px 18px", color: "var(--color-ink-900)" }} />
          <div className="absolute -right-10 -top-16 h-48 w-48 rounded-full bg-brand-500/10 blur-2xl" />
          <div className="relative flex flex-wrap items-center gap-x-6 gap-y-3">
            <div className="min-w-0">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-700">{today}</p>
              <h1 className="font-display text-[22px] md:text-[26px] font-bold tracking-tight text-ink-900 mt-1">
                {greet}, {user.name.split(" ")[0]}.
              </h1>
              <p className="text-[12px] text-ink-400 mt-1">
                {user.title} · {user.dept} · <span className="num">FY 2025–26</span>
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-line bg-canvas/60 text-[12px] font-semibold text-ink-700 num">
                <IClock size={13} className="text-brand-600" /> Live · {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST
              </span>
              <button onClick={() => go("approvals")} className="relative inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-brand-600 text-white text-[12px] font-semibold hover:bg-brand-700 active:scale-[0.97] transition-all shadow-card">
                <IStamp size={14} /> {pending} pending approvals
                <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 border-2 border-surface animate-pulse" />
              </button>
              <button onClick={() => setDark(!dark)} className="h-9 w-9 grid place-items-center rounded-lg border border-line text-ink-500 hover:border-line-strong hover:bg-canvas active:scale-90 transition-all" title="Toggle theme">
                {dark ? "☀" : "☾"}
              </button>
            </div>
          </div>
        </div>
      </Reveal>

      {/* ── KPI tile grid ── */}
      <section>
        <SectionHead title="My Insights" sub="Key figures for your role — updated in real time" />
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {kpis.map((id, i) => <KpiTile key={id} id={id} i={i} />)}
        </div>
      </section>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="space-y-5 min-w-0">
          {/* ── Applications ── */}
          <section>
            <SectionHead title="Applications" sub="Authorized for your role · pin the ones you use most"
              right={
                <button onClick={() => setFavTab(!favTab)} className={cx("h-7 px-2.5 rounded-md border text-[11px] font-semibold inline-flex items-center gap-1.5 transition-all active:scale-95", favTab ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-ink-500 hover:bg-canvas")}>
                  <IPin size={11} /> Favorites {favs.length > 0 && `(${favs.length})`}
                </button>} />
            <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-6 gap-3">
              {(favTab ? apps.filter((a) => favs.includes(a.id)) : apps).map((a, i) => (
                <Reveal key={a.id} delay={Math.min(i, 8) * 30}>
                  <div className="group relative h-full">
                    <button onClick={() => go(a.id)}
                      className="w-full h-full flex flex-col items-start gap-2.5 rounded-[10px] border border-line bg-surface shadow-card p-3 text-left transition-all duration-200 hover:border-brand-300 hover:shadow-lift hover:-translate-y-[3px] active:scale-[0.97]">
                      <span className="h-9 w-9 rounded-[9px] grid place-items-center bg-brand-50 text-brand-700 border border-brand-100 group-hover:bg-brand-600 group-hover:text-white group-hover:border-brand-600 transition-colors duration-200">
                        <a.icon size={17} />
                      </span>
                      <span className="text-[11px] font-semibold text-ink-700 leading-tight group-hover:text-ink-900">{a.label}</span>
                      <span className="mt-auto inline-flex items-center gap-0.5 text-[9.5px] font-bold uppercase tracking-wide text-brand-700 opacity-0 group-hover:opacity-100 transition-opacity">Open <IChevR size={9} /></span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleFav(a.id); }} title={favs.includes(a.id) ? "Unpin" : "Pin to favorites"}
                      className={cx("absolute top-1.5 right-1.5 h-6 w-6 grid place-items-center rounded-md transition-all active:scale-90", favs.includes(a.id) ? "text-brand-600 bg-brand-50" : "text-ink-200 opacity-0 group-hover:opacity-100 hover:text-ink-500 hover:bg-canvas")}>
                      <IPin size={11} />
                    </button>
                  </div>
                </Reveal>
              ))}
              {favTab && favs.length === 0 && (
                <p className="col-span-full text-[12px] text-ink-400 border border-dashed border-line rounded-[10px] px-4 py-6 text-center">
                  No favorites yet — hover a tile and use the pin to build your personal launchpad.
                </p>)}
            </div>
          </section>

          {/* ── Quick actions + continue unfinished ── */}
          <div className="grid sm:grid-cols-2 gap-5">
            <section>
              <SectionHead title="Quick Actions" sub="One-tap entry points" />
              <div className="space-y-2">
                {quick.map((qa) => (
                  <button key={qa.label} onClick={() => go(qa.route)}
                    className="w-full flex items-center gap-3 rounded-[10px] border border-line bg-surface px-3.5 py-3 text-left transition-all duration-150 hover:border-brand-300 hover:bg-brand-50/40 hover:translate-x-[3px] active:scale-[0.98]">
                    <span className="h-8 w-8 rounded-lg grid place-items-center bg-brand-600 text-white shrink-0">{qa.icon}</span>
                    <span className="text-[12.5px] font-semibold text-ink-900">{qa.label}</span>
                    <IChevR size={13} className="ml-auto text-ink-300" />
                  </button>))}
              </div>
            </section>
            <section>
              <SectionHead title="Continue Where You Left Off" sub="Unfinished drafts & running processes" />
              {unfinished.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-line px-4 py-6 text-center">
                  <p className="text-[12px] font-semibold text-ink-700">All caught up</p>
                  <p className="text-[11px] text-ink-400 mt-1">No draft transactions waiting for you.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unfinished.map((u) => (
                    <button key={u.ref} onClick={() => go(u.route)}
                      className="w-full flex items-center gap-3 rounded-[10px] border border-amber-500/25 bg-amber-100/20 px-3.5 py-3 text-left transition-all duration-150 hover:bg-amber-100/40 hover:translate-x-[3px] active:scale-[0.98]">
                      <span className="h-8 w-8 rounded-lg grid place-items-center bg-amber-100 text-amber-600 shrink-0"><IClock size={14} /></span>
                      <span className="min-w-0">
                        <span className="block text-[12.5px] font-bold text-ink-900 num truncate">{u.ref}</span>
                        <span className="block text-[10.5px] text-ink-400">{u.label} · {u.meta}</span>
                      </span>
                      <IChevR size={13} className="ml-auto text-ink-300 shrink-0" />
                    </button>))}
                </div>)}
            </section>
          </div>

          {/* ── Recently used ── */}
          {recentApps.length > 0 && (
            <section>
              <SectionHead title="Recently Used" sub="Your latest workspaces" />
              <div className="flex flex-wrap gap-2">
                {recentApps.map((a) => a && (
                  <button key={a.id} onClick={() => go(a.id)}
                    className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-line bg-surface text-[12px] font-semibold text-ink-700 hover:border-brand-300 hover:bg-brand-50/40 active:scale-95 transition-all">
                    <a.icon size={14} className="text-brand-600" /> {a.label}
                  </button>))}
              </div>
            </section>)}
        </div>

        {/* ── Right rail: alert centre ── */}
        <AlertCentre go={go} />
      </div>
    </div>
  );
}

function ICubeP() { return <ICart size={15} />; }

function SectionHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3 mb-2.5">
      <div>
        <h2 className="font-display text-[14.5px] font-bold tracking-tight text-ink-900">{title}</h2>
        {sub && <p className="text-[10.5px] text-ink-400 mt-0.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/* ══════════ Alert Centre ══════════ */
type Alert = { id: string; sev: "Critical" | "Warning" | "Info"; cat: string; text: string; detail: string; route: Route };

function AlertCentre({ go }: { go: (r: Route) => void }) {
  const { s } = useERP();
  const [tab, setTab] = useState<"All" | "Critical" | "Warning" | "Info">("All");
  const [snoozed, setSnoozed] = useState<string[]>(() => lsGet("mer.alerts.snooze", [] as string[]));
  const [done, setDone] = useState<string[]>(() => lsGet("mer.alerts.done", [] as string[]));

  const alerts: Alert[] = useMemo(() => {
    const list: Alert[] = [];
    s.arInvoices.filter((a) => a.status === "Overdue").forEach((a, i) => list.push({ id: "ar" + a.id, sev: "Critical", cat: "Receivables", text: `${a.no} overdue — ${a.client}`, detail: `₹${(a.amount - a.received).toFixed(2)} Cr outstanding · due ${a.due}`, route: "accounts" }));
    s.projects.filter((p) => p.budgetUtil > 85 && p.status !== "Completed").forEach((p) => list.push({ id: "bud" + p.id, sev: "Critical", cat: "Budget", text: `${p.code} budget at ${p.budgetUtil}%`, detail: "Control budget nearing exhaustion — review committed cost", route: "projects" }));
    if (s.payments.filter((p) => p.status === "Pending").length) list.push({ id: "pay", sev: "Critical", cat: "Payments", text: `${s.payments.filter((p) => p.status === "Pending").length} payments awaiting release`, detail: "Approved payables queued for bank release", route: "accounts" });
    s.stock.forEach((st, i) => { const m = s.materials.find((mm) => mm.name === st.material); if (m && st.onHand < m.rol) list.push({ id: "stk" + i, sev: "Warning", cat: "Stock", text: `${st.material} below reorder level`, detail: `${st.onHand.toLocaleString("en-IN")} ${st.unit} on hand vs ROL ${m.rol.toLocaleString("en-IN")}`, route: "stores" }); });
    s.equipment.filter((e) => e.status === "Breakdown" || (e.maintDue && !e.maintDue.includes("in"))).forEach((e) => list.push({ id: "eq" + e.code, sev: "Warning", cat: "Plant", text: `${e.name} — service due`, detail: `${e.code} · ${e.hrs.toLocaleString("en-IN")} hrs · due ${e.maintDue}`, route: "plant" }));
    s.billDocs.filter((b) => ["Submitted to Client", "Under Client Certification"].includes(b.status)).forEach((b) => list.push({ id: "bill" + b.id, sev: "Warning", cat: "Billing", text: `${b.no} pending certification`, detail: `${b.client} · net ₹${b.net.toFixed(2)} Cr`, route: "billing" }));
    s.docs.filter((d) => d.expiry).forEach((d) => list.push({ id: "doc" + d.id, sev: "Warning", cat: "Documents", text: `${d.name} expiring ${d.expiry}`, detail: `${d.folder} · v${d.ver} — renewal required`, route: "documents" }));
    list.push({ id: "inf1", sev: "Info", cat: "Procurement", text: "New quotations received", detail: "2 vendor quotations awaiting comparative statement", route: "procurement" });
    list.push({ id: "inf2", sev: "Info", cat: "Site", text: "DPR submitted — morning shift", detail: "Site engineer logged progress against 4 BOQ items", route: "projects" });
    return list.filter((a) => !snoozed.includes(a.id) && !done.includes(a.id));
  }, [s, snoozed, done]);

  const shown = alerts.filter((a) => tab === "All" || a.sev === tab);
  const counts = { Critical: alerts.filter((a) => a.sev === "Critical").length, Warning: alerts.filter((a) => a.sev === "Warning").length, Info: alerts.filter((a) => a.sev === "Info").length };

  return (
    <Reveal delay={120}>
      <aside className="rounded-[12px] border border-line bg-surface shadow-card overflow-hidden lg:sticky lg:top-4">
        <div className="px-4 py-3.5 border-b border-line flex items-center gap-2.5 bg-canvas/50">
          <span className="relative h-8 w-8 rounded-lg grid place-items-center bg-brand-50 text-brand-700 border border-brand-100">
            <IBell size={15} />
            {counts.Critical > 0 && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-danger-500 animate-pulse" />}
          </span>
          <div>
            <h2 className="font-display text-[14px] font-bold text-ink-900 leading-none">Alert Centre</h2>
            <p className="text-[10px] text-ink-400 mt-1 num">{alerts.length} active · {counts.Critical} critical</p>
          </div>
        </div>
        <div className="flex border-b border-line">
          {(["All", "Critical", "Warning", "Info"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={cx("flex-1 h-9 text-[11px] font-bold transition-colors relative", tab === t ? "text-brand-700" : "text-ink-400 hover:text-ink-700")}>
              {t}{t !== "All" && <span className="num text-[9px] ml-1 opacity-70">{counts[t]}</span>}
              {tab === t && <span className="absolute bottom-0 inset-x-3 h-[2px] bg-brand-600 rounded-t" />}
            </button>))}
        </div>
        <ul className="max-h-[480px] overflow-auto divide-y divide-line/70">
          {shown.length === 0 && (
            <li className="px-4 py-8 text-center">
              <span className="inline-grid place-items-center h-10 w-10 rounded-full bg-ok-100 text-ok-600 mb-2"><ICheck size={17} /></span>
              <p className="text-[12.5px] font-semibold text-ink-900">No {tab === "All" ? "" : tab.toLowerCase() + " "}alerts</p>
              <p className="text-[11px] text-ink-400 mt-0.5">Resolved and snoozed items are hidden.</p>
            </li>)}
          {shown.map((a) => (
            <li key={a.id} className="group px-4 py-3 hover:bg-canvas/60 transition-colors">
              <div className="flex items-start gap-2.5">
                <span className={cx("mt-0.5 h-6 w-6 rounded-md grid place-items-center shrink-0",
                  a.sev === "Critical" ? "bg-danger-100 text-danger-600" : a.sev === "Warning" ? "bg-amber-100 text-amber-600" : "bg-steel-100 text-steel-600")}>
                  <IAlert size={12} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-300">{a.cat}</p>
                  <button onClick={() => go(a.route)} className="text-left">
                    <p className="text-[12px] font-semibold text-ink-900 leading-snug hover:text-brand-700 transition-colors">{a.text}</p>
                  </button>
                  <p className="text-[10.5px] text-ink-400 mt-0.5 leading-snug">{a.detail}</p>
                  <div className="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => go(a.route)} className="text-[10px] font-bold text-brand-700 hover:underline">Open →</button>
                    <button onClick={() => { setSnoozed((v) => { const n = [...v, a.id]; lsSet("mer.alerts.snooze", n); return n; }); }} className="text-[10px] font-semibold text-ink-400 hover:text-ink-700">Snooze</button>
                    <button onClick={() => { setDone((v) => { const n = [...v, a.id]; lsSet("mer.alerts.done", n); return n; }); }} className="text-[10px] font-semibold text-ok-600 hover:underline">Resolve</button>
                  </div>
                </div>
                <Pill value={a.sev} pulse={a.sev === "Critical"} />
              </div>
            </li>))}
        </ul>
        {(snoozed.length > 0 || done.length > 0) && (
          <button onClick={() => { setSnoozed([]); setDone([]); lsSet("mer.alerts.snooze", []); lsSet("mer.alerts.done", []); }}
            className="w-full h-9 text-[10.5px] font-bold uppercase tracking-wide text-ink-400 hover:text-brand-700 border-t border-line transition-colors">
            Restore snoozed & resolved ({snoozed.length + done.length})
          </button>)}
      </aside>
    </Reveal>
  );
}
