import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { IX, ICheck, IInfo, IAlert, IChevD } from "./icons";

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(" ");

/* ── Reveal on scroll ────────────────────────────────────────── */
export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { el.classList.add("is-in"); io.disconnect(); } }),
      { threshold: 0.06 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cx("reveal", className)} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/* ── Count-up ────────────────────────────────────────────────── */
export function useCountUp(target: number, duration = 850) {
  const [v, setV] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const from = prev.current;
    prev.current = target;
    const start = performance.now();
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      setV(from + (target - from) * e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return v;
}

/* ── Widget card shell ───────────────────────────────────────── */
export function Widget({
  title, subtitle, actions, children, className, bodyClass,
}: {
  title: string; subtitle?: string; actions?: React.ReactNode;
  children: React.ReactNode; className?: string; bodyClass?: string;
}) {
  return (
    <section className={cx("bg-surface border border-line rounded-[10px] shadow-card flex flex-col min-w-0 transition-shadow duration-300 hover:shadow-lift", className)}>
      <header className="flex items-center gap-3 px-4 pt-3.5 pb-3 border-b border-line/80">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[13.5px] font-semibold text-ink-900 leading-tight truncate">{title}</h3>
          {subtitle && <p className="text-[11px] text-ink-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
      </header>
      <div className={cx("p-4 flex-1 min-w-0", bodyClass)}>{children}</div>
    </section>
  );
}

export function IconBtn({ label, onClick, children, active }: { label: string; onClick?: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-tip={label}
      className={cx(
        "tip tip-r h-7 w-7 grid place-items-center rounded-md border transition-all duration-150 active:scale-90",
        active ? "bg-brand-50 border-brand-200 text-brand-700" : "border-line text-ink-400 hover:text-ink-700 hover:border-line-strong hover:bg-canvas"
      )}
    >
      {children}
    </button>
  );
}

/* ── Status / pills ──────────────────────────────────────────── */
const STATUS_STYLE: Record<string, string> = {
  "On Track": "bg-ok-100 text-ok-600",
  Delayed: "bg-danger-100 text-danger-600",
  "Attention Required": "bg-amber-100 text-amber-600",
  Completed: "bg-steel-100 text-steel-600",
  Billed: "bg-ok-100 text-ok-600",
  Submitted: "bg-steel-100 text-steel-600",
  Pending: "bg-amber-100 text-amber-600",
  Overdue: "bg-danger-100 text-danger-600",
  Critical: "bg-danger-100 text-danger-600",
  Warning: "bg-amber-100 text-amber-600",
  Info: "bg-steel-100 text-steel-600",
  High: "bg-danger-100 text-danger-600",
  Medium: "bg-amber-100 text-amber-600",
  Low: "bg-steel-100 text-steel-600",
};
const STATUS_DOT: Record<string, string> = {
  "On Track": "bg-ok-600", Delayed: "bg-danger-500", "Attention Required": "bg-amber-500", Completed: "bg-steel-600",
  Billed: "bg-ok-600", Submitted: "bg-steel-600", Pending: "bg-amber-500", Overdue: "bg-danger-500",
  Critical: "bg-danger-500", Warning: "bg-amber-500", Info: "bg-steel-600", High: "bg-danger-500", Medium: "bg-amber-500", Low: "bg-steel-600",
};

export function Pill({ value, pulse }: { value: string; pulse?: boolean }) {
  return (
    <span className={cx("inline-flex items-center gap-1.5 h-[22px] px-2 rounded-full text-[11px] font-semibold whitespace-nowrap", STATUS_STYLE[value] ?? "bg-canvas text-ink-500")}>
      <span className={cx("h-1.5 w-1.5 rounded-full", STATUS_DOT[value] ?? "bg-ink-300", pulse && value !== "Completed" && "animate-pulse-dot")} />
      {value}
    </span>
  );
}

export function Delta({ value, goodWhenUp = true, suffix = "%" }: { value: number; goodWhenUp?: boolean; suffix?: string }) {
  const up = value >= 0;
  const good = up === goodWhenUp;
  return (
    <span className={cx("inline-flex items-center gap-0.5 num text-[11px] font-semibold", good ? "text-ok-600" : "text-danger-600")}>
      <svg width="9" height="9" viewBox="0 0 10 10" aria-hidden>
        <path d={up ? "M5 1l4 6H1z" : "M5 9L1 3h8z"} fill="currentColor" />
      </svg>
      {Math.abs(value).toFixed(1)}{suffix}
    </span>
  );
}

/* ── Sparkline ───────────────────────────────────────────────── */
export function Sparkline({ data, color = "#128574", w = 76, h = 26, fill = true }: { data: number[]; color?: string; w?: number; h?: number; fill?: boolean }) {
  const min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => [(i / (data.length - 1)) * (w - 2) + 1, h - 3 - ((v - min) / (max - min || 1)) * (h - 7)]);
  const line = pts.map((p) => p.join(",")).join(" ");
  return (
    <svg width={w} height={h} className="block" aria-hidden>
      {fill && <polygon points={`1,${h - 1} ${line} ${w - 1},${h - 1}`} fill={color} opacity={0.12} />}
      <polyline points={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r={2.2} fill={color} />
    </svg>
  );
}

/* ── Progress bar ────────────────────────────────────────────── */
export function Bar({ value, color = "var(--color-brand-500)", track = "#e8edf1", h = 6, warn }: { value: number; color?: string; track?: string; h?: number; warn?: boolean }) {
  const c = warn ? "var(--color-amber-500)" : value > 90 ? "var(--color-danger-500)" : color;
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ background: track, height: h }}>
      <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${Math.min(100, value)}%`, background: c }} />
    </div>
  );
}

/* ── Dropdown popover ────────────────────────────────────────── */
export function Pop({ open, onClose, children, className, align = "right" }: { open: boolean; onClose: () => void; children: React.ReactNode; className?: string; align?: "left" | "right" }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className={cx("absolute top-full mt-1.5 z-50 animate-pop bg-surface border border-line rounded-[10px] shadow-pop", align === "right" ? "right-0" : "left-0", className)}>
      {children}
    </div>
  );
}

/* ── Select ──────────────────────────────────────────────────── */
export function Select({ value, onChange, options, label, w = "auto" }: { value: string; onChange: (v: string) => void; options: string[]; label?: string; w?: string }) {
  return (
    <label className="flex items-center gap-2 min-w-0" style={{ width: w }}>
      {label && <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-400 shrink-0">{label}</span>}
      <span className="relative flex-1 min-w-0">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-8 pl-2.5 pr-7 rounded-md border border-line bg-surface text-[12.5px] font-medium text-ink-700 outline-none cursor-pointer hover:border-line-strong focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all appearance-none truncate"
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <IChevD size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
      </span>
    </label>
  );
}

/* ── Empty / skeleton ────────────────────────────────────────── */
export function Empty({ title, note, icon }: { title: string; note?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="h-11 w-11 rounded-full bg-canvas border border-dashed border-line-strong grid place-items-center text-ink-300 mb-3">
        {icon ?? <IInfo size={19} />}
      </div>
      <p className="text-[13px] font-semibold text-ink-700">{title}</p>
      {note && <p className="text-[12px] text-ink-400 mt-1 max-w-[260px]">{note}</p>}
    </div>
  );
}

export function Skel({ className }: { className?: string }) {
  return <div className={cx("rounded-md bg-[linear-gradient(100deg,#e9edf1_40%,#f4f6f8_50%,#e9edf1_60%)] bg-[length:200%_100%] animate-[shimmer_1.3s_infinite]", className)} style={{ animationName: "shimmer" }} />;
}

/* ── Toasts ──────────────────────────────────────────────────── */
interface Toast { id: number; kind: "success" | "error" | "info"; text: string }
const ToastCtx = createContext<(kind: Toast["kind"], text: string) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const push = useCallback((kind: Toast["kind"], text: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, kind, text }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2 no-print">
        {toasts.map((t) => (
          <div key={t.id} className="animate-toast flex items-center gap-2.5 bg-side-900 text-[#e6eef4] pl-3 pr-4 py-2.5 rounded-[10px] shadow-pop border border-side-700 max-w-[340px]">
            <span className={cx("h-5 w-5 rounded-full grid place-items-center shrink-0",
              t.kind === "success" && "bg-ok-600/25 text-[#7dd8a5]",
              t.kind === "error" && "bg-danger-500/25 text-[#f0a2a2]",
              t.kind === "info" && "bg-brand-500/25 text-[#8fd8ca]")}>
              {t.kind === "success" ? <ICheck size={12} /> : t.kind === "error" ? <IX size={12} /> : <IInfo size={12} />}
            </span>
            <p className="text-[12.5px] font-medium leading-snug">{t.text}</p>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
