/* ── Meridian ERP · module page toolkit ─────────────────────── */
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { cx, useToast, Empty } from "../ui";
import { IChevD, IColumns, IDownload, ISearch, IX, ICheck, IPlus } from "../icons";
import { printDocument } from "../print";
import { useERP } from "../store";

export const inputCls = "h-8 px-2.5 rounded-md border border-line bg-surface text-[12.5px] text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all placeholder:text-ink-300 w-full";
export const selectCls = inputCls + " appearance-none pr-7 bg-no-repeat cursor-pointer";

export function Btn({ kind = "ghost", sm, className, children, ...rest }: any) {
  return (
    <button
      className={cx(
        "inline-flex items-center justify-center gap-1.5 font-semibold rounded-md transition-all active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap",
        sm ? "h-7 px-2.5 text-[11.5px]" : "h-8 px-3.5 text-[12.5px]",
        kind === "primary" && "bg-brand-600 text-white hover:bg-brand-700 shadow-card",
        kind === "danger" && "border border-danger-500/40 text-danger-600 hover:bg-danger-100",
        kind === "ok" && "border border-ok-500/40 text-ok-600 hover:bg-ok-100",
        kind === "ghost" && "border border-line text-ink-700 hover:border-line-strong hover:bg-canvas",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function PageHead({ title, desc, crumbs, children }: { title: string; desc?: string; crumbs: string[]; children?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div className="min-w-0">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-ink-300 flex items-center gap-1.5 flex-wrap">
          {crumbs.map((c, i) => (
            <span key={c} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-ink-200">/</span>}
              <span className={i === crumbs.length - 1 ? "text-brand-700" : ""}>{c}</span>
            </span>
          ))}
        </p>
        <h1 className="font-display text-[19px] font-bold text-ink-900 tracking-tight mt-1">{title}</h1>
        {desc && <p className="text-[12px] text-ink-400 mt-0.5 max-w-[640px]">{desc}</p>}
      </div>
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  );
}

export function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { k: T; l: string; n?: number }[] }) {
  return (
    <div className="inline-flex items-center gap-0.5 bg-canvas border border-line rounded-lg p-0.5 overflow-x-auto max-w-full">
      {options.map((o) => (
        <button key={o.k} onClick={() => onChange(o.k)}
          className={cx("h-7.5 px-3 h-8 rounded-md text-[12px] font-semibold transition-all active:scale-[0.98] whitespace-nowrap flex items-center gap-1.5",
            value === o.k ? "bg-surface shadow-card text-ink-900" : "text-ink-400 hover:text-ink-700")}>
          {o.l}
          {o.n !== undefined && <span className={cx("num text-[10px] px-1.5 py-px rounded-full", value === o.k ? "bg-brand-50 text-brand-700" : "bg-line/60 text-ink-400")}>{o.n}</span>}
        </button>
      ))}
    </div>
  );
}

export function Field({ label, children, w }: { label: string; children: ReactNode; w?: string }) {
  return (
    <label className={cx("block", w)}>
      <span className="block text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

/* ── saved filters ──────────────────────────────────────────── */
interface SavedFilter { name: string; q: string; sel: Record<string, string> }
function useSavedFilters(key: string) {
  const [list, setList] = useState<SavedFilter[]>(() => {
    try { return JSON.parse(localStorage.getItem("mer.sf." + key) || "[]"); } catch { return []; }
  });
  const persist = (l: SavedFilter[]) => { setList(l); localStorage.setItem("mer.sf." + key, JSON.stringify(l)); };
  return { list, persist };
}

export function FilterBar({ pageKey, q, onQ, filters, right, placeholder }: {
  pageKey: string; q: string; onQ: (v: string) => void;
  filters: { key: string; label: string; value: string; options: string[]; onChange: (v: string) => void }[];
  right?: ReactNode; placeholder?: string;
}) {
  const toast = useToast();
  const { list, persist } = useSavedFilters(pageKey);
  const [openSf, setOpenSf] = useState(false);
  const sel = Object.fromEntries(filters.map((f) => [f.key, f.value]));
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <div className="relative w-[220px] max-w-full">
        <ISearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
        <input value={q} onChange={(e) => onQ(e.target.value)} placeholder={placeholder ?? "Search…"} className={cx(inputCls, "pl-8")} />
      </div>
      {filters.map((f) => (
        <div key={f.key} className="relative">
          <select value={f.value} onChange={(e) => f.onChange(e.target.value)} className={cx(selectCls, "w-auto min-w-[130px]")}>
            <option value="">{f.label}: All</option>
            {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
        </div>
      ))}
      <div className="relative">
        <Btn sm onClick={() => setOpenSf(!openSf)}>{list.length ? `Saved (${list.length})` : "Save filter"}</Btn>
        {openSf && (
          <div className="absolute z-30 top-9 left-0 w-[230px] bg-surface border border-line rounded-lg shadow-pop p-2 fade-up">
            {list.length > 0 && (
              <ul className="mb-2 max-h-[160px] overflow-auto">
                {list.map((sf) => (
                  <li key={sf.name} className="flex items-center gap-1.5 px-1.5 py-1.5 rounded hover:bg-canvas group cursor-pointer"
                    onClick={() => { onQ(sf.q); filters.forEach((f) => f.onChange(sf.sel[f.key] ?? "")); setOpenSf(false); toast("info", `Applied saved filter “${sf.name}”`); }}>
                    <span className="text-[12px] font-medium text-ink-700 truncate flex-1">{sf.name}</span>
                    <button className="opacity-0 group-hover:opacity-100 text-ink-300 hover:text-danger-600 transition-all"
                      onClick={(e) => { e.stopPropagation(); persist(list.filter((x) => x.name !== sf.name)); }}>
                      <IX size={11} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-1.5">
              <input id={`sf-${pageKey}`} placeholder="Filter name…" className={cx(inputCls, "h-7 text-[11.5px]")}
                onKeyDown={(e) => e.key === "Enter" && (document.getElementById(`sf-${pageKey}`) as HTMLInputElement)?.blur()} />
              <Btn sm kind="primary" onClick={() => {
                const el = document.getElementById(`sf-${pageKey}`) as HTMLInputElement;
                const name = el?.value?.trim();
                if (!name) return;
                persist([...list.filter((x) => x.name !== name), { name, q, sel }]);
                if (el) el.value = "";
                setOpenSf(false);
                toast("success", `Saved filter “${name}”`);
              }}><ICheck size={11} /> Save</Btn>
            </div>
          </div>
        )}
      </div>
      <div className="ml-auto flex items-center gap-2">{right}</div>
    </div>
  );
}

/* ── data table ─────────────────────────────────────────────── */
export interface Col { key: string; label: string; align?: "left" | "right" | "center"; w?: string; sort?: (r: any) => string | number; render?: (r: any) => ReactNode; csv?: (r: any) => string | number }

export function exportCSV(name: string, cols: Col[], rows: any[]) {
  const head = cols.map((c) => c.label);
  const lines = rows.map((r) => cols.map((c) => {
    const v = c.csv ? c.csv(r) : c.sort ? c.sort(r) : r[c.key];
    return typeof v === "string" && /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(","));
  const blob = new Blob([["\uFEFF", head.join(","), ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name + ".csv";
  a.click();
}

export function DataTable({ pageKey, rows, cols, idKey = "id", pageSize = 8, selectable, bulkActions, onRow, empty }: {
  pageKey: string; rows: any[]; cols: Col[]; idKey?: string; pageSize?: number;
  selectable?: boolean; bulkActions?: { label: string; on: (ids: string[]) => void }[];
  onRow?: (r: any) => void; empty?: { title: string; note: string };
}) {
  const toast = useToast();
  const { user } = useERP();
  const [sort, setSort] = useState<{ k: string; d: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem("mer.cols." + pageKey) || "[]"); } catch { return []; } });

  const visCols = cols.filter((c) => !hidden.includes(c.key));
  const printCols = visCols.filter((c) => c.key !== "act" && c.key !== "");
  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = cols.find((c) => c.key === sort.k);
    return [...rows].sort((a, b) => {
      const va = col?.sort ? col.sort(a) : a[sort.k];
      const vb = col?.sort ? col.sort(b) : b[sort.k];
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.d;
    });
  }, [rows, sort, cols]);

  const doPrint = () => printDocument({
    title: pageKey.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
    docNo: pageKey.toUpperCase().replace(/-/g, "") + "-" + new Date().toISOString().slice(0, 10).replace(/-/g, ""),
    date: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    orientation: printCols.length > 6 ? "landscape" : "portrait",
    cols: printCols.map((c) => ({ label: c.label, align: c.align ?? "left" })),
    rows: sorted.map((r) => printCols.map((c) => {
      const v = c.csv ? c.csv(r) : c.sort ? c.sort(r) : r[c.key];
      return typeof v === "number" ? v : typeof v === "string" ? v : String(v ?? "");
    })),
    generatedBy: user.name,
    note: "Filters applied at generation time are reflected in this document. Figures in ₹ as per the active financial year.",
  });

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const view = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);
  useEffect(() => { if (page > pages - 1) setPage(pages - 1); }, [pages, page]);

  const toggleCol = (k: string) => {
    const next = hidden.includes(k) ? hidden.filter((x) => x !== k) : [...hidden, k];
    setHidden(next);
    localStorage.setItem("mer.cols." + pageKey, JSON.stringify(next));
  };

  return (
    <div>
      {selectable && sel.length > 0 && (
        <div className="flex items-center gap-2 mb-2 px-3 h-9 rounded-lg bg-brand-50 border border-brand-200 fade-up">
          <span className="text-[12px] font-semibold text-brand-700 num">{sel.length} selected</span>
          <div className="ml-auto flex gap-1.5">
            {bulkActions?.map((b) => (
              <Btn key={b.label} sm onClick={() => { b.on(sel); setSel([]); }}>{b.label}</Btn>
            ))}
            <Btn sm onClick={() => setSel([])}>Clear</Btn>
          </div>
        </div>
      )}
      <div className="overflow-x-auto -mx-4 px-4">
        {view.length === 0 ? (
          <Empty title={empty?.title ?? "No records found"} note={empty?.note ?? "Try adjusting the filters, or create a new record."} />
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-[0.08em] text-ink-400">
                {selectable && (
                  <th className="w-8 pb-2 pr-2">
                    <input type="checkbox" className="h-3.5 w-3.5 accent-[#0c7264] cursor-pointer"
                      checked={view.every((r) => sel.includes(r[idKey]))}
                      onChange={(e) => setSel(e.target.checked ? [...new Set([...sel, ...view.map((r) => r[idKey])])] : sel.filter((id) => !view.some((r) => r[idKey] === id)))} />
                  </th>
                )}
                {visCols.map((c) => (
                  <th key={c.key} style={{ width: c.w }}
                    className={cx("font-bold pb-2 pr-3 whitespace-nowrap", c.align === "right" && "text-right", c.align === "center" && "text-center",
                      (c.sort || true) && "cursor-pointer select-none hover:text-ink-700 transition-colors")}
                    onClick={() => setSort((s) => (s?.k === c.key ? { k: c.key, d: s.d === 1 ? -1 : 1 } : { k: c.key, d: c.align === "right" ? -1 : 1 }))}>
                    {c.label}{sort?.k === c.key && <span className="text-brand-600 ml-1">{sort.d === 1 ? "↑" : "↓"}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {view.map((r) => (
                <tr key={r[idKey]} onClick={() => onRow?.(r)}
                  className={cx("border-t border-line/80 transition-colors", onRow && "cursor-pointer hover:bg-brand-50/40", selectable && sel.includes(r[idKey]) && "bg-brand-50/50")}>
                  {selectable && (
                    <td className="py-2.5 pr-2" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="h-3.5 w-3.5 accent-[#0c7264] cursor-pointer"
                        checked={sel.includes(r[idKey])}
                        onChange={() => setSel((v) => v.includes(r[idKey]) ? v.filter((x) => x !== r[idKey]) : [...v, r[idKey]])} />
                    </td>
                  )}
                  {visCols.map((c) => (
                    <td key={c.key} className={cx("py-2.5 pr-3 align-middle", c.align === "right" && "text-right", c.align === "center" && "text-center")}>
                      {c.render ? c.render(r) : <span className="text-[12.5px] text-ink-700">{r[c.key]}</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="flex items-center gap-2 pt-3 mt-1 border-t border-line/80">
        <p className="text-[11px] text-ink-400 num">{sorted.length === 0 ? "0 results" : `${safePage * pageSize + 1}–${Math.min((safePage + 1) * pageSize, sorted.length)} of ${sorted.length}`}</p>
        <div className="ml-auto flex items-center gap-1.5">
          <Btn sm onClick={() => { exportCSV("meridian-" + pageKey, visCols, sorted); toast("success", `Exported ${sorted.length} rows to Excel (CSV)`); }} disabled={!canExport(rows)}><IDownload size={12} /> Excel</Btn>
          <Btn sm onClick={doPrint}><IDownload size={12} /> PDF / Print</Btn>
          <div className="relative">
            <ColBtn hidden={hidden} cols={cols} onToggle={toggleCol} />
          </div>
          <div className="flex items-center gap-1 pl-1">
            <button disabled={safePage === 0} onClick={() => setPage((p) => p - 1)} className="h-7 px-2 rounded-md border border-line text-[11px] font-semibold text-ink-500 hover:bg-canvas disabled:opacity-35 transition-all active:scale-95">‹</button>
            <span className="num text-[11px] text-ink-500 px-1">{safePage + 1}/{pages}</span>
            <button disabled={safePage >= pages - 1} onClick={() => setPage((p) => p + 1)} className="h-7 px-2 rounded-md border border-line text-[11px] font-semibold text-ink-500 hover:bg-canvas disabled:opacity-35 transition-all active:scale-95">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
const canExport = (rows: any[]) => rows.length > 0;

function ColBtn({ cols, hidden, onToggle }: { cols: Col[]; hidden: string[]; onToggle: (k: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Btn sm onClick={() => setOpen(!open)}><IColumns size={12} /> Columns</Btn>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute z-30 right-0 bottom-9 w-[190px] bg-surface border border-line rounded-lg shadow-pop p-2 fade-up">
            {cols.map((c) => (
              <label key={c.key} className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-canvas cursor-pointer text-[12px] text-ink-700">
                <input type="checkbox" className="h-3.5 w-3.5 accent-[#0c7264]" checked={!hidden.includes(c.key)} onChange={() => onToggle(c.key)} />
                {c.label}
              </label>
            ))}
          </div>
        </>
      )}
    </>
  );
}

/* ── drawer & modal ─────────────────────────────────────────── */
export function Drawer({ open, onClose, title, sub, children, wide }: { open: boolean; onClose: () => void; title: string; sub?: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-side-900/45 backdrop-blur-[2px]" onClick={onClose} />
      <aside className={cx("absolute right-0 top-0 h-full bg-surface border-l border-line shadow-pop drawer-in overflow-y-auto", wide ? "w-full sm:w-[720px]" : "w-full sm:w-[520px]")}>
        <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-line px-5 py-4 flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="font-display font-bold text-[15px] text-ink-900 leading-tight">{title}</h2>
            {sub && <p className="text-[11.5px] text-ink-400 num mt-0.5">{sub}</p>}
          </div>
          <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded-md border border-line text-ink-400 hover:text-ink-900 hover:border-line-strong transition-all active:scale-90"><IX size={13} /></button>
        </div>
        <div className="p-5">{children}</div>
      </aside>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-side-900/45 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full max-w-[480px] bg-surface border border-line rounded-xl shadow-pop p-5 fade-up">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display font-bold text-[15px] text-ink-900">{title}</h3>
          <button onClick={onClose} className="h-7 w-7 grid place-items-center rounded-md border border-line text-ink-400 hover:text-ink-900 transition-all active:scale-90"><IX size={13} /></button>
        </div>
        {children}
        {footer && <div className="flex justify-end gap-2 mt-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "ok" | "warn" | "danger" }) {
  return (
    <div className="rounded-lg border border-line bg-canvas/50 px-3 py-2.5 min-w-[120px]">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-ink-400">{label}</p>
      <p className={cx("num text-[17px] font-semibold mt-0.5", tone === "ok" ? "text-ok-600" : tone === "warn" ? "text-amber-600" : tone === "danger" ? "text-danger-600" : "text-ink-900")}>{value}</p>
      {sub && <p className="text-[10px] text-ink-300 mt-0.5">{sub}</p>}
    </div>
  );
}

export function AddBtn({ label, onClick, disabled, tip }: { label: string; onClick: () => void; disabled?: boolean; tip?: string }) {
  return (
    <span className={cx("relative", disabled && "cursor-not-allowed")} data-tip={disabled ? tip : undefined}>
      <Btn kind="primary" onClick={onClick} disabled={disabled} className={cx(disabled && "tip")}>
        <IPlus size={13} /> {label}
      </Btn>
    </span>
  );
}
