/**
 * Part 15 — Stock Take Blind Count
 * Blind count workflow with variance tracking and recount enforcement
 */

import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle, AlertTriangle, RotateCcw } from 'lucide-react';
import { stockTakes } from '../data/inventoryData';
import type { StockTake, StockTakeLine, StockTakeStatus } from '../types/inventory';
import { formatCurrency, formatDate } from '../utils/formatting';

export function StockTakeBlindCount() {
  const [selectedStockTake, setSelectedStockTake] = useState<StockTake | null>(null);
  const [showSystemQty, setShowSystemQty] = useState(false);

  const getStatusColor = (status: StockTakeStatus) => {
    switch (status) {
      case 'PLANNED': return 'var(--sapNeutralColor)';
      case 'IN_PROGRESS':
      case 'COUNTING': return 'var(--sapInformativeColor)';
      case 'RECOUNTING': return 'var(--sapCriticalColor)';
      case 'APPROVED': return 'var(--sapPositiveColor)';
      case 'POSTED': return 'var(--sapPositiveColor)';
      default: return 'var(--sapContent_LabelColor)';
    }
  };

  const getStatusBg = (status: StockTakeStatus) => {
    switch (status) {
      case 'PLANNED': return 'var(--sapNeutralBackground)';
      case 'IN_PROGRESS':
      case 'COUNTING': return 'var(--sapInformationBackground)';
      case 'RECOUNTING': return 'var(--sapWarningBackground)';
      case 'APPROVED':
      case 'POSTED': return 'var(--sapSuccessBackground)';
      default: return 'var(--sapNeutralBackground)';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
            Stock Take — Blind Count
          </h3>
          <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            System quantity hidden from counter • Variance recount by different person
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{
          background: 'var(--sapButton_Emphasized_Background)',
          color: 'var(--sapButton_Emphasized_TextColor)',
        }}>
          + New Stock Take
        </button>
      </div>

      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Stock Take No</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Store</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Cutoff</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Counted By</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Total Variance</th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {stockTakes.map((stockTake, idx) => (
              <tr
                key={stockTake.id}
                className="cursor-pointer hover:bg-[var(--sapList_Hover_Background)]"
                style={{
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                  background: idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                }}
                onClick={() => setSelectedStockTake(stockTake)}
              >
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  {stockTake.stockTakeNo}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded" style={{
                    background: 'var(--sapInformationBackground)',
                    color: 'var(--sapInformativeTextColor)',
                  }}>
                    {stockTake.takeType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  Store {stockTake.storeId}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {formatDate(stockTake.cutoffDatetime)}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded" style={{
                    background: getStatusBg(stockTake.status),
                    color: getStatusColor(stockTake.status),
                  }}>
                    {stockTake.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {stockTake.countedBy.map(id => `User ${id}`).join(', ')}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{
                  color: stockTake.totalVarianceValue < 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)',
                }}>
                  {formatCurrency(Math.abs(stockTake.totalVarianceValue))}
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]">
                    <Eye size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedStockTake && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { setSelectedStockTake(null); setShowSystemQty(false); }}>
          <div className="sap-card max-w-5xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div>
                <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {selectedStockTake.stockTakeNo} — Blind Count
                </h3>
                <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {selectedStockTake.takeType} • Store {selectedStockTake.storeId} • Cutoff: {formatDate(selectedStockTake.cutoffDatetime)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSystemQty(!showSystemQty)}
                  className="flex items-center gap-2 px-3 py-2 rounded text-sm"
                  style={{
                    background: showSystemQty ? 'var(--sapWarningBackground)' : 'var(--sapButton_Background)',
                    color: showSystemQty ? 'var(--sapCriticalTextColor)' : 'var(--sapButton_TextColor)',
                    border: '1px solid var(--sapButton_BorderColor)',
                  }}
                >
                  {showSystemQty ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showSystemQty ? 'Hide System Qty' : 'Show System Qty'}
                </button>
                <button onClick={() => { setSelectedStockTake(null); setShowSystemQty(false); }} className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]">×</button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {!showSystemQty && (
                <div className="p-3 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
                  <div className="flex items-start gap-2">
                    <EyeOff size={16} style={{ color: 'var(--sapCriticalColor)' }} />
                    <div className="text-sm" style={{ color: 'var(--sapCriticalTextColor)' }}>
                      <strong>Blind Count Mode:</strong> System quantities are hidden. Enter physical count without seeing system balance.
                    </div>
                  </div>
                </div>
              )}

              <div>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Count Lines ({selectedStockTake.lines.length})
                </h4>
                <div className="sap-card overflow-hidden">
                  <table className="w-full">
                    <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
                      <tr>
                        <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Item</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Batch</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Bin</th>
                        {showSystemQty && (
                          <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>System Qty</th>
                        )}
                        <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Counted Qty</th>
                        {selectedStockTake.lines.some(l => l.recountQty !== undefined) && (
                          <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Recount Qty</th>
                        )}
                        <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Variance</th>
                        <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Value</th>
                        <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStockTake.lines.map((line, idx) => {
                        const hasVariance = line.varianceQty && line.varianceQty !== 0;
                        const requiresRecount = hasVariance && !line.recountQty;

                        return (
                          <tr
                            key={line.id}
                            style={{
                              borderBottom: '1px solid var(--sapList_BorderColor)',
                              background: requiresRecount ? 'var(--sapWarningBackground)' :
                                         idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                            }}
                          >
                            <td className="px-4 py-2 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                              Item-{line.itemId}
                            </td>
                            <td className="px-4 py-2 text-sm font-mono" style={{ color: 'var(--sapContent_LabelColor)' }}>
                              {line.batchId || '—'}
                            </td>
                            <td className="px-4 py-2 text-sm font-mono" style={{ color: 'var(--sapContent_LabelColor)' }}>
                              {line.binId || '—'}
                            </td>
                            {showSystemQty && (
                              <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                                {line.systemQty}
                              </td>
                            )}
                            <td className="px-4 py-2 text-sm text-right font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                              {line.countedQty || '—'}
                            </td>
                            {selectedStockTake.lines.some(l => l.recountQty !== undefined) && (
                              <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--sapInformativeTextColor)' }}>
                                {line.recountQty || '—'}
                              </td>
                            )}
                            <td className="px-4 py-2 text-sm text-right font-semibold" style={{
                              color: hasVariance ? (line.varianceQty! < 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)') : 'var(--sapPositiveColor)',
                            }}>
                              {line.varianceQty ? (line.varianceQty > 0 ? '+' : '') + line.varianceQty : '0'}
                            </td>
                            <td className="px-4 py-2 text-sm text-right" style={{
                              color: line.varianceValue && line.varianceValue < 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)',
                            }}>
                              {line.varianceValue ? formatCurrency(Math.abs(line.varianceValue)) : '—'}
                            </td>
                            <td className="px-4 py-2 text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                              {line.reason || '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Counted By</label>
                  <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                    {selectedStockTake.countedBy.map(id => `User ${id}`).join(', ')}
                  </div>
                </div>
                {selectedStockTake.verifiedBy && (
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Verified By</label>
                    <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                      User {selectedStockTake.verifiedBy}
                    </div>
                  </div>
                )}
                {selectedStockTake.approvedBy && (
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Approved By</label>
                    <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                      User {selectedStockTake.approvedBy} on {formatDate(selectedStockTake.approvedAt || '')}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Total Variance Value</label>
                    <div className="text-2xl font-bold" style={{
                      color: selectedStockTake.totalVarianceValue < 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)',
                    }}>
                      {formatCurrency(Math.abs(selectedStockTake.totalVarianceValue))}
                    </div>
                  </div>
                  {selectedStockTake.status === 'COUNTING' && (
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{
                        background: 'var(--sapButton_Background)',
                        color: 'var(--sapButton_TextColor)',
                        border: '1px solid var(--sapButton_BorderColor)',
                      }}>
                        <RotateCcw size={16} />
                        Recount Variances
                      </button>
                      <button className="px-4 py-2 rounded text-sm font-medium" style={{
                        background: 'var(--sapButton_Emphasized_Background)',
                        color: 'var(--sapButton_Emphasized_TextColor)',
                      }}>
                        Submit for Approval
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
