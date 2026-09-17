/**
 * Part 14 — Indent Workbench Component
 * Manage indents with stock/budget/theoretical checks
 */

import React, { useState } from 'react';
import { Plus, Filter, Download, Eye, Edit2, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { indentExtensions, indentItemExtensions } from '../data/procurementData';
import type { IndentExtension, IndentItemExtension, IndentCheck, IndentValidation } from '../types/procurement';

export function IndentWorkbench() {
  const [selectedIndent, setSelectedIndent] = useState<IndentExtension | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredIndents = indentExtensions.filter(indent => {
    if (filterStatus === 'ALL') return true;
    return indent.budgetStatus === filterStatus;
  });

  const getIndentItems = (indentId: number): IndentItemExtension[] => {
    return indentItemExtensions.filter(item => item.indentItemId === indentId);
  };

  const validateIndent = (indent: IndentExtension): IndentValidation => {
    const checks: IndentCheck[] = [
      {
        checkType: 'STOCK',
        status: 'PASS',
        message: 'Stock check completed',
        details: { onHand: 15, inTransit: 0, ordered: 20 },
      },
      {
        checkType: 'THEORETICAL',
        status: 'PASS',
        message: 'Within theoretical requirement',
        details: { theoretical: 45, indent: 10, variance: 0 },
      },
      {
        checkType: 'BUDGET',
        status: indent.budgetStatus === 'WITHIN' ? 'PASS' : 'WARN',
        message: indent.budgetStatus === 'WITHIN' ? 'Within budget' : 'Budget check required',
        details: { available: indent.budgetAvailable, required: 565000 },
      },
      {
        checkType: 'DUPLICATE',
        status: 'PASS',
        message: 'No duplicate indents found',
      },
      {
        checkType: 'LEAD_TIME',
        status: 'PASS',
        message: 'Lead time sufficient',
        details: { required: 7, available: 14 },
      },
    ];

    return {
      isValid: checks.every(c => c.status !== 'FAIL'),
      checks,
      canSubmit: checks.every(c => c.status !== 'FAIL'),
      requiresOverride: indent.budgetStatus === 'EXCEEDED',
    };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      WITHIN: { bg: 'var(--sapSuccessBackground)', text: 'var(--sapPositiveTextColor)', icon: CheckCircle },
      EXCEEDED: { bg: 'var(--sapErrorBackground)', text: 'var(--sapNegativeTextColor)', icon: XCircle },
      NO_BUDGET: { bg: 'var(--sapWarningBackground)', text: 'var(--sapCriticalTextColor)', icon: AlertTriangle },
      OVERRIDDEN: { bg: 'var(--sapInformationBackground)', text: 'var(--sapInformativeTextColor)', icon: CheckCircle },
    };

    const config = statusConfig[status] || statusConfig.WITHIN;
    const Icon = config.icon;

    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
        style={{ background: config.bg, color: config.text }}
      >
        <Icon size={12} />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Indent Workbench
          </h2>
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Manage purchase requisitions with validation checks
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{
            background: 'var(--sapButton_Emphasized_Background)',
            color: 'var(--sapButton_Emphasized_TextColor)',
          }}
        >
          <Plus size={16} />
          New Indent
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: 'var(--sapContent_LabelColor)' }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Status</option>
            <option value="WITHIN">Within Budget</option>
            <option value="EXCEEDED">Budget Exceeded</option>
            <option value="OVERRIDDEN">Overridden</option>
          </select>
        </div>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded text-sm"
          style={{
            background: 'var(--sapButton_Background)',
            color: 'var(--sapButton_TextColor)',
            border: '1px solid var(--sapButton_BorderColor)',
          }}
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Indent List */}
      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Indent ID
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Type
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Required By
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Est. Value
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Budget Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Auto-Generated
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredIndents.map((indent) => {
              const items = getIndentItems(indent.indentId);
              const totalValue = items.reduce((sum, item) => sum + (item.estimatedValue || 0), 0);

              return (
                <tr
                  key={indent.indentId}
                  className="border-t hover:bg-[var(--sapList_Hover_Background)] cursor-pointer"
                  style={{ borderColor: 'var(--sapList_BorderColor)' }}
                  onClick={() => setSelectedIndent(indent)}
                >
                  <td className="px-4 py-3">
                    <div className="font-mono text-sm" style={{ color: 'var(--sapTextColor)' }}>
                      IND-{String(indent.indentId).padStart(4, '0')}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                      {indent.indentType}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                      {new Date(indent.requiredByDate).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      ₹{totalValue.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getStatusBadge(indent.budgetStatus || 'WITHIN')}
                  </td>
                  <td className="px-4 py-3">
                    {indent.isAutoGenerated ? (
                      <span className="text-xs px-2 py-1 rounded" style={{ background: 'var(--sapInformationBackground)', color: 'var(--sapInformativeTextColor)' }}>
                        Auto
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>Manual</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                        title="View"
                      >
                        <Eye size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                      </button>
                      <button
                        className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                        title="Edit"
                      >
                        <Edit2 size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Panel */}
      {selectedIndent && (
        <div className="sap-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              Indent IND-{String(selectedIndent.indentId).padStart(4, '0')}
            </h3>
            <button
              onClick={() => setSelectedIndent(null)}
              className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Type
              </label>
              <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                {selectedIndent.indentType}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Required By
              </label>
              <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                {new Date(selectedIndent.requiredByDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Budget Status
              </label>
              <div>{getStatusBadge(selectedIndent.budgetStatus || 'WITHIN')}</div>
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Budget Available
              </label>
              <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                ₹{selectedIndent.budgetAvailable?.toLocaleString()}
              </div>
            </div>
          </div>

          {selectedIndent.justification && (
            <div className="mb-6">
              <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Justification
              </label>
              <div className="text-sm p-3 rounded" style={{ background: 'var(--sapGroup_ContentBackground)', color: 'var(--sapTextColor)' }}>
                {selectedIndent.justification}
              </div>
            </div>
          )}

          {/* Validation Checks */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
              Validation Checks
            </h4>
            <div className="space-y-2">
              {validateIndent(selectedIndent).checks.map((check, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded"
                  style={{
                    background: check.status === 'PASS' ? 'var(--sapSuccessBackground)' :
                               check.status === 'WARN' ? 'var(--sapWarningBackground)' :
                               'var(--sapErrorBackground)',
                  }}
                >
                  {check.status === 'PASS' && <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />}
                  {check.status === 'WARN' && <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />}
                  {check.status === 'FAIL' && <XCircle size={16} style={{ color: 'var(--sapNegativeColor)' }} />}
                  <div className="flex-1">
                    <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                      {check.checkType}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {check.message}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items */}
          <div>
            <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
              Items ({getIndentItems(selectedIndent.indentId).length})
            </h4>
            <div className="space-y-2">
              {getIndentItems(selectedIndent.indentId).map((item) => (
                <div
                  key={item.indentItemId}
                  className="p-3 rounded border"
                  style={{ borderColor: 'var(--sapList_BorderColor)' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                      {item.specification}
                    </div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      ₹{item.estimatedValue?.toLocaleString()}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <span style={{ color: 'var(--sapContent_LabelColor)' }}>On Hand: </span>
                      <span style={{ color: 'var(--sapTextColor)' }}>{item.stockOnHand}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--sapContent_LabelColor)' }}>In Transit: </span>
                      <span style={{ color: 'var(--sapTextColor)' }}>{item.stockInTransit}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--sapContent_LabelColor)' }}>Ordered: </span>
                      <span style={{ color: 'var(--sapTextColor)' }}>{item.alreadyOrdered}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--sapContent_LabelColor)' }}>Net Required: </span>
                      <span className="font-semibold" style={{ color: 'var(--sapTextColor)' }}>{item.netRequired}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="sap-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--sapTextColor)' }}>
                Create New Indent
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Indent Type
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      background: 'var(--sapField_Background)',
                      borderColor: 'var(--sapField_BorderColor)',
                      color: 'var(--sapField_TextColor)',
                    }}
                  >
                    <option value="REGULAR">Regular</option>
                    <option value="URGENT">Urgent</option>
                    <option value="EMERGENCY">Emergency</option>
                    <option value="STOCK_REPLENISH">Stock Replenishment</option>
                    <option value="CAPEX">CAPEX</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Required By Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      background: 'var(--sapField_Background)',
                      borderColor: 'var(--sapField_BorderColor)',
                      color: 'var(--sapField_TextColor)',
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Justification
                  </label>
                  <textarea
                    rows={3}
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      background: 'var(--sapField_Background)',
                      borderColor: 'var(--sapField_BorderColor)',
                      color: 'var(--sapField_TextColor)',
                    }}
                    placeholder="Provide justification for this indent..."
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded text-sm font-medium"
                  style={{
                    background: 'var(--sapButton_Background)',
                    color: 'var(--sapButton_TextColor)',
                    border: '1px solid var(--sapButton_BorderColor)',
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded text-sm font-medium"
                  style={{
                    background: 'var(--sapButton_Emphasized_Background)',
                    color: 'var(--sapButton_Emphasized_TextColor)',
                  }}
                >
                  Create & Validate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
