import { useEffect, useState } from "react";
import { RoleId, ACCESS } from "./data";
import { ERPProvider, useERP } from "./store";
import { ToastProvider, cx } from "./ui";
import { Sidebar, Header, visibleNav } from "./shell";
import type { Route } from "./shell";
import { RoleDashboard, HeadOffice, SiteDash } from "./dash";
import { Workspace, ApprovalCentre, SignaturePage, AccessPage } from "./work";
import ProjectsPage from "./modules/projects";
import { PRPage, POPage } from "./modules/procurement";
import ProcurementPage from "./modules/procurement";
import MaterialsPage from "./modules/materials";
import FinancePage from "./modules/finance";
import { TenderPage, PlantPage, RmcPage } from "./modules/ops";
import CommercialPage from "./modules/commercial";
import BillingPage from "./modules/billingpg";
import { AttendancePage, HRPage, PayrollPage } from "./modules/hrpages";
import { ReportsPage, AnalyticsPage, DocumentsPage, SettingsPage } from "./modules/system";
import AccountsPage from "./modules/accounts";
import { PFPage, PeopleOpsPage, QualityPage, SafetyPage, PlantOpsPage, VendorsPage, AuditPage } from "./modules/p2";
import { Seg } from "./modules/core";
import Launchpad from "./launchpad";
import { ChatPanel, useChatUnread, IChat } from "./chat";
import { LoginScreen, readSession, clearSession } from "./auth";
import { UsersPage, ChainPage } from "./identity";
import { IGrid, ITasks, IStamp, ISig, IBuilding, ICalCheck, IMenu } from "./icons";

const ls = {
  get<T>(k: string, fb: T): T { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; } },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ } },
};

/* Procurement tool hub — PR, full chain, and PO registers under one module */
function ProcurementHub() {
  const [view, setView] = useState<"pr" | "chain" | "po">("pr");
  return (
    <div className="fade-up">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-300">Meridian / Supply Chain / Procurement</p>
          <h1 className="font-display text-[19px] font-bold text-ink-900 tracking-tight mt-1">Procurement Management</h1>
          <p className="text-[12px] text-ink-400 mt-0.5">PR → RFQ → Comparative → PO → GRN → Invoice → Payment, all on one connected ledger.</p>
        </div>
        <Seg value={view} onChange={setView} options={[
          { k: "pr" as const, l: "Purchase Requisitions" }, { k: "chain" as const, l: "Procurement Chain" }, { k: "po" as const, l: "Purchase Orders" },
        ]} />
      </div>
      {view === "pr" && <PRPage />}
      {view === "chain" && <ProcurementPage />}
      {view === "po" && <POPage />}
    </div>
  );
}

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
  const [chatOpen, setChatOpen] = useState(false);
  const erp = useERP();
  const chatUnread = useChatUnread();

  /* open chat from anywhere via the header icon or launcher */
  useEffect(() => {
    const h = () => setChatOpen(true);
    window.addEventListener("mer.chat", h);
    return () => window.removeEventListener("mer.chat", h);
  }, []);

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

  const nav = (r: Route) => {
    setRoute(r);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const rec = JSON.parse(localStorage.getItem("mer.recent") || "[]") as { id: string; ts: number }[];
      localStorage.setItem("mer.recent", JSON.stringify([{ id: r, ts: Date.now() }, ...rec.filter((x) => x.id !== r && x.id !== "dashboard")].slice(0, 6)));
    } catch { /* noop */ }
  };

  /* Global navigation — object pages & cross-module actions dispatch "mer.nav" */
  useEffect(() => {
    const h = (e: Event) => nav((e as CustomEvent).detail as Route);
    window.addEventListener("mer.nav", h);
    return () => window.removeEventListener("mer.nav", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let page: React.ReactNode;
  switch (route) {
    case "dashboard": page = <Launchpad go={nav} />; break;
    case "workspace": page = <Workspace go={nav} />; break;
    case "headoffice": page = <HeadOffice go={nav} />; break;
    case "site": page = <SiteDash go={nav} />; break;
    case "projects": page = <ProjectsPage />; break;
    case "tenders": page = <TenderPage />; break;
    case "commercial": page = <CommercialPage />; break;
    case "billing": page = <BillingPage />; break;
    case "procurement": page = <ProcurementHub />; break;
    case "materials": page = <MaterialsPage />; break;
    case "stores": page = <MaterialsPage initialTab="stock" />; break;
    case "plant": page = <PlantOpsPage />; break;
    case "rmc": page = <RmcPage />; break;
    case "attendance": page = <AttendancePage />; break;
    case "hr": page = <HRPage />; break;
    case "finance": page = <FinancePage />; break;
    case "payroll": page = <PayrollPage />; break;
    case "approvals": page = <ApprovalCentre />; break;
    case "signature": page = <SignaturePage />; break;
    case "reports": page = <ReportsPage />; break;
    case "analytics": page = <AnalyticsPage />; break;
    case "documents": page = <DocumentsPage />; break;
    case "access": page = <AccessPage />; break;
    case "settings": page = <SettingsPage />; break;
    case "accounts": page = <AccountsPage />; break;
    case "boq": case "contracts": page = <CommercialPage />; break;
    case "vendors": page = <VendorsPage />; break;
    case "leave": page = <HRPage />; break;
    case "pf": page = <PFPage />; break;
    case "peopleops": page = <PeopleOpsPage />; break;
    case "quality": page = <QualityPage />; break;
    case "safety": page = <SafetyPage />; break;
    case "tasks": page = <Workspace go={nav} />; break;
    case "audit": page = <AuditPage />; break;
    case "users": page = <UsersPage />; break;
    case "chain": page = <ChainPage />; break;
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

      {/* Floating team-chat launcher */}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)} aria-label="Open team chat"
          className={cx("no-print fixed z-40 right-4 bottom-16 lg:bottom-5 h-13 w-13 h-[52px] w-[52px] rounded-full bg-brand-600 text-white grid place-items-center shadow-pop hover:bg-brand-700 active:scale-90 transition-all", chatUnread > 0 && "animate-pulse-soft")}>
          <IChat size={21} />
          {chatUnread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[19px] h-[19px] px-1 rounded-full bg-danger-500 text-white text-[10px] font-bold num grid place-items-center border-2 border-canvas">{chatUnread > 9 ? "9+" : chatUnread}</span>}
        </button>
      )}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />

      {/* Mobile quick actions — Home · Tasks · Approvals · Punch · More */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line grid grid-cols-5 no-print">
        {([
          ["dashboard", "Home"], ["workspace", "Tasks"], ["approvals", "Approvals"], ["attendance", "Punch"],
        ] as [Route, string][]).map(([id, label]) => {
          const allowed = visibleNav(role).flatMap((g) => g.items.map((i) => i.id));
          const show = allowed.includes(id);
          return (
            <button key={id} onClick={() => show && nav(id)}
              className={"py-2.5 flex flex-col items-center gap-0.5 text-[9.5px] font-semibold transition-colors " + (route === id ? "text-brand-700" : show ? "text-ink-400" : "text-ink-200")}>
              {id === "dashboard" ? <IGrid size={17} /> : id === "workspace" ? <ITasks size={17} /> : id === "approvals" ? <IStamp size={17} /> : <ICalCheck size={17} />}
              {label}
            </button>
          );
        })}
        <button onClick={() => setMobileNav(true)} className="relative py-2.5 flex flex-col items-center gap-0.5 text-[9.5px] font-semibold text-ink-400 transition-colors active:scale-95">
          <IMenu size={17} />
          More
          {erp.s.notifs.filter((n) => !n.read).length > 0 && <span className="absolute top-1.5 right-[22%] h-1.5 w-1.5 rounded-full bg-danger-500" />}
        </button>
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
