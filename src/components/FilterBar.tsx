/**
 * Filter Bar Component - Part 5
 * 
 * Advanced filter bar with date ranges, multi-select, and fiscal year awareness.
 */

import { useState } from 'react';
import { X, Filter, ChevronDown } from 'lucide-react';
import type { FilterBarProps, FilterDefinition } from '../types/components';

export default function FilterBar({
  filters,
  activeFilters,
  onFilterChange,
  onClearAll
}: FilterBarProps) {
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Split filters into always visible and more filters
  const visibleFilters = filters.filter(f => f.alwaysVisible).slice(0, 4);
  const moreFilters = filters.filter(f => !f.alwaysVisible || filters.indexOf(f) >= 4);

  // Get fiscal year presets
  const getFiscalYearPresets = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Fiscal year starts in April (month 4)
    const fiscalYearStart = currentMonth >= 4 ? currentYear : currentYear - 1;
    const fiscalYearEnd = fiscalYearStart + 1;
    
    return [
      { label: 'This FY', value: `${fiscalYearStart}-04-01,${fiscalYearEnd}-03-31` },
      { label: 'Last FY', value: `${fiscalYearStart - 1}-04-01,${fiscalYearStart}-03-31` },
      { label: 'This Quarter', value: 'quarter' },
      { label: 'Last Quarter', value: 'last-quarter' },
      { label: 'This Month', value: 'month' },
      { label: 'Last 30 Days', value: '30' },
      { label: 'Last 60 Days', value: '60' },
      { label: 'Last 90 Days', value: '90' },
    ];
  };

  // Render filter control based on type
  const renderFilterControl = (filter: FilterDefinition) => {
    const value = activeFilters[filter.key];

    switch (filter.type) {
      case 'text':
        return (
          <input
            type="text"
            placeholder={filter.label}
            value={value || ''}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            className="px-3 py-2 text-sm rounded border"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
              minWidth: '150px'
            }}
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            className="px-3 py-2 text-sm rounded border"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
              minWidth: '150px'
            }}
          >
            <option value="">All {filter.label}</option>
            {filter.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );

      case 'multi-select':
        return (
          <div className="relative">
            <select
              multiple
              value={value || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, opt => opt.value);
                onFilterChange(filter.key, selected);
              }}
              className="px-3 py-2 text-sm rounded border"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)',
                minWidth: '150px',
                minHeight: '80px'
              }}
            >
              {filter.options?.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            className="px-3 py-2 text-sm rounded border"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
              minWidth: '150px'
            }}
          />
        );

      case 'date-range':
        const [startDate, endDate] = (value || '').split(',');
        return (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate || ''}
              onChange={(e) => onFilterChange(filter.key, `${e.target.value},${endDate || ''}`)}
              className="px-3 py-2 text-sm rounded border"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)'
              }}
            />
            <span style={{ color: 'var(--sapContent_LabelColor)' }}>to</span>
            <input
              type="date"
              value={endDate || ''}
              onChange={(e) => onFilterChange(filter.key, `${startDate || ''},${e.target.value}`)}
              className="px-3 py-2 text-sm rounded border"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)'
              }}
            />
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            placeholder={filter.label}
            value={value || ''}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            className="px-3 py-2 text-sm rounded border"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
              minWidth: '150px'
            }}
          />
        );

      case 'number-range':
        const [min, max] = (value || '').split(',');
        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={min || ''}
              onChange={(e) => onFilterChange(filter.key, `${e.target.value},${max || ''}`)}
              className="px-3 py-2 text-sm rounded border"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)',
                width: '100px'
              }}
            />
            <span style={{ color: 'var(--sapContent_LabelColor)' }}>to</span>
            <input
              type="number"
              placeholder="Max"
              value={max || ''}
              onChange={(e) => onFilterChange(filter.key, `${min || ''},${e.target.value}`)}
              className="px-3 py-2 text-sm rounded border"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)',
                width: '100px'
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Render active filter chips
  const renderFilterChips = () => {
    const activeCount = Object.values(activeFilters).filter(v => v !== '' && v !== null && v !== undefined).length;
    
    if (activeCount === 0) return null;

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
          {activeCount} filter{activeCount !== 1 ? 's' : ''} active
        </span>
        {Object.entries(activeFilters).map(([key, value]) => {
          if (!value || value === '' || (Array.isArray(value) && value.length === 0)) return null;
          
          const filter = filters.find(f => f.key === key);
          if (!filter) return null;

          const displayValue = Array.isArray(value) 
            ? `${value.length} selected`
            : typeof value === 'string' && value.includes(',')
            ? value.split(',').filter(v => v).join(' - ')
            : value;

          return (
            <span
              key={key}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'var(--sapInformationBackground)',
                color: 'var(--sapInformativeTextColor)'
              }}
            >
              {filter.label}: {displayValue}
              <button
                onClick={() => onFilterChange(key, '')}
                className="hover:opacity-70"
              >
                <X size={12} />
              </button>
            </span>
          );
        })}
        <button
          onClick={onClearAll}
          className="text-xs font-medium hover:underline"
          style={{ color: 'var(--sapLinkColor)' }}
        >
          Clear all
        </button>
      </div>
    );
  };

  return (
    <div className="sap-card p-4">
      {/* Filter Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: 'var(--sapContent_IconColor)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
            Filters
          </span>
        </div>

        {/* Visible Filters */}
        {visibleFilters.map(filter => (
          <div key={filter.key}>
            {renderFilterControl(filter)}
          </div>
        ))}

        {/* More Filters Button */}
        {moreFilters.length > 0 && (
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded border transition-colors"
            style={{
              background: 'var(--sapButton_Background)',
              borderColor: 'var(--sapButton_BorderColor)',
              color: 'var(--sapButton_TextColor)'
            }}
          >
            More filters
            <ChevronDown size={14} className={`transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* More Filters Panel */}
      {showMoreFilters && moreFilters.length > 0 && (
        <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" style={{ borderColor: 'var(--sapGroup_ContentBorderColor)' }}>
          {moreFilters.map(filter => (
            <div key={filter.key}>
              <label className="block text-xs font-medium mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {filter.label}
              </label>
              {renderFilterControl(filter)}
            </div>
          ))}
        </div>
      )}

      {/* Active Filter Chips */}
      {renderFilterChips() && (
        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--sapGroup_ContentBorderColor)' }}>
          {renderFilterChips()}
        </div>
      )}
    </div>
  );
}
