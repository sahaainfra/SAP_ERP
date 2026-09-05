/* Meridian ERP · Team Chat & Daily Updates — every user, every team */
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useERP } from "./store";
import type { Msg } from "./store";
import { cx } from "./ui";
import { IX, ISearch, IHardhat, IUsers, IMixer, ICart, IWarehouse, ILedger, ICalCheck } from "./icons";

/* ── tiny inline glyphs ────────────────────────────────────── */
export const IChat = ({ size = 15, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 12a8 8 0 0 1-8 8H4l2.2-2.6A8 8 0 1 1 21 12z" /><path d="M8.5 10.5h7" /><path d="M8.5 13.5h4.5" />
  </svg>
);
const ISend = ({ size = 14, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 3L10 14" /><path d="M21 3l-7 18-4-7-7-4 18-7z" />
  </svg>
);
const IReply = ({ size = 13, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 17l-5-5 5-5" /><path d="M4 12h10a6 6 0 0 1 6 6v1" />
  </svg>
);
const IPinS = ({ size = 13, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 4h6l-1 6 3 3v1H7v-1l3-3-1-6z" /><path d="M12 14v6" />
  </svg>
);
const IClip = ({ size = 13, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21 11.5l-8.5 8.5a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L15 7.5" />
  </svg>
);

/* ── helpers ───────────────────────────────────────────────── */
const hue = (n: string) => { let h = 0; for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) % 360; return h; };
const initials = (n: string) => n.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
const fmtTime = (ts: string) => new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
const dayLabel = (ts: string) => {
  const d = new Date(ts); const now = new Date();
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, now)) return "Today";
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (same(d, y)) return "Yesterday";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};
const readKey = (ch: string) => "mer.chat.read." + ch;
const lastRead = (ch: string) => localStorage.getItem(readKey(ch)) ?? "1970-01-01";

/* ── unread hook (header badge + launcher) ─────────────────── */
export function useChatUnread() {
  const { s, user } = useERP();
  return useMemo(() => s.messages.filter((m) => m.user !== user.name && m.ts > lastRead(m.ch)).length, [s.messages, user.name]);
}

/* ── channel model ─────────────────────────────────────────── */
interface Channel { id: string; name: string; sub: string; icon: ReactNode; kind: "team" | "project" | "dept" }
const DEPT_CH: Channel[] = [
  { id: "Commercial", name: "Commercial", sub: "Contracts · Billing", icon: <ICalCheck size={14} />, kind: "dept" },
  { id: "Procurement", name: "Procurement", sub: "PR · RFQ · PO", icon: <ICart size={14} />, kind: "dept" },
  { id: "Store", name: "Store & Stock", sub: "GRN · Issues", icon: <IWarehouse size={14} />, kind: "dept" },
  { id: "RMC", name: "RMC Plant", sub: "Production · QC", icon: <IMixer size={14} />, kind: "dept" },
  { id: "Accounts", name: "Accounts", sub: "AP · AR · Bank", icon: <ILedger size={14} />, kind: "dept" },
  { id: "HR", name: "HR & People", sub: "Attendance · Payroll", icon: <IUsers size={14} />, kind: "dept" },
];
const RESPONDER: Record<string, { user: string; role: string }> = {
  all: { user: "Anjali Verma", role: "HR Manager" },
  Commercial: { user: "Vikram Sethi", role: "Commercial Manager" },
  Procurement: { user: "Meera Kulkarni", role: "Procurement Manager" },
  Store: { user: "Dinesh Pawar", role: "Store Keeper" },
  RMC: { user: "Sandeep Kulkarni", role: "RMC Plant Manager" },
  Accounts: { user: "Prakash Rao", role: "Accounts Manager" },
  HR: { user: "Anjali Verma", role: "HR Manager" },
};
const ACKS = ["Noted, thanks.", "Copy that — will action today.", "Received. Will confirm by EOD.", "Good — keep the photos on record.", "Logged. I'll pick this up next."];

/* ══════════ Chat Panel ══════════ */
export function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { s, setS, user } = useERP();
  const me = user.name;
  const [ch, setCh] = useState<string>(() => localStorage.getItem("mer.chat.ch") ?? "all");
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [text, setText] = useState("");
  const [showUpdate, setShowUpdate] = useState(false);
  const [upd, setUpd] = useState({ work: "", manpower: "", issues: "", plan: "" });
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const [showChannels, setShowChannels] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const channels: Channel[] = useMemo(() => [
    { id: "all", name: "All Teams", sub: "Company-wide", icon: <IUsers size={14} />, kind: "team" },
    ...s.projects.slice(0, 6).map((p): Channel => ({ id: p.id, name: p.code, sub: p.name.slice(0, 26), icon: <IHardhat size={14} />, kind: "project" })),
    ...DEPT_CH,
  ], [s.projects]);

  const msgs = useMemo(() => {
    const t = q.trim().toLowerCase();
    return s.messages.filter((m) => m.ch === ch && (!t || (m.text + " " + m.user).toLowerCase().includes(t)));
  }, [s.messages, ch, q]);

  const pinned = msgs.filter((m) => m.pinned).slice(-1)[0];
  const unreadIn = (cid: string) => s.messages.filter((m) => m.ch === cid && m.user !== me && m.ts > lastRead(cid)).length;
  const lastMsg = (cid: string) => [...s.messages].filter((m) => m.ch === cid).sort((a, b) => b.ts.localeCompare(a.ts))[0];

  /* mark channel read whenever it's open and messages change */
  useEffect(() => {
    if (!open) return;
    const latest = s.messages.filter((m) => m.ch === ch).sort((a, b) => b.ts.localeCompare(a.ts))[0];
    if (latest) localStorage.setItem(readKey(ch), latest.ts);
  }, [open, ch, s.messages]);

  useEffect(() => { localStorage.setItem("mer.chat.ch", ch); }, [ch]);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length, typing, open, ch]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const push = (m: Omit<Msg, "id" | "ts" | "reactions">) => {
    setS((p) => ({ ...p, messages: [...p.messages, { ...m, id: "mg" + Date.now() + Math.floor(Math.random() * 99), ts: new Date().toISOString(), reactions: {} }] }));
  };

  const send = (kind: Msg["kind"], body: string, meta?: Msg["meta"]) => {
    if (!body.trim() && kind === "text") return;
    push({ ch, user: me, role: user.title, kind, text: body.trim(), meta, replyTo: replyTo?.id });
    setReplyTo(null); setText("");
    /* living response — a teammate acknowledges */
    const r = ch in RESPONDER ? RESPONDER[ch] : { user: s.projects.find((p) => p.id === ch)?.pm ?? "Sunita Deshmukh", role: "Project Manager" };
    const mine = body.toLowerCase();
    const ack = kind === "update" ? "Well recorded — keep the MB entries in sync with this."
      : kind === "issue" ? "On it. Raising a site issue ticket and will update within the hour."
      : mine.includes("mr-") || mine.includes("po-") || mine.includes("grn-") ? "Tracking that reference in the register — will confirm shortly."
      : ACKS[(body.length + ch.length) % ACKS.length];
    window.setTimeout(() => setTyping(r.user), 900);
    window.setTimeout(() => {
      setTyping(null);
      push({ ch, user: r.user, role: r.role, kind: "text", text: ack, replyTo: undefined });
    }, 2400);
  };

  const react = (m: Msg, emoji: string) => {
    setS((p) => ({ ...p, messages: p.messages.map((x) => x.id === m.id ? { ...x, reactions: { ...x.reactions, [emoji]: (x.reactions[emoji] ?? 0) + 1 } } : x) }));
  };
  const togglePin = (m: Msg) => setS((p) => ({ ...p, messages: p.messages.map((x) => x.id === m.id ? { ...x, pinned: !x.pinned } : x) }));

  const renderText = (t: string) => t.split(/(@[A-Za-z][A-Za-z ]+[A-Za-z])/g).map((part, i) =>
    part.startsWith("@") ? <span key={i} className="font-semibold text-brand-700">{part}</span> : part);

  if (!open) return null;
  const active = channels.find((c) => c.id === ch) ?? channels[0];

  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-side-900/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full sm:w-[760px] bg-surface border-l border-line shadow-pop drawer-in flex">
        {/* channel rail */}
        {showChannels && (
          <aside className="w-[218px] shrink-0 border-r border-line bg-canvas/60 flex-col hidden sm:flex">
            <div className="px-4 pt-4 pb-3 border-b border-line">
              <p className="font-display font-bold text-[14px] text-ink-900 flex items-center gap-2"><IChat size={16} className="text-brand-600" /> Team Chat</p>
              <p className="text-[10px] text-ink-400 mt-0.5 uppercase tracking-[0.12em] font-semibold">Daily updates · Queries · Coordination</p>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {(["team", "project", "dept"] as const).map((k) => (
                <div key={k}>
                  <p className="px-4 pt-2.5 pb-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink-300">
                    {k === "team" ? "Channels" : k === "project" ? "Project Teams" : "Departments"}
                  </p>
                  {channels.filter((c) => c.kind === k).map((c) => {
                    const un = unreadIn(c.id);
                    const lm = lastMsg(c.id);
                    return (
                      <button key={c.id} onClick={() => { setCh(c.id); setQ(""); setShowUpdate(false); setReplyTo(null); }}
                        className={cx("w-full flex items-center gap-2.5 px-3 py-2 mx-1.5 rounded-lg text-left transition-all active:scale-[0.98]", ch === c.id ? "bg-brand-50 border border-brand-200" : "hover:bg-canvas border border-transparent")}>
                        <span className={cx("h-7.5 w-7.5 h-8 w-8 rounded-lg grid place-items-center shrink-0", ch === c.id ? "bg-brand-600 text-white" : "bg-surface border border-line text-ink-400")}>{c.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className={cx("text-[12px] font-bold truncate", ch === c.id ? "text-brand-700" : "text-ink-900")}>{c.name}</span>
                            {un > 0 && <span className="num text-[9px] font-bold bg-danger-500 text-white rounded-full px-1.5 py-px shrink-0">{un}</span>}
                          </span>
                          <span className="block text-[10px] text-ink-400 truncate mt-px">{lm ? `${lm.user.split(" ")[0]}: ${lm.text.slice(0, 24) || lm.meta?.file || "Daily update"}` : c.sub}</span>
                        </span>
                      </button>);
                  })}
                </div>))}
            </div>
          </aside>
        )}

        {/* conversation */}
        <section className="flex-1 min-w-0 flex flex-col">
          <header className="flex items-center gap-3 px-4 h-14 border-b border-line bg-surface/95 backdrop-blur shrink-0">
            <button onClick={() => setShowChannels((v) => !v)} className="sm:hidden h-8 w-8 grid place-items-center rounded-lg border border-line text-ink-500 active:scale-90 transition-all"><IUsers size={14} /></button>
            <span className="h-8 w-8 rounded-lg grid place-items-center bg-brand-600 text-white shrink-0">{active.icon}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-ink-900 leading-tight truncate">{active.name} <span className="text-ink-300 font-medium text-[11px]">· {active.sub}</span></p>
              <p className="text-[10px] text-ink-400 num">{active.kind === "project" ? "Site team + PM + Store" : active.kind === "dept" ? "Department members" : "Everyone at Sahaa Infra"} · {typing ? <span className="text-brand-700 font-semibold">{typing} is typing…</span> : "connected"}</p>
            </div>
            <button onClick={() => setSearching((v) => !v)} className={cx("h-8 w-8 grid place-items-center rounded-lg border transition-all active:scale-90", searching ? "border-brand-300 bg-brand-50 text-brand-700" : "border-line text-ink-400 hover:text-ink-900")}><ISearch size={14} /></button>
            <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded-lg border border-line text-ink-400 hover:text-ink-900 active:scale-90 transition-all"><IX size={14} /></button>
          </header>

          {searching && (
            <div className="px-4 py-2 border-b border-line bg-canvas/50 fade-up">
              <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search in ${active.name}…`}
                className="w-full h-8 px-3 rounded-md border border-line bg-surface text-[12.5px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all" />
            </div>
          )}

          {pinned && !q && (
            <div className="px-4 py-2 border-b border-amber-500/25 bg-amber-100/30 flex items-center gap-2 text-[11.5px]">
              <IPinS size={12} className="text-amber-600 shrink-0" />
              <span className="truncate text-ink-700"><b>{pinned.user}:</b> {pinned.text.slice(0, 90)}</span>
              <button onClick={() => togglePin(pinned)} className="ml-auto text-[10px] font-bold text-amber-600 hover:text-amber-700 shrink-0">Unpin</button>
            </div>
          )}

          {/* messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
            style={{ background: "radial-gradient(1200px 400px at 80% -10%, rgba(12,114,100,0.05), transparent), radial-gradient(900px 300px at 0% 110%, rgba(224,163,59,0.045), transparent)" }}>
            {msgs.map((m, i) => {
              const mine = m.user === me;
              const prev = msgs[i - 1];
              const newDay = !prev || dayLabel(prev.ts) !== dayLabel(m.ts);
              const grouped = prev && !newDay && prev.user === m.user;
              return (
                <div key={m.id}>
                  {newDay && (
                    <div className="flex items-center gap-3 my-4">
                      <span className="flex-1 h-px bg-line" />
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink-300 bg-canvas border border-line rounded-full px-2.5 py-0.5">{dayLabel(m.ts)}</span>
                      <span className="flex-1 h-px bg-line" />
                    </div>)}
                  <div className={cx("flex gap-2.5 group", mine ? "flex-row-reverse" : "", grouped ? "mt-0.5" : "mt-3 msg-in")}>
                    {!mine && (
                      <span className="h-8 w-8 rounded-full grid place-items-center text-[10px] font-bold shrink-0 mt-0.5 select-none"
                        style={{ background: `hsl(${hue(m.user)} 32% 88%)`, color: `hsl(${hue(m.user)} 45% 30%)`, border: `1px solid hsl(${hue(m.user)} 30% 78%)` }}>
                        {initials(m.user)}
                      </span>)}
                    <div className={cx("max-w-[78%] min-w-0", mine ? "items-end text-right" : "")}>
                      {!grouped && (
                        <p className={cx("text-[10.5px] mb-0.5 px-1", mine ? "text-right" : "")}>
                          <span className="font-bold text-ink-700">{mine ? "You" : m.user}</span>
                          <span className="text-ink-300"> · {m.role} · </span>
                          <span className="num text-ink-300">{fmtTime(m.ts)}</span>
                        </p>)}

                      {/* body variants */}
                      {m.kind === "update" ? (
                        <div className={cx("rounded-xl border p-3 text-left", mine ? "border-brand-300 bg-brand-50" : "border-brand-200 bg-brand-50/60")}>
                          <p className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-brand-700 flex items-center gap-1.5 mb-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse-dot" /> Daily Update · {active.name}
                          </p>
                          {m.text && <p className="text-[12px] text-ink-700 mb-2">{m.text}</p>}
                          {[["Work executed", m.meta?.work, "text-ok-600"], ["Manpower", m.meta?.manpower, "text-brand-700"], ["Issues / blockers", m.meta?.issues, "text-amber-600"], ["Plan tomorrow", m.meta?.plan, "text-ink-500"]].map(([k, v, c]) => v ? (
                            <div key={k as string} className="py-1 border-t border-brand-100 first:border-0">
                              <p className={cx("text-[9.5px] font-bold uppercase tracking-wide", c as string)}>{k}</p>
                              <p className="text-[11.5px] text-ink-700 mt-0.5 leading-relaxed">{v}</p>
                            </div>) : null)}
                        </div>
                      ) : m.kind === "issue" ? (
                        <div className="rounded-xl border border-danger-500/30 bg-danger-100/25 px-3 py-2.5 text-left">
                          <p className="text-[9.5px] font-extrabold uppercase tracking-[0.12em] text-danger-600 mb-1">⚠ Site Issue</p>
                          <p className="text-[12.5px] text-ink-900 leading-relaxed">{renderText(m.text)}</p>
                        </div>
                      ) : m.kind === "file" ? (
                        <div className="rounded-xl border border-line bg-surface px-3 py-2.5 text-left flex items-center gap-3">
                          <span className="h-9 w-9 rounded-lg grid place-items-center bg-steel-100 text-steel-600 shrink-0"><IClip size={15} /></span>
                          <div className="min-w-0">
                            <p className="text-[12px] font-bold text-brand-700 truncate">{m.meta?.file}</p>
                            <p className="text-[10px] text-ink-400 mt-px">{m.text}</p>
                          </div>
                        </div>
                      ) : (
                        <div className={cx("inline-block rounded-xl px-3 py-2 text-left border",
                          mine ? "bg-brand-600 text-white border-brand-600 shadow-card" : "bg-surface border-line text-ink-900",
                          m.replyTo && !mine && "border-l-2 border-l-brand-500")}>
                          {m.replyTo && (() => {
                            const orig = s.messages.find((x) => x.id === m.replyTo);
                            return orig ? <p className={cx("text-[10px] mb-1 pb-1 border-b", mine ? "border-white/20 text-white/75" : "border-line text-ink-400")}>↳ {orig.user.split(" ")[0]}: {orig.text.slice(0, 60)}</p> : null;
                          })()}
                          <p className="text-[12.5px] leading-relaxed">{renderText(m.text)}</p>
                        </div>)}

                      {/* reactions + hover tools */}
                      <div className={cx("flex items-center gap-1 mt-1 min-h-[20px]", mine ? "justify-end" : "")}>
                        {Object.entries(m.reactions).map(([e, n]) => (
                          <button key={e} onClick={() => react(m, e)}
                            className="num text-[10.5px] font-bold bg-canvas border border-line rounded-full px-1.5 py-px hover:border-brand-300 hover:bg-brand-50 active:scale-90 transition-all">
                            {e} {n}
                          </button>))}
                        {mine && <span className="text-[9.5px] text-ink-300 num px-1">✓✓ seen</span>}
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                          {["👍", "✅", "⚠️"].map((e) => (
                            <button key={e} onClick={() => react(m, e)} className="h-6 w-6 grid place-items-center rounded-full hover:bg-canvas active:scale-75 transition-all text-[11px]">{e}</button>))}
                          <button onClick={() => setReplyTo(m)} className="h-6 w-6 grid place-items-center rounded-full hover:bg-canvas text-ink-300 hover:text-brand-700 active:scale-75 transition-all" title="Reply"><IReply /></button>
                          <button onClick={() => togglePin(m)} className={cx("h-6 w-6 grid place-items-center rounded-full hover:bg-canvas active:scale-75 transition-all", m.pinned ? "text-amber-500" : "text-ink-300 hover:text-amber-500")} title="Pin"><IPinS /></button>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>);
            })}

            {typing && (
              <div className="flex items-center gap-2.5 mt-3 msg-in">
                <span className="h-8 w-8 rounded-full grid place-items-center text-[10px] font-bold"
                  style={{ background: `hsl(${hue(typing)} 32% 88%)`, color: `hsl(${hue(typing)} 45% 30%)` }}>{initials(typing)}</span>
                <span className="inline-flex items-center gap-1 bg-surface border border-line rounded-xl px-3 py-2.5">
                  {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 rounded-full bg-ink-300 typing-dot" style={{ animationDelay: `${i * 0.18}s` }} />)}
                </span>
              </div>)}
            {msgs.length === 0 && (
              <div className="h-full grid place-items-center text-center py-10">
                <div>
                  <span className="h-12 w-12 rounded-2xl grid place-items-center bg-brand-50 text-brand-600 border border-brand-100 mx-auto"><IChat size={22} /></span>
                  <p className="font-display font-bold text-[15px] text-ink-900 mt-3">No messages {q ? "match your search" : "yet"}</p>
                  <p className="text-[12px] text-ink-400 mt-1 max-w-[260px] mx-auto">{q ? "Try another keyword or clear the search." : "Start the conversation — post a daily update or drop a query."}</p>
                </div>
              </div>)}
          </div>

          {/* composer */}
          <footer className="border-t border-line bg-surface px-4 pt-2.5 pb-3 shrink-0">
            {replyTo && (
              <div className="flex items-center gap-2 mb-2 text-[11px] bg-canvas border border-line rounded-lg px-2.5 py-1.5 fade-up">
                <IReply className="text-brand-600 shrink-0" />
                <span className="truncate text-ink-500">Replying to <b className="text-ink-900">{replyTo.user}</b>: {replyTo.text.slice(0, 50)}</span>
                <button onClick={() => setReplyTo(null)} className="ml-auto text-ink-300 hover:text-danger-600 transition-colors"><IX size={11} /></button>
              </div>)}

            {showUpdate ? (
              <div className="rounded-xl border border-brand-200 bg-brand-50/50 p-3 mb-2 fade-up space-y-2">
                <p className="text-[9.5px] font-extrabold uppercase tracking-[0.14em] text-brand-700">Structured daily update — {active.name}</p>
                {([["work", "Work executed today", "e.g. PC-115 rebar 60% · de-shuttering PC-109"],
                ["manpower", "Manpower deployed", "e.g. 342 present · 12 bar benders short"],
                ["issues", "Issues / blockers", "e.g. cover block shortage · pump line wear"],
                ["plan", "Plan for tomorrow", "e.g. start PC-115 rebar 6 AM · MB entry PC-109"]] as const).map(([k, l, ph]) => (
                  <input key={k} value={upd[k]} onChange={(e) => setUpd({ ...upd, [k]: e.target.value })} placeholder={ph}
                    className="w-full h-8 px-2.5 rounded-md border border-line bg-surface text-[12px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all placeholder:text-ink-300" />))}
                <div className="flex justify-end gap-2 pt-1">
                  <button onClick={() => setShowUpdate(false)} className="h-7 px-3 rounded-md border border-line text-[11.5px] font-semibold text-ink-500 hover:bg-canvas active:scale-95 transition-all">Cancel</button>
                  <button onClick={() => {
                    if (!upd.work && !upd.plan) return;
                    send("update", text || `Daily update — ${active.name} · ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}`, upd);
                    setUpd({ work: "", manpower: "", issues: "", plan: "" }); setShowUpdate(false);
                  }} className="h-7 px-3.5 rounded-md bg-brand-600 text-white text-[11.5px] font-semibold hover:bg-brand-700 active:scale-95 transition-all inline-flex items-center gap-1.5"><ISend size={11} /> Post Update</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 mb-2 overflow-x-auto">
                <button onClick={() => setShowUpdate(true)} className="shrink-0 h-7 px-2.5 rounded-full border border-brand-200 bg-brand-50 text-brand-700 text-[11px] font-bold hover:bg-brand-100 active:scale-95 transition-all">📋 Daily Update</button>
                <button onClick={() => send("issue", text.trim() ? text.trim() : "SITE ISSUE — ")} className="shrink-0 h-7 px-2.5 rounded-full border border-danger-500/30 bg-danger-100/40 text-danger-600 text-[11px] font-bold hover:bg-danger-100 active:scale-95 transition-all">⚠ Site Issue</button>
                <button onClick={() => push({ ch, user: me, role: user.title, kind: "file", text: "Shared from Documents module", meta: { file: `site-photo-${String(Math.floor(Math.random() * 90) + 10)}.jpg` }, replyTo: replyTo?.id })}
                  className="shrink-0 h-7 px-2.5 rounded-full border border-line text-ink-500 text-[11px] font-bold hover:bg-canvas active:scale-95 transition-all">📷 Photo</button>
                <button onClick={() => push({ ch, user: me, role: user.title, kind: "file", text: "Attachment for the team", meta: { file: "delivery-challan.pdf" }, replyTo: replyTo?.id })}
                  className="shrink-0 h-7 w-7 grid place-items-center rounded-full border border-line text-ink-400 hover:text-brand-700 hover:bg-canvas active:scale-90 transition-all"><IClip /></button>
              </div>)}

            <div className="flex items-end gap-2">
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send("text", text); } }}
                rows={1} placeholder={`Message ${active.name}…  (Enter to send · @ to mention)`}
                className="flex-1 resize-none rounded-xl border border-line bg-canvas/60 px-3.5 py-2.5 text-[13px] outline-none focus:bg-surface focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition-all placeholder:text-ink-300 max-h-[120px]" />
              <button onClick={() => send("text", text)} disabled={!text.trim()}
                className="h-10 w-10 shrink-0 rounded-xl bg-brand-600 text-white grid place-items-center shadow-card hover:bg-brand-700 disabled:opacity-35 disabled:pointer-events-none active:scale-90 transition-all">
                <ISend size={15} />
              </button>
            </div>
            <p className="text-[9.5px] text-ink-300 mt-1.5 num">Messages sync in real time · posted updates appear in the channel feed and team dashboards</p>
          </footer>
        </section>
      </div>
    </div>
  );
}
