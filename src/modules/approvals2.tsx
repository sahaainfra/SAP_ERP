import { useMemo, useState } from "react";
import { useERP } from "../store";
import { Pill, Widget, useToast, cx } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Btn, Stat } from "./shell";
import type { Col } from "./shell";
import { AuthorityMatrix } from "./attn";
import { ICheck, IXCircle, IChevR, IClock } from "../icons";

type QItem = {
  id: string; ref: string; kind: string; module: string; project: string; by: string;
  amount: string; date: string; ts: number; pendingWith: string;
  approve?: () => void; reject?: () => void; returnable?: () => void;
};

const PENDING_WITH: Record<string, string> = {
  "Purchase Requisition": "Project Manager", "Purchase Order": "Procurement Manager",
  "Vendor Payment": "Accounts Manager", "Attendance": "Reporting Manager",
  "Leave": "Reporting Manager", "RA Bill": "Commercial Manager",
};

export function ApprovalCentrePage() {
  const { s, setS, can, log, notify, user, role } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState("pending");
  const [q, setQ] = useState("");
  const [fKind, setFKind] = useState("");

  /* ── unified live queue ── */
  const queue: QItem[] = useMemo(() => {
    const items: QItem[] = [];
    s.prs.filter((d) => d.status === "Submitted" || d.status === "Under Approval").forEach((d) => items.push({
      id: d.id, ref: d.no, kind: "Purchase Requisition", module: "Procurement", project: d.project, by: d.by,
      amount: "₹" + Math.round(d.lines.reduce((a, l) => a + l.qty * l.rate, 0)).toLocaleString("en-IN"), date: d.date, ts: d.ts, pendingWith: d.status === "Submitted" ? "Project Manager" : "Procurement Manager",
      approve: () => { setS((p) => ({ ...p, prs: p.prs.map((x) => x.id === d.id ? { ...x, status: "Approved", history: [...x.history, { ts: Date.now(), action: "Approved", by: user.name }] } : x) })); log("Approvals", "Approved", d.no, `PR · ${d.project} by ${user.name}`); notify("approval", `${d.no} approved — convert to PO from the PR register`); toast("success", `${d.no} approved`); },
      reject: () => { setS((p) => ({ ...p, prs: p.prs.map((x) => x.id === d.id ? { ...x, status: "Rejected", history: [...x.history, { ts: Date.now(), action: "Rejected", by: user.name }] } : x) })); log("Approvals", "Rejected", d.no, `PR · ${d.project}`); toast("info", `${d.no} rejected`); },
      returnable: () => { setS((p) => ({ ...p, prs: p.prs.map((x) => x.id === d.id ? { ...x, status: "Returned", history: [...x.history, { ts: Date.now(), action: "Returned for correction", by: user.name }] } : x) })); log("Approvals", "Returned", d.no, "Returned for correction"); toast("info", `${d.no} returned to requester`); },
    }));
    s.pos.filter((d) => d.status === "Pending Approval").forEach((d) => items.push({
      id: d.id, ref: d.no, kind: "Purchase Order", module: "Procurement", project: d.project, by: "Procurement Cell",
      amount: "₹" + Math.round(d.lines.reduce((a, l) => a + l.qty * l.rate * (1 - l.disc / 100) * (1 + l.gst / 100), 0) + d.freight + d.loading).toLocaleString("en-IN"), date: d.date, ts: d.ts, pendingWith: "Accounts Manager",
      approve: () => { setS((p) => ({ ...p, pos: p.pos.map((x) => x.id === d.id ? { ...x, status: "Approved", termsLocked: true } : x) })); log("Approvals", "Approved", d.no, `PO · ${d.vendor} · terms locked`); notify("approval", `${d.no} approved — sent to vendor for acceptance`); toast("success", `${d.no} approved`); },
      returnable: () => { setS((p) => ({ ...p, pos: p.pos.map((x) => x.id === d.id ? { ...x, status: "Draft" } : x) })); log("Approvals", "Returned", d.no, "PO returned — rates/terms to be revised"); toast("info", `${d.no} returned to draft`); },
    }));
    s.proc.filter((d) => d.status === "Pending Approval" && d.type !== "PO").forEach((d) => items.push({
      id: d.id, ref: d.code, kind: d.type === "PR" ? "Purchase Requisition" : "Purchase Order", module: "Procurement", project: d.project, by: d.by,
      amount: `₹${d.amount.toFixed(1)} L`, date: d.date, ts: Date.now() - 2 * 864e5, pendingWith: PENDING_WITH[d.type === "PR" ? "Purchase Requisition" : "Purchase Order"],
      approve: () => { setS((p) => ({ ...p, proc: p.proc.map((x) => x.id === d.id ? { ...x, status: "Approved" } : x) })); log("Approvals", "Approved", d.code, `${d.items} · ${d.project}`); notify("approval", `${d.code} approved`); toast("success", `${d.code} approved`); },
      reject: () => { setS((p) => ({ ...p, proc: p.proc.map((x) => x.id === d.id ? { ...x, status: "Rejected" } : x) })); log("Approvals", "Rejected", d.code, d.items); toast("info", `${d.code} rejected`); },
    }));
    s.attendance.filter((a) => a.appr === "Pending").forEach((a) => items.push({
      id: a.id, ref: a.empId, kind: "Attendance", module: "HR", project: a.project, by: a.name, amount: `${a.hours || 8} hrs`, date: "Today", ts: Date.now() - 4 * 36e5, pendingWith: "HR Manager",
      approve: () => { setS((p) => ({ ...p, attendance: p.attendance.map((x) => x.id === a.id ? { ...x, appr: "Approved" } : x) })); log("Approvals", "Approved", a.empId, `Attendance · ${a.name}`); toast("success", `${a.name}'s attendance approved`); },
      reject: () => { setS((p) => ({ ...p, attendance: p.attendance.map((x) => x.id === a.id ? { ...x, appr: "Rejected" } : x) })); log("Approvals", "Rejected", a.empId, `Attendance · ${a.name}`); toast("info", "Attendance rejected"); },
    }));
    s.leaves.filter((l) => l.status === "Pending").forEach((l) => items.push({
      id: l.id, ref: "LV-" + l.id.slice(1), kind: "Leave", module: "HR", project: "—", by: l.emp, amount: `${l.days} day(s)`, date: l.from, ts: Date.now() - 26 * 36e5, pendingWith: "Reporting Manager",
      approve: () => { setS((p) => ({ ...p, leaves: p.leaves.map((x) => x.id === l.id ? { ...x, status: "Approved" } : x) })); log("Approvals", "Approved", l.emp, `Leave · ${l.type}`); toast("success", `Leave approved for ${l.emp}`); },
      reject: () => { setS((p) => ({ ...p, leaves: p.leaves.map((x) => x.id === l.id ? { ...x, status: "Rejected" } : x) })); log("Approvals", "Rejected", l.emp, `Leave · ${l.type}`); toast("info", "Leave rejected"); },
    }));
    s.raBills.filter((r) => r.status === "Submitted").forEach((r) => items.push({
      id: r.id, ref: r.no, kind: "RA Bill", module: "Billing", project: r.project, by: "Commercial Cell", amount: `₹${r.net.toFixed(2)} Cr`, date: r.date, ts: r.id ? Date.now() - 3 * 864e5 : Date.now(), pendingWith: "Commercial Manager",
      approve: () => { setS((p) => ({ ...p, raBills: p.raBills.map((x) => x.id === r.id ? { ...x, status: "Certified" } : x) })); log("Approvals", "Approved", r.no, `RA Bill certified · ₹${r.net.toFixed(2)} Cr`); notify("approval", `${r.no} certified`); toast("success", `${r.no} certified`); },
    }));
    s.payments.filter((p) => p.status === "Pending").forEach((p) => items.push({
      id: p.id, ref: p.no, kind: "Vendor Payment", module: "Finance", project: "—", by: "Accounts", amount: `₹${p.amount.toFixed(1)} L`, date: p.date, ts: p.id ? Date.now() - 1.4 * 864e5 : Date.now(), pendingWith: "Director",
      approve: () => { setS((st) => ({ ...st, payments: st.payments.map((x) => x.id === p.id ? { ...x, status: "Released" } : x) })); log("Approvals", "Approved", p.no, `Payment released → ${p.party}`); notify("payment", `${p.no} released`); toast("success", `${p.no} released`); },
    }));
    return items.sort((a, b) => a.ts - b.ts);
  }, [s, setS, log, notify, toast, user.name]);

  const kinds = ["all", ...new Set(queue.map((i) => i.kind))];
  const visible = queue.filter((i) => (fKind === "all" || i.kind === fKind) && (i.ref + i.by + i.kind + i.project + i.pendingWith).toLowerCase().includes(q.toLowerCase()));
  const canDecide = can("approvals", "approve") || can("procurement", "approve") || can("finance", "approve") || can("hr", "approve") || can("billing", "approve") || role === "SUPER_ADMIN";

  const auditCols: Col[] = [
    { key: "ts", label: "When", sort: (a) => a.ts, render: (a) => <span className="num text-[11px] text-ink-500 whitespace-nowrap">{new Date(a.ts).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}</span> },
    { key: "user", label: "By", render: (a) => <span className="text-[12px] font-semibold text-ink-900">{a.user}</span> },
    { key: "action", label: "Action", render: (a) => <Pill value={a.action.includes("Approved") ? "Completed" : a.action.includes("Rejected") ? "Attention Required" : "Submitted"} />, csv: (a) => a.action },
    { key: "entity", label: "Request", render: (a) => <span className="num text-[12px] font-bold text-brand-700">{a.entity}</span> },
    { key: "module", label: "Module", render: (a) => <span className="text-[10.5px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{a.module}</span> },
    { key: "detail", label: "Detail", render: (a) => <span className="text-[11.5px] text-ink-500">{a.detail}</span> },
  ];

  const approvalAudit = useMemo(() => s.audit.filter((a) => a.module === "Approvals" || a.action.includes("Approved") || a.action.includes("Rejected") || a.action.includes("Returned") || a.action.includes("Delegated") || a.action.includes("Forwarded")), [s.audit]);
  const mine = (rx: RegExp) => approvalAudit.filter((a) => a.user === user.name && rx.test(a.action)).filter((a) => (a.entity + a.detail).toLowerCase().includes(q.toLowerCase()));
  const returnedDocs = useMemo(() => [
    ...s.prs.filter((p) => p.status === "Returned").map((p) => ({ id: p.id, ref: p.no, kind: "Purchase Requisition", module: "Procurement", project: p.project, by: p.by, amount: "—", date: p.date, ts: p.ts, pendingWith: "Requester (correction)" })),
    ...s.proc.filter((d) => d.status === "Returned").map((d) => ({ id: d.id, ref: d.code, kind: "Procurement", module: "Procurement", project: d.project, by: d.by, amount: `₹${d.amount.toFixed(1)} L`, date: d.date, ts: Date.now() - 864e5, pendingWith: "Requester (correction)" })),
  ], [s.prs, s.proc]);

  const qCols: Col[] = [
    { key: "ref", label: "Request", sort: (i) => i.ref, render: (i: QItem) => <span className="num text-[12.5px] font-bold text-brand-700">{i.ref}</span> },
    { key: "kind", label: "Type", render: (i: QItem) => <span className="text-[10.5px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{i.kind}</span> },
    { key: "project", label: "Project", render: (i: QItem) => <span className="text-[12px] num text-ink-500">{i.project}</span> },
    { key: "by", label: "Requested by", render: (i: QItem) => <span className="text-[12px] text-ink-700">{i.by}</span> },
    { key: "amount", label: "Amount", align: "right", render: (i: QItem) => <span className="num text-[12.5px] font-semibold text-ink-900">{i.amount}</span> },
    { key: "date", label: "Date", render: (i: QItem) => <span className="num text-[11.5px] text-ink-500">{i.date}</span> },
    { key: "pendingWith", label: "Pending with", render: (i: QItem) => <span className="text-[11.5px] font-semibold text-steel-600 flex items-center gap-1"><IChevR size={10} /> {i.pendingWith}</span> },
    { key: "age", label: "Ageing", sort: (i: QItem) => Date.now() - i.ts, render: (i: QItem) => {
      const days = Math.max(0, (Date.now() - i.ts) / 864e5);
      const h = days < 1 ? `${Math.round(days * 24)} h` : `${days.toFixed(1)} d`;
      return <span className={cx("num text-[11px] font-bold flex items-center gap-1", days > 2 ? "text-danger-600" : days > 1 ? "text-amber-600" : "text-ok-600")}><IClock size={10} /> {h}</span>;
    } },
    { key: "act", label: "Quick Actions", render: (i: QItem) => {
      if (!canDecide) return <Pill value="Pending" pulse />;
      return (
        <span className="flex items-center gap-1 justify-end">
          <Btn sm kind="ok" onClick={(e: any) => { e.stopPropagation(); i.approve?.(); }}><ICheck size={11} /></Btn>
          {i.reject && <Btn sm kind="danger" onClick={(e: any) => { e.stopPropagation(); i.reject?.(); }}><IXCircle size={11} /></Btn>}
          {i.returnable && <Btn sm onClick={(e: any) => { e.stopPropagation(); i.returnable?.(); }}>Return</Btn>}
          <Btn sm onClick={(e: any) => {
            e.stopPropagation();
            log("Approvals", "Forwarded", i.ref, `${i.kind} forwarded to ${i.pendingWith} · by ${user.name}`);
            notify("approval", `${i.ref} forwarded for review — reminder sent`);
            toast("info", `${i.ref} forwarded · reminder sent to ${i.pendingWith}`);
          }}>Forward</Btn>
        </span>);
    } },
  ];

  const TABS = [
    { k: "pending", l: "My Pending", n: queue.length },
    { k: "approved", l: "Approved by Me", n: mine(/Approved/).length },
    { k: "rejected", l: "Rejected by Me", n: mine(/Rejected/).length },
    { k: "returned", l: "Returned", n: returnedDocs.length },
    { k: "delegated", l: "Delegated", n: approvalAudit.filter((a) => /Delegated|Forwarded/.test(a.action)).length },
    { k: "history", l: "History", n: approvalAudit.length },
    { k: "matrix", l: "Authority Matrix" },
  ];

  return (
    <div className="fade-up">
      <PageHead title="Approval Centre" crumbs={["Meridian", "Workflow", "Approval Centre"]}
        desc="One queue for every module — requisitions, orders, payments, attendance, leave and RA bills — governed by the authority matrix.">
        <Stat label="In queue" value={`${queue.length}`} tone={queue.length ? "warn" : "ok"} />
        <Stat label="SLA breaches (>48 h)" value={`${queue.filter((i) => Date.now() - i.ts > 2 * 864e5).length}`} tone="danger" />
        <Stat label="Decided by me (30 d)" value={`${mine(/Approved|Rejected/).length}`} tone="ok" />
        <Stat label="Avg turnaround" value="6.4 h" />
      </PageHead>

      <Widget title="Workflow Queue" subtitle="Approve · reject · return for correction · forward with reminder — every decision is audit-logged and notified">
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={TABS as any} /></div>

        {tab === "matrix" ? (
          <AuthorityMatrix editable={can("settings", "edit") || role === "SUPER_ADMIN" || role === "MD"} />
        ) : (
          <>
            {tab !== "history" && tab !== "approved" && tab !== "rejected" && tab !== "delegated" && (
              <FilterBar pageKey="apprc" q={q} onQ={setQ} filters={[{ key: "kind", label: "Type", value: fKind, options: kinds.filter((k) => k !== "all"), onChange: setFKind }]} />
            )}
            {(tab === "history" || tab === "approved" || tab === "rejected" || tab === "delegated") && (
              <FilterBar pageKey={"apprc-" + tab} q={q} onQ={setQ} filters={[]} />
            )}

            {tab === "pending" && <DataTable pageKey="appr-pending" rows={visible} cols={qCols} empty={{ title: "Queue is clear", note: "Nothing awaits your decision. New requests from all modules appear here in real time." }} />}
            {tab === "returned" && <DataTable pageKey="appr-returned" rows={returnedDocs.filter((r) => (r.ref + r.by + r.project).toLowerCase().includes(q.toLowerCase()))} cols={qCols.slice(0, 7) as Col[]} empty={{ title: "No returned requests", note: "Requests returned for correction will wait here until resubmitted." }} />}
            {tab === "approved" && <DataTable pageKey="appr-approved" rows={mine(/Approved/)} cols={auditCols} empty={{ title: "Nothing approved yet", note: "Your approvals will appear here with full audit detail." }} />}
            {tab === "rejected" && <DataTable pageKey="appr-rejected" rows={mine(/Rejected/)} cols={auditCols} empty={{ title: "No rejections", note: "Rejected requests and reasons are recorded here." }} />}
            {tab === "delegated" && <DataTable pageKey="appr-delegated" rows={approvalAudit.filter((a) => /Delegated|Forwarded/.test(a.action)).filter((a) => (a.entity + a.detail).toLowerCase().includes(q.toLowerCase()))} cols={auditCols} empty={{ title: "No delegated items", note: "Use Forward on a pending item to delegate with a reminder." }} />}
            {tab === "history" && <DataTable pageKey="appr-history" rows={approvalAudit.filter((a) => (a.entity + a.detail + a.user + a.action).toLowerCase().includes(q.toLowerCase()))} cols={auditCols} pageSize={10} empty={{ title: "No history yet", note: "Every approval decision is written to the immutable audit trail." }} />}
          </>
        )}
      </Widget>
    </div>
  );
}
