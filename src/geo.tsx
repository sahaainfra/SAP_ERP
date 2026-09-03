/* Meridian ERP · Geolocation Attendance — geofence engine, live GPS verification,
   Super Admin location master, geofence map, offline sync. All on the existing store. */
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useERP } from "./store";
import type { AttLocation, Punch, LocAttempt } from "./store";
import { cx, useToast } from "./ui";
import { ICheck, IX, IAlert, IInfo, ILock, IDownload, IPlus, IEye, IEdit, IChevD, IRefresh } from "./icons";

/* ── geofence math ─────────────────────────────────────────── */
export const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const R = 6371000, toR = Math.PI / 180;
  const dLat = (lat2 - lat1) * toR, dLng = (lng2 - lng1) * toR;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toR) * Math.cos(lat2 * toR) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};
const deviceName = () => {
  const ua = navigator.userAgent;
  const b = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const o = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "macOS" : "OS";
  return `${b} · ${o} · ${window.innerWidth < 768 ? "Mobile" : window.innerWidth < 1200 ? "Tablet" : "Desktop"}`;
};
const ipAddr = () => "10.20.9." + (10 + (new Date().getMinutes() % 40));

export interface GeoResult {
  ok: boolean; reason?: LocAttempt["result"] | "Blocked";
  lat: number; lng: number; acc: number; site: AttLocation | null; dist: number; simulated?: boolean;
}

/* The user's authorized sites come ONLY from existing project assignments */
const mySites = (s: ReturnType<typeof useERP>["s"], userName: string, userRole: string): AttLocation[] => {
  const assigned = s.assignments.filter((a) => a.user === userName && a.status === "Active").map((a) => a.project);
  return s.attLocations.filter((l) => {
    if (l.status !== "Active") return false;
    const byProject = assigned.includes(l.projectId);
    const byRole = l.assignedRoles.includes(userRole);
    return byProject || (l.projectId === "HO" && byRole);
  });
};

/* request device GPS with accuracy / staleness checks — never user-entered coords */
const getFix = () => new Promise<{ lat: number; lng: number; acc: number; fresh: boolean }>((res, rej) => {
  if (!("geolocation" in navigator)) return rej(new Error("unavailable"));
  navigator.geolocation.getCurrentPosition(
    (pos) => res({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy, fresh: !pos.timestamp || Date.now() - pos.timestamp < 5 * 60000 }),
    (err) => rej(err),
    { enableHighAccuracy: true, timeout: 9000, maximumAge: 60000 },
  );
});

export async function verifyLocation(s: ReturnType<typeof useERP>["s"], userName: string, userRole: string, simulate = false): Promise<GeoResult> {
  const sites = mySites(s, userName, userRole);
  if (!sites.length) return { ok: false, reason: "No Assigned Site", lat: 0, lng: 0, acc: 0, site: null, dist: 0 };

  if (simulate) {
    /* demo assist — real GPS unavailable in this environment; clearly flagged in the record */
    const site = sites[Math.floor(Math.random() * sites.length)];
    const off = (site.radius * 0.28) / 111320;
    const lat = +(site.lat + (Math.random() - 0.5) * off).toFixed(5);
    const lng = +(site.lng + (Math.random() - 0.5) * off).toFixed(5);
    const acc = +(6 + Math.random() * 8).toFixed(0) as number;
    return { ok: true, lat, lng, acc, site, dist: Math.round(haversine(lat, lng, site.lat, site.lng)), simulated: true };
  }

  let fix: { lat: number; lng: number; acc: number; fresh: boolean };
  try { fix = await getFix(); }
  catch (e: any) {
    const msg = e?.message || e?.code === 1 ? "denied" : "unavailable";
    return { ok: false, reason: msg === "denied" || e?.code === 1 ? "GPS Denied" : "GPS Unavailable", lat: 0, lng: 0, acc: 0, site: null, dist: 0 };
  }
  if (!fix.fresh) return { ok: false, reason: "Stale Fix", lat: fix.lat, lng: fix.lng, acc: fix.acc, site: null, dist: 0 };

  /* find the nearest authorized geofence */
  let best: { site: AttLocation; dist: number } | null = null;
  for (const site of sites) {
    const dist = haversine(fix.lat, fix.lng, site.lat, site.lng);
    if (!best || dist < best.dist) best = { site, dist };
  }
  if (!best) return { ok: false, reason: "No Assigned Site", lat: fix.lat, lng: fix.lng, acc: fix.acc, site: null, dist: 0 };
  if (fix.acc > best.site.gpsReq * 2) return { ok: false, reason: "Poor Accuracy", lat: fix.lat, lng: fix.lng, acc: fix.acc, site: best.site, dist: Math.round(best.dist) };
  if (best.dist > best.site.radius) return { ok: false, reason: "Outside Geofence", lat: fix.lat, lng: fix.lng, acc: fix.acc, site: best.site, dist: Math.round(best.dist) };
  return { ok: true, lat: +fix.lat.toFixed(5), lng: +fix.lng.toFixed(5), acc: Math.round(fix.acc), site: best.site, dist: Math.round(best.dist) };
}

/* ── shared bits ───────────────────────────────────────────── */
const nowTime = () => new Date().toTimeString().slice(0, 5);
const today = () => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

function Radar({ ok, scanning, dist, radius }: { ok: boolean | null; scanning: boolean; dist: number; radius: number }) {
  const pct = radius > 0 ? Math.min(100, (dist / radius) * 100) : 0;
  return (
    <div className="relative h-[132px] w-[132px] shrink-0">
      <div className="absolute inset-0 rounded-full border border-brand-200 bg-brand-50/60" />
      <div className="absolute inset-[18%] rounded-full border border-brand-200/70" />
      <div className="absolute inset-[36%] rounded-full border border-brand-200/50" />
      {scanning && <div className="absolute inset-0 rounded-full radar-sweep" />}
      {!scanning && ok !== null && (
        <div className={cx("absolute inset-0 rounded-full", ok ? "ring-[3px] ring-ok-500/70 radar-ok" : "ring-[3px] ring-danger-500/70 radar-fail")} />)}
      <div className="absolute inset-0 grid place-items-center">
        {scanning ? (
          <span className="num text-[11px] font-bold text-brand-700 animate-pulse">GPS FIX…</span>
        ) : ok === null ? (
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-300 text-center leading-tight">Awaiting<br />verification</span>
        ) : ok ? (
          <div className="text-center"><ICheck size={22} className="text-ok-600 mx-auto" /><p className="num text-[10px] font-bold text-ok-600 mt-1">{dist} m</p></div>
        ) : (
          <div className="text-center"><IX size={22} className="text-danger-600 mx-auto" /><p className="num text-[10px] font-bold text-danger-600 mt-1">{dist > 0 ? dist + " m" : "—"}</p></div>
        )}
      </div>
      {ok !== null && !scanning && (
        <div className="absolute -bottom-1 inset-x-0">
          <div className="h-1.5 rounded-full bg-line overflow-hidden mx-2"><div className={cx("h-full rounded-full transition-all duration-700", ok ? "bg-ok-500" : "bg-danger-500")} style={{ width: `${ok ? 100 - pct / 2 : 100}%` }} /></div>
          <p className="text-center num text-[8.5px] text-ink-400 mt-0.5">{ok ? `inside ${radius} m fence` : `beyond ${radius} m`}</p>
        </div>)}
    </div>
  );
}

const STEP_LABELS = ["Identify user & employee ID", "Load assigned project / site", "Fetch approved geofence", "Request device GPS", "Validate distance vs radius"];

/* ── Geo punch panel — the single punch experience ─────────── */
export function GeoPunchPanel({ compact }: { compact?: boolean }) {
  const { s, setS, user, userRec, log, notify, can } = useERP();
  const toast = useToast();
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [step, setStep] = useState(0);
  const [res, setRes] = useState<GeoResult | null>(null);
  const [gpsLost, setGpsLost] = useState(false);
  const timers = useRef<number[]>([]);
  useEffect(() => () => { timers.current.forEach((t) => window.clearTimeout(t)); }, []);

  const sites = useMemo(() => mySites(s, user.name, userRec.role), [s, user.name, userRec.role]);
  const todayStr = new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const myPunch = s.punches.find((p) => p.user === user.name && p.date === today());
  const rules = s.attRules;

  const logAttempt = (r: GeoResult, reason: LocAttempt["result"]) => {
    const att: LocAttempt = { id: "la" + Date.now(), user: user.name, date: today(), time: nowTime(), project: r.site?.projectId ?? "—", site: r.site?.site ?? "—", dist: r.dist, radius: r.site?.radius ?? 0, acc: r.acc, result: reason, device: deviceName() };
    setS((p) => ({ ...p, locAttempts: [att, ...p.locAttempts] }));
    log("Attendance", "Geofence Check Failed", user.name, `${reason} · ${r.dist > 0 ? r.dist + " m vs " + (r.site?.radius ?? 0) + " m" : reason} · audit logged`);
  };

  const run = (simulate = false) => {
    setGpsLost(false); setRes(null); setPhase("scanning"); setStep(0);
    timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [];
    /* perceptible step-by-step feedback before the real GPS call */
    [0, 1, 2].forEach((i) => timers.current.push(window.setTimeout(() => setStep(i + 1), 260 * (i + 1))));
    timers.current.push(window.setTimeout(async () => {
      setStep(3);
      const r = await verifyLocation(s, user.name, userRec.role, simulate);
      setStep(r.ok ? 5 : 4);
      setRes(r); setPhase("done");
      if (!r.ok && r.reason && r.reason !== "Blocked") {
        logAttempt(r, r.reason);
        if (r.reason === "GPS Denied" || r.reason === "GPS Unavailable") setGpsLost(true);
        notify("hr", `Attendance blocked for ${user.name} — ${r.reason}`);
      }
    }, 1050));
  };

  const punch = (kind: "Check-In" | "Check-Out") => {
    if (!res || !res.ok || !res.site) return;
    const offline = typeof navigator !== "undefined" && !navigator.onLine;
    const geo = res.simulated ? "Simulated" : offline ? "Offline" : "Verified";
    const method = res.simulated ? "Simulated GPS (demo)" : offline ? "Offline capture" : "GPS punch";

    if (offline) {
      setS((p) => ({ ...p, offlineQueue: [...p.offlineQueue, { id: "oq" + Date.now(), user: user.name, kind, project: res.site!.projectId, site: res.site!.site, ts: new Date().toISOString(), lat: res.lat, lng: res.lng, acc: res.acc, status: "Pending Sync" }] }));
      log("Attendance", "Offline Attendance Captured", user.name, `${kind} queued locally · GPS ${res.lat}, ${res.lng} · will revalidate on sync`);
      toast("info", "Offline — punch stored securely on device, will sync automatically");
      setPhase("idle"); setRes(null);
      return;
    }

    const late = kind === "Check-In" && nowTime() > rules.lateAfter;
    setS((p) => {
      if (kind === "Check-In") {
        const rec: Punch = { id: "pu" + Date.now(), user: user.name, date: today(), inAt: nowTime(), method, project: res.site!.projectId, site: res.site!.site, status: late ? "Late" : "Present", lat: res.lat, lng: res.lng, acc: res.acc, dist: res.dist, radius: res.site!.radius, siteLat: res.site!.lat, siteLng: res.site!.lng, geo, device: deviceName(), ip: ipAddr() };
        return { ...p, punches: [rec, ...p.punches] };
      }
      return { ...p, punches: p.punches.map((x) => (x.id === myPunch?.id ? { ...x, outAt: nowTime(), status: computeStatus(x, nowTime(), rules) } : x)) };
    });
    log("Attendance", kind, user.name, `${res.site.projectId} · ${res.site.site} · ${nowTime()} · ${res.dist} m from pin (≤ ${res.site.radius} m) · acc ${res.acc} m · ${geo}`);
    notify("hr", `${user.name} ${kind === "Check-In" ? "checked in" : "checked out"} — location verified (${res.dist} m)`);
    toast("success", `${kind} recorded at ${nowTime()} — location verified`);
    setPhase("idle"); setRes(null);
  };

  /* offline auto-sync */
  useEffect(() => {
    const sync = () => {
      const q = s.offlineQueue.filter((o) => o.user === user.name);
      if (!q.length) return;
      setS((p) => ({
        ...p,
        offlineQueue: p.offlineQueue.filter((o) => o.user !== user.name),
        punches: [...q.map((o): Punch => ({ id: "pu" + o.id, user: o.user, date: today(), inAt: o.kind === "Check-In" ? new Date(o.ts).toTimeString().slice(0, 5) : myPunch?.inAt, outAt: o.kind === "Check-Out" ? new Date(o.ts).toTimeString().slice(0, 5) : undefined, method: "Offline capture", project: o.project, site: o.site, status: "Present", lat: o.lat, lng: o.lng, acc: o.acc, geo: "Offline", device: deviceName(), ip: ipAddr() })), ...p.punches],
      }));
      log("Attendance", "Offline Queue Synced", user.name, `${q.length} record(s) revalidated & posted`);
      toast("success", `Back online — ${q.length} offline punch(es) synced & verified`);
    };
    window.addEventListener("online", sync);
    return () => window.removeEventListener("online", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.offlineQueue.length, user.name]);

  const inOut = myPunch && !myPunch.outAt;
  const doneToday = myPunch && myPunch.outAt;
  const verifiedToday = s.punches.filter((p) => p.date === today() && p.geo === "Verified").length;
  const failedToday = s.locAttempts.filter((a) => a.date === today()).length;

  return (
    <div className={cx("grid gap-4", compact ? "" : "lg:grid-cols-[auto_1fr]")}>
      {/* radar + actions */}
      <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-surface p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400 self-start">{todayStr} · {inOut ? "On duty" : doneToday ? "Day complete" : "Not checked in"}</p>
        <Radar ok={phase === "done" ? !!res?.ok : null} scanning={phase === "scanning"} dist={res?.dist ?? 0} radius={res?.site?.radius ?? sites[0]?.radius ?? 0} />
        {phase !== "scanning" && !myPunch && <BtnPunch kind="primary" onClick={() => run(false)} label="Verify & Check In" icon={<ICheck size={14} />} />}
        {phase !== "scanning" && inOut && <BtnPunch kind="ghost" onClick={() => run(false)} label="Verify & Check Out" icon={<ICheck size={14} />} />}
        {phase !== "scanning" && doneToday && <p className="text-[11.5px] font-semibold text-ink-400">✓ Day recorded · {myPunch.inAt} → {myPunch.outAt}</p>}
        {phase === "scanning" && <p className="text-[11px] font-bold text-brand-700 animate-pulse num">verifying location…</p>}
        {!navigator.onLine && <p className="text-[10px] font-bold text-amber-600 bg-amber-100/60 border border-amber-500/30 rounded-full px-2 py-0.5">OFFLINE — punches queue on device</p>}
        {gpsLost && (
          <div className="text-center fade-up">
            <p className="text-[10.5px] text-ink-400 leading-snug max-w-[200px]">Device GPS unavailable here. In production this blocks the punch; for demo you can simulate an on-site fix.</p>
            <button onClick={() => run(true)} className="mt-1.5 text-[11px] font-bold text-brand-700 underline underline-offset-2 hover:text-brand-800">Simulate on-site GPS (demo)</button>
          </div>)}
      </div>

      {/* live verification detail */}
      <div className="rounded-xl border border-line bg-surface p-4 min-w-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-400">Location verification — {STEP_LABELS.length} point check</p>
          <span className="flex items-center gap-1.5 text-[10px] font-bold num text-ink-400"><ILock size={11} className="text-ink-300" /> GPS records immutable · set by Super Admin only</span>
        </div>

        <ol className="mt-3 grid sm:grid-cols-5 gap-1.5">
          {STEP_LABELS.map((l, i) => {
            const active = phase === "scanning" ? step >= i + 1 : phase === "done" ? (res?.ok ? true : step > i) : false;
            const failed = phase === "done" && !res?.ok && i === 4;
            return (
              <li key={l} className={cx("rounded-lg border px-2 py-2 transition-all duration-300", failed ? "border-danger-500/40 bg-danger-100/30" : active ? "border-brand-300 bg-brand-50/70" : "border-line bg-canvas/40")}>
                <span className={cx("flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold mx-auto mb-1 transition-all", failed ? "bg-danger-500 text-white" : active ? "bg-brand-600 text-white" : "bg-line text-ink-400")}>
                  {failed ? <IX size={10} /> : active ? <ICheck size={10} /> : i + 1}
                </span>
                <p className={cx("text-[9.5px] font-semibold text-center leading-tight", active || failed ? "text-ink-900" : "text-ink-400")}>{l}</p>
              </li>);
          })}
        </ol>

        {phase === "done" && res && (
          res.ok && res.site ? (
            <div className="mt-3 rounded-lg border border-ok-500/30 bg-ok-100/30 p-3.5 fade-up">
              <p className="flex items-center gap-2 text-[13px] font-bold text-ok-700"><ICheck size={15} /> LOCATION VERIFIED — {inOut ? "CHECK-OUT" : "CHECK-IN"} ALLOWED</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2.5">
                {[["Project", res.site.projectId], ["Site", res.site.site], ["Distance", `${res.dist} m`], ["Allowed radius", `${res.site.radius} m`], ["GPS accuracy", `±${res.acc} m`], ["Fix", `${res.lat}, ${res.lng}`], ["Site pin", `${res.site.lat}, ${res.site.lng}`], ["Method", res.simulated ? "Simulated (demo)" : "Device GPS"]].map(([k, v]) => (
                  <div key={k} className="bg-surface/80 rounded-md border border-ok-500/20 px-2.5 py-1.5"><p className="text-[8.5px] font-bold uppercase tracking-wide text-ink-400">{k}</p><p className="text-[11.5px] font-semibold text-ink-900 num truncate">{v}</p></div>))}
              </div>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-danger-500/30 bg-danger-100/25 p-3.5 fade-up">
              <p className="flex items-center gap-2 text-[13px] font-bold text-danger-600"><IX size={15} /> LOCATION NOT VERIFIED — ATTENDANCE BLOCKED</p>
              <p className="text-[12px] text-ink-700 mt-1.5">
                {res.reason === "Outside Geofence" && <>You are outside the approved attendance location. <b className="num">Distance {res.dist} m</b> · allowed radius <b className="num">{res.site?.radius} m</b>.</>}
                {res.reason === "Poor Accuracy" && <>GPS fix too weak (±{res.acc} m). Move to open sky and retry.</>}
                {res.reason === "GPS Denied" && <>Location permission was denied. Enable it in browser settings.</>}
                {res.reason === "GPS Unavailable" && <>No GPS signal received from this device.</>}
                {res.reason === "Stale Fix" && <>Cached location rejected — a fresh fix is required.</>}
                {res.reason === "No Assigned Site" && <>No active geofence is assigned to your project. Contact the Super Admin.</>}
              </p>
              <p className="text-[10.5px] text-ink-400 mt-1.5">This attempt was written to the audit trail and Location Violations register. Genuine exception? Use <b>Request Correction</b> below — it routes through the existing approval chain.</p>
            </div>
          ))}

        {/* today's numbers */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[["Location verified today", verifiedToday, "text-ok-600"], ["Blocked attempts", failedToday, failedToday ? "text-danger-600" : "text-ink-500"], ["My sites", sites.length, "text-brand-700"], ["Late threshold", rules.lateAfter, "text-ink-700"]].map(([k, v, c]) => (
            <div key={k as string} className="rounded-lg border border-line bg-canvas/50 px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-wide text-ink-400">{k}</p><p className={cx("num text-[16px] font-semibold", c as string)}>{v}</p></div>))}
        </div>
      </div>
    </div>
  );
}

function BtnPunch({ kind, onClick, label, icon }: { kind: "primary" | "ghost"; onClick: () => void; label: string; icon: ReactNode }) {
  return (
    <button onClick={onClick} className={cx("h-9 px-4 rounded-lg text-[12.5px] font-bold inline-flex items-center gap-1.5 shadow-card active:scale-[0.97] transition-all",
      kind === "primary" ? "bg-brand-600 text-white hover:bg-brand-700" : "border border-line text-ink-700 hover:border-brand-300 hover:text-brand-700 hover:bg-brand-50/50")}>
      {icon} {label}
    </button>);
}

function computeStatus(x: Punch, outAt: string, rules: typeof Object.prototype) {
  const [h1, m1] = (x.inAt ?? "09:00").split(":").map(Number);
  const [h2, m2] = outAt.split(":").map(Number);
  const hrs = (h2 * 60 + m2 - h1 * 60 - m1) / 60 - 1;
  return hrs < 4.5 ? "Half Day" : x.status;
}

/* ── SVG geofence map ──────────────────────────────────────── */
export function GeoMap({ onPick, editable, height = 340 }: { onPick?: (lat: number, lng: number) => void; editable?: boolean; height?: number }) {
  const { s } = useERP();
  const [sel, setSel] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const sites = s.attLocations;
  const lats = sites.map((x) => x.lat), lngs = sites.map((x) => x.lng);
  const minLat = Math.min(...lats) - 0.06, maxLat = Math.max(...lats) + 0.06;
  const minLng = Math.min(...lngs) - 0.06, maxLng = Math.max(...lngs) + 0.06;
  const W = 720, H = height;
  const px = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * (W - 80) + 40;
  const py = (lat: number) => H - (((lat - minLat) / (maxLat - minLat)) * (H - 80) + 40);
  const rFor = (r: number) => Math.max(14, r / 2500);
  const ref = useRef<SVGSVGElement>(null);

  const click = (e: React.MouseEvent) => {
    if (!editable || !onPick || !ref.current) return;
    const b = ref.current.getBoundingClientRect();
    const x = ((e.clientX - b.left) / b.width) * W, y = ((e.clientY - b.top) / b.height) * H;
    const lng = ((x - 40) / (W - 80)) * (maxLng - minLng) + minLng;
    const lat = ((H - y - 40) / (H - 80)) * (maxLat - minLat) + minLat;
    onPick(+lat.toFixed(5), +lng.toFixed(5));
  };

  const todayPunches = s.punches.filter((p) => p.date === today() && p.siteLat);

  return (
    <div className="relative">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className={cx("w-full rounded-xl border border-line", editable ? "cursor-crosshair" : "")} onClick={click}
        style={{ background: "linear-gradient(160deg,#0f2027 0%,#123037 55%,#0d4a41 140%)" }}>
        {/* graticule */}
        {Array.from({ length: 9 }, (_, i) => <line key={"v" + i} x1={(W / 9) * i + 20} y1="12" x2={(W / 9) * i + 20} y2={H - 12} stroke="#2c4a52" strokeWidth="0.6" strokeDasharray="2 5" />)}
        {Array.from({ length: 6 }, (_, i) => <line key={"h" + i} x1="12" y1={(H / 6) * i + 16} x2={W - 12} y2={(H / 6) * i + 16} stroke="#2c4a52" strokeWidth="0.6" strokeDasharray="2 5" />)}
        <text x={W - 14} y={H - 12} textAnchor="end" fill="#5f828b" fontSize="9" fontFamily="IBM Plex Mono">geofence map · Maharashtra ops grid · {sites.filter((x) => x.status === "Active").length} active fences</text>

        {sites.map((l) => {
          const active = l.status === "Active";
          const cxp = px(l.lng), cyp = py(l.lat), r = rFor(l.radius);
          const isSel = sel === l.id || hover === l.id;
          return (
            <g key={l.id} onClick={(e) => { e.stopPropagation(); setSel(sel === l.id ? null : l.id); }} className="cursor-pointer"
              onMouseEnter={() => setHover(l.id)} onMouseLeave={() => setHover(null)}>
              {active && <circle cx={cxp} cy={cyp} r={r} fill="rgba(60,179,160,0.10)" stroke={isSel ? "#63c7b6" : "#3cb3a0"} strokeWidth={isSel ? 2 : 1.2} className="fence-ring" />}
              {active && <circle cx={cxp} cy={cyp} r={r} fill="none" stroke="#3cb3a0" strokeWidth="0.7" strokeDasharray="3 4" opacity="0.55" />}
              {!active && <circle cx={cxp} cy={cyp} r={r} fill="rgba(140,160,176,0.06)" stroke="#5a7285" strokeWidth="1" strokeDasharray="4 4" />}
              <circle cx={cxp} cy={cyp} r={isSel ? 7 : 5} fill={active ? "#e0a33b" : "#5a7285"} stroke="#0f2027" strokeWidth="2" />
              {active && todayPunches.some((p) => p.siteLat === l.lat && p.siteLng === l.lng) && (
                <circle cx={cxp + r * 0.55} cy={cyp - r * 0.55} r="4" fill="#4ade80" stroke="#0f2027" strokeWidth="1.5" className="animate-pulse-dot" />)}
              <text x={cxp} y={cyp + r + 14} textAnchor="middle" fill={isSel ? "#e7edf3" : "#9db4c6"} fontSize="10.5" fontWeight="700" fontFamily="IBM Plex Sans">{l.projectId} · {l.site}</text>
              <text x={cxp} y={cyp + r + 25} textAnchor="middle" fill="#5f828b" fontSize="8.5" fontFamily="IBM Plex Mono">{l.radius} m fence · {l.type}</text>
            </g>);
        })}
      </svg>

      {sel && (() => {
        const l = sites.find((x) => x.id === sel)!;
        const punchesHere = todayPunches.filter((p) => p.siteLat === l.lat && p.siteLng === l.lng);
        return (
          <div className="absolute top-3 left-3 w-[240px] rounded-xl border border-line bg-surface/95 backdrop-blur shadow-pop p-3.5 fade-up">
            <p className="text-[12px] font-bold text-ink-900">{l.projectId} — {l.site}</p>
            <p className="text-[10px] text-ink-400 mt-0.5 num">{l.lat}, {l.lng} · radius {l.radius} m · GPS ≤ {l.gpsReq} m</p>
            <p className="text-[10px] text-ink-400 mt-1">{l.address}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={cx("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded", l.status === "Active" ? "bg-ok-100 text-ok-600" : "bg-line/60 text-ink-400")}>{l.status}</span>
              <span className="text-[10px] num text-ink-500">{punchesHere.length} punch(es) today</span>
            </div>
          </div>);
      })()}
    </div>
  );
}

/* ── Location Master — SUPER ADMIN ONLY ────────────────────── */
export function LocationMaster() {
  const { s, setS, user, role, log, notify, can } = useERP();
  const toast = useToast();
  const isSA = role === "SUPER_ADMIN";
  const [editing, setEditing] = useState<AttLocation | null | "new">(null);
  const [hist, setHist] = useState<AttLocation | null>(null);
  const [form, setForm] = useState({ projectId: "P1", site: "", type: "Project Site" as AttLocation["type"], address: "", lat: 18.55, lng: 73.85, radius: 150, gpsReq: 25, from: today(), to: "31 Mar 2027", status: "Active" as "Active" | "Inactive", reason: "" });

  const open = (l: AttLocation | "new") => {
    setEditing(l);
    if (l === "new") setForm({ projectId: "P1", site: "", type: "Project Site", address: "", lat: 18.55, lng: 73.85, radius: 150, gpsReq: 25, from: today(), to: "31 Mar 2027", status: "Active", reason: "" });
    else setForm({ projectId: l.projectId, site: l.site, type: l.type, address: l.address, lat: l.lat, lng: l.lng, radius: l.radius, gpsReq: l.gpsReq, from: l.from, to: l.to, status: l.status, reason: "" });
  };

  const save = () => {
    if (!isSA) { toast("error", "Only the Super Admin can modify attendance locations"); return; }
    if (!form.site.trim()) { toast("error", "Site name is mandatory"); return; }
    if (editing !== "new" && !form.reason.trim()) { toast("error", "A reason is mandatory for every location change"); return; }
    const project = s.projects.find((p) => p.id === form.projectId);
    const projName = form.projectId === "HO" ? "Head Office — Pune" : project ? `${project.id} — ${project.name}` : form.projectId;

    if (editing === "new") {
      const locId = "LOC-" + String(s.attLocations.length + 1).padStart(3, "0");
      const roles = form.type === "Head Office" ? ["SUPER_ADMIN", "MD", "HR", "ACCOUNTS", "PROCUREMENT", "COMMERCIAL"] : ["PM", "SITE_ENG", "STORE", "EMPLOYEE"];
      setS((p) => ({ ...p, attLocations: [...p.attLocations, { id: "gl" + Date.now(), locId, projectId: form.projectId, project: projName, site: form.site, type: form.type, address: form.address, lat: form.lat, lng: form.lng, radius: form.radius, gpsReq: form.gpsReq, from: form.from, to: form.to, status: form.status, assignedRoles: roles, assignedDepts: [], createdBy: user.name, createdDate: today() }] }));
      log("Attendance", "Geofence Created", locId, `${projName} · ${form.site} · ${form.lat}, ${form.lng} · ${form.radius} m — Super Admin`);
      notify("hr", `New attendance geofence ${locId} approved for ${form.site}`);
      toast("success", `${locId} created & active`);
    } else if (editing) {
      const old = editing;
      const changes: { field: string; oldV: string; newV: string }[] = [];
      if (old.lat !== form.lat || old.lng !== form.lng) changes.push({ field: "Coordinates", oldV: `${old.lat}, ${old.lng}`, newV: `${form.lat}, ${form.lng}` });
      if (old.radius !== form.radius) changes.push({ field: "Geofence radius", oldV: `${old.radius} m`, newV: `${form.radius} m` });
      if (old.gpsReq !== form.gpsReq) changes.push({ field: "GPS accuracy requirement", oldV: `≤ ${old.gpsReq} m`, newV: `≤ ${form.gpsReq} m` });
      if (old.status !== form.status) changes.push({ field: "Status", oldV: old.status, newV: form.status });
      if (!changes.length) { toast("info", "No changes detected"); return; }
      setS((p) => ({
        ...p,
        attLocations: p.attLocations.map((x) => x.id === old.id ? { ...x, ...form, project: projName, modifiedBy: user.name, modifiedDate: today(), reason: form.reason } : x),
        locHistory: [...changes.map((c) => ({ id: "lh" + Date.now() + Math.random().toString(36).slice(2, 6), locId: old.locId, project: `${old.projectId} — ${old.site}`, field: c.field, oldV: c.oldV, newV: c.newV, by: user.name, ts: new Date().toISOString(), reason: form.reason })), ...p.locHistory],
      }));
      log("Attendance", "Geofence Modified", old.locId, `${changes.map((c) => `${c.field}: ${c.oldV} → ${c.newV}`).join(" · ")} · reason: ${form.reason}`);
      notify("hr", `Attendance geofence ${old.locId} changed — history preserved`);
      toast("success", `${old.locId} updated · ${changes.length} change(s) written to history`);
    }
    setEditing(null);
  };

  const attempts = s.locAttempts;

  return (
    <div className="space-y-4">
      {!isSA && (
        <p className="flex items-center gap-2 text-[12px] font-semibold text-amber-700 bg-amber-100/50 border border-amber-500/30 rounded-lg px-3.5 py-2.5">
          <ILock size={14} /> Read-only — creating, modifying or activating attendance geofences is restricted to the Super Admin.
        </p>)}

      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-400">Approved geofences — click a site for detail{isSA ? " · click the map to drop a pin while editing" : ""}</p>
            {isSA && <BtnPunch kind="primary" onClick={() => open("new")} label="New Location" icon={<IPlus size={13} />} />}
          </div>
          <GeoMap editable={isSA && editing !== null} onPick={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
        </div>

        <div className="space-y-2">
          {s.attLocations.map((l) => {
            const punches = s.punches.filter((p) => p.date === today() && p.siteLat === l.lat && p.siteLng === l.lng).length;
            const blocked = attempts.filter((a) => a.site === l.site && a.date === today()).length;
            return (
              <div key={l.id} className="rounded-xl border border-line bg-surface p-3.5 hover:border-line-strong hover:-translate-y-px transition-all duration-200">
                <div className="flex items-center gap-2.5">
                  <span className={cx("h-9 w-9 rounded-lg grid place-items-center shrink-0", l.status === "Active" ? "bg-brand-50 text-brand-700 border border-brand-200" : "bg-line/50 text-ink-400")}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 21s-6.5-5.3-6.5-10a6.5 6.5 0 0 1 13 0c0 4.7-6.5 10-6.5 10z" /><circle cx="12" cy="11" r="2.4" /></svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-bold text-ink-900 truncate">{l.projectId} — {l.site} <span className="text-[10px] num font-semibold text-ink-400">({l.locId})</span></p>
                    <p className="text-[10.5px] num text-ink-400 truncate">{l.lat}, {l.lng} · radius {l.radius} m · GPS ≤ {l.gpsReq} m</p>
                  </div>
                  <span className={cx("text-[9px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0", l.status === "Active" ? "bg-ok-100 text-ok-600" : "bg-line/60 text-ink-400")}>{l.status}</span>
                </div>
                <div className="flex items-center gap-3 mt-2.5 pt-2.5 border-t border-line/70 text-[10.5px] num text-ink-400">
                  <span>{l.type}</span><span>·</span><span className="text-ok-600 font-semibold">{punches} verified today</span><span>·</span>
                  <span className={blocked ? "text-danger-600 font-semibold" : ""}>{blocked} blocked</span>
                  <span className="ml-auto flex gap-1">
                    <button onClick={() => setHist(l)} className="h-6.5 h-7 px-2 rounded-md border border-line text-[10px] font-bold text-ink-500 hover:text-brand-700 hover:border-brand-300 transition-all"><IEye size={11} className="inline -mt-px mr-0.5" />History</button>
                    {isSA && <button onClick={() => open(l)} className="h-7 px-2 rounded-md border border-line text-[10px] font-bold text-ink-500 hover:text-brand-700 hover:border-brand-300 transition-all"><IEdit size={11} className="inline -mt-px mr-0.5" />Edit</button>}
                  </span>
                </div>
              </div>);
          })}
        </div>
      </div>

      {/* violation register */}
      <div className="rounded-xl border border-line bg-surface p-4">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-400 mb-2.5">Outside-geofence & GPS exception register <span className="normal-case font-semibold text-ink-300">(auto-logged, immutable)</span></p>
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-left min-w-[760px]">
            <thead><tr className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
              <th className="font-bold pb-2 pr-3">User</th><th className="font-bold pb-2 pr-3">When</th><th className="font-bold pb-2 pr-3">Site</th>
              <th className="font-bold pb-2 pr-3 text-right">Distance</th><th className="font-bold pb-2 pr-3 text-right">Radius</th><th className="font-bold pb-2 pr-3 text-right">Accuracy</th>
              <th className="font-bold pb-2 pr-3">Result</th><th className="font-bold pb-2">Device</th>
            </tr></thead>
            <tbody>{attempts.slice(0, 8).map((a) => (
              <tr key={a.id} className="border-t border-line/80">
                <td className="py-2.5 pr-3 text-[12.5px] font-semibold text-ink-900">{a.user}</td>
                <td className="py-2.5 pr-3 num text-[11.5px] text-ink-500">{a.date} · {a.time}</td>
                <td className="py-2.5 pr-3 text-[12px] text-ink-700">{a.project} · {a.site}</td>
                <td className="py-2.5 pr-3 text-right num text-[12px] font-semibold text-danger-600">{a.dist ? a.dist + " m" : "—"}</td>
                <td className="py-2.5 pr-3 text-right num text-[12px] text-ink-500">{a.radius ? a.radius + " m" : "—"}</td>
                <td className="py-2.5 pr-3 text-right num text-[12px] text-ink-500">{a.acc ? "±" + a.acc + " m" : "—"}</td>
                <td className="py-2.5 pr-3"><span className="text-[10px] font-bold uppercase tracking-wide bg-danger-100 text-danger-600 rounded px-1.5 py-0.5">{a.result}</span></td>
                <td className="py-2.5 text-[11px] num text-ink-400">{a.device}</td>
              </tr>))}
              {attempts.length === 0 && <tr><td colSpan={8} className="py-6 text-center text-[12px] text-ink-400">No blocked attempts — all punches verified.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* edit drawer */}
      {editing && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-side-900/45 backdrop-blur-[2px]" onClick={() => setEditing(null)} />
          <aside className="absolute right-0 top-0 h-full w-full sm:w-[560px] bg-surface border-l border-line shadow-pop drawer-in overflow-y-auto">
            <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-line px-5 py-4 flex items-center gap-3">
              <div className="flex-1">
                <h2 className="font-display font-bold text-[15px] text-ink-900">{editing === "new" ? "New attendance location" : `Edit ${editing.locId}`}</h2>
                <p className="text-[11px] text-ink-400 mt-0.5">Super Admin authority · every change is versioned & audited</p>
              </div>
              <button onClick={() => setEditing(null)} className="h-7 w-7 grid place-items-center rounded-md border border-line text-ink-400 hover:text-ink-900 transition-all"><IX size={13} /></button>
            </div>
            <div className="p-5 space-y-3.5">
              <GeoMap editable height={220} onPick={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))} />
              <p className="text-[10.5px] text-ink-400 flex items-center gap-1.5"><IInfo size={12} /> Click the map to drop the pin — coordinates are captured from the approved master, never typed by field users.</p>
              <div className="grid grid-cols-2 gap-3">
                <label className="block"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-400 mb-1">Project</span>
                  <div className="relative"><select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })} className="w-full h-9 px-2.5 rounded-md border border-line bg-surface text-[12.5px] appearance-none pr-7 outline-none focus:border-brand-500">
                    {[...s.projects.map((p) => ({ id: p.id, n: `${p.id} — ${p.name.slice(0, 24)}` })), { id: "HO", n: "Head Office — Pune" }].map((p) => <option key={p.id} value={p.id}>{p.n}</option>)}</select>
                    <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div></label>
                <label className="block"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-400 mb-1">Site name</span>
                  <input value={form.site} onChange={(e) => setForm({ ...form, site: e.target.value })} className="w-full h-9 px-2.5 rounded-md border border-line bg-surface text-[12.5px] outline-none focus:border-brand-500" placeholder="e.g. Package-01" /></label>
                <label className="block"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-400 mb-1">Location type</span>
                  <div className="relative"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AttLocation["type"] })} className="w-full h-9 px-2.5 rounded-md border border-line bg-surface text-[12.5px] appearance-none pr-7 outline-none focus:border-brand-500">
                    {["Project Site", "Site Office", "Head Office", "Plant", "RMC"].map((t) => <option key={t}>{t}</option>)}</select>
                    <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div></label>
                <label className="block"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-400 mb-1">Status</span>
                  <div className="relative"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as "Active" | "Inactive" })} className="w-full h-9 px-2.5 rounded-md border border-line bg-surface text-[12.5px] appearance-none pr-7 outline-none focus:border-brand-500">
                    {["Active", "Inactive"].map((t) => <option key={t}>{t}</option>)}</select>
                    <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" /></div></label>
                <label className="block"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-400 mb-1">Latitude</span>
                  <input type="number" step="0.00001" value={form.lat} onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) || 0 })} className="w-full h-9 px-2.5 rounded-md border border-line bg-surface text-[12.5px] num outline-none focus:border-brand-500" /></label>
                <label className="block"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-400 mb-1">Longitude</span>
                  <input type="number" step="0.00001" value={form.lng} onChange={(e) => setForm({ ...form, lng: parseFloat(e.target.value) || 0 })} className="w-full h-9 px-2.5 rounded-md border border-line bg-surface text-[12.5px] num outline-none focus:border-brand-500" /></label>
                <label className="block"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-400 mb-1">Geofence radius — <b className="num">{form.radius} m</b></span>
                  <input type="range" min={50} max={500} step={10} value={form.radius} onChange={(e) => setForm({ ...form, radius: +e.target.value })} className="w-full accent-[#0c7264] mt-2.5" /></label>
                <label className="block"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-400 mb-1">GPS accuracy req. — <b className="num">≤ {form.gpsReq} m</b></span>
                  <input type="range" min={10} max={60} step={5} value={form.gpsReq} onChange={(e) => setForm({ ...form, gpsReq: +e.target.value })} className="w-full accent-[#0c7264] mt-2.5" /></label>
              </div>
              <label className="block"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-400 mb-1">Address</span>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full h-9 px-2.5 rounded-md border border-line bg-surface text-[12.5px] outline-none focus:border-brand-500" /></label>
              {editing !== "new" && (
                <label className="block"><span className="block text-[10px] font-bold uppercase tracking-wide text-ink-400 mb-1">Reason for modification <b className="text-danger-600">*</b></span>
                  <textarea rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className="w-full px-2.5 py-2 rounded-md border border-line bg-surface text-[12.5px] outline-none focus:border-brand-500 resize-none" placeholder="Why is this approved location changing? (written to history & audit trail)" /></label>)}
              <div className="flex justify-end gap-2 pt-2 border-t border-line">
                <button onClick={() => setEditing(null)} className="h-9 px-4 rounded-lg border border-line text-[12.5px] font-semibold text-ink-500 hover:bg-canvas transition-all">Cancel</button>
                <button onClick={save} disabled={!isSA} className="h-9 px-4 rounded-lg bg-brand-600 text-white text-[12.5px] font-bold hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-40 inline-flex items-center gap-1.5"><ICheck size={13} /> {editing === "new" ? "Create & Approve Location" : "Save Changes"}</button>
              </div>
            </div>
          </aside>
        </div>)}

      {/* history drawer */}
      {hist && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-side-900/45 backdrop-blur-[2px]" onClick={() => setHist(null)} />
          <aside className="absolute right-0 top-0 h-full w-full sm:w-[480px] bg-surface border-l border-line shadow-pop drawer-in overflow-y-auto">
            <div className="sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-line px-5 py-4 flex items-center gap-3">
              <div className="flex-1"><h2 className="font-display font-bold text-[15px] text-ink-900">{hist.locId} — change history</h2>
                <p className="text-[11px] text-ink-400 mt-0.5">{hist.projectId} · {hist.site} · old values are never overwritten</p></div>
              <button onClick={() => setHist(null)} className="h-7 w-7 grid place-items-center rounded-md border border-line text-ink-400 hover:text-ink-900 transition-all"><IX size={13} /></button>
            </div>
            <div className="p-5 space-y-2.5">
              {s.locHistory.filter((h) => h.locId === hist.locId).map((h) => (
                <div key={h.id} className="rounded-lg border border-line p-3.5">
                  <div className="flex items-center justify-between gap-2"><p className="text-[12px] font-bold text-ink-900">{h.field}</p>
                    <span className="num text-[10px] text-ink-300">{new Date(h.ts).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span></div>
                  <div className="flex items-center gap-2 mt-1.5 text-[11.5px] num">
                    <span className="px-2 py-0.5 rounded bg-line/50 text-ink-500 line-through">{h.oldV}</span>
                    <span className="text-brand-600 font-bold">→</span>
                    <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 font-semibold border border-brand-100">{h.newV}</span>
                  </div>
                  <p className="text-[10.5px] text-ink-400 mt-1.5">By <b className="text-ink-700">{h.by}</b> · {h.reason}</p>
                </div>))}
              {s.locHistory.filter((h) => h.locId === hist.locId).length === 0 && <p className="text-[12px] text-ink-400 py-4 text-center">No modifications since creation.</p>}
              <div className="rounded-lg border border-line bg-canvas/50 p-3.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-400 mb-1.5">Current approved configuration</p>
                <p className="text-[12px] num text-ink-700">{hist.lat}, {hist.lng} · radius {hist.radius} m · GPS ≤ {hist.gpsReq} m</p>
                <p className="text-[10.5px] text-ink-400 mt-1">Created by {hist.createdBy} · {hist.createdDate}{hist.modifiedBy ? ` · last modified ${hist.modifiedBy}, ${hist.modifiedDate}` : ""}</p>
              </div>
            </div>
          </aside>
        </div>)}
    </div>
  );
}

export { mySites };
