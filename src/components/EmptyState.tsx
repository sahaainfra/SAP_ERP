/**
 * Part 03 — Empty State Components
 * 
 * Five empty states as defined in the design system:
 * 1. No data yet - neutral, with primary action
 * 2. Filtered to nothing - with clear filters action
 * 3. No permission - reveals nothing about content
 * 4. Module not configured - admin only
 * 5. Not applicable - context-dependent
 */

import React from 'react';
import {
  InboxIcon,
  FilterIcon,
  LockIcon,
  SettingsIcon,
  HelpCircleIcon,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type EmptyStateType =
  | 'no-data'
  | 'filtered'
  | 'no-permission'
  | 'not-configured'
  | 'not-applicable';

interface EmptyStateProps {
  type: EmptyStateType;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClearFilters?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export function EmptyState({
  type,
  title,
  description,
  action,
  onClearFilters,
}: EmptyStateProps) {
  const config = getEmptyStateConfig(type, title, description);

  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      role="status"
      aria-label={config.title}
    >
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{ backgroundColor: config.iconBg }}
      >
        <config.icon size={32} style={{ color: config.iconColor }} aria-hidden="true" />
      </div>

      {/* Title */}
      <h3
        className="text-lg font-semibold mb-2"
        style={{ color: 'var(--sapTextColor)' }}
      >
        {config.title}
      </h3>

      {/* Description */}
      {config.description && (
        <p
          className="text-sm mb-6 max-w-md"
          style={{ color: 'var(--sapContent_LabelColor)' }}
        >
          {config.description}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {type === 'filtered' && onClearFilters && (
          <button
            onClick={onClearFilters}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--sapButton_Background)',
              color: 'var(--sapButton_TextColor)',
              border: '1px solid var(--sapButton_BorderColor)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sapButton_Hover_Background)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sapButton_Background)';
            }}
          >
            Clear filters
          </button>
        )}

        {action && type !== 'filtered' && type !== 'no-permission' && (
          <button
            onClick={action.onClick}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              backgroundColor: 'var(--sapButton_Emphasized_Background)',
              color: 'var(--sapButton_Emphasized_TextColor)',
              border: '1px solid var(--sapButton_Emphasized_BorderColor)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sapButton_Emphasized_Hover_Background)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--sapButton_Emphasized_Background)';
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

function getEmptyStateConfig(
  type: EmptyStateType,
  customTitle?: string,
  customDescription?: string
) {
  const configs = {
    'no-data': {
      icon: InboxIcon,
      iconBg: 'var(--sapNeutralBackground)',
      iconColor: 'var(--sapNeutralElementColor)',
      title: customTitle || 'No data yet',
      description:
        customDescription ||
        'There are no records to display. Create your first entry to get started.',
    },
    filtered: {
      icon: FilterIcon,
      iconBg: 'var(--sapInformationBackground)',
      iconColor: 'var(--sapInformativeElementColor)',
      title: customTitle || 'No records match',
      description:
        customDescription || 'No records match the selected filters. Try adjusting your criteria.',
    },
    'no-permission': {
      icon: LockIcon,
      iconBg: 'var(--sapErrorBackground)',
      iconColor: 'var(--sapNegativeElementColor)',
      title: customTitle || 'Access restricted',
      description:
        customDescription || 'You do not have permission to view this information.',
    },
    'not-configured': {
      icon: SettingsIcon,
      iconBg: 'var(--sapWarningBackground)',
      iconColor: 'var(--sapCriticalElementColor)',
      title: customTitle || 'Module not configured',
      description:
        customDescription ||
        'This module has not been configured in your system. Contact your administrator.',
    },
    'not-applicable': {
      icon: HelpCircleIcon,
      iconBg: 'var(--sapNeutralBackground)',
      iconColor: 'var(--sapNeutralElementColor)',
      title: customTitle || 'Not applicable',
      description:
        customDescription || 'This information is not applicable in the current context.',
    },
  };

  return configs[type];
}
