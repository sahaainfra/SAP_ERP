/* Meridian ERP · dashboard widgets */
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useERP } from "./store";
import { ACTIVITIES, ALERTS, SITE_ISSUES, TRADES, VENDORS, fmtNum, projectById } from "./data";
import type { Kpi } from "./data";
import { Bar, Delta, Empty, Pill, Sparkline, cx, useCountUp, useToast } from "./ui";
import { IAlert, IArrowDown, IArrowUp, ICalendar, ICheck, ICube, IHardhat, IInfo, IReceipt, IRupee, ISearch, IStamp, ITruck } from "./icons";

/* ── KPI grid ────────────────────────────────────────────────── */
function KpiCard({ k, i, share, onDrill }: { k: Kpi; i: number; share: number; onDrill?: (id: string) => void }) {
  const display = k.value * (k.unit === "Cr" ? share : 1);
  const v = useCountUp(display);
  const text = k.decimals === 0 ? fmtNum(v, 0) : fmtNum(v, k.decimals ?? 1);
  return (
    <button onClick={() => onDrill?.(k.id)}
      className="group relative bg-surface border border-line rounded-[10px] shadow-card p-3.5 transition-all duration-200 hover:shadow-lift hover:-translate-y-[2px] overflow-hidden text-left w-full"
      style={{ animationDelay: `${i * 40}ms` }}>
      <span className="absolute inset-x-0 top-0 h-[2.5px] bg-brand-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-ink-400 leading-snug">{k.label}</p>
        <span className="tip shrink-0 text-ink-300 cursor-help" data-tip={k.hint + (onDrill ? " · click to drill down" : "")}><IInfo size={13} /></span>
      </div>
      <p className="num text-[21px] font-semibold text-ink-900 mt-1.5 leading-none">
        {k.prefix}<span>{text}</span>
        {k.unit && <span className="text-[12px] font-medium text-ink-400 ml-1">{k.unit}</span>}
      </p>
      <div className="flex items-end justify-between mt-2.5">
        <div>
          <Delta value={k.delta} goodWhenUp={k.goodWhenUp ?? true} />
          <p className="text-[10px] text-ink-300 mt-1 num">{k.prev}</p>
        </div>
        <Sparkline data={k.spark} color={k.delta >= 0 === (k.goodWhenUp ?? true) ? "#128574" : "#d05252"} w={68} h={26} />
      </div>
    </button>
  );
}

export function KpiGrid({ kpis, share = 1, onDrill }: { kpis: Kpi[]; share?: number; onDrill?: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((k, i) => <KpiCard key={k.id + i} k={k} i={i} share={share} onDrill={onDrill} />)}
    </div>
  );
}

/* ── Project performance table ──────────────────────────────── */
export function ProjectTable({ onOpen }: { onOpen?: (code: string) => void }) {
  const { s } = useERP();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ k: string; d: 1 | -1 }>({ k: "value", d: -1 });
  const rows = useMemo(() => {
    let r = s.projects.filter((p) => (p.name + p.client + p.code + p.pm).toLowerCase().includes(q.toLowerCase()));
    r = [...r].sort((a, b) => {
      const va = sort.k === "name" ? a.name.localeCompare(b.name) : sort.k === "value" ? a.contractValue - b.contractValue : a.progress - b.progress;
      return va * sort.d;
    });
    return r;
  }, [s.projects, q, sort]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-[230px]">
          <ISearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter projects…"
            className="w-full h-8 pl-8 pr-2 rounded-md border border-line bg-canvas/60 text-[12px] outline-none focus:bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all placeholder:text-ink-300" />
        </div>
        <span className="text-[11px] text-ink-400 num hidden sm:block">{rows.length} of {s.projects.length}</span>
      </div>
      <div className="overflow-x-auto -mx-4 px-4 flex-1">
        {rows.length === 0 ? (
          <Empty title="No projects match" note="Adjust the filter text." icon={<ISearch size={18} />} />
        ) : (
          <table className="w-full text-left border-collapse min-w-[820px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-[0.08em] text-ink-400">
                <th className="font-bold pb-2 pr-3 cursor-pointer select-none hover:text-ink-700" onClick={() => setSort({ k: "name", d: sort.k === "name" && sort.d === 1 ? -1 : 1 })}>Project{sort.k === "name" && (sort.d === 1 ? " ↑" : " ↓")}</th>
                <th className="font-bold pb-2 pr-3">Client</th>
                <th className="font-bold pb-2 pr-3 text-right cursor-pointer select-none hover:text-ink-700" onClick={() => setSort({ k: "value", d: sort.k === "value" && sort.d === -1 ? 1 : -1 })}>Contract{sort.k === "value" && (sort.d === -1 ? " ↓" : " ↑")}</th>
                <th className="font-bold pb-2 pr-3 w-[150px]">Progress</th>
                <th className="font-bold pb-2 pr-3 w-[120px]"><span className="tip" data-tip="Budget consumed vs earned value">Budget util.</span></th>
                <th className="font-bold pb-2 pr-3">Billing</th>
                <th className="font-bold pb-2 pr-3">Manager</th>
                <th className="font-bold pb-2 pr-3">Expected</th>
                <th className="font-bold pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-line/80 hover:bg-brand-50/40 transition-colors group cursor-pointer" onClick={() => onOpen?.(p.code)}>
                  <td className="py-2.5 pr-3">
                    <p className="text-[12.5px] font-semibold text-ink-900 leading-tight group-hover:text-brand-700 transition-colors truncate max-w-[220px]">{p.name}</p>
                    <p className="text-[10.5px] text-ink-400 num mt-0.5">{p.code} · {p.manpower} manpower</p>
                  </td>
                  <td className="py-2.5 pr-3 text-[12px] text-ink-500 whitespace-nowrap">{p.client}</td>
                  <td className="py-2.5 pr-3 text-right num text-[12.5px] font-semibold text-ink-900 whitespace-nowrap">₹{fmtNum(p.contractValue, 0)} Cr</td>
                  <td className="py-2.5 pr-3"><div className="flex items-center gap-2"><div className="flex-1"><Bar value={p.progress} /></div><span className="num text-[11px] font-semibold text-ink-700 w-8 text-right">{p.progress}%</span></div></td>
                  <td className="py-2.5 pr-3"><div className="flex items-center gap-2"><div className="flex-1"><Bar value={p.budgetUtil} warn={p.budgetUtil > 85} /></div><span className={cx("num text-[11px] font-semibold w-8 text-right", p.budgetUtil > 85 ? "text-danger-600" : "text-ink-700")}>{p.budgetUtil}%</span></div></td>
                  <td className="py-2.5 pr-3"><Pill value={p.billing} pulse={p.billing === "Overdue"} /></td>
                  <td className="py-2.5 pr-3 text-[12px] text-ink-500 whitespace-nowrap">{p.pm}</td>
                  <td className="py-2.5 pr-3 text-[12px] text-ink-500 num whitespace-nowrap">{p.end}</td>
                  <td className="py-2.5"><Pill value={p.status} pulse={p.status === "Delayed" || p.status === "Attention Required"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Alerts panel ────────────────────────────────────────────── */
export function AlertsPanel() {
  const toast = useToast();
  const { s, setS } = useERP();
  const [resolved, setResolved] = useState<string[]>([]);
  void s; void setS;
  const list = ALERTS.filter((a) => !resolved.includes(a.id));
  return (
    <div className="space-y-2">
      {list.length === 0 ? (
        <Empty title="No open exceptions" note="All alerts acknowledged. New exceptions raised by the system will land here." icon={<ICheck size={18} />} />
      ) : list.map((a) => (
        <div key={a.id} className={cx("flex gap-2.5 rounded-lg border p-2.5 transition-all duration-200 hover:translate-x-[2px]",
          a.severity === "Critical" ? "border-danger-500/30 bg-danger-100/25" : a.severity === "Warning" ? "border-warn-500/25 bg-warn-100/25" : "border-line bg-canvas/40")}>
          <span className={cx("h-7 w-7 rounded-md grid place-items-center shrink-0 mt-0.5", a.severity === "Critical" ? "bg-danger-100 text-danger-600" : a.severity === "Warning" ? "bg-warn-100 text-warn-600" : "bg-steel-100 text-steel-600")}>
            {a.severity === "Info" ? <IInfo size={14} /> : <IAlert size={14} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Pill value={a.severity} />
              <span className="text-[10px] font-bold uppercase tracking-wide text-ink-300 truncate">{a.category}</span>
              <span className="ml-auto text-[10px] num text-ink-300">{projectById(a.project)?.code}</span>
            </div>
            <p className="text-[12px] font-semibold text-ink-900 leading-snug mt-1">{a.text}</p>
            <p className="text-[11px] text-ink-400 mt-0.5">{a.detail}</p>
          </div>
          <button onClick={() => { setResolved((r) => [...r, a.id]); toast("success", `Acknowledged: ${a.category}`); }}
            className="self-start shrink-0 h-6 px-2 rounded-md border border-line text-[10.5px] font-semibold text-ink-500 hover:bg-surface hover:border-line-strong active:scale-95 transition-all">Ack</button>
        </div>
      ))}
    </div>
  );
}

/* ── Activity timeline ───────────────────────────────────────── */
const ACT_META: Record<string, { icon: ReactNode; tone: string }> = {
  po: { icon: <IStamp size={13} />, tone: "bg-brand-50 text-brand-700 border border-brand-100" },
  grn: { icon: <ICube size={13} />, tone: "bg-steel-100 text-steel-600" },
  attendance: { icon: <ICalendar size={13} />, tone: "bg-warn-100 text-warn-600" },
  invoice: { icon: <IReceipt size={13} />, tone: "bg-brand-50 text-brand-700 border border-brand-100" },
  payment: { icon: <IRupee size={13} />, tone: "bg-ok-100 text-ok-600" },
  project: { icon: <IHardhat size={13} />, tone: "bg-side-800 text-brand-200" },
  approval: { icon: <ICheck size={13} />, tone: "bg-ok-100 text-ok-600" },
};

export function ActivityTimeline({ limit }: { limit?: number }) {
  const acts = limit ? ACTIVITIES.slice(0, limit) : ACTIVITIES;
  return (
    <ol className="relative">
      {acts.map((a, i) => (
        <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0 group">
          {i < acts.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-line" />}
          <span className={cx("relative z-10 h-8 w-8 rounded-full grid place-items-center shrink-0 transition-transform duration-200 group-hover:scale-110", ACT_META[a.kind].tone)}>
            {ACT_META[a.kind].icon}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-[12px] font-medium text-ink-900 leading-snug">{a.text}</p>
            <p className="text-[11px] text-ink-400 mt-0.5">{a.meta}</p>
            <p className="text-[10px] text-ink-300 num mt-1 uppercase tracking-wide font-semibold">{a.time} · {projectById(a.projectId)?.code} · {a.dept}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ── Utilisation card ────────────────────────────────────────── */
export function UtilizationCard() {
  const { s } = useERP();
  const rows = s.projects.filter((p) => p.status !== "Completed").slice(0, 5);
  return (
    <div className="space-y-3.5">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-ink-400">Resource utilisation</p>
          <span className="num text-[11px] font-semibold text-brand-700">78% fleet</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[["Labour", 86], ["Plant", 78], ["Equipment", 71], ["Formwork", 64]].map(([l, v]) => (
            <div key={l as string} className="text-center">
              <div className="relative h-12 flex items-end justify-center">
                <div className="w-6 rounded-t bg-canvas border border-line overflow-hidden flex flex-col justify-end h-full">
                  <div className="bg-brand-500 rounded-t transition-[height] duration-700" style={{ height: `${v}%` }} />
                </div>
              </div>
              <p className="text-[9.5px] font-semibold text-ink-400 mt-1 uppercase tracking-wide">{l}</p>
              <p className="num text-[10.5px] font-semibold text-ink-700">{v}%</p>
            </div>
          ))}
        </div>
      </div>
      <div className="pt-3 border-t border-line">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-ink-400 mb-2.5">Cost utilisation by project</p>
        <div className="space-y-2.5">
          {rows.map((p) => (
            <div key={p.id}>
              <div className="flex items-center justify-between text-[11.5px] mb-1">
                <span className="font-medium text-ink-700 truncate pr-2">{p.code}</span>
                <span className={cx("num font-semibold", p.budgetUtil > 85 ? "text-danger-600" : p.budgetUtil > 70 ? "text-warn-600" : "text-ink-700")}>{p.budgetUtil}%</span>
              </div>
              <Bar value={p.budgetUtil} warn={p.budgetUtil > 85} h={5} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Performance: top & attention ────────────────────────────── */
export function PerformanceCard() {
  const { s } = useERP();
  const [tab, setTab] = useState<"top" | "attention">("top");
  const active = s.projects.filter((p) => p.status !== "Completed");
  const top = [...active].sort((a, b) => b.margin - a.margin).slice(0, 4);
  const attention = [...active].sort((a, b) => (b.planned - b.progress) - (a.planned - a.progress)).slice(0, 4);
  const list = tab === "top" ? top : attention;
  return (
    <div>
      <div className="flex gap-1 mb-3 bg-canvas border border-line rounded-lg p-1">
        {([["top", "Top performers"], ["attention", "Needs attention"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={cx("flex-1 h-7 rounded-md text-[11.5px] font-semibold transition-all active:scale-[0.98]", tab === k ? "bg-surface shadow-card text-ink-900" : "text-ink-400 hover:text-ink-700")}>{l}</button>
        ))}
      </div>
      <ul className="space-y-2">
        {list.map((p) => {
          const gap = p.planned - p.progress;
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-lg border border-line bg-canvas/40 px-3 py-2.5 hover:border-line-strong hover:bg-surface transition-all">
              <span className={cx("h-8 w-8 rounded-lg grid place-items-center shrink-0", tab === "top" ? "bg-brand-50 text-brand-700 border border-brand-100" : "bg-warn-100 text-warn-600")}>
                {tab === "top" ? <IArrowUp size={14} /> : <IAlert size={14} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-ink-900 truncate">{p.name}</p>
                <p className="text-[10.5px] text-ink-400 num mt-0.5">{tab === "top" ? `Margin ${p.margin}% · progress ${p.progress}%` : `Behind plan by ${gap > 0 ? gap : 0}% · billing ${p.billing.toLowerCase()}`}</p>
              </div>
              <div className="w-[86px] shrink-0">
                <Bar value={p.progress} color={tab === "top" ? "var(--color-brand-500)" : "var(--color-warn-500)"} h={5} />
                <p className="num text-[10px] text-ink-400 text-right mt-1">{p.progress}%</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ManpowerCard() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[["Marked present", "1,284", "86.9%"], ["On leave", "38", "2.6%"], ["Absent", "156", "10.5%"]].map(([l, v, sub], i) => (
          <div key={l} className={cx("rounded-lg border p-2.5 text-center", i === 0 ? "border-brand-200 bg-brand-50" : "border-line bg-canvas/50")}>
            <p className="num text-[17px] font-semibold text-ink-900">{v}</p>
            <p className="text-[10px] font-semibold text-ink-400 mt-0.5">{l} · {sub}</p>
          </div>
        ))}
      </div>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-ink-400 mb-2">Attendance by trade</p>
      <ul className="space-y-2">
        {TRADES.map((t) => (
          <li key={t.trade}>
            <div className="flex justify-between text-[11.5px] mb-1">
              <span className="font-medium text-ink-700">{t.trade}</span>
              <span className="num text-ink-500">{t.present}/{t.total} · <b className="text-ink-700">{Math.round((t.present / t.total) * 100)}%</b></span>
            </div>
            <Bar value={(t.present / t.total) * 100} h={5} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VendorCard() {
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-left min-w-[520px]">
        <thead>
          <tr className="text-[10.5px] uppercase tracking-[0.08em] text-ink-400">
            <th className="font-bold pb-2 pr-3">Vendor</th><th className="font-bold pb-2 pr-3">Category</th>
            <th className="font-bold pb-2 pr-3 text-right">Open POs</th><th className="font-bold pb-2 pr-3">On-time %</th>
            <th className="font-bold pb-2 text-right">Rating</th>
          </tr>
        </thead>
        <tbody>
          {VENDORS.map((v) => (
            <tr key={v.name} className="border-t border-line/80 hover:bg-brand-50/40 transition-colors">
              <td className="py-2.5 pr-3 text-[12.5px] font-semibold text-ink-900">{v.name}</td>
              <td className="py-2.5 pr-3"><span className="text-[10.5px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{v.cat}</span></td>
              <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold">{v.pos}</td>
              <td className="py-2.5 pr-3 w-[130px]"><div className="flex items-center gap-2"><div className="flex-1"><Bar value={v.onTime} color={v.onTime < 85 ? "var(--color-warn-500)" : "var(--color-brand-500)"} h={5} /></div><span className="num text-[11px] font-semibold w-8">{v.onTime}%</span></div></td>
              <td className="py-2.5 text-right num text-[12px] font-semibold text-warn-600">{v.rating.toFixed(1)} ★</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StockCard() {
  const { s } = useERP();
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-left min-w-[540px]">
        <thead>
          <tr className="text-[10.5px] uppercase tracking-[0.08em] text-ink-400">
            <th className="font-bold pb-2 pr-3">Material</th><th className="font-bold pb-2 pr-3">Store</th>
            <th className="font-bold pb-2 pr-3 text-right">On hand</th><th className="font-bold pb-2 pr-3 text-right">ROL</th>
            <th className="font-bold pb-2 pr-3">Level</th><th className="font-bold pb-2 text-right">Value</th>
          </tr>
        </thead>
        <tbody>
          {s.stock.map((st, i) => {
            const rol = [3000, 120, 600, 1500, 400, 500][i] ?? 500;
            const pct = Math.min(100, (st.onHand / (rol * 2)) * 100);
            const low = st.onHand < rol;
            return (
              <tr key={st.material} className="border-t border-line/80 hover:bg-brand-50/40 transition-colors">
                <td className="py-2.5 pr-3">
                  <p className="text-[12.5px] font-semibold text-ink-900">{st.material}</p>
                  {low && <p className="text-[10px] font-bold text-danger-600 uppercase tracking-wide mt-0.5">Below ROL</p>}
                </td>
                <td className="py-2.5 pr-3 text-[11.5px] text-ink-500">{st.store}</td>
                <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold">{fmtNum(st.onHand, 0)} {st.unit}</td>
                <td className="py-2.5 pr-3 text-right num text-[11.5px] text-ink-400">{fmtNum(rol, 0)}</td>
                <td className="py-2.5 pr-3 w-[110px]"><Bar value={pct} color={low ? "var(--color-danger-500)" : "var(--color-brand-500)"} h={5} /></td>
                <td className="py-2.5 text-right num text-[12px] font-semibold">₹{st.value.toFixed(1)} Cr</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ProductionCard() {
  const { s } = useERP();
  const prod = [
    { d: "Mon", target: 660, actual: 612 }, { d: "Tue", target: 660, actual: 648 }, { d: "Wed", target: 680, actual: 702 },
    { d: "Thu", target: 680, actual: 655 }, { d: "Fri", target: 700, actual: 689 }, { d: "Sat", target: 640, actual: 642 },
  ];
  const max = Math.max(...prod.map((p) => Math.max(p.target, p.actual)));
  void s;
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[["Batched today", "642 m³", "vs 660 target"], ["In transit", "96 m³", "14 mixers"], ["Wastage", "0.8%", "within 1.5% norm"]].map(([l, v, sub]) => (
          <div key={l} className="rounded-lg border border-line bg-canvas/50 p-2.5 text-center">
            <p className="num text-[15px] font-semibold text-ink-900">{v}</p>
            <p className="text-[10px] font-semibold text-ink-400 mt-0.5">{l}</p>
            <p className="text-[9.5px] text-ink-300 num mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-ink-400 mb-2">Weekly production vs target (m³)</p>
      <div className="flex items-end gap-3 h-[120px] px-1">
        {prod.map((d) => (
          <div key={d.d} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div className="w-full flex items-end justify-center gap-1 h-full">
              <div className="w-[38%] rounded-t bg-steel-300 relative" style={{ height: `${(d.target / max) * 100}%` }} />
              <div className="w-[38%] rounded-t bg-brand-600 relative transition-all hover:bg-brand-700" style={{ height: `${(d.actual / max) * 100}%` }} />
            </div>
            <span className="text-[9.5px] font-semibold text-ink-400 uppercase">{d.d}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-2 text-[10.5px] text-ink-400 font-medium">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-steel-300" /> Target</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-brand-600" /> Actual</span>
        <span className="ml-auto flex items-center gap-1.5 text-ink-300"><ITruck size={12} /> 96 m³ in transit</span>
      </div>
    </div>
  );
}

export function ContractsCard() {
  const { s } = useERP();
  return (
    <div className="overflow-x-auto -mx-4 px-4">
      <table className="w-full text-left min-w-[560px]">
        <thead>
          <tr className="text-[10.5px] uppercase tracking-[0.08em] text-ink-400">
            <th className="font-bold pb-2 pr-3">Contract</th><th className="font-bold pb-2 pr-3 text-right">Base (Cr)</th>
            <th className="font-bold pb-2 pr-3 text-right">Variation</th><th className="font-bold pb-2 pr-3 text-right">Certified</th>
            <th className="font-bold pb-2 pr-3 text-right">Billed</th><th className="font-bold pb-2 text-right">Margin</th>
          </tr>
        </thead>
        <tbody>
          {s.variations.length >= 0 && [
            { name: "Pune Metro Viaduct — Pkg 4", base: 412, variation: 14.2, certified: 236.4, billed: 224.1, margin: 12.4 },
            { name: "NH-60 Flyover & Junction", base: 268, variation: 8.6, certified: 104.1, billed: 96.7, margin: 10.8 },
            { name: "Industrial Park Phase II", base: 186, variation: 4.1, certified: 138.9, billed: 131.2, margin: 9.6 },
            { name: "Water Treatment Plant 40 MLD", base: 152, variation: 2.8, certified: 79.6, billed: 74.9, margin: 13.2 },
          ].map((c) => (
            <tr key={c.name} className="border-t border-line/80 hover:bg-brand-50/40 transition-colors">
              <td className="py-2.5 pr-3 text-[12.5px] font-semibold text-ink-900">{c.name}</td>
              <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold">{fmtNum(c.base, 1)}</td>
              <td className="py-2.5 pr-3 text-right num text-[12px] text-warn-600 font-semibold">+{fmtNum(c.variation, 1)}</td>
              <td className="py-2.5 pr-3 text-right num text-[12px]">{fmtNum(c.certified, 1)}</td>
              <td className="py-2.5 pr-3 text-right num text-[12px]">{fmtNum(c.billed, 1)}</td>
              <td className="py-2.5 text-right"><span className={cx("num text-[11px] font-bold px-1.5 py-0.5 rounded", c.margin >= 11 ? "bg-ok-100 text-ok-600" : "bg-warn-100 text-warn-600")}>{c.margin}%</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SiteIssuesCard() {
  const toast = useToast();
  return (
    <ul className="space-y-2">
      {SITE_ISSUES.map((si) => (
        <li key={si.id} className="flex items-center gap-3 rounded-lg border border-line bg-canvas/40 px-3 py-2.5 hover:border-line-strong transition-all">
          <Pill value={si.sev} />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-ink-900 leading-snug truncate">{si.text}</p>
            <p className="text-[10.5px] text-ink-400 num mt-0.5">{si.id} · {si.project} · open {si.age}</p>
          </div>
          <button onClick={() => toast("info", `Escalated ${si.id} to project manager`)}
            className="shrink-0 h-7 px-2 rounded-md border border-line text-[10.5px] font-semibold text-ink-500 hover:bg-surface hover:border-line-strong active:scale-95 transition-all">Escalate</button>
        </li>
      ))}
    </ul>
  );
}

export function PayablesSummary() {
  const rows: [string, number, number][] = [["Subcontractors", 41.2, 58], ["Material vendors", 33.6, 30], ["Plant & equipment", 11.4, 8], ["Statutory dues", 7.2, 4]];
  return (
    <div className="mt-3 pt-3 border-t border-line">
      <p className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-ink-400 mb-2">Payables summary · ₹93.4 Cr</p>
      <ul className="space-y-1.5">
        {rows.map(([l, v, share]) => (
          <li key={l} className="flex items-center gap-2 text-[11.5px]">
            <span className="text-ink-500 flex-1 truncate">{l}</span>
            <span className="w-[90px]"><Bar value={share} color="var(--color-steel-600)" h={4} /></span>
            <span className="num font-semibold text-ink-700 w-[64px] text-right">₹{v.toFixed(1)} Cr</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ArrowNote({ down }: { down?: boolean }) {
  return down ? <IArrowDown size={12} /> : <IArrowUp size={12} />;
}
