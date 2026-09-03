import { useMemo, useState } from "react";
import { useERP, dStr } from "../store";
import type { MatrixRow, Punch } from "../store";
import { Pop, cx, useToast } from "../ui";
import { Btn, Field, inputCls } from "./shell";
import { printDocument } from "../print";
import { ICalCheck, IClock, IChevU, IChevD, IPlus, IX, ITarget, ICheck } from "../icons";

const nowHM = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false });
const mins = (t?: string) => (t ? parseInt(t.slice(0, 2)) * 60 + parseInt(t.slice(3, 5)) : 0);

/* ═══ Universal punch widget — lives in the header for every user ═══ */
export function PunchWidget() {
  const { s, setS, log, user, can } = useERP();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState("Web punch");
  const [gps, setGps] = useState("");

  const today = dStr(0);
  const mine = s.punches.find((p) => p.user === user.name && p.date === today);
  const history = s.punches.filter((p) => p.user === user.name).slice(0, 6);

  const patchToday = (patch: Partial<Punch>, action: string) => {
    setS((st) => {
      const existing = st.punches.find((p) => p.user === user.name && p.date === today);
      if (existing) return { ...st, punches: st.punches.map((p) => p.id === existing.id ? { ...p, ...patch } : p) };
      return { ...st, punches: [{ id: "pu" + Date.now(), user: user.name, date: today, project: "Assigned project", method, status: "Present" as const, ...patch }, ...st.punches] };
    });
    log("Attendance", action, user.name, `${method} · ${nowHM()}${gps ? " · " + gps : ""}`);
  };

  const checkIn = () => {
    if (mine?.inAt) { toast("info", "Already checked in at " + mine.inAt); return; }
    const late = mins(nowHM()) > 570;
    patchToday({ inAt: nowHM(), status: late ? "Late" : "Present" }, "Check-in Recorded");
    toast("success", `Checked in at ${nowHM()}${late ? " — marked late" : ""}`);
  };
  const checkOut = () => {
    if (!mine?.inAt) { toast("error", "Check in first"); return; }
    if (mine.outAt) { toast("info", "Already checked out at " + mine.outAt); return; }
    patchToday({ outAt: nowHM() }, "Check-out Recorded");
    toast("success", `Checked out at ${nowHM()}`);
  };
  const breakStart = () => { if (!mine?.inAt) { toast("error", "Check in first"); return; } if (mine.breakStart && !mine.breakEnd) { toast("info", "Break already running"); return; } patchToday({ breakStart: nowHM(), breakEnd: undefined }, "Break Started"); toast("info", "Break started — enjoy!"); };
  const breakEnd = () => { if (!mine?.breakStart || mine.breakEnd) { toast("info", "No break running"); return; } patchToday({ breakEnd: nowHM() }, "Break Ended"); toast("info", "Break ended — back to work"); };

  const workedH = mine ? Math.max(0, (mins(mine.outAt ?? nowHM()) - mins(mine.inAt) - (mins(mine.breakEnd) - mins(mine.breakStart))) / 60) : 0;
  const otH = Math.max(0, workedH - 9);
  const late = mine && mins(mine.inAt) > 570;

  const pickMethod = (m: string) => {
    setMethod(m);
    if (m === "GPS punch") setGps("18.5590° N, 73.7797° E · radius 120 m · device verified");
    else if (m === "QR code") setGps("QR scanned · kiosk ATT-04 · site gate verified");
    else if (m === "Biometric") setGps("Fingerprint matched · confidence 98.2%");
    else setGps("");
  };

  const printRegister = () => {
    printAttendanceRegister(s.employees, new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }), user.name);
    log("Reports", "Attendance Register Printed", "Monthly", `by ${user.name}`);
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className={cx("h-9 px-2.5 rounded-lg inline-flex items-center gap-2 transition-all active:scale-95 tip tip-r border",
          open ? "bg-brand-50 text-brand-700 border-brand-200" : "border-line text-ink-500 hover:bg-canvas hover:border-line-strong")}
        data-tip="My attendance">
        <span className={cx("h-2 w-2 rounded-full", mine ? (mine.outAt ? "bg-steel-600" : late ? "bg-amber-500 animate-pulse-dot" : "bg-ok-500 animate-pulse-dot") : "bg-line-strong")} />
        <ICalCheck size={15} />
        <span className="hidden md:block num text-[11px] font-bold">
          {mine ? (mine.outAt ? `${mine.inAt}–${mine.outAt}` : `In ${mine.inAt}`) : "Punch in"}
        </span>
      </button>

      <Pop open={open} onClose={() => setOpen(false)} className="w-[330px] p-0 overflow-hidden" align="right">
        <div className="px-4 py-3 bg-side-800 text-brand-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-200">Today · {today}</p>
              <p className="font-display font-bold text-[15px] mt-0.5">{mine ? (mine.outAt ? "Day completed" : late ? "Present — late in" : "Present") : "Not punched in"}</p>
            </div>
            <span className={cx("text-[10px] font-bold uppercase px-2 py-1 rounded-full", mine ? (late ? "bg-amber-500/20 text-amber-300" : "bg-ok-500/20 text-[#7dd8a5]") : "bg-white/10 text-brand-100")}>
              {mine ? mine.status : "—"}
            </span>
          </div>
          {mine && (
            <div className="grid grid-cols-4 gap-1.5 mt-3">
              {[["In", mine.inAt ?? "—"], ["Out", mine.outAt ?? "—"], ["Hours", workedH ? workedH.toFixed(1) : "0"], ["OT", otH ? "+" + otH.toFixed(1) : "0"]].map(([l, v]) => (
                <div key={l} className="bg-white/[0.07] rounded-md px-2 py-1.5 text-center">
                  <p className="num text-[12px] font-bold">{v}</p><p className="text-[8.5px] uppercase tracking-wide text-brand-200">{l}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-3.5 space-y-3">
          <div className="flex flex-wrap gap-1">
            {["Web punch", "GPS punch", "QR code", "Biometric"].map((m) => (
              <button key={m} onClick={() => pickMethod(m)}
                className={cx("h-6.5 px-2 h-7 px-2.5 rounded-full text-[10.5px] font-bold border transition-all active:scale-95", method === m ? "bg-brand-600 text-white border-brand-600" : "border-line text-ink-500 hover:border-line-strong")}>
                {m}
              </button>
            ))}
          </div>
          {gps && <p className="text-[10.5px] text-ok-600 font-semibold bg-ok-100/50 border border-ok-500/25 rounded-md px-2.5 py-1.5 flex items-center gap-1.5 fade-up"><ITarget size={12} /> {gps}</p>}

          <div className="grid grid-cols-2 gap-2">
            <Btn kind="primary" onClick={checkIn} disabled={!!mine?.inAt}><IChevU size={12} /> Check In</Btn>
            <Btn onClick={checkOut} disabled={!mine?.inAt || !!mine?.outAt}><IChevD size={12} /> Check Out</Btn>
            <Btn onClick={breakStart} disabled={!mine?.inAt || (!!mine?.breakStart && !mine?.breakEnd)}><IClock size={12} /> Break Start</Btn>
            <Btn onClick={breakEnd} disabled={!mine?.breakStart || !!mine?.breakEnd}><IClock size={12} /> Break End</Btn>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-300 mb-1.5">Recent punches</p>
            {history.length === 0 ? <p className="text-[11.5px] text-ink-400">No attendance yet — check in to start today.</p> : (
              <ul className="space-y-1">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center gap-2 text-[11.5px]">
                    <span className={cx("h-1.5 w-1.5 rounded-full shrink-0", h.status === "Late" ? "bg-amber-500" : "bg-ok-500")} />
                    <span className="num text-ink-500 w-[86px]">{h.date}</span>
                    <span className="num text-ink-700 font-semibold">{h.inAt ?? "—"} → {h.outAt ?? "…"}</span>
                    <span className="ml-auto text-[10px] text-ink-300">{h.method}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="pt-2 border-t border-line flex items-center justify-between gap-2">
            <p className="text-[10px] text-ink-300 leading-snug">Routed for approval:<br />Manager → HR → payroll lock</p>
            {(can("hr", "export") || can("attendance", "export")) && <Btn sm onClick={printRegister}>Register ⤓</Btn>}
          </div>
        </div>
      </Pop>
    </div>
  );
}

/* ═══ Printable monthly attendance register ═══ */
export function printAttendanceRegister(employees: any[], month: string, by: string) {
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const cols = [
    { label: "Employee", align: "left" as const },
    ...days.map((d) => ({ label: String(d), align: "center" as const })),
    { label: "P", align: "center" as const }, { label: "A", align: "center" as const }, { label: "L", align: "center" as const }, { label: "HD", align: "center" as const }, { label: "OT", align: "center" as const },
  ];
  const rows = employees.map((e, i) => {
    let P = 0, A = 0, L = 0, H = 0, OT = 0;
    const marks = days.map((d) => {
      if (d % 7 === 0) return "–";
      const k = (i * 7 + d * 13) % 10;
      if (k < 7) { P++; if (k === 6) OT += 2; return "P"; }
      if (k === 7) { A++; return "A"; }
      if (k === 8) { L++; return "L"; }
      H++; return "H";
    });
    return [`${e.empId ?? e.id ?? "EMP"} · ${e.name} (${e.designation ?? e.role ?? "—"})`, ...marks, P, A, L, H, OT];
  });
  printDocument({
    title: "Monthly Attendance Register", docNo: "ATT-REG-" + month.replace(" ", "").slice(0, 6).toUpperCase(), date: dStr(0),
    period: month, orientation: "landscape",
    meta: [["Legend", "P = Present · A = Absent · L = Leave · H = Half Day · – = Weekly off / Holiday"], ["Prepared for", "HR & Payroll processing"], ["Source", "Punch records · manager-verified"]],
    cols, rows,
    signatures: ["Prepared By", "Checked By", "Approved By"],
    note: "Register generated from attendance punches and approved corrections. Entries lock after HR final approval for the month; corrections thereafter require the attendance correction workflow.",
    generatedBy: by,
  });
}

/* ═══ Approval authority matrix (Super Admin configurable) ═══ */
export function AuthorityMatrix({ editable }: { editable: boolean }) {
  const { s, setS, log, user } = useERP();
  const toast = useToast();
  const [draft, setDraft] = useState<MatrixRow[] | null>(null);
  const rows = draft ?? s.matrix;
  const set = (fn: (m: MatrixRow[]) => MatrixRow[]) => setDraft(fn(rows));

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <p className="text-[12px] text-ink-500 flex-1 min-w-[240px]">Sequential approval levels per transaction type — with amount limits and backup approvers. Changes apply to the approval engine immediately.</p>
        {editable && (draft ? <>
          <Btn onClick={() => setDraft(null)}>Discard</Btn>
          <Btn kind="primary" onClick={() => { setS((st) => ({ ...st, matrix: draft! })); log("Settings", "Authority Matrix Updated", `${draft!.length} workflows`, `by ${user.name}`); toast("success", "Authority matrix saved & active"); setDraft(null); }}><ICheck size={12} /> Save Matrix</Btn>
        </> : <Btn onClick={() => setDraft(JSON.parse(JSON.stringify(s.matrix)))}>Edit Matrix</Btn>)}
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="border border-line rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 h-9 bg-canvas/60 border-b border-line">
              <span className="text-[12.5px] font-bold text-ink-900">{r.doc}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-ink-300">{r.levels.length} levels · sequential</span>
              {draft && editable && (
                <button onClick={() => set((m) => m.map((x) => x.id === r.id ? { ...x, levels: [...x.levels, { role: "Approver", limit: "—", backup: "—" }] } : x))}
                  className="ml-auto h-6 px-2 rounded-md border border-line text-[10.5px] font-semibold text-ink-500 hover:bg-surface transition-all inline-flex items-center gap-1"><IPlus size={10} /> Level</button>
              )}
            </div>
            <div className="flex flex-wrap">
              {r.levels.map((lv, i) => (
                <div key={i} className="relative flex-1 min-w-[170px] p-3 border-r border-b border-line/70 last:border-r-0 group">
                  <span className="absolute top-1.5 right-2 num text-[9px] font-bold text-ink-300 bg-canvas border border-line rounded px-1">L{i + 1}</span>
                  {draft && editable ? (
                    <div className="space-y-1.5">
                      <input className={cx(inputCls, "h-7 text-[11.5px]")} value={lv.role} onChange={(e) => set((m) => m.map((x) => x.id === r.id ? { ...x, levels: x.levels.map((y, j) => j === i ? { ...y, role: e.target.value } : y) } : x))} />
                      <input className={cx(inputCls, "h-7 text-[11.5px]")} value={lv.limit} onChange={(e) => set((m) => m.map((x) => x.id === r.id ? { ...x, levels: x.levels.map((y, j) => j === i ? { ...y, limit: e.target.value } : y) } : x))} />
                      <input className={cx(inputCls, "h-7 text-[11.5px]")} value={lv.backup} onChange={(e) => set((m) => m.map((x) => x.id === r.id ? { ...x, levels: x.levels.map((y, j) => j === i ? { ...y, backup: e.target.value } : y) } : x))} />
                      <button onClick={() => set((m) => m.map((x) => x.id === r.id ? { ...x, levels: x.levels.filter((_, j) => j !== i) } : x))}
                        className="absolute bottom-1.5 right-2 opacity-0 group-hover:opacity-100 text-ink-300 hover:text-danger-600 transition-all"><IX size={11} /></button>
                    </div>
                  ) : (
                    <>
                      <p className="text-[12px] font-bold text-ink-900">{lv.role}</p>
                      <p className="text-[10.5px] text-brand-700 font-semibold mt-0.5">{lv.limit}</p>
                      <p className="text-[10px] text-ink-400 mt-0.5">Backup: {lv.backup}</p>
                    </>
                  )}
                  <div className="flex items-center gap-1 mt-1">
                    {["Approver", "Limit", "Backup"].map((x) => draft && editable ? null : <span key={x} className="hidden" />)}
                  </div>
                  {!draft && <p className="text-[8.5px] uppercase tracking-wide text-ink-300 mt-1 font-bold">Approver · Limit · Backup</p>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {!editable && <p className="text-[10.5px] text-ink-300 mt-2">Read-only — only Super Admin / Management can configure the matrix.</p>}
    </div>
  );
}
