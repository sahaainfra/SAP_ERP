/**
 * Intelligence Component - Part 8
 * 
 * Cross-module intelligence insights connecting different data sources
 */

import { useState } from 'react';
import { 
  Lightbulb, Package, Truck, DollarSign, Users, 
  HardHat, AlertTriangle, TrendingUp, ShoppingBag, 
  Clock, ArrowRight
} from 'lucide-react';
import type { Insight, InsightType } from '../types/analytics';
import { formatCurrency } from '../utils/formatting';
import { StatusChip } from './SupportingComponents';

interface IntelligencePanelProps {
  insights: Insight[];
}

export default function IntelligencePanel({ insights }: IntelligencePanelProps) {
  const [selectedType, setSelectedType] = useState<InsightType | 'all'>('all');
  const [expandedInsight, setExpandedInsight] = useState<number | null>(null);

  const filteredInsights = selectedType === 'all' 
    ? insights 
    : insights.filter(i => i.type === selectedType);

  const getInsightIcon = (type: InsightType) => {
    switch (type) {
      case 'material_availability':
        return <Package size={20} />;
      case 'procurement_lead_time':
        return <Truck size={20} />;
      case 'billing_gap':
        return <DollarSign size={20} />;
      case 'cost_per_unit':
        return <TrendingUp size={20} />;
      case 'manpower_productivity':
        return <Users size={20} />;
      case 'plant_idle':
        return <HardHat size={20} />;
      case 'quality_rework':
        return <AlertTriangle size={20} />;
      case 'vendor_performance':
        return <ShoppingBag size={20} />;
      case 'cash_gap':
        return <DollarSign size={20} />;
      case 'approval_delay':
        return <Clock size={20} />;
      default:
        return <Lightbulb size={20} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'var(--sapNegativeColor)';
      case 'warning':
        return 'var(--sapCriticalColor)';
      case 'info':
        return 'var(--sapInformativeColor)';
      default:
        return 'var(--sapContent_LabelColor)';
    }
  };

  const formatEvidenceValue = (value: any, unit?: string) => {
    if (unit === 'INR') {
      return formatCurrency(value);
    }
    return `${value}${unit ? ` ${unit}` : ''}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Cross-Module Intelligence
          </h2>
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            AI-powered insights connecting data across modules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Lightbulb size={20} style={{ color: 'var(--sapAccentColor7)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
            {insights.length} Active Insights
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            selectedType === 'all'
              ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
              : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
          }`}
        >
          All Insights
        </button>
        <button
          onClick={() => setSelectedType('material_availability')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            selectedType === 'material_availability'
              ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
              : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
          }`}
        >
          Material
        </button>
        <button
          onClick={() => setSelectedType('billing_gap')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            selectedType === 'billing_gap'
              ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
              : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
          }`}
        >
          Billing
        </button>
        <button
          onClick={() => setSelectedType('cost_per_unit')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            selectedType === 'cost_per_unit'
              ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
              : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
          }`}
        >
          Cost
        </button>
        <button
          onClick={() => setSelectedType('manpower_productivity')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            selectedType === 'manpower_productivity'
              ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
              : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
          }`}
        >
          Manpower
        </button>
        <button
          onClick={() => setSelectedType('vendor_performance')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            selectedType === 'vendor_performance'
              ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
              : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
          }`}
        >
          Vendors
        </button>
        <button
          onClick={() => setSelectedType('cash_gap')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            selectedType === 'cash_gap'
              ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
              : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
          }`}
        >
          Cash Flow
        </button>
      </div>

      {/* Insight Cards */}
      <div className="space-y-4">
        {filteredInsights.map((insight) => (
          <div 
            key={insight.id} 
            className="sap-card overflow-hidden"
            style={{ borderLeft: `4px solid ${getSeverityColor(insight.severity)}` }}
          >
            {/* Header */}
            <div 
              className="p-4 cursor-pointer hover:bg-[var(--sapList_Hover_Background)] transition-colors"
              onClick={() => setExpandedInsight(expandedInsight === insight.id ? null : insight.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div 
                    className="p-2 rounded"
                    style={{ 
                      background: `${getSeverityColor(insight.severity)}20`,
                      color: getSeverityColor(insight.severity)
                    }}
                  >
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                        {insight.title}
                      </h3>
                      <StatusChip 
                        status={insight.severity.charAt(0).toUpperCase() + insight.severity.slice(1)} 
                        type={
                          insight.severity === 'critical' ? 'error' :
                          insight.severity === 'warning' ? 'warning' : 'info'
                        }
                      />
                    </div>
                    <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {insight.finding}
                    </p>
                  </div>
                </div>
                <ArrowRight 
                  size={20} 
                  className="transition-transform"
                  style={{ 
                    color: 'var(--sapContent_LabelColor)',
                    transform: expandedInsight === insight.id ? 'rotate(90deg)' : 'rotate(0deg)'
                  }}
                />
              </div>
            </div>

            {/* Expanded Content */}
            {expandedInsight === insight.id && (
              <div className="px-4 pb-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                {/* Evidence */}
                <div className="mt-4 mb-4">
                  <div className="text-xs font-semibold mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Evidence
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {insight.evidence.map((item, index) => (
                      <div key={index} className="p-3 rounded" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
                        <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                          {item.label}
                        </div>
                        <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                          {formatEvidenceValue(item.value, item.unit)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Affected Records */}
                {insight.affectedRecords.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs font-semibold mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Affected Records
                    </div>
                    <div className="space-y-2">
                      {insight.affectedRecords.map((record, index) => (
                        <a
                          key={index}
                          href={record.route}
                          className="flex items-center justify-between p-3 rounded hover:bg-[var(--sapList_Hover_Background)] transition-colors"
                          style={{ background: 'var(--sapGroup_ContentBackground)' }}
                        >
                          <div>
                            <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                              {record.entityNumber}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                              {record.entityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          </div>
                          <ArrowRight size={16} style={{ color: 'var(--sapContent_LabelColor)' }} />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Action */}
                <div className="p-4 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
                  <div className="flex items-start gap-2 mb-2">
                    <Lightbulb size={16} style={{ color: 'var(--sapInformativeColor)' }} />
                    <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                      Recommended Action
                    </div>
                  </div>
                  <p className="text-sm mb-3" style={{ color: 'var(--sapTextColor)' }}>
                    {insight.recommendedAction}
                  </p>
                  <a
                    href={insight.actionRoute}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                    style={{
                      background: 'var(--sapButton_Emphasized_Background)',
                      color: 'var(--sapButton_Emphasized_TextColor)'
                    }}
                  >
                    Take Action
                    <ArrowRight size={16} />
                  </a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredInsights.length === 0 && (
        <div className="sap-card p-8 text-center">
          <Lightbulb size={48} className="mx-auto mb-4" style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            No insights available for the selected category
          </p>
        </div>
      )}
    </div>
  );
}
