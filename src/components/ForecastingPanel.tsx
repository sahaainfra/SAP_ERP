/**
 * Forecasting Component - Part 8
 * 
 * Displays various forecasts with methods, inputs, confidence levels, and ranges
 */

import { useState } from 'react';
import { TrendingUp, Calendar, DollarSign, Package, Users, AlertCircle, Info } from 'lucide-react';
import type { Forecast, ForecastType } from '../types/analytics';
import { formatCurrency, formatDate } from '../utils/formatting';
import { StatusChip } from './SupportingComponents';

interface ForecastingPanelProps {
  forecasts: Forecast[];
}

export default function ForecastingPanel({ forecasts }: ForecastingPanelProps) {
  const [selectedType, setSelectedType] = useState<ForecastType | 'all'>('all');

  const filteredForecasts = selectedType === 'all' 
    ? forecasts 
    : forecasts.filter(f => f.type === selectedType);

  const getForecastIcon = (type: ForecastType) => {
    switch (type) {
      case 'completion_date':
        return <Calendar size={20} />;
      case 'cost_at_completion':
        return <DollarSign size={20} />;
      case 'cash_inflow':
      case 'cash_outflow':
        return <TrendingUp size={20} />;
      case 'material_requirement':
        return <Package size={20} />;
      case 'manpower_requirement':
        return <Users size={20} />;
      default:
        return <TrendingUp size={20} />;
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'var(--sapPositiveColor)';
      case 'medium':
        return 'var(--sapCriticalColor)';
      case 'low':
        return 'var(--sapNegativeColor)';
      default:
        return 'var(--sapContent_LabelColor)';
    }
  };

  const formatForecastValue = (forecast: Forecast) => {
    if (forecast.unit === 'date') {
      return formatDate(forecast.pointEstimate as string);
    } else if (forecast.unit === 'INR') {
      return formatCurrency(forecast.pointEstimate as number);
    } else {
      return `${forecast.pointEstimate} ${forecast.unit}`;
    }
  };

  const formatRange = (forecast: Forecast) => {
    if (!forecast.rangeLow || !forecast.rangeHigh) return null;

    if (forecast.unit === 'date') {
      return `${formatDate(forecast.rangeLow as string)} - ${formatDate(forecast.rangeHigh as string)}`;
    } else if (forecast.unit === 'INR') {
      return `${formatCurrency(forecast.rangeLow as number)} - ${formatCurrency(forecast.rangeHigh as number)}`;
    } else {
      return `${forecast.rangeLow} - ${forecast.rangeHigh} ${forecast.unit}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Forecasting & Predictions
          </h2>
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Data-driven forecasts with confidence levels and ranges
          </p>
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
          All Forecasts
        </button>
        <button
          onClick={() => setSelectedType('completion_date')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            selectedType === 'completion_date'
              ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
              : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
          }`}
        >
          Completion Date
        </button>
        <button
          onClick={() => setSelectedType('cost_at_completion')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            selectedType === 'cost_at_completion'
              ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
              : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
          }`}
        >
          Cost at Completion
        </button>
        <button
          onClick={() => setSelectedType('cash_inflow')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            selectedType === 'cash_inflow'
              ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
              : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
          }`}
        >
          Cash Flow
        </button>
        <button
          onClick={() => setSelectedType('material_requirement')}
          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
            selectedType === 'material_requirement'
              ? 'bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)]'
              : 'bg-[var(--sapButton_Background)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]'
          }`}
        >
          Material Requirements
        </button>
      </div>

      {/* Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredForecasts.map((forecast) => (
          <div key={forecast.id} className="sap-card p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div 
                  className="p-3 rounded"
                  style={{ background: 'var(--sapAccentColor7)', color: 'white' }}
                >
                  {getForecastIcon(forecast.type)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--sapTextColor)' }}>
                    {forecast.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Horizon: {forecast.horizon}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Confidence
                </div>
                <div 
                  className="text-sm font-bold"
                  style={{ color: getConfidenceColor(forecast.confidence) }}
                >
                  {forecast.confidence.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Point Estimate */}
            <div className="mb-4 p-4 rounded" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
              <div className="text-xs mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Point Estimate
              </div>
              <div className="text-3xl font-bold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                {formatForecastValue(forecast)}
              </div>
              {forecast.rangeLow && forecast.rangeHigh && (
                <div className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Range: {formatRange(forecast)}
                </div>
              )}
            </div>

            {/* Method */}
            <div className="mb-4">
              <div className="flex items-start gap-2 mb-2">
                <Info size={16} style={{ color: 'var(--sapInformativeColor)' }} />
                <div>
                  <div className="text-sm font-semibold mb-1" style={{ color: 'var(--sapTextColor)' }}>
                    {forecast.methodName}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {forecast.methodDescription}
                  </div>
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="mb-4">
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Key Inputs
              </div>
              <div className="space-y-2">
                {forecast.inputs.map((input, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--sapContent_LabelColor)' }}>{input.name}</span>
                    <span style={{ color: 'var(--sapTextColor)' }}>
                      {typeof input.value === 'number' && forecast.unit === 'INR' 
                        ? formatCurrency(input.value, { compact: true })
                        : input.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence Reason */}
            <div className="p-3 rounded" style={{ background: 'var(--sapInformationBackground)' }}>
              <div className="flex items-start gap-2">
                <AlertCircle size={16} style={{ color: 'var(--sapInformativeColor)' }} />
                <div className="text-xs" style={{ color: 'var(--sapTextColor)' }}>
                  {forecast.confidenceReason}
                </div>
              </div>
            </div>

            {/* Computed At */}
            <div className="mt-4 text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Computed: {formatDate(forecast.computedAt)}
            </div>
          </div>
        ))}
      </div>

      {filteredForecasts.length === 0 && (
        <div className="sap-card p-8 text-center">
          <TrendingUp size={48} className="mx-auto mb-4" style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            No forecasts available for the selected type
          </p>
        </div>
      )}
    </div>
  );
}
