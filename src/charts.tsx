import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  AreaChart, Area, LineChart, Line, ComposedChart, PieChart, Pie, Cell,
} from "recharts";
import { AGING, BUDGET_ACTUAL, CASHFLOW, MONTHS, PLANNED_ACTUAL, REV_EXP } from "./data";

const AXIS = { stroke: "#8ca0b0", fontSize: 10.5, fontFamily: "IBM Plex Mono", tickLine: false, axisLine: false } as const;
const GRID = { stroke: "#e7ecf1", vertical: false } as const;

function TipBox({ active, payload, label, unit = "Cr" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-side-900 text-[#e6eef4] rounded-lg px-3 py-2 shadow-pop border border-side-700 text-[11.5px]">
      <p className="font-semibold mb-1 num text-[10.5px] text-[#8fa6b8] uppercase tracking-wide">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="flex items-center gap-2 num">
          <span className="h-2 w-2 rounded-sm" style={{ background: p.color || p.payload?.color }} />
          <span className="text-[#b9c9d6]">{p.name}</span>
          <span className="ml-auto font-semibold">{typeof p.value === "number" ? p.value.toLocaleString("en-IN") : p.value}{unit === "Cr" && typeof p.value === "number" && p.value < 1000 ? " Cr" : unit === "%" ? "%" : ""}</span>
        </p>
      ))}
    </div>
  );
}

const LEGEND = {
  iconType: "circle" as const, iconSize: 7, wrapperStyle: { fontSize: 11, fontFamily: "IBM Plex Sans", paddingTop: 6 },
  formatter: (v: string) => <span style={{ color: "#47596a" }}>{v}</span>,
};

export function sliceByRange<T extends { m?: string; d?: string }>(data: T[], range: string): T[] {
  if (range === "This Month") return data.slice(-1);
  if (range === "This Quarter") return data.slice(-3);
  if (range === "Year to Date") return data.slice(-5);
  return data;
}

export function RevenueExpenseChart({ range }: { range: string }) {
  const data = sliceByRange(REV_EXP, range);
  const single = data.length === 1;
  return (
    <ResponsiveContainer width="100%" height={228}>
      <BarChart data={data} barGap={3} margin={{ top: 8, right: 4, left: -14, bottom: 0 }} barSize={single ? 46 : undefined}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="m" {...AXIS} dy={6} />
        <YAxis {...AXIS} />
        <Tooltip content={<TipBox />} cursor={{ fill: "rgba(16,27,36,0.04)" }} />
        <Legend {...LEGEND} />
        <Bar name="Revenue" dataKey="revenue" fill="#0c7264" radius={[3, 3, 0, 0]} />
        <Bar name="Expense" dataKey="expense" fill="#b9c9d6" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CashFlowChart({ range }: { range: string }) {
  const data = sliceByRange(CASHFLOW.map((c, i) => ({ ...c, net: +(c.inflow - c.outflow).toFixed(1), i })), range);
  return (
    <ResponsiveContainer width="100%" height={228}>
      <ComposedChart data={data} margin={{ top: 8, right: 4, left: -14, bottom: 0 }}>
        <defs>
          <linearGradient id="cfIn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#128574" stopOpacity={0.22} />
            <stop offset="100%" stopColor="#128574" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="m" {...AXIS} dy={6} />
        <YAxis {...AXIS} />
        <Tooltip content={<TipBox />} />
        <Legend {...LEGEND} />
        <Area name="Inflow" type="monotone" dataKey="inflow" stroke="#128574" strokeWidth={2} fill="url(#cfIn)" />
        <Line name="Outflow" type="monotone" dataKey="outflow" stroke="#d05252" strokeWidth={1.8} dot={false} strokeDasharray="5 3" />
        <Line name="Net" type="monotone" dataKey="net" stroke="#e0a33b" strokeWidth={2} dot={{ r: 2.5, fill: "#e0a33b", strokeWidth: 0 }} />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function AgingDonut() {
  const total = AGING.reduce((s, a) => s + a.value, 0);
  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: 148, height: 148 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={AGING} dataKey="value" nameKey="bucket" innerRadius={52} outerRadius={70} paddingAngle={2.5} strokeWidth={0}>
              {AGING.map((a) => <Cell key={a.bucket} fill={a.color} />)}
            </Pie>
            <Tooltip content={<TipBox unit="" />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="num text-[17px] font-semibold text-ink-900 leading-none">₹{total.toFixed(1)}</p>
            <p className="text-[10px] uppercase tracking-wide text-ink-400 mt-1">Cr outstanding</p>
          </div>
        </div>
      </div>
      <ul className="flex-1 space-y-2 min-w-0">
        {AGING.map((a) => (
          <li key={a.bucket} className="flex items-center gap-2 text-[12px]">
            <span className="h-2.5 w-2.5 rounded-[3px] shrink-0" style={{ background: a.color }} />
            <span className="text-ink-500 truncate">{a.bucket}</span>
            <span className="num ml-auto font-semibold text-ink-700">₹{a.value.toFixed(1)} Cr</span>
          </li>
        ))}
        <li className="pt-2 mt-1 border-t border-line flex items-center gap-2 text-[12px]">
          <span className="text-ink-500">90+ collection focus</span>
          <span className="num ml-auto font-semibold text-danger-600">₹22.5 Cr</span>
        </li>
      </ul>
    </div>
  );
}

export function PlannedActualChart() {
  return (
    <ResponsiveContainer width="100%" height={204}>
      <LineChart data={PLANNED_ACTUAL} margin={{ top: 8, right: 6, left: -18, bottom: 0 }}>
        <CartesianGrid {...GRID} />
        <XAxis dataKey="m" {...AXIS} dy={6} />
        <YAxis {...AXIS} unit="" domain={[30, 65]} />
        <Tooltip content={<TipBox unit="%" />} />
        <Legend {...LEGEND} />
        <Line name="Planned" type="monotone" dataKey="planned" stroke="#8ca0b0" strokeWidth={1.8} strokeDasharray="5 3" dot={false} />
        <Line name="Actual" type="monotone" dataKey="actual" stroke="#0c7264" strokeWidth={2.2} dot={{ r: 2.6, fill: "#0c7264", strokeWidth: 0 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function BudgetActualChart() {
  return (
    <ResponsiveContainer width="100%" height={204}>
      <BarChart data={BUDGET_ACTUAL} layout="vertical" margin={{ top: 0, right: 10, left: 8, bottom: 0 }} barGap={2} barSize={9}>
        <CartesianGrid stroke="#e7ecf1" horizontal={false} />
        <XAxis type="number" {...AXIS} />
        <YAxis type="category" dataKey="head" {...AXIS} width={104} tick={{ fontSize: 10.5, fill: "#47596a", fontFamily: "IBM Plex Sans" }} />
        <Tooltip content={<TipBox />} cursor={{ fill: "rgba(16,27,36,0.04)" }} />
        <Legend {...LEGEND} />
        <Bar name="Budget" dataKey="budget" fill="#b9c9d6" radius={[0, 3, 3, 0]} />
        <Bar name="Actual" dataKey="actual" fill="#0c7264" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export { MONTHS };
