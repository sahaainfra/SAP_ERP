import { useMemo, useState } from "react";
import { useERP, dStr } from "../store";
import { Pill, Widget, useToast, cx } from "../ui";
import { PageHead, Seg, FilterBar, DataTable, Drawer, Field, inputCls, selectCls, Btn, Stat, AddBtn } from "./shell";
import type { Col } from "./shell";
import { IChevD, ITruck } from "../icons";

export default function MaterialsPage({ initialTab }: { initialTab?: "master" | "stock" | "txn" }) {
  const { s, setS, can, log, notify, user, intent, setIntent } = useERP();
  const toast = useToast();
  const [tab, setTab] = useState<"master" | "stock" | "txn">(initialTab ?? "master");
  const [q, setQ] = useState("");
  const [fCat, setFCat] = useState("");
  const [entry, setEntry] = useState<"Inward" | "Outward" | "Transfer" | null>(null);
  const [form, setForm] = useState({ material: "", qty: "", project: "P1", note: "" });

  const cats = [...new Set(s.materials.map((m) => m.cat))];
  const lowStock = s.stock.filter((st) => { const m = s.materials.find((x) => x.name === st.material); return m && st.onHand < m.rol; });
  const stockValue = s.stock.reduce((a, x) => a + x.value, 0);

  const masterRows = useMemo(() => s.materials.filter((m) =>
    (m.name + m.code + m.cat).toLowerCase().includes(q.toLowerCase()) && (!fCat || m.cat === fCat)), [s.materials, q, fCat]);
  const stockRows = useMemo(() => s.stock.filter((st) => (st.material + st.store).toLowerCase().includes(q.toLowerCase())), [s.stock, q]);
  const txnRows = useMemo(() => s.mTxns.filter((t) => (t.material + t.code + t.project + t.kind).toLowerCase().includes(q.toLowerCase())), [s.mTxns, q]);

  const masterCols: Col[] = [
    { key: "code", label: "Code", render: (m) => <span className="num text-[12px] font-bold text-brand-700">{m.code}</span> },
    { key: "name", label: "Material", render: (m) => <span className="text-[12.5px] font-semibold text-ink-900">{m.name}</span> },
    { key: "cat", label: "Category", render: (m) => <span className="text-[10.5px] font-bold uppercase tracking-wide bg-canvas border border-line rounded px-1.5 py-0.5 text-ink-500">{m.cat}</span> },
    { key: "unit", label: "Unit", render: (m) => <span className="text-[12px] text-ink-500">{m.unit}</span> },
    { key: "rol", label: "Reorder Lvl", align: "right", sort: (m) => m.rol, render: (m) => <span className="num text-[12px]">{m.rol.toLocaleString("en-IN")}</span> },
    { key: "rate", label: "Std Rate (₹ Cr/unit)", align: "right", sort: (m) => m.rate, render: (m) => <span className="num text-[12px]">{m.rate.toFixed(4)}</span> },
  ];

  const stockCols: Col[] = [
    { key: "material", label: "Material", render: (st) => (
      <div>
        <p className="text-[12.5px] font-semibold text-ink-900">{st.material}</p>
        {lowStock.some((l) => l.material === st.material) && <p className="text-[10px] font-bold text-danger-600 uppercase tracking-wide mt-0.5">Below ROL — reorder</p>}
      </div>) },
    { key: "store", label: "Store", render: (st) => <span className="text-[12px] text-ink-500">{st.store}</span> },
    { key: "onHand", label: "On Hand", align: "right", sort: (st) => st.onHand, render: (st) => <span className="num text-[12.5px] font-semibold text-ink-900">{st.onHand.toLocaleString("en-IN")} <span className="text-ink-400 font-normal text-[11px]">{st.unit}</span></span> },
    { key: "rol", label: "vs ROL", render: (st) => {
      const m = s.materials.find((x) => x.name === st.material);
      const pct = m ? Math.min(100, (st.onHand / (m.rol * 2)) * 100) : 50;
      const low = m && st.onHand < m.rol;
      return (
        <div className="flex items-center gap-2 w-[130px]">
          <div className="flex-1 h-[5px] rounded-full bg-line overflow-hidden">
            <div className={cx("h-full rounded-full transition-[width] duration-500", low ? "bg-danger-500" : "bg-brand-500")} style={{ width: `${pct}%` }} />
          </div>
          <span className={cx("num text-[10.5px] font-bold", low ? "text-danger-600" : "text-ink-500")}>{m?.rol.toLocaleString("en-IN")}</span>
        </div>);
    } },
    { key: "value", label: "Value (₹ Cr)", align: "right", sort: (st) => st.value, render: (st) => <span className="num text-[12.5px] font-semibold">{st.value.toFixed(1)}</span> },
    { key: "status", label: "Status", render: (st) => { const m = s.materials.find((x) => x.name === st.material); const low = m && st.onHand < m.rol; return <Pill value={low ? "Delayed" : "On Track"} pulse={!!low} />; }, csv: (st) => { const m = s.materials.find((x) => x.name === st.material); return m && st.onHand < m.rol ? "Low" : "OK"; } },
  ];

  const txnCols: Col[] = [
    { key: "code", label: "Ref", render: (t) => <span className="num text-[12px] font-bold text-brand-700">{t.code}</span> },
    { key: "kind", label: "Type", render: (t) => (
      <span className={cx("text-[10.5px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 border",
        t.kind === "Inward" ? "bg-ok-100 text-ok-600 border-ok-500/20" : t.kind === "Outward" ? "bg-amber-100 text-amber-600 border-amber-500/20" : t.kind === "Transfer" ? "bg-steel-100 text-steel-600 border-steel-300/40" : "bg-canvas text-ink-500 border-line")}>{t.kind}</span>) },
    { key: "material", label: "Material", render: (t) => <span className="text-[12.5px] font-semibold text-ink-900">{t.material}</span> },
    { key: "qty", label: "Qty", align: "right", sort: (t) => t.qty, render: (t) => <span className={cx("num text-[12px] font-semibold", t.kind === "Inward" ? "text-ok-600" : t.kind === "Outward" ? "text-danger-600" : "text-ink-700")}>{t.kind === "Outward" ? "−" : "+"}{t.qty.toLocaleString("en-IN")} {t.unit}</span> },
    { key: "project", label: "Project", render: (t) => <span className="text-[12px] text-ink-500">{t.project}</span> },
    { key: "date", label: "Date", render: (t) => <span className="num text-[11.5px] text-ink-500">{t.date}</span> },
    { key: "by", label: "By", render: (t) => <span className="text-[12px] text-ink-500">{t.by}</span> },
  ];

  const post = () => {
    const mat = s.materials.find((m) => m.name === form.material);
    const qty = parseFloat(form.qty);
    if (!mat || !qty || qty <= 0) { toast("error", "Select material and enter a valid quantity"); return; }
    if (entry !== "Inward") {
      const st = s.stock.find((x) => x.material === mat.name);
      if (!st || st.onHand < qty) { toast("error", `Insufficient stock — available ${st?.onHand ?? 0} ${mat.unit}`); return; }
    }
    const sign = entry === "Inward" ? 1 : entry === "Outward" ? -1 : -1;
    const code = `${entry === "Inward" ? "MAN" : entry === "Outward" ? "ISS" : "TRF"}-${Math.floor(4500 + Math.random() * 400)}`;
    setS((p) => ({
      ...p,
      stock: p.stock.map((st) => st.material === mat.name
        ? { ...st, onHand: +(st.onHand + sign * qty).toFixed(1), value: +(st.value + sign * qty * mat.rate).toFixed(1) }
        : st),
      mTxns: [{ id: "x" + Date.now(), code, kind: entry as any, material: mat.name, qty, unit: mat.unit, project: form.project, date: dStr(0), by: user.name }, ...p.mTxns],
    }));
    log("Materials", `${entry} Posted`, code, `${entry === "Outward" ? "−" : "+"}${qty} ${mat.unit} ${mat.name} (${form.project}) — stock ${sign > 0 ? "increased" : "reduced"}`);
    if (entry === "Outward") notify("stock", `${mat.name} issued — verify new level vs ROL`);
    toast("success", `${entry} of ${qty} ${mat.unit} ${mat.name} posted`);
    setEntry(null);
    setForm({ material: "", qty: "", project: "P1", note: "" });
  };

  return (
    <div className="fade-up">
      <PageHead title={initialTab === "stock" ? "Store Management" : "Material Management"} crumbs={["Meridian", "Materials & Store", initialTab === "stock" ? "Stock" : "Master"]}
        desc="Material master, reorder-controlled stock registers and inward/outward/transfer transactions — all feeding project consumption reports.">
        <Stat label="Inventory value" value={`₹${stockValue.toFixed(1)} Cr`} />
        <Stat label="Low stock lines" value={`${lowStock.length}`} tone={lowStock.length ? "danger" : "ok"} />
        <Stat label="Txns this week" value={`${s.mTxns.length}`} />
        <Stat label="Materials" value={`${s.materials.length}`} />
        <span className="flex gap-2">
          <AddBtn label="Material Inward" disabled={!can("materials", "create") && !can("store", "create")} tip="No create permission" onClick={() => setEntry("Inward")} />
          <Btn onClick={() => setEntry("Outward")} disabled={!can("materials", "create") && !can("store", "create")}><ITruck size={13} /> Issue Outward</Btn>
        </span>
      </PageHead>

      <Widget title={tab === "master" ? "Material Master" : tab === "stock" ? "Stock Register" : "Material Transactions"}
        subtitle={tab === "master" ? "Coding, categories, reorder levels and standard rates" : tab === "stock" ? "Project-wise stock positions with reorder-level monitoring" : "Full inward/outward/transfer ledger — immutable once posted"}>
        <div className="mb-3"><Seg value={tab} onChange={setTab} options={[
          { k: "master" as const, l: "Material Master", n: s.materials.length },
          { k: "stock" as const, l: "Stock Register", n: s.stock.length },
          { k: "txn" as const, l: "Transactions", n: s.mTxns.length },
        ]} /></div>
        <FilterBar pageKey={"mat-" + tab} q={q} onQ={setQ}
          filters={tab === "master" ? [{ key: "cat", label: "Category", value: fCat, options: cats, onChange: setFCat }] : []} />
        {tab === "master" && <DataTable pageKey="mat-master" rows={masterRows} cols={masterCols} />}
        {tab === "stock" && <DataTable pageKey="mat-stock" rows={stockRows} cols={stockCols} empty={{ title: "No stock lines", note: "Post a material inward to create a stock line." }} />}
        {tab === "txn" && <DataTable pageKey="mat-txn" rows={txnRows} cols={txnCols} selectable bulkActions={[{ label: "Export selection", on: (ids) => toast("success", `${ids.length} transactions exported to audit pack`) }]} />}
      </Widget>

      <Drawer open={!!entry} onClose={() => setEntry(null)} title={`Material ${entry}`} sub={entry === "Inward" ? "GRN-linked or manual stock-in" : entry === "Outward" ? "Issue against project cost centre" : "Inter-store movement"}>
        <div className="space-y-4">
          <Field label="Material">
            <div className="relative">
              <select className={selectCls} value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })}>
                <option value="">Select material…</option>
                {s.materials.map((m) => <option key={m.code} value={m.name}>{m.name} — {m.cat}</option>)}
              </select>
              <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`Quantity ${form.material ? "(" + (s.materials.find((m) => m.name === form.material)?.unit ?? "") + ")" : ""}`}><input type="number" className={inputCls} value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="0" /></Field>
            <Field label={entry === "Transfer" ? "From → To" : "Project / Cost centre"}>
              <div className="relative">
                <select className={selectCls} value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
                  {s.projects.map((p) => <option key={p.code} value={p.code}>{p.code}</option>)}
                  <option value="Store A → Store B">Store A → Store B</option>
                </select>
                <IChevD size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-300 pointer-events-none" />
              </div>
            </Field>
          </div>
          <Field label="Remarks"><input className={inputCls} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional note…" /></Field>
          {form.material && (
            <p className="text-[11px] text-ink-500 bg-canvas border border-line rounded-md px-3 py-2 fade-up">
              Current on hand: <b className="num text-ink-900">{s.stock.find((x) => x.material === form.material)?.onHand ?? 0} {s.materials.find((m) => m.name === form.material)?.unit}</b>
              {" "}· ROL: <b className="num text-ink-900">{s.materials.find((m) => m.name === form.material)?.rol.toLocaleString("en-IN")}</b>
            </p>
          )}
          <div className="flex justify-end gap-2"><Btn onClick={() => setEntry(null)}>Cancel</Btn><Btn kind="primary" onClick={post}>Post {entry}</Btn></div>
        </div>
      </Drawer>
    </div>
  );
}
