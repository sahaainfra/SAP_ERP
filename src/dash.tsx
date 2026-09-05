import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { KPI_LIB, ROLE_KPIS, ROLE_WIDGETS, ROLES, RoleId, DEPARTMENTS, DATE_RANGES, fmtNum } from "./data";
import { useERP } from "./store";
import { Widget, Empty, Reveal, Select, Bar, Pill, cx } from "./ui";
import { KpiGrid, ProjectTable, AlertsPanel, ActivityTimeline, UtilizationCard, PerformanceCard, ManpowerCard, VendorCard, StockCard, ProductionCard, ContractsCard, SiteIssuesCard, PayablesSummary } from "./widgets";
import { RevenueExpenseChart, CashFlowChart, AgingDonut, PlannedActualChart, BudgetActualChart } from "./charts";
import { PageHead, Stat, TrafficLight, Btn, Drawer } from "./modules/core";
import type { Route } from "./shell";
import { IColumns } from "./icons";

/* ── shared widget registry ────────────────────────────────── */
function useWidgets(onDrill: (id: string) => void, go: (r: Route) => void) {
  const range = DATE_RANGES[3];
  return useMemo<Record<string, { title: string; subtitle: string; span: string; el: ReactNode; shell?: boolean }>>(() => ({
    kpis: { title: "", subtitle: "", span: "col-span-12", shell: false, el: <KpiGrid kpis={[]} onDrill={onDrill} /> },
    projects: { title: "Project Performance", subtitle: "Live register across all packages", span: "col-span-12 xl:col-span-8", el: <ProjectTable onOpen={() => go("projects")} /> },
    alerts: { title: "Alerts & Exceptions", subtitle: "Raised by the exception monitor", span: "col-span-12 xl:col-span-4", el: <AlertsPanel /> },
    approvals: { title: "Pending Approvals", subtitle: "Awaiting your decision", span: "col-span-12 xl:col-span-6", el: <MiniApprovals go={go} /> },
    revexp: { title: "Revenue vs Expense", subtitle: `₹ Cr monthly · ${range}`, span: "col-span-12 lg:col-span-6 xl:col-span-4", el: <RevenueExpenseChart range={range} /> },
    cashflow: { title: "Monthly Cash Flow", subtitle: "Inflow / outflow / net · ₹ Cr", span: "col-span-12 lg:col-span-6 xl:col-span-4", el: <CashFlowChart range={range} /> },
    aging: { title: "Receivables Aging", subtitle: "Outstanding by bucket", span: "col-span-12 lg:col-span-6 xl:col-span-4", el: <div><AgingDonut /><PayablesSummary /></div> },
    planned: { title: "Planned vs Actual Progress", subtitle: "Portfolio weighted · %", span: "col-span-12 lg:col-span-6 xl:col-span-4", el: <PlannedActualChart /> },
    utilization: { title: "Cost & Resource Utilisation", subtitle: "Live against baseline", span: "col-span-12 lg:col-span-6 xl:col-span-4", el: <UtilizationCard /> },
    performance: { title: "Project Analytics", subtitle: "Margin leaders & slippage watch", span: "col-span-12 lg:col-span-6 xl:col-span-4", el: <PerformanceCard /> },
    budgetactual: { title: "Budget vs Actual by Head", subtitle: "Current month · ₹ Cr", span: "col-span-12 lg:col-span-6 xl:col-span-5", el: <BudgetActualChart /> },
    activity: { title: "Recent Activity", subtitle: "Transactions across modules", span: "col-span-12 lg:col-span-6 xl:col-span-7", el: <ActivityTimeline limit={7} /> },
    manpower: { title: "Manpower & Attendance", subtitle: "Today · all sites", span: "col-span-12 lg:col-span-6 xl:col-span-5", el: <ManpowerCard /> },
    vendors: { title: "Vendor Performance", subtitle: "Open POs & delivery discipline", span: "col-span-12 xl:col-span-7", el: <VendorCard /> },
    stock: { title: "Material Stock Position", subtitle: "Across stores", span: "col-span-12 xl:col-span-7", el: <StockCard /> },
    production: { title: "RMC Production", subtitle: "Plant 1 — Kharadi", span: "col-span-12 lg:col-span-6 xl:col-span-5", el: <ProductionCard /> },
    contracts: { title: "Contracts & Variations", subtitle: "Certified vs billed · ₹ Cr", span: "col-span-12 xl:col-span-7", el: <ContractsCard /> },
    siteissues: { title: "Site Issues", subtitle: "Open execution issues", span: "col-span-12 lg:col-span-6 xl:col-span-4", el: <SiteIssuesCard /> },
  }), [onDrill, go, range]);
}

function MiniApprovals({ go }: { go: (r: Route) => void }) {
  const { s } = useERP();
  const items = [
    ...s.prs.filter((p) => p.status === "Submitted" || p.status === "Under Approval").map((p) => ({ id: p.id, ref: p.no, type: "Purchase Requisition", amt: p.lines.reduce((a, l) => a + l.qty * l.rate, 0) / 1e5, project: p.project })),
    ...s.pos.filter((p) => p.status === "Pending Approval").map((p) => ({ id: p.id, ref: p.no, type: "Purchase Order", amt: p.lines.reduce((a, l) => a + l.qty * l.rate, 0) / 1e5, project: p.project })),
    ...s.payments.filter((p) => p.status === "Pending").map((p) => ({ id: p.id, ref: p.no, type: "Vendor Payment", amt: p.amount, project: "—" })),
  ].slice(0, 5);
  if (!items.length) return <Empty title="Queue is clear" note="No approvals are waiting on you." />;
  return (
    <div>
      <ul className="space-y-2">
        {items.map((i) => (
          <li key={i.id} className="flex items-center gap-3 rounded-lg border border-line bg-canvas/40 px-3 py-2.5 hover:border-line-strong hover:bg-surface transition-all">
            <span className="h-8 w-8 rounded-lg grid place-items-center bg-brand-50 text-brand-700 border border-brand-100 shrink-0 text-[9px] font-bold">{i.type.split(" ").map((w) => w[0]).join("")}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-ink-900 truncate">{i.ref}</p>
              <p className="text-[10.5px] text-ink-400 num">{i.type} · {i.project}</p>
            </div>
            <span className="num text-[12px] font-bold text-ink-700 shrink-0">₹{i.amt.toFixed(1)} L</span>
          </li>
        ))}
      </ul>
      <button onClick={() => go("approvals")} className="mt-3 w-full h-8 rounded-md border border-line text-[12px] font-semibold text-brand-700 hover:bg-brand-50 hover:border-brand-200 active:scale-[0.98] transition-all">Open Approval Centre</button>
    </div>
  );
}

/* ── Role Dashboard ────────────────────────────────────────── */
export function RoleDashboard({ go }: { go: (r: Route) => void }) {
  const { role, s, userRec } = useERP();
  const me = ROLES.find((r) => r.id === role)!;
  const [dept, setDept] = useState(DEPARTMENTS[0]);
  const [range, setRange] = useState(DATE_RANGES[3]);
  const kpis = ROLE_KPIS[role].map((id) => KPI_LIB[id]).filter(Boolean);

  const drill = (id: string) => {
    if (["pendingApprovals", "pendingPR", "pendingPO", "pendingMR", "pendingRA"].includes(id)) go("approvals");
    else if (["lowStockItems", "stockValue"].includes(id)) go("site");
    else if (["receivables", "payables", "cashFlow", "monthlyRevenue", "costUtil"].includes(id)) go("headoffice");
    else go("headoffice");
  };

  const widgets = useWidgets(drill, go);
  const hiddenKey = "meridian.dash.hidden." + role;
  const [hidden, setHidden] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem(hiddenKey) || "[]"); } catch { return []; } });
  const [custom, setCustom] = useState(false);
  const persistHidden = (h: string[]) => { setHidden(h); try { localStorage.setItem(hiddenKey, JSON.stringify(h)); } catch { /* noop */ } };
  const order = ROLE_WIDGETS[role].filter((id) => (widgets[id] || id === "kpis") && !hidden.includes(id));
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="fade-up">
      <div className="relative overflow-hidden rounded-[14px] border border-line bg-surface shadow-card mb-4">
        <div className="pointer-events-none absolute inset-0 opacity-[0.5]" style={{ background: "radial-gradient(700px 200px at 12% 0%, var(--color-brand-50), transparent 60%)" }} />
        <div className="relative flex flex-wrap items-center gap-4 px-4 md:px-5 py-4">
          <span className="h-12 w-12 rounded-[12px] bg-side-800 text-brand-200 grid place-items-center font-display font-bold text-[17px] shadow-card">
            {me.person.split(" ").map((w) => w[0]).join("")}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[19px] md:text-[21px] font-bold tracking-tight text-ink-900 leading-tight">
              {greet}, {me.person.split(" ")[0]}
            </h1>
            <p className="text-[12px] text-ink-400 mt-0.5">
              <span className="text-ink-600 font-semibold">{me.label}</span> · {userRec.dept} · {userRec.office} — {userRec.site}
              <span className="num"> · {s.settings.fy}</span>
            </p>
          </div>
          <div className="flex items-center gap-2 no-print">
            <Select label="" value={dept} onChange={setDept} options={DEPARTMENTS} w="170px" />
            <Select label="" value={range} onChange={setRange} options={DATE_RANGES} w="160px" />
            <button onClick={() => setCustom(true)} className="h-9 px-3 rounded-lg border border-line text-[12px] font-semibold text-ink-500 inline-flex items-center gap-1.5 hover:border-line-strong hover:bg-canvas active:scale-[0.97] transition-all">
              <IColumns size={14} /> Customize
            </button>
          </div>
        </div>
        <div className="relative grid grid-cols-2 sm:grid-cols-4 border-t border-line divide-x divide-line">
          <RoleStat label="Pending approvals" value={String(s.prs.filter((p) => p.status === "Submitted" || p.status === "Under Approval").length + s.pos.filter((p) => p.status === "Pending Approval").length + s.payments.filter((p) => p.status === "Pending").length + s.leaves.filter((l) => l.status === "Pending").length)} onClick={() => go("approvals")} />
          <RoleStat label="Open tasks" value={String(s.tasks.filter((t) => t.forRole === role && t.status !== "Done").length)} onClick={() => go("workspace")} />
          <RoleStat label="Open queries" value={String(s.queries.filter((q) => q.status === "Open").length)} onClick={() => go("workspace")} />
          <RoleStat label="My signature" value={hasSig(me.person) ? "Active" : "Not set"} onClick={() => go("signature")} accent={!hasSig(me.person)} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-3.5 md:gap-4">
        {order.map((id, i) => {
          const w = widgets[id];
          if (id === "kpis") return <Reveal key={id} className="col-span-12" delay={0}><KpiGrid kpis={kpis} onDrill={drill} /></Reveal>;
          if (!w) return null;
          return (
            <Reveal key={id} className={w.span} delay={Math.min(i, 6) * 40}>
              <Widget title={w.title} subtitle={w.subtitle}>{w.el}</Widget>
            </Reveal>
          );
        })}
      </div>

      <Drawer open={custom} onClose={() => setCustom(false)} title="Customize dashboard" sub="Personal view — saved for your role on this device">
        <div className="space-y-1.5">
          {ROLE_WIDGETS[role].filter((id) => id !== "kpis" && widgets[id]).map((id) => {
            const off = hidden.includes(id);
            return (
              <label key={id} className={cx("flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-all", off ? "border-line bg-canvas/50 opacity-60" : "border-line bg-surface hover:border-line-strong")}>
                <input type="checkbox" checked={!off} className="h-4 w-4 accent-[#0c7264]"
                  onChange={() => persistHidden(off ? hidden.filter((x) => x !== id) : [...hidden, id])} />
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ink-900">{widgets[id].title}</p>
                  <p className="text-[10.5px] text-ink-400 truncate">{widgets[id].subtitle}</p>
                </div>
              </label>
            );
          })}
        </div>
        <div className="flex gap-2 mt-4">
          <Btn onClick={() => { persistHidden([]); }} className="flex-1">Show all</Btn>
          <Btn kind="primary" onClick={() => setCustom(false)} className="flex-1">Done</Btn>
        </div>
      </Drawer>
    </div>
  );
}

function RoleStat({ label, value, onClick, accent }: { label: string; value: string; onClick: () => void; accent?: boolean }) {
  return (
    <button onClick={onClick} className="group px-4 py-3 text-left hover:bg-canvas/70 transition-colors">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400">{label}</p>
      <p className={cx("num text-[17px] font-semibold mt-0.5 transition-colors", accent ? "text-warn-700" : "text-ink-900 group-hover:text-brand-700")}>{value}</p>
    </button>
  );
}

function hasSig(name: string) {
  try { const raw = localStorage.getItem("meridian.sigs"); if (!raw) return false; const m = JSON.parse(raw); return !!m[name]?.dataUrl; } catch { return false; }
}

/* ── Head Office Dashboard ─────────────────────────────────── */
export function HeadOffice({ go }: { go: (r: Route) => void }) {
  const { s } = useERP();
  const active = s.projects.filter((p) => p.status !== "Completed");
  const receivable = s.arInvoices.reduce((a, x) => a + (x.amount - x.received), 0);
  const overdue = s.arInvoices.filter((a) => a.status === "Overdue").reduce((a, x) => a + x.amount, 0);
  const payable = s.apInvoices.filter((a) => a.status !== "Paid").reduce((a, x) => a + x.amount, 0);
  const cash = s.banks.reduce((a, b) => a + b.balance, 0);
  const light = (st: string) => (st === "On Track" || st === "Completed" ? "green" : st === "Attention Required" ? "amber" : "red") as "green" | "amber" | "red";

  return (
    <div className="fade-up">
      <PageHead title="Head Office Control Tower" crumbs={["Meridian", "Head Office"]}
        desc="Consolidated, org-wide view — every project, rupee and approval across SAHAA INFRA.">
        <Stat label="Contract value" value={`₹${fmtNum(s.projects.reduce((a, p) => a + p.contractValue, 0), 0)} Cr`} />
        <Stat label="Receivables" value={`₹${receivable.toFixed(1)} Cr`} tone={overdue > 5 ? "warn" : undefined} sub={`₹${overdue.toFixed(1)} Cr overdue`} />
        <Stat label="Payables" value={`₹${payable.toFixed(1)} Cr`} />
        <Stat label="Cash & bank" value={`₹${cash.toFixed(1)} Cr`} tone={cash < 0 ? "danger" : "ok"} />
      </PageHead>

      <Widget title="Project Control Register" subtitle="Traffic-light status · click a row to open the project">
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-left min-w-[860px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-[0.08em] text-ink-400">
                <th className="font-bold pb-2 pr-3">Status</th><th className="font-bold pb-2 pr-3">Project / Client</th>
                <th className="font-bold pb-2 pr-3 text-right">Contract (Cr)</th><th className="font-bold pb-2 pr-3 text-right">Certified</th>
                <th className="font-bold pb-2 pr-3 text-right">Received</th><th className="font-bold pb-2 pr-3 text-right">Outstanding</th>
                <th className="font-bold pb-2 pr-3 w-[130px]">Physical %</th><th className="font-bold pb-2 pr-3 text-right">Budget util</th>
                <th className="font-bold pb-2">Billing</th>
              </tr>
            </thead>
            <tbody>
              {s.projects.map((p) => (
                <tr key={p.id} onClick={() => go("projects")} className="border-t border-line/80 hover:bg-brand-50/40 cursor-pointer transition-colors">
                  <td className="py-2.5 pr-3"><TrafficLight status={light(p.status)} /></td>
                  <td className="py-2.5 pr-3"><p className="text-[12.5px] font-semibold text-ink-900">{p.name}</p><p className="text-[10.5px] text-ink-400">{p.client} · {p.pm}</p></td>
                  <td className="py-2.5 pr-3 text-right num text-[12.5px] font-semibold">{fmtNum(p.contractValue, 0)}</td>
                  <td className="py-2.5 pr-3 text-right num text-[12px]">{fmtNum(p.certified, 1)}</td>
                  <td className="py-2.5 pr-3 text-right num text-[12px] text-ok-600">{fmtNum(p.received, 1)}</td>
                  <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold text-warn-700">{fmtNum(p.certified - p.received, 1)}</td>
                  <td className="py-2.5 pr-3"><div className="flex items-center gap-2"><div className="flex-1"><Bar value={p.progress} /></div><span className="num text-[11px] font-semibold w-8 text-right">{p.progress}%</span></div></td>
                  <td className={cx("py-2.5 pr-3 text-right num text-[12px] font-semibold", p.budgetUtil > 85 ? "text-danger-600" : "text-ink-700")}>{p.budgetUtil}%</td>
                  <td className="py-2.5"><Pill value={p.billing} pulse={p.billing === "Overdue"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Widget>

      <div className="grid grid-cols-12 gap-3.5 md:gap-4 mt-4">
        <Reveal className="col-span-12 lg:col-span-6"><Widget title="Revenue vs Expense" subtitle="₹ Cr monthly"><RevenueExpenseChart range={DATE_RANGES[3]} /></Widget></Reveal>
        <Reveal className="col-span-12 lg:col-span-6"><Widget title="Cash Flow" subtitle="Inflow / outflow / net · ₹ Cr"><CashFlowChart range={DATE_RANGES[3]} /></Widget></Reveal>
        <Reveal className="col-span-12 lg:col-span-5"><Widget title="Receivables Aging" subtitle="Outstanding by bucket"><AgingDonut /></Widget></Reveal>
        <Reveal className="col-span-12 lg:col-span-7"><Widget title="Bank Positions" subtitle="Reconciled balances"><BankList /></Widget></Reveal>
      </div>
    </div>
  );
}

function BankList() {
  const { s } = useERP();
  return (
    <div className="space-y-2">
      {s.banks.map((b) => (
        <div key={b.id} className="flex items-center gap-3 border border-line rounded-lg px-3.5 py-2.5 hover:border-line-strong transition-all">
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-semibold text-ink-900">{b.bank} <span className="num text-ink-400 text-[10.5px] font-normal">{b.no}</span></p>
            <p className="text-[10.5px] text-ink-400">{b.type} · reconciled {b.reconciled}</p>
          </div>
          <span className={cx("num text-[14px] font-semibold", b.balance < 0 ? "text-danger-600" : "text-ink-900")}>₹{b.balance.toFixed(1)} Cr</span>
        </div>
      ))}
    </div>
  );
}

/* ── Site Dashboard ────────────────────────────────────────── */
export function SiteDash({ go }: { go: (r: Route) => void }) {
  const { s, userRec, role } = useERP();
  const mine = role === "PM" || role === "SITE_ENG" || role === "STORE" || role === "EMPLOYEE"
    ? s.projects.filter((p) => p.pm === ROLES.find((r) => r.id === role)?.person || p.code === userRec.project)
    : [];
  const [code, setCode] = useState(mine[0]?.code ?? s.projects[0].code);
  const p = s.projects.find((x) => x.code === code) ?? s.projects[0];
  const plant = s.equipment.filter((e) => e.project === p.id || e.project === p.code);
  const low = s.stock.filter((st) => { const m = s.materials.find((mm) => mm.name === st.material); return m ? st.onHand < m.rol : false; });

  return (
    <div className="fade-up">
      <PageHead title="Site Daily Dashboard" crumbs={["Meridian", "Site Office", p.code]}
        desc="Operational pulse for a single site — manpower, plant, materials, quality and safety.">
        <Select label="" value={code} onChange={setCode} options={s.projects.filter((x) => x.status !== "Completed").map((x) => x.code)} w="150px" />
        <Btn onClick={() => go("projects")}>Open project</Btn>
      </PageHead>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 mb-4">
        <Stat label="Physical progress" value={`${p.progress}%`} sub={`plan ${p.planned}%`} tone={p.progress >= p.planned ? "ok" : "warn"} />
        <Stat label="Manpower" value={fmtNum(p.manpower, 0)} />
        <Stat label="Attendance" value={`${s.attendance.length ? Math.round((s.attendance.filter((a) => a.status === "Present").length / s.attendance.length) * 100) : 0}%`} />
        <Stat label="Equipment" value={String(plant.length || s.equipment.length)} sub="deployed" />
        <Stat label="Low stock" value={String(low.length)} tone={low.length ? "warn" : "ok"} />
        <Stat label="Open issues" value="4" tone="warn" />
      </div>

      <div className="grid grid-cols-12 gap-3.5 md:gap-4">
        <Reveal className="col-span-12 lg:col-span-5"><Widget title="Manpower & Attendance" subtitle="Today · marked vs deployed"><ManpowerCard /></Widget></Reveal>
        <Reveal className="col-span-12 lg:col-span-7"><Widget title="Plant & Equipment" subtitle="Availability and utilisation"><EquipmentBoard /></Widget></Reveal>
        <Reveal className="col-span-12 lg:col-span-7"><Widget title="Material Stock" subtitle="On hand vs reorder level"><StockCard /></Widget></Reveal>
        <Reveal className="col-span-12 lg:col-span-5"><Widget title="Quality & Safety" subtitle="Inspections, incidents, toolbox talks"><QualitySafety /></Widget></Reveal>
        <Reveal className="col-span-12"><Widget title="Site Issues" subtitle="Open execution issues on this site"><SiteIssuesCard /></Widget></Reveal>
      </div>
    </div>
  );
}

function EquipmentBoard() {
  const { s } = useERP();
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-left min-w-[560px]">
        <thead><tr className="text-[10.5px] uppercase tracking-[0.08em] text-ink-400">
          <th className="font-bold pb-2 pr-3">Equipment</th><th className="font-bold pb-2 pr-3">Regn</th><th className="font-bold pb-2 pr-3 text-right">Hour meter</th>
          <th className="font-bold pb-2 pr-3 text-right">Fuel (L/d)</th><th className="font-bold pb-2 pr-3">Maint. due</th><th className="font-bold pb-2">Status</th>
        </tr></thead>
        <tbody>
          {s.equipment.map((e) => (
            <tr key={e.code} className="border-t border-line/80 hover:bg-brand-50/40 transition-colors">
              <td className="py-2.5 pr-3"><p className="text-[12.5px] font-semibold text-ink-900">{e.name}</p><p className="text-[10.5px] text-ink-400 num">{e.code} · {e.cap}</p></td>
              <td className="py-2.5 pr-3 num text-[11.5px] text-ink-500">{e.reg}</td>
              <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold">{fmtNum(e.hrs, 0)} h</td>
              <td className="py-2.5 pr-3 text-right num text-[12px]">{e.fuel}</td>
              <td className="py-2.5 pr-3 num text-[11.5px] text-ink-500">{e.maintDue}</td>
              <td className="py-2.5"><Pill value={e.status === "Operational" ? "On Track" : e.status === "Under Maintenance" ? "Attention Required" : "Delayed"} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QualitySafety() {
  const rows: [string, string, string, "ok" | "warn" | "danger" | undefined][] = [
    ["Inspections this week", "23", "4 pending closure", "warn"],
    ["Cube tests passed", "96%", "3 of 3 batches", "ok"],
    ["Toolbox talks held", "12", "daily at all fronts", "ok"],
    ["Incidents / near-miss", "0 / 1", "near-miss under review", "warn"],
    ["Corrective actions open", "3", "2 due this week", "warn"],
  ];
  return (
    <ul className="space-y-2">
      {rows.map(([l, v, sub, tone]) => (
        <li key={l} className="flex items-center gap-3 border border-line rounded-lg px-3.5 py-2.5">
          <span className={cx("h-8 w-1.5 rounded-full shrink-0", tone === "ok" ? "bg-ok-500" : tone === "warn" ? "bg-warn-500" : "bg-danger-500")} />
          <div className="min-w-0 flex-1"><p className="text-[12.5px] font-semibold text-ink-900">{l}</p><p className="text-[10.5px] text-ink-400">{sub}</p></div>
          <span className="num text-[15px] font-bold text-ink-900">{v}</span>
        </li>
      ))}
    </ul>
  );
}
