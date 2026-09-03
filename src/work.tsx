import { useEffect, useMemo, useRef, useState } from "react";
import { ROLES, RoleId, fmtNum } from "./data";
import { useERP } from "./store";
import type { ERPState } from "./store";
import { Widget, Empty, Pill, Reveal, cx, useToast } from "./ui";
import { PageHead, Seg, Stat, Btn, Field, inputCls, Drawer } from "./modules/core";
import { printDocument } from "./print";
import { ICheck, ISig, IEdit, ISend, IClock, IBell, IPen, IEye, IPrinter } from "./icons";
import type { Route } from "./shell";

/* ── signature persistence (per user, outside ERP state) ───── */
const SIG_KEY = "meridian.sigs";
interface SigMeta { dataUrl: string; ver: number; updated: string; active: boolean }
type SigMap = Record<string, SigMeta>;
const readSigs = (): SigMap => { try { return JSON.parse(localStorage.getItem(SIG_KEY) || "{}"); } catch { return {}; } };
const writeSigs = (m: SigMap) => localStorage.setItem(SIG_KEY, JSON.stringify(m));
export const getSig = (name: string): SigMeta | null => readSigs()[name] ?? null;

const nowStr = () => new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const timeStr = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

/* ── Signature pad (canvas) ────────────────────────────────── */
export function SignaturePad({ onSave, initial }: { onSave: (dataUrl: string) => void; initial?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#17324b";
    if (initial) { const img = new Image(); img.onload = () => ctx.drawImage(img, 0, 0, c.width, c.height); img.src = initial; }
  }, [initial]);
  const pt = (e: React.PointerEvent) => { const c = ref.current!; const r = c.getBoundingClientRect(); return { x: (e.clientX - r.left) * (c.width / r.width), y: (e.clientY - r.top) * (c.height / r.height) }; };
  const down = (e: React.PointerEvent) => { drawing.current = true; const ctx = ref.current!.getContext("2d")!; const p = pt(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); (e.target as Element).setPointerCapture(e.pointerId); };
  const move = (e: React.PointerEvent) => { if (!drawing.current) return; const ctx = ref.current!.getContext("2d")!; const p = pt(e); ctx.lineTo(p.x, p.y); ctx.stroke(); setDirty(true); };
  const up = () => { drawing.current = false; };
  const clear = () => { const c = ref.current!; c.getContext("2d")!.clearRect(0, 0, c.width, c.height); setDirty(false); };
  return (
    <div>
      <div className="rounded-lg border border-dashed border-line-strong bg-surface overflow-hidden">
        <canvas ref={ref} width={640} height={200} className="w-full h-[150px] cursor-crosshair touch-none"
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Btn sm onClick={clear}>Clear</Btn>
        <span className="text-[10.5px] text-ink-400">{dirty ? "Draw with mouse or touch" : "Sign in the box above"}</span>
        <Btn sm kind="primary" className="ml-auto" disabled={!dirty}
          onClick={() => onSave(ref.current!.toDataURL("image/png"))}><ICheck size={12} /> Capture</Btn>
      </div>
    </div>
  );
}

/* ── Signature Manager ─────────────────────────────────────── */
export function SignaturePage() {
  const { user, log, notify } = useERP();
  const toast = useToast();
  const [sig, setSig] = useState<SigMeta | null>(() => getSig(user.name));
  const [drawing, setDrawing] = useState(false);

  const save = (dataUrl: string) => {
    const m = readSigs();
    const prev = m[user.name];
    const next: SigMeta = { dataUrl, ver: (prev?.ver ?? 0) + 1, updated: nowStr(), active: true };
    m[user.name] = next; writeSigs(m); setSig(next); setDrawing(false);
    log("Signature", prev ? "Signature Replaced" : "Signature Created", user.name, `Version ${next.ver} activated`);
    notify("system", `Digital signature v${next.ver} activated for ${user.name}`);
    toast("success", `Signature v${next.ver} saved & activated`);
  };
  const toggle = () => {
    if (!sig) return;
    const m = readSigs(); m[user.name] = { ...sig, active: !sig.active }; writeSigs(m); setSig(m[user.name]);
    log("Signature", sig.active ? "Signature Deactivated" : "Signature Activated", user.name, `Version ${sig.ver}`);
    toast("info", `Signature ${sig.active ? "deactivated" : "activated"}`);
  };

  return (
    <div className="fade-up">
      <PageHead title="Digital Signatures" crumbs={["Meridian", "Control", "Signatures"]}
        desc="Your signature is captured once, versioned, and applied only when you explicitly approve a document.">
        <Stat label="Status" value={sig ? (sig.active ? "Active" : "Inactive") : "Not set"} tone={sig?.active ? "ok" : "warn"} />
        {sig && <Stat label="Version" value={`v${sig.ver}`} sub={`updated ${sig.updated}`} />}
      </PageHead>

      <div className="grid md:grid-cols-2 gap-4">
        <Widget title="My Signature" subtitle="Stored securely against your profile">
          {!sig || drawing ? (
            <SignaturePad onSave={save} initial={sig?.dataUrl} />
          ) : (
            <div>
              <div className="rounded-lg border border-line bg-surface p-4 grid place-items-center h-[150px]">
                <img src={sig.dataUrl} alt="signature" className="max-h-[120px] max-w-full object-contain" />
              </div>
              <div className="flex items-center gap-2 mt-3">
                <Btn onClick={() => setDrawing(true)}><IPen size={13} /> Redraw</Btn>
                <Btn onClick={toggle}>{sig.active ? "Deactivate" : "Activate"}</Btn>
                <span className={cx("ml-auto inline-flex items-center gap-1.5 text-[11px] font-bold", sig.active ? "text-ok-600" : "text-ink-400")}>
                  <span className={cx("h-1.5 w-1.5 rounded-full", sig.active ? "bg-ok-500" : "bg-line-strong")} /> v{sig.ver} · {sig.updated}
                </span>
              </div>
            </div>
          )}
        </Widget>
        <Widget title="How signing works" subtitle="Audit-protected approval signature">
          <ul className="space-y-2.5">
            {[
              ["Capture", "Draw or replace your signature; each change creates a new version."],
              ["Approve & Sign", "When you approve a document, your active signature, name, designation, date, time and IP are recorded."],
              ["Printed output", "Approved documents carry your signature block in the PDF/print layout."],
              ["Protection", "A signature is never applied without an explicit approval action, and only you (or an admin) can manage it."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="h-6 w-6 rounded-full grid place-items-center bg-brand-50 text-brand-700 border border-brand-100 num text-[11px] font-bold shrink-0">{i + 1}</span>
                <div><p className="text-[12.5px] font-semibold text-ink-900">{t}</p><p className="text-[11.5px] text-ink-500 mt-0.5 leading-snug">{d}</p></div>
              </li>
            ))}
          </ul>
        </Widget>
      </div>
    </div>
  );
}

/* ── Approval queue model ──────────────────────────────────── */
export interface QItem {
  key: string; ref: string; type: string; project: string; by: string; amount: string; date: string;
  status: string; source: "pr" | "po" | "pay" | "leave" | "bill" | "att"; ts: number;
}
export function buildQueue(s: ERPState): QItem[] {
  const q: QItem[] = [];
  s.prs.filter((p) => p.status === "Submitted" || p.status === "Under Approval").forEach((p) =>
    q.push({ key: "pr:" + p.id, ref: p.no, type: "Purchase Requisition", project: p.project, by: p.by, amount: `₹${(p.lines.reduce((a, l) => a + l.qty * l.rate, 0) / 1e5).toFixed(1)} L`, date: p.date, status: p.status, source: "pr", ts: p.ts }));
  s.pos.filter((p) => p.status === "Pending Approval").forEach((p) =>
    q.push({ key: "po:" + p.id, ref: p.no, type: "Purchase Order", project: p.project, by: p.vendor, amount: `₹${(p.lines.reduce((a, l) => a + l.qty * l.rate, 0) / 1e5).toFixed(1)} L`, date: p.date, status: p.status, source: "po", ts: p.ts }));
  s.payments.filter((p) => p.status === "Pending").forEach((p) =>
    q.push({ key: "pay:" + p.id, ref: p.no, type: "Vendor Payment", project: "—", by: "Accounts", amount: `₹${p.amount.toFixed(1)} L`, date: p.date, status: p.status, source: "pay", ts: Date.now() - 864e5 }));
  s.leaves.filter((l) => l.status === "Pending").forEach((l) =>
    q.push({ key: "leave:" + l.id, ref: `LV-${l.emp.split(" ")[0]}`, type: "Leave Request", project: "—", by: l.emp, amount: `${l.days} day(s)`, date: l.from, status: l.status, source: "leave", ts: Date.now() - 2 * 864e5 }));
  s.billDocs.filter((b) => b.status === "Submitted for Checking" || b.status === "Under Approval").forEach((b) =>
    q.push({ key: "bill:" + b.id, ref: b.no, type: b.type, project: b.project, by: b.by, amount: `₹${b.net.toFixed(2)} Cr`, date: b.date, status: b.status, source: "bill", ts: b.ts }));
  s.attendance.filter((a) => a.appr === "Pending").forEach((a) =>
    q.push({ key: "att:" + a.id, ref: a.empId, type: "Attendance", project: a.project, by: a.name, amount: `${a.hours} hrs`, date: "Today", status: "Pending", source: "att", ts: Date.now() - 36e5 }));
  return q.sort((a, b) => a.ts - b.ts);
}

const daysPending = (ts: number) => Math.max(0, Math.floor((Date.now() - ts) / 864e5));

/* ── Approval Centre ───────────────────────────────────────── */
export function ApprovalCentre() {
  const { s, setS, user, role, can, log, notify } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<"pending" | "mine" | "returned" | "signed">("pending");
  const [signing, setSigning] = useState<QItem | null>(null);
  const [returning, setReturning] = useState<QItem | null>(null);
  const [viewing, setViewing] = useState<QItem | null>(null);
  const [q, setQ] = useState("");

  const queue = useMemo(() => buildQueue(s), [s]);
  const pending = queue.filter((i) => (i.ref + i.type + i.by + i.project).toLowerCase().includes(q.toLowerCase()));
  const mine = useMemo(() => queue.filter((i) => i.by === user.name), [queue, user]);
  const returned = s.queries.filter((x) => x.status === "Open" || x.status === "Responded");
  const signed = s.signedLog;

  const canApprove = can("approvals", "approve") || ["SUPER_ADMIN", "MD", "HR", "ACCOUNTS", "PROCUREMENT", "PM", "COMMERCIAL"].includes(role);

  const printSigned = (g: (typeof signed)[number]) => printDocument({
    title: "Approval Certificate", docNo: g.docRef, date: g.date,
    meta: [["Document", g.docRef], ["Action", g.action], ["Approver", g.name], ["Designation", g.desig], ["Date & Time", `${g.date} · ${g.time}`], ["IP / Device", g.ip]],
    cols: [{ label: "Field" }, { label: "Recorded Value" }],
    rows: [["Approver", g.name], ["Role", g.desig], ["Approval action", g.action], ["Date", g.date], ["Time", g.time], ["IP address", g.ip], ["Comment", g.comment || "—"]],
    signBlocks: [{ role: g.action + " By", name: g.name, desig: g.desig, date: g.date, time: g.time, svg: g.svg, comment: g.comment }],
    note: "This is a system-generated approval certificate. The digital signature above was captured at the time of approval and is linked to the immutable audit trail.",
    generatedBy: user.name,
  });

  /* decision engine — mutates the source collection */
  const decide = (item: QItem, verdict: "Approved" | "Rejected", sig?: SigMeta, comment?: string) => {
    const stamp = `${verdict} by ${user.name}`;
    setS((p) => {
      const n = { ...p };
      if (item.source === "pr") n.prs = p.prs.map((x) => x.id === item.key.slice(3) ? { ...x, status: verdict === "Approved" ? "Approved" : "Rejected", history: [...x.history, { ts: Date.now(), action: stamp, by: user.name }] } : x);
      if (item.source === "po") n.pos = p.pos.map((x) => x.id === item.key.slice(3) ? { ...x, status: verdict === "Approved" ? "Approved" : "Pending Approval" } : x);
      if (item.source === "pay") n.payments = p.payments.map((x) => x.id === item.key.slice(4) ? { ...x, status: verdict === "Approved" ? "Released" : "Pending" } : x);
      if (item.source === "leave") n.leaves = p.leaves.map((x) => x.id === item.key.slice(6) ? { ...x, status: verdict } : x);
      if (item.source === "bill") n.billDocs = p.billDocs.map((x) => x.id === item.key.slice(5) ? { ...x, status: verdict === "Approved" ? "Approved" : "Rejected" } : x);
      if (item.source === "att") n.attendance = p.attendance.map((x) => x.id === item.key.slice(4) ? { ...x, appr: verdict } : x);
      if (verdict === "Approved" && sig) n.signedLog = [{ id: "sg" + Date.now(), docRef: item.ref, name: user.name, desig: ROLES.find((r) => r.id === role)?.title ?? "", role, date: nowStr(), time: timeStr(), svg: sig.dataUrl, ip: "10.20.4.18", comment: comment || "Approved", action: "Approved" }, ...p.signedLog];
      return n;
    });
    log("Approvals", `${item.type} ${verdict}`, item.ref, `${item.amount} · ${item.by}${comment ? ` · “${comment}”` : ""}`);
    notify("approval", `${item.ref} ${verdict.toLowerCase()} by ${user.name}`);
    toast(verdict === "Approved" ? "success" : "info", `${item.ref} ${verdict.toLowerCase()}${sig ? " & signed" : ""}`);
  };

  const sendBack = (item: QItem, field: string, text: string, priority: string) => {
    setS((p) => ({
      ...p,
      queries: [{ id: "q" + Date.now(), docRef: item.ref, raisedBy: user.name, text, field, priority, due: "—", status: "Open", ts: Date.now() }, ...p.queries],
      billDocs: item.source === "bill" ? p.billDocs.map((x) => x.id === item.key.slice(5) ? { ...x, status: "Returned for Correction" } : x) : p.billDocs,
      prs: item.source === "pr" ? p.prs.map((x) => x.id === item.key.slice(3) ? { ...x, status: "Returned", history: [...x.history, { ts: Date.now(), action: "Returned for correction", by: user.name }] } : x) : p.prs,
    }));
    log("Approvals", "Returned for Correction", item.ref, `${field} · “${text}”`);
    notify("approval", `${item.ref} returned to ${item.by} — correction requested`);
    toast("info", `${item.ref} returned for correction`);
  };

  return (
    <div className="fade-up">
      <PageHead title="Approval Centre" crumbs={["Meridian", "Control", "Approvals"]}
        desc="One queue for every transaction routed to you — approve & sign, reject, or return for correction with a structured query.">
        <Stat label="My pending" value={String(pending.length)} tone={pending.length ? "warn" : "ok"} />
        <Stat label="Open queries" value={String(returned.length)} tone={returned.length ? "warn" : "ok"} />
        <Stat label="Signed by me" value={String(signed.length)} tone="ok" />
        <Stat label="Avg. ageing" value={`${pending.length ? Math.round(pending.reduce((a, i) => a + daysPending(i.ts), 0) / pending.length) : 0} d`} />
      </PageHead>

      <Widget title="Approval Queue" subtitle="Authority matrix routes each item to the right approver">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Seg value={tab} onChange={setTab} options={[
            { k: "pending" as const, l: "My Pending", n: pending.length },
            { k: "mine" as const, l: "Submitted by Me", n: mine.length },
            { k: "returned" as const, l: "Returned / Queries", n: returned.length },
            { k: "signed" as const, l: "Signed History", n: signed.length },
          ]} />
          {tab === "pending" && <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter queue…" className={cx(inputCls, "w-[200px] ml-auto")} />}
        </div>

        {tab === "pending" && (pending.length === 0
          ? <Empty title="Queue is clear" note="Nothing is waiting on your approval right now." icon={<ICheck size={18} />} />
          : (
            <ul className="space-y-2">
              {pending.map((i) => {
                const age = daysPending(i.ts);
                return (
                  <li key={i.key} className="flex flex-wrap items-center gap-3 rounded-[10px] border border-line bg-surface px-3.5 py-3 hover:border-line-strong hover:shadow-card transition-all">
                    <span className="h-9 w-9 rounded-lg grid place-items-center bg-brand-50 text-brand-700 border border-brand-100 shrink-0 text-[10px] font-bold">{i.type.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                    <div className="min-w-0 flex-1 basis-[220px]">
                      <div className="flex items-center gap-2"><p className="text-[13px] font-bold text-ink-900 num">{i.ref}</p><Pill value={i.status} pulse={age >= 2} /></div>
                      <p className="text-[11px] text-ink-400 mt-0.5">{i.type} · {i.project} · by {i.by} · <span className="num">{i.amount}</span></p>
                    </div>
                    <span className={cx("inline-flex items-center gap-1 text-[10.5px] font-bold num px-2 py-0.5 rounded-full", age >= 3 ? "bg-danger-100 text-danger-600" : age >= 1 ? "bg-warn-100 text-warn-700" : "bg-steel-100 text-steel-600")}>
                      <IClock size={11} /> {age === 0 ? "today" : `${age} d pending`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Btn sm onClick={() => setViewing(i)}><IEye size={12} /> View</Btn>
                      <Btn sm kind="danger" onClick={() => setReturning(i)}><IEdit size={12} /> Return</Btn>
                      {canApprove && <Btn sm kind="primary" onClick={() => setSigning(i)}><ISig size={12} /> Approve &amp; Sign</Btn>}
                    </div>
                  </li>
                );
              })}
            </ul>
          ))}

        {tab === "mine" && (mine.length === 0 ? <Empty title="Nothing submitted" note="Transactions you raise will appear here." /> : (
          <ul className="space-y-2">{mine.map((i) => (
            <li key={i.key} className="flex items-center gap-3 rounded-[10px] border border-line px-3.5 py-3">
              <span className="num text-[12.5px] font-bold text-brand-700 w-[130px]">{i.ref}</span>
              <span className="text-[12px] text-ink-600 flex-1">{i.type}</span>
              <span className="num text-[11.5px] text-ink-400">{i.amount}</span>
              <Pill value={i.status} />
            </li>))}</ul>
        ))}

        {tab === "returned" && (returned.length === 0 ? <Empty title="No open queries" note="Returned documents and queries land here." /> : (
          <ul className="space-y-2">{returned.map((x) => (
            <li key={x.id} className="rounded-[10px] border border-warn-500/30 bg-warn-100/25 px-3.5 py-3">
              <div className="flex items-center gap-2"><p className="text-[12.5px] font-bold text-ink-900 num">{x.docRef}</p><Pill value={x.status} /><span className="ml-auto text-[10.5px] text-ink-400">raised by {x.raisedBy}</span></div>
              {x.field && <p className="text-[10.5px] font-bold uppercase tracking-wide text-warn-700 mt-1">{x.field}</p>}
              <p className="text-[12px] text-ink-600 mt-1 leading-snug">{x.text}</p>
              {x.response && <p className="text-[11.5px] text-ok-600 mt-1.5">↳ {x.response}</p>}
            </li>))}</ul>
        ))}

        {tab === "signed" && (signed.length === 0 ? <Empty title="No signatures yet" note="Documents you approve & sign appear here with full audit detail." /> : (
          <ul className="space-y-2">{signed.map((g) => (
            <li key={g.id} className="flex items-center gap-3 rounded-[10px] border border-line px-3.5 py-3">
              {g.svg ? <img src={g.svg} alt="" className="h-9 w-20 object-contain bg-surface border border-line rounded" /> : <span className="h-9 w-20 grid place-items-center border border-line rounded text-ink-300"><ISig size={16} /></span>}
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold text-ink-900 num">{g.docRef}</p>
                <p className="text-[11px] text-ink-400">{g.name} · {g.desig} · {g.date} {g.time} · IP {g.ip}</p>
              </div>
              <Pill value={g.action} />
              <Btn sm onClick={() => printSigned(g)}><IPrinter size={12} /> Print</Btn>
            </li>))}</ul>
        ))}
      </Widget>

      <SignModal item={signing} onClose={() => setSigning(null)} onDecide={(i, sig, c) => { decide(i, "Approved", sig, c); setSigning(null); }} />
      <ReturnModal item={returning} onClose={() => setReturning(null)} onSubmit={(i, f, t, p) => { sendBack(i, f, t, p); setReturning(null); }} />
      <ViewModal item={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function SignModal({ item, onClose, onDecide }: { item: QItem | null; onClose: () => void; onDecide: (i: QItem, sig: SigMeta, comment?: string) => void }) {
  const { user } = useERP();
  const [comment, setComment] = useState("");
  const [sig, setSig] = useState<SigMeta | null>(null);
  const [drawing, setDrawing] = useState(false);
  useEffect(() => { if (item) { const s0 = getSig(user.name); setSig(s0); setDrawing(!s0); setComment(""); } }, [item, user]);
  if (!item) return null;
  return (
    <Drawer open onClose={onClose} title={`Approve & Sign — ${item.ref}`} sub={`${item.type} · ${item.amount} · ${item.by}`}>
      <div className="space-y-4">
        <div className="rounded-lg border border-line bg-canvas/50 px-3.5 py-3 text-[12px] text-ink-600">
          You are approving <b className="text-ink-900 num">{item.ref}</b> ({item.type}) for <b className="num">{item.amount}</b>. Your active digital signature, name, designation, date, time and IP will be recorded and cannot be repudiated.
        </div>
        <Field label="Approval comment (optional)">
          <textarea rows={2} className={cx(inputCls, "h-auto py-2")} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="e.g. Within delegated limit — approved" />
        </Field>
        <Field label="Digital signature">
          {sig && !drawing ? (
            <div className="flex items-center gap-3">
              <img src={sig.dataUrl} alt="signature" className="h-[70px] object-contain bg-surface border border-line rounded-lg px-2" />
              <div className="text-[11px] text-ink-400">v{sig.ver} · {sig.updated}<br /><button onClick={() => setDrawing(true)} className="text-brand-700 font-semibold hover:underline mt-1">Redraw</button></div>
            </div>
          ) : (
            <SignaturePad onSave={(d) => { const m = readSigs(); const prev = m[user.name]; const next = { dataUrl: d, ver: (prev?.ver ?? 0) + 1, updated: nowStr(), active: true }; m[user.name] = next; writeSigs(m); setSig(next); setDrawing(false); }} initial={sig?.dataUrl} />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn kind="primary" disabled={!sig} onClick={() => sig && onDecide(item, sig, comment)}><ISig size={13} /> Approve &amp; Sign</Btn>
        </div>
      </div>
    </Drawer>
  );
}

function ReturnModal({ item, onClose, onSubmit }: { item: QItem | null; onClose: () => void; onSubmit: (i: QItem, field: string, text: string, priority: string) => void }) {
  const [field, setField] = useState("");
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("Normal");
  useEffect(() => { if (item) { setField(""); setText(""); setPriority("Normal"); } }, [item]);
  if (!item) return null;
  return (
    <Drawer open onClose={onClose} title={`Return for Correction — ${item.ref}`} sub={`${item.type} · raised by ${item.by}`}>
      <div className="space-y-4">
        <p className="text-[12px] text-ink-500 leading-relaxed">The document goes back to <b>{item.by}</b> in <b>Edit Mode</b> with your query attached. The original is never deleted — a new revision is created on resubmission.</p>
        <Field label="Field requiring correction"><input className={inputCls} value={field} onChange={(e) => setField(e.target.value)} placeholder="e.g. BOQ quantity, freight, measurement ref" /></Field>
        <Field label="Query / correction required">
          <textarea rows={3} className={cx(inputCls, "h-auto py-2")} value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Cumulative quantity exceeds certified MB — verify and resubmit." />
        </Field>
        <Field label="Priority">
          <div className="flex gap-1.5">{["Normal", "High", "Urgent"].map((p) => (
            <button key={p} onClick={() => setPriority(p)} className={cx("h-8 px-3 rounded-md border text-[12px] font-semibold transition-all", priority === p ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line text-ink-500 hover:border-line-strong")}>{p}</button>))}
          </div>
        </Field>
        <div className="flex justify-end gap-2">
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn kind="danger" disabled={!text.trim()} onClick={() => onSubmit(item, field || "—", text.trim(), priority)}><ISend size={13} /> Return to Creator</Btn>
        </div>
      </div>
    </Drawer>
  );
}

function ViewModal({ item, onClose }: { item: QItem | null; onClose: () => void }) {
  const { s } = useERP();
  if (!item) return null;
  const versions = s.versions.filter((v) => v.docRef === item.ref);
  const queries = s.queries.filter((x) => x.docRef === item.ref);
  return (
    <Drawer open onClose={onClose} title={item.ref} sub={`${item.type} · ${item.project} · ${item.amount}`}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {[["Status", item.status], ["Submitted by", item.by], ["Date", item.date], ["Pending for", `${daysPending(item.ts)} day(s)`]].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-line bg-canvas/50 px-3 py-2"><p className="text-[9.5px] font-bold uppercase tracking-[0.1em] text-ink-400">{k}</p><p className="text-[12.5px] font-semibold text-ink-900 mt-0.5">{v}</p></div>))}
        </div>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Version history</p>
          {versions.length === 0 ? <p className="text-[12px] text-ink-400">Single version — no revisions yet.</p> : (
            <ul className="space-y-1.5">{versions.map((v) => (
              <li key={v.id} className="flex items-center gap-2.5 text-[12px]"><span className="num text-[10.5px] font-bold bg-steel-100 text-steel-600 rounded px-1.5 py-0.5">v{v.ver}</span><span className="text-ink-700 flex-1 truncate">{v.reason}</span><span className="text-[10.5px] text-ink-300 num">{v.user} · {v.date}</span><Pill value={v.status} /></li>))}</ul>
          )}
        </div>
        <div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Queries</p>
          {queries.length === 0 ? <p className="text-[12px] text-ink-400">No queries raised on this document.</p> : (
            <ul className="space-y-2">{queries.map((x) => (
              <li key={x.id} className="rounded-lg border border-line px-3 py-2.5"><div className="flex items-center gap-2"><Pill value={x.status} /><span className="text-[10.5px] text-ink-400">{x.raisedBy}</span></div><p className="text-[12px] text-ink-600 mt-1">{x.text}</p></li>))}</ul>
          )}
        </div>
      </div>
    </Drawer>
  );
}

/* ── My Workspace ──────────────────────────────────────────── */
export function Workspace({ go }: { go: (r: Route) => void }) {
  const { s, setS, user, role, log, notify } = useERP();
  const toast = useToast();
  const [reply, setReply] = useState<Record<string, string>>({});
  const me = ROLES.find((r) => r.id === role)!;
  const queue = useMemo(() => buildQueue(s), [s]);

  const tasks = s.tasks.filter((t) => t.forRole === role);
  const myQueries = s.queries.filter((x) => x.raisedBy === user.name || queue.some((i) => i.ref === x.docRef && i.by === user.name));
  const myAudit = s.audit.filter((a) => a.user === user.name);
  const myTxns = [
    ...s.prs.filter((p) => p.by === user.name).map((p) => ({ id: p.id, ref: p.no, type: "Purchase Requisition", amount: `₹${(p.lines.reduce((a, l) => a + l.qty * l.rate, 0) / 1e5).toFixed(1)} L`, status: p.status })),
    ...s.billDocs.filter((b) => b.by === user.name).map((b) => ({ id: b.id, ref: b.no, type: b.type, amount: `₹${b.net.toFixed(2)} Cr`, status: b.status })),
  ];

  const toggleTask = (id: string) => {
    const t = s.tasks.find((x) => x.id === id); if (!t) return;
    const next = t.status === "Done" ? "Open" : "Done";
    setS((p) => ({ ...p, tasks: p.tasks.map((x) => x.id === id ? { ...x, status: next } : x) }));
    log("Workspace", next === "Done" ? "Task Completed" : "Task Reopened", t.title, user.name);
  };
  const submitReply = (id: string) => {
    const text = (reply[id] || "").trim(); if (!text) return;
    setS((p) => ({ ...p, queries: p.queries.map((x) => x.id === id ? { ...x, response: text, status: "Responded" } : x) }));
    log("Workspace", "Query Responded", s.queries.find((x) => x.id === id)?.docRef ?? "", text);
    notify("approval", `Response posted on ${s.queries.find((x) => x.id === id)?.docRef}`);
    toast("success", "Response recorded"); setReply((r) => ({ ...r, [id]: "" }));
  };

  return (
    <div className="fade-up">
      <PageHead title="My Workspace" crumbs={["Meridian", "My Workspace"]}
        desc={`${me.person} · ${me.label} — everything assigned to you, in one place.`}>
        <Stat label="Open tasks" value={String(tasks.filter((t) => t.status !== "Done").length)} tone="warn" />
        <Stat label="Awaiting my approval" value={String(queue.length)} />
        <Stat label="My open queries" value={String(myQueries.filter((x) => x.status === "Open").length)} />
      </PageHead>

      <div className="grid grid-cols-12 gap-3.5 md:gap-4">
        <Reveal className="col-span-12 xl:col-span-5">
          <Widget title="Today's Tasks" subtitle="Assigned by role & responsibility" actions={<span className="text-[11px] num text-ink-400">{tasks.filter((t) => t.status !== "Done").length} open</span>}>
            {tasks.length === 0 ? <Empty title="No tasks" note="You're all caught up." /> : (
              <ul className="space-y-1.5">
                {tasks.map((t) => (
                  <li key={t.id} className={cx("flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all", t.status === "Done" ? "border-line bg-canvas/40 opacity-60" : "border-line bg-surface hover:border-line-strong")}>
                    <button onClick={() => toggleTask(t.id)} className={cx("h-[18px] w-[18px] rounded border grid place-items-center shrink-0 transition-all active:scale-90", t.status === "Done" ? "bg-ok-500 border-ok-500 text-white" : "border-line-strong text-transparent hover:border-brand-500")}>
                      <ICheck size={11} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={cx("text-[12.5px] font-medium leading-snug", t.status === "Done" ? "line-through text-ink-400" : "text-ink-900")}>{t.title}</p>
                      <p className="text-[10.5px] text-ink-400 num mt-0.5">due {t.due}{t.link ? ` · ${t.link}` : ""}</p>
                    </div>
                    <Pill value={t.status} />
                  </li>
                ))}
              </ul>
            )}
          </Widget>
        </Reveal>

        <Reveal className="col-span-12 xl:col-span-7">
          <Widget title="My Transactions" subtitle="Documents you created or own" actions={<Btn sm onClick={() => go("approvals")}>Approval queue</Btn>}>
            {myTxns.length === 0 ? <Empty title="No transactions yet" note="PRs and bills you raise will appear here." /> : (
              <ul className="space-y-1.5">{myTxns.map((t) => (
                <li key={t.id} className="flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 hover:border-line-strong transition-all">
                  <span className="num text-[12.5px] font-bold text-brand-700 w-[150px] truncate">{t.ref}</span>
                  <span className="text-[12px] text-ink-600 flex-1">{t.type}</span>
                  <span className="num text-[11.5px] text-ink-400">{t.amount}</span>
                  <Pill value={t.status} />
                </li>))}</ul>
            )}
          </Widget>
        </Reveal>

        <Reveal className="col-span-12 xl:col-span-7">
          <Widget title="Queries & Corrections" subtitle="Respond to approver queries — history is never lost">
            {myQueries.length === 0 ? <Empty title="No queries" note="Queries raised on your documents appear here." /> : (
              <ul className="space-y-2.5">{myQueries.map((x) => (
                <li key={x.id} className="rounded-[10px] border border-line px-3.5 py-3">
                  <div className="flex items-center gap-2"><p className="text-[12.5px] font-bold num text-ink-900">{x.docRef}</p><Pill value={x.status} /><span className="ml-auto text-[10.5px] text-ink-400">{x.raisedBy}</span></div>
                  {x.field && <p className="text-[10.5px] font-bold uppercase tracking-wide text-warn-700 mt-1">{x.field}</p>}
                  <p className="text-[12px] text-ink-600 mt-1 leading-snug">{x.text}</p>
                  {x.response ? <p className="text-[11.5px] text-ok-600 mt-1.5">↳ {x.response}</p> : (
                    <div className="flex gap-2 mt-2">
                      <input className={cx(inputCls, "h-7.5 h-8")} placeholder="Write your response…" value={reply[x.id] || ""} onChange={(e) => setReply((r) => ({ ...r, [x.id]: e.target.value }))} />
                      <Btn sm kind="primary" onClick={() => submitReply(x.id)}><ISend size={12} /> Respond</Btn>
                    </div>
                  )}
                </li>))}</ul>
            )}
          </Widget>
        </Reveal>

        <Reveal className="col-span-12 xl:col-span-5">
          <div className="space-y-3.5 md:space-y-4">
            <Widget title="Announcements" subtitle="From head office">
              <ul className="space-y-2">{s.announcements.map((a) => (
                <li key={a.id} className="flex gap-2.5"><span className="h-7 w-7 rounded-md grid place-items-center bg-steel-100 text-steel-600 shrink-0"><IBell size={13} /></span>
                  <div><p className="text-[12px] text-ink-700 leading-snug">{a.text}</p><p className="text-[10px] text-ink-300 mt-0.5 num">{a.kind}</p></div></li>))}</ul>
            </Widget>
            <Widget title="My Recent Activity" subtitle="From the audit trail">
              {myAudit.length === 0 ? <p className="text-[12px] text-ink-400">No recent activity.</p> : (
                <ul className="space-y-2">{myAudit.slice(0, 5).map((a) => (
                  <li key={a.id} className="flex gap-2.5"><span className="h-1.5 w-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0" />
                    <div><p className="text-[12px] text-ink-700">{a.action} — <span className="num font-semibold">{a.entity}</span></p><p className="text-[10px] text-ink-300 num mt-0.5">{a.module} · {a.detail}</p></div></li>))}</ul>
              )}
            </Widget>
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/* ── Access & Permissions Matrix (Super Admin) ─────────────── */
export function AccessPage() {
  const { s, setS, log, can } = useERP();
  const toast = useToast();
  const tools = ["DPR", "MB", "RA Bill", "Payment", "GRN", "Material Issue"];
  const flags: { k: keyof import("./store").AccessFlags; l: string }[] = [
    { k: "v", l: "View" }, { k: "c", l: "Create" }, { k: "e", l: "Edit" }, { k: "a", l: "Approve" }, { k: "s", l: "Sign" },
  ];
  const editable = can("access", "edit");
  const toggle = (uid: string, tool: string, f: keyof import("./store").AccessFlags) => {
    setS((p) => {
      const cur = p.userAccess[uid] ?? {};
      const row = cur[tool] ?? { v: false, c: false, e: false, a: false, s: false };
      return { ...p, userAccess: { ...p.userAccess, [uid]: { ...cur, [tool]: { ...row, [f]: !row[f] } } } };
    });
    const u = s.users.find((x) => x.id === uid);
    log("Access", "Permission Changed", `${u?.name} · ${tool}`, `flag ${f} toggled`);
    toast("info", "Permission updated");
  };

  return (
    <div className="fade-up">
      <PageHead title="Access & Permissions" crumbs={["Meridian", "Control", "Access"]}
        desc="Tool-level assignment per user — View, Create, Edit, Approve, Sign. Changes apply immediately and are audited.">
        <Stat label="Managed users" value={String(s.users.length)} />
        <Stat label="Tools" value={String(tools.length)} />
        <Stat label="Role policies" value={String(ROLES.length)} />
      </PageHead>
      <Widget title="Tool Assignment Matrix" subtitle="User → project → tool → permission">
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-left min-w-[820px]">
            <thead>
              <tr className="text-[10.5px] uppercase tracking-[0.08em] text-ink-400">
                <th className="font-bold pb-2 pr-3">User</th><th className="font-bold pb-2 pr-3">Role / Office</th>
                {tools.map((t) => <th key={t} className="font-bold pb-2 pr-3 text-center">{t}</th>)}
              </tr>
            </thead>
            <tbody>
              {s.users.map((u) => (
                <tr key={u.id} className="border-t border-line/80">
                  <td className="py-2.5 pr-3"><p className="text-[12.5px] font-semibold text-ink-900">{u.name}</p><p className="text-[10.5px] text-ink-400 num">{u.project} · {u.site}</p></td>
                  <td className="py-2.5 pr-3"><p className="text-[11.5px] text-ink-600">{ROLES.find((r) => r.id === u.role)?.label}</p><p className="text-[10px] text-ink-400">{u.office}</p></td>
                  {tools.map((t) => {
                    const row = s.userAccess[u.id]?.[t];
                    return (
                      <td key={t} className="py-2.5 pr-3">
                        <div className="flex items-center justify-center gap-1">
                          {flags.map((f) => {
                            const on = !!row?.[f.k];
                            return (
                              <button key={f.k} disabled={!editable} title={`${f.l} ${t}`} onClick={() => toggle(u.id, t, f.k)}
                                className={cx("h-6 min-w-[22px] px-1 rounded border text-[9px] font-bold transition-all active:scale-90 disabled:opacity-50", on ? "bg-brand-600 border-brand-600 text-white" : "border-line text-ink-300 hover:border-line-strong")}>
                                {f.l[0]}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10.5px] text-ink-300 mt-2">V = View · C = Create · E = Edit · A = Approve · S = Sign. Users cannot approve their own transactions unless explicitly granted, and approved documents are locked.</p>
      </Widget>
    </div>
  );
}
