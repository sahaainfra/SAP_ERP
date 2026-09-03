/* Meridian ERP · Object Page + Document Flow — S/4HANA-style record architecture */
import { useState } from "react";
import type { ReactNode } from "react";
import { Pill, cx, Bar } from "./ui";
import { ICheck } from "./icons";

const IChevL = ({ size = 12, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M15 6l-6 6 6 6" /></svg>
);
const IArrowR = ({ size = 12, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M4 12h16" /><path d="M13 5l7 7-7 7" /></svg>
);

/* Global navigation helper — modules dispatch, App listens */
export const navTo = (route: string) => window.dispatchEvent(new CustomEvent("mer.nav", { detail: route }));

/* ── Object Page shell ── */
export function ObjectPage({
  title, code, subtitle, status, kpis, actions, tabs, onBack,
}: {
  title: string; code?: string; subtitle?: string; status?: string;
  kpis?: { label: string; value: string; tone?: "ok" | "warn" | "danger" }[];
  actions?: { label: string; onClick: () => void; primary?: boolean }[];
  tabs: { id: string; label: string; count?: number; content: ReactNode }[];
  onBack: () => void;
}) {
  const [tab, setTab] = useState(tabs[0].id);
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];
  return (
    <div className="fade-up">
      {/* header */}
      <div className="rounded-[12px] border border-line bg-surface shadow-card overflow-hidden">
        <div className="px-4 md:px-5 pt-4 pb-3">
          <button onClick={onBack} className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-ink-400 hover:text-brand-700 transition-colors mb-2.5">
            <IChevL size={12} /> Back to list
          </button>
          <div className="flex flex-wrap items-start gap-x-6 gap-y-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                {code && <span className="num text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-100 rounded px-2 py-0.5">{code}</span>}
                {status && <Pill value={status} pulse={status === "Delayed" || status === "Attention Required" || status.includes("Pending") || status.includes("Certification")} />}
              </div>
              <h1 className="font-display text-[20px] md:text-[23px] font-bold tracking-tight text-ink-900 mt-1.5 leading-tight">{title}</h1>
              {subtitle && <p className="text-[12px] text-ink-400 mt-1">{subtitle}</p>}
            </div>
            {actions && actions.length > 0 && (
              <div className="ml-auto flex items-center gap-2 flex-wrap">
                {actions.map((a) => (
                  <button key={a.label} onClick={a.onClick}
                    className={cx("h-8.5 px-3.5 h-9 rounded-lg text-[12px] font-semibold inline-flex items-center gap-1.5 transition-all active:scale-[0.97]",
                      a.primary ? "bg-brand-600 text-white hover:bg-brand-700 shadow-card" : "border border-line text-ink-700 hover:border-line-strong hover:bg-canvas")}>
                    {a.label}
                  </button>))}
              </div>)}
          </div>
          {kpis && kpis.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-px bg-line/60 border border-line/60 rounded-lg overflow-hidden mt-4">
              {kpis.map((k) => (
                <div key={k.label} className="bg-surface px-3 py-2.5 hover:bg-canvas/60 transition-colors">
                  <p className="text-[8.5px] font-bold uppercase tracking-[0.1em] text-ink-400 leading-snug">{k.label}</p>
                  <p className={cx("num text-[14px] font-semibold mt-0.5", k.tone === "ok" ? "text-ok-600" : k.tone === "warn" ? "text-amber-600" : k.tone === "danger" ? "text-danger-600" : "text-ink-900")}>{k.value}</p>
                </div>))}
            </div>)}
        </div>
        {/* tabs */}
        <div className="flex overflow-x-auto border-t border-line px-2 bg-canvas/40">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cx("relative shrink-0 px-3.5 h-10 text-[12px] font-semibold transition-colors whitespace-nowrap", tab === t.id ? "text-brand-700" : "text-ink-400 hover:text-ink-700")}>
              {t.label}
              {t.count !== undefined && <span className={cx("num text-[9.5px] ml-1.5 px-1.5 py-px rounded-full", tab === t.id ? "bg-brand-50 text-brand-700" : "bg-line/60 text-ink-400")}>{t.count}</span>}
              {tab === t.id && <span className="absolute bottom-0 inset-x-2 h-[2.5px] bg-brand-600 rounded-t" />}
            </button>))}
        </div>
      </div>
      <div className="mt-4">{active.content}</div>
    </div>
  );
}

/* ── Document Flow (clickable transaction chain) ── */
export function DocumentFlow({ stages }: { stages: { label: string; ref?: string; state: "done" | "current" | "pending" | "danger"; onClick?: () => void }[] }) {
  return (
    <div className="overflow-x-auto pb-1 -mx-1 px-1">
      <ol className="flex items-stretch gap-0 min-w-max">
        {stages.map((st, i) => (
          <li key={i} className="flex items-center">
            <div className={cx("flex flex-col items-center gap-1.5 w-[104px]", st.onClick && "cursor-pointer group")}>
              <button
                onClick={st.onClick}
                disabled={!st.onClick}
                className={cx("h-9 w-9 rounded-full grid place-items-center border-2 transition-all",
                  st.state === "done" && "bg-brand-600 border-brand-600 text-white",
                  st.state === "current" && "bg-surface border-brand-600 text-brand-700 shadow-[0_0_0_4px_rgba(12,114,100,0.12)] animate-pulse-soft",
                  st.state === "pending" && "bg-surface border-line text-ink-300",
                  st.state === "danger" && "bg-danger-100 border-danger-500 text-danger-600",
                  st.onClick && "group-hover:scale-110 group-active:scale-95")}>
                {st.state === "done" ? <ICheck size={15} /> : <span className="num text-[11px] font-bold">{i + 1}</span>}
              </button>
              <div className="text-center">
                <p className={cx("text-[9.5px] font-bold uppercase tracking-wide leading-tight", st.state === "pending" ? "text-ink-300" : "text-ink-700")}>{st.label}</p>
                {st.ref && <p className="num text-[9px] text-brand-700 font-semibold mt-0.5">{st.ref}</p>}
              </div>
            </div>
            {i < stages.length - 1 && (
              <span className={cx("h-[2px] w-7 -mt-5 rounded", stages[i + 1].state !== "pending" ? "bg-brand-500" : "bg-line")} />)}
          </li>))}
      </ol>
    </div>
  );
}

/* ── small helpers used across object pages ── */
export function FieldRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 border-b border-line/60 last:border-0 text-[12px]">
      <span className="text-ink-400 font-medium shrink-0">{label}</span>
      <span className="text-ink-900 font-semibold text-right num">{children}</span>
    </div>
  );
}

export function ProgressPair({ planned, actual }: { planned: number; actual: number }) {
  return (
    <div>
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide text-ink-400 mb-1">
        <span>Planned {planned}%</span><span className={actual >= planned ? "text-ok-600" : "text-amber-600"}>Actual {actual}%</span>
      </div>
      <div className="relative h-2 rounded-full bg-line/70 overflow-hidden">
        <div className="absolute inset-y-0 left-0 bg-[#c6d3de] rounded-full" style={{ width: `${planned}%` }} />
        <div className={cx("absolute inset-y-0 left-0 rounded-full", actual >= planned ? "bg-ok-500" : "bg-brand-600")} style={{ width: `${actual}%` }} />
      </div>
    </div>
  );
}

export { Bar, IArrowR };
