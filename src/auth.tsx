/* Meridian ERP · Secure Identity — salted-hash sign-in, lockout, session policy, audit */
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useERP, demoHash } from "./store";
import type { LoginRec, SessionRec, UserRec } from "./store";
import { ROLES } from "./data";
import { Brand } from "./shell";
import { cx, useToast } from "./ui";
import { ILock, IUser, IAlert, ICheck, IChevD, IMoon, ISun } from "./icons";

const SESSION_KEY = "mer.session";
const SESSION_TTL = 8 * 36e5; /* security policy — sessions expire after 8 hours */

export const readSession = (): { userId: string; ts: number; device: string } | null => {
  try {
    const v = localStorage.getItem(SESSION_KEY);
    if (!v) return null;
    const p = JSON.parse(v);
    if (!p || typeof p.userId !== "string" || typeof p.ts !== "number") { localStorage.removeItem(SESSION_KEY); return null; }
    if (Date.now() - p.ts > SESSION_TTL) { localStorage.removeItem(SESSION_KEY); return null; }
    return p as { userId: string; ts: number; device: string };
  } catch { try { localStorage.removeItem(SESSION_KEY); } catch { /* noop */ } return null; }
};
const writeSession = (userId: string, device: string) => {
  const s = { userId, ts: Date.now(), device };
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(s)); } catch { /* noop */ }
  return s;
};
export const clearSession = () => { try { localStorage.removeItem(SESSION_KEY); } catch { /* noop */ } };

const device = () => {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "Device";
  return `${browser} · ${os} · ${window.innerWidth < 768 ? "Mobile" : window.innerWidth < 1200 ? "Tablet" : "Desktop"}`;
};
const ip = () => "10.20.4." + (10 + (new Date().getMinutes() % 40));

const strength = (p: string) => {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
};

const IEye = ({ off = false }: { off?: boolean }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.5-6.5 10-6.5S22 12 22 12s-3.5 6.5-10 6.5S2 12 2 12z" /><circle cx="12" cy="12" r="2.6" />
    {off && <path d="M4 4l16 16" />}
  </svg>
);

/* ══════════ LOGIN SCREEN ══════════ */
export function LoginScreen({ onLogin }: { onLogin: (userId: string) => void }) {
  const { s, setS, log, dark, setDark } = useERP();
  const toast = useToast();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [lockLeft, setLockLeft] = useState(0);
  const [pendingTemp, setPendingTemp] = useState<string | null>(null);
  const userRef = useRef<HTMLInputElement>(null);
  useEffect(() => { userRef.current?.focus(); }, []);

  useEffect(() => {
    if (lockLeft <= 0) return;
    const t = window.setTimeout(() => setLockLeft((v) => v - 1), 1000);
    return () => window.clearTimeout(t);
  }, [lockLeft]);

  const recordLogin = (name: string, status: LoginRec["status"]) =>
    setS((p) => ({ ...p, loginHistory: [{ id: "lh" + Date.now(), user: name, ts: new Date().toISOString(), device: device(), ip: ip(), status }, ...p.loginHistory] }));

  const fail = (msg: string) => { setErr(msg); setShake(true); window.setTimeout(() => setShake(false), 480); };

  const submit = (e?: React.FormEvent, preUser?: string, prePass?: string) => {
    e?.preventDefault();
    setErr("");
    const uid = (preUser ?? user).trim();
    const pw = prePass ?? pass;
    if (!uid || !pw) return fail("Enter your user ID (or email) and password.");
    const u = s.users.find((x) => x.email.toLowerCase() === uid.toLowerCase() || (s.creds[x.id]?.username ?? "").toLowerCase() === uid.toLowerCase());
    if (!u) return fail("No account found for that user ID or email.");
    const c = s.creds[u.id];
    if (!c) return fail("Account not provisioned. Contact your administrator.");
    if (c.status === "Inactive") return fail("This account is deactivated. Contact HR / Super Admin.");
    if (c.lockedUntil && c.lockedUntil > Date.now()) {
      setLockLeft(Math.ceil((c.lockedUntil - Date.now()) / 1000));
      return fail("Account locked after repeated failures. Try again shortly.");
    }
    if (demoHash(pw) !== c.hash) {
      const failed = c.failed + 1;
      const locked = failed >= 5;
      setS((p) => ({ ...p, creds: { ...p.creds, [u.id]: { ...c, failed, lockedUntil: locked ? Date.now() + 30000 : undefined, status: locked ? "Locked" : c.status } } }));
      recordLogin(u.name, locked ? "Locked" : "Failed");
      if (locked) { setLockLeft(30); fail("5 failed attempts — account locked for 30 seconds."); }
      else fail(`Incorrect password. ${5 - failed} attempt(s) remaining.`);
      return;
    }
    /* verified — open session */
    setBusy(true);
    setS((p) => ({
      ...p,
      creds: { ...p.creds, [u.id]: { ...c, failed: 0, lockedUntil: undefined, status: c.status === "Locked" ? "Active" : c.status } },
      sessions: [{ id: "ss" + Date.now(), user: u.name, device: device(), ip: ip(), started: new Date().toISOString(), lastActive: "now", current: true }, ...p.sessions],
    }));
    recordLogin(u.name, "Success");
    window.setTimeout(() => {
      if (c.mustChange) { setBusy(false); setPendingTemp(u.id); }
      else {
        writeSession(u.id, device());
        log("Identity", "Secure Login", u.name, `${device()} · session valid 8 h`);
        onLogin(u.id);
      }
    }, 600);
  };

  /* first-login password change */
  const [np, setNp] = useState("");
  const [np2, setNp2] = useState("");
  const [npErr, setNpErr] = useState("");
  const tempUser = pendingTemp ? s.users.find((u) => u.id === pendingTemp) : null;
  const sc = strength(np);
  const changePw = () => {
    if (sc < 3) return setNpErr("Use 8+ characters with upper & lower case, a number and a symbol.");
    if (np !== np2) return setNpErr("Passwords do not match.");
    if (!tempUser) return;
    setS((p) => ({ ...p, creds: { ...p.creds, [tempUser.id]: { ...p.creds[tempUser.id], hash: demoHash(np), mustChange: false } } }));
    recordLogin(tempUser.name, "Password Changed");
    writeSession(tempUser.id, device());
    log("Identity", "Password Changed on First Login", tempUser.name, device());
    toast("success", "Password updated — welcome aboard!");
    onLogin(tempUser.id);
  };

  /* guest / demo bypass — guarantees access to the demo environment */
  const guest = () => {
    const u = s.users.find((x) => x.id === "u2") ?? s.users[0];
    writeSession(u.id, device());
    recordLogin(u.name, "Success");
    log("Identity", "Demo Access Granted", u.name, "One-tap demo entry · session valid 8 h");
    onLogin(u.id);
  };

  const quick = useMemo(() => s.users.filter((u) => ["SUPER_ADMIN", "MD", "PM", "SITE_ENG", "STORE", "HR"].includes(u.role)).slice(0, 6), [s.users]);

  return (
    <div className="min-h-dvh flex bg-canvas">
      {/* brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between w-[44%] max-w-[580px] p-10 overflow-hidden"
        style={{ background: "linear-gradient(155deg,#0f1a22 0%,#122430 45%,#0c7264 170%)" }}>
        <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: "radial-gradient(#3cb3a0 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <div className="absolute -top-24 -right-24 h-[380px] w-[380px] rounded-full border border-brand-300/20" />
        <div className="absolute -top-10 -right-10 h-[220px] w-[220px] rounded-full border border-brand-300/25" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid place-items-center h-11 w-11 rounded-[13px] bg-brand-500 text-white shadow-lift">
            <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M6 24V10l7 8 4-5 9 11H6z" fill="currentColor" /><circle cx="24" cy="9" r="2.6" fill="#E0A33B" /></svg>
          </span>
          <div className="leading-none">
            <p className="font-display font-bold text-[19px] text-white tracking-tight">Meridian <span className="text-brand-200">ERP</span></p>
            <p className="text-[9.5px] uppercase tracking-[0.22em] text-brand-200/80 mt-1.5 font-semibold">Sahaa Infra</p>
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-200/90">Construction · Infrastructure · RMC</p>
          <h1 className="font-display text-[34px] leading-[1.12] font-bold text-white mt-3 tracking-tight">
            One secure platform.<br />Every project, site &amp; team.
          </h1>
          <p className="text-[13px] text-[#9db4c6] leading-relaxed mt-4 max-w-[400px]">
            Tenders → BOQ → procurement → execution → measurement → billing → accounts, with role-based access,
            approval workflows and a complete audit trail.
          </p>
          <div className="grid grid-cols-3 gap-3 mt-8 max-w-[420px]">
            {[["9", "Active projects"], ["12", "Secure users"], ["1,450+", "Workforce tracked"]].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 backdrop-blur-[2px]">
                <p className="num text-[20px] font-bold text-white">{v}</p>
                <p className="text-[10px] text-[#8fa6b8] mt-0.5 uppercase tracking-wide font-semibold">{l}</p>
              </div>))}
          </div>
        </div>
        <div className="relative z-10 flex items-center gap-2 text-[10.5px] text-[#7d92a5]">
          <ILock size={12} /> Salted-hash credentials · 8-hour session policy · lockout protection · full audit trail
        </div>
      </div>

      {/* form panel */}
      <div className="flex-1 flex items-center justify-center p-5 relative">
        <button onClick={() => setDark(!dark)} className="absolute top-4 right-4 h-9 w-9 grid place-items-center rounded-lg border border-line text-ink-400 hover:text-ink-900 hover:border-line-strong transition-all active:scale-90">
          {dark ? <ISun size={16} /> : <IMoon size={16} />}
        </button>
        <div className={cx("w-full max-w-[430px]", shake && "shake")}>
          <div className="lg:hidden mb-6"><Brand /></div>

          {!pendingTemp ? (
            <div className="fade-up">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-700">Secure sign in</p>
              <h1 className="font-display text-[26px] font-bold text-ink-900 tracking-tight mt-1.5">Welcome back</h1>
              <p className="text-[12.5px] text-ink-400 mt-1">Individual accounts only — every action is traced to you.</p>

              <form onSubmit={submit} className="mt-6 space-y-3.5">
                <label className="block">
                  <span className="block text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-1.5">User ID or email</span>
                  <div className="relative">
                    <IUser size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                    <input ref={userRef} value={user} onChange={(e) => { setUser(e.target.value); setErr(""); }} autoComplete="username"
                      placeholder="e.g. sunita.d"
                      className="w-full h-11 pl-9.5 pl-10 pr-3 rounded-xl border border-line bg-surface text-[13.5px] text-ink-900 outline-none focus:border-brand-500 focus:ring-[3px] focus:ring-brand-100 transition-all placeholder:text-ink-300" />
                  </div>
                </label>
                <label className="block">
                  <span className="block text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-1.5">Password</span>
                  <div className="relative">
                    <ILock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                    <input type={showPw ? "text" : "password"} value={pass} onChange={(e) => { setPass(e.target.value); setErr(""); }} autoComplete="current-password"
                      placeholder="••••••••••"
                      className="w-full h-11 pl-10 pr-11 rounded-xl border border-line bg-surface text-[13.5px] text-ink-900 outline-none focus:border-brand-500 focus:ring-[3px] focus:ring-brand-100 transition-all placeholder:text-ink-300" />
                    <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink-700 transition-colors" aria-label="Show password"><IEye off={showPw} /></button>
                  </div>
                </label>

                {err && (
                  <p className="flex items-start gap-2 text-[12px] font-semibold text-danger-600 bg-danger-100/50 border border-danger-500/25 rounded-lg px-3 py-2.5 fade-up">
                    <IAlert size={14} className="mt-px shrink-0" />
                    <span>{err}{lockLeft > 0 && <b className="num"> ({lockLeft}s)</b>}</span>
                  </p>)}

                <button type="submit" disabled={busy || lockLeft > 0}
                  className="w-full h-11 rounded-xl bg-brand-600 text-white text-[13.5px] font-bold shadow-card hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2">
                  {busy ? (<><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Verifying credentials…</>)
                    : lockLeft > 0 ? `Locked — retry in ${lockLeft}s` : (<>Sign in securely <ILock size={13} /></>)}
                </button>
              </form>

              <div className="flex items-center justify-between mt-3">
                <button onClick={() => toast("info", "Password reset link sent to your registered email (demo).")}
                  className="text-[12px] font-semibold text-brand-700 hover:text-brand-800 underline-offset-2 hover:underline transition-colors">Forgot password?</button>
                <span className="text-[10px] text-ink-300 num">Session expires in 8 h</span>
              </div>

              <DemoAccess quick={quick} all={s.users} onOneTap={(u) => submit(undefined, u.email, u.id === "u12" ? "Temp@90210" : "Welcome@123")} />

              <button onClick={guest}
                className="mt-3 w-full h-10 rounded-xl border border-dashed border-brand-300 bg-brand-50/50 text-brand-700 text-[12px] font-bold hover:bg-brand-50 hover:border-brand-400 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2">
                <IUser size={14} /> Can’t sign in? Continue as demo user (Managing Director)
              </button>
            </div>
          ) : (
            /* forced password change */
            <div className="fade-up">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-600">First login — security step</p>
              <h1 className="font-display text-[24px] font-bold text-ink-900 tracking-tight mt-1.5">Set your own password</h1>
              <p className="text-[12.5px] text-ink-400 mt-1">Hi <b className="text-ink-900">{tempUser?.name}</b> — your account was issued a temporary password. Create a personal one to continue.</p>
              <div className="mt-5 space-y-3.5">
                <label className="block">
                  <span className="block text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-1.5">New password</span>
                  <input type="password" value={np} onChange={(e) => { setNp(e.target.value); setNpErr(""); }} autoFocus
                    className="w-full h-11 px-3.5 rounded-xl border border-line bg-surface text-[13.5px] outline-none focus:border-brand-500 focus:ring-[3px] focus:ring-brand-100 transition-all" />
                  <span className="flex gap-1 mt-2">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className={cx("h-1 flex-1 rounded-full transition-all duration-300", i < sc ? (sc <= 1 ? "bg-danger-500" : sc === 2 ? "bg-amber-500" : "bg-ok-500") : "bg-line")} />))}
                  </span>
                  <span className="block text-[10px] text-ink-300 mt-1">{["Too weak", "Weak", "Fair", "Good", "Strong"][sc]} — 8+ chars, upper & lower case, number, symbol</span>
                </label>
                <label className="block">
                  <span className="block text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-1.5">Confirm password</span>
                  <input type="password" value={np2} onChange={(e) => { setNp2(e.target.value); setNpErr(""); }}
                    className="w-full h-11 px-3.5 rounded-xl border border-line bg-surface text-[13.5px] outline-none focus:border-brand-500 focus:ring-[3px] focus:ring-brand-100 transition-all" />
                </label>
                {npErr && <p className="flex items-center gap-2 text-[12px] font-semibold text-danger-600 bg-danger-100/50 border border-danger-500/25 rounded-lg px-3 py-2.5"><IAlert size={14} /> {npErr}</p>}
                <button onClick={changePw} className="w-full h-11 rounded-xl bg-brand-600 text-white text-[13.5px] font-bold shadow-card hover:bg-brand-700 active:scale-[0.98] transition-all inline-flex items-center justify-center gap-2">
                  <ICheck size={14} /> Save &amp; continue
                </button>
              </div>
            </div>
          )}

          <p className="mt-6 text-[10px] text-ink-300 num leading-relaxed">
            Protected by role-based access control. Credentials are stored as salted hashes — never in plain text.
            Failed attempts lock the account; all logins are written to the audit trail.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Demo access panel ─────────────────────────────────────── */
function DemoAccess({ quick, all, onOneTap }: { quick: UserRec[]; all: UserRec[]; onOneTap: (u: UserRec) => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const cred = (u: UserRec) => (u.id === "u12" ? "Temp@90210" : "Welcome@123");
  const uname = (u: UserRec) => u.email.split("@")[0];
  const copy = (text: string) => { navigator.clipboard?.writeText(text).catch(() => {}); toast("success", "Copied: " + text); };
  return (
    <div className="mt-6 pt-5 border-t border-line">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-300 mb-2.5">Demo accounts — one-tap sign in</p>
      <div className="grid grid-cols-2 gap-2">
        {quick.map((u) => (
          <button key={u.id} onClick={() => onOneTap(u)}
            className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 hover:border-brand-300 hover:bg-brand-50/40 hover:-translate-y-px active:scale-[0.98] transition-all text-left">
            <span className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-bold bg-brand-600 text-white shrink-0">{u.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
            <span className="min-w-0">
              <span className="block text-[11.5px] font-bold text-ink-900 truncate">{u.name}</span>
              <span className="block text-[9.5px] text-ink-400 uppercase tracking-wide font-semibold">{u.role.replace("_", " ")}</span>
            </span>
          </button>))}
      </div>
      <button onClick={() => setOpen((v) => !v)} className="mt-3 w-full flex items-center justify-between text-[10.5px] font-bold uppercase tracking-[0.12em] text-brand-700 hover:text-brand-800 transition-colors">
        <span>All demo user IDs &amp; passwords</span>
        <IChevD size={12} className={cx("transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-2.5 rounded-lg border border-line bg-canvas/50 overflow-hidden fade-up">
          <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 px-3 py-1.5 border-b border-line bg-surface text-[9px] font-bold uppercase tracking-[0.1em] text-ink-400">
            <span>User ID · Role</span><span>Password</span><span></span>
          </div>
          <ul className="max-h-[200px] overflow-auto">
            {all.map((u) => (
              <li key={u.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 px-3 py-2 border-b border-line/60 last:border-0 hover:bg-brand-50/30 transition-colors group">
                <div className="min-w-0">
                  <p className="text-[11.5px] font-semibold text-ink-900 num">{uname(u)}</p>
                  <p className="text-[9.5px] text-ink-400 truncate">{ROLES.find((r) => r.id === u.role)?.label}{u.id === "u12" ? " · new joiner (must change)" : ""}</p>
                </div>
                <span className={cx("text-[11px] font-semibold num", u.id === "u12" ? "text-amber-600" : "text-ink-700")}>{cred(u)}</span>
                <button onClick={() => copy(`${uname(u)} / ${cred(u)}`)}
                  className="h-6 px-2 rounded-md border border-line text-[9.5px] font-bold text-ink-400 opacity-0 group-hover:opacity-100 hover:text-brand-700 hover:border-brand-300 transition-all active:scale-95">Copy</button>
              </li>))}
          </ul>
        </div>)}
    </div>
  );
}

/* ── Session manager (profile / user admin) ────────────────── */
export function SessionManager({ compact }: { compact?: boolean }) {
  const { s, setS, user, log, notify } = useERP();
  const toast = useToast();
  const [confirmAll, setConfirmAll] = useState(false);
  const mine = s.sessions.filter((x) => x.user === user.name);

  const revoke = (x: SessionRec) => {
    setS((p) => ({ ...p, sessions: p.sessions.filter((y) => y.id !== x.id) }));
    log("Identity", "Session Revoked", x.user, `${x.device} · ${x.ip}`);
    toast("info", "Session revoked — " + x.device);
  };
  const revokeAll = () => {
    setS((p) => ({ ...p, sessions: p.sessions.filter((y) => y.current) }));
    log("Identity", "All Sessions Revoked", user.name, "Logout from all devices");
    notify("approval", `All other sessions ended for ${user.name}`);
    toast("success", "Logged out from every other device");
    setConfirmAll(false);
  };

  return (
    <div className={cx(compact ? "" : "p-4")}>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-400">Active sessions</p>
        <button onClick={() => setConfirmAll(true)} className="text-[10.5px] font-bold text-danger-600 hover:underline transition-colors">Log out everywhere</button>
      </div>
      <ul className="space-y-2">
        {(mine.length ? mine : s.sessions.slice(0, 3)).map((x) => (
          <li key={x.id} className="flex items-center gap-2.5 bg-surface border border-line rounded-lg px-3 py-2">
            <span className={cx("h-2 w-2 rounded-full shrink-0", x.current ? "bg-ok-500 animate-pulse-dot" : "bg-line-strong")} />
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-semibold text-ink-900 truncate">{x.device} {x.current && <span className="text-ok-600">· this device</span>}</p>
              <p className="text-[10px] text-ink-400 num">{x.ip} · started {new Date(x.started).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            {!x.current && <button onClick={() => revoke(x)} className="text-[10px] font-bold text-ink-400 hover:text-danger-600 transition-colors">Revoke</button>}
          </li>))}
        {mine.length === 0 && <li className="text-[11px] text-ink-400 py-1">Current session only.</li>}
      </ul>
      {confirmAll && (
        <div className="mt-3 rounded-lg border border-danger-500/30 bg-danger-100/30 p-3 fade-up">
          <p className="text-[11.5px] font-semibold text-danger-600">End every other session on all devices?</p>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setConfirmAll(false)} className="h-7 px-2.5 rounded-md border border-line text-[11px] font-semibold text-ink-500 hover:bg-canvas transition-all">Cancel</button>
            <button onClick={revokeAll} className="h-7 px-2.5 rounded-md bg-danger-500 text-white text-[11px] font-bold hover:opacity-90 active:scale-95 transition-all">Yes, log out all</button>
          </div>
        </div>)}
    </div>
  );
}

export type { ReactNode };
