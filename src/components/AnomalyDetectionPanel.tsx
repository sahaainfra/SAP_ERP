/**
 * Anomaly Detection Component - Part 8
 * 
 * Displays detected anomalies across transactional, behavioral, and operational categories
 */

import { useState } from 'react';
import { AlertTriangle, TrendingUp, Package, Users, DollarSign, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { Anomaly, AnomalyCategory } from '../types/analytics';
import { formatCurrency } from '../utils/formatting';
import { StatusChip } from './SupportingComponents';

interface AnomalyDetectionPanelProps {
  anomalies: Anomaly[];
}

export default function AnomalyDetectionPanel({ anomalies }: AnomalyDetectionPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<AnomalyCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'open' | 'dismissed' | 'resolved'>('all');

  const filteredAnomalies = anomalies.filter(a => {
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    if (selectedStatus !== 'all' && a.status !== selectedStatus) return false;
    return true;
  });

  const getCategoryIcon = (category: AnomalyCategory) => {
    switch (category) {
      case 'transactional':
        return <DollarSign size={20} />;
      case 'behavioural':
        return <Users size={20} />;
      case 'operational':
        return <Package size={20} />;
      default:
        return <AlertTriangle size={20} />;
    }
  };

  const getCategoryColor = (category: AnomalyCategory) => {
    switch (category) {
      case 'transactional':
        return 'var(--sapAccentColor1)';
      case 'behavioural':
        return 'var(--sapAccentColor5)';
      case 'operational':
        return 'var(--sapAccentColor6)';
      default:
        return 'var(--sapContent_LabelColor)';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'var(--sapNegativeColor)';
      case 'medium':
        return 'var(--sapCriticalColor)';
      case 'low':
        return 'var(--sapInformativeColor)';
      default:
        return 'var(--sapContent_LabelColor)';
    }
  };

  const formatAnomalyValue = (value: any) => {
    if (typeof value === 'number') {
      return formatCurrency(value);
    }
    return String(value);
  };

  const summary = {
    total: anomalies.length,
    open: anomalies.filter(a => a.status === 'open').length,
    dismissed: anomalies.filter(a => a.status === 'dismissed').length,
    resolved: anomalies.filter(a => a.status === 'resolved').length,
    high: anomalies.filter(a => a.severity === 'high' && a.status === 'open').length,
    medium: anomalies.filter(a => a.severity === 'medium' && a.status === 'open').length,
    low: anomalies.filter(a => a.severity === 'low' && a.status === 'open').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Anomaly Detection
          </h2>
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Automated detection of unusual patterns and deviations
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Total Anomalies
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {summary.total}
          </div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Open
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapNegativeColor)' }}>
            {summary.open}
          </div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            High Severity
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapNegativeColor)' }}>
            {summary.high}
          </div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Resolved
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapPositiveColor)' }}>
            {summary.resolved}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Category
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
                  : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedCategory('transactional')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedCategory === 'transactional'
                  ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
                  : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
              }`}
            >
              Transactional
            </button>
            <button
              onClick={() => setSelectedCategory('behavioural')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedCategory === 'behavioural'
                  ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
                  : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
              }`}
            >
              Behavioural
            </button>
            <button
              onClick={() => setSelectedCategory('operational')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedCategory === 'operational'
                  ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
                  : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
              }`}
            >
              Operational
            </button>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Status
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedStatus('all')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedStatus === 'all'
                  ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
                  : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus('open')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedStatus === 'open'
                  ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
                  : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setSelectedStatus('dismissed')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedStatus === 'dismissed'
                  ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
                  : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
              }`}
            >
              Dismissed
            </button>
            <button
              onClick={() => setSelectedStatus('resolved')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                selectedStatus === 'resolved'
                  ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
                  : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
              }`}
            >
              Resolved
            </button>
          </div>
        </div>
      </div>

      {/* Anomaly List */}
      <div className="space-y-4">
        {filteredAnomalies.map((anomaly) => (
          <div 
            key={anomaly.id} 
            className="sap-card p-6"
            style={{ borderLeft: `4px solid ${getSeverityColor(anomaly.severity)}` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                <div 
                  className="p-2 rounded"
                  style={{ 
                    background: `${getCategoryColor(anomaly.category)}20`,
                    color: getCategoryColor(anomaly.category)
                  }}
                >
                  {getCategoryIcon(anomaly.category)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-base font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      {anomaly.title}
                    </h3>
                    <StatusChip 
                      status={anomaly.severity.charAt(0).toUpperCase() + anomaly.severity.slice(1)} 
                      type={
                        anomaly.severity === 'high' ? 'error' :
                        anomaly.severity === 'medium' ? 'warning' : 'info'
                      }
                    />
                    <StatusChip 
                      status={anomaly.status.charAt(0).toUpperCase() + anomaly.status.slice(1)} 
                      type={
                        anomaly.status === 'open' ? 'warning' :
                        anomaly.status === 'resolved' ? 'success' : 'neutral'
                      }
                    />
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {anomaly.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Baseline vs Actual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-3 rounded" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Baseline
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {anomaly.baseline}
                </div>
              </div>
              <div className="p-3 rounded" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Actual Value
                </div>
                <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {formatAnomalyValue(anomaly.actualValue)}
                </div>
              </div>
              <div className="p-3 rounded" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Deviation
                </div>
                <div className="text-sm font-bold" style={{ color: getSeverityColor(anomaly.severity) }}>
                  {anomaly.deviation}
                  {anomaly.deviationPercent && ` (${anomaly.deviationPercent}%)`}
                </div>
              </div>
            </div>

            {/* Entity Info */}
            {anomaly.entityNumber && (
              <div className="mb-4 p-3 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
                <div className="flex items-center gap-2">
                  <Clock size={16} style={{ color: 'var(--sapInformativeColor)' }} />
                  <div className="text-sm">
                    <span style={{ color: 'var(--sapContent_LabelColor)' }}>Related: </span>
                    <a 
                      href={`/${anomaly.entityType}/${anomaly.entityId}`}
                      className="font-semibold hover:underline"
                      style={{ color: 'var(--sapLinkColor)' }}
                    >
                      {anomaly.entityNumber}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            {anomaly.status === 'open' && (
              <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <button
                  className="px-4 py-2 rounded text-sm font-medium"
                  style={{
                    background: 'var(--sapButton_Emphasized_Background)',
                    color: 'var(--sapButton_Emphasized_TextColor)'
                  }}
                >
                  Investigate
                </button>
                <button
                  className="px-4 py-2 rounded text-sm font-medium"
                  style={{
                    background: 'var(--sapButton_Background)',
                    color: 'var(--sapButton_TextColor)',
                    border: '1px solid var(--sapButton_BorderColor)'
                  }}
                >
                  Dismiss
                </button>
                <button
                  className="px-4 py-2 rounded text-sm font-medium"
                  style={{
                    background: 'var(--sapButton_Background)',
                    color: 'var(--sapButton_TextColor)',
                    border: '1px solid var(--sapButton_BorderColor)'
                  }}
                >
                  Mark Resolved
                </button>
              </div>
            )}

            {anomaly.status === 'dismissed' && anomaly.dismissalReason && (
              <div className="mt-4 p-3 rounded" style={{ background: 'var(--sapNeutralBackground)' }}>
                <div className="text-xs font-semibold mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Dismissal Reason
                </div>
                <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  {anomaly.dismissalReason}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAnomalies.length === 0 && (
        <div className="sap-card p-8 text-center">
          <CheckCircle2 size={48} className="mx-auto mb-4" style={{ color: 'var(--sapPositiveColor)' }} />
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            No anomalies found for the selected filters
          </p>
        </div>
      )}
    </div>
  );
}
