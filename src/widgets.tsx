import { useState } from "react";
import type { ReactNode } from "react";
import {
  ACTIVITIES, ALERTS, BUDGET_ACTUAL, CONTRACTS, Kpi, PLANNED_ACTUAL, PRODUCTION, PROJECTS,
  SITE_ISSUES, STOCK, TRADES, VENDORS, fmtNum, projectById,
} from "./data";
import { Bar, Delta, Empty, Pill, Sparkline, cx, useCountUp, useToast } from "./ui";
import {
  IAlert, IInfo, ICheck, ITruck, ICube, ICalendar, IReceipt, IRupee, IHardhat, IStamp, IArrowUp, IArrowDown, IFlask,
} from "./icons";

/* ── KPI grid ────────────────────────────────────────────────── */
function KpiCard({ k, i, share }: { k: Kpi; i: number; share: number }) {
  const display = k.value * (k.unit === "Cr" ? share : 1);
  const v = useCountUp(display);
  const text =
    k.decimals === 0 ? fmtNum(v, 0) : fmtNum(v, k.decimals ?? 1);
  return (
    <div className="group relative bg-surface border border-line rounded-[10px] shadow-card p-3.5 transition-all duration-200 hover:shadow-lift hover:-translate-y-[2px] overflow-hidden"
      style={{ animationDelay: `${i * 40}ms` }}>
      <span className="absolute inset-x-0 top-0 h-[2.5px] bg-brand-500 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-ink-400 leading-snug">{k.label}</p>
        <span className="tip shrink-0 text-ink-300 cursor-help" data-tip={k.hint}>
          <IInfo size={13} />
        </span>
      </div>
      <p className="num text-[21px] font-semibold text-ink-900 mt-1.5 leading-none">
        {k.prefix}<span>{text}</span>
        {k.unit && <span className="text-[12px] font-medium text-ink-400 ml-1">{k.unit}</span>}
      </p>
      <div className="flex items-end justify-between mt-2.5">
        <div>
          <Delta value={k.delta} goodWhenUp={k.goodWhenUp} />
          <p className="text-[10px] text-ink-300 mt-1 num">{k.prev}</p>
        </div>
        <Sparkline data={k.spark} color={k.delta >= 0 === (k.goodWhenUp ?? true) ? "#128574" : "#d05252"} w={68} h={26} />
      </div>
    </div>
  );
}

export function KpiGrid({ kpis, share }: { kpis: Kpi[]; share: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((k, i) => <KpiCard key={k.id + i} k={k} i={i} share={share} />)}
    </div>
  );
}

/* ── Alerts panel ────────────────────────────────────────────── */
export function AlertsPanel() {
  const toast = useToast();
  const [resolved, setResolved] = useState<string[]>([]);
  const list = ALERTS.filter((a) => !resolved.includes(a.id));
  return (
    <div className="space-y-2">
      {list.length === 0 ? (
        <Empty title="No open exceptions" note="All alerts acknowledged. New exceptions raised by the system will land here." icon={<ICheck size={18} />} />
      ) : list.map((a) => (
        <div key={a.id} className={cx(
          "flex gap-2.5 rounded-lg border p-2.5 transition-all duration-200 hover:translate-x-[2px]",
          a.severity === "Critical" ? "border-danger-500/30 bg-danger-100/25" : a.severity === "Warning" ? "border-amber-500/25 bg-amber-100/25" : "border-line bg-canvas/40"
        )}>
          <span className={cx("h-7 w-7 rounded-md grid place-items-center shrink-0 mt-0.5",
            a.severity === "Critical" ? "bg-danger-100 text-danger-600" : a.severity === "Warning" ? "bg-amber-100 text-amber-600" : "bg-steel-100 text-steel-600")}>
            {a.severity === "Info" ? <IInfo size={14} /> : <IAlert size={14} />}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Pill value={a.severity} />
              <span className="text-[10px] font-bold uppercase tracking-wide text-ink-300 truncate">{a.category}</span>
            </div>
            <p className="text-[12px] font-semibold text-ink-900 leading-snug mt-1">{a.text}</p>
            <p className="text-[11px] text-ink-400 mt-0.5">{a.detail}</p>
          </div>
          <button onClick={() => { setResolved((r) => [...r, a.id]); toast("success", `Acknowledged: ${a.category}`); }}
            className="self-start shrink-0 h-6 px-2 rounded-md border border-line text-[10.5px] font-semibold text-ink-500 hover:bg-surface hover:border-line-strong active:scale-95 transition-all">
            Ack
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Activity timeline ───────────────────────────────────────── */
const ACT_META: Record<string, { icon: ReactNode; tone: string }> = {
  po: { icon: <IStamp size={13} />, tone: "bg-brand-50 text-brand-700 border-brand-100" },
  grn: { icon: <ICube size={13} />, tone: "bg-steel-100 text-steel-600" },
  attendance: { icon: <ICalendar size={13} />, tone: "bg-amber-100 text-amber-600" },
  invoice: { icon: <IReceipt size={13} />, tone: "bg-brand-50 text-brand-700 border-brand-100" },
  payment: { icon: <IRupee size={13} />, tone: "bg-ok-100 text-ok-600" },
  project: { icon: <IHardhat size={13} />, tone: "bg-side-800 text-brand-200" },
  approval: { icon: <ICheck size={13} />, tone: "bg-ok-100 text-ok-600" },
};

export function ActivityTimeline({ activities }: { activities: typeof ACTIVITIES }) {
  return (
    <ol className="relative">
      {activities.map((a, i) => (
        <li key={a.id} className="relative flex gap-3 pb-4 last:pb-0 group">
          {i < activities.length - 1 && <span className="absolute left-[15px] top-8 bottom-0 w-px bg-line" />}
          <span className={cx("relative z-10 h-8 w-8 rounded-full grid place-items-center shrink-0 border border-transparent transition-transform duration-200 group-hover:scale-110", ACT_META[a.kind].tone)}>
            {ACT_META[a.kind].icon}
          </span>
          <div className="min-w-0 pt-0.5">
            <p className="text-[12px] font-medium text-ink-900 leading-snug">{a.text}</p>
            <p className="text-[11px] text-ink-400 mt-0.5">{a.meta}</p>
            <p className="text-[10px] text-ink-300 num mt-1 uppercase tracking-wide font-semibold">
              {a.time} · {projectById(a.projectId)?.code} · {a.dept}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ── Utilisation card ────────────────────────────────────────── */
export function UtilizationCard({ projects }: { projects: typeof PROJECTS }) {
  const rows = projects.filter((p) => p.status !== "Completed").slice(0, 5);
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
                <span className={cx("num font-semibold", p.budgetUtil > 85 ? "text-danger-600" : p.budgetUtil > 70 ? "text-amber-600" : "text-ink-700")}>{p.budgetUtil}%</span>
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
export function PerformanceCard({ projects }: { projects: typeof PROJECTS }) {
  const [tab, setTab] = useState<"top" | "attention">("top");
  const active = projects.filter((p) => p.status !== "Completed");
  const top = [...active].sort((a, b) => b.margin - a.margin).slice(0, 4);
  const attention = [...active].sort((a, b) => (b.planned - b.progress) - (a.planned - a.progress)).slice(0, 4);
  const list = tab === "top" ? top : attention;
  return (
    <div>
      <div className="flex gap-1 mb-3 bg-canvas border border-line rounded-lg p-1">
        {([["top", "Top performers"], ["attention", "Needs attention"]] as const).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={cx("flex-1 h-7 rounded-md text-[11.5px] font-semibold transition-all active:scale-[0.98]", tab === k ? "bg-surface shadow-card text-ink-900" : "text-ink-400 hover:text-ink-700")}>
            {l}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {list.map((p) => {
          const gap = p.planned - p.progress;
          return (
            <li key={p.id} className="flex items-center gap-3 rounded-lg border border-line bg-canvas/40 px-3 py-2.5 hover:border-line-strong hover:bg-surface transition-all">
              <span className={cx("h-8 w-8 rounded-lg grid place-items-center shrink-0", tab === "top" ? "bg-brand-50 text-brand-700 border border-brand-100" : "bg-amber-100 text-amber-600")}>
                {tab === "top" ? <IArrowUp size={14} /> : <IAlert size={14} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-ink-900 truncate">{p.name}</p>
                <p className="text-[10.5px] text-ink-400 num mt-0.5">
                  {tab === "top" ? `Margin ${p.margin}% · progress ${p.progress}%` : `Behind plan by ${gap > 0 ? gap : 0}% · billing ${p.billing.toLowerCase()}`}
                </p>
              </div>
              <div className="w-[86px] shrink-0">
                <Bar value={p.progress} color={tab === "top" ? "var(--color-brand-500)" : "var(--color-amber-500)"} h={5} />
                <p className="num text-[10px] text-ink-400 text-right mt-1">{p.progress}%</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ── Payables summary (inside receivables widget) ────────────── */
export function PayablesSummary() {
  const rows = [["Subcontractors", 41.2, 58], ["Material vendors", 33.6, 30], ["Plant & equipment", 11.4, 8], ["Statutory dues", 7.2, 4]] as const;
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

/* ── Role widgets ────────────────────────────────────────────── */
export function ManpowerCard() {
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[["Marked present", "1,284", "86.9%"], ["On leave", "38", "2.6%"], ["Absent", "156", "10.5%"]].map(([l, v, s], i) => (
          <div key={l} className={cx("rounded-lg border p-2.5 text-center", i === 0 ? "border-brand-200 bg-brand-50" : "border-line bg-canvas/50")}>
            <p className="num text-[17px] font-semibold text-ink-900">{v}</p>
            <p className="text-[10px] font-semibold text-ink-400 mt-0.5">{l} · {s}</p>
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
              <td className="py-2.5 pr-3 w-[130px]">
                <div className="flex items-center gap-2"><div className="flex-1"><Bar value={v.onTime} color={v.onTime < 85 ? "var(--color-amber-500)" : "var(--color-brand-500)"} h={5} /></div><span className="num text-[11px] font-semibold w-8">{v.onTime}%</span></div>
              </td>
              <td className="py-2.5 text-right num text-[12px] font-semibold text-amber-600">{v.rating.toFixed(1)} ★</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StockCard() {
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
          {STOCK.map((s) => {
            const pct = Math.min(100, (s.onHand / (s.rol * 2)) * 100);
            const low = s.onHand < s.rol;
            return (
              <tr key={s.item} className="border-t border-line/80 hover:bg-brand-50/40 transition-colors">
                <td className="py-2.5 pr-3">
                  <p className="text-[12.5px] font-semibold text-ink-900">{s.item}</p>
                  {low && <p className="text-[10px] font-bold text-danger-600 uppercase tracking-wide mt-0.5">Below ROL</p>}
                </td>
                <td className="py-2.5 pr-3 text-[11.5px] text-ink-500">{s.loc}</td>
                <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold">{fmtNum(s.onHand, 0)} {s.unit}</td>
                <td className="py-2.5 pr-3 text-right num text-[11.5px] text-ink-400">{fmtNum(s.rol, 0)}</td>
                <td className="py-2.5 pr-3 w-[110px]"><Bar value={pct} color={low ? "var(--color-danger-500)" : "var(--color-brand-500)"} h={5} /></td>
                <td className="py-2.5 text-right num text-[12px] font-semibold">₹{s.value.toFixed(1)} Cr</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ProductionCard() {
  const max = Math.max(...PRODUCTION.map((p) => Math.max(p.target, p.actual)));
  return (
    <div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        {[["Batched today", "642 m³", "vs 660 target"], ["In transit", "96 m³", "14 mixers"], ["Wastage", "0.8%", "within 1.5% norm"]].map(([l, v, s]) => (
          <div key={l} className="rounded-lg border border-line bg-canvas/50 p-2.5 text-center">
            <p className="num text-[15px] font-semibold text-ink-900">{v}</p>
            <p className="text-[10px] font-semibold text-ink-400 mt-0.5">{l}</p>
            <p className="text-[9.5px] text-ink-300 num mt-0.5">{s}</p>
          </div>
        ))}
      </div>
      <p className="text-[10.5px] font-bold uppercase tracking-[0.09em] text-ink-400 mb-2">Weekly production vs target (m³)</p>
      <div className="flex items-end gap-3 h-[120px] px-1">
        {PRODUCTION.map((d) => (
          <div key={d.d} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <div className="w-full flex items-end justify-center gap-1 h-full">
              <div className="w-[38%] rounded-t bg-[#c6d3de] relative" style={{ height: `${(d.target / max) * 100}%` }} />
              <div className="w-[38%] rounded-t bg-brand-600 relative transition-all hover:bg-brand-700" style={{ height: `${(d.actual / max) * 100}%` }}>
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 num text-[9px] font-semibold text-ink-500 opacity-0 hover:opacity-100">{d.actual}</span>
              </div>
            </div>
            <span className="text-[9.5px] font-semibold text-ink-400 uppercase">{d.d}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-2 text-[10.5px] text-ink-400 font-medium">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-[#c6d3de]" /> Target</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-brand-600" /> Actual</span>
      </div>
    </div>
  );
}

export function ContractsCard() {
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
          {CONTRACTS.map((c) => (
            <tr key={c.name} className="border-t border-line/80 hover:bg-brand-50/40 transition-colors">
              <td className="py-2.5 pr-3 text-[12.5px] font-semibold text-ink-900">{c.name}</td>
              <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold">{fmtNum(c.base, 1)}</td>
              <td className="py-2.5 pr-3 text-right num text-[12px] text-amber-600 font-semibold">+{fmtNum(c.variation, 1)}</td>
              <td className="py-2.5 pr-3 text-right num text-[12px]">{fmtNum(c.certified, 1)}</td>
              <td className="py-2.5 pr-3 text-right num text-[12px]">{fmtNum(c.billed, 1)}</td>
              <td className="py-2.5 text-right">
                <span className={cx("num text-[11px] font-bold px-1.5 py-0.5 rounded", c.margin >= 11 ? "bg-ok-100 text-ok-600" : "bg-amber-100 text-amber-600")}>{c.margin}%</span>
              </td>
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
      {SITE_ISSUES.map((s) => (
        <li key={s.id} className="flex items-center gap-3 rounded-lg border border-line bg-canvas/40 px-3 py-2.5 hover:border-line-strong transition-all">
          <Pill value={s.sev} />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-ink-900 leading-snug truncate">{s.text}</p>
            <p className="text-[10.5px] text-ink-400 num mt-0.5">{s.id} · {s.project} · open {s.age}</p>
          </div>
          <button onClick={() => toast("info", `Escalated ${s.id} to project manager`)}
            className="shrink-0 h-6.5 px-2 h-7 rounded-md border border-line text-[10.5px] font-semibold text-ink-500 hover:bg-surface hover:border-line-strong active:scale-95 transition-all">
            Escalate
          </button>
        </li>
      ))}
    </ul>
  );
}

export { BUDGET_ACTUAL, PLANNED_ACTUAL, ITruck, IFlask };
