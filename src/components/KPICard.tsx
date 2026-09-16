import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import type { KPIData } from '../data/mockData';

interface KPICardProps {
  data: KPIData;
  icon: React.ReactNode;
  onClick?: () => void;
}

export default function KPICard({ data, icon, onClick }: KPICardProps) {
  const statusColors = {
    positive: 'var(--sapPositive)',
    negative: 'var(--sapNegative)',
    neutral: 'var(--sapContentLabelColor)',
    critical: 'var(--sapCritical)',
  };

  const trendIcon = data.trend === 'up' ? <TrendingUp size={14} /> :
                    data.trend === 'down' ? <TrendingDown size={14} /> :
                    <Minus size={14} />;

  const trendColor = data.trend === 'up' && data.status === 'positive' ? 'var(--sapPositive)' :
                     data.trend === 'up' && data.status === 'negative' ? 'var(--sapNegative)' :
                     data.trend === 'down' && data.status === 'positive' ? 'var(--sapNegative)' :
                     data.trend === 'down' && data.status === 'negative' ? 'var(--sapPositive)' :
                     'var(--sapContentLabelColor)';

  return (
    <div
      className="sap-tile p-4 flex flex-col gap-3"
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
          {icon}
        </div>
        <div
          className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
          style={{ color: trendColor, background: `${trendColor}15` }}
        >
          {trendIcon}
          <span>{data.trendValue > 0 ? '+' : ''}{data.trendValue}%</span>
        </div>
      </div>

      {/* Value */}
      <div>
        <div className="text-2xl font-bold tracking-tight" style={{ color: 'var(--sapFontColor)' }}>
          {data.value.toLocaleString()}
          <span className="text-sm font-normal ml-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
            {data.unit}
          </span>
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--sapContentLabelColor)' }}>
          {data.label}
        </div>
      </div>

      {/* Mini indicator */}
      <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--sapBaseColor)' }}>
        <div
          className="h-full rounded-full animate-progress"
          style={{
            width: `${Math.min(data.value, 100)}%`,
            background: statusColors[data.status]
          }}
        />
      </div>
    </div>
  );
}

interface MiniKPICardProps {
  label: string;
  value: string | number;
  change?: string;
  positive?: boolean;
}

export function MiniKPICard({ label, value, change, positive }: MiniKPICardProps) {
  return (
    <div className="sap-tile p-3 flex items-center justify-between">
      <div>
        <div className="text-lg font-bold" style={{ color: 'var(--sapFontColor)' }}>{value}</div>
        <div className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>{label}</div>
      </div>
      {change && (
        <div className={`flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-green-600' : 'text-red-500'}`}>
          {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {change}
        </div>
      )}
    </div>
  );
}
