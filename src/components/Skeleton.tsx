/**
 * Part 03 — Loading Skeleton Components
 * 
 * Skeleton placeholders that match the final layout shape.
 * Never a spinner over the whole page.
 * - KPI card shows a shimmering block the size of its number
 * - Tables show five skeleton rows
 * - Skeletons use --sapContent_Placeholderloading_Background
 */

import React from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

interface SkeletonKPICardProps {
  count?: number;
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
}

interface SkeletonListProps {
  items?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
// BASE SKELETON
// ═══════════════════════════════════════════════════════════════════════════

export function Skeleton({
  width,
  height,
  className = '',
  variant = 'rectangular',
}: SkeletonProps) {
  const baseStyles: React.CSSProperties = {
    backgroundColor: 'var(--sapContent_Placeholderloading_Background)',
    background: `linear-gradient(
      90deg,
      var(--sapContent_Placeholderloading_Background) 0%,
      var(--sapContent_ForegroundColor) 50%,
      var(--sapContent_Placeholderloading_Background) 100%
    )`,
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite',
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'text':
        return {
          borderRadius: 'var(--erp-radius-field)',
          height: height || '1em',
        };
      case 'circular':
        return {
          borderRadius: '50%',
          width: width || height || 40,
          height: height || width || 40,
        };
      case 'rectangular':
      default:
        return {
          borderRadius: 'var(--erp-radius-card)',
          width: width || '100%',
          height: height || 20,
        };
    }
  };

  return (
    <div
      className={className}
      style={{
        ...baseStyles,
        ...getVariantStyles(),
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
      aria-hidden="true"
    />
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// KPI CARD SKELETON
// ═══════════════════════════════════════════════════════════════════════════

export function SkeletonKPICard({ count = 1 }: SkeletonKPICardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-lg"
          style={{
            backgroundColor: 'var(--sapTile_Background)',
            border: '1px solid var(--sapTile_BorderColor)',
          }}
        >
          {/* Label */}
          <Skeleton variant="text" width="60%" height={14} className="mb-2" />

          {/* Value */}
          <Skeleton variant="text" width="40%" height={32} className="mb-3" />

          {/* Trend */}
          <Skeleton variant="text" width="30%" height={12} />
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TABLE SKELETON
// ═══════════════════════════════════════════════════════════════════════════

export function SkeletonTable({ rows = 5, columns = 4 }: SkeletonTableProps) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--sapList_Background)',
        border: '1px solid var(--sapList_BorderColor)',
      }}
    >
      {/* Header */}
      <div
        className="grid gap-4 px-4 py-3"
        style={{
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          backgroundColor: 'var(--sapList_HeaderBackground)',
          borderBottom: '1px solid var(--sapList_BorderColor)',
        }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" height={16} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 px-4 py-3"
          style={{
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            borderBottom:
              rowIndex < rows - 1 ? '1px solid var(--sapList_BorderColor)' : 'none',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              height={14}
              width={`${60 + Math.random() * 40}%`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LIST SKELETON
// ═══════════════════════════════════════════════════════════════════════════

export function SkeletonList({ items = 5 }: SkeletonListProps) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--sapList_Background)',
            border: '1px solid var(--sapList_BorderColor)',
          }}
        >
          {/* Icon */}
          <Skeleton variant="circular" width={40} height={40} />

          {/* Content */}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="50%" height={14} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CARD SKELETON
// ═══════════════════════════════════════════════════════════════════════════

export function SkeletonCard() {
  return (
    <div
      className="p-4 rounded-lg space-y-3"
      style={{
        backgroundColor: 'var(--sapTile_Background)',
        border: '1px solid var(--sapTile_BorderColor)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height={16} />
          <Skeleton variant="text" width="40%" height={14} />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2 pt-2">
        <Skeleton variant="text" width="100%" height={14} />
        <Skeleton variant="text" width="90%" height={14} />
        <Skeleton variant="text" width="80%" height={14} />
      </div>

      {/* Footer */}
      <div className="flex gap-2 pt-2">
        <Skeleton variant="rectangular" width={80} height={32} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </div>
    </div>
  );
}
