import React, { useEffect, useMemo, useRef, useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";
import ProjectTable from "./ProjectTable";
import ApprovalCenter, { Verdict } from "./ApprovalCenter";
import {
  KpiGrid, AlertsPanel, ActivityTimeline, UtilizationCard, PerformanceCard, PayablesSummary,
  ManpowerCard, VendorCard, StockCard, ProductionCard, ContractsCard, SiteIssuesCard,
} from "./widgets";
import { AgingDonut, BudgetActualChart, CashFlowChart, PlannedActualChart, RevenueExpenseChart } from "./charts";
import {
  ACTIVITIES, APPROVALS, DATE_RANGES, DEPARTMENTS, KPI_LIB, NAV, PROJECTS, ROLE_KPIS, ROLE_WIDGETS,
  ROLES, RoleId, fmtNum, projectById,
} from "./data";
import { Empty, IconBtn, Pop, Reveal, Select, Skel, ToastProvider, Widget, cx, useToast } from "./ui";
import {
  IDownload, IPrinter, ILayout, IRefresh, IFilter, ISave, IX, ICheck, IChevU, IChevD,
  IGrid, IHardhat, IStamp, IChart, IMenu, IInbox, IFiles, IColumns,
} from "./icons";

/* ── persisted helpers ───────────────────────────────────────── */
const ls = {
  get<T>(k: string, fb: T): T {
    try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fb; } catch { return fb; }
  },
  set(k: string, v: unknown) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* noop */ } },
};

interface SavedFilter { name: string; project: string; dept: string; range: string }
interface LayoutState { order: string[]; hidden: string[] }

export default function App() {
  return (
    <ToastProvider>
      <Shell />
    </ToastProvider>
  );
}

function Shell() {
  const toast = useToast();

  /* ── core state ── */
  const [role, setRole] = useState<RoleId>(() => ls.get<RoleId>("mer.role", "MD"));
  const [collapsed, setCollapsed] = useState(() => ls.get("mer.side", false));
  const [mobileNav, setMobileNav] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  /* ── filters ── */
  const [fy, setFy] = useState<string>(() => ls.get("mer.fy", "FY 2025–26"));
  const [project, setProject] = useState("All Projects");
  const [dept, setDept] = useState(DEPARTMENTS[0]);
  const [range, setRange] = useState(DATE_RANGES[3]);
  const [saved, setSaved] = useState<SavedFilter[]>(() => ls.get("mer.filters", []));
  const [saveOpen, setSaveOpen] = useState(false);
  const [fname, setFname] = useState("");

  /* ── approvals ── */
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({});

  /* ── layout / customization ── */
  const preset = ROLE_WIDGETS[role];
  const [layout, setLayout] = useState<LayoutState>(() => ls.get(`mer.layout.${role}`, { order: ROLE_WIDGETS[role], hidden: [] }));
  const [customOpen, setCustomOpen] = useState(false);

  useEffect(() => { ls.set("mer.role", role); }, [role]);
  useEffect(() => { ls.set("mer.side", collapsed); }, [collapsed]);
  useEffect(() => { ls.set("mer.filters", saved); }, [saved]);
  useEffect(() => { ls.set(`mer.layout.${role}`, layout); }, [layout, role]);

  const changeRole = (r: RoleId) => {
    setRole(r);
    const l = ls.get<LayoutState>(`mer.layout.${r}`, { order: ROLE_WIDGETS[r], hidden: [] });
    setLayout(l.order.length ? l : { order: ROLE_WIDGETS[r], hidden: [] });
  };

  /* ── loading simulation ── */
  useEffect(() => {
    const t = window.setTimeout(() => setLoading(false), 850);
    return () => window.clearTimeout(t);
  }, []);
  const refresh = () => {
    setLoading(true);
    window.setTimeout(() => { setLoading(false); toast("success", "Dashboard refreshed — data as of just now"); }, 750);
  };

  /* ⌘P print */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") { e.preventDefault(); window.print(); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  /* ── derived data ── */
  const selProject = PROJECTS.find((p) => p.name === project);
  const filteredProjects = useMemo(() => (selProject ? PROJECTS.filter((p) => p.id === selProject.id) : PROJECTS), [selProject]);
  const share = useMemo(() => {
    const total = PROJECTS.reduce((s, p) => s + p.contractValue, 0);
    return selProject ? selProject.contractValue / total : 1;
  }, [selProject]);

  const filteredApprovals = useMemo(
    () => APPROVALS.filter((a) => (!selProject || a.projectId === selProject.id) && (dept === DEPARTMENTS[0] || a.dept === dept)),
    [selProject, dept]
  );
  const filteredActivity = useMemo(
    () => ACTIVITIES.filter((a) => (!selProject || a.projectId === selProject.id) && (dept === DEPARTMENTS[0] || a.dept === dept)),
    [selProject, dept]
  );

  const pendingCount = filteredApprovals.filter((a) => !verdicts[a.id]).length;
  const kpis = ROLE_KPIS[role].map((id) => KPI_LIB[id]).filter(Boolean);

  /* ── widget registry ── */
  const widgets: Record<string, { title: string; subtitle: string; span: string; el: React.ReactNode; shell?: boolean }> = {
    kpis: { title: "", subtitle: "", span: "col-span-12", shell: false, el: <KpiGrid kpis={kpis} share={share} /> },
    projects: { title: "Project Performance", subtitle: `${filteredProjects.length} projects · contract ₹${fmtNum(filteredProjects.reduce((s, p) => s + p.contractValue, 0), 1)} Cr`, span: "col-span-12 xl:col-span-8", el: <ProjectTable projects={filteredProjects} /> },
    alerts: { title: "Alerts & Exceptions", subtitle: "Raised by exception monitor", span: "col-span-12 xl:col-span-4", el: <AlertsPanel /> },
    approvals: { title: "Pending Approvals", subtitle: `${pendingCount} awaiting your action`, span: "col-span-12", el: <ApprovalCenter items={filteredApprovals} verdicts={verdicts} onVerdict={(id, v) => setVerdicts((s) => ({ ...s, [id]: v }))} /> },
    revexp: { title: "Revenue vs Expense", subtitle: `₹ Cr monthly · ${range}`, span: "col-span-12 lg:col-span-6 xl:col-span-4", el: <RevenueExpenseChart range={range} /> },
    cashflow: { title: "Monthly Cash Flow", subtitle: `Inflow / outflow / net · ₹ Cr`, span: "col-span-12 lg:col-span-6 xl:col-span-4", el: <CashFlowChart range={range} /> },
    aging: { title: "Receivables Aging", subtitle: "Outstanding by bucket", span: "col-span-12 lg:col-span-12 xl:col-span-4", el: <div><AgingDonut /><PayablesSummary /></div> },
    planned: { title: "Planned vs Actual Progress", subtitle: "Portfolio weighted · %", span: "col-span-12 lg:col-span-6 xl:col-span-4", el: <PlannedActualChart /> },
    utilization: { title: "Cost & Resource Utilisation", subtitle: "Live against baseline", span: "col-span-12 lg:col-span-6 xl:col-span-4", el: <UtilizationCard projects={filteredProjects} /> },
    performance: { title: "Project Analytics", subtitle: "Margin leaders & slippage watch", span: "col-span-12 lg:col-span-6 xl:col-span-4", el: <PerformanceCard projects={filteredProjects} /> },
    budgetactual: { title: "Budget vs Actual by Head", subtitle: "Current month · ₹ Cr", span: "col-span-12 lg:col-span-6 xl:col-span-5", el: <BudgetActualChart /> },
    activity: { title: "Recent Activity", subtitle: "Transactions across modules", span: "col-span-12 lg:col-span-6 xl:col-span-7", el: filteredActivity.length ? <ActivityTimeline activities={filteredActivity} /> : <Empty title="No activity" note="No transactions match the current project and department filters." /> },
    manpower: { title: "Manpower & Attendance", subtitle: "Today · all sites", span: "col-span-12 lg:col-span-6 xl:col-span-4", el: <ManpowerCard /> },
    vendors: { title: "Vendor Performance", subtitle: "Open POs & delivery discipline", span: "col-span-12 xl:col-span-8", el: <VendorCard /> },
    stock: { title: "Material Stock Position", subtitle: "Across 3 stores · ₹27.4 Cr", span: "col-span-12 xl:col-span-8", el: <StockCard /> },
    production: { title: "RMC Production", subtitle: "Plant 1 — Kharadi · M25/M30", span: "col-span-12 lg:col-span-6 xl:col-span-5", el: <ProductionCard /> },
    contracts: { title: "Contracts & Variations", subtitle: "Certified vs billed · ₹ Cr", span: "col-span-12 xl:col-span-8", el: <ContractsCard /> },
    siteissues: { title: "Site Issues", subtitle: "Open execution issues", span: "col-span-12 lg:col-span-6 xl:col-span-4", el: <SiteIssuesCard /> },
  };

  const allIds = Object.keys(widgets);
  const visibleOrder = layout.order.filter((id) => allIds.includes(id) && !layout.hidden.includes(id));

  const move = (id: string, dir: -1 | 1) =>
    setLayout((l) => {
      const i = l.order.indexOf(id), j = i + dir;
      if (j < 0 || j >= l.order.length) return l;
      const o = [...l.order]; [o[i], o[j]] = [o[j], o[i]];
      return { ...l, order: o };
    });

  const exportExcel = () => {
    const head = ["Code", "Project", "Client", "Contract Value (Cr)", "Progress %", "Status"];
    const lines = filteredProjects.map((p) => [p.code, `"${p.name}"`, `"${p.client}"`, p.contractValue, p.progress, p.status].join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "meridian-dashboard.csv";
    a.click();
    toast("success", "Excel export downloaded");
  };

  const roleInfo = ROLES.find((r) => r.id === role)!;
  const activeNav = NAV.find((n) => n.id === active || n.children?.some((c) => c.id === active));
  const onDashboard = active === "dashboard";
  const filtersDirty = project !== "All Projects" || dept !== DEPARTMENTS[0] || range !== DATE_RANGES[3];

  const scrollToApprovals = () => {
    if (!onDashboard) setActive("dashboard");
    window.setTimeout(() => document.getElementById("w-approvals")?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  };

  return (
    <div className="min-h-dvh flex">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} active={active} onSelect={setActive} role={role} mobileOpen={mobileNav} onCloseMobile={() => setMobileNav(false)} />

      <div className="flex-1 min-w-0 flex flex-col print-full">
        <Header role={role} onRoleChange={changeRole} onMenu={() => (window.innerWidth >= 1024 ? setCollapsed((c) => !c) : setMobileNav(true))}
          approvalsCount={pendingCount} onOpenApprovals={scrollToApprovals} project={project} onProject={setProject} fy={fy} onFy={(v) => { setFy(v); ls.set("mer.fy", v); }} />

        <main className="flex-1 px-3 md:px-5 py-4 md:py-5 max-w-[1560px] w-full mx-auto">
          {/* Breadcrumb + title */}
          <nav className="flex items-center gap-1.5 text-[11px] text-ink-400 font-medium no-print">
            <span>Meridian ERP</span><span>/</span><span>{activeNav?.label ?? "Overview"}</span>
            {!onDashboard && <><span>/</span><span className="text-ink-700">{NAV.find((n) => n.children?.some((c) => c.id === active))?.children?.find((c) => c.id === active)?.label ?? "Workspace"}</span></>}
          </nav>
          <div className="flex flex-wrap items-end justify-between gap-3 mt-1 mb-4">
            <div>
              <h1 className="font-display text-[21px] md:text-[24px] font-bold tracking-tight text-ink-900 leading-tight">
                {onDashboard ? `${roleInfo.label} Dashboard` : activeNav?.label ?? "Module"}
              </h1>
              <p className="text-[12px] text-ink-400 mt-0.5">
                {onDashboard
                  ? <>Live overview · <span className="text-ink-500 font-medium">{roleInfo.person}</span> · {dept}{selProject ? ` · ${selProject.code}` : " · All projects"} · {range}</>
                  : "Module workspace"}
              </p>
            </div>
            <div className="flex items-center gap-1.5 no-print">
              <IconBtn label="Refresh data" onClick={refresh}><IRefresh size={14} /></IconBtn>
              <IconBtn label="Export PDF" onClick={() => toast("info", "PDF export queued — check your downloads shortly")}><IFiles size={14} /></IconBtn>
              <IconBtn label="Export Excel" onClick={exportExcel}><IDownload size={14} /></IconBtn>
              <IconBtn label="Print (⌘P)" onClick={() => window.print()}><IPrinter size={14} /></IconBtn>
              <button onClick={() => setCustomOpen(true)}
                className="ml-1 h-8 px-3 rounded-lg bg-brand-600 text-white text-[12px] font-semibold inline-flex items-center gap-1.5 hover:bg-brand-700 active:scale-[0.97] transition-all shadow-card">
                <ILayout size={14} /> Customize
              </button>
            </div>
          </div>

          {/* Filter bar */}
          {onDashboard && (
            <div className="no-print bg-surface border border-line rounded-[10px] shadow-card px-3 py-2.5 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400"><IFilter size={13} /> Filters</span>
              <Select label="Project" value={project} onChange={setProject} options={["All Projects", ...PROJECTS.map((p) => p.name)]} w="220px" />
              <Select label="Dept" value={dept} onChange={setDept} options={DEPARTMENTS} w="190px" />
              <Select label="Period" value={range} onChange={setRange} options={DATE_RANGES} w="180px" />
              {saved.map((f) => (
                <span key={f.name} className="group inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[11px] font-semibold cursor-pointer hover:bg-brand-100 transition-colors"
                  onClick={() => { setProject(f.project); setDept(f.dept); setRange(f.range); toast("info", `Applied saved filter “${f.name}”`); }}>
                  {f.name}
                  <button onClick={(e) => { e.stopPropagation(); setSaved((s) => s.filter((x) => x.name !== f.name)); toast("error", `Deleted saved filter “${f.name}”`); }}
                    className="h-4.5 w-4.5 h-5 w-5 grid place-items-center rounded-full hover:bg-brand-200 transition-colors" aria-label="Delete filter">
                    <IX size={10} />
                  </button>
                </span>
              ))}
              <div className="relative ml-auto">
                <button onClick={() => setSaveOpen(!saveOpen)} disabled={!filtersDirty}
                  className="h-7 px-2.5 rounded-md border border-line text-[11.5px] font-semibold text-ink-500 inline-flex items-center gap-1.5 hover:border-line-strong hover:bg-canvas disabled:opacity-40 active:scale-95 transition-all">
                  <ISave size={12} /> Save filter
                </button>
                <Pop open={saveOpen} onClose={() => setSaveOpen(false)} className="w-[250px] p-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400 mb-1.5">Save current filter set</p>
                  <input value={fname} onChange={(e) => setFname(e.target.value)} placeholder="e.g. Metro — this quarter" autoFocus
                    className="w-full h-8 px-2.5 rounded-md border border-line text-[12px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" />
                  <button
                    onClick={() => {
                      const name = fname.trim();
                      if (!name) { toast("error", "Give the filter a name first"); return; }
                      setSaved((s) => [...s.filter((x) => x.name !== name), { name, project, dept, range }]);
                      setFname(""); setSaveOpen(false);
                      toast("success", `Saved filter “${name}”`);
                    }}
                    className="mt-2 w-full h-8 rounded-md bg-brand-600 text-white text-[12px] font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5">
                    <ICheck size={13} /> Save
                  </button>
                </Pop>
              </div>
              {filtersDirty && (
                <button onClick={() => { setProject("All Projects"); setDept(DEPARTMENTS[0]); setRange(DATE_RANGES[3]); }}
                  className="h-7 px-2.5 rounded-md text-[11.5px] font-semibold text-ink-400 hover:text-danger-600 hover:bg-danger-100/60 active:scale-95 transition-all">
                  Clear all
                </button>
              )}
            </div>
          )}

          {/* Body */}
          {loading ? (
            <DashboardSkeleton />
          ) : !onDashboard ? (
            <ModulePlaceholder name={activeNav?.label ?? active} onBack={() => setActive("dashboard")} />
          ) : (
            <div className="grid grid-cols-12 gap-3.5 md:gap-4">
              {visibleOrder.map((id, i) => {
                const w = widgets[id];
                return (
                  <Reveal key={id} className={w.span} delay={Math.min(i, 6) * 45}>
                    <div id={`w-${id}`}>
                      {w.shell === false ? w.el : (
                        <Widget title={w.title} subtitle={w.subtitle}
                          actions={id === "approvals" ? (
                            <span className="text-[11px] font-semibold text-ink-400 num">{pendingCount} pending</span>
                          ) : id === "projects" ? undefined : (
                            <IconBtn label="More options" onClick={() => toast("info", `${w.title}: options menu (demo)`)}><IChevD size={13} /></IconBtn>
                          )}>
                          {w.el}
                        </Widget>
                      )}
                    </div>
                  </Reveal>
                );
              })}
              {visibleOrder.length === 0 && (
                <div className="col-span-12">
                  <Widget title="Dashboard" subtitle="All widgets hidden">
                    <Empty title="Nothing to show" note="Every widget is hidden. Open Customize to bring widgets back." icon={<ILayout size={18} />} />
                  </Widget>
                </div>
              )}
            </div>
          )}

          <footer className="mt-6 pb-20 lg:pb-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-300 num">
            <span>Meridian ERP v4.2.1 · Sahaa Infra Ltd.</span>
            <span>Last sync {new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} IST · All figures unaudited</span>
          </footer>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-surface border-t border-line grid grid-cols-5 no-print">
        {[
          { id: "dashboard", label: "Home", icon: <IGrid size={18} /> },
          { id: "projects", label: "Projects", icon: <IHardhat size={18} /> },
          { id: "approvals", label: `Approvals${pendingCount ? ` · ${pendingCount}` : ""}`, icon: <IStamp size={18} /> },
          { id: "reports", label: "Reports", icon: <IChart size={18} /> },
        ].map((t) => (
          <button key={t.id} onClick={() => { setActive(t.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
            className={cx("py-2 flex flex-col items-center gap-0.5 text-[9.5px] font-semibold transition-colors", active === t.id ? "text-brand-700" : "text-ink-400")}>
            {t.icon}{t.label}
          </button>
        ))}
        <button onClick={() => setMobileNav(true)} className="py-2 flex flex-col items-center gap-0.5 text-[9.5px] font-semibold text-ink-400">
          <IMenu size={18} /> Menu
        </button>
      </nav>

      {/* Customize drawer */}
      {customOpen && (
        <div className="fixed inset-0 z-[70] no-print">
          <div className="absolute inset-0 bg-side-900/50 backdrop-blur-[2px]" onClick={() => setCustomOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-[320px] max-w-[92vw] bg-surface shadow-pop border-l border-line flex flex-col animate-[drawer_.25s_cubic-bezier(.22,1,.36,1)]">
            <style>{`@keyframes drawer{from{transform:translateX(40px);opacity:0}to{transform:none;opacity:1}}@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
            <header className="flex items-center justify-between px-4 h-14 border-b border-line shrink-0">
              <div>
                <p className="font-display text-[14px] font-bold text-ink-900">Customize dashboard</p>
                <p className="text-[11px] text-ink-400">Personal layout · saved automatically</p>
              </div>
              <IconBtn label="Close" onClick={() => setCustomOpen(false)}><IX size={14} /></IconBtn>
            </header>
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {layout.order.filter((id) => allIds.includes(id)).map((id) => {
                const w = widgets[id];
                const hidden = layout.hidden.includes(id);
                const idx = layout.order.indexOf(id);
                return (
                  <div key={id} className={cx("flex items-center gap-2.5 rounded-lg border p-2.5 transition-all", hidden ? "border-line bg-canvas/50 opacity-60" : "border-line bg-surface hover:border-line-strong")}>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input type="checkbox" className="peer sr-only" checked={!hidden}
                        onChange={() => setLayout((l) => ({ ...l, hidden: hidden ? l.hidden.filter((x) => x !== id) : [...l.hidden, id] }))} />
                      <span className="w-8 h-[18px] rounded-full bg-[#c6d3de] peer-checked:bg-brand-600 transition-colors relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-[14px] after:w-[14px] after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-[14px]" />
                    </label>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12.5px] font-semibold text-ink-900 truncate">{w.shell === false ? "KPI Cards" : w.title}</p>
                      <p className="text-[10.5px] text-ink-400 truncate">{w.subtitle || "Key metrics row"}</p>
                    </div>
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button onClick={() => move(id, -1)} disabled={idx === 0} className="h-5 w-6 grid place-items-center rounded border border-line text-ink-400 hover:bg-canvas disabled:opacity-30 transition-all" aria-label="Move up"><IChevU size={11} /></button>
                      <button onClick={() => move(id, 1)} disabled={idx === layout.order.length - 1} className="h-5 w-6 grid place-items-center rounded border border-line text-ink-400 hover:bg-canvas disabled:opacity-30 transition-all" aria-label="Move down"><IChevD size={11} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
            <footer className="p-3 border-t border-line flex gap-2 shrink-0">
              <button onClick={() => { setLayout({ order: ROLE_WIDGETS[role], hidden: [] }); toast("success", `Layout reset to ${roleInfo.label} default`); }}
                className="flex-1 h-9 rounded-lg border border-line text-[12px] font-semibold text-ink-500 hover:bg-canvas active:scale-[0.98] transition-all">
                Reset to role default
              </button>
              <button onClick={() => { setCustomOpen(false); toast("success", "Dashboard preferences saved"); }}
                className="flex-1 h-9 rounded-lg bg-brand-600 text-white text-[12px] font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-1.5">
                <ICheck size={13} /> Done
              </button>
            </footer>
          </aside>
        </div>
      )}
    </div>
  );
}

/* ── Skeleton ────────────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4" aria-busy="true" aria-label="Loading dashboard">
      <style>{`@keyframes shimmer{from{background-position:200% 0}to{background-position:-200% 0}}`}</style>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="col-span-6 md:col-span-3 bg-surface border border-line rounded-[10px] p-4">
          <Skel className="h-3 w-20" /><Skel className="h-6 w-24 mt-3" /><Skel className="h-3 w-16 mt-3" />
        </div>
      ))}
      <div className="col-span-12 xl:col-span-8 bg-surface border border-line rounded-[10px] p-4">
        <Skel className="h-4 w-40" />
        {Array.from({ length: 6 }, (_, i) => <Skel key={i} className="h-9 w-full mt-3" />)}
      </div>
      <div className="col-span-12 xl:col-span-4 bg-surface border border-line rounded-[10px] p-4">
        <Skel className="h-4 w-32" />
        {Array.from({ length: 5 }, (_, i) => <Skel key={i} className="h-12 w-full mt-3" />)}
      </div>
      <div className="col-span-12 lg:col-span-6 xl:col-span-4 bg-surface border border-line rounded-[10px] p-4"><Skel className="h-4 w-36" /><Skel className="h-44 w-full mt-3" /></div>
      <div className="col-span-12 lg:col-span-6 xl:col-span-4 bg-surface border border-line rounded-[10px] p-4"><Skel className="h-4 w-36" /><Skel className="h-44 w-full mt-3" /></div>
      <div className="col-span-12 xl:col-span-4 bg-surface border border-line rounded-[10px] p-4"><Skel className="h-4 w-36" /><Skel className="h-44 w-full mt-3" /></div>
    </div>
  );
}

/* ── Module placeholder ──────────────────────────────────────── */
function ModulePlaceholder({ name, onBack }: { name: string; onBack: () => void }) {
  return (
    <Reveal>
      <div className="bg-surface border border-line rounded-[10px] shadow-card p-6">
        <div className="max-w-md">
          <span className="inline-flex items-center gap-2 h-6 px-2.5 rounded-full bg-steel-100 text-steel-600 text-[10.5px] font-bold uppercase tracking-wide">
            <IInbox size={12} /> Module workspace
          </span>
          <h2 className="font-display text-[20px] font-bold text-ink-900 mt-3">{name}</h2>
          <p className="text-[13px] text-ink-500 leading-relaxed mt-2">
            The {name} workspace opens here in the full suite — transactional screens, entry forms and registers
            connect to the same live data powering this dashboard. Role-based access is already applied to the menu.
          </p>
          <div className="flex gap-2 mt-5">
            <button onClick={onBack} className="h-9 px-4 rounded-lg bg-brand-600 text-white text-[12.5px] font-semibold hover:bg-brand-700 active:scale-[0.98] transition-all">
              Back to Dashboard
            </button>
            <button onClick={onBack} className="h-9 px-4 rounded-lg border border-line text-[12.5px] font-semibold text-ink-500 hover:bg-canvas active:scale-[0.98] transition-all inline-flex items-center gap-1.5">
              <IColumns size={13} /> View registers
            </button>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
