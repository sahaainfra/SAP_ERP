/**
 * Part 15 — Stock Ledger View
 * Append-only ledger with hash chaining and running balance
 */

import React, { useState } from 'react';
import { Filter, Download, Eye, Hash } from 'lucide-react';
import { stockLedger } from '../data/inventoryData';
import type { StockLedgerEntry, MovementType } from '../types/inventory';
import { formatCurrency, formatDate } from '../utils/formatting';

export function StockLedgerView() {
  const [filterMovementType, setFilterMovementType] = useState<MovementType | 'ALL'>('ALL');
  const [filterItem, setFilterItem] = useState<number | 'ALL'>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<StockLedgerEntry | null>(null);

  const filteredEntries = stockLedger.filter(entry => {
    if (filterMovementType !== 'ALL' && entry.movementType !== filterMovementType) return false;
    if (filterItem !== 'ALL' && entry.itemId !== filterItem) return false;
    return true;
  });

  const getMovementTypeColor = (type: MovementType) => {
    switch (type) {
      case 'GRN':
      case 'RETURN_TO_STORE':
      case 'TRANSFER_IN':
      case 'ADJUST_PLUS':
        return 'var(--sapPositiveColor)';
      case 'ISSUE':
      case 'TRANSFER_OUT':
      case 'ADJUST_MINUS':
      case 'CONSUMPTION':
        return 'var(--sapNegativeColor)';
      case 'SCRAP':
      case 'DAMAGE':
        return 'var(--sapCriticalColor)';
      case 'REVERSAL':
        return 'var(--sapNeutralColor)';
      default:
        return 'var(--sapContent_LabelColor)';
    }
  };

  const getMovementTypeIcon = (type: MovementType) => {
    switch (type) {
      case 'GRN':
      case 'RETURN_TO_STORE':
      case 'TRANSFER_IN':
      case 'ADJUST_PLUS':
        return '↓';
      case 'ISSUE':
      case 'TRANSFER_OUT':
      case 'ADJUST_MINUS':
      case 'CONSUMPTION':
        return '↑';
      case 'SCRAP':
      case 'DAMAGE':
        return '⚠';
      case 'REVERSAL':
        return '↺';
      default:
        return '•';
    }
  };

  const uniqueItems = Array.from(new Set(stockLedger.map(e => e.itemId)));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
            Stock Ledger
          </h3>
          <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Append-only ledger with hash chaining • {filteredEntries.length} entries
          </p>
        </div>
        <button className="flex items-center gap-2 px-3 py-2 rounded text-sm" style={{
          background: 'var(--sapButton_Background)',
          color: 'var(--sapButton_TextColor)',
          border: '1px solid var(--sapButton_BorderColor)',
        }}>
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: 'var(--sapContent_LabelColor)' }} />
          <select
            value={filterMovementType}
            onChange={(e) => setFilterMovementType(e.target.value as MovementType | 'ALL')}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Movement Types</option>
            <option value="GRN">GRN</option>
            <option value="ISSUE">Issue</option>
            <option value="RETURN_TO_STORE">Return to Store</option>
            <option value="TRANSFER_OUT">Transfer Out</option>
            <option value="TRANSFER_IN">Transfer In</option>
            <option value="ADJUST_PLUS">Adjustment (+)</option>
            <option value="ADJUST_MINUS">Adjustment (-)</option>
            <option value="SCRAP">Scrap</option>
            <option value="DAMAGE">Damage</option>
            <option value="REVERSAL">Reversal</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterItem}
            onChange={(e) => setFilterItem(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Items</option>
            {uniqueItems.map(itemId => (
              <option key={itemId} value={itemId}>Item {itemId}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Date
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Movement
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Item
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Batch
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Quantity
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Rate
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Value
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Balance Qty
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Balance Value
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Source
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Hash
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((entry, idx) => (
              <tr
                key={entry.id}
                className="cursor-pointer hover:bg-[var(--sapList_Hover_Background)]"
                style={{
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                  background: idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                }}
                onClick={() => setSelectedEntry(entry)}
              >
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  {formatDate(entry.movementDate)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span style={{ color: getMovementTypeColor(entry.movementType), fontSize: '16px' }}>
                      {getMovementTypeIcon(entry.movementType)}
                    </span>
                    <span className="text-xs font-medium" style={{ color: getMovementTypeColor(entry.movementType) }}>
                      {entry.movementType.replace(/_/g, ' ')}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  Item {entry.itemId}
                </td>
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {entry.batchId || '—'}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{
                  color: entry.quantity > 0 ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)',
                }}>
                  {entry.quantity > 0 ? '+' : ''}{entry.quantity} {entry.uom}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(entry.rate)}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{
                  color: entry.value > 0 ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)',
                }}>
                  {formatCurrency(entry.value)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {entry.balanceQty} {entry.uom}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(entry.balanceValue)}
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {entry.sourceType}:{entry.sourceId}
                </td>
                <td className="px-4 py-3 text-center">
                  <Hash size={14} style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEntry(null)}>
          <div className="sap-card max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  Ledger Entry #{selectedEntry.id}
                </h3>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Movement Type</label>
                  <div className="text-sm font-semibold" style={{ color: getMovementTypeColor(selectedEntry.movementType) }}>
                    {getMovementTypeIcon(selectedEntry.movementType)} {selectedEntry.movementType.replace(/_/g, ' ')}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Date</label>
                  <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                    {formatDate(selectedEntry.movementDate)}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Posted At</label>
                  <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                    {new Date(selectedEntry.postedAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Created By</label>
                  <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                    User {selectedEntry.createdBy}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Movement Details
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Quantity</label>
                    <div className="text-lg font-bold" style={{
                      color: selectedEntry.quantity > 0 ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)',
                    }}>
                      {selectedEntry.quantity > 0 ? '+' : ''}{selectedEntry.quantity} {selectedEntry.uom}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Rate</label>
                    <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                      {formatCurrency(selectedEntry.rate)}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Value</label>
                    <div className="text-lg font-bold" style={{
                      color: selectedEntry.value > 0 ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)',
                    }}>
                      {formatCurrency(selectedEntry.value)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Running Balance
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Balance Quantity</label>
                    <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedEntry.balanceQty} {selectedEntry.uom}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Balance Value</label>
                    <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                      {formatCurrency(selectedEntry.balanceValue)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Source Document
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Source Type</label>
                    <div className="text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedEntry.sourceType}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Source ID</label>
                    <div className="text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedEntry.sourceId}
                    </div>
                  </div>
                  {selectedEntry.sourceLineId && (
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Line ID</label>
                      <div className="text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                        {selectedEntry.sourceLineId}
                      </div>
                    </div>
                  )}
                  {selectedEntry.costCodeId && (
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Cost Code</label>
                      <div className="text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                        CC-{selectedEntry.costCodeId}
                      </div>
                    </div>
                  )}
                  {selectedEntry.wbsId && (
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>WBS</label>
                      <div className="text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                        WBS-{selectedEntry.wbsId}
                      </div>
                    </div>
                  )}
                  {selectedEntry.boqItemId && (
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>BOQ Item</label>
                      <div className="text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                        BOQ-{selectedEntry.boqItemId}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Tamper Evidence
                </h4>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Row Hash</label>
                  <div className="text-xs font-mono p-2 rounded" style={{
                    background: 'var(--sapNeutralBackground)',
                    color: 'var(--sapTextColor)',
                  }}>
                    {selectedEntry.rowHash}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
