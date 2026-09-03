import { useMemo, useState } from "react";
import { APPROVAL_TYPES, Approval, projectById, fmtMoney } from "./data";
import { Empty, Pill, cx, useToast } from "./ui";
import { ICheck, IX, IEye, IStamp, IClock } from "./icons";

export type Verdict = "approved" | "rejected";

export default function ApprovalCenter({
  items, verdicts, onVerdict,
}: {
  items: Approval[];
  verdicts: Record<string, Verdict>;
  onVerdict: (id: string, v: Verdict) => void;
}) {
  const [tab, setTab] = useState<string>("All");
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();

  const pending = items.filter((a) => !verdicts[a.id]);
  const tabs = useMemo(() => {
    const counts: Record<string, number> = { All: pending.length };
    APPROVAL_TYPES.forEach((t) => (counts[t] = pending.filter((a) => a.type === t).length));
    return counts;
  }, [pending]);

  const visible = pending.filter((a) => tab === "All" || a.type === tab).sort((a, b) => Number(!!b.urgent) - Number(!!a.urgent));

  const act = (a: Approval, v: Verdict) => {
    setBusy(a.id);
    window.setTimeout(() => {
      onVerdict(a.id, v);
      setBusy(null);
      toast(v === "approved" ? "success" : "error", `${a.type} ${a.ref} ${v === "approved" ? "approved" : "rejected"}${a.amount ? ` · ${fmtMoney(a.amount)}` : ""}`);
    }, 450);
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 -mx-1 px-1">
        {["All", ...APPROVAL_TYPES].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cx(
              "shrink-0 h-7 px-2.5 rounded-full text-[11.5px] font-semibold border transition-all active:scale-95",
              tab === t ? "bg-side-900 text-white border-side-900" : "bg-surface text-ink-500 border-line hover:border-line-strong hover:text-ink-700"
            )}>
            {t}
            <span className={cx("ml-1.5 num text-[10px]", tab === t ? "text-brand-200" : "text-ink-300")}>{tabs[t] ?? 0}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <Empty title={pending.length === 0 ? "All caught up" : `No pending ${tab.toLowerCase()} items`}
          note={pending.length === 0 ? "Every request in this queue has been actioned. New submissions will appear here." : "Try another approval type, or check back after the next submission cycle."}
          icon={<IStamp size={18} />} />
      ) : (
        <ul className="grid gap-2 xl:grid-cols-2 items-start">
          {visible.map((a) => {
            const p = projectById(a.projectId);
            const isBusy = busy === a.id;
            return (
              <li key={a.id} className={cx("rounded-lg border p-3 transition-all duration-200", a.urgent ? "border-danger-500/30 bg-danger-100/25" : "border-line bg-canvas/40 hover:border-line-strong", isBusy && "opacity-60")}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className={cx("h-8 w-8 rounded-lg grid place-items-center shrink-0", a.urgent ? "bg-danger-100 text-danger-600" : "bg-brand-50 text-brand-700 border border-brand-100")}>
                    <IStamp size={15} />
                  </span>
                  <div className="min-w-0 flex-1 basis-[180px]">
                    <p className="flex items-center gap-2 text-[12.5px] font-semibold text-ink-900">
                      <span className="num">{a.ref}</span>
                      <span className="text-ink-400 font-medium">· {a.type}</span>
                      {a.urgent && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide text-danger-600 bg-danger-100 border border-danger-500/25 rounded-full px-1.5 h-[17px]">
                          <IClock size={10} /> &gt;48h
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-ink-400 mt-0.5 truncate">
                      {p?.code} {p?.name} · by {a.by} · {a.dept}
                    </p>
                  </div>
                  {a.amount !== undefined && (
                    <p className="num text-[13px] font-semibold text-ink-900 shrink-0">{fmtMoney(a.amount)}</p>
                  )}
                  <span className="num text-[10.5px] text-ink-300 shrink-0 hidden sm:block">{a.date}</span>
                  <div className="flex items-center gap-1 ml-auto shrink-0">
                    <button onClick={() => act(a, "approved")} disabled={isBusy}
                      className="h-7 px-2.5 rounded-md bg-ok-600 text-white text-[11.5px] font-semibold inline-flex items-center gap-1 hover:bg-[#187a42] active:scale-95 transition-all disabled:opacity-50">
                      <ICheck size={12} /> Approve
                    </button>
                    <button onClick={() => act(a, "rejected")} disabled={isBusy}
                      className="h-7 px-2.5 rounded-md border border-danger-500/40 text-danger-600 text-[11.5px] font-semibold inline-flex items-center gap-1 hover:bg-danger-100 active:scale-95 transition-all disabled:opacity-50">
                      <IX size={12} /> Reject
                    </button>
                    <button onClick={() => toast("info", `Opening ${a.ref} details…`)}
                      className="h-7 w-7 grid place-items-center rounded-md border border-line text-ink-400 hover:text-ink-700 hover:border-line-strong hover:bg-surface active:scale-90 transition-all tip tip-r" data-tip="View details">
                      <IEye size={13} />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {Object.keys(verdicts).length > 0 && (
        <p className="mt-3 pt-2.5 border-t border-line/80 text-[11px] text-ink-400 num">
          {Object.values(verdicts).filter((v) => v === "approved").length} approved · {Object.values(verdicts).filter((v) => v === "rejected").length} rejected this session
        </p>
      )}
    </div>
  );
}
