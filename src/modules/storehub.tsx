/* SAP-inspired Store & Inventory Management + Sourcing hub — integrated with existing ERP */
import { useMemo, useState } from "react";
import { useERP, dStr } from "../store";
import type { StockCat, GRNRec, StockTransfer, StockAdj, Reservation, Quotation, Negotiation, MatRequest, Movement } from "../store";
import { Pill, Widget, cx, useToast, Empty } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat } from "./core";
import type { Col } from "./core";
import { printDocument } from "../print";
import { IChevD, ICheck, IXCircle, IPrinter, IEye, ITruck, IAlert, ICart } from "../icons";

const L = (v: number) => "₹" + v.toLocaleString("en-IN", { maximumFractionDigits: 2 }) + " Cr";
const CAT_TONE: Record<StockCat, string> = {
  Unrestricted: "text-ok-600 bg-ok-100 border-ok-500/25",
  Quality: "text-amber-600 bg-amber-100 border-amber-500/25",
  Blocked: "text-danger-600 bg-danger-100 border-danger-500/25",
  Reserved: "text-brand-700 bg-brand-50 border-brand-200",
  Transit: "text-steel-600 bg-steel-100 border-line",
  Scrap: "text-ink-400 bg-canvas border-line",
};

/* ── live stock aggregation from batches ── */
function useStock(s: ReturnType<typeof useERP>["s"]) {
  return useMemo(() => {
    const byMat = new Map<string, { qty: number; value: number; cats: Partial<Record<StockCat, number>>; stores: string[] }>();
    for (const b of s.stockB) {
      const e = byMat.get(b.material) ?? { qty: 0, value: 0, cats: {}, stores: [] };
      e.qty += b.qty; e.value += b.value;
      e.cats[b.cat] = (e.cats[b.cat] ?? 0) + b.qty;
      if (!e.stores.includes(b.store)) e.stores.push(b.store);
      byMat.set(b.material, e);
    }
    return byMat;
  }, [s.stockB]);
}

/* ══════════ STORE & INVENTORY HUB ══════════ */
export default function StoreHub({ initialTab }: { initialTab?: string }) {
  const { s, setS, can, log, notify, nextCode, user, role } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<string>(initialTab ?? "dash");
  const [q, setQ] = useState("");
  const [grn, setGrn] = useState<GRNRec | null>(null);
  const byMat = useStock(s);

  const isKeeper = can("stores", "edit") || ["SUPER_ADMIN", "STORE", "PROCUREMENT", "PM", "MD"].includes(role);

  const totalValue = s.stockB.reduce((a, b) => a + b.value, 0);
  const catQty = (c: StockCat) => s.stockB.filter((b) => b.cat === c).reduce((a, b) => a + b.qty, 0);
  const lowStock = [...byMat.entries()].filter(([name, e]) => { const m = s.materials.find((x) => x.name === name); return m && (e.cats.Unrestricted ?? 0) < m.rol; });
  const todayMoves = s.movements.filter((m) => m.date === dStr(0));

  /* ── GRN posting → stock + movements + audit ── */
  const postGrn = (g: GRNRec, accepted: number) => {
    const storeCode = g.store;
    const value = +(accepted * g.rate / 1e7).toFixed(3);
    setS((p) => {
      const existing = p.stockB.find((b) => b.material === g.material && b.store === storeCode && b.cat === "Unrestricted");
      const stockB = existing
        ? p.stockB.map((b) => b.id === existing.id ? { ...b, qty: b.qty + accepted, value: +(b.value + value).toFixed(3) } : b)
        : [...p.stockB, { id: "sb" + Date.now(), material: g.material, store: storeCode, bin: "RCV-01", batch: g.dc, qty: accepted, unit: g.unit, cat: "Unrestricted" as StockCat, value }];
      return {
        ...p, stockB,
        grns: p.grns.map((x) => x.id === g.id ? { ...x, accepted, insp: accepted >= g.received ? "Accepted" : "Partially Accepted", status: "Posted" as const } : x),
        movements: [{ id: "mv" + Date.now(), date: dStr(0), material: g.material, doc: g.no, docType: "GRN" as const, project: g.project, receipt: accepted, issue: 0, transferIn: 0, transferOut: 0, adjust: 0, opening: byMat.get(g.material)?.qty ?? 0, closing: (byMat.get(g.material)?.qty ?? 0) + accepted, by: user.name }, ...p.movements],
      };
    });
    log("Store", "GRN Posted", g.no, `${accepted} ${g.unit} ${g.material} → ${storeCode} · ${L(value)}`);
    notify("stock", `${g.no}: ${accepted} ${g.unit} ${g.material} received into ${storeCode}`);
    toast("success", `${g.no} posted — stock updated`);
    setGrn(null);
  };

  const stockCols: Col[] = [
    { key: "material", label: "Material", render: (b) => (
      <div><p className="text-[12.5px] font-semibold text-ink-900">{b.material}</p>
        <p className="text-[10px] num text-ink-400 mt-0.5">{b.batch}{b.expiry ? ` · exp ${b.expiry}` : ""}</p></div>) },
    { key: "store", label: "Store / Bin", render: (b) => <span className="num text-[11.5px] text-ink-500">{b.store} · {b.bin}</span> },
    { key: "cat", label: "Stock Category", render: (b) => <span className={cx("text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border", CAT_TONE[b.cat as StockCat])}>{b.cat}</span> },
    { key: "qty", label: "Qty", align: "right", sort: (b) => b.qty, render: (b) => <span className="num text-[12.5px] font-semibold">{b.qty.toLocaleString("en-IN")} {b.unit}</span> },
    { key: "value", label: "Value (₹ Cr)", align: "right", sort: (b) => b.value, render: (b) => <span className="num text-[12.5px] font-semibold">{b.value.toFixed(2)}</span> },
  ];

  return (
    <div className="fade-up">
      <PageHead title="Store & Inventory Management" crumbs={["Meridian", "Materials", "Store / Inventory"]}
        desc="Enterprise inventory across stores — batch & bin stock, stock categories, GRN, issues, transfers, adjustments, reservations and the full stock ledger.">
        <Stat label="Inventory value" value={L(totalValue)} />
        <Stat label="Unrestricted" value={`${Math.round(catQty("Unrestricted")).toLocaleString("en-IN")}`} tone="ok" />
        <Stat label="Quality / Blocked" value={`${Math.round(catQty("Quality") + catQty("Blocked")).toLocaleString("en-IN")}`} tone="warn" />
        <Stat label="Low stock items" value={`${lowStock.length}`} tone={lowStock.length ? "danger" : "ok"} />
        <Stat label="Moves today" value={`${todayMoves.length}`} />
      </PageHead>

      <Widget title={tab === "dash" ? "Store Dashboard" : tab === "stock" ? "Batch & Bin Stock" : tab === "grn" ? "Goods Receipt Notes" : tab === "req" ? "Material Requests" : tab === "mov" ? "Stock Ledger" : "Adjustments & Transfers"}
        subtitle={tab === "dash" ? "Live stock position across every store and category" : tab === "stock" ? "Stock by category — unrestricted, quality, blocked, reserved, transit, scrap" : tab === "grn" ? "Post receipts to stock after inspection" : tab === "req" ? "Site requirements → issue or convert to PR" : tab === "mov" ? "Every movement references its source document" : "Controlled stock changes with approval"}>
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={[
          { k: "dash", l: "Dashboard" }, { k: "stock", l: "Stock", n: s.stockB.length }, { k: "grn", l: "GRN", n: s.grns.length },
          { k: "req", l: "Requests", n: s.matReqs.length }, { k: "mov", l: "Ledger", n: s.movements.length }, { k: "ops", l: "Adjust / Transfer", n: s.adjs.length + s.transfers.length },
        ]} /></div>

        {tab === "dash" && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(["Unrestricted", "Quality", "Blocked", "Reserved", "Transit", "Scrap"] as StockCat[]).map((c) => (
                <div key={c} className="rounded-lg border border-line bg-canvas/40 px-3.5 py-3">
                  <div className="flex items-center justify-between">
                    <span className={cx("text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border", CAT_TONE[c])}>{c}</span>
                    <span className="num text-[15px] font-semibold text-ink-900">{Math.round(catQty(c)).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="h-[5px] rounded-full bg-line overflow-hidden mt-2.5">
                    <div className={cx("h-full rounded-full", c === "Unrestricted" ? "bg-ok-500" : c === "Quality" ? "bg-amber-500" : c === "Blocked" ? "bg-danger-500" : c === "Reserved" ? "bg-brand-500" : c === "Transit" ? "bg-steel-600" : "bg-line-strong")}
                      style={{ width: `${Math.min(100, (catQty(c) / Math.max(1, catQty("Unrestricted"))) * 100)}%` }} />
                  </div>
                </div>))}
            </div>
            <div className="grid lg:grid-cols-2 gap-3">
              <div className="rounded-lg border border-line p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2.5">Inventory by store</p>
                {s.storesM.map((st) => {
                  const v = s.stockB.filter((b) => b.store === st.code).reduce((a, b) => a + b.value, 0);
                  return (
                    <div key={st.id} className="flex items-center gap-3 py-1.5">
                      <span className="text-[12px] font-medium text-ink-700 w-[190px] truncate">{st.name}</span>
                      <div className="flex-1 h-[6px] rounded-full bg-line overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${Math.min(100, (v / Math.max(0.1, totalValue)) * 100)}%` }} /></div>
                      <span className="num text-[12px] font-semibold text-ink-900 w-[80px] text-right">{L(v)}</span>
                    </div>);
                })}
              </div>
              <div className="rounded-lg border border-line p-4">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2.5">Recent movements</p>
                {s.movements.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center gap-2.5 py-1.5 border-b border-line/60 last:border-0">
                    <span className={cx("text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded", m.docType === "GRN" ? "bg-ok-100 text-ok-600" : m.docType === "Issue" ? "bg-amber-100 text-amber-600" : "bg-steel-100 text-steel-600")}>{m.docType}</span>
                    <span className="text-[11.5px] text-ink-700 flex-1 truncate">{m.material}</span>
                    <span className="num text-[11px] text-ink-400">{m.doc}</span>
                  </div>))}
              </div>
            </div>
            {lowStock.length > 0 && (
              <div className="rounded-lg border border-danger-500/30 bg-danger-100/25 px-4 py-3 flex items-start gap-2.5">
                <IAlert size={16} className="text-danger-600 mt-0.5 shrink-0" />
                <div><p className="text-[12.5px] font-bold text-danger-600">{lowStock.length} material(s) below reorder level</p>
                  <p className="text-[11.5px] text-ink-500 mt-0.5">{lowStock.map(([n]) => n).join(", ")}</p></div>
              </div>)}
          </div>)}

        {tab === "stock" && <>
          <FilterBar pageKey="store-stock" q={q} onQ={setQ} filters={[]} />
          <DataTable pageKey="stockB" rows={s.stockB.filter((b) => (b.material + b.store + b.batch + b.cat).toLowerCase().includes(q.toLowerCase()))} cols={stockCols} />
        </>}

        {tab === "grn" && (
          <DataTable pageKey="grns" rows={s.grns.filter((g) => (g.no + g.vendor + g.material + g.po).toLowerCase().includes(q.toLowerCase()))} cols={[
            { key: "no", label: "GRN", render: (g) => <div><p className="num text-[12.5px] font-bold text-brand-700">{g.no}</p><p className="text-[10px] num text-ink-400">{g.po} · {g.date}</p></div> },
            { key: "vendor", label: "Vendor / Material", render: (g) => <div><p className="text-[12px] font-semibold text-ink-900">{g.material}</p><p className="text-[10.5px] text-ink-400">{g.vendor} → {g.store}</p></div> },
            { key: "qty", label: "Ordered / Received", align: "right", sort: (g) => g.received, render: (g) => <span className="num text-[12px]">{g.received}/{g.ordered} {g.unit}</span> },
            { key: "insp", label: "Inspection", render: (g) => <Pill value={g.insp === "Accepted" ? "Completed" : g.insp === "Rejected" ? "Delayed" : "Submitted"} />, csv: (g) => g.insp },
            { key: "status", label: "Status", render: (g) => <Pill value={g.status === "Posted" ? "Completed" : "Pending"} pulse={g.status === "Pending QC"} />, csv: (g) => g.status },
            { key: "act", label: "", render: (g: GRNRec) => g.status === "Pending QC" && isKeeper ? (
              <Btn sm kind="primary" onClick={(e: any) => { e.stopPropagation(); setGrn(g); }}><ICheck size={11} /> Post to Stock</Btn>) :
              <Btn sm onClick={(e: any) => { e.stopPropagation(); setGrn(g); }}><IEye size={11} /></Btn> },
          ] as Col[]} />
        )}

        {tab === "req" && <MatReqTab />}
        {tab === "mov" && <StockLedger />}
        {tab === "ops" && <OpsTab />}
      </Widget>

      {/* GRN drawer */}
      <Drawer open={!!grn} onClose={() => setGrn(null)} title={`GRN · ${grn?.no}`} sub={grn ? `${grn.po} · ${grn.vendor} · ${grn.date}` : ""}>
        {grn && (() => {
          const g = s.grns.find((x) => x.id === grn.id) ?? grn;
          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Ordered" value={`${g.ordered} ${g.unit}`} />
                <Stat label="Received" value={`${g.received} ${g.unit}`} />
                <Stat label="Accepted" value={`${g.accepted} ${g.unit}`} tone="ok" />
                <Stat label="Rejected" value={`${g.rejected} ${g.unit}`} tone={g.rejected ? "danger" : undefined} />
              </div>
              <div className="rounded-lg border border-line p-3.5 text-[12px] text-ink-500 space-y-1">
                <p><b className="text-ink-700">Delivery challan:</b> <span className="num">{g.dc}</span> · Vehicle {g.vehicle}</p>
                <p><b className="text-ink-700">Store:</b> {g.store} · <b className="text-ink-700">Rate:</b> ₹{g.rate.toLocaleString("en-IN")}/{g.unit}</p>
                <p><b className="text-ink-700">Inspection:</b> {g.insp}</p>
              </div>
              {g.status === "Pending QC" && isKeeper && (
                <div className="flex justify-end gap-2 pt-2 border-t border-line">
                  <Btn onClick={() => printDocument({ title: "Goods Receipt Note", docNo: g.no, date: g.date, project: g.project, meta: [["PO", g.po], ["Vendor", g.vendor], ["Store", g.store]], cols: [{ label: "Field" }, { label: "Value" }], rows: [["Material", g.material], ["Ordered", g.ordered], ["Received", g.received], ["Accepted", g.accepted], ["Rejected", g.rejected]], signatures: ["Received By", "Inspected By", "Store Incharge"], generatedBy: user.name })}><IPrinter size={13} /> Print</Btn>
                  <Btn kind="primary" onClick={() => postGrn(g, g.accepted)}><ICheck size={13} /> Accept & Post</Btn>
                </div>)}
              {g.status === "Posted" && <p className="text-[11.5px] font-semibold text-ok-600 bg-ok-100/40 border border-ok-500/25 rounded-md px-3 py-2">Posted to stock — unrestricted use. Ledger updated.</p>}
            </div>);
        })()}
      </Drawer>
    </div>
  );
}

/* ── Material requests ── */
function MatReqTab() {
  const { s, setS, can, log, notify, user } = useERP();
  const toast = useToast();
  const byMat = useStock(s);

  const act = (r: MatRequest, kind: "Issued" | "Converted to PR") => {
    setS((p) => ({ ...p, matReqs: p.matReqs.map((x) => x.id === r.id ? { ...x, status: kind } : x) }));
    log("Store", kind === "Issued" ? "Material Issued" : "MR Converted to PR", r.no, `${r.qty} ${r.unit} ${r.material} · ${r.project}`);
    notify(kind === "Issued" ? "stock" : "approval", `${r.no} ${kind === "Issued" ? "issued from store" : "converted to purchase requisition"}`);
    toast("success", `${r.no} ${kind}`);
  };

  return (
    <DataTable pageKey="matreq" rows={s.matReqs} cols={[
      { key: "no", label: "MR", render: (r) => <div><p className="num text-[12.5px] font-bold text-brand-700">{r.no}</p><p className="text-[10px] num text-ink-400">{r.date} · {r.by}</p></div> },
      { key: "material", label: "Material / Project", render: (r) => <div><p className="text-[12px] font-semibold text-ink-900">{r.material}</p><p className="text-[10.5px] text-ink-400">{r.project} · {r.site}</p></div> },
      { key: "qty", label: "Req / Avail", align: "right", sort: (r) => r.qty, render: (r) => <div className="text-right"><span className="num text-[12px] font-semibold">{r.qty} {r.unit}</span><p className="num text-[10px] text-ink-400">avail {r.available}</p></div> },
      { key: "shortfall", label: "Shortfall", align: "right", render: (r) => r.shortfall > 0 ? <span className="num text-[12px] font-bold text-danger-600">{r.shortfall}</span> : <span className="text-[11px] text-ok-600">In stock</span> },
      { key: "priority", label: "Priority", render: (r) => <Pill value={r.priority === "Normal" ? "Submitted" : r.priority === "Urgent" ? "Pending" : "Delayed"} />, csv: (r) => r.priority },
      { key: "status", label: "Status", render: (r) => <Pill value={r.status === "Issued" ? "Completed" : r.status === "Converted to PR" ? "Submitted" : r.status === "Rejected" ? "Rejected" : "On Track"} />, csv: (r) => r.status },
      { key: "act", label: "", render: (r: MatRequest) => r.status === "Pending" && can("stores", "edit") ? (
        <span className="flex gap-1 justify-end">
          {r.shortfall === 0 ? <Btn sm kind="ok" onClick={(e: any) => { e.stopPropagation(); act(r, "Issued"); }}><ICheck size={11} /> Issue</Btn> :
            <Btn sm kind="primary" onClick={(e: any) => { e.stopPropagation(); act(r, "Converted to PR"); }}><ICart size={11} /> → PR</Btn>}
        </span>) : null },
    ] as Col[]} />
  );
}

/* ── Stock ledger ── */
function StockLedger() {
  const { s } = useERP();
  const [mat, setMat] = useState(s.materials[0]?.name ?? "");
  const rows = s.movements.filter((m) => m.material === mat);
  return (
    <div>
      <Field label="Material" w="w-[300px]">
        <div className="relative">
          <select className={selectCls} value={mat} onChange={(e) => setMat(e.target.value)}>
            {s.materials.map((m) => <option key={m.code} value={m.name}>{m.name}</option>)}
          </select>
          <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
        </div>
      </Field>
      <div className="mt-3 overflow-x-auto -mx-4 px-4">
        {rows.length === 0 ? <Empty title="No movements" note="No stock movement recorded for this material yet." /> : (
          <table className="w-full text-left min-w-[760px]">
            <thead><tr className="text-[10px] uppercase tracking-[0.08em] text-ink-400">
              <th className="font-bold pb-2 pr-3">Date</th><th className="font-bold pb-2 pr-3">Document</th><th className="font-bold pb-2 pr-3">Type</th>
              <th className="font-bold pb-2 pr-3 text-right">Opening</th><th className="font-bold pb-2 pr-3 text-right">Receipt</th><th className="font-bold pb-2 pr-3 text-right">Issue</th>
              <th className="font-bold pb-2 pr-3 text-right">Trf In/Out</th><th className="font-bold pb-2 pr-3 text-right">Adjust</th><th className="font-bold pb-2 text-right">Closing</th>
            </tr></thead>
            <tbody>{rows.map((m) => (
              <tr key={m.id} className="border-t border-line/80">
                <td className="py-2.5 pr-3 num text-[11.5px] text-ink-500">{m.date}</td>
                <td className="py-2.5 pr-3 num text-[12px] font-bold text-brand-700">{m.doc}</td>
                <td className="py-2.5 pr-3"><span className={cx("text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded", m.docType === "GRN" ? "bg-ok-100 text-ok-600" : m.docType === "Issue" ? "bg-amber-100 text-amber-600" : m.docType === "Adjustment" ? "bg-danger-100 text-danger-600" : "bg-steel-100 text-steel-600")}>{m.docType}</span></td>
                <td className="py-2.5 pr-3 text-right num text-[12px]">{m.opening.toLocaleString("en-IN")}</td>
                <td className="py-2.5 pr-3 text-right num text-[12px] text-ok-600">{m.receipt ? "+" + m.receipt.toLocaleString("en-IN") : "—"}</td>
                <td className="py-2.5 pr-3 text-right num text-[12px] text-amber-600">{m.issue ? "−" + m.issue.toLocaleString("en-IN") : "—"}</td>
                <td className="py-2.5 pr-3 text-right num text-[12px] text-steel-600">{m.transferIn ? "+" + m.transferIn : m.transferOut ? "−" + m.transferOut : "—"}</td>
                <td className="py-2.5 pr-3 text-right num text-[12px] text-danger-600">{m.adjust ? (m.adjust > 0 ? "+" : "") + m.adjust : "—"}</td>
                <td className="py-2.5 text-right num text-[12.5px] font-bold text-ink-900">{m.closing.toLocaleString("en-IN")}</td>
              </tr>))}</tbody>
          </table>)}
      </div>
    </div>
  );
}

/* ── Adjustments & transfers ── */
function OpsTab() {
  const { s, setS, can, log, notify, user } = useERP();
  const toast = useToast();

  const approveAdj = (a: StockAdj) => {
    setS((p) => ({ ...p, adjs: p.adjs.map((x) => x.id === a.id ? { ...x, status: "Posted" as const } : x) }));
    log("Store", "Stock Adjustment Posted", a.no, `${a.material} · ${a.diff > 0 ? "+" : ""}${a.diff} · ${a.reason}`);
    toast("success", `${a.no} posted`);
  };
  const receiveTr = (t: StockTransfer) => {
    setS((p) => ({ ...p, transfers: p.transfers.map((x) => x.id === t.id ? { ...x, status: "Received" as const } : x) }));
    log("Store", "Transfer Received", t.no, `${t.qty} ${t.unit} ${t.material} · ${t.from} → ${t.to}`);
    notify("stock", `${t.no} received at ${t.to}`);
    toast("success", `${t.no} received`);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div>
        <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Stock adjustments</p>
        <div className="space-y-2">
          {s.adjs.map((a) => (
            <div key={a.id} className="border border-line rounded-lg px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="num text-[12px] font-bold text-brand-700">{a.no}</span>
                <span className="text-[11.5px] text-ink-700 flex-1 truncate">{a.material}</span>
                <Pill value={a.status === "Posted" ? "Completed" : a.status === "Approved" ? "On Track" : "Pending"} />
              </div>
              <p className="text-[11px] text-ink-400 mt-1">System {a.system} → Physical {a.physical} · <b className={a.diff < 0 ? "text-danger-600" : "text-ok-600"}>{a.diff > 0 ? "+" : ""}{a.diff}</b> · {a.reason}</p>
              {a.status === "Pending" && can("stores", "approve") && (
                <div className="flex justify-end mt-1.5"><Btn sm kind="ok" onClick={() => approveAdj(a)}><ICheck size={11} /> Post</Btn></div>)}
            </div>))}
        </div>
      </div>
      <div>
        <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Stock transfers</p>
        <div className="space-y-2">
          {s.transfers.map((t) => (
            <div key={t.id} className="border border-line rounded-lg px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <span className="num text-[12px] font-bold text-brand-700">{t.no}</span>
                <span className="text-[11.5px] text-ink-700 flex-1 truncate">{t.material} · {t.qty} {t.unit}</span>
                <Pill value={t.status === "Received" ? "Completed" : t.status === "In Transit" ? "Submitted" : "Pending"} pulse={t.status === "In Transit"} />
              </div>
              <p className="text-[11px] num text-ink-400 mt-1 flex items-center gap-1.5"><ITruck size={12} /> {t.from} → {t.to} · {t.date}</p>
              {t.status === "In Transit" && can("stores", "edit") && (
                <div className="flex justify-end mt-1.5"><Btn sm kind="primary" onClick={() => receiveTr(t)}><ICheck size={11} /> Mark Received</Btn></div>)}
            </div>))}
        </div>
      </div>
    </div>
  );
}

/* ══════════ SOURCING HUB — RFQ / quotations / comparative / negotiation / 3-way ══════════ */
export function SourcingHub() {
  const { s, setS, can, log, notify, user } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<"quot" | "cs" | "nego" | "match">("quot");

  const landed = (qt: Quotation) => qt.qty * qt.rate * (1 - qt.disc / 100) + qt.freight;

  const setTech = (qt: Quotation, tech: Quotation["tech"]) => {
    setS((p) => ({ ...p, quotations: p.quotations.map((x) => x.id === qt.id ? { ...x, tech, status: tech === "Disqualified" ? "Rejected" : "Evaluated" } : x) }));
    log("Procurement", "Technical Evaluation", qt.no, `${qt.vendor} · ${tech}`);
    toast("info", `${qt.no} marked ${tech}`);
  };

  /* comparative: group by rfq */
  const rfqs = [...new Set(s.quotations.map((qt) => qt.rfq))];

  const matchRows = useMemo(() => s.grns.filter((g) => g.status === "Posted").map((g) => {
    const po = s.pos.find((p) => p.no === g.po);
    const inv = s.apInvoices.find((i) => i.ref === g.po || i.ref === g.no);
    const poVal = po ? po.lines.reduce((a, l) => a + l.qty * l.rate, 0) / 1e7 : 0;
    const grnVal = g.accepted * g.rate / 1e7;
    const diff = Math.abs(poVal - grnVal);
    return { g, po, inv, poVal, grnVal, status: !po ? "PO Missing" : !inv ? "GRN Posted — Invoice Pending" : diff > 0.05 ? "Value Difference" : "Matched" };
  }), [s.grns, s.pos, s.apInvoices]);

  return (
    <div className="fade-up">
      <PageHead title="Sourcing & Procurement" crumbs={["Meridian", "Supply Chain", "Sourcing"]}
        desc="RFQ → quotations → technical & commercial evaluation → comparative statement → negotiation → PO, with 3-way matching against GRN and invoices.">
        <Stat label="Open RFQs" value={`${rfqs.length}`} />
        <Stat label="Quotations" value={`${s.quotations.length}`} />
        <Stat label="Negotiated savings" value={`₹${s.negos.reduce((a, n) => a + n.savings * n.orig / 100, 0).toFixed(1)} L`} tone="ok" />
        <Stat label="3-way matched" value={`${matchRows.filter((m) => m.status === "Matched").length}/${matchRows.length}`} />
      </PageHead>

      <Widget title={tab === "quot" ? "Supplier Quotations" : tab === "cs" ? "Comparative Statement" : tab === "nego" ? "Negotiations" : "3-Way Match (PO · GRN · Invoice)"}
        subtitle={tab === "quot" ? "Technical & commercial evaluation per quotation" : tab === "cs" ? "Landed cost comparison — lowest is auto-flagged L1" : tab === "nego" ? "Original vs final rate with savings" : "Automatic PO vs GRN vs invoice reconciliation"}>
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={[
          { k: "quot" as const, l: "Quotations", n: s.quotations.length }, { k: "cs" as const, l: "Comparative", n: rfqs.length },
          { k: "nego" as const, l: "Negotiation", n: s.negos.length }, { k: "match" as const, l: "3-Way Match", n: matchRows.length },
        ]} /></div>

        {tab === "quot" && (
          <DataTable pageKey="quots" rows={s.quotations} cols={[
            { key: "no", label: "Quotation", render: (qt) => <div><p className="num text-[12px] font-bold text-brand-700">{qt.no}</p><p className="text-[10px] num text-ink-400">{qt.rfq} · {qt.date}</p></div> },
            { key: "vendor", label: "Vendor / Material", render: (qt) => <div><p className="text-[12px] font-semibold text-ink-900">{qt.vendor}</p><p className="text-[10.5px] text-ink-400">{qt.material} · {qt.qty} {qt.unit}</p></div> },
            { key: "rate", label: "Rate", align: "right", sort: (qt) => qt.rate, render: (qt) => <span className="num text-[12px]">₹{qt.rate.toLocaleString("en-IN")}</span> },
            { key: "landed", label: "Landed (₹ L)", align: "right", sort: landed, render: (qt) => <span className="num text-[12.5px] font-semibold">{(landed(qt) / 1e5).toFixed(1)}</span> },
            { key: "tech", label: "Technical", render: (qt) => <Pill value={qt.tech === "Qualified" ? "Completed" : qt.tech === "Disqualified" ? "Rejected" : qt.tech === "Conditional" ? "Pending" : "Submitted"} />, csv: (qt) => qt.tech },
            { key: "status", label: "Status", render: (qt) => <Pill value={qt.status === "L1 Recommended" ? "On Track" : qt.status === "Rejected" ? "Rejected" : "Submitted"} pulse={qt.status === "L1 Recommended"} />, csv: (qt) => qt.status },
            { key: "act", label: "", render: (qt: Quotation) => can("procurement", "approve") && qt.tech === "Under Review" ? (
              <span className="flex gap-1 justify-end">
                <Btn sm kind="ok" onClick={(e: any) => { e.stopPropagation(); setTech(qt, "Qualified"); }}><ICheck size={11} /></Btn>
                <Btn sm kind="danger" onClick={(e: any) => { e.stopPropagation(); setTech(qt, "Disqualified"); }}><IXCircle size={11} /></Btn>
              </span>) : null },
          ] as Col[]} />
        )}

        {tab === "cs" && (
          <div className="space-y-4">
            {rfqs.map((rfq) => {
              const qts = s.quotations.filter((qt) => qt.rfq === rfq).sort((a, b) => landed(a) - landed(b));
              const min = Math.min(...qts.map(landed));
              return (
                <div key={rfq} className="rounded-lg border border-line overflow-hidden">
                  <div className="px-4 py-2.5 bg-canvas/60 border-b border-line flex items-center gap-2">
                    <span className="num text-[12.5px] font-bold text-brand-700">{rfq}</span>
                    <span className="text-[11.5px] text-ink-500">{qts[0]?.material} · {qts.length} quotations</span>
                  </div>
                  <table className="w-full text-left">
                    <thead><tr className="text-[9.5px] uppercase tracking-[0.08em] text-ink-400">
                      <th className="font-bold px-4 py-2">Vendor</th><th className="font-bold py-2 text-right">Rate</th><th className="font-bold py-2 text-right">Disc %</th>
                      <th className="font-bold py-2 text-right">Freight</th><th className="font-bold py-2 text-right">Landed (₹ L)</th><th className="font-bold py-2 px-4 text-right">Verdict</th>
                    </tr></thead>
                    <tbody>{qts.map((qt) => (
                      <tr key={qt.id} className="border-t border-line/70">
                        <td className="px-4 py-2 text-[12px] font-semibold text-ink-900">{qt.vendor}</td>
                        <td className="py-2 text-right num text-[12px]">₹{qt.rate.toLocaleString("en-IN")}</td>
                        <td className="py-2 text-right num text-[12px]">{qt.disc}%</td>
                        <td className="py-2 text-right num text-[12px]">₹{(qt.freight / 1e5).toFixed(2)} L</td>
                        <td className={cx("py-2 text-right num text-[12.5px] font-bold", landed(qt) === min ? "text-ok-600" : "text-ink-700")}>{(landed(qt) / 1e5).toFixed(1)}</td>
                        <td className="py-2 px-4 text-right">{landed(qt) === min && qt.tech !== "Disqualified" ?
                          <span className="text-[9.5px] font-bold uppercase bg-ok-100 text-ok-600 border border-ok-500/25 rounded px-1.5 py-0.5">L1 · Recommended</span> :
                          qt.tech === "Disqualified" ? <span className="text-[9.5px] font-bold uppercase bg-danger-100 text-danger-600 rounded px-1.5 py-0.5">Disqualified</span> :
                            <span className="text-[10px] text-ink-300">—</span>}</td>
                      </tr>))}</tbody>
                  </table>
                </div>);
            })}
          </div>
        )}

        {tab === "nego" && (
          <DataTable pageKey="negos" rows={s.negos} cols={[
            { key: "vendor", label: "Vendor", render: (n) => <span className="text-[12.5px] font-semibold text-ink-900">{n.vendor}</span> },
            { key: "quot", label: "Quotation", render: (n) => <span className="num text-[11.5px] text-ink-500">{n.quot}</span> },
            { key: "orig", label: "Original", align: "right", sort: (n) => n.orig, render: (n) => <span className="num text-[12px]">₹{n.orig.toLocaleString("en-IN")}</span> },
            { key: "final", label: "Final", align: "right", sort: (n) => n.final, render: (n) => <span className="num text-[12px] font-semibold text-ink-900">₹{n.final.toLocaleString("en-IN")}</span> },
            { key: "savings", label: "Savings", align: "right", sort: (n) => n.savings, render: (n) => <span className="num text-[12px] font-bold text-ok-600">₹{n.savings.toLocaleString("en-IN")}/unit</span> },
            { key: "by", label: "Negotiated by", render: (n) => <span className="text-[11.5px] text-ink-500">{n.by} · {n.date}</span> },
          ] as Col[]} />
        )}

        {tab === "match" && (
          <DataTable pageKey="match" rows={matchRows} cols={[
            { key: "grn", label: "GRN", render: (m) => <span className="num text-[12px] font-bold text-brand-700">{m.g.no}</span> },
            { key: "po", label: "PO", render: (m) => <span className="num text-[11.5px] text-ink-500">{m.g.po}</span> },
            { key: "poVal", label: "PO Value (₹ Cr)", align: "right", sort: (m) => m.poVal, render: (m) => <span className="num text-[12px]">{m.poVal.toFixed(2)}</span> },
            { key: "grnVal", label: "GRN Value (₹ Cr)", align: "right", sort: (m) => m.grnVal, render: (m) => <span className="num text-[12px]">{m.grnVal.toFixed(2)}</span> },
            { key: "inv", label: "Invoice", render: (m) => m.inv ? <span className="num text-[11.5px] text-ink-500">{m.inv.no}</span> : <span className="text-[10.5px] text-amber-600 font-semibold">Pending</span> },
            { key: "status", label: "Match Status", render: (m) => <Pill value={m.status === "Matched" ? "Completed" : m.status.includes("Difference") || m.status.includes("Missing") ? "Delayed" : "Submitted"} />, csv: (m) => m.status },
          ] as Col[]} />
        )}
      </Widget>
    </div>
  );
}
