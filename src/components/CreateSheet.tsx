/**
 * Part 11 — Create Sheet
 * Mobile-first create action sheet showing permitted documents
 */

import React, { useState } from 'react';
import { X, FileText, ShoppingCart, Package, ClipboardList, Camera, QrCode } from 'lucide-react';
import { usePermissions } from '../hooks/usePermissions';

interface CreateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
}

interface CreateAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  module: string;
  route: string;
  permission: string;
  frequency?: number; // Usage frequency in last 30 days
  hasScanner?: boolean;
}

const CREATE_ACTIONS: CreateAction[] = [
  {
    id: 'mr',
    label: 'Material Requisition',
    icon: <ClipboardList size={24} />,
    module: 'Procurement',
    route: '/procurement/mr/new',
    permission: 'procurement.material_requisition.create',
    frequency: 45,
  },
  {
    id: 'pr',
    label: 'Purchase Requisition',
    icon: <FileText size={24} />,
    module: 'Procurement',
    route: '/procurement/pr/new',
    permission: 'procurement.purchase_requisition.create',
    frequency: 38,
  },
  {
    id: 'po',
    label: 'Purchase Order',
    icon: <ShoppingCart size={24} />,
    module: 'Procurement',
    route: '/procurement/po/new',
    permission: 'procurement.purchase_order.create',
    frequency: 32,
  },
  {
    id: 'grn',
    label: 'Goods Receipt Note',
    icon: <Package size={24} />,
    module: 'Materials',
    route: '/materials/grn/new',
    permission: 'materials.grn.create',
    frequency: 28,
    hasScanner: true,
  },
  {
    id: 'issue',
    label: 'Material Issue',
    icon: <Package size={24} />,
    module: 'Materials',
    route: '/materials/issue/new',
    permission: 'materials.issue.create',
    frequency: 25,
    hasScanner: true,
  },
  {
    id: 'dpr',
    label: 'Daily Progress Report',
    icon: <FileText size={24} />,
    module: 'Execution',
    route: '/execution/dpr/new',
    permission: 'execution.dpr.create',
    frequency: 60,
  },
  {
    id: 'mb',
    label: 'Measurement Book Entry',
    icon: <FileText size={24} />,
    module: 'Execution',
    route: '/execution/mb/new',
    permission: 'execution.mb.create',
    frequency: 20,
  },
  {
    id: 'wir',
    label: 'Work Inspection Request',
    icon: <FileText size={24} />,
    module: 'Quality',
    route: '/quality/wir/new',
    permission: 'quality.wir.create',
    frequency: 15,
  },
  {
    id: 'ncr',
    label: 'Non-Conformance Report',
    icon: <FileText size={24} />,
    module: 'Quality',
    route: '/quality/ncr/new',
    permission: 'quality.ncr.create',
    frequency: 5,
  },
  {
    id: 'incident',
    label: 'Safety Incident',
    icon: <FileText size={24} />,
    module: 'Safety',
    route: '/safety/incident/new',
    permission: 'safety.incident.create',
    frequency: 3,
  },
  {
    id: 'observation',
    label: 'Safety Observation',
    icon: <FileText size={24} />,
    module: 'Safety',
    route: '/safety/observation/new',
    permission: 'safety.observation.create',
    frequency: 12,
  },
  {
    id: 'attendance',
    label: 'Attendance Entry',
    icon: <FileText size={24} />,
    module: 'HR',
    route: '/hr/attendance/new',
    permission: 'hr.attendance.create',
    frequency: 90,
  },
];

export function CreateSheet({ isOpen, onClose, projectId }: CreateSheetProps) {
  // For now, use a mock userId. In production, this would come from the auth context.
  const { hasPermission } = usePermissions(1, projectId);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Filter actions by permission and search query
  const permittedActions = CREATE_ACTIONS.filter(action => {
    const hasPerm = hasPermission(action.permission);
    const matchesSearch = !searchQuery || 
      action.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      action.module.toLowerCase().includes(searchQuery.toLowerCase());
    return hasPerm && matchesSearch;
  });

  // Group by module
  const groupedActions = permittedActions.reduce((acc, action) => {
    if (!acc[action.module]) {
      acc[action.module] = [];
    }
    acc[action.module].push(action);
    return acc;
  }, {} as Record<string, CreateAction[]>);

  // Sort each group by frequency
  Object.values(groupedActions).forEach(actions => {
    actions.sort((a, b) => (b.frequency || 0) - (a.frequency || 0));
  });

  // Sort modules by total frequency
  const sortedModules = Object.entries(groupedActions).sort((a, b) => {
    const freqA = a[1].reduce((sum, action) => sum + (action.frequency || 0), 0);
    const freqB = b[1].reduce((sum, action) => sum + (action.frequency || 0), 0);
    return freqB - freqA;
  });

  const handleActionClick = (action: CreateAction) => {
    // Navigate to create route
    window.location.href = action.route;
    onClose();
  };

  const handleScanClick = (action: CreateAction) => {
    // Open scanner for actions that support it
    // This would integrate with device capabilities (Part 11)
    console.log('Opening scanner for:', action.id);
    // For now, just navigate to the create route
    window.location.href = action.route;
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] flex flex-col"
        style={{
          animation: 'slideUp 0.3s ease-out',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Create new document"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Create New
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Search create actions"
          />
        </div>

        {/* Actions List */}
        <div className="flex-1 overflow-y-auto p-4">
          {sortedModules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No create actions available</p>
              <p className="text-sm mt-2">Check your permissions or try a different project</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedModules.map(([module, actions]) => (
                <div key={module}>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {module}
                  </h3>
                  <div className="space-y-2">
                    {actions.map(action => (
                      <button
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors text-left"
                      >
                        <div
                          className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{
                            background: 'var(--sapAccentColor6)',
                            color: '#ffffff',
                          }}
                        >
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900">
                            {action.label}
                          </div>
                          <div className="text-sm text-gray-500">
                            {action.module}
                          </div>
                        </div>
                        {action.hasScanner && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleScanClick(action);
                            }}
                            className="flex-shrink-0 p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label={`Scan for ${action.label}`}
                            title="Scan QR/Barcode"
                          >
                            <QrCode size={20} className="text-gray-600" />
                          </button>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Scan Option */}
        <div className="border-t border-gray-200 p-4">
          <button
            onClick={() => {
              // Open camera for general scan
              console.log('Opening general scanner');
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            <Camera size={20} />
            <span className="font-medium">Scan QR Code or Barcode</span>
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
