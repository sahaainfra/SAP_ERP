/* ── Meridian ERP · Central Print Template Engine v3 ─────────────
   Professional A4/A3 printable documents: preview, company header,
   meta block, ruled tables with repeating headers, totals, amount in
   words, terms, purpose/remarks, signature blocks (incl. captured
   digital signatures) and a document verification code.            */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { cx } from "./ui";

export interface PrintCol { label: string; align?: "left" | "right" | "center" }
export interface SignBlock { role: string; name?: string; desig?: string; date?: string; time?: string; svg?: string; comment?: string }
export interface PrintDoc {
  title: string;
  docNo: string;
  date: string;
  project?: string;
  period?: string;
  rev?: string;
  orientation?: "portrait" | "landscape";
  paper?: "a4" | "a3";
  meta?: [string, string][];
  cols: PrintCol[];
  rows: (string | number)[][];
  totalsLabel?: string;
  totals?: (string | number)[];
  inWords?: number;
  purpose?: string;
  remarks?: string;
  terms?: string[];
  signatures?: string[];
  signBlocks?: SignBlock[];
  acceptance?: boolean;
  verifyCode?: string;
  note?: string;
  generatedBy: string;
}

/* Indian amount-in-words (absolute rupees) */
export function inrWords(num: number): string {
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const two = (n: number): string => (n < 20 ? a[n] : b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : ""));
  const three = (n: number): string => {
    const h = Math.floor(n / 100), r = n % 100;
    return (h ? a[h] + " Hundred" + (r ? " " : "") : "") + (r ? two(r) : "");
  };
  let n = Math.round(Math.abs(num));
  const paise = Math.round((Math.abs(num) - Math.floor(Math.abs(num))) * 100);
  const cr = Math.floor(n / 1e7); n %= 1e7;
  const lk = Math.floor(n / 1e5); n %= 1e5;
  const th = Math.floor(n / 1e3); n %= 1e3;
  const parts: string[] = [];
  if (cr) parts.push(two(cr) + " Crore");
  if (lk) parts.push(two(lk) + " Lakh");
  if (th) parts.push(two(th) + " Thousand");
  if (n) parts.push(three(n));
  const body = parts.length ? parts.join(" ") : "Zero";
  return "Rupees " + body + " Only" + (paise ? " and Paise " + two(paise) : "");
}

const fmtCell = (v: string | number) => (typeof v === "number" ? v.toLocaleString("en-IN") : v);
const alignCls = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

/* deterministic pseudo-QR from a string */
function VerifyCode({ code }: { code: string }) {
  const cells: boolean[] = [];
  let h = 2166136261;
  for (let i = 0; i < code.length; i++) { h ^= code.charCodeAt(i); h = Math.imul(h, 16777619); }
  for (let i = 0; i < 121; i++) { h = Math.imul(h ^ (h >>> 13), 1274126177); cells.push((h >>> 24) % 3 !== 0); }
  return (
    <div className="flex items-center gap-2.5">
      <svg width="52" height="52" viewBox="0 0 11 11" shapeRendering="crispEdges">
        {cells.map((c, i) => c ? <rect key={i} x={i % 11} y={Math.floor(i / 11)} width="1" height="1" fill="#10231f" /> : null)}
        <rect x="0" y="0" width="3" height="3" fill="none" stroke="#10231f" strokeWidth="0.8" />
        <rect x="8" y="0" width="3" height="3" fill="none" stroke="#10231f" strokeWidth="0.8" />
        <rect x="0" y="8" width="3" height="3" fill="none" stroke="#10231f" strokeWidth="0.8" />
      </svg>
      <div style={{ fontFamily: "IBM Plex Mono" }}>
        <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#5c6b78]">Verification Code</p>
        <p className="text-[10.5px] font-bold text-[#1a2733]">{code}</p>
        <p className="text-[7.5px] text-[#5c6b78]">verify @ sahaainfra.com/doc</p>
      </div>
    </div>
  );
}

export function printDocument(doc: PrintDoc) {
  const host = document.createElement("div");
  host.className = "print-host";
  document.body.appendChild(host);
  const root = createRoot(host);
  const close = () => { root.unmount(); host.remove(); };
  root.render(<Preview doc={doc} onClose={close} />);
}

function Preview({ doc, onClose }: { doc: PrintDoc; onClose: () => void }) {
  const [orient, setOrient] = useState<"portrait" | "landscape">(doc.orientation ?? "portrait");
  const [paper, setPaper] = useState<"a4" | "a3">(doc.paper ?? "a4");
  const [showSigs, setShowSigs] = useState(true);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.classList.add("print-preview-open");
    return () => { window.removeEventListener("keydown", h); document.body.classList.remove("print-preview-open"); };
  }, [onClose]);

  const sheetW = orient === "portrait" ? (paper === "a3" ? "w-[297mm]" : "w-[210mm]") : paper === "a3" ? "w-[420mm]" : "w-[297mm]";
  const verify = doc.verifyCode ?? `MER-${doc.docNo.replace(/[^A-Za-z0-9]/g, "")}-${new Date().getFullYear()}`;
  const sigs: SignBlock[] = doc.signBlocks ?? (doc.signatures ?? ["Prepared By", "Checked By", "Recommended By", "Approved By"]).map((s): SignBlock => ({ role: s }));

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a1218]/80 backdrop-blur-sm overflow-auto">
      <style>{`@page{size:${paper.toUpperCase()} ${orient};margin:10mm}`}</style>

      {/* Toolbar — hidden on paper */}
      <div className="print-toolbar sticky top-0 z-10 flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[#101b24]/95 backdrop-blur border-b border-[#2b3f4f]">
        <p className="text-[12.5px] font-semibold text-[#e7edf3] mr-auto truncate">Print preview · <span className="text-[#8fa6b8] font-normal">{doc.title} · {doc.docNo}</span></p>
        <div className="flex items-center gap-1 bg-[#1a2933] border border-[#2b3f4f] rounded-md p-0.5">
          {(["a4", "a3"] as const).map((p) => (
            <button key={p} onClick={() => setPaper(p)} className={cx("h-7 px-2 rounded text-[11px] font-bold uppercase transition-all", paper === p ? "bg-[#0e8070] text-white" : "text-[#8fa6b8] hover:text-white")}>{p}</button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-[#1a2933] border border-[#2b3f4f] rounded-md p-0.5">
          {(["portrait", "landscape"] as const).map((o) => (
            <button key={o} onClick={() => setOrient(o)} className={cx("h-7 px-2.5 rounded text-[11px] font-bold uppercase tracking-wide transition-all", orient === o ? "bg-[#0e8070] text-white" : "text-[#8fa6b8] hover:text-white")}>
              {o === "portrait" ? "Port." : "Land."}
            </button>
          ))}
        </div>
        <button onClick={() => setShowSigs((v) => !v)} className={cx("h-8 px-3 rounded-md border text-[11.5px] font-semibold transition-all", showSigs ? "border-[#0e8070] text-[#3cb3a0]" : "border-[#2b3f4f] text-[#8fa6b8]")}>
          {showSigs ? "Signatures on" : "Signatures off"}
        </button>
        <button onClick={() => window.print()} className="h-8 px-4 rounded-md bg-[#0e8070] text-white text-[12.5px] font-semibold hover:bg-[#128574] active:scale-95 transition-all">
          Print / Save PDF
        </button>
        <button onClick={onClose} className="h-8 px-3 rounded-md border border-[#2b3f4f] text-[12.5px] font-semibold text-[#c0ccd7] hover:bg-[#1a2933] active:scale-95 transition-all">Close</button>
      </div>

      {/* Sheet */}
      <div className="flex justify-center py-6 px-3">
        <div className={cx("print-sheet bg-white text-[#1a2733] shadow-2xl rounded-sm px-[12mm] py-[11mm] max-w-full", sheetW)} style={{ fontFamily: "IBM Plex Sans, sans-serif" }}>
          {/* Company header */}
          <div className="flex items-start justify-between gap-6 pb-4 border-b-2 border-[#10231f]">
            <div className="flex items-center gap-3 min-w-0">
              <span className="grid place-items-center shrink-0 h-11 w-11 rounded-lg bg-[#0c7264] text-white">
                <svg width="22" height="22" viewBox="0 0 32 32" fill="none"><path d="M6 24V10l7 8 4-5 9 11H6z" fill="currentColor" /><circle cx="24" cy="9" r="2.6" fill="#E0A33B" /></svg>
              </span>
              <div className="min-w-0">
                <p className="text-[17px] font-extrabold tracking-tight leading-none" style={{ fontFamily: "Sora, sans-serif" }}>SAHAA INFRA <span className="text-[#0c7264]">LTD.</span></p>
                <p className="text-[9px] text-[#5c6b78] mt-1 leading-snug">Meridian House, Baner Road, Pune 411045 · +91 20 6744 2200 · GSTIN 27AAACS1429B1ZQ · PAN AAACS1429B</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[13px] font-extrabold uppercase tracking-[0.14em] text-[#0c7264]">{doc.title}</p>
              <p className="text-[10px] mt-1" style={{ fontFamily: "IBM Plex Mono" }}>Doc No: <b>{doc.docNo}</b>{doc.rev ? ` · Rev ${doc.rev}` : ""}</p>
              <p className="text-[10px]" style={{ fontFamily: "IBM Plex Mono" }}>Date: {doc.date}</p>
            </div>
          </div>

          {/* Meta block */}
          {(doc.project || doc.period || doc.meta?.length) && (
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 py-2.5 border-b border-[#d8dee4] text-[10.5px]">
              {doc.project && <p><span className="font-bold text-[#5c6b78] uppercase tracking-wide text-[9px]">Project: </span><b>{doc.project}</b></p>}
              {doc.period && <p><span className="font-bold text-[#5c6b78] uppercase tracking-wide text-[9px]">Period: </span><b>{doc.period}</b></p>}
              {doc.meta?.map(([k, v]) => <p key={k}><span className="font-bold text-[#5c6b78] uppercase tracking-wide text-[9px]">{k}: </span><b>{v}</b></p>)}
            </div>
          )}

          {/* Table */}
          <table className="w-full border-collapse mt-3" style={{ fontSize: 10.5 }}>
            <thead>
              <tr>
                <th className="bg-[#10231f] text-white text-left font-bold px-2 py-1.5 border border-[#10231f] w-[30px]" style={{ fontSize: 9 }}>Sr.</th>
                {doc.cols.map((c) => (
                  <th key={c.label} className={cx("bg-[#10231f] text-white font-bold px-2 py-1.5 border border-[#10231f]", alignCls(c.align))} style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.04em" }}>{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {doc.rows.map((r, i) => (
                <tr key={i} className={i % 2 ? "bg-[#f3f6f8]" : "bg-white"}>
                  <td className="px-2 py-[5px] border border-[#d8dee4] text-[#5c6b78]" style={{ fontFamily: "IBM Plex Mono", fontSize: 9.5 }}>{i + 1}</td>
                  {r.map((c, j) => (
                    <td key={j} className={cx("px-2 py-[5px] border border-[#d8dee4] align-top", alignCls(doc.cols[j]?.align), typeof c === "number" && "font-semibold")}
                      style={typeof c === "number" ? { fontFamily: "IBM Plex Mono", fontSize: 9.5 } : undefined}>{fmtCell(c)}</td>
                  ))}
                </tr>
              ))}
              {doc.totals && (() => {
                const t = doc.totals as (string | number)[];
                const pad = Math.max(0, doc.cols.length + 1 - t.length);
                return (
                  <tr>
                    {pad > 0 && <td colSpan={pad} className="px-2 py-1.5 border border-[#10231f] bg-[#e9f1ef] font-extrabold text-right uppercase" style={{ fontSize: 9 }}>{doc.totalsLabel ?? "Grand Total"}</td>}
                    {t.map((v, j) => (
                      <td key={j} className="px-2 py-1.5 border border-[#10231f] bg-[#e9f1ef] font-extrabold text-right" style={{ fontFamily: "IBM Plex Mono", fontSize: 10 }}>{fmtCell(v)}</td>
                    ))}
                  </tr>
                );
              })()}
            </tbody>
          </table>

          {doc.inWords !== undefined && (
            <p className="mt-2 text-[10px] border border-[#d8dee4] rounded px-2.5 py-1.5 bg-[#f3f6f8]">
              <span className="font-bold uppercase text-[8.5px] tracking-wide text-[#5c6b78]">Amount in words: </span>
              <b>{inrWords(doc.inWords)}</b>
            </p>
          )}

          {doc.purpose && (
            <div className="mt-2.5 text-[10px]"><p className="font-bold uppercase text-[8.5px] tracking-wide text-[#5c6b78] mb-0.5">Requirement / Purpose</p><p className="leading-snug border-b border-dotted border-[#9aa8b4] pb-1">{doc.purpose}</p></div>
          )}
          {doc.remarks && (
            <div className="mt-2 text-[10px]"><p className="font-bold uppercase text-[8.5px] tracking-wide text-[#5c6b78] mb-0.5">Remarks</p><p className="leading-snug border-b border-dotted border-[#9aa8b4] pb-1">{doc.remarks}</p></div>
          )}

          {doc.terms && doc.terms.length > 0 && (
            <div className="mt-3 break-inside-avoid">
              <p className="text-[10.5px] font-extrabold uppercase tracking-[0.1em] text-[#10231f] border-b border-[#10231f] pb-1 mb-1.5">Terms &amp; Conditions</p>
              <ol className="space-y-1">
                {doc.terms.map((t, i) => (
                  <li key={i} className="flex gap-2 text-[9.5px] leading-snug text-[#3c4a56]"><span className="font-bold" style={{ fontFamily: "IBM Plex Mono" }}>{i + 1}.</span><span>{t}</span></li>
                ))}
              </ol>
            </div>
          )}

          {doc.note && <p className="mt-2.5 text-[9.5px] text-[#5c6b78] leading-snug border-l-2 border-[#0c7264] pl-2">{doc.note}</p>}

          {/* Signatures */}
          {showSigs && (
            <div className={cx("grid gap-6 mt-[16mm]", sigs.length <= 4 ? "grid-cols-4" : "grid-cols-4")}>
              {sigs.map((s) => (
                <div key={s.role} className="text-center">
                  <div className="h-[13mm] flex items-end justify-center">
                    {s.svg ? <img src={s.svg} alt="signature" className="max-h-[12mm] max-w-full object-contain" /> : null}
                  </div>
                  <div className="border-t border-[#1a2733] pt-1">
                    <p className="text-[9.5px] font-extrabold uppercase tracking-wide">{s.role}</p>
                    <p className="text-[8.5px] text-[#3c4a56] mt-0.5 font-semibold">{s.name ? s.name : "Name & Designation"}</p>
                    {s.desig && <p className="text-[8px] text-[#5c6b78]">{s.desig}</p>}
                    <p className="text-[8px] text-[#5c6b78]" style={{ fontFamily: "IBM Plex Mono" }}>
                      {s.date ? `Signed ${s.date}${s.time ? " " + s.time : ""}` : "Date: ____ / ____ / ________"}
                    </p>
                    {s.comment && <p className="text-[7.5px] text-[#5c6b78] italic mt-0.5">“{s.comment}”</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vendor acceptance */}
          {doc.acceptance && (
            <div className="mt-[8mm] border border-[#10231f] rounded p-3 grid grid-cols-2 gap-x-8 gap-y-2 text-[9.5px]">
              <p className="col-span-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#10231f]">Vendor Acceptance — We hereby accept this order with its terms &amp; conditions</p>
              <p>Accepted By: ____________________________</p>
              <p>Company: ____________________________</p>
              <p>Name: ____________________________</p>
              <p>Date: ____________________________</p>
              <p className="col-span-2">Signature &amp; Seal: ____________________________</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-4 mt-[8mm] pt-2 border-t border-[#d8dee4] text-[8.5px] text-[#5c6b78]">
            <VerifyCode code={verify} />
            <div className="text-center" style={{ fontFamily: "IBM Plex Mono" }}>
              <p>Generated {new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} by {doc.generatedBy}</p>
              <p className="mt-0.5">System generated document — uncontrolled when printed · Meridian ERP · SAHAA INFRA LTD.</p>
            </div>
            <span style={{ fontFamily: "IBM Plex Mono" }}>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
