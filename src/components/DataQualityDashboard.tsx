/**
 * Part 12 — Data Quality Dashboard
 * Monitor master data quality, duplicates, and compliance
 */

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, TrendingUp, Users, Package, Building2 } from 'lucide-react';
import { qualityMetrics, duplicateCandidates } from '../data/masterData';
import type { MasterQualityMetric, DuplicateCandidate } from '../types/masterData';

export function DataQualityDashboard() {
  const [selectedMetric, setSelectedMetric] = useState<MasterQualityMetric | null>(null);
  const [selectedDuplicate, setSelectedDuplicate] = useState<DuplicateCandidate | null>(null);

  const getQualityScore = (metric: MasterQualityMetric) => {
    return metric.completenessPercent;
  };

  const getQualityColor = (score: number) => {
    if (score >= 95) return 'var(--sapPositiveColor)';
    if (score >= 80) return 'var(--sapCriticalColor)';
    return 'var(--sapNegativeColor)';
  };

  const getMasterIcon = (masterType: string) => {
    switch (masterType) {
      case 'VENDOR': return <Users size={20} />;
      case 'ITEM': return <Package size={20} />;
      case 'CLIENT': return <Building2 size={20} />;
      default: return <Package size={20} />;
    }
  };

  const totalDuplicates = duplicateCandidates.filter(d => d.status === 'PENDING').length;
  const totalExpiredDocs = qualityMetrics.reduce((sum, m) => sum + m.expiredDocuments, 0);
  const totalOrphans = qualityMetrics.reduce((sum, m) => sum + m.orphanReferences, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--sapContent_LabelColor)]">Overall Quality</span>
            <TrendingUp size={20} className="text-[var(--sapAccentColor6)]" />
          </div>
          <div className="text-3xl font-bold text-[var(--sapTextColor)]">
            {(qualityMetrics.reduce((sum, m) => sum + m.completenessPercent, 0) / qualityMetrics.length).toFixed(1)}%
          </div>
          <div className="text-xs text-[var(--sapContent_LabelColor)] mt-1">
            Average completeness across all masters
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--sapContent_LabelColor)]">Duplicate Candidates</span>
            <AlertTriangle size={20} className="text-[var(--sapCriticalColor)]" />
          </div>
          <div className="text-3xl font-bold text-[var(--sapTextColor)]">{totalDuplicates}</div>
          <div className="text-xs text-[var(--sapContent_LabelColor)] mt-1">
            Pending review
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--sapContent_LabelColor)]">Expired Documents</span>
            <XCircle size={20} className="text-[var(--sapNegativeColor)]" />
          </div>
          <div className="text-3xl font-bold text-[var(--sapTextColor)]">{totalExpiredDocs}</div>
          <div className="text-xs text-[var(--sapContent_LabelColor)] mt-1">
            Vendor compliance docs
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--sapContent_LabelColor)]">Orphan References</span>
            <AlertTriangle size={20} className="text-[var(--sapCriticalColor)]" />
          </div>
          <div className="text-3xl font-bold text-[var(--sapTextColor)]">{totalOrphans}</div>
          <div className="text-xs text-[var(--sapContent_LabelColor)] mt-1">
            Invalid foreign keys
          </div>
        </div>
      </div>

      {/* Quality Metrics by Master Type */}
      <div className="sap-card p-4">
        <h3 className="text-sm font-semibold text-[var(--sapTextColor)] mb-4">Quality by Master Type</h3>
        <div className="space-y-3">
          {qualityMetrics.map(metric => {
            const score = getQualityScore(metric);
            const color = getQualityColor(score);
            
            return (
              <div
                key={metric.masterType}
                className="p-4 rounded border border-[var(--sapList_BorderColor)] cursor-pointer hover:bg-[var(--sapList_Hover_Background)]"
                onClick={() => setSelectedMetric(metric)}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-[var(--sapAccentColor6)]">
                      {getMasterIcon(metric.masterType)}
                    </div>
                    <div>
                      <div className="font-medium text-[var(--sapTextColor)]">{metric.masterType}</div>
                      <div className="text-xs text-[var(--sapContent_LabelColor)]">
                        {metric.totalRecords} total records
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ color }}>
                      {score.toFixed(1)}%
                    </div>
                    <div className="text-xs text-[var(--sapContent_LabelColor)]">Quality Score</div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="h-2 rounded-full bg-[var(--sapNeutralBackground)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${score}%`, background: color }}
                    />
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-5 gap-2 text-xs">
                  <div>
                    <div className="text-[var(--sapContent_LabelColor)]">Complete</div>
                    <div className="font-medium text-[var(--sapTextColor)]">
                      {metric.completeRecords}/{metric.totalRecords}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--sapContent_LabelColor)]">Duplicates</div>
                    <div className="font-medium text-[var(--sapCriticalColor)]">
                      {metric.duplicateCandidates}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--sapContent_LabelColor)]">Expired Docs</div>
                    <div className="font-medium text-[var(--sapNegativeColor)]">
                      {metric.expiredDocuments}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--sapContent_LabelColor)]">Orphans</div>
                    <div className="font-medium text-[var(--sapCriticalColor)]">
                      {metric.orphanReferences}
                    </div>
                  </div>
                  <div>
                    <div className="text-[var(--sapContent_LabelColor)]">Inactive</div>
                    <div className="font-medium text-[var(--sapContent_LabelColor)]">
                      {metric.inactiveWithTransactions}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Duplicate Candidates */}
      <div className="sap-card p-4">
        <h3 className="text-sm font-semibold text-[var(--sapTextColor)] mb-4">
          Duplicate Candidates ({duplicateCandidates.filter(d => d.status === 'PENDING').length})
        </h3>
        <div className="space-y-2">
          {duplicateCandidates.filter(d => d.status === 'PENDING').map(duplicate => (
            <div
              key={duplicate.id}
              className="p-3 rounded border border-[var(--sapList_BorderColor)] cursor-pointer hover:bg-[var(--sapList_Hover_Background)]"
              onClick={() => setSelectedDuplicate(duplicate)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="text-[var(--sapCriticalColor)]" />
                  <span className="font-medium text-[var(--sapTextColor)]">
                    {duplicate.masterType}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-[var(--sapWarningBackground)] text-[var(--sapCriticalTextColor)]">
                    {duplicate.matchScore}% match
                  </span>
                  <button className="text-xs px-2 py-1 rounded bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] border border-[var(--sapButton_BorderColor)] hover:bg-[var(--sapButton_Hover_Background)]">
                    Review
                  </button>
                </div>
              </div>
              <div className="text-xs text-[var(--sapContent_LabelColor)]">
                Records {duplicate.recordId1} and {duplicate.recordId2} • 
                Matched on: {duplicate.matchFields.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modals */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMetric(null)}>
          <div className="sap-card max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--sapList_BorderColor)]">
              <h3 className="text-lg font-semibold text-[var(--sapTextColor)]">
                {selectedMetric.masterType} Quality Details
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--sapContent_LabelColor)]">Total Records</label>
                  <div className="text-2xl font-bold text-[var(--sapTextColor)]">{selectedMetric.totalRecords}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[var(--sapContent_LabelColor)]">Complete Records</label>
                  <div className="text-2xl font-bold text-[var(--sapPositiveColor)]">{selectedMetric.completeRecords}</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--sapContent_LabelColor)] block mb-2">Issues Breakdown</label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--sapWarningBackground)]">
                    <span className="text-sm">Duplicate Candidates</span>
                    <span className="font-medium text-[var(--sapCriticalTextColor)]">{selectedMetric.duplicateCandidates}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--sapErrorBackground)]">
                    <span className="text-sm">Expired Documents</span>
                    <span className="font-medium text-[var(--sapNegativeTextColor)]">{selectedMetric.expiredDocuments}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--sapWarningBackground)]">
                    <span className="text-sm">Orphan References</span>
                    <span className="font-medium text-[var(--sapCriticalTextColor)]">{selectedMetric.orphanReferences}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--sapNeutralBackground)]">
                    <span className="text-sm">Inactive with Transactions</span>
                    <span className="font-medium text-[var(--sapTextColor)]">{selectedMetric.inactiveWithTransactions}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-[var(--sapNeutralBackground)]">
                    <span className="text-sm">Not Used in 24 Months</span>
                    <span className="font-medium text-[var(--sapTextColor)]">{selectedMetric.notUsedIn24Months}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--sapList_BorderColor)]">
                <label className="text-xs font-medium text-[var(--sapContent_LabelColor)] block mb-2">Last Computed</label>
                <div className="text-sm text-[var(--sapTextColor)]">
                  {new Date(selectedMetric.lastComputed).toLocaleString()}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button className="flex-1 px-4 py-2 rounded text-sm font-medium bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)] hover:opacity-90">
                  View All Records
                </button>
                <button className="flex-1 px-4 py-2 rounded text-sm font-medium border border-[var(--sapButton_BorderColor)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]">
                  Export Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedDuplicate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDuplicate(null)}>
          <div className="sap-card max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--sapList_BorderColor)]">
              <h3 className="text-lg font-semibold text-[var(--sapTextColor)]">
                Review Duplicate Candidate
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded border border-[var(--sapList_BorderColor)]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-[var(--sapTextColor)]">Record 1</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--sapNeutralBackground)] text-[var(--sapTextColor)]">
                      ID: {selectedDuplicate.recordId1}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <label className="text-xs text-[var(--sapContent_LabelColor)]">Name</label>
                      <div className="text-[var(--sapTextColor)]">Sample Vendor A</div>
                    </div>
                    <div>
                      <label className="text-xs text-[var(--sapContent_LabelColor)]">Code</label>
                      <div className="text-[var(--sapTextColor)] font-mono">VND-001</div>
                    </div>
                    <div>
                      <label className="text-xs text-[var(--sapContent_LabelColor)]">GSTIN</label>
                      <div className="text-[var(--sapTextColor)] font-mono">27AAACM1234F1Z5</div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded border border-[var(--sapList_BorderColor)]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm font-medium text-[var(--sapTextColor)]">Record 2</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--sapNeutralBackground)] text-[var(--sapTextColor)]">
                      ID: {selectedDuplicate.recordId2}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <label className="text-xs text-[var(--sapContent_LabelColor)]">Name</label>
                      <div className="text-[var(--sapTextColor)]">Sample Vendor A Pvt Ltd</div>
                    </div>
                    <div>
                      <label className="text-xs text-[var(--sapContent_LabelColor)]">Code</label>
                      <div className="text-[var(--sapTextColor)] font-mono">VND-067</div>
                    </div>
                    <div>
                      <label className="text-xs text-[var(--sapContent_LabelColor)]">GSTIN</label>
                      <div className="text-[var(--sapTextColor)] font-mono">27AAACM1234F1Z5</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--sapContent_LabelColor)] block mb-2">Match Details</label>
                <div className="p-3 rounded bg-[var(--sapWarningBackground)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[var(--sapTextColor)]">Match Score</span>
                    <span className="text-lg font-bold text-[var(--sapCriticalTextColor)]">{selectedDuplicate.matchScore}%</span>
                  </div>
                  <div className="text-xs text-[var(--sapTextColor)]">
                    Matched fields: {selectedDuplicate.matchFields.join(', ')}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--sapContent_LabelColor)] block mb-2">Action</label>
                <textarea
                  placeholder="Add reason for decision..."
                  className="w-full px-3 py-2 rounded border border-[var(--sapField_BorderColor)] bg-[var(--sapField_Background)] text-[var(--sapField_TextColor)]"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4 border-t border-[var(--sapList_BorderColor)]">
                <button className="flex-1 px-4 py-2 rounded text-sm font-medium bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)] hover:opacity-90">
                  Merge Records
                </button>
                <button className="flex-1 px-4 py-2 rounded text-sm font-medium border border-[var(--sapButton_BorderColor)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]">
                  Mark as Not Duplicate
                </button>
                <button className="px-4 py-2 rounded text-sm font-medium border border-[var(--sapButton_BorderColor)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]" onClick={() => setSelectedDuplicate(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
