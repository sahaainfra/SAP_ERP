/* ── Meridian ERP · Central Print Template Engine ──────────────
   Professional A4/A3 printable documents with preview, company
   header, meta block, ruled tables with repeating headers,
   grand totals and a four-party signature section.            */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { cx } from "./ui";

export interface PrintCol { label: string; align?: "left" | "right" | "center" }
export interface PrintDoc {
  title: string;
  docNo: string;
  date: string;
  project?: string;
  period?: string;
  rev?: string;
  orientation?: "portrait" | "landscape";
  meta?: [string, string][];
  cols: PrintCol[];
  rows: (string | number)[][];
  totalsLabel?: string;
  totals?: (string | number)[];
  note?: string;
  generatedBy: string;
}

const fmtCell = (v: string | number) => (typeof v === "number" ? v.toLocaleString("en-IN") : v);
const alignCls = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");

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

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    document.body.classList.add("print-preview-open");
    return () => { window.removeEventListener("keydown", h); document.body.classList.remove("print-preview-open"); };
  }, [onClose]);

  const sheetW = orient === "portrait" ? "w-[210mm]" : "w-[297mm]";

  return (
    <div className="fixed inset-0 z-[200] bg-[#0a1218]/80 backdrop-blur-sm overflow-auto">
      <style>{`@page{size:A4 ${orient};margin:10mm}`}</style>

      {/* Toolbar — hidden on paper */}
      <div className="print-toolbar sticky top-0 z-10 flex items-center gap-2 px-4 h-13 py-2.5 bg-[#101b24]/95 backdrop-blur border-b border-[#2b3f4f]">
        <p className="text-[12.5px] font-semibold text-[#e7edf3] mr-auto truncate">Print preview · <span className="text-[#8fa6b8] font-normal">{doc.title} · {doc.docNo}</span></p>
        <div className="flex items-center gap-1 bg-[#1a2933] border border-[#2b3f4f] rounded-md p-0.5">
          {(["portrait", "landscape"] as const).map((o) => (
            <button key={o} onClick={() => setOrient(o)}
              className={cx("h-7 px-2.5 rounded text-[11px] font-bold uppercase tracking-wide transition-all", orient === o ? "bg-[#0e8070] text-white" : "text-[#8fa6b8] hover:text-white")}>
              {o === "portrait" ? "A4" : "A4 ⤢"}
            </button>
          ))}
        </div>
        <button onClick={() => window.print()} className="h-8 px-4 rounded-md bg-[#0e8070] text-white text-[12.5px] font-semibold hover:bg-[#128574] active:scale-95 transition-all">
          Print / Save PDF
        </button>
        <button onClick={onClose} className="h-8 px-3 rounded-md border border-[#2b3f4f] text-[12.5px] font-semibold text-[#c0ccd7] hover:bg-[#1a2933] active:scale-95 transition-all">
          Close
        </button>
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
                <p className="text-[9px] text-[#5c6b78] mt-1 leading-snug">Meridian Tower, Baner Road, Pune 411045 · GSTIN 27AAACS1429F1Z8 · CIN U45200MH2009PLC194410</p>
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
                    <td key={j} className={cx("px-2 py-[5px] border border-[#d8dee4]", alignCls(doc.cols[j]?.align), typeof c === "number" && "font-semibold")}
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

          {doc.note && <p className="mt-2.5 text-[9.5px] text-[#5c6b78] leading-snux leading-snug border-l-2 border-[#0c7264] pl-2">{doc.note}</p>}

          {/* Signature section */}
          <div className="grid grid-cols-4 gap-6 mt-[22mm]">
            {["Prepared By", "Checked By", "Recommended By", "Approved By"].map((s, i) => (
              <div key={s} className="text-center">
                <div className="h-[14mm]" />
                <div className="border-t border-[#1a2733] pt-1">
                  <p className="text-[9.5px] font-extrabold uppercase tracking-wide">{s}</p>
                  <p className="text-[8.5px] text-[#5c6b78] mt-0.5">Name &amp; Designation</p>
                  <p className="text-[8.5px] text-[#5c6b78]">Date: ____ / ____ / ________</p>
                </div>
                {i === 3 && <p className="text-[8px] text-[#5c6b78] mt-1">(Authorised Signatory)</p>}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-[10mm] pt-2 border-t border-[#d8dee4] text-[8.5px] text-[#5c6b78]" style={{ fontFamily: "IBM Plex Mono" }}>
            <span>Generated {new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })} by {doc.generatedBy}</span>
            <span>Meridian ERP · SAHAA INFRA LTD. · System document — uncontrolled when printed</span>
            <span>Page 1 of 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
