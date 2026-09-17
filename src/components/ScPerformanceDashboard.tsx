/**
 * Part 16 — SC Performance Dashboard
 * Subcontractor performance scoring and ranking
 */

import React, { useState } from 'react';
import { 
  TrendingUp, Award, AlertTriangle, Star, CheckCircle,
  Eye, Filter, Download
} from 'lucide-react';
import { scPerformances } from '../data/subcontractorData';
import type { ScPerformance } from '../types/subcontractor';
import { formatCurrency } from '../utils/formatting';

export function ScPerformanceDashboard() {
  const [selectedSc, setSelectedSc] = useState<ScPerformance | null>(null);
  const [sortBy, setSortBy] = useState<'overall' | 'quality' | 'safety' | 'compliance'>('overall');

  const sortedPerformances = [...scPerformances].sort((a, b) => {
    switch (sortBy) {
      case 'quality': return b.qualityScore - a.qualityScore;
      case 'safety': return b.safetyScore - a.safetyScore;
      case 'compliance': return b.complianceScore - a.complianceScore;
      default: return b.overallScore - a.overallScore;
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--sapPositiveColor)';
    if (score >= 60) return 'var(--sapCriticalColor)';
    return 'var(--sapNegativeColor)';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'var(--sapSuccessBackground)';
    if (score >= 60) return 'var(--sapWarningBackground)';
    return 'var(--sapErrorBackground)';
  };

  const avgPerformance = scPerformances.filter(p => !p.insufficientData).reduce((sum, p) => sum + p.overallScore, 0) / 
    scPerformances.filter(p => !p.insufficientData).length || 0;

  const topPerformers = scPerformances.filter(p => !p.insufficientData && p.overallScore >= 80).length;
  const underPerformers = scPerformances.filter(p => !p.insufficientData && p.overallScore < 60).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Subcontractor Performance Dashboard
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Performance scoring based on quality, safety, compliance, and delivery
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{
            background: 'var(--sapButton_Background)',
            color: 'var(--sapButton_TextColor)',
            border: '1px solid var(--sapButton_BorderColor)',
          }}
        >
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Average Performance
            </span>
            <TrendingUp size={16} style={{ color: getScoreColor(avgPerformance) }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: getScoreColor(avgPerformance) }}>
            {avgPerformance.toFixed(1)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Out of 100
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Top Performers
            </span>
            <Award size={16} style={{ color: 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapPositiveColor)' }}>
            {topPerformers}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Score ≥ 80
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Under Performers
            </span>
            <AlertTriangle size={16} style={{ color: 'var(--sapNegativeColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapNegativeColor)' }}>
            {underPerformers}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Score &lt; 60
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Insufficient Data
            </span>
            <AlertTriangle size={16} style={{ color: 'var(--sapContent_LabelColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {scPerformances.filter(p => p.insufficientData).length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            &lt; 5 measurements
          </div>
        </div>
      </div>

      {/* Sort Control */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: 'var(--sapContent_LabelColor)' }} />
          <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="overall">Overall Score</option>
            <option value="quality">Quality Score</option>
            <option value="safety">Safety Score</option>
            <option value="compliance">Compliance Score</option>
          </select>
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedPerformances.map((perf, idx) => (
          <div
            key={perf.subcontractorId}
            className="sap-card p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedSc(perf)}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2 py-1 rounded" style={{
                    background: idx === 0 && !perf.insufficientData ? 'var(--sapAccentColor1)' : 'var(--sapNeutralBackground)',
                    color: idx === 0 && !perf.insufficientData ? 'white' : 'var(--sapNeutralTextColor)',
                  }}>
                    #{idx + 1}
                  </span>
                  <h3 className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                    {perf.subcontractorName}
                  </h3>
                </div>
                <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {perf.totalMeasurements} measurements • Project: {perf.projectId}
                </p>
              </div>
              {perf.insufficientData ? (
                <div className="text-right">
                  <div className="text-xs px-2 py-1 rounded" style={{
                    background: 'var(--sapNeutralBackground)',
                    color: 'var(--sapNeutralTextColor)',
                  }}>
                    Insufficient Data
                  </div>
                </div>
              ) : (
                <div className="text-right">
                  <div className="text-3xl font-bold" style={{ color: getScoreColor(perf.overallScore) }}>
                    {perf.overallScore.toFixed(1)}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Overall Score
                  </div>
                </div>
              )}
            </div>

            {!perf.insufficientData && (
              <>
                {/* Score Breakdown */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3 rounded" style={{ background: getScoreBg(perf.quantityAchievedPct) }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Quantity Achievement
                    </div>
                    <div className="text-lg font-bold" style={{ color: getScoreColor(perf.quantityAchievedPct) }}>
                      {perf.quantityAchievedPct.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ background: getScoreBg(perf.timePerformancePct) }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Time Performance
                    </div>
                    <div className="text-lg font-bold" style={{ color: getScoreColor(perf.timePerformancePct) }}>
                      {perf.timePerformancePct.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Detailed Scores */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star size={14} style={{ color: 'var(--sapAccentColor1)' }} />
                      <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        Quality
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${perf.qualityScore}%`,
                            background: getScoreColor(perf.qualityScore),
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ color: getScoreColor(perf.qualityScore) }}>
                        {perf.qualityScore}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} style={{ color: 'var(--sapAccentColor2)' }} />
                      <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        Safety
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${perf.safetyScore}%`,
                            background: getScoreColor(perf.safetyScore),
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ color: getScoreColor(perf.safetyScore) }}>
                        {perf.safetyScore}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} style={{ color: 'var(--sapAccentColor3)' }} />
                      <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        Compliance
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${perf.complianceScore}%`,
                            background: getScoreColor(perf.complianceScore),
                          }}
                        />
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ color: getScoreColor(perf.complianceScore) }}>
                        {perf.complianceScore}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Issues */}
                {(perf.billingDisputeCount > 0 || perf.freeIssueExcessPct > 0) && (
                  <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                    <div className="flex items-center gap-4 text-xs">
                      {perf.billingDisputeCount > 0 && (
                        <div className="flex items-center gap-1" style={{ color: 'var(--sapCriticalColor)' }}>
                          <AlertTriangle size={12} />
                          <span>{perf.billingDisputeCount} billing disputes</span>
                        </div>
                      )}
                      {perf.freeIssueExcessPct > 0 && (
                        <div className="flex items-center gap-1" style={{ color: 'var(--sapNegativeColor)' }}>
                          <AlertTriangle size={12} />
                          <span>{perf.freeIssueExcessPct.toFixed(1)}% excess material</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Performance Detail Modal */}
      {selectedSc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSc(null)}>
          <div className="sap-card max-w-3xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                    {selectedSc.subcontractorName}
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Performance Details • {selectedSc.totalMeasurements} measurements
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSc(null)}
                  className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {selectedSc.insufficientData ? (
                <div className="text-center py-12">
                  <AlertTriangle size={48} className="mx-auto mb-4" style={{ color: 'var(--sapContent_LabelColor)' }} />
                  <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Insufficient data for performance scoring
                  </p>
                  <p className="text-xs mt-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Minimum 5 completed measurements required
                  </p>
                </div>
              ) : (
                <>
                  {/* Overall Score */}
                  <div className="text-center">
                    <div className="text-5xl font-bold mb-2" style={{ color: getScoreColor(selectedSc.overallScore) }}>
                      {selectedSc.overallScore.toFixed(1)}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Overall Performance Score
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Last Updated: {new Date(selectedSc.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded" style={{ background: getScoreBg(selectedSc.quantityAchievedPct) }}>
                      <div className="text-xs mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        Quantity Achievement
                      </div>
                      <div className="text-3xl font-bold" style={{ color: getScoreColor(selectedSc.quantityAchievedPct) }}>
                        {selectedSc.quantityAchievedPct.toFixed(1)}%
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        vs WO schedule
                      </div>
                    </div>
                    <div className="p-4 rounded" style={{ background: getScoreBg(selectedSc.timePerformancePct) }}>
                      <div className="text-xs mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        Time Performance
                      </div>
                      <div className="text-3xl font-bold" style={{ color: getScoreColor(selectedSc.timePerformancePct) }}>
                        {selectedSc.timePerformancePct.toFixed(1)}%
                      </div>
                      <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        vs WO completion date
                      </div>
                    </div>
                  </div>

                  {/* Component Scores */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                      Component Scores
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Quality</span>
                          <span className="text-sm font-bold" style={{ color: getScoreColor(selectedSc.qualityScore) }}>
                            {selectedSc.qualityScore}/100
                          </span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${selectedSc.qualityScore}%`,
                              background: getScoreColor(selectedSc.qualityScore),
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Safety</span>
                          <span className="text-sm font-bold" style={{ color: getScoreColor(selectedSc.safetyScore) }}>
                            {selectedSc.safetyScore}/100
                          </span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${selectedSc.safetyScore}%`,
                              background: getScoreColor(selectedSc.safetyScore),
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Compliance</span>
                          <span className="text-sm font-bold" style={{ color: getScoreColor(selectedSc.complianceScore) }}>
                            {selectedSc.complianceScore}/100
                          </span>
                        </div>
                        <div className="h-3 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${selectedSc.complianceScore}%`,
                              background: getScoreColor(selectedSc.complianceScore),
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Issues & Concerns */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                      Issues & Concerns
                    </h4>
                    <div className="space-y-2">
                      {selectedSc.billingDisputeCount > 0 && (
                        <div className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
                            <span className="text-sm" style={{ color: 'var(--sapCriticalTextColor)' }}>
                              Billing Disputes
                            </span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: 'var(--sapCriticalTextColor)' }}>
                            {selectedSc.billingDisputeCount}
                          </span>
                        </div>
                      )}
                      {selectedSc.freeIssueExcessPct > 0 && (
                        <div className="flex items-center justify-between p-3 rounded" style={{ background: 'var(--sapErrorBackground)' }}>
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={16} style={{ color: 'var(--sapNegativeColor)' }} />
                            <span className="text-sm" style={{ color: 'var(--sapNegativeTextColor)' }}>
                              Free Issue Excess
                            </span>
                          </div>
                          <span className="text-sm font-bold" style={{ color: 'var(--sapNegativeTextColor)' }}>
                            {selectedSc.freeIssueExcessPct.toFixed(1)}%
                          </span>
                        </div>
                      )}
                      {selectedSc.billingDisputeCount === 0 && selectedSc.freeIssueExcessPct === 0 && (
                        <div className="flex items-center gap-2 p-3 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
                          <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                          <span className="text-sm" style={{ color: 'var(--sapPositiveTextColor)' }}>
                            No major issues reported
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                    <button className="px-4 py-2 rounded text-sm font-medium" style={{
                      background: 'var(--sapButton_Emphasized_Background)',
                      color: 'var(--sapButton_Emphasized_TextColor)',
                    }}>
                      View Work Orders
                    </button>
                    <button className="px-4 py-2 rounded text-sm font-medium" style={{
                      background: 'var(--sapButton_Background)',
                      color: 'var(--sapButton_TextColor)',
                      border: '1px solid var(--sapButton_BorderColor)',
                    }}>
                      View Bills
                    </button>
                    <button className="px-4 py-2 rounded text-sm font-medium" style={{
                      background: 'var(--sapButton_Background)',
                      color: 'var(--sapButton_TextColor)',
                      border: '1px solid var(--sapButton_BorderColor)',
                    }}>
                      Performance History
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
