/* Meridian ERP · UI primitives */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { IChevD, IX, ICheck, IAlert, IInfo } from "./icons";

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

/* ── count-up ── */
export function useCountUp(target: number, dur = 850) {
  const [v, setV] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    const t0 = performance.now();
    const from = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setV(from + (target - from) * e);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [target, dur]);
  return v;
}

/* ── sparkline ── */
export function Sparkline({ data, color = "#128574", w = 68, h = 26 }: { data: number[]; color?: string; w?: number; h?: number }) {
  const min = Math.min(...data), max = Math.max(...data), span = max - min || 1;
  const pts = data.map((d, i) => `${(i / (data.length - 1)) * (w - 4) + 2},${h - 3 - ((d - min) / span) * (h - 6)}`).join(" ");
  const last = pts.split(" ").pop()!.split(",");
  return (
    <svg width={w} height={h} className="shrink-0 overflow-visible">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} />
    </svg>
  );
}

/* ── delta chip ── */
export function Delta({ value, goodWhenUp = true }: { value: number; goodWhenUp?: boolean }) {
  const up = value >= 0;
  const good = up === goodWhenUp;
  return (
    <span className={cx("inline-flex items-center gap-0.5 num text-[11px] font-bold px-1.5 py-0.5 rounded", good ? "bg-ok-100 text-ok-600" : "bg-danger-100 text-danger-600")}>
      <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor" style={{ transform: up ? "none" : "rotate(180deg)" }}><path d="M5 1 9.3 8H.7z" /></svg>
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

/* ── status pill ── */
const TONES: Record<string, string> = {
  "On Track": "bg-ok-100 text-ok-600", Completed: "bg-ok-100 text-ok-600", Closed: "bg-ok-100 text-ok-600", Paid: "bg-ok-100 text-ok-600",
  Approved: "bg-ok-100 text-ok-600", Certified: "bg-ok-100 text-ok-600", Released: "bg-ok-100 text-ok-600", Present: "bg-ok-100 text-ok-600",
  Active: "bg-ok-100 text-ok-600", Received: "bg-ok-100 text-ok-600", Delivered: "bg-ok-100 text-ok-600", Resolved: "bg-ok-100 text-ok-600",
  Delayed: "bg-warn-100 text-warn-700", "Attention Required": "bg-warn-100 text-warn-700", Pending: "bg-warn-100 text-warn-700",
  Overdue: "bg-danger-100 text-danger-600", Rejected: "bg-danger-100 text-danger-600", Critical: "bg-danger-100 text-danger-600",
  Absent: "bg-danger-100 text-danger-600", "Returned for Correction": "bg-danger-100 text-danger-600", Returned: "bg-danger-100 text-danger-600",
  Submitted: "bg-steel-100 text-steel-800", Draft: "bg-steel-100 text-steel-800", "Under Approval": "bg-steel-100 text-steel-800",
  Booked: "bg-steel-100 text-steel-800", Scheduled: "bg-steel-100 text-steel-800",
  "Fully Converted": "bg-brand-100 text-brand-700", "Partially Converted": "bg-brand-100 text-brand-700", Dispatched: "bg-brand-100 text-brand-700",
  "Pending Approval": "bg-warn-100 text-warn-700", Warning: "bg-warn-100 text-warn-700", Info: "bg-steel-100 text-steel-800",
  High: "bg-danger-100 text-danger-600", Medium: "bg-warn-100 text-warn-700", Low: "bg-steel-100 text-steel-800",
  "On Leave": "bg-steel-100 text-steel-800", Late: "bg-warn-100 text-warn-700", "Half Day": "bg-warn-100 text-warn-700",
  "Under Client Certification": "bg-steel-100 text-steel-800", "Partially Paid": "bg-brand-100 text-brand-700", "Fully Paid": "bg-ok-100 text-ok-600",
  Raised: "bg-steel-100 text-steel-800", Open: "bg-warn-100 text-warn-700", Responded: "bg-steel-100 text-steel-800",
  Escalated: "bg-danger-100 text-danger-600", Locked: "bg-steel-100 text-steel-800",
};
export function Pill({ value, pulse }: { value: string; pulse?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 whitespace-nowrap text-[10.5px] font-bold uppercase tracking-[0.04em] px-2 py-[3px] rounded-full", TONES[value] ?? "bg-steel-100 text-steel-800")}>
      {pulse && <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-dot" />}
      {value}
    </span>
  );
}

/* ── progress bar ── */
export function Bar({ value, warn, color, h = 6 }: { value: number; warn?: boolean; color?: string; h?: number }) {
  const c = color ?? (warn ? "var(--color-danger-500)" : "var(--color-brand-500)");
  return (
    <div className="w-full rounded-full bg-line overflow-hidden" style={{ height: h }}>
      <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: c }} />
    </div>
  );
}

/* ── popover ── */
export function Pop({ open, onClose, children, className = "", align = "right" }: { open: boolean; onClose: () => void; children: ReactNode; className?: string; align?: "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className={cx("absolute z-50 top-[calc(100%+8px)] bg-surface border border-line rounded-xl shadow-pop fade-up", align === "right" ? "right-0" : "left-0", className)}>
      {children}
    </div>
  );
}

export function IconBtn({ label, onClick, children, active }: { label: string; onClick: () => void; children: ReactNode; active?: boolean }) {
  return (
    <button onClick={onClick} className={cx("tip h-8 w-8 grid place-items-center rounded-lg transition-all active:scale-90", active ? "bg-brand-50 text-brand-700" : "text-ink-500 hover:bg-canvas")} data-tip={label}>
      {children}
    </button>
  );
}

export function Select({ label, value, onChange, options, w = "180px" }: { label: string; value: string; onChange: (v: string) => void; options: string[]; w?: string }) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ width: w }}
        className="h-8 pl-2.5 pr-7 rounded-md border border-line bg-surface text-[12px] font-medium text-ink-700 outline-none cursor-pointer hover:border-line-strong focus:border-brand-500 transition-all appearance-none truncate">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <IChevD size={12} className="absolute right-2 pointer-events-none text-ink-300" />
    </label>
  );
}

/* ── widget shell ── */
export function Widget({ title, subtitle, actions, children, bodyClass = "", className = "" }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode; bodyClass?: string; className?: string }) {
  return (
    <section className={cx("bg-surface border border-line rounded-xl shadow-card overflow-hidden", className)}>
      <header className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-3 border-b border-line/70">
        <div className="min-w-0">
          <h3 className="font-display text-[13.5px] font-bold text-ink-900 leading-tight tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-ink-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
      </header>
      <div className={cx("p-4", bodyClass)}>{children}</div>
    </section>
  );
}

export function Empty({ title, note, icon }: { title: string; note?: string; icon?: ReactNode }) {
  return (
    <div className="py-10 flex flex-col items-center text-center">
      <span className="h-11 w-11 rounded-xl bg-canvas border border-line grid place-items-center text-ink-300 mb-3">{icon ?? <IInfo size={18} />}</span>
      <p className="text-[13px] font-semibold text-ink-700">{title}</p>
      {note && <p className="text-[11.5px] text-ink-400 mt-1 max-w-[300px]">{note}</p>}
    </div>
  );
}

export function Skel({ className = "" }: { className?: string }) {
  return <div className={cx("skel", className)} />;
}

/* ── scroll reveal ── */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } }, { threshold: 0.06 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={className} style={{ opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(12px)", transition: `opacity .5s ease ${delay}ms, transform .5s cubic-bezier(.22,1,.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── toast system ── */
type Toast = { id: number; kind: "success" | "error" | "info"; text: string };
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setList((l) => [...l.slice(-3), { id, kind, text }]);
    window.setTimeout(() => setList((l) => l.filter((t) => t.id !== id)), 4200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-16 lg:bottom-5 right-4 z-[90] space-y-2 no-print w-[320px] max-w-[calc(100vw-2rem)]">
        {list.map((t) => (
          <div key={t.id} className={cx("flex items-start gap-2.5 rounded-lg border px-3.5 py-3 shadow-pop bg-surface fade-up",
            t.kind === "success" ? "border-ok-500/30" : t.kind === "error" ? "border-danger-500/30" : "border-line")}>
            <span className={cx("h-6 w-6 rounded-md grid place-items-center shrink-0", t.kind === "success" ? "bg-ok-100 text-ok-600" : t.kind === "error" ? "bg-danger-100 text-danger-600" : "bg-steel-100 text-steel-600")}>
              {t.kind === "error" ? <IAlert size={13} /> : t.kind === "success" ? <ICheck size={13} /> : <IInfo size={13} />}
            </span>
            <p className="text-[12px] font-medium text-ink-700 leading-snug pt-0.5">{t.text}</p>
            <button onClick={() => setList((l) => l.filter((x) => x.id !== t.id))} className="ml-auto text-ink-300 hover:text-ink-700 transition-colors shrink-0"><IX size={12} /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
