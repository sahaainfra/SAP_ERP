/**
 * Supporting Components - Part 5
 * 
 * Collection of small, reusable components used across the ERP system.
 */

import { 
  CheckCircle2, XCircle, AlertCircle, Info, Clock, 
  TrendingUp, TrendingDown, Minus, User
} from 'lucide-react';
import type { 
  StatusChipProps, PriorityIndicatorProps, ProgressBarProps, 
  AvatarProps, TimelineProps, StatusType, PriorityLevel 
} from '../types/components';

// ─── Status Chip ─────────────────────────────────────────────────────────────

export function StatusChip({ status, type, icon }: StatusChipProps) {
  const typeStyles: Record<StatusType, { bg: string; text: string; border: string }> = {
    success: {
      bg: 'var(--sapSuccessBackground)',
      text: 'var(--sapPositiveTextColor)',
      border: 'var(--sapSuccessBorderColor)'
    },
    warning: {
      bg: 'var(--sapWarningBackground)',
      text: 'var(--sapCriticalTextColor)',
      border: 'var(--sapWarningBorderColor)'
    },
    error: {
      bg: 'var(--sapErrorBackground)',
      text: 'var(--sapNegativeTextColor)',
      border: 'var(--sapErrorBorderColor)'
    },
    info: {
      bg: 'var(--sapInformationBackground)',
      text: 'var(--sapInformativeTextColor)',
      border: 'var(--sapInformationBorderColor)'
    },
    neutral: {
      bg: 'var(--sapNeutralBackground)',
      text: 'var(--sapNeutralTextColor)',
      border: 'var(--sapNeutralBorderColor)'
    }
  };

  const style = typeStyles[type];

  const defaultIcons: Record<StatusType, React.ReactNode> = {
    success: <CheckCircle2 size={12} />,
    warning: <AlertCircle size={12} />,
    error: <XCircle size={12} />,
    info: <Info size={12} />,
    neutral: <Clock size={12} />
  };

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
      style={{
        background: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`
      }}
    >
      {icon || defaultIcons[type]}
      {status}
    </span>
  );
}

// ─── Priority Indicator ──────────────────────────────────────────────────────

export function PriorityIndicator({ level, showLabel = true }: PriorityIndicatorProps) {
  const priorityStyles: Record<PriorityLevel, { color: string; icon: React.ReactNode; label: string }> = {
    critical: {
      color: 'var(--erp-priority-critical)',
      icon: <AlertCircle size={14} />,
      label: 'Critical'
    },
    high: {
      color: 'var(--erp-priority-high)',
      icon: <TrendingUp size={14} />,
      label: 'High'
    },
    medium: {
      color: 'var(--erp-priority-medium)',
      icon: <Minus size={14} />,
      label: 'Medium'
    },
    low: {
      color: 'var(--erp-priority-low)',
      icon: <TrendingDown size={14} />,
      label: 'Low'
    },
    none: {
      color: 'var(--erp-priority-none)',
      icon: <Minus size={14} />,
      label: 'None'
    }
  };

  const style = priorityStyles[level];

  return (
    <span
      className="inline-flex items-center gap-1"
      style={{ color: style.color }}
    >
      {style.icon}
      {showLabel && <span className="text-xs font-medium">{style.label}</span>}
    </span>
  );
}

// ─── Progress Bar ────────────────────────────────────────────────────────────

export function ProgressBar({ 
  value, 
  max = 100, 
  label, 
  showPercentage = true, 
  variant = 'linear',
  status = 'neutral'
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const statusColors: Record<string, string> = {
    good: 'var(--sapProgress_Value_PositiveBackground)',
    warning: 'var(--sapProgress_Value_CriticalBackground)',
    critical: 'var(--sapProgress_Value_NegativeBackground)',
    neutral: 'var(--sapProgress_Value_Background)'
  };

  const color = statusColors[status] || statusColors.neutral;

  if (variant === 'radial') {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="flex items-center gap-3">
        <div className="relative">
          <svg width="100" height="100" className="-rotate-90">
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="var(--sapProgress_Background)"
              strokeWidth="8"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          {showPercentage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {Math.round(percentage)}%
              </span>
            </div>
          )}
        </div>
        {label && (
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
              {label}
            </div>
            <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              {value} / {max}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Linear variant
  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
            {label}
          </span>
          {showPercentage && (
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div 
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--sapProgress_Background)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ 
            width: `${percentage}%`,
            background: color
          }}
        />
      </div>
      {!label && showPercentage && (
        <div className="mt-1 text-xs text-right" style={{ color: 'var(--sapContent_LabelColor)' }}>
          {value} / {max}
        </div>
      )}
    </div>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────

export function Avatar({ name, size = 'medium', presence }: AvatarProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-10 h-10 text-sm',
    large: 'w-14 h-14 text-lg'
  };

  const presenceColors = {
    online: 'var(--sapPositiveColor)',
    offline: 'var(--sapNeutralColor)',
    busy: 'var(--sapNegativeColor)',
    away: 'var(--sapCriticalColor)'
  };

  // Generate consistent color based on name
  const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10;
  const accentColors = [
    'var(--sapAccentColor1)',
    'var(--sapAccentColor2)',
    'var(--sapAccentColor3)',
    'var(--sapAccentColor4)',
    'var(--sapAccentColor5)',
    'var(--sapAccentColor6)',
    'var(--sapAccentColor7)',
    'var(--sapAccentColor8)',
    'var(--sapAccentColor9)',
    'var(--sapAccentColor10)'
  ];

  return (
    <div className="relative inline-block">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white`}
        style={{ background: accentColors[colorIndex] }}
      >
        {initials}
      </div>
      {presence && (
        <div
          className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
          style={{ 
            background: presenceColors[presence],
            borderColor: 'var(--sapTile_Background)'
          }}
        />
      )}
    </div>
  );
}

// ─── Timeline ────────────────────────────────────────────────────────────────

export function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div
        className="absolute left-4 top-0 bottom-0 w-0.5"
        style={{ background: 'var(--sapGroup_ContentBorderColor)' }}
      />

      {/* Timeline items */}
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="relative flex items-start gap-3 pl-10">
            {/* Icon */}
            <div
              className="absolute left-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ 
                background: 'var(--sapTile_Background)',
                border: '2px solid var(--sapGroup_ContentBorderColor)'
              }}
            >
              {item.icon || <User size={14} style={{ color: 'var(--sapContent_IconColor)' }} />}
            </div>

            {/* Content */}
            <div className="flex-1 sap-card p-3">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                    {item.actor}
                  </span>
                  <span className="text-sm ml-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {item.action}
                  </span>
                </div>
                <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {new Date(item.timestamp).toLocaleString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              {item.comment && (
                <p className="text-sm mt-2" style={{ color: 'var(--sapTextColor)' }}>
                  {item.comment}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Comparison Bar ──────────────────────────────────────────────────────────

interface ComparisonBarProps {
  actual: number;
  target: number;
  previous?: number;
  label?: string;
  unit?: string;
}

export function ComparisonBar({ actual, target, previous, label, unit = '' }: ComparisonBarProps) {
  const max = Math.max(actual, target, previous || 0);
  const actualPercent = (actual / max) * 100;
  const targetPercent = (target / max) * 100;
  const previousPercent = previous ? (previous / max) * 100 : 0;

  const variance = actual - target;
  const variancePercent = target !== 0 ? (variance / target) * 100 : 0;
  const isPositive = variance >= 0;

  return (
    <div className="sap-card p-4">
      {label && (
        <div className="text-sm font-medium mb-3" style={{ color: 'var(--sapTextColor)' }}>
          {label}
        </div>
      )}
      
      <div className="space-y-2">
        {/* Bars */}
        <div className="relative h-8 rounded overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
          {previous && (
            <div
              className="absolute left-0 top-0 h-full opacity-30"
              style={{ 
                width: `${previousPercent}%`,
                background: 'var(--sapNeutralColor)'
              }}
            />
          )}
          <div
            className="absolute left-0 top-0 h-full"
            style={{ 
              width: `${targetPercent}%`,
              background: 'var(--sapContent_NonInteractiveIconColor)',
              opacity: 0.5
            }}
          />
          <div
            className="absolute left-0 top-0 h-full"
            style={{ 
              width: `${actualPercent}%`,
              background: isPositive ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)'
            }}
          />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: isPositive ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)' }} />
              <span style={{ color: 'var(--sapContent_LabelColor)' }}>
                Actual: {actual.toLocaleString()}{unit}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ background: 'var(--sapContent_NonInteractiveIconColor)', opacity: 0.5 }} />
              <span style={{ color: 'var(--sapContent_LabelColor)' }}>
                Target: {target.toLocaleString()}{unit}
              </span>
            </div>
            {previous && (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: 'var(--sapNeutralColor)', opacity: 0.3 }} />
                <span style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Previous: {previous.toLocaleString()}{unit}
                </span>
              </div>
            )}
          </div>
          <div
            className="font-semibold"
            style={{ color: isPositive ? 'var(--sapPositiveTextColor)' : 'var(--sapNegativeTextColor)' }}
          >
            {isPositive ? '+' : ''}{variance.toLocaleString()}{unit} ({variancePercent.toFixed(1)}%)
          </div>
        </div>
      </div>
    </div>
  );
}
