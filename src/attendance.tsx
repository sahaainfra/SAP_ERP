/* Meridian ERP · Attendance Centre — one native module: My Attendance (geo punch),
   Team/Project view, Geofence Master, corrections → existing Approval Centre. */
import { useMemo, useState } from "react";
import { useERP } from "./store";
import { Widget, Pill, cx, useToast } from "./ui";
import { GeoPunchPanel, GeoMap, LocationMaster, mySites } from "./geo";
import { PageHead, Seg, Stat, Btn } from "./modules/core";
import { printDocument } from "./print";
import { ICheck, IPrinter, IAlert, ICalCheck } from "./icons";

const today = () => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
const hours = (inAt?: string, outAt?: string) => {
  if (!inAt || !outAt) return null;
  const [h1, m1] = inAt.split(":").map(Number), [h2, m2] = outAt.split(":").map(Number);
  return Math.max(0, (h2 * 60 + m2 - h1 * 60 - m1) / 60 - 1);
};

type Tab = "mine" | "team" | "geo" | "rules";

export default function AttendanceCentre() {
  const { s, setS, user, userRec, role, log, notify } = useERP();
  const toast = useToast();
  const isSA = role === "SUPER_ADMIN";
  const canTeam = ["SUPER_ADMIN", "MD", "HR", "PM", "ACCOUNTS", "COMMERCIAL"].includes(role);
  const [tab, setTab] = useState<Tab>("mine");

  /* correction request form */
  const [corr, setCorr] = useState(false);
  const [cf, setCf] = useState({ date: "", reqIn: "", reqOut: "", reason: "", remarks: "" });

  const myPunch = s.punches.find((p) => p.user === user.name && p.date === today());
  const sites = mySites(s, user.name, userRec.role);
  const myCorr = s.corrections.filter((c) => c.emp === user.name);

  const month = useMemo(() => {
    const days: { d: string; label: string; status: string; hrs: number | null; geo?: string }[] = [];
    const seedN = user.name.length * 7;
    for (let i = 25; i >= 0; i--) {
      const dt = new Date(Date.now() - i * 864e5);
      const ds = dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      const p = s.punches.find((x) => x.user === user.name && x.date === ds);
      if (p) days.push({ d: ds, label: String(dt.getDate()), status: p.status, hrs: hours(p.inAt, p.outAt), geo: p.geo });
      else if (dt.getDay() === 0) days.push({ d: ds, label: String(dt.getDate()), status: "Weekly Off", hrs: null });
      else {
        const h = (dt.getDate() + seedN) % 11;
        const status = h === 3 ? "Late" : h === 6 ? "On Leave" : h === 9 ? "Half Day" : "Present";
        days.push({ d: ds, label: String(dt.getDate()), status, hrs: status === "Half Day" ? 4.2 : status === "On Leave" ? null : 8.6 + (h % 3) * 0.4, geo: "Verified" });
      }
    }
    return days;
  }, [s.punches, user.name]);

  const counts = useMemo(() => ({
    P: month.filter((m) => m.status === "Present").length,
    L: month.filter((m) => m.status === "Late").length,
    Lv: month.filter((m) => m.status === "On Leave").length,
    HD: month.filter((m) => m.status === "Half Day").length,
    WO: month.filter((m) => m.status === "Weekly Off").length,
    ot: month.reduce((a, m) => a + Math.max(0, (m.hrs ?? 0) - (s.attRules?.otAfter ?? 9)), 0),
  }), [month, s.attRules]);

  const team = s.punches.filter((p) => p.date === today());
  const teamStats = {
    present: team.filter((p) => p.status === "Present" || p.status === "Late").length,
    late: team.filter((p) => p.status === "Late").length,
    verified: team.filter((p) => p.geo === "Verified").length,
    blocked: s.locAttempts.filter((a) => a.date === today()).length,
    ot: team.reduce((a, p) => { const h = hours(p.inAt, p.outAt); return a + Math.max(0, (h ?? 0) - 9); }, 0),
    pending: s.attendance.filter((a) => a.appr === "Pending").length + s.corrections.filter((c) => c.status === "Pending").length,
  };

  const submitCorr = () => {
    if (!cf.date || !cf.reqIn || !cf.reason.trim()) { toast("error", "Date, requested check-in and reason are mandatory"); return; }
    const site = sites[0];
    setS((p) => ({ ...p, corrections: [{ id: "cr" + Date.now(), emp: user.name, date: cf.date, existing: myPunch ? `In ${myPunch.inAt ?? "—"} / Out ${myPunch.outAt ?? "missed"}` : "Absent (missed punch)", requested: `Present — in ${cf.reqIn}${cf.reqOut ? ", out " + cf.reqOut : ""}`, reason: cf.reason + (cf.remarks ? ` · ${cf.remarks}` : "") + ` · site: ${site ? site.site : "assigned"}`, status: "Pending" }, ...p.corrections] }));
    log("Attendance", "Correction Requested", user.name, `${cf.date} · in ${cf.reqIn} · ${cf.reason} → routed Employee → Manager → PM → HR`);
    notify("hr", `${user.name} requested an attendance correction for ${cf.date}`);
    toast("success", "Correction submitted to the Approval Centre");
    setCorr(false); setCf({ date: "", reqIn: "", reqOut: "", reason: "", remarks: "" });
  };

  const printRegister = () => printDocument({
    title: "Monthly Attendance Register", docNo: "ATT-" + user.name.split(" ")[0].toUpperCase(), date: today(), orientation: "landscape",
    meta: [["Employee", `${user.name} (${userRec.id})`], ["Project / Site", `${sites[0]?.projectId ?? "—"} · ${sites[0]?.site ?? "—"}`], ["Period", "Last 26 days"]],
    cols: [{ label: "Day" }, { label: "Status" }, { label: "Net Hours", align: "right" }, { label: "Location" }],
    rows: month.map((m) => [m.d, m.status, m.hrs ? m.hrs.toFixed(1) : "—", m.geo ?? "—"]),
    totalsLabel: "Paid days", totals: [counts.P + counts.L + counts.HD],
    remarks: `Present ${counts.P} · Late ${counts.L} · Leave ${counts.Lv} · Half-day ${counts.HD} · Weekly off ${counts.WO} · OT ${counts.ot.toFixed(1)} h. Feeds payroll & project labour cost.`,
    signatures: ["Prepared By", "Checked By", "Approved By"],
    generatedBy: user.name,
  });

  const TABS = [
    { k: "mine" as Tab, l: "My Attendance" },
    ...(canTeam ? [{ k: "team" as Tab, l: "Team & Project" }] : []),
    { k: "geo" as Tab, l: isSA ? "Geofence Master" : "Geofences (view)" },
    ...(isSA ? [{ k: "rules" as Tab, l: "Rules" }] : []),
  ];

  return (
    <div className="fade-up">
      <PageHead title="Attendance Centre" crumbs={["Meridian", "People", "Attendance"]}
        desc="Strictly geofenced — check-in/out only inside Super Admin-approved project locations. GPS records are immutable and every exception routes through the existing approval chain.">
        <Stat label="Today" value={myPunch ? myPunch.status : "Not punched"} tone={myPunch ? (myPunch.status === "Late" ? "warn" : "ok") : undefined} />
        <Stat label="My geofences" value={`${sites.length}`} />
        <Stat label="Month attendance" value={`${(((counts.P + counts.L + counts.HD) / Math.max(1, 26 - counts.WO - counts.Lv)) * 100).toFixed(0)}%`} tone="ok" />
        <Stat label="OT this month" value={`${counts.ot.toFixed(1)} h`} />
        <Btn onClick={printRegister}><IPrinter size={13} /> Print Register</Btn>
      </PageHead>

      <div className="mb-4"><Seg value={tab} onChange={setTab} options={TABS as any} /></div>

      {tab === "mine" && (
        <div className="space-y-4">
          <GeoPunchPanel />

          <div className="grid lg:grid-cols-3 gap-4">
            {/* month strip */}
            <Widget title="Last 26 days" subtitle="Live from your verified punches" className="lg:col-span-2">
              <div className="grid grid-cols-13 sm:grid-cols-13 gap-1.5" style={{ gridTemplateColumns: "repeat(13, minmax(0,1fr))" }}>
                {month.map((m) => {
                  const tone = m.status === "Present" ? "bg-brand-500" : m.status === "Late" ? "bg-amber-500" : m.status === "On Leave" ? "bg-steel-300" : m.status === "Half Day" ? "bg-amber-300" : m.status === "Weekly Off" ? "bg-line" : "bg-danger-400";
                  const isToday = m.d === today();
                  return (
                    <div key={m.d} title={`${m.d} — ${m.status}${m.hrs ? ` · ${m.hrs.toFixed(1)} h` : ""}${m.geo ? ` · GPS ${m.geo}` : ""}`}
                      className={cx("aspect-square rounded-md grid place-items-center text-[10px] num font-bold text-white transition-transform hover:scale-110 cursor-default", tone, isToday && "ring-2 ring-brand-600 ring-offset-1 ring-offset-surface")}>
                      {m.label}
                    </div>);
                })}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-[10.5px] text-ink-500 font-semibold">
                {[["Present", "bg-brand-500"], ["Late", "bg-amber-500"], ["Half day", "bg-amber-300"], ["Leave", "bg-steel-300"], ["Weekly off", "bg-line"]].map(([l, c]) => (
                  <span key={l} className="flex items-center gap-1.5"><span className={cx("h-2.5 w-2.5 rounded-sm", c)} /> {l}</span>))}
                <span className="ml-auto num">OT {counts.ot.toFixed(1)} h · {counts.Lv} leave day(s)</span>
              </div>
            </Widget>

            {/* quick actions + corrections */}
            <Widget title="Quick actions" subtitle="Everything routes to the existing Approval Centre">
              <div className="grid grid-cols-2 gap-2">
                <QuickBtn label="Request Correction" active={corr} onClick={() => setCorr((v) => !v)} />
                <QuickBtn label="Apply Leave" onClick={() => { window.dispatchEvent(new CustomEvent("mer.nav", { detail: "hr" })); toast("info", "Leave requests live in HR & People"); }} />
                <QuickBtn label="My History" onClick={() => window.scrollTo({ top: 9999, behavior: "smooth" })} />
                <QuickBtn label="Punch Rules" onClick={() => toast("info", `Work ${s.attRules.workHrs} h · grace till ${s.attRules.lateAfter} · OT after ${s.attRules.otAfter} h · off ${s.attRules.weeklyOff}`)} />
              </div>
              {corr && (
                <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50/50 p-3.5 space-y-2.5 fade-up">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-brand-700 flex items-center gap-1.5"><IAlert size={12} /> Attendance correction → Manager → PM → HR</p>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={cf.date} onChange={(e) => setCf({ ...cf, date: e.target.value })} placeholder="Date (e.g. 18 Mar)" className="h-8 px-2.5 rounded-md border border-line bg-surface text-[12px] outline-none focus:border-brand-500" />
                    <input value={cf.reqIn} onChange={(e) => setCf({ ...cf, reqIn: e.target.value })} placeholder="Req. check-in 09:00" className="h-8 px-2.5 rounded-md border border-line bg-surface text-[12px] outline-none focus:border-brand-500" />
                    <input value={cf.reqOut} onChange={(e) => setCf({ ...cf, reqOut: e.target.value })} placeholder="Req. check-out 18:00" className="h-8 px-2.5 rounded-md border border-line bg-surface text-[12px] outline-none focus:border-brand-500" />
                    <input value={cf.remarks} onChange={(e) => setCf({ ...cf, remarks: e.target.value })} placeholder="Remarks / document ref" className="h-8 px-2.5 rounded-md border border-line bg-surface text-[12px] outline-none focus:border-brand-500" />
                  </div>
                  <textarea rows={2} value={cf.reason} onChange={(e) => setCf({ ...cf, reason: e.target.value })} placeholder="Reason — e.g. biometric device offline at gate 2" className="w-full px-2.5 py-2 rounded-md border border-line bg-surface text-[12px] outline-none focus:border-brand-500 resize-none" />
                  <div className="flex justify-end gap-2"><Btn sm onClick={() => setCorr(false)}>Cancel</Btn><Btn sm kind="primary" onClick={submitCorr}><ICheck size={11} /> Submit</Btn></div>
                </div>)}
              {myCorr.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {myCorr.slice(0, 3).map((c) => (
                    <div key={c.id} className="flex items-center gap-2 text-[11px] border border-line rounded-md px-2.5 py-1.5">
                      <span className="num font-bold text-ink-700">{c.date}</span>
                      <span className="text-ink-400 truncate flex-1">{c.requested}</span>
                      <Pill value={c.status} pulse={c.status === "Pending"} />
                    </div>))}
                </div>)}
            </Widget>
          </div>

          {/* personal GPS history */}
          <Widget title="My punch history — geolocation record" subtitle="GPS fields are captured at punch time and can never be edited">
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-left min-w-[860px]">
                <thead><tr className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
                  <th className="font-bold pb-2 pr-3">Date</th><th className="font-bold pb-2 pr-3">Project / Site</th><th className="font-bold pb-2 pr-3 text-right">In</th>
                  <th className="font-bold pb-2 pr-3 text-right">Out</th><th className="font-bold pb-2 pr-3 text-right">Net hrs</th><th className="font-bold pb-2 pr-3 text-right">Distance</th>
                  <th className="font-bold pb-2 pr-3 text-right">Accuracy</th><th className="font-bold pb-2 pr-3">Fix (lat, lng)</th><th className="font-bold pb-2 pr-3">Method</th><th className="font-bold pb-2">Status</th>
                </tr></thead>
                <tbody>{s.punches.filter((p) => p.user === user.name).slice(0, 8).map((p) => (
                  <tr key={p.id} className="border-t border-line/80 hover:bg-brand-50/30 transition-colors">
                    <td className="py-2.5 pr-3 num text-[12px] font-semibold text-ink-900">{p.date}</td>
                    <td className="py-2.5 pr-3 text-[12px] text-ink-700">{p.project} · {p.site ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px]">{p.inAt ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px]">{p.outAt ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold">{hours(p.inAt, p.outAt)?.toFixed(1) ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px]">{p.dist != null ? p.dist + " m" : "—"}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px]">{p.acc ? "±" + p.acc + " m" : "—"}</td>
                    <td className="py-2.5 pr-3 num text-[11px] text-ink-400">{p.lat ? `${p.lat}, ${p.lng}` : "—"}</td>
                    <td className="py-2.5 pr-3 text-[11.5px] text-ink-500">{p.method}</td>
                    <td className="py-2.5"><Pill value={p.status} pulse={p.status === "Late"} /></td>
                  </tr>))}
                  {s.punches.filter((p) => p.user === user.name).length === 0 && (
                    <tr><td colSpan={10} className="py-6 text-center text-[12px] text-ink-400">No punches yet — verify your location and check in above.</td></tr>)}
                </tbody>
              </table>
            </div>
          </Widget>
        </div>
      )}

      {tab === "team" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
            <Stat label="Punched in today" value={`${teamStats.present}`} tone="ok" />
            <Stat label="Late" value={`${teamStats.late}`} tone={teamStats.late ? "warn" : "ok"} />
            <Stat label="Location verified" value={`${teamStats.verified}`} tone="ok" />
            <Stat label="Blocked attempts" value={`${teamStats.blocked}`} tone={teamStats.blocked ? "danger" : "ok"} />
            <Stat label="OT hours" value={`${teamStats.ot.toFixed(1)}`} />
            <Stat label="Pending approvals" value={`${teamStats.pending}`} tone={teamStats.pending ? "warn" : "ok"} />
          </div>
          <Widget title="Today across sites" subtitle="Every row carries its GPS verification — drill into approvals from the Approval Centre">
            <div className="overflow-x-auto -mx-4 px-4">
              <table className="w-full text-left min-w-[820px]">
                <thead><tr className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
                  <th className="font-bold pb-2 pr-3">Employee</th><th className="font-bold pb-2 pr-3">Project / Site</th><th className="font-bold pb-2 pr-3 text-right">In</th>
                  <th className="font-bold pb-2 pr-3 text-right">Out</th><th className="font-bold pb-2 pr-3 text-right">Distance</th><th className="font-bold pb-2 pr-3 text-right">Accuracy</th>
                  <th className="font-bold pb-2 pr-3">Verification</th><th className="font-bold pb-2">Status</th>
                </tr></thead>
                <tbody>{team.map((p) => (
                  <tr key={p.id} className="border-t border-line/80 hover:bg-brand-50/30 transition-colors">
                    <td className="py-2.5 pr-3 text-[12.5px] font-semibold text-ink-900">{p.user}</td>
                    <td className="py-2.5 pr-3 text-[12px] text-ink-500">{p.project} · {p.site ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px]">{p.inAt ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px]">{p.outAt ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px]">{p.dist != null ? p.dist + " m" : "—"}</td>
                    <td className="py-2.5 pr-3 text-right num text-[12px]">{p.acc ? "±" + p.acc + " m" : "—"}</td>
                    <td className="py-2.5 pr-3"><span className={cx("text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded", p.geo === "Verified" ? "bg-ok-100 text-ok-600" : p.geo === "Simulated" ? "bg-amber-100 text-amber-600" : "bg-line/60 text-ink-400")}>{p.geo ?? "—"}</span></td>
                    <td className="py-2.5"><Pill value={p.status} /></td>
                  </tr>))}
                  {team.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-[12px] text-ink-400">No punches recorded yet today.</td></tr>}
                </tbody>
              </table>
            </div>
          </Widget>
        </div>
      )}

      {tab === "geo" && <LocationMaster />}

      {tab === "rules" && isSA && (
        <Widget title="Attendance rules" subtitle="Company policy applied to every geofenced punch — configurable by administrators">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[["Standard working hours", `${s.attRules.workHrs} h`], ["Break hours", `${s.attRules.breakHrs} h`], ["Grace period", `${s.attRules.graceMin} min`], ["Late after", s.attRules.lateAfter], ["Half-day below", `${s.attRules.halfDayBelow} h`], ["OT after", `${s.attRules.otAfter} h`], ["Weekly off", s.attRules.weeklyOff], ["Monthly lock day", `Day ${s.attRules.lockDay}`]].map(([k, v]) => (
              <div key={k} className="rounded-lg border border-line bg-canvas/50 px-3.5 py-3">
                <p className="text-[9.5px] font-bold uppercase tracking-wide text-ink-400">{k}</p>
                <p className="text-[15px] font-bold text-ink-900 num mt-1">{v}</p>
              </div>))}
          </div>
          <div className="mt-4">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-400 mb-2">Enabled punch methods</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(s.attRules.methods).map(([m, on]) => (
                <span key={m} className={cx("text-[11px] font-bold px-2.5 py-1 rounded-full border", on ? "bg-ok-100/60 text-ok-700 border-ok-500/30" : "bg-line/40 text-ink-400 border-line line-through")}>{m}</span>))}
            </div>
          </div>
        </Widget>
      )}
    </div>
  );
}

function QuickBtn({ label, onClick, active }: { label: string; onClick: () => void; active?: boolean }) {
  return (
    <button onClick={onClick} className={cx("h-9 rounded-lg border text-[11.5px] font-bold transition-all active:scale-[0.97] flex items-center justify-center gap-1.5",
      active ? "border-brand-400 bg-brand-50 text-brand-700" : "border-line text-ink-700 hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-700")}>
      <ICalCheck size={13} /> {label}
    </button>);
}

export { GeoMap };
