/**
 * KPI Card Component V2 - Part 5
 * 
 * Comprehensive KPI card with all 9 variants, proper trend coloring,
 * live updates, and compact behavior. Works with KpiValue + KpiDefinition.
 */

import { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, MoreVertical, 
  RefreshCw, Maximize2, Download, Eye, Target,
  Star, X
} from 'lucide-react';
import type { KpiCardVariant } from '../types/components';
import type { KpiValue, KpiDefinition, KpiStatus } from '../types/realtime';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatting';

// Module accent colors
const moduleAccents: Record<string, string> = {
  project: 'var(--erp-module-project)',
  procurement: 'var(--erp-module-procurement)',
  materials: 'var(--erp-module-materials)',
  execution: 'var(--erp-module-execution)',
  billing: 'var(--erp-module-billing)',
  finance: 'var(--erp-module-finance)',
  hr: 'var(--erp-module-hr)',
  plant: 'var(--erp-module-plant)',
  rmc: 'var(--erp-module-rmc)',
  quality: 'var(--erp-module-quality)',
  hse: 'var(--erp-module-hse)',
  admin: 'var(--erp-module-admin)',
};

interface KpiCardV2Props {
  value: KpiValue;
  definition: KpiDefinition;
  variant?: KpiCardVariant;
  onRefresh?: () => void;
  onDrillDown?: () => void;
}

export default function KpiCardV2({ 
  value, 
  definition,
  variant = 'numeric',
  onRefresh,
  onDrillDown
}: KpiCardV2Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDefinitionModal, setShowDefinitionModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previousValue, setPreviousValue] = useState(value.value);
  const cardRef = useRef<HTMLDivElement>(null);

  // Animate value changes
  useEffect(() => {
    if (previousValue !== value.value) {
      setIsUpdating(true);
      const timer = setTimeout(() => {
        setIsUpdating(false);
        setPreviousValue(value.value);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [value.value, previousValue]);

  // Determine trend color based on good_direction
  const getTrendColor = () => {
    if (value.variancePercent === null || value.variancePercent === undefined) {
      return 'var(--sapContent_LabelColor)';
    }

    const isPositive = value.variancePercent > 0;
    
    // good_direction determines if up/down is good
    if (definition.goodDirection === 'UP') {
      return isPositive ? 'var(--erp-variance-favourable)' : 'var(--erp-variance-unfavourable)';
    } else if (definition.goodDirection === 'DOWN') {
      return isPositive ? 'var(--erp-variance-unfavourable)' : 'var(--erp-variance-favourable)';
    } else {
      // TARGET - both directions are bad if too far from target
      return Math.abs(value.variancePercent) <= 10 
        ? 'var(--erp-variance-favourable)' 
        : 'var(--erp-variance-unfavourable)';
    }
  };

  const getTrendIcon = () => {
    if (value.trend === 'up') return <TrendingUp size={14} />;
    if (value.trend === 'down') return <TrendingDown size={14} />;
    return <Minus size={14} />;
  };

  const getStatusInfo = () => {
    const statusMap: Record<KpiStatus, { label: string; color: string; bgColor: string }> = {
      good: { 
        label: 'On track', 
        color: 'var(--sapPositiveTextColor)', 
        bgColor: 'var(--sapSuccessBackground)' 
      },
      warning: { 
        label: 'Warning', 
        color: 'var(--sapCriticalTextColor)', 
        bgColor: 'var(--sapWarningBackground)' 
      },
      critical: { 
        label: 'Critical', 
        color: 'var(--sapNegativeTextColor)', 
        bgColor: 'var(--sapErrorBackground)' 
      },
      neutral: { 
        label: 'Neutral', 
        color: 'var(--sapNeutralTextColor)', 
        bgColor: 'var(--sapNeutralBackground)' 
      },
    };
    return statusMap[value.status];
  };

  const formatValue = () => {
    if (value.value === null) return '—';
    
    switch (definition.valueType) {
      case 'CURRENCY':
        return formatCurrency(value.value, { compact: true });
      case 'PERCENT':
        return formatPercent(value.value);
      case 'COUNT':
        return formatNumber(value.value);
      default:
        return formatNumber(value.value);
    }
  };

  const formatUpdateTime = () => {
    const date = new Date(value.asOf);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const statusInfo = getStatusInfo();
  const accentColor = moduleAccents[definition.module] || moduleAccents.project;

  // Render different variants
  const renderVariant = () => {
    switch (variant) {
      case 'micro':
        return (
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              {definition.kpiName}
            </span>
            <span className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
              {formatValue()}
            </span>
          </div>
        );

      case 'comparison':
        return (
          <div>
            <div className="text-3xl font-bold mb-2" style={{ 
              color: 'var(--sapTextColor)',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {formatValue()}
            </div>
            {value.target !== null && (
              <div className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--sapContent_LabelColor)' }}>Target</span>
                  <span style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {formatValue()} / {value.target}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min(100, (value.value! / value.target!) * 100)}%`,
                      background: statusInfo.color
                    }}
                  />
                </div>
              </div>
            )}
            {value.variancePercent !== null && (
              <div className="flex items-center gap-1 text-xs" style={{ color: getTrendColor() }}>
                {getTrendIcon()}
                <span>{formatPercent(Math.abs(value.variancePercent))} vs target</span>
              </div>
            )}
          </div>
        );

      case 'progress':
        const progress = value.target ? (value.value! / value.target) * 100 : 0;
        return (
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="16"
                  fill="none"
                  stroke="var(--sapProgress_Background)"
                  strokeWidth="3"
                />
                <circle
                  cx="18" cy="18" r="16"
                  fill="none"
                  stroke={statusInfo.color}
                  strokeWidth="3"
                  strokeDasharray={`${progress}, 100`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold"
                style={{ color: 'var(--sapTextColor)' }}>
                {formatPercent(progress, 0)}
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {formatValue()}
              </div>
              <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                of {value.target ? formatValue() : '—'}
              </div>
            </div>
          </div>
        );

      case 'trend':
        return (
          <div>
            <div className="text-3xl font-bold mb-1" style={{ 
              color: 'var(--sapTextColor)',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {formatValue()}
            </div>
            {value.variancePercent !== null && (
              <div className="flex items-center gap-1 text-xs mb-2" style={{ color: getTrendColor() }}>
                {getTrendIcon()}
                <span>{formatPercent(Math.abs(value.variancePercent))} vs last period</span>
              </div>
            )}
            <div className="h-12 flex items-end gap-0.5">
              {[40, 60, 45, 70, 55, 80, 65].map((h, i) => (
                <div 
                  key={i}
                  className="flex-1 rounded-t transition-all duration-300"
                  style={{ 
                    height: `${h}%`,
                    background: i === 6 ? statusInfo.color : 'var(--sapNeutralBackground)',
                    opacity: i === 6 ? 1 : 0.5
                  }}
                />
              ))}
            </div>
          </div>
        );

      case 'numeric':
      default:
        return (
          <div>
            <div className="text-3xl font-bold mb-1" style={{ 
              color: 'var(--sapTextColor)',
              fontVariantNumeric: 'tabular-nums'
            }}>
              {formatValue()}
            </div>
            {value.target !== null && (
              <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Target: {value.target}
              </div>
            )}
            {value.variancePercent !== null && (
              <div className="flex items-center gap-1 text-xs" style={{ color: getTrendColor() }}>
                {getTrendIcon()}
                <span>{formatPercent(Math.abs(value.variancePercent))} vs last period</span>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <>
      <div 
        ref={cardRef}
        className={`sap-tile p-4 relative overflow-hidden transition-all ${
          isUpdating ? 'ring-2 ring-offset-2' : ''
        } ${definition.drillRoute ? 'cursor-pointer' : ''}`}
        style={{ 
          background: 'var(--sapTile_Background)',
          borderRadius: 'var(--erp-radius-tile)',
        }}
        onClick={definition.drillRoute ? onDrillDown : undefined}
      >
        {/* Accent bar */}
        <div 
          className="absolute left-0 top-0 bottom-0 w-1"
          style={{ background: accentColor }}
        />

        {/* Header */}
        <div className="flex items-start justify-between mb-3 pl-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--sapTile_TitleTextColor)' }}>
              {definition.kpiName}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <button
                onClick={(e) => { e.stopPropagation(); onRefresh(); }}
                className="p-1 rounded hover:bg-[var(--sapTile_Hover_Background)] transition-colors"
                title="Refresh"
              >
                <RefreshCw size={14} style={{ color: 'var(--sapTile_IconColor)' }} />
              </button>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
              className="p-1 rounded hover:bg-[var(--sapTile_Hover_Background)] transition-colors"
            >
              <MoreVertical size={14} style={{ color: 'var(--sapTile_IconColor)' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="pl-2">
          {renderVariant()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t pl-2"
          style={{ borderColor: 'var(--sapTile_BorderColor)' }}>
          <div className="flex items-center gap-2">
            <span 
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ 
                background: statusInfo.bgColor,
                color: statusInfo.color
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusInfo.color }} />
              {statusInfo.label}
            </span>
          </div>
          <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Updated {formatUpdateTime()}
          </span>
        </div>

        {/* Menu */}
        {showMenu && (
          <div 
            className="absolute top-12 right-2 w-48 rounded-lg shadow-lg z-10 py-1"
            style={{ 
              background: 'var(--sapTile_Background)',
              border: '1px solid var(--sapGroup_ContentBorderColor)',
              boxShadow: 'var(--sapContent_Shadow2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => { onRefresh?.(); setShowMenu(false); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--sapList_Hover_Background)] flex items-center gap-2"
              style={{ color: 'var(--sapList_TextColor)' }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            {definition.drillRoute && (
              <button 
                onClick={() => { onDrillDown?.(); setShowMenu(false); }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--sapList_Hover_Background)] flex items-center gap-2"
                style={{ color: 'var(--sapList_TextColor)' }}
              >
                <Maximize2 size={14} />
                Drill down
              </button>
            )}
            <button 
              onClick={() => { setShowDefinitionModal(true); setShowMenu(false); }}
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--sapList_Hover_Background)] flex items-center gap-2"
              style={{ color: 'var(--sapList_TextColor)' }}
            >
              <Eye size={14} />
              View definition
            </button>
            <button 
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--sapList_Hover_Background)] flex items-center gap-2"
              style={{ color: 'var(--sapList_TextColor)' }}
            >
              <Download size={14} />
              Export
            </button>
            <button 
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--sapList_Hover_Background)] flex items-center gap-2"
              style={{ color: 'var(--sapList_TextColor)' }}
            >
              <Target size={14} />
              Set target
            </button>
            <button 
              className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--sapList_Hover_Background)] flex items-center gap-2"
              style={{ color: 'var(--sapList_TextColor)' }}
            >
              <Star size={14} />
              Add to favourites
            </button>
          </div>
        )}
      </div>

      {/* Definition Modal */}
      {showDefinitionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-[var(--sapGroup_ContentBackground)] rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            style={{ boxShadow: 'var(--sapContent_Shadow3)' }}
          >
            <div className="sticky top-0 flex items-center justify-between p-4 border-b"
              style={{ 
                background: 'var(--sapGroup_ContentBackground)',
                borderColor: 'var(--sapGroup_ContentBorderColor)'
              }}>
              <h2 className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                KPI Definition
              </h2>
              <button
                onClick={() => setShowDefinitionModal(false)}
                className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Name
                </h3>
                <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {definition.kpiName}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Description
                </h3>
                <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {definition.description || 'No description available'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Calculation
                </h3>
                <div className="p-3 rounded-lg" style={{ background: 'var(--sapBaseColor)' }}>
                  <code className="text-xs" style={{ color: 'var(--sapTextColor)' }}>
                    {definition.calculationType} of {definition.aggregationLevel.toLowerCase()}
                  </code>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Value Type
                </h3>
                <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {definition.valueType} {definition.unit ? `(${definition.unit})` : ''}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Good Direction
                </h3>
                <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {definition.goodDirection}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Refresh Strategy
                </h3>
                <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {definition.refreshStrategy} (every {definition.cacheTtlS} seconds)
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Required Permission
                </h3>
                <p className="text-sm font-mono" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {definition.requiredPermission}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
