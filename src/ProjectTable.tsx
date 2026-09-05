import { useMemo, useState } from "react";
import { Project, fmtNum } from "./data";
import { Bar, Empty, Pill, Pop, IconBtn, cx, useToast } from "./ui";
import { IColumns, IDownload, IChevD, ISearch } from "./icons";

const ALL_COLS = ["Client", "Contract Value", "Progress", "Budget", "Billing", "Manager", "Completion", "Status"] as const;
type Col = (typeof ALL_COLS)[number];

export default function ProjectTable({ projects }: { projects: Project[] }) {
  const [cols, setCols] = useState<Col[]>([...ALL_COLS]);
  const [colPop, setColPop] = useState(false);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ k: string; d: 1 | -1 }>({ k: "value", d: -1 });
  const toast = useToast();
  const PAGE = 6;

  const rows = useMemo(() => {
    let r = projects.filter((p) => (p.name + p.client + p.code + p.pm).toLowerCase().includes(q.toLowerCase()));
    r = [...r].sort((a, b) => {
      const get = (p: Project) => (sort.k === "value" ? p.contractValue : sort.k === "progress" ? p.progress : sort.k === "name" ? p.name.localeCompare(b.name) : 0);
      const va = sort.k === "name" ? a.name.localeCompare(b.name) : sort.k === "value" ? a.contractValue - b.contractValue : a.progress - b.progress;
      return va * sort.d;
    });
    return r;
  }, [projects, q, sort]);

  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const view = rows.slice(page * PAGE, page * PAGE + PAGE);
  const has = (c: Col) => cols.includes(c);

  const exportCsv = () => {
    const head = ["Code", "Project", "Client", "Contract Value (Cr)", "Progress %", "Budget Util %", "Billing", "Manager", "Completion", "Status"];
    const lines = rows.map((p) => [p.code, `"${p.name}"`, `"${p.client}"`, p.contractValue, p.progress, p.budgetUtil, p.billing, p.pm, p.end, p.status].join(","));
    const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "meridian-projects.csv";
    a.click();
    toast("success", `Exported ${rows.length} projects to Excel (CSV)`);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1 max-w-[230px]">
          <ISearch size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-300" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Filter projects…"
            className="w-full h-8 pl-7.5 pr-2 pl-8 rounded-md border border-line bg-canvas/60 text-[12px] outline-none focus:bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all placeholder:text-ink-300" />
        </div>
        <span className="text-[11px] text-ink-400 num hidden sm:block">{rows.length} of {projects.length}</span>
        <div className="ml-auto flex items-center gap-1.5">
          <div className="relative">
            <IconBtn label="Column settings" onClick={() => setColPop(!colPop)} active={colPop}><IColumns size={14} /></IconBtn>
            <Pop open={colPop} onClose={() => setColPop(false)} className="w-[190px] p-2.5">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-300 px-1 pb-1.5">Visible columns</p>
              {ALL_COLS.map((c) => (
                <label key={c} className="flex items-center gap-2 px-1 py-1.5 rounded hover:bg-canvas cursor-pointer text-[12px] text-ink-700 transition-colors">
                  <input type="checkbox" checked={has(c)} onChange={() => setCols((v) => v.includes(c) ? v.filter((x) => x !== c) : [...ALL_COLS.filter((a) => v.includes(a) || a === c)])}
                    className="h-3.5 w-3.5 accent-[#0c7264] cursor-pointer" />
                  {c}
                </label>
              ))}
            </Pop>
          </div>
          <IconBtn label="Export to Excel" onClick={exportCsv}><IDownload size={14} /></IconBtn>
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 flex-1">
        {view.length === 0 ? (
          <Empty title="No projects match" note="Adjust the filter text or clear the global project selection." icon={<ISearch size={18} />} />
        ) : (
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-[0.08em] text-ink-400">
                <th className="font-bold pb-2 pr-3 cursor-pointer select-none hover:text-ink-700 transition-colors" onClick={() => setSort((s) => ({ k: "name", d: s.d === 1 ? -1 : 1 }))}>Project {sort.k === "name" && (sort.d === 1 ? "↑" : "↓")}</th>
                {has("Client") && <th className="font-bold pb-2 pr-3">Client</th>}
                {has("Contract Value") && <th className="font-bold pb-2 pr-3 text-right cursor-pointer select-none hover:text-ink-700" onClick={() => setSort((s) => ({ k: "value", d: s.k === "value" && s.d === -1 ? 1 : -1 }))}>Contract {sort.k === "value" && (sort.d === -1 ? "↓" : "↑")}</th>}
                {has("Progress") && <th className="font-bold pb-2 pr-3 w-[150px]">Progress</th>}
                {has("Budget") && <th className="font-bold pb-2 pr-3 w-[120px]"><span className="tip" data-tip="Budget consumed vs earned value">Budget util.</span></th>}
                {has("Billing") && <th className="font-bold pb-2 pr-3">Billing</th>}
                {has("Manager") && <th className="font-bold pb-2 pr-3">Manager</th>}
                {has("Completion") && <th className="font-bold pb-2 pr-3">Expected</th>}
                {has("Status") && <th className="font-bold pb-2">Status</th>}
              </tr>
            </thead>
            <tbody>
              {view.map((p) => (
                <tr key={p.id} className="border-t border-line/80 hover:bg-brand-50/40 transition-colors group">
                  <td className="py-2.5 pr-3">
                    <p className="text-[12.5px] font-semibold text-ink-900 leading-tight group-hover:text-brand-700 transition-colors truncate max-w-[220px]">{p.name}</p>
                    <p className="text-[10.5px] text-ink-400 num mt-0.5">{p.code} · {p.manpower} manpower</p>
                  </td>
                  {has("Client") && <td className="py-2.5 pr-3 text-[12px] text-ink-500 whitespace-nowrap">{p.client}</td>}
                  {has("Contract Value") && <td className="py-2.5 pr-3 text-right num text-[12.5px] font-semibold text-ink-900 whitespace-nowrap">₹{fmtNum(p.contractValue, 1)} Cr</td>}
                  {has("Progress") && (
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1"><Bar value={p.progress} /></div>
                        <span className="num text-[11px] font-semibold text-ink-700 w-8 text-right">{p.progress}%</span>
                      </div>
                    </td>
                  )}
                  {has("Budget") && (
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1"><Bar value={p.budgetUtil} warn={p.budgetUtil > 85} /></div>
                        <span className={cx("num text-[11px] font-semibold w-8 text-right", p.budgetUtil > 85 ? "text-amber-600" : "text-ink-700")}>{p.budgetUtil}%</span>
                      </div>
                    </td>
                  )}
                  {has("Billing") && <td className="py-2.5 pr-3"><Pill value={p.billing} pulse={p.billing === "Overdue"} /></td>}
                  {has("Manager") && <td className="py-2.5 pr-3 text-[12px] text-ink-500 whitespace-nowrap">{p.pm}</td>}
                  {has("Completion") && <td className="py-2.5 pr-3 text-[12px] text-ink-500 num whitespace-nowrap">{p.end}</td>}
                  {has("Status") && <td className="py-2.5"><Pill value={p.status} pulse={p.status === "Delayed" || p.status === "Attention Required"} /></td>}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 mt-2 border-t border-line/80">
        <p className="text-[11px] text-ink-400 num">
          {rows.length === 0 ? "0 results" : `${page * PAGE + 1}–${Math.min((page + 1) * PAGE, rows.length)} of ${rows.length}`}
        </p>
        <div className="flex items-center gap-1">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)}
            className="h-7 px-2.5 rounded-md border border-line text-[11.5px] font-semibold text-ink-500 hover:border-line-strong hover:bg-canvas disabled:opacity-35 disabled:pointer-events-none transition-all active:scale-95">
            Prev
          </button>
          {Array.from({ length: pages }, (_, i) => (
            <button key={i} onClick={() => setPage(i)}
              className={cx("h-7 w-7 rounded-md text-[11.5px] num font-semibold transition-all active:scale-95", i === page ? "bg-brand-600 text-white" : "text-ink-500 hover:bg-canvas border border-line")}>
              {i + 1}
            </button>
          ))}
          <button disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}
            className="h-7 px-2.5 rounded-md border border-line text-[11.5px] font-semibold text-ink-500 hover:border-line-strong hover:bg-canvas disabled:opacity-35 disabled:pointer-events-none transition-all active:scale-95">
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
