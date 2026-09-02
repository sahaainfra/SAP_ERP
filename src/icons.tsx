import React from "react";

type P = React.SVGProps<SVGSVGElement> & { size?: number };

const I =
  (paths: React.ReactNode, filled = false) =>
  ({ size = 18, ...rest }: P) => (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke={filled ? "none" : "currentColor"}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {paths}
    </svg>
  );

/* ── Navigation modules ─────────────────────────────── */
export const IGrid = I(<><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="3.5" /></>);
export const IHardhat = I(<><path d="M4 15.5a8 8 0 0 1 16 0" /><path d="M2.8 15.5h18.4v2.2a1 1 0 0 1-1 1H3.8a1 1 0 0 1-1-1z" /><path d="M10 8V5.6a1.2 1.2 0 0 1 1.2-1.2h1.6A1.2 1.2 0 0 1 14 5.6V8" /></>);
export const IGavel = I(<><path d="M13.2 5.4l5.4 5.4" /><path d="M11.4 7.2l5.4 5.4" /><path d="M14.1 4.5l2.3-2.3a1.4 1.4 0 0 1 2 0l3.2 3.2a1.4 1.4 0 0 1 0 2l-2.3 2.3z" /><path d="M12.3 9.9L3.6 18.6a1.4 1.4 0 0 0 0 2l.2.2a1.4 1.4 0 0 0 2 0l8.7-8.7" /><path d="M12.5 21h8.5" /></>);
export const IContract = I(<><path d="M6 2.8h9.2L19 6.6v13a1.6 1.6 0 0 1-1.6 1.6H6A1.6 1.6 0 0 1 4.4 19.6V4.4A1.6 1.6 0 0 1 6 2.8z" /><path d="M15 3v4h4" /><path d="M8 12h8M8 15.4h5" /><circle cx="15.6" cy="17.4" r="2.3" /><path d="M15 17.4l.6.6 1-1.2" /></>);
export const ICart = I(<><path d="M3 4h2.2l2 11.2a1.5 1.5 0 0 0 1.5 1.3h7.9a1.5 1.5 0 0 0 1.5-1.2L19.8 8H6" /><circle cx="9.6" cy="20" r="1.4" /><circle cx="16.8" cy="20" r="1.4" /></>);
export const ICube = I(<><path d="M12 2.9l7.8 4.5v9.2L12 21.1l-7.8-4.5V7.4z" /><path d="M12 21V12M4.4 7.5L12 12l7.6-4.5" /></>);
export const IWarehouse = I(<><path d="M3 20V8.8L12 4l9 4.8V20" /><path d="M7 20v-7h10v7" /><path d="M7 16.5h10M3 20h18" /></>);
export const ICrane = I(<><path d="M5 21V5.5L19 4v3.5" /><path d="M5 8h14" /><path d="M15.5 8v4.2" /><circle cx="15.5" cy="13.8" r="1.5" /><path d="M2.8 21h8.4M7 21v-5h4v5" /></>);
export const IMixer = I(<><path d="M2.5 6.5h9l1.5 5.5h-10z" /><path d="M7 6.5V4.6h3" /><path d="M13 12h3.2L19 8.6h2.5V15a1.5 1.5 0 0 1-1.5 1.5h-1" /><path d="M2.5 12v3A1.5 1.5 0 0 0 4 16.5h.8" /><circle cx="7.2" cy="17.5" r="1.9" /><circle cx="16.6" cy="17.5" r="1.9" /><path d="M9.1 16.8h5.6" /></>);
export const ICalCheck = I(<><rect x="3.5" y="4.5" width="17" height="16" rx="2" /><path d="M3.5 9.5h17M8 2.8v3.4M16 2.8v3.4" /><path d="M9 14.6l2.1 2.1 4-4.3" /></>);
export const IUsers = I(<><circle cx="9" cy="8.2" r="3.4" /><path d="M2.9 20.2a6.1 6.1 0 0 1 12.2 0" /><path d="M15.4 5.2a3.4 3.4 0 0 1 0 6" /><path d="M17.4 14.6a6.1 6.1 0 0 1 3.7 5.6" /></>);
export const ILedger = I(<><path d="M5 3.5h13A1.5 1.5 0 0 1 19.5 5v14a1.5 1.5 0 0 1-1.5 1.5H5z" /><path d="M5 3.5A1.5 1.5 0 0 0 3.5 5v14A1.5 1.5 0 0 0 5 20.5" /><path d="M9 8h6.5M9 11.5h6.5M9 15h4" /></>);
export const IReceipt = I(<><path d="M6 2.8h12v18.4l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6-2.4-1.6z" /><path d="M9 7.5h6M9 11h6M9 14.5h3.5" /></>);
export const INote = I(<><rect x="2.8" y="6" width="18.4" height="12" rx="2" /><circle cx="12" cy="12" r="2.8" /><path d="M6 12h.01M18 12h.01" /></>);
export const IStamp = I(<><path d="M12 3.2a3 3 0 0 0-3 3c0 2 1 3.4 1 5H7a2.5 2.5 0 0 0-2.5 2.5v1.6h15v-1.6A2.5 2.5 0 0 0 17 11.2h-3c0-1.6 1-3 1-5a3 3 0 0 0-3-3z" /><path d="M5 20.8h14" /></>);
export const IChart = I(<><path d="M4 4v15.5a.5.5 0 0 0 .5.5H20" /><rect x="7.4" y="12" width="3" height="5" rx="0.6" /><rect x="12.6" y="8" width="3" height="9" rx="0.6" /><rect x="17.8" y="5" width="3" height="12" rx="0.6" /></>);
export const ITrend = I(<><path d="M3.5 17.5l5.4-5.4 3.6 3.6 7.4-7.9" /><path d="M14.8 7.5h5.1v5.1" /></>);
export const IFiles = I(<><path d="M8 7V4.6A1.6 1.6 0 0 1 9.6 3h7A1.6 1.6 0 0 1 18.2 4.6v12.8a1.6 1.6 0 0 1-1.6 1.6H14" /><path d="M5.8 8h7A1.6 1.6 0 0 1 14.4 9.6v9.8a1.6 1.6 0 0 1-1.6 1.6h-7A1.6 1.6 0 0 1 4.2 19.4V9.6A1.6 1.6 0 0 1 5.8 8z" /><path d="M7.4 12.5h4M7.4 15.8h2.6" /></>);
export const ICog = I(<><circle cx="12" cy="12" r="3.2" /><path d="M12 2.8l1.2 2.6 2.8-.7 1 2.7 2.8.8-.7 2.8 2 2-2 2 .7 2.8-2.8.8-1 2.7-2.8-.7L12 21.2l-1.2-2.6-2.8.7-1-2.7-2.8-.8.7-2.8-2-2 2-2-.7-2.8 2.8-.8 1-2.7z" /></>);

/* ── Chrome & actions ───────────────────────────────── */
export const ISearch = I(<><circle cx="10.8" cy="10.8" r="6.3" /><path d="M15.5 15.5L21 21" /></>);
export const IBell = I(<><path d="M12 3.6a5.6 5.6 0 0 0-5.6 5.6c0 4.6-1.6 5.9-1.6 5.9h14.4s-1.6-1.3-1.6-5.9A5.6 5.6 0 0 0 12 3.6z" /><path d="M10 18.6a2.1 2.1 0 0 0 4 0" /></>);
export const IInbox = I(<><path d="M3.5 13.5L6 5.6A1.6 1.6 0 0 1 7.5 4.5h9A1.6 1.6 0 0 1 18 5.6l2.5 7.9" /><path d="M3.5 13.5h5l1.2 2.4h4.6l1.2-2.4h5V18a1.6 1.6 0 0 1-1.6 1.6H5.1A1.6 1.6 0 0 1 3.5 18z" /></>);
export const IHelp = I(<><circle cx="12" cy="12" r="8.8" /><path d="M9.6 9.2a2.5 2.5 0 0 1 4.9.7c0 1.6-2.4 2-2.4 3.6" /><path d="M12 16.8h.01" /></>);
export const IChevD = I(<path d="M6 9.5l6 6 6-6" />);
export const IChevR = I(<path d="M9.5 6l6 6-6 6" />);
export const IChevU = I(<path d="M6 14.5l6-6 6 6" />);
export const IX = I(<path d="M6 6l12 12M18 6L6 18" />);
export const IFilter = I(<path d="M4 5.5h16l-6.2 7.2v5.6L10.2 20v-7.3z" />);
export const IColumns = I(<><rect x="3.5" y="4.5" width="17" height="15" rx="1.6" /><path d="M9.5 4.5v15M15.5 4.5v15" /></>);
export const IDownload = I(<><path d="M12 3.5v11M7.5 10l4.5 4.5L16.5 10" /><path d="M4.5 16.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-2.5" /></>);
export const IPrinter = I(<><path d="M7 8V3.5h10V8" /><path d="M7 17H4.5A1.5 1.5 0 0 1 3 15.5v-6A1.5 1.5 0 0 1 4.5 8h15A1.5 1.5 0 0 1 21 9.5v6a1.5 1.5 0 0 1-1.5 1.5H17" /><rect x="7" y="14" width="10" height="6.5" rx="1" /></>);
export const IRefresh = I(<><path d="M20 12a8 8 0 1 1-2.3-5.6" /><path d="M20 3.8v4h-4" /></>);
export const IDots = I(<><circle cx="5" cy="12" r="1.15" /><circle cx="12" cy="12" r="1.15" /><circle cx="19" cy="12" r="1.15" /></>, true);
export const IArrowUp = I(<><path d="M12 19V5M6.5 10.5L12 5l5.5 5.5" /></>);
export const IArrowDown = I(<><path d="M12 5v14M6.5 13.5L12 19l5.5-5.5" /></>);
export const IPlus = I(<path d="M12 5v14M5 12h14" />);
export const ICheck = I(<path d="M5 12.5l4.5 4.5L19 7.5" />);
export const IXCircle = I(<><circle cx="12" cy="12" r="8.8" /><path d="M9 9l6 6M15 9l-6 6" /></>);
export const IEye = I(<><path d="M2.8 12S6.5 5.8 12 5.8 21.2 12 21.2 12 17.5 18.2 12 18.2 2.8 12 2.8 12z" /><circle cx="12" cy="12" r="3" /></>);
export const IGrip = I(<><circle cx="9" cy="6" r="1.1" /><circle cx="15" cy="6" r="1.1" /><circle cx="9" cy="12" r="1.1" /><circle cx="15" cy="12" r="1.1" /><circle cx="9" cy="18" r="1.1" /><circle cx="15" cy="18" r="1.1" /></>, true);
export const IMenu = I(<path d="M4 6.5h16M4 12h16M4 17.5h10" />);
export const ILogout = I(<><path d="M14 4H6.5A1.5 1.5 0 0 0 5 5.5v13A1.5 1.5 0 0 0 6.5 20H14" /><path d="M10 12h11M17.5 8.5L21 12l-3.5 3.5" /></>);
export const IUser = I(<><circle cx="12" cy="8" r="3.6" /><path d="M4.8 20.4a7.3 7.3 0 0 1 14.4 0" /></>);
export const IBuilding = I(<><rect x="4.5" y="3.5" width="11" height="17" rx="1" /><path d="M15.5 9.5h3a1 1 0 0 1 1 1v10" /><path d="M3 20.5h18" /><path d="M8 7.5h1.6M10.9 7.5h1.6M8 11h1.6M10.9 11h1.6M8 14.5h1.6M10.9 14.5h1.6" /><path d="M9.5 20.5v-3h2.4v3" /></>);
export const ICalendar = I(<><rect x="3.5" y="4.5" width="17" height="16" rx="2" /><path d="M3.5 9.5h17M8 2.8v3.4M16 2.8v3.4" /></>);
export const IClock = I(<><circle cx="12" cy="12" r="8.8" /><path d="M12 7v5.2l3.4 2" /></>);
export const IAlert = I(<><path d="M12 3.6L1.9 20.4h20.2z" /><path d="M12 9.5v5M12 17.6h.01" /></>);
export const IInfo = I(<><circle cx="12" cy="12" r="8.8" /><path d="M12 11v5.4M12 7.6h.01" /></>);
export const ISave = I(<><path d="M5 3.5h11L20.5 8v11A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5z" /><path d="M8 3.5V8h7V3.5" /><rect x="8" y="13" width="8" height="7.5" /></>);
export const ILayout = I(<><rect x="3.5" y="3.5" width="17" height="17" rx="2" /><path d="M3.5 9.5h17M9.5 9.5v11" /></>);
export const ICollapse = I(<><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><path d="M9.5 4.5v15M6.8 9.5l-1.4 2.5 1.4 2.5" /></>);
export const IRupee = I(<><path d="M6.5 4h11M6.5 8h11M9 4c3.6 0 5.5 1.6 5.5 4S12.6 12 9 12H7l6.5 8" /></>);
export const ITarget = I(<><circle cx="12" cy="12" r="8.6" /><circle cx="12" cy="12" r="4.6" /><circle cx="12" cy="12" r="0.9" /></>);
export const ITruck = I(<><path d="M2.8 6h11.4v10.5H2.8z" /><path d="M14.2 9.5h3.6l3 3.4v3.6h-6.6" /><circle cx="7" cy="17.8" r="1.9" /><circle cx="17.2" cy="17.8" r="1.9" /></>);
export const IFlask = I(<><path d="M9.5 3.5h5M10.5 3.5v5.2L5.2 18a1.6 1.6 0 0 0 1.4 2.4h10.8a1.6 1.6 0 0 0 1.4-2.4L13.5 8.7V3.5" /><path d="M7.6 14.5h8.8" /></>);
