/**
 * Part 15 — Issue with Theoretical Check
 * Material issue with cost destination and theoretical quantity validation
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { issueExtensions } from '../data/inventoryData';
import type { IssueExtension } from '../types/inventory';
import { formatCurrency, formatDate } from '../utils/formatting';

export function IssueWithTheoreticalCheck() {
  const [selectedIssue, setSelectedIssue] = useState<IssueExtension | null>(null);

  const getVarianceColor = (variancePct?: number) => {
    if (!variancePct) return 'var(--sapPositiveColor)';
    if (variancePct <= 5) return 'var(--sapPositiveColor)';
    if (variancePct <= 10) return 'var(--sapCriticalColor)';
    return 'var(--sapNegativeColor)';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
            Material Issues
          </h3>
          <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Issues with cost destination and theoretical quantity check
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium" style={{
          background: 'var(--sapButton_Emphasized_Background)',
          color: 'var(--sapButton_Emphasized_TextColor)',
        }}>
          + New Issue
        </button>
      </div>

      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Issue No</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Type</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Issued To</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Location</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Cost Destination</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Theoretical</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Variance %</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Date</th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issueExtensions.map((issue, idx) => (
              <tr
                key={issue.issueId}
                className="cursor-pointer hover:bg-[var(--sapList_Hover_Background)]"
                style={{
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                  background: idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                }}
                onClick={() => setSelectedIssue(issue)}
              >
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  ISS-{issue.issueId}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded" style={{
                    background: 'var(--sapInformationBackground)',
                    color: 'var(--sapInformativeTextColor)',
                  }}>
                    {issue.issueType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  {issue.issuedToType} #{issue.issuedToId}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {issue.locationDesc || '—'}
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {issue.wbsId && `WBS-${issue.wbsId}`}
                  {issue.costCodeId && ` / CC-${issue.costCodeId}`}
                  {issue.boqItemId && ` / BOQ-${issue.boqItemId}`}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {issue.theoreticalQty}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: getVarianceColor(issue.variancePct) }}>
                  {issue.variancePct ? `${issue.variancePct.toFixed(1)}%` : '—'}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {formatDate(issue.requestedBy.toString())}
                </td>
                <td className="px-4 py-3 text-center">
                  <button className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]">
                    <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedIssue && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedIssue(null)}>
          <div className="sap-card max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  Issue #{selectedIssue.issueId} — Details
                </h3>
                <button onClick={() => setSelectedIssue(null)} className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]">×</button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Issue Type</label>
                  <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>{selectedIssue.issueType}</div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Issued To</label>
                  <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                    {selectedIssue.issuedToType} #{selectedIssue.issuedToId}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Requested By</label>
                  <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>User {selectedIssue.requestedBy}</div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Approved By</label>
                  <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>User {selectedIssue.approvedBy}</div>
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Cost Destination
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {selectedIssue.wbsId && (
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>WBS</label>
                      <div className="text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>WBS-{selectedIssue.wbsId}</div>
                    </div>
                  )}
                  {selectedIssue.costCodeId && (
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Cost Code</label>
                      <div className="text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>CC-{selectedIssue.costCodeId}</div>
                    </div>
                  )}
                  {selectedIssue.boqItemId && (
                    <div>
                      <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>BOQ Item</label>
                      <div className="text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>BOQ-{selectedIssue.boqItemId}</div>
                    </div>
                  )}
                </div>
                {selectedIssue.locationDesc && (
                  <div className="mt-2">
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Location</label>
                    <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>{selectedIssue.locationDesc}</div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                  Theoretical Check
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapInformativeTextColor)' }}>Theoretical Qty</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--sapInformativeTextColor)' }}>
                      {selectedIssue.theoreticalQty}
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapPositiveTextColor)' }}>Variance %</div>
                    <div className="text-xl font-bold" style={{ color: getVarianceColor(selectedIssue.variancePct) }}>
                      {selectedIssue.variancePct ? `${selectedIssue.variancePct.toFixed(1)}%` : '0%'}
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ background: selectedIssue.isReturnable ? 'var(--sapWarningBackground)' : 'var(--sapNeutralBackground)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Returnable</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedIssue.isReturnable ? 'Yes' : 'No'}
                    </div>
                  </div>
                </div>
                {selectedIssue.varianceReason && (
                  <div className="mt-3 p-3 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
                      <div>
                        <div className="text-xs font-semibold mb-1" style={{ color: 'var(--sapCriticalTextColor)' }}>
                          Variance Reason
                        </div>
                        <div className="text-xs" style={{ color: 'var(--sapTextColor)' }}>
                          {selectedIssue.varianceReason}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedIssue.expectedReturnDate && (
                <div className="pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Return Tracking
                  </h4>
                  <div>
                    <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>Expected Return Date</label>
                    <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                      {formatDate(selectedIssue.expectedReturnDate)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
