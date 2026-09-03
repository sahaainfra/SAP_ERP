import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ROLES, RoleId, ACCESS, ModuleId } from "./data";
import { useERP } from "./store";
import { cx, Pop } from "./ui";
import {
  IGrid, IHardhat, IGavel, IContract, ICart, ICube, IWarehouse, ICrane, IMixer, ICalCheck, IUsers,
  ILedger, IReceipt, INote, IStamp, IChart, ITrend, IFiles, ICog, IChevD, IUser, ILogout, IBuilding,
  IMenu, ISearch, IBell, IHelp, ISun, IMoon, ITasks, ISig, IShield, ICollapse, IX, IInbox, IClock,
} from "./icons";

export type Route =
  | "dashboard" | "workspace" | "headoffice" | "site" | "projects" | "tenders" | "commercial" | "billing"
  | "procurement" | "materials" | "stores" | "plant" | "rmc" | "attendance" | "hr" | "finance" | "payroll"
  | "approvals" | "signature" | "reports" | "analytics" | "documents" | "access" | "settings";

/* ── nav model ─────────────────────────────────────────────── */
export interface NavItem { id: Route; label: string; icon: (p: { size?: number; className?: string }) => ReactNode; roles?: RoleId[] }
export interface NavGroup { title: string; items: NavItem[] }

export const NAV: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { id: "dashboard", label: "My Dashboard", icon: IGrid },
      { id: "workspace", label: "My Workspace", icon: ITasks },
      { id: "headoffice", label: "Head Office", icon: IBuilding, roles: ["SUPER_ADMIN", "MD", "ACCOUNTS", "COMMERCIAL", "HR", "PROCUREMENT"] },
      { id: "site", label: "Site Office", icon: IHardhat, roles: ["SUPER_ADMIN", "MD", "PM", "SITE_ENG", "STORE", "RMC", "EMPLOYEE"] },
    ],
  },
  {
    title: "Projects & Commercial",
    items: [
      { id: "projects", label: "Projects", icon: IHardhat },
      { id: "tenders", label: "Tenders", icon: IGavel, roles: ["SUPER_ADMIN", "MD", "COMMERCIAL"] },
      { id: "commercial", label: "Commercial & Contracts", icon: IContract, roles: ["SUPER_ADMIN", "MD", "COMMERCIAL", "ACCOUNTS", "PM"] },
      { id: "billing", label: "Billing & RA Bills", icon: IReceipt, roles: ["SUPER_ADMIN", "MD", "ACCOUNTS", "COMMERCIAL", "PM"] },
    ],
  },
  {
    title: "Supply Chain",
    items: [
      { id: "procurement", label: "Procurement", icon: ICart, roles: ["SUPER_ADMIN", "MD", "PROCUREMENT", "ACCOUNTS", "PM", "SITE_ENG"] },
      { id: "materials", label: "Materials", icon: ICube },
      { id: "stores", label: "Stores & Inventory", icon: IWarehouse, roles: ["SUPER_ADMIN", "MD", "STORE", "PROCUREMENT", "PM", "RMC"] },
    ],
  },
  {
    title: "Site Operations",
    items: [
      { id: "plant", label: "Plant & Machinery", icon: ICrane, roles: ["SUPER_ADMIN", "MD", "PM", "RMC", "SITE_ENG"] },
      { id: "rmc", label: "RMC Plant", icon: IMixer, roles: ["SUPER_ADMIN", "MD", "RMC", "STORE", "SITE_ENG"] },
      { id: "attendance", label: "Attendance", icon: ICalCheck },
    ],
  },
  {
    title: "People & Finance",
    items: [
      { id: "hr", label: "HR & People", icon: IUsers, roles: ["SUPER_ADMIN", "MD", "HR", "PM", "EMPLOYEE"] },
      { id: "finance", label: "Finance & Accounts", icon: ILedger, roles: ["SUPER_ADMIN", "MD", "ACCOUNTS", "COMMERCIAL"] },
      { id: "payroll", label: "Payroll", icon: INote, roles: ["SUPER_ADMIN", "MD", "HR", "ACCOUNTS", "EMPLOYEE"] },
    ],
  },
  {
    title: "Control",
    items: [
      { id: "approvals", label: "Approval Centre", icon: IStamp },
      { id: "signature", label: "Digital Signatures", icon: ISig },
      { id: "reports", label: "Reports", icon: IChart },
      { id: "analytics", label: "Analytics", icon: ITrend, roles: ["SUPER_ADMIN", "MD", "COMMERCIAL", "ACCOUNTS"] },
      { id: "documents", label: "Documents", icon: IFiles },
      { id: "access", label: "Access & Permissions", icon: IShield, roles: ["SUPER_ADMIN"] },
      { id: "settings", label: "Settings", icon: ICog, roles: ["SUPER_ADMIN", "MD"] },
    ],
  },
];

export const visibleNav = (role: RoleId): NavGroup[] =>
  NAV.map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || i.roles.includes(role)) })).filter((g) => g.items.length > 0);

export function Brand({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="grid place-items-center shrink-0 h-9 w-9 rounded-[10px] bg-brand-600 text-white shadow-[inset_0_-2px_0_rgba(0,0,0,0.2)]">
        <svg width="19" height="19" viewBox="0 0 32 32" fill="none" aria-hidden>
          <path d="M6 24V10l7 8 4-5 9 11H6z" fill="currentColor" />
          <circle cx="24" cy="9" r="2.6" fill="#E0A33B" />
        </svg>
      </span>
      {!small && (
        <span className="leading-none min-w-0">
          <span className="block font-display font-bold text-[15.5px] tracking-tight text-ink-900">Meridian <span className="text-brand-600">ERP</span></span>
          <span className="block text-[9px] uppercase tracking-[0.18em] text-ink-400 mt-1 font-semibold">Sahaa Infra</span>
        </span>
      )}
    </div>
  );
}

/* ── approval count (shared) ───────────────────────────────── */
export function usePendingCount() {
  const { s } = useERP();
  return useMemo(() =>
    s.prs.filter((p) => p.status === "Submitted" || p.status === "Under Approval").length +
    s.pos.filter((p) => p.status === "Pending Approval").length +
    s.attendance.filter((a) => a.appr === "Pending").length +
    s.payments.filter((p) => p.status === "Pending").length +
    s.leaves.filter((l) => l.status === "Pending").length +
    s.billDocs.filter((r) => r.status === "Submitted for Checking" || r.status === "Under Approval").length,
    [s]);
}

/* ── Sidebar ───────────────────────────────────────────────── */
export function Sidebar({
  route, onNav, collapsed, onToggle, mobileOpen, onCloseMobile,
}: {
  route: Route; onNav: (r: Route) => void; collapsed: boolean; onToggle: () => void;
  mobileOpen: boolean; onCloseMobile: () => void;
}) {
  const { role, s } = useERP();
  const groups = visibleNav(role);
  const pending = usePendingCount();

  const body = (mini: boolean) => (
    <div className="flex flex-col h-full">
      <div className={cx("flex items-center h-14 shrink-0 border-b border-white/[0.07]", mini ? "justify-center" : "px-4")}>
        {mini ? (
          <span className="grid place-items-center h-9 w-9 rounded-[10px] bg-brand-600 text-white">
            <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><path d="M6 24V10l7 8 4-5 9 11H6z" fill="currentColor" /><circle cx="24" cy="9" r="2.6" fill="#E0A33B" /></svg>
          </span>
        ) : <Brand />}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4">
        {groups.map((g) => (
          <div key={g.title}>
            {!mini && <p className="px-2.5 mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-side-500">{g.title}</p>}
            <div className="space-y-0.5">
              {g.items.map((item) => {
                const active = route === item.id;
                const badge = item.id === "approvals" && pending > 0 ? pending : 0;
                return (
                  <button key={item.id} onClick={() => { onNav(item.id); onCloseMobile(); }} title={mini ? item.label : undefined}
                    className={cx(
                      "group relative w-full flex items-center gap-2.5 rounded-lg transition-all duration-150 text-left",
                      mini ? "h-10 justify-center" : "h-9.5 h-10 px-2.5",
                      active ? "bg-brand-600/18 text-[#d9f0e9]" : "text-side-300 hover:bg-white/[0.05] hover:text-[#d3e2ec]",
                    )}>
                    {active && <span className={cx("absolute top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-brand-500", mini ? "-left-2" : "-left-2")} />}
                    <span className={cx("shrink-0 transition-colors", active && "text-[#5fc4ae]")}><item.icon size={17} /></span>
                    {!mini && <span className="flex-1 text-[12.5px] font-medium truncate">{item.label}</span>}
                    {!mini && badge > 0 && (
                      <span className="num text-[10px] font-bold bg-brand-500 text-white rounded-full min-w-[17px] h-[17px] px-1 grid place-items-center">{badge}</span>
                    )}
                    {mini && badge > 0 && <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-brand-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cx("shrink-0 border-t border-white/[0.07] p-2.5", mini && "flex justify-center")}>
        {!mini ? (
          <div className="flex items-center gap-2.5 px-1.5">
            <span className="h-2 w-2 rounded-full bg-ok-500 animate-pulse-dot shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-side-200 truncate">{s.settings.company}</p>
              <p className="text-[9.5px] text-side-500 num">{s.settings.fy} · All systems live</p>
            </div>
            <button onClick={onToggle} className="h-7 w-7 grid place-items-center rounded-md text-side-400 hover:text-white hover:bg-white/[0.06] transition-all" aria-label="Collapse sidebar"><ICollapse size={15} /></button>
          </div>
        ) : (
          <button onClick={onToggle} className="h-8 w-8 grid place-items-center rounded-md text-side-400 hover:text-white hover:bg-white/[0.06] transition-all" aria-label="Expand sidebar"><ICollapse size={15} className="rotate-180" /></button>
        )}
      </div>
    </div>
  );

  return (
    <>
      <aside className={cx("hidden lg:block sticky top-0 h-dvh shrink-0 bg-side-900 border-r border-black/20 transition-[width] duration-200 no-print", collapsed ? "w-[64px]" : "w-[236px]")}>
        {body(collapsed)}
      </aside>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 no-print">
          <div className="absolute inset-0 bg-side-900/60 backdrop-blur-[2px]" onClick={onCloseMobile} />
          <aside className="absolute left-0 top-0 h-full w-[260px] bg-side-900 shadow-pop drawer-in">
            <button onClick={onCloseMobile} className="absolute top-4 right-3 h-8 w-8 grid place-items-center rounded-md text-side-400 hover:text-white transition-all z-10"><IX size={16} /></button>
            {body(false)}
          </aside>
        </div>
      )}
    </>
  );
}

/* ── Header ────────────────────────────────────────────────── */
export function Header({
  route, onNav, onMenu, onRole,
}: { route: Route; onNav: (r: Route) => void; onMenu: () => void; onRole: (r: RoleId) => void }) {
  const { role, userRec, dark, setDark, s, markRead, notify } = useERP();
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [pop, setPop] = useState<"" | "bell" | "profile" | "roles" | "help">("");
  const inputRef = useRef<HTMLInputElement>(null);
  const me = ROLES.find((r) => r.id === role)!;
  const pending = usePendingCount();
  const unread = s.notifs.filter((n) => !n.read).length;

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); inputRef.current?.focus(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return null;
    return {
      projects: s.projects.filter((p) => (p.name + p.client + p.code).toLowerCase().includes(t)).slice(0, 4),
      people: s.users.filter((u) => (u.name + u.role + u.dept).toLowerCase().includes(t)).slice(0, 4),
      docs: s.docs.filter((d) => d.name.toLowerCase().includes(t)).slice(0, 3),
      materials: s.materials.filter((m) => m.name.toLowerCase().includes(t)).slice(0, 3),
      approvals: [
        ...s.prs.filter((p) => p.no.toLowerCase().includes(t)).map((p) => ({ ref: p.no, type: "Purchase Requisition" })),
        ...s.pos.filter((p) => p.no.toLowerCase().includes(t)).map((p) => ({ ref: p.no, type: "Purchase Order" })),
        ...s.billDocs.filter((r) => r.no.toLowerCase().includes(t)).map((r) => ({ ref: r.no, type: r.type })),
      ].slice(0, 4),
    };
  }, [q, s]);

  const empty = results && results.projects.length + results.people.length + results.docs.length + results.materials.length + results.approvals.length === 0;

  return (
    <header className="sticky top-0 z-40 h-14 bg-surface/95 backdrop-blur border-b border-line flex items-center gap-2 px-3 md:px-4 no-print">
      <button onClick={onMenu} className="h-9 w-9 grid place-items-center rounded-md text-ink-500 hover:bg-canvas active:scale-90 transition-all" aria-label="Menu"><IMenu size={19} /></button>
      <div className="hidden md:block lg:hidden xl:block"><Brand /></div>

      {/* Global search */}
      <div className="relative flex-1 max-w-[460px] ml-1">
        <ISearch size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
        <input ref={inputRef} value={q}
          onChange={(e) => { setQ(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)}
          placeholder="Search projects, people, documents, approvals…"
          className="w-full h-9 pl-8 pr-14 rounded-lg border border-line bg-canvas/70 text-[12.5px] text-ink-700 placeholder:text-ink-300 outline-none focus:bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all" />
        <kbd className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 items-center h-5 px-1.5 rounded border border-line bg-surface text-[9.5px] font-semibold text-ink-400 num">⌘K</kbd>
        <Pop open={searchOpen && q.trim().length > 0} onClose={() => setSearchOpen(false)} className="w-full max-w-[460px] left-0 right-auto overflow-hidden" align="left">
          {empty ? (
            <p className="px-4 py-4 text-[12.5px] text-ink-400">No matches for “{q}”.</p>
          ) : results && (
            <div className="max-h-[340px] overflow-auto py-1.5">
              {results.projects.length > 0 && <p className="px-3.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300">Projects</p>}
              {results.projects.map((p) => (
                <button key={p.id} onMouseDown={() => { onNav("projects"); setQ(""); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors">
                  <span className="num text-[10.5px] font-semibold text-brand-700 bg-brand-50 border border-brand-100 rounded px-1.5 py-0.5">{p.code}</span>
                  <span className="text-[12.5px] text-ink-700 truncate">{p.name}</span>
                  <span className="ml-auto text-[11px] text-ink-400 num">₹{p.contractValue} Cr</span>
                </button>
              ))}
              {results.approvals.length > 0 && <p className="px-3.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300">Approvals</p>}
              {results.approvals.map((a) => (
                <button key={a.ref} onMouseDown={() => { onNav("approvals"); setQ(""); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors">
                  <IStamp size={14} className="text-ink-400 shrink-0" />
                  <span className="text-[12.5px] text-ink-700">{a.type} <span className="num text-ink-400">{a.ref}</span></span>
                </button>
              ))}
              {results.people.length > 0 && <p className="px-3.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300">People</p>}
              {results.people.map((u) => (
                <button key={u.id} onMouseDown={() => setQ("")} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors">
                  <IUser size={14} className="text-ink-400 shrink-0" />
                  <span className="text-[12.5px] text-ink-700">{u.name}</span>
                  <span className="ml-auto text-[10.5px] text-ink-400">{ROLES.find((r) => r.id === u.role)?.label}</span>
                </button>
              ))}
              {results.materials.length > 0 && <p className="px-3.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300">Materials</p>}
              {results.materials.map((m) => (
                <button key={m.code} onMouseDown={() => setQ("")} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors">
                  <ICube size={14} className="text-ink-400 shrink-0" />
                  <span className="text-[12.5px] text-ink-700">{m.name}</span>
                  <span className="ml-auto num text-[10.5px] text-ink-400">{m.code}</span>
                </button>
              ))}
              {results.docs.length > 0 && <p className="px-3.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300">Documents</p>}
              {results.docs.map((d) => (
                <button key={d.id} onMouseDown={() => setQ("")} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors">
                  <IFiles size={14} className="text-ink-400 shrink-0" />
                  <span className="text-[12.5px] text-ink-700 truncate">{d.name}</span>
                </button>
              ))}
            </div>
          )}
        </Pop>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* office / site chip */}
        <div className="hidden xl:flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-canvas/70 border border-line">
          <span className={cx("h-1.5 w-1.5 rounded-full", userRec.office === "Head Office" ? "bg-brand-500" : "bg-ok-500")} />
          <span className="text-[11px] font-semibold text-ink-500">{userRec.office}</span>
          <span className="text-[10px] text-ink-300 num">· {userRec.site}</span>
        </div>

        <button onClick={() => setDark(!dark)} className="h-9 w-9 grid place-items-center rounded-lg text-ink-500 hover:bg-canvas active:scale-90 transition-all" aria-label="Toggle theme">
          {dark ? <ISun size={17} /> : <IMoon size={17} />}
        </button>

        <button onClick={() => onNav("approvals")} className="relative h-9 w-9 grid place-items-center rounded-lg text-ink-500 hover:bg-canvas active:scale-90 transition-all" aria-label="Approvals">
          <IInbox size={18} />
          {pending > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-600 text-white text-[9.5px] font-bold num grid place-items-center">{pending}</span>}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setPop(pop === "bell" ? "" : "bell")} className={cx("relative h-9 w-9 grid place-items-center rounded-lg transition-all active:scale-90", pop === "bell" ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-canvas")} aria-label="Notifications">
            <IBell size={18} />
            {unread > 0 && <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-danger-500 animate-pulse-dot" />}
          </button>
          <Pop open={pop === "bell"} onClose={() => setPop("")} className="w-[340px]">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-line">
              <p className="font-display text-[12.5px] font-semibold">Notifications</p>
              <button onClick={() => { markRead(); }} className="text-[11px] font-semibold text-brand-700 hover:underline">Mark all read</button>
            </div>
            <ul className="max-h-[300px] overflow-auto py-1">
              {s.notifs.map((n) => (
                <li key={n.id} className={cx("flex gap-2.5 px-3.5 py-2.5 hover:bg-canvas transition-colors cursor-default", !n.read && "bg-brand-50/40")}>
                  <span className="h-7 w-7 rounded-full grid place-items-center shrink-0 mt-0.5 bg-steel-100 text-steel-600">
                    {n.type === "approval" ? <IStamp size={13} /> : n.type === "payment" ? <IClock size={13} /> : n.type === "hr" ? <IUsers size={13} /> : n.type === "stock" ? <ICube size={13} /> : <IHardhat size={13} />}
                  </span>
                  <div className="min-w-0">
                    <p className={cx("text-[12px] leading-snug", !n.read ? "text-ink-900 font-medium" : "text-ink-500")}>{n.text}</p>
                    <p className="text-[10.5px] text-ink-300 mt-0.5 num">{Math.max(0, Math.round((Date.now() - new Date(n.ts).getTime()) / 36e5))} h ago</p>
                  </div>
                </li>
              ))}
            </ul>
          </Pop>
        </div>

        {/* Help */}
        <div className="relative hidden sm:block">
          <button onClick={() => setPop(pop === "help" ? "" : "help")} className={cx("h-9 w-9 grid place-items-center rounded-lg transition-all active:scale-90", pop === "help" ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-canvas")} aria-label="Help">
            <IHelp size={18} />
          </button>
          <Pop open={pop === "help"} onClose={() => setPop("")} className="w-[250px] p-3.5">
            <p className="font-display text-[12.5px] font-semibold mb-2">Keyboard shortcuts</p>
            {[["⌘ K", "Global search"], ["Esc", "Close dialogs"]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1.5">
                <span className="text-[12px] text-ink-500">{v}</span>
                <kbd className="num text-[10.5px] font-semibold bg-canvas border border-line rounded px-1.5 py-0.5">{k}</kbd>
              </div>
            ))}
            <button onClick={() => setPop("")} className="mt-2.5 w-full h-8 rounded-md bg-brand-600 text-white text-[12px] font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all">Contact IT Support</button>
          </Pop>
        </div>

        <div className="h-6 w-px bg-line mx-1" />

        {/* Profile */}
        <div className="relative">
          <button onClick={() => setPop(pop === "profile" || pop === "roles" ? "" : "profile")} className="flex items-center gap-2.5 pl-1 pr-1.5 py-1 rounded-lg hover:bg-canvas active:scale-[0.98] transition-all">
            <span className="h-8 w-8 rounded-[9px] bg-side-800 text-brand-200 grid place-items-center font-display font-bold text-[12px]">
              {me.person.split(" ").map((w) => w[0]).join("")}
            </span>
            <span className="hidden md:block text-left leading-tight">
              <span className="block text-[12px] font-semibold text-ink-900">{me.person}</span>
              <span className="block text-[10px] text-ink-400 font-medium">{me.label} · {me.dept}</span>
            </span>
            <IChevD size={13} className="hidden md:block text-ink-300" />
          </button>
          <Pop open={pop === "profile" || pop === "roles"} onClose={() => setPop("")} className="w-[280px] overflow-hidden">
            {pop === "roles" ? (
              <div>
                <button onClick={() => setPop("profile")} className="w-full flex items-center gap-2 px-3.5 py-2.5 text-[12px] font-semibold text-brand-700 hover:bg-canvas border-b border-line transition-colors">← Back to profile</button>
                <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300">Switch role view</p>
                <ul className="pb-1.5 max-h-[300px] overflow-auto">
                  {ROLES.map((r) => (
                    <li key={r.id}>
                      <button onClick={() => { onRole(r.id); setPop(""); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors">
                        <span className="h-6 w-6 rounded-md bg-canvas border border-line grid place-items-center text-ink-500"><IUser size={13} /></span>
                        <span className="min-w-0">
                          <span className="block text-[12px] font-semibold text-ink-700 leading-tight">{r.label}</span>
                          <span className="block text-[10.5px] text-ink-400">{r.person}</span>
                        </span>
                        {role === r.id && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-500" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <div className="px-3.5 py-3 border-b border-line bg-canvas/60">
                  <p className="text-[13px] font-semibold text-ink-900">{me.person}</p>
                  <p className="text-[11px] text-ink-400 mt-0.5 flex items-center gap-1.5"><IBuilding size={12} /> {userRec.dept} · {userRec.office}</p>
                  <p className="text-[11px] text-ink-400 mt-0.5 num">Site: {userRec.site} · Limit: {userRec.finLimit ? `₹${userRec.finLimit} L` : "—"}</p>
                  <span className="inline-flex mt-2 items-center h-[20px] px-2 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-[10.5px] font-bold">{me.label}</span>
                </div>
                <div className="py-1.5">
                  <button onClick={() => setPop("roles")} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-ink-700 hover:bg-canvas transition-colors"><IUser size={15} className="text-ink-400" /> Switch role view</button>
                  <button onClick={() => { onNav("signature"); setPop(""); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-ink-700 hover:bg-canvas transition-colors"><ISig size={15} className="text-ink-400" /> My signature</button>
                  <button onClick={() => setPop("")} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-danger-600 hover:bg-danger-100/50 transition-colors"><ILogout size={15} /> Sign out</button>
                </div>
              </div>
            )}
          </Pop>
        </div>
      </div>
    </header>
  );
}
