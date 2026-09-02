import { useEffect, useMemo, useRef, useState } from "react";
import { FYEARS, ROLES, RoleId } from "./data";
import { useERP } from "./store";
import { cx, Pop, useToast } from "./ui";
import {
  ISearch, IBell, IInbox, IHelp, IChevD, IUser, ILogout, IBuilding, IMenu, IChevR, ICheck,
  IPlus, ICart, ICalCheck, ILedger, IGavel, IHardhat, IReceipt,
} from "./icons";
import { PunchWidget } from "./modules/attn";

const SunIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" /><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.2 5.2l1.7 1.7M17.1 17.1l1.7 1.7M18.8 5.2l-1.7 1.7M6.9 17.1l-1.7 1.7" />
  </svg>
);
const MoonIcon = ({ size = 17 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 13.2A8.2 8.2 0 0 1 10.8 4a8.2 8.2 0 1 0 9.2 9.2z" />
  </svg>
);

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
          <span className="block text-[9.5px] uppercase tracking-[0.14em] text-ink-400 mt-[3px] font-semibold">Sahaa Infra</span>
        </span>
      )}
    </div>
  );
}

const QUICK_ACTIONS = [
  { label: "New Project", route: "projects", icon: <IHardhat size={15} /> },
  { label: "New Requisition", route: "procurement", icon: <ICart size={15} /> },
  { label: "Punch In", route: "attendance", icon: <ICalCheck size={15} /> },
  { label: "Generate RA Bill", route: "billing", icon: <IReceipt size={15} /> },
  { label: "Journal Entry", route: "finance", icon: <ILedger size={15} /> },
  { label: "Register Tender", route: "tenders", icon: <IGavel size={15} /> },
];

export default function Header({
  role, onRoleChange, onMenu, onNavigate, project, onProject, fy, onFy,
}: {
  role: RoleId; onRoleChange: (r: RoleId) => void; onMenu: () => void;
  onNavigate: (route: string, kind?: string) => void;
  project: string; onProject: (v: string) => void; fy: string; onFy: (v: string) => void;
}) {
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [pop, setPop] = useState<"" | "bell" | "help" | "profile" | "roles" | "quick">(
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const erp = useERP();
  const me = ROLES.find((r) => r.id === role)!;

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* live search across the central store */
  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return null;
    const has = (...f: string[]) => f.join(" ").toLowerCase().includes(s);
    return {
      projects: erp.s.projects.filter((p) => has(p.name, p.client, p.code)).slice(0, 3),
      docs: erp.s.proc.filter((d) => has(d.code, d.party, d.items)).slice(0, 3),
      people: erp.s.employees.filter((e) => has(e.name, e.empId, e.desig)).slice(0, 3),
      materials: erp.s.materials.filter((m) => has(m.name, m.code, m.cat)).slice(0, 3),
      bills: erp.s.raBills.filter((r) => has(r.no, r.client, r.project)).slice(0, 2),
    };
  }, [q, erp.s]);

  const unread = erp.s.notifs.filter((n) => !n.read).length;
  const pendingApprovals =
    erp.s.proc.filter((d) => d.status === "Pending Approval").length +
    erp.s.attendance.filter((a) => a.appr === "Pending").length +
    erp.s.leaves.filter((l) => l.status === "Pending").length +
    erp.s.raBills.filter((r) => r.status === "Submitted").length +
    erp.s.payments.filter((p) => p.status === "Pending").length;

  const go = (route: string, kind?: string, msg?: string) => {
    onNavigate(route, kind);
    setPop(""); setQ(""); setSearchOpen(false);
    if (msg) toast("info", msg);
  };

  const NOTIF_META: Record<string, string> = {
    approval: "text-amber-600 bg-warn-100", payment: "text-ok-600 bg-ok-100",
    stock: "text-danger-600 bg-danger-100", project: "text-brand-700 bg-brand-50", system: "text-steel-600 bg-steel-100",
  };
  const ago = (iso: string) => {
    const m = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    return m < 60 ? `${m} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
  };

  const SectionHead = ({ t }: { t: string }) => <p className="px-3.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300">{t}</p>;

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
          placeholder="Search projects, POs, people, materials…"
          className="w-full h-9 pl-8 pr-14 rounded-lg border border-line bg-canvas/70 text-[12.5px] text-ink-700 placeholder:text-ink-300 outline-none focus:bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all"
        />
        <kbd className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 items-center gap-0.5 h-5 px-1.5 rounded border border-line bg-surface text-[9.5px] font-semibold text-ink-400 num">⌘K</kbd>
        <Pop open={searchOpen && q.trim().length > 0} onClose={() => setSearchOpen(false)} className="w-full max-w-[440px] left-0 right-auto overflow-hidden" align="left">
          {!results || Object.values(results).every((r) => r.length === 0) ? (
            <p className="px-4 py-4 text-[12.5px] text-ink-400">No matches for “{q}”. Try a code like PO-1287 or a name like UltraTech.</p>
          ) : (
            <div className="max-h-[360px] overflow-auto py-1.5">
              {results.projects.length > 0 && <SectionHead t="Projects" />}
              {results.projects.map((p) => (
                <button key={p.id} onMouseDown={() => go("projects", undefined, `Opening ${p.code} in Projects`)} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors">
                  <span className="num text-[10.5px] font-semibold text-brand-700 bg-brand-50 border border-brand-100 rounded px-1.5 py-0.5">{p.code}</span>
                  <span className="text-[12.5px] text-ink-700 truncate">{p.name}</span>
                  <span className="ml-auto text-[11px] text-ink-400 num">₹{p.contractValue.toFixed(1)} Cr</span>
                </button>
              ))}
              {results.docs.length > 0 && <SectionHead t="Procurement documents" />}
              {results.docs.map((d) => (
                <button key={d.id} onMouseDown={() => go("procurement", undefined, `Opening ${d.code} in Procurement`)} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors">
                  <span className="num text-[10.5px] font-semibold text-ink-500 bg-canvas border border-line rounded px-1.5 py-0.5">{d.code}</span>
                  <span className="text-[12.5px] text-ink-700 truncate">{d.items}</span>
                  <span className="ml-auto text-[11px] text-ink-400 num">₹{d.amount.toFixed(1)} L</span>
                </button>
              ))}
              {results.people.length > 0 && <SectionHead t="People" />}
              {results.people.map((e) => (
                <button key={e.id} onMouseDown={() => go("hr", undefined, `Opening ${e.name} in HR`)} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors">
                  <span className="h-6 w-6 rounded-full bg-side-800 text-brand-200 grid place-items-center text-[9px] font-bold">{e.name.split(" ").map((w) => w[0]).join("")}</span>
                  <span className="text-[12.5px] text-ink-700 truncate">{e.name}</span>
                  <span className="ml-auto text-[11px] text-ink-400 num">{e.empId}</span>
                </button>
              ))}
              {results.materials.length > 0 && <SectionHead t="Materials" />}
              {results.materials.map((m) => (
                <button key={m.code} onMouseDown={() => go("materials", undefined, `Opening ${m.name} in Materials`)} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors">
                  <span className="num text-[10.5px] font-semibold text-ink-500 bg-canvas border border-line rounded px-1.5 py-0.5">{m.code}</span>
                  <span className="text-[12.5px] text-ink-700 truncate">{m.name}</span>
                  <span className="ml-auto text-[11px] text-ink-400">{m.cat}</span>
                </button>
              ))}
              {results.bills.length > 0 && <SectionHead t="RA Bills" />}
              {results.bills.map((r) => (
                <button key={r.id} onMouseDown={() => go("billing", undefined, `Opening ${r.no} in Billing`)} className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors">
                  <span className="num text-[10.5px] font-semibold text-brand-700 bg-brand-50 border border-brand-100 rounded px-1.5 py-0.5">{r.no}</span>
                  <span className="text-[12.5px] text-ink-700 truncate">{r.client}</span>
                  <span className="ml-auto text-[11px] text-ink-400 num">₹{r.net.toFixed(2)} Cr</span>
                </button>
              ))}
            </div>
          )}
        </Pop>
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        {/* Selectors */}
        <div className="hidden xl:flex items-center gap-1.5">
          <select value={project} onChange={(e) => onProject(e.target.value)} className="h-9 max-w-[190px] pl-2.5 pr-7 rounded-lg border border-line bg-surface text-[12px] font-medium text-ink-700 outline-none cursor-pointer hover:border-line-strong focus:border-brand-500 transition-all truncate">
            <option>All Projects</option>
            {erp.s.projects.map((p) => <option key={p.id} value={p.name}>{p.code} · {p.name.slice(0, 24)}{p.name.length > 24 ? "…" : ""}</option>)}
          </select>
          <select value={fy} onChange={(e) => { onFy(e.target.value); toast("info", `Financial year set to ${e.target.value}`); }} className="h-9 pl-2.5 pr-2.5 rounded-lg border border-line bg-surface text-[12px] font-medium text-ink-700 outline-none cursor-pointer hover:border-line-strong focus:border-brand-500 transition-all">
            {FYEARS.map((f) => <option key={f}>{f}</option>)}
          </select>
        </div>

        <div className="hidden sm:block h-6 w-px bg-line mx-1" />

        {/* Quick actions */}
        <div className="relative">
          <button onClick={() => setPop(pop === "quick" ? "" : "quick")}
            className={cx("h-9 px-2.5 rounded-lg inline-flex items-center gap-1.5 text-[12px] font-semibold transition-all active:scale-95 tip tip-r", pop === "quick" ? "bg-brand-600 text-white" : "bg-brand-600/90 text-white hover:bg-brand-700")}
            data-tip="Quick actions">
            <IPlus size={15} /> <span className="hidden md:inline">Create</span>
          </button>
          <Pop open={pop === "quick"} onClose={() => setPop("")} className="w-[230px] py-1.5">
            <p className="px-3.5 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300">Quick actions</p>
            {QUICK_ACTIONS.map((a) => (
              <button key={a.label} onMouseDown={() => go(a.route, "new")}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-canvas text-left transition-colors text-[12.5px] font-medium text-ink-700">
                <span className="h-7 w-7 rounded-md bg-brand-50 text-brand-700 border border-brand-100 grid place-items-center">{a.icon}</span>
                {a.label}
                <IChevR size={12} className="ml-auto text-ink-300" />
              </button>
            ))}
          </Pop>
        </div>

        {/* Theme toggle */}
        <button onClick={() => { erp.setDark(!erp.dark); toast("info", erp.dark ? "Light mode enabled" : "Dark mode enabled"); }}
          className="h-9 w-9 grid place-items-center rounded-lg text-ink-500 hover:bg-canvas active:scale-90 transition-all tip tip-r" data-tip={erp.dark ? "Switch to light mode" : "Switch to dark mode"}>
          {erp.dark ? <SunIcon /> : <MoonIcon />}
        </button>

        {/* Universal attendance punch — every user */}
        <PunchWidget />

        {/* Approvals inbox */}
        <button onClick={() => go("approvals")} className="relative h-9 w-9 grid place-items-center rounded-lg text-ink-500 hover:bg-canvas active:scale-90 transition-all tip tip-r" data-tip="Pending approvals">
          <IInbox size={18} />
          {pendingApprovals > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-brand-600 text-white text-[9.5px] font-bold num grid place-items-center">{pendingApprovals}</span>
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setPop(pop === "bell" ? "" : "bell")} className={cx("relative h-9 w-9 grid place-items-center rounded-lg transition-all active:scale-90 tip tip-r", pop === "bell" ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-canvas")} data-tip="Notifications">
            <IBell size={18} />
            {unread > 0 && <span className="absolute top-1.5 right-2 h-2 w-2 rounded-full bg-danger-500 animate-pulse-dot" />}
          </button>
          <Pop open={pop === "bell"} onClose={() => setPop("")} className="w-[340px]">
            <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-line">
              <p className="font-display text-[12.5px] font-semibold">Notifications</p>
              <button onClick={() => { erp.markRead(); toast("success", "All notifications marked as read"); }} className="text-[11px] font-semibold text-brand-700 hover:underline">Mark all read</button>
            </div>
            <ul className="max-h-[320px] overflow-auto py-1">
              {erp.s.notifs.length === 0 && <li className="px-4 py-5 text-[12px] text-ink-400 text-center">You're all caught up.</li>}
              {erp.s.notifs.map((n) => (
                <li key={n.id} onClick={() => erp.markRead(n.id)} className="flex gap-2.5 px-3.5 py-2.5 hover:bg-canvas transition-colors cursor-pointer">
                  <span className={cx("h-7 w-7 rounded-full grid place-items-center shrink-0 mt-0.5", NOTIF_META[n.type] ?? "bg-steel-100 text-steel-600")}>
                    <span className={cx("h-1.5 w-1.5 rounded-full bg-current", !n.read && "animate-pulse-dot")} />
                  </span>
                  <div className="min-w-0">
                    <p className={cx("text-[12px] leading-snug", !n.read ? "text-ink-900 font-medium" : "text-ink-500")}>{n.text}</p>
                    <p className="text-[10.5px] text-ink-300 mt-0.5 num">{ago(n.ts)} · {n.type}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Pop>
        </div>

        {/* Help */}
        <div className="relative hidden sm:block">
          <button onClick={() => setPop(pop === "help" ? "" : "help")} className={cx("h-9 w-9 grid place-items-center rounded-lg transition-all active:scale-90 tip tip-r", pop === "help" ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-canvas")} data-tip="Help & support">
            <IHelp size={18} />
          </button>
          <Pop open={pop === "help"} onClose={() => setPop("")} className="w-[260px] p-3.5">
            <p className="font-display text-[12.5px] font-semibold mb-2">Keyboard shortcuts</p>
            {[["⌘ K", "Global search"], ["⌘ P", "Print / PDF"], ["Esc", "Close dialogs"]].map(([k, v]) => (
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
          <button onClick={() => setPop(pop === "profile" ? "" : pop === "roles" ? "roles" : "profile")} className="flex items-center gap-2.5 pl-1 pr-1.5 py-1 rounded-lg hover:bg-canvas active:scale-[0.98] transition-all">
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
                <p className="px-3.5 pt-2.5 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300">Sign in as</p>
                <ul className="pb-1.5 max-h-[300px] overflow-auto">
                  {ROLES.map((r) => (
                    <li key={r.id}>
                      <button
                        onClick={() => { onRoleChange(r.id); setPop(""); toast("success", `Signed in as ${r.label} — ${r.person}`); }}
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
                    <IUser size={15} className="text-ink-400" /> Switch user / role <IChevR size={13} className="ml-auto text-ink-300" />
                  </button>
                  <button onClick={() => go("settings")} className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] text-ink-700 hover:bg-canvas transition-colors">
                    <IChevR size={13} className="text-ink-300 -ml-0.5" /> My preferences & settings
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
