import { useState } from "react";
import type { ComponentType } from "react";
import { NAV, RoleId } from "./data";
import { cx } from "./ui";
import {
  IGrid, IHardhat, IGavel, IContract, ICart, ICube, IWarehouse, ICrane, IMixer, ICalCheck, IUsers,
  ILedger, IReceipt, INote, IStamp, IChart, ITrend, IFiles, ICog, IChevD, IChevR, IX, ICollapse,
} from "./icons";

const ICONS: Record<string, ComponentType<{ size?: number; className?: string }>> = {
  grid: IGrid, hardhat: IHardhat, gavel: IGavel, contract: IContract, cart: ICart, cube: ICube,
  warehouse: IWarehouse, crane: ICrane, mixer: IMixer, calcheck: ICalCheck, users: IUsers,
  ledger: ILedger, receipt: IReceipt, note: INote, stamp: IStamp, chart: IChart, trend: ITrend,
  files: IFiles, cog: ICog,
};

export default function Sidebar({
  collapsed, onToggle, active, onSelect, role, mobileOpen, onCloseMobile,
}: {
  collapsed: boolean; onToggle: () => void; active: string; onSelect: (id: string) => void;
  role: RoleId; mobileOpen: boolean; onCloseMobile: () => void;
}) {
  const [open, setOpen] = useState<string[]>(["projects"]);
  const visible = NAV.filter((n) => !n.roles || n.roles.includes(role));

  const click = (id: string, hasChildren: boolean) => {
    onSelect(id);
    if (hasChildren) setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
    onCloseMobile();
  };

  const body = (mini: boolean) => (
    <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2">
      {visible.map((item) => {
        const Ic = ICONS[item.icon];
        const isActive = active === item.id || item.children?.some((c) => active === c.id);
        const isOpen = open.includes(item.id);
        return (
          <div key={item.id} className="mb-0.5">
            <button
              onClick={() => click(item.id, !!item.children)}
              className={cx(
                "group w-full flex items-center gap-2.5 rounded-lg transition-all duration-150 text-left",
                mini ? "h-10 justify-center px-0" : "h-[38px] px-2.5",
                isActive ? "bg-brand-600/15 text-[#d7efe9]" : "text-side-300 hover:bg-white/[0.05] hover:text-[#cfe0ea]"
              )}
              title={mini ? item.label : undefined}
            >
              <span className={cx("relative shrink-0 transition-colors", isActive && "text-[#5fc4ae]")}>
                <Ic size={17} />
                {isActive && <span className="absolute -left-[13px] top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-r bg-brand-500 max-lg:hidden" style={{ left: mini ? undefined : -16 }} />}
              </span>
              {!mini && (
                <>
                  <span className="flex-1 text-[12.5px] font-medium truncate">{item.label}</span>
                  {item.children && (
                    <IChevD size={13} className={cx("text-side-500 transition-transform duration-200", isOpen && "rotate-180")} />
                  )}
                </>
              )}
            </button>
            {!mini && item.children && (
              <div className={cx("grid transition-[grid-template-rows] duration-200 ease-out", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                <div className="overflow-hidden">
                  <ul className="ml-[19px] pl-3 border-l border-side-700 py-1 space-y-0.5">
                    {item.children.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => { onSelect(c.id); onCloseMobile(); }}
                          className={cx(
                            "w-full flex items-center gap-2 h-[30px] px-2 rounded-md text-[12px] transition-colors text-left",
                            active === c.id ? "text-[#5fc4ae] font-semibold bg-brand-600/10" : "text-side-300/80 hover:text-[#cfe0ea] hover:bg-white/[0.04]"
                          )}
                        >
                          {active === c.id ? <IChevR size={11} className="shrink-0" /> : <span className="h-1 w-1 rounded-full bg-side-500 shrink-0" />}
                          <span className="truncate">{c.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  const shell = (mini: boolean) => (
    <div className="flex flex-col h-full bg-side-900 relative">
      <div className={cx("flex items-center h-14 border-b border-white/[0.06] shrink-0", mini ? "justify-center" : "justify-between pl-4 pr-2.5")}>
        {!mini && (
          <div className="flex items-center gap-2">
            <span className="grid place-items-center h-7 w-7 rounded-md bg-brand-600 text-white">
              <svg width="15" height="15" viewBox="0 0 32 32" fill="none"><path d="M6 24V10l7 8 4-5 9 11H6z" fill="currentColor" /><circle cx="24" cy="9" r="2.6" fill="#E0A33B" /></svg>
            </span>
            <span className="font-display font-bold text-[14px] tracking-tight text-[#e8f2ee]">Meridian <span className="text-[#5fc4ae]">ERP</span></span>
          </div>
        )}
        {mini ? (
          <span className="grid place-items-center h-8 w-8 rounded-md bg-brand-600 text-white">
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path d="M6 24V10l7 8 4-5 9 11H6z" fill="currentColor" /><circle cx="24" cy="9" r="2.6" fill="#E0A33B" /></svg>
          </span>
        ) : (
          <button onClick={onToggle} className="hidden lg:grid h-7 w-7 place-items-center rounded-md text-side-300 hover:bg-white/[0.06] hover:text-white transition-all max-lg:hidden" aria-label="Collapse sidebar">
            <ICollapse size={16} />
          </button>
        )}
      </div>

      {body(mini)}

      <div className={cx("shrink-0 border-t border-white/[0.06] p-3", mini && "px-2")}>
        {!mini ? (
          <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/[0.05] px-2.5 py-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#4ade80] opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ade80]" />
            </span>
            <div className="min-w-0">
              <p className="text-[10.5px] font-semibold text-[#cfe0ea] leading-none">All systems operational</p>
              <p className="text-[9.5px] text-side-300 mt-1 num leading-none">v4.2.1 · uptime 99.98%</p>
            </div>
          </div>
        ) : (
          <button onClick={onToggle} className="w-full h-8 grid place-items-center rounded-md text-side-300 hover:bg-white/[0.06] hover:text-white transition-all tip" data-tip="Expand sidebar">
            <IChevR size={15} />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop */}
      <aside className={cx("hidden lg:block shrink-0 h-[calc(100dvh-0px)] sticky top-0 z-30 transition-[width] duration-250 no-print", collapsed ? "w-[64px]" : "w-[248px]")}>
        {shell(collapsed)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 no-print">
          <div className="absolute inset-0 bg-side-900/60 backdrop-blur-[2px]" onClick={onCloseMobile} />
          <div className="absolute left-0 top-0 bottom-0 w-[268px] shadow-pop animate-[drawer_0.25s_cubic-bezier(0.22,1,0.36,1)]" style={{ animationName: "rise" }}>
            <button onClick={onCloseMobile} className="absolute -right-11 top-3 h-9 w-9 grid place-items-center rounded-lg bg-side-800 text-white" aria-label="Close">
              <IX size={17} />
            </button>
            {shell(false)}
          </div>
        </div>
      )}
    </>
  );
}
