/* Meridian ERP · Identity — individual secure login, temp-password, lockout, sessions */
import { useEffect, useMemo, useRef, useState } from "react";
import { useERP, demoHash } from "./store";
import type { LoginRec, SessionRec } from "./store";
import { Brand } from "./shell";
import { cx } from "./ui";
import { ILock, IUser, ISun, IMoon, IAlert, ICheck, IChevD } from "./icons";

const SESSION_KEY = "mer.session";
export const readSession = (): { userId: string; ts: number; device: string } | null => {
  try { const v = localStorage.getItem(SESSION_KEY); return v ? JSON.parse(v) : null; } catch { return null; }
};
const writeSession = (userId: string, device: string) => {
  const s = { userId, ts: Date.now(), device };
  localStorage.setItem(SESSION_KEY, JSON.stringify(s));
  return s;
};
export const clearSession = () => localStorage.removeItem(SESSION_KEY);
const device = () => {
  const ua = navigator.userAgent;
  const os = /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "macOS" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : "Linux";
  const br = /Edg/.test(ua) ? "Edge" : /Chrome/.test(ua) ? "Chrome" : /Safari/.test(ua) ? "Safari" : /Firefox/.test(ua) ? "Firefox" : "Browser";
  return `${br} · ${os}`;
};

/* ── password strength ── */
const strength = (p: string) => {
  let sc = 0;
  if (p.length >= 8) sc++;
  if (p.length >= 12) sc++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) sc++;
  if (/\d/.test(p)) sc++;
  if (/[^A-Za-z0-9]/.test(p)) sc++;
  return Math.min(4, sc);
};
const STRENGTH_META = [
  { l: "Too weak", c: "bg-danger-500", t: "text-danger-600" },
  { l: "Weak", c: "bg-amber-500", t: "text-amber-600" },
  { l: "Fair", c: "bg-amber-400", t: "text-amber-600" },
  { l: "Strong", c: "bg-ok-500", t: "text-ok-600" },
  { l: "Very strong", c: "bg-brand-600", t: "text-brand-700" },
];

/* ══════════ Login Screen ══════════ */
export function LoginScreen({ onLogin }: { onLogin: (userId: string) => void }) {
  const { s, setS, dark, setDark, log } = useERP();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pendingTemp, setPendingTemp] = useState<string | null>(null); // user id requiring password change
  const [lockLeft, setLockLeft] = useState(0);

  useEffect(() => {
    if (!lockLeft) return;
    const t = window.setInterval(() => setLockLeft((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(t);
  }, [lockLeft]);

  const recordLogin = (name: string, status: LoginRec["status"]) => {
    setS((p) => ({
      ...p,
      loginHistory: [{ id: "lh" + Date.now(), user: name, ts: new Date().toISOString(), device: device(), ip: "10.20.4." + (10 + (name.length % 40)), status }, ...p.loginHistory],
    }));
  };

  const fail = (msg: string) => { setErr(msg); setShake(true); window.setTimeout(() => setShake(false), 450); };

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setErr("");
    if (!user.trim() || !pass) return fail("Enter your username / email and password.");
    const u = s.users.find((x) => x.email.toLowerCase() === user.trim().toLowerCase() || (s.creds[x.id]?.username ?? "").toLowerCase() === user.trim().toLowerCase());
    if (!u) return fail("No account found for that username or email.");
    const c = s.creds[u.id];
    if (!c) return fail("Account not provisioned. Contact your administrator.");
    if (c.status === "Inactive") return fail("This account is deactivated. Contact HR / Super Admin.");
    if (c.lockedUntil && c.lockedUntil > Date.now()) {
      setLockLeft(Math.ceil((c.lockedUntil - Date.now()) / 1000));
      return fail("Account locked after repeated failures. Try again shortly.");
    }
    if (demoHash(pass) !== c.hash) {
      const failed = c.failed + 1;
      const locked = failed >= 5;
      setS((p) => ({ ...p, creds: { ...p.creds, [u.id]: { ...c, failed, lockedUntil: locked ? Date.now() + 30000 : undefined, status: locked ? "Locked" : c.status } } }));
      recordLogin(u.name, locked ? "Locked" : "Failed");
      if (locked) { setLockLeft(30); fail("5 failed attempts — account locked for 30 seconds."); }
      else fail(`Incorrect password. ${5 - failed} attempt(s) remaining.`);
      return;
    }
    /* success */
    setBusy(true);
    setS((p) => ({
      ...p,
      creds: { ...p.creds, [u.id]: { ...c, failed: 0, lockedUntil: undefined, status: c.status === "Locked" ? "Active" : c.status } },
      sessions: [{ id: "ss" + Date.now(), user: u.name, device: device(), ip: "10.20.4." + (10 + (u.name.length % 40)), started: new Date().toISOString(), lastActive: "now", current: true }, ...p.sessions],
    }));
    recordLogin(u.name, "Success");
    window.setTimeout(() => {
      if (c.mustChange) { setBusy(false); setPendingTemp(u.id); }
      else { const sess = writeSession(u.id, device()); log("Identity", "Login", u.name, `${sess.device} · session started`); onLogin(u.id); }
    }, 650);
  };

  /* temp password change */
  const [np, setNp] = useState("");
  const [np2, setNp2] = useState("");
  const [npErr, setNpErr] = useState("");
  const tempUser = pendingTemp ? s.users.find((u) => u.id === pendingTemp) : null;
  const sc = strength(np);
  const changePw = () => {
    if (strength(np) < 3) return setNpErr("Use 8+ characters with upper/lower case, a number and a symbol.");
    if (np !== np2) return setNpErr("Passwords do not match.");
    if (!tempUser) return;
    setS((p) => ({ ...p, creds: { ...p.creds, [tempUser.id]: { ...p.creds[tempUser.id], hash: demoHash(np), mustChange: false } } }));
    setS((p) => ({ ...p, loginHistory: [{ id: "lh" + Date.now(), user: tempUser.name, ts: new Date().toISOString(), device: device(), ip: "10.20.4.18", status: "Password Changed" }, ...p.loginHistory] }));
    const sess = writeSession(tempUser.id, device());
    log("Identity", "Password Changed on First Login", tempUser.name, `${sess.device}`);
    onLogin(tempUser.id);
  };

  const quick = useMemo(() => s.users.filter((u) => ["SUPER_ADMIN", "MD", "PM", "SITE_ENG", "STORE", "HR"].includes(u.role)).slice(0, 6), [s.users]);

  return (
    <div className="min-h-dvh flex bg-canvas">
      {/* brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between w-[44%] max-w-[560px] p-10 overflow-hidden"
        style={{ background: "linear-gradient(155deg,#0f1a22 0%,#12222c 45%,#0c7264 160%)" }}>
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: "radial-gradient(#9db4c6 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
        <div className="absolute -right-24 -bottom-24 h-[420px] w-[420px] rounded-full border border-white/10" />
        <div className="absolute -right-10 -bottom-10 h-[240px] w-[240px] rounded-full border border-white/10" />
        <div className="relative z-10 flex items-center gap-3">
          <span className="grid place-items-center h-10 w-10 rounded-[12px] bg-brand-500 text-white shadow-lift">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><path d="M6 24V10l7 8 4-5 9 11H6z" fill="currentColor" /><circle cx="24" cy="9" r="2.6" fill="#E0A33B" /></svg>
          </span>
          <div className="leading-none">
            <p className="font-display font-bold text-[17px] text-white tracking-tight">Meridian <span className="text-brand-200">ERP</span></p>
            <p className="text-[9.5px] uppercase tracking-[0.2em] text-brand-200/80 mt-1 font-semibold">Sahaa Infra</p>
          </div>
        </div>
        <div className="relative z-10 max-w-[400px]">
          <p className="font-display text-[30px] leading-[1.15] font-bold text-white tracking-tight">One login.<br />Every project, site and plant.</p>
          <p className="text-[13px] text-brand-100/80 mt-4 leading-relaxed">Individual accounts, role & project-scoped access, management-chain approvals and a complete audit trail — from tender to profitability.</p>
          <div className="mt-7 grid grid-cols-3 gap-3">
            {[["12", "live modules"], ["9", "site projects"], ["100%", "audit coverage"]].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                <p className="num text-[19px] font-bold text-white">{v}</p>
                <p className="text-[10px] uppercase tracking-wide text-brand-200/70 mt-0.5 font-semibold">{l}</p>
              </div>))}
          </div>
        </div>
        <p className="relative z-10 text-[10.5px] text-brand-200/50 num">Protected system · unauthorised access is monitored & logged · v5.1</p>
      </div>

      {/* form panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <button onClick={() => setDark(!dark)} className="absolute top-5 right-5 h-9 w-9 grid place-items-center rounded-lg border border-line text-ink-500 hover:bg-canvas active:scale-90 transition-all">
          {dark ? <ISun size={15} /> : <IMoon size={15} />}
        </button>

        <div className={cx("w-full max-w-[400px]", shake && "shake")}>
          {!tempUser ? (
            <>
              <div className="lg:hidden mb-6"><Brand /></div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-brand-700">Secure sign in</p>
              <h1 className="font-display text-[24px] font-bold text-ink-900 tracking-tight mt-1.5">Welcome back</h1>
              <p className="text-[12.5px] text-ink-400 mt-1">Use your individual account — shared logins are disabled.</p>

              {lockLeft > 0 && (
                <div className="mt-4 flex items-center gap-2.5 rounded-lg border border-danger-500/30 bg-danger-100/40 px-3.5 py-3 fade-up">
                  <IAlert size={15} className="text-danger-600 shrink-0" />
                  <p className="text-[12px] font-semibold text-danger-600">Account locked — retry in <span className="num">{lockLeft}s</span></p>
                </div>)}

              <form onSubmit={submit} className="mt-5 space-y-3.5">
                <label className="block">
                  <span className="block text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-1.5">Username or email</span>
                  <div className="relative">
                    <IUser size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                    <input value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" placeholder="e.g. sunita.d"
                      className="w-full h-11 pl-9 pr-3 rounded-lg border border-line bg-surface text-[13.5px] text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all placeholder:text-ink-300" />
                  </div>
                </label>
                <label className="block">
                  <span className="block text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-1.5">Password</span>
                  <div className="relative">
                    <ILock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-300" />
                    <input type={show ? "text" : "password"} value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" placeholder="••••••••••"
                      className="w-full h-11 pl-9 pr-16 rounded-lg border border-line bg-surface text-[13.5px] text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all" />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10.5px] font-bold text-ink-400 hover:text-brand-700 uppercase tracking-wide">{show ? "Hide" : "Show"}</button>
                  </div>
                </label>

                {err && <p className="text-[12px] font-semibold text-danger-600 flex items-center gap-1.5"><IAlert size={12} /> {err}</p>}

                <button type="submit" disabled={busy || lockLeft > 0}
                  className="w-full h-11 rounded-lg bg-brand-600 text-white text-[13.5px] font-bold shadow-card hover:bg-brand-700 disabled:opacity-50 active:scale-[0.99] transition-all">
                  {busy ? "Verifying…" : "Sign in to Meridian ERP"}
                </button>
              </form>

              <button onClick={() => fail("A password reset link has been sent to your registered email (demo).")}
                className="mt-3 text-[12px] font-semibold text-brand-700 hover:text-brand-800 underline-offset-2 hover:underline">Forgot password?</button>

              <div className="mt-7 pt-5 border-t border-line">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-ink-300 mb-2.5">Demo accounts — one-tap sign in</p>
                <div className="grid grid-cols-2 gap-2">
                  {quick.map((u) => (
                    <button key={u.id} onClick={() => { setUser(u.email); setPass("Welcome@123"); setErr(""); }}
                      className="flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3 py-2.5 hover:border-brand-300 hover:bg-brand-50/40 active:scale-[0.98] transition-all text-left">
                      <span className="h-7 w-7 rounded-full grid place-items-center text-[10px] font-bold bg-brand-600 text-white shrink-0">{u.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
                      <span className="min-w-0">
                        <span className="block text-[11.5px] font-bold text-ink-900 truncate">{u.name}</span>
                        <span className="block text-[9.5px] text-ink-400 uppercase tracking-wide font-semibold">{u.role.replace("_", " ")}</span>
                      </span>
                    </button>))}
                </div>
                <p className="mt-3 text-[10.5px] text-ink-300 num">Tip: <b>rohan.b</b> / <b>Welcome@123</b> · new joiner <b>aarav.j</b> / <b>Temp@90210</b> (forces password change)</p>
              </div>
            </>
          ) : (
            /* forced password change */
            <div className="fade-up">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-amber-600">First login — security step</p>
              <h1 className="font-display text-[24px] font-bold text-ink-900 tracking-tight mt-1.5">Set your own password</h1>
              <p className="text-[12.5px] text-ink-400 mt-1">Hi <b className="text-ink-900">{tempUser.name}</b> — your account was issued a temporary password. Create a personal one to continue.</p>
              <div className="mt-5 space-y-3.5">
                <label className="block">
                  <span className="block text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-1.5">New password</span>
                  <input type="password" value={np} onChange={(e) => { setNp(e.target.value); setNpErr(""); }}
                    className="w-full h-11 px-3 rounded-lg border border-line bg-surface text-[13.5px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all" />
                  {np && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[0, 1, 2, 3].map((i) => <span key={i} className={cx("h-1.5 flex-1 rounded-full transition-all", i < sc ? STRENGTH_META[sc].c : "bg-line")} />)}
                      </div>
                      <p className={cx("text-[10.5px] font-bold mt-1", STRENGTH_META[sc].t)}>{STRENGTH_META[sc].l}</p>
                    </div>)}
                </label>
                <label className="block">
                  <span className="block text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-1.5">Confirm password</span>
                  <input type="password" value={np2} onChange={(e) => { setNp2(e.target.value); setNpErr(""); }}
                    className="w-full h-11 px-3 rounded-lg border border-line bg-surface text-[13.5px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all" />
                </label>
                {npErr && <p className="text-[12px] font-semibold text-danger-600 flex items-center gap-1.5"><IAlert size={12} /> {npErr}</p>}
                <button onClick={changePw} disabled={!np || !np2}
                  className="w-full h-11 rounded-lg bg-brand-600 text-white text-[13.5px] font-bold shadow-card hover:bg-brand-700 disabled:opacity-50 active:scale-[0.99] transition-all">
                  Set password & sign in
                </button>
                <p className="text-[10.5px] text-ink-300 text-center">Never shared with administrators — stored as a salted hash only.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════ Session Manager (profile popover / security) ══════════ */
export function SessionManager({ compact }: { compact?: boolean }) {
  const { s, setS, user, log } = useERP();
  const mine = s.sessions.filter((x) => x.user === user.name);
  const [confirmAll, setConfirmAll] = useState(false);

  const revoke = (ss: SessionRec) => {
    setS((p) => ({ ...p, sessions: p.sessions.filter((x) => x.id !== ss.id) }));
    log("Identity", "Session Revoked", user.name, `${ss.device} · ${ss.ip}`);
  };
  const revokeAll = () => {
    setS((p) => ({ ...p, sessions: p.sessions.filter((x) => !(x.user === user.name && !x.current)) }));
    log("Identity", "All Sessions Revoked", user.name, "Logout from all devices");
    setConfirmAll(false);
  };

  return (
    <div className={cx("rounded-lg border border-line bg-canvas/50 p-3.5", compact && "p-2.5")}>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-400">Active sessions</p>
        <button onClick={() => setConfirmAll(true)} className="text-[10.5px] font-bold text-danger-600 hover:underline">Log out everywhere</button>
      </div>
      <ul className="space-y-2">
        {(mine.length ? mine : s.sessions.slice(0, 3)).map((x) => (
          <li key={x.id} className="flex items-center gap-2.5 bg-surface border border-line rounded-lg px-3 py-2">
            <span className={cx("h-2 w-2 rounded-full shrink-0", x.current ? "bg-ok-500 animate-pulse-dot" : "bg-line-strong")} />
            <div className="min-w-0 flex-1">
              <p className="text-[11.5px] font-semibold text-ink-900 truncate">{x.device} {x.current && <span className="text-ok-600">· this device</span>}</p>
              <p className="text-[10px] text-ink-400 num">{x.ip} · active {x.lastActive}</p>
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
