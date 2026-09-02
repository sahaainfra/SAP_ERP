import { useEffect, useMemo, useRef, useState } from "react";
import { APPROVALS, FYEARS, PROJECTS, ROLES, RoleId, projectById } from "./data";
import { cx, Pop, useToast } from "./ui";
import {
  ISearch, IBell, IInbox, IHelp, IChevD, IX, IUser, ILogout, IBuilding, IMenu, IStamp, IChevR, ICheck,
} from "./icons";

function BrandMark({ small }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className="grid place-items-center shrink-0 h-8 w-8 rounded-[8px] bg-brand-600 text-brand-50 shadow-[inset_0_-2px_0_rgba(0,0,0,0.18)]">
        <svg width="17" height="17" viewBox="0 0 32 32" fill="none" aria-hidden>
          <path d="M6 24V10l7 8 4-5 9 11H6z" fill="currentColor" />
          <circle cx="24" cy="9" r="2.6" fill="#E0A33B" />
        </svg>
      </span>
      {!small && (
        <span className="leading-none min-w-0">
          <span className="block font-display font-bold text-[15px] tracking-tight text-ink-900">Meridian <span className="text-brand-600">ERP</span></span>
          <span className="block text-[9.5px] uppercase tracking-[0.14em] text-ink-400 mt-[3px] font-semibold">Ridgeline Infrastructure</span>
        </span>
      )}
    </div>
  );
}

export default function Header({
  role, onRoleChange, onMenu, approvalsCount, onOpenApprovals, project, onProject, fy, onFy,
}: {
  role: RoleId; onRoleChange: (r: RoleId) => void; onMenu: () => void;
  approvalsCount: number; onOpenApprovals: () => void;
  project: string; onProject: (v: string) => void; fy: string; onFy: (v: string) => void;
}) {
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [pop, setPop] = useState<"" | "bell" | "help" | "profile" | "roles">("");
  const [unread, setUnread] = useState(3);
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const me = ROLES.find((r) => r.id === role)!;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return { projects: [], approvals: [], modules: [] as string[] };
    return {
      projects: PROJECTS.filter((p) => (p.name + p.client + p.code).toLowerCase().includes(s)).slice(0, 4),
      approvals: APPROVALS.filter((a) => (a.ref + a.type + a.by).toLowerCase().includes(s)).slice(0, 4),
      modules: ["Projects", "Procurement", "Finance & Accounts", "RMC Plant", "Reports"].filter((m) => m.toLowerCase().includes(s)).slice(0, 3),
    };
  }, [q]);

  const notifs = [
    { id: 1, unread: true, tone: "text-danger-600 bg-danger-100", text: "RA-0772 pending certification for 48+ hrs", time: "10 min ago" },
    { id: 2, unread: true, tone: "text-amber-600 bg-amber-100", text: "OPC 53 stock fell below reorder level — Pune", time: "42 min ago" },
    { id: 3, unread: true, tone: "text-ok-600 bg-ok-100", text: "Payment ₹6.4 Cr released to Shree Construction", time: "5 hrs ago" },
    { id: 4, unread: false, tone: "text-steel-600 bg-steel-100", text: "Feb payroll run scheduled for 25 Feb", time: "Yesterday" },
  ];

  return (
    <header className="sticky top-0 z-40 h-14 bg-surface border-b border-line flex items-center gap-2 px-3 md:px-4 no-print">
      <button onClick={onMenu} className="lg:hidden h-9 w-9 grid place-items-center rounded-md text-ink-500 hover:bg-canvas active:scale-90 transition-all" aria-label="Menu">
        <IMenu size={19} />
      </button>
      <button onClick={onMenu} className="hidden lg:grid h-9 w-9 place-items-center rounded-md text-ink-500 hover:bg-canvas active:scale-90 transition-all tip tip-r" data-tip="Toggle sidebar" aria-label="Toggle sidebar">
        <IMenu size={19} />
      </button>

      <div className="hidden md:block"><BrandMark /></div>

      {/* Global search */}
      <div className="relative flex-1 max-w-[440px] ml-1">
        <ISearch size={15} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => { setQ(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          onBlur={() => window.setTimeout(() => setSearchOpen(false), 140)}
          placeholder="Search projects, approvals, vendors…"
          className="w-full h-9 pl-8 pr-14 rounded-lg border border-line bg-canvas/70 text-[12.5px] text-ink-700 placeholder:text-ink-300 outline-none focus:bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
        />
        <kbd className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-0.5 h-5 px-1.5 rounded border border-line bg-surface text-[9.5px] font-semibold text-ink-400 num">⌘K</kbd>
        <Pop open={searchOpen && q.trim().length > 0} onClose={() => setSearchOpen(false)} className="w-full max-w-[440px] left-0 right-auto overflow-hidden" align="left">
          {results.projects.length + results.approvals.length + results.modules.length === 0 ? (
            <p className="px-4 py-4 text-[12.5px] text-ink-400">No matches for “{q}”. Try a project code like PRJ-016.</p>
          ) : (
            <div className="max-h-[340px] overflow-auto py-1.5">
              {results.projects.length > 0 && <p className="px-3.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300">Projects</p>}
              {results.projects.map((p) => (
                <button key={p.id} onMouseDown={() => { onProject(p.name); setQ(""); toast("info", `Filtered dashboard to ${p.code}`); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors">
                  <span className="num text-[10.5px] font-semibold text-brand-700 bg-brand-50 border border-brand-100 rounded px-1.5 py-0.5">{p.code}</span>
                  <span className="text-[12.5px] text-ink-700 truncate">{p.name}</span>
                  <span className="ml-auto text-[11px] text-ink-400 num">₹{p.contractValue.toFixed(1)} Cr</span>
                </button>
              ))}
              {results.approvals.length > 0 && <p className="px-3.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300">Approvals</p>}
              {results.approvals.map((a) => (
                <button key={a.id} onMouseDown={() => { onOpenApprovals(); setQ(""); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors">
                  <IStamp size={14} className="text-ink-400 shrink-0" />
                  <span className="text-[12.5px] text-ink-700">{a.type} <span className="num text-ink-400">{a.ref}</span></span>
                  <span className="ml-auto text-[11px] text-ink-400">{projectById(a.projectId)?.code}</span>
                </button>
              ))}
              {results.modules.length > 0 && <p className="px-3.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300">Modules</p>}
              {results.modules.map((m) => (
                <button key={m} onMouseDown={() => setQ("")} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors">
                  <IChevR size={13} className="text-ink-300" />
                  <span className="text-[12.5px] text-ink-700">{m}</span>
                </button>
              ))}
            </div>
          )}
        </Pop>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Selectors */}
        <div className="hidden xl:flex items-center gap-1.5">
          <select value={project} onChange={(e) => onProject(e.target.value)} className="h-9 max-w-[190px] pl-2.5 pr-7 rounded-lg border border-line bg-surface text-[12px] font-medium text-ink-700 outline-none cursor-pointer hover:border-line-strong focus:border-brand-500 transition-all appearance-auto truncate">
            <option>All Projects</option>
            {PROJECTS.map((p) => <option key={p.id} value={p.name}>{p.code} · {p.name.slice(0, 24)}{p.name.length > 24 ? "…" : ""}</option>)}
          </select>
          <select value={fy} onChange={(e) => { onFy(e.target.value); toast("info", `Financial year set to ${e.target.value}`); }} className="h-9 pl-2.5 pr-2.5 rounded-lg border border-line bg-surface text-[12px] font-medium text-ink-700 outline-none cursor-pointer hover:border-line-strong focus:border-brand-500 transition-all">
            {FYEARS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>

        <div className="hidden sm:block h-6 w-px bg-line mx-1" />

        {/* Approvals inbox */}
        <button onClick={onOpenApprovals} className="relative h-9 w-9 grid place-items-center rounded-lg text-ink-500 hover:bg-canvas active:scale-90 transition-all tip tip-r" data-tip="Pending approvals">
          <IInbox size={18} />
          {approvalsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-600 text-white text-[9.5px] font-bold num grid place-items-center">{approvalsCount}</span>
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setPop(pop === "bell" ? "" : "bell")} className={cx("relative h-9 w-9 grid place-items-center rounded-lg transition-all active:scale-90 tip tip-r", pop === "bell" ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-canvas")} data-tip="Notifications">
            <IBell size={18} />
            {unread > 0 && <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-danger-500 animate-pulse-dot" />}
          </button>
          <Pop open={pop === "bell"} onClose={() => setPop("")} className="w-[330px]">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-line">
              <p className="font-display text-[12.5px] font-semibold">Notifications</p>
              <button onClick={() => { setUnread(0); toast("success", "All notifications marked as read"); }} className="text-[11px] font-semibold text-brand-700 hover:underline">Mark all read</button>
            </div>
            <ul className="max-h-[300px] overflow-auto py-1">
              {notifs.map((n) => (
                <li key={n.id} className="flex gap-2.5 px-3.5 py-2.5 hover:bg-canvas transition-colors cursor-default">
                  <span className={cx("h-7 w-7 rounded-full grid place-items-center shrink-0 mt-0.5", n.tone)}>
                    <span className={cx("h-1.5 w-1.5 rounded-full bg-current", n.unread && "animate-pulse-dot")} />
                  </span>
                  <div className="min-w-0">
                    <p className={cx("text-[12px] leading-snug", n.unread ? "text-ink-900 font-medium" : "text-ink-500")}>{n.text}</p>
                    <p className="text-[10.5px] text-ink-300 mt-0.5 num">{n.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Pop>
        </div>

        {/* Help */}
        <div className="relative">
          <button onClick={() => setPop(pop === "help" ? "" : "help")} className={cx("h-9 w-9 grid place-items-center rounded-lg transition-all active:scale-90 tip tip-r", pop === "help" ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-canvas")} data-tip="Help & support">
            <IHelp size={18} />
          </button>
          <Pop open={pop === "help"} onClose={() => setPop("")} className="w-[260px] p-3.5">
            <p className="font-display text-[12.5px] font-semibold mb-2">Keyboard shortcuts</p>
            {[["⌘ K", "Global search"], ["⌘ P", "Print dashboard"], ["Esc", "Close dialogs"]].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1.5">
                <span className="text-[12px] text-ink-500">{v}</span>
                <kbd className="num text-[10.5px] font-semibold bg-canvas border border-line rounded px-1.5 py-0.5">{k}</kbd>
              </div>
            ))}
            <button onClick={() => { toast("info", "Support ticket window opened"); setPop(""); }} className="mt-2.5 w-full h-8 rounded-md bg-brand-600 text-white text-[12px] font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all">
              Contact IT Support
            </button>
          </Pop>
        </div>

        <div className="h-6 w-px bg-line mx-1" />

        {/* Profile */}
        <div className="relative">
          <button onClick={() => setPop(pop === "profile" ? "" : "profile")} className="flex items-center gap-2.5 pl-1 pr-1.5 py-1 rounded-lg hover:bg-canvas active:scale-[0.98] transition-all">
            <span className="h-8 w-8 rounded-[9px] bg-side-800 text-brand-200 grid place-items-center font-display font-bold text-[12px]">
              {me.person.split(" ").map((w) => w[0]).join("")}
            </span>
            <span className="hidden md:block text-left leading-tight">
              <span className="block text-[12px] font-semibold text-ink-900">{me.person}</span>
              <span className="block text-[10px] text-ink-400 font-medium">{me.label} · {me.dept}</span>
            </span>
            <IChevD size={13} className="hidden md:block text-ink-300" />
          </button>
          <Pop open={pop === "profile" || pop === "roles"} onClose={() => setPop("")} className="w-[268px] overflow-hidden">
            {pop === "roles" ? (
              <div>
                <button onClick={() => setPop("profile")} className="w-full flex items-center gap-2 px-3.5 py-2.5 text-[12px] font-semibold text-brand-700 hover:bg-canvas border-b border-line transition-colors">
                  ← Back to profile
                </button>
                <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300">View dashboard as</p>
                <ul className="pb-1.5 max-h-[300px] overflow-auto">
                  {ROLES.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => { onRoleChange(r.id); setPop(""); toast("success", `Dashboard switched to ${r.label} view`); }}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors"
                      >
                        <span className="h-6 w-6 rounded-md bg-canvas border border-line grid place-items-center text-ink-500"><IUser size={13} /></span>
                        <span className="min-w-0">
                          <span className="block text-[12px] font-semibold text-ink-700 leading-tight">{r.label}</span>
                          <span className="block text-[10.5px] text-ink-400">{r.person}</span>
                        </span>
                        {role === r.id && <ICheck size={14} className="ml-auto text-brand-600 shrink-0" />}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div>
                <div className="px-3.5 py-3 border-b border-line bg-canvas/60">
                  <p className="text-[13px] font-semibold text-ink-900">{me.person}</p>
                  <p className="text-[11px] text-ink-400 mt-0.5 flex items-center gap-1.5"><IBuilding size={12} /> {me.dept} · {me.title}</p>
                  <span className="inline-flex mt-2 items-center gap-1.5 h-[20px] px-2 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-[10.5px] font-bold">{me.label}</span>
                </div>
                <div className="py-1.5">
                  <button onClick={() => setPop("roles")} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-ink-700 hover:bg-canvas transition-colors">
                    <IUser size={15} className="text-ink-400" /> Switch role view <IChevR size={13} className="ml-auto text-ink-300" />
                  </button>
                  <button onClick={() => { toast("info", "Preference screen opened"); setPop(""); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-ink-700 hover:bg-canvas transition-colors">
                    <IChevR size={13} className="text-ink-300 -ml-0.5" /> My preferences
                  </button>
                  <button onClick={() => { toast("error", "Signed out (demo)"); setPop(""); }} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-danger-600 hover:bg-danger-100/50 transition-colors">
                    <ILogout size={15} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </Pop>
        </div>
      </div>
    </header>
  );
}
