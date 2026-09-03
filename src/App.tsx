import { useEffect, useState } from "react";
import { RoleId, ACCESS } from "./data";
import { ERPProvider, useERP } from "./store";
import { ToastProvider } from "./ui";
import { Sidebar, Header, visibleNav } from "./shell";
import type { Route } from "./shell";
import { RoleDashboard, HeadOffice, SiteDash } from "./dash";
import { Workspace, ApprovalCentre, SignaturePage, AccessPage } from "./work";
import ProjectsPage from "./modules/projects";
import { IGrid, ITasks, IStamp, ISig, IBuilding } from "./icons";

const ls = {
  get<T>(k: string, fb: T): T { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ } },
};

export default function App() {
  const [role, setRole] = useState<RoleId>(() => ls.get<RoleId>("mer.role", "MD"));
  const [dark, setDark] = useState<boolean>(() => ls.get("mer.dark", false));
  useEffect(() => { ls.set("mer.role", role); }, [role]);
  useEffect(() => { ls.set("mer.dark", dark); document.documentElement.classList.toggle("dark", dark); }, [dark]);
  return (
    <ToastProvider>
      <ERPProvider role={role}>
        <Shell role={role} setRole={setRole} dark={dark} setDark={setDark} />
      </ERPProvider>
    </ToastProvider>
  );
}

function Shell({ role, setRole, dark, setDark }: { role: RoleId; setRole: (r: RoleId) => void; dark: boolean; setDark: (v: boolean) => void }) {
  const [route, setRoute] = useState<Route>("dashboard");
  const [collapsed, setCollapsed] = useState(() => ls.get("mer.side", false));
  const [mobileNav, setMobileNav] = useState(false);
  const [loading, setLoading] = useState(true);
  const erp = useERP();

  useEffect(() => { ls.set("mer.side", collapsed); }, [collapsed]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  /* loading shimmer on route change */
  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(t);
  }, [route, role]);

  /* reset to a permitted route when role changes */
  useEffect(() => {
    const allowed: Route[] = ["dashboard", "workspace"];
    const nav = visibleNav(role).flatMap((g) => g.items.map((i) => i.id));
    if (!nav.includes(route)) setRoute("dashboard");
    void allowed;
  }, [role, route]);

  const nav = (r: Route) => { setRoute(r); window.scrollTo({ top: 0, behavior: "smooth" }); };

  let page: React.ReactNode;
  switch (route) {
    case "dashboard": page = <RoleDashboard go={nav} />; break;
    case "workspace": page = <Workspace go={nav} />; break;
    case "headoffice": page = <HeadOffice go={nav} />; break;
    case "site": page = <SiteDash go={nav} />; break;
    case "projects": page = <ProjectsPage />; break;
    case "approvals": page = <ApprovalCentre />; break;
    case "signature": page = <SignaturePage />; break;
    case "access": page = <AccessPage />; break;
    default: page = <RoleDashboard go={nav} />;
  }

  return (
    <div className="min-h-dvh flex bg-canvas">
      <Sidebar route={route} onNav={nav} collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} mobileOpen={mobileNav} onCloseMobile={() => setMobileNav(false)} />
      <div className="flex-1 min-w-0 flex flex-col print-full">
        <Header route={route} onNav={nav} onMenu={() => (window.innerWidth >= 1024 ? setCollapsed((c) => !c) : setMobileNav(true))} onRole={setRole} />
        <main className="flex-1 px-3 md:px-5 py-4 md:py-5 max-w-[1560px] w-full mx-auto">
          {loading ? <PageSkeleton /> : page}
          <footer className="mt-6 pb-16 lg:pb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-300 num">
            <span>Meridian ERP v5.0 · {erp.s.settings.company}</span>
            <span>Live sync {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST · All figures unaudited</span>
          </footer>
        </main>
      </div>

      {/* Mobile quick actions */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line grid grid-cols-5 no-print">
        {([
          ["dashboard", "Home"], ["workspace", "Workspace"], ["approvals", "Approvals"], ["signature", "Sign"], ["headoffice", "Office"],
        ] as [Route, string][]).map(([id, label]) => {
          const allowed = visibleNav(role).flatMap((g) => g.items.map((i) => i.id));
          const show = allowed.includes(id);
          return (
            <button key={id} onClick={() => show && nav(id)}
              className={"py-2.5 flex flex-col items-center gap-0.5 text-[9.5px] font-semibold transition-colors " + (route === id ? "text-brand-700" : show ? "text-ink-400" : "text-ink-200")}>
              {id === "dashboard" ? <IGrid size={17} /> : id === "workspace" ? <ITasks size={17} /> : id === "approvals" ? <IStamp size={17} /> : id === "signature" ? <ISig size={17} /> : <IBuilding size={17} />}
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="col-span-6 md:col-span-3 bg-surface border border-line rounded-[10px] p-4">
          <div className="skel h-3 w-20 rounded" /><div className="skel h-6 w-24 mt-3 rounded" /><div className="skel h-3 w-16 mt-3 rounded" />
        </div>
      ))}
      <div className="col-span-12 xl:col-span-8 bg-surface border border-line rounded-[10px] p-4">
        <div className="skel h-4 w-40 rounded" />
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="skel h-9 w-full mt-3 rounded" />)}
      </div>
      <div className="col-span-12 xl:col-span-4 bg-surface border border-line rounded-[10px] p-4">
        <div className="skel h-4 w-32 rounded" />
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="skel h-12 w-full mt-3 rounded" />)}
      </div>
    </div>
  );
}
