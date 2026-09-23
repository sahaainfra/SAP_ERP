/**
 * Part 19 — Create Sheet Component
 * 
 * Mobile-only bottom sheet that opens when user taps "Create" in bottom tab bar.
 * Shows only documents the user may create in the current project context,
 * resolved server-side from Part 05 permissions.
 * 
 * Features:
 * - Grouped by module
 * - Ordered by user's frequency of use (last 30 days)
 * - Includes "Scan" entry where QR/barcode entry points exist
 * - Drag-to-dismiss
 * - Three detents: peek / half / full
 */

import React, { useState, useEffect } from 'react';
import { useBreakpoint } from '../../config/breakpoints';

export interface CreateOption {
  id: string;
  label: string;
  icon: string;
  module: string;
  route: string;
  permission: string;
  frequency: number; // Usage count in last 30 days
  supportsScan?: boolean;
}

interface CreateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  options: CreateOption[];
  onSelect: (option: CreateOption) => void;
  onScan?: () => void;
}

export const CreateSheet: React.FC<CreateSheetProps> = ({
  isOpen,
  onClose,
  options,
  onSelect,
  onScan,
}) => {
  const { isPhone } = useBreakpoint();
  const [detent, setDetent] = useState<'peek' | 'half' | 'full'>('half');
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);

  // Only render on phone
  if (!isPhone) {
    return null;
  }

  // Group options by module
  const groupedOptions = options.reduce((acc, option) => {
    if (!acc[option.module]) {
      acc[option.module] = [];
    }
    acc[option.module].push(option);
    return acc;
  }, {} as Record<string, CreateOption[]>);

  // Sort each group by frequency (descending)
  Object.values(groupedOptions).forEach((group) => {
    group.sort((a, b) => b.frequency - a.frequency);
  });

  // Handle touch events for drag-to-dismiss
  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    const diff = startY - currentY;
    
    if (diff > 100) {
      // Swiped up
      if (detent === 'peek') setDetent('half');
      else if (detent === 'half') setDetent('full');
    } else if (diff < -100) {
      // Swiped down
      if (detent === 'full') setDetent('half');
      else if (detent === 'half') setDetent('peek');
      else onClose();
    }
    
    setStartY(0);
    setCurrentY(0);
  };

  // Calculate sheet height based on detent
  const getSheetHeight = () => {
    switch (detent) {
      case 'peek':
        return '30vh';
      case 'half':
        return '60vh';
      case 'full':
        return '90vh';
      default:
        return '60vh';
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="create-sheet-backdrop"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
        }}
      />

      {/* Sheet */}
      <div
        className="create-sheet"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--sapGroup_ContentBackground, #fff)',
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          height: getSheetHeight(),
          transition: 'height 0.3s ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Drag handle */}
        <div
          className="sheet-handle"
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '12px',
            cursor: 'grab',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '4px',
              backgroundColor: 'var(--sapContent_NonInteractiveIconColor, #6a6d70)',
              borderRadius: '2px',
            }}
          />
        </div>

        {/* Header */}
        <div
          className="sheet-header"
          style={{
            padding: '0 16px 16px',
            borderBottom: '1px solid var(--sapGroup_ContentBorderColor, #e5e5e5)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: 600,
              color: 'var(--sapGroup_TitleTextColor, #32363a)',
            }}
          >
            Create New
          </h2>
        </div>

        {/* Content */}
        <div
          className="sheet-content"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
          }}
        >
          {/* Scan option (if available) */}
          {onScan && (
            <button
              className="scan-option"
              onClick={onScan}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                marginBottom: '16px',
                backgroundColor: 'var(--sapButton_Emphasized_Background, #0a6ed1)',
                color: 'var(--sapButton_Emphasized_TextColor, #fff)',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 500,
              }}
            >
              <span style={{ fontSize: '24px', marginRight: '12px' }}>📷</span>
              <span>Scan QR / Barcode</span>
            </button>
          )}

          {/* Grouped options */}
          {Object.entries(groupedOptions).map(([module, moduleOptions]) => (
            <div key={module} className="option-group" style={{ marginBottom: '24px' }}>
              <h3
                style={{
                  margin: '0 0 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--sapContent_LabelColor, #6a6d70)',
                  letterSpacing: '0.5px',
                }}
              >
                {module}
              </h3>
              <div className="option-list">
                {moduleOptions.map((option) => (
                  <button
                    key={option.id}
                    className="create-option"
                    onClick={() => onSelect(option)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px',
                      marginBottom: '8px',
                      backgroundColor: 'var(--sapButton_Background, #fff)',
                      border: '1px solid var(--sapButton_BorderColor, #e5e5e5)',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        'var(--sapButton_Hover_Background, #f5f6f7)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor =
                        'var(--sapButton_Background, #fff)';
                    }}
                  >
                    <span
                      style={{
                        fontSize: '24px',
                        marginRight: '12px',
                        width: '32px',
                        textAlign: 'center',
                      }}
                    >
                      {option.icon}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: '16px',
                        color: 'var(--sapButton_TextColor, #32363a)',
                      }}
                    >
                      {option.label}
                    </span>
                    {option.supportsScan && (
                      <span
                        style={{
                          fontSize: '12px',
                          color: 'var(--sapContent_LabelColor, #6a6d70)',
                          marginLeft: '8px',
                        }}
                      >
                        📷
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {options.length === 0 && (
            <div
              className="empty-state"
              style={{
                textAlign: 'center',
                padding: '48px 16px',
                color: 'var(--sapContent_LabelColor, #6a6d70)',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <p style={{ fontSize: '16px', margin: 0 }}>
                No documents available for creation in the current project context.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/**
 * Fetch create options from server based on user permissions and project context
 */
export async function fetchCreateOptions(
  projectId: number,
  userId: number
): Promise<CreateOption[]> {
  // In production, this would call: GET /api/dx/v1/create-options?projectId={projectId}
  // The server would return only documents the user may create based on permissions
  
  // For now, return mock data
  return [
    {
      id: 'po',
      label: 'Purchase Order',
      icon: '📦',
      module: 'Procurement',
      route: '/procurement/po/new',
      permission: 'procure.po.create',
      frequency: 45,
      supportsScan: true,
    },
    {
      id: 'grn',
      label: 'Goods Receipt Note',
      icon: '📥',
      module: 'Store',
      route: '/store/grn/new',
      permission: 'store.grn.create',
      frequency: 38,
      supportsScan: true,
    },
    {
      id: 'mr',
      label: 'Material Requisition',
      icon: '📋',
      module: 'Procurement',
      route: '/procurement/mr/new',
      permission: 'procure.mr.create',
      frequency: 32,
    },
    {
      id: 'dpr',
      label: 'Daily Progress Report',
      icon: '📊',
      module: 'Execution',
      route: '/execution/dpr/new',
      permission: 'execution.dpr.create',
      frequency: 28,
    },
    {
      id: 'mb',
      label: 'Measurement Book Entry',
      icon: '📏',
      module: 'Execution',
      route: '/execution/mb/new',
      permission: 'execution.mb.create',
      frequency: 25,
    },
    {
      id: 'wir',
      label: 'Work Inspection Request',
      icon: '✓',
      module: 'Quality',
      route: '/quality/wir/new',
      permission: 'quality.wir.create',
      frequency: 20,
    },
    {
      id: 'observation',
      label: 'Safety Observation',
      icon: '⚠️',
      module: 'Safety',
      route: '/safety/observation/new',
      permission: 'safety.observation.create',
      frequency: 15,
    },
    {
      id: 'attendance',
      label: 'Attendance',
      icon: '👥',
      module: 'HR',
      route: '/hr/attendance/new',
      permission: 'hr.attendance.create',
      frequency: 12,
    },
  ];
}

export default CreateSheet;
