/**
 * Part 17 — Filter Bar Component
 * 
 * One filter bar component, used above every list and dashboard.
 * Features:
 * - First 4 filters always visible, rest behind "More filters"
 * - Active filters as removable chips
 * - Filter state reflected in URL
 * - Fiscal year awareness
 * - Cross-filtering from charts
 */

import React, { useState, useEffect } from 'react';
import { FilterBarProps, FilterField } from './types';

export const FilterBar: React.FC<FilterBarProps> = ({
  config,
  values,
  onChange,
  onClear,
  onSaveView,
}) => {
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  // Determine which filters are active
  useEffect(() => {
    const active = Object.entries(values)
      .filter(([_, value]) => value !== null && value !== undefined && value !== '')
      .map(([key, _]) => key);
    setActiveFilters(active);
  }, [values]);

  // Get visible filters (first N)
  const visibleFilters = config.fields.slice(0, config.maxVisibleFilters || 4);
  const hiddenFilters = config.fields.slice(config.maxVisibleFilters || 4);

  // Handle filter change
  const handleFilterChange = (key: string, value: any) => {
    onChange({ ...values, [key]: value });
  };

  // Handle filter removal
  const handleFilterRemove = (key: string) => {
    const newValues = { ...values };
    delete newValues[key];
    onChange(newValues);
  };

  // Handle clear all
  const handleClearAll = () => {
    onChange({});
    onClear?.();
  };

  // Render filter input based on type
  const renderFilterInput = (field: FilterField) => {
    const value = values[field.key];

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFilterChange(field.key, e.target.value)}
            placeholder={field.label}
            className="filter-bar-input"
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleFilterChange(field.key, e.target.value ? Number(e.target.value) : null)}
            placeholder={field.label}
            className="filter-bar-input"
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleFilterChange(field.key, e.target.value || null)}
            className="filter-bar-input"
          />
        );

      case 'date_range':
        return (
          <div className="filter-bar-date-range">
            <input
              type="date"
              value={value?.from || ''}
              onChange={(e) => handleFilterChange(field.key, { ...value, from: e.target.value })}
              placeholder="From"
              className="filter-bar-input"
            />
            <input
              type="date"
              value={value?.to || ''}
              onChange={(e) => handleFilterChange(field.key, { ...value, to: e.target.value })}
              placeholder="To"
              className="filter-bar-input"
            />
            {field.presets && (
              <select
                onChange={(e) => {
                  const preset = e.target.value;
                  if (preset) {
                    // Calculate date range based on preset
                    const now = new Date();
                    let from: Date;
                    const to = new Date();

                    switch (preset) {
                      case 'today':
                        from = new Date(now.setHours(0, 0, 0, 0));
                        break;
                      case 'this_week':
                        from = new Date(now);
                        from.setDate(now.getDate() - now.getDay());
                        break;
                      case 'this_month':
                        from = new Date(now.getFullYear(), now.getMonth(), 1);
                        break;
                      case 'this_quarter':
                        const quarter = Math.floor(now.getMonth() / 3);
                        from = new Date(now.getFullYear(), quarter * 3, 1);
                        break;
                      case 'this_fy':
                        // Financial year (April to March in India)
                        const fyStart = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
                        from = new Date(fyStart, 3, 1); // April 1st
                        break;
                      case 'last_30_days':
                        from = new Date(now);
                        from.setDate(now.getDate() - 30);
                        break;
                      case 'last_60_days':
                        from = new Date(now);
                        from.setDate(now.getDate() - 60);
                        break;
                      case 'last_90_days':
                        from = new Date(now);
                        from.setDate(now.getDate() - 90);
                        break;
                      default:
                        return;
                    }

                    handleFilterChange(field.key, {
                      from: from.toISOString().split('T')[0],
                      to: to.toISOString().split('T')[0],
                    });
                  }
                }}
                className="filter-bar-select"
              >
                <option value="">Presets</option>
                {field.presets.map(preset => (
                  <option key={preset} value={preset}>
                    {preset.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            )}
          </div>
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFilterChange(field.key, e.target.value || null)}
            className="filter-bar-select"
          >
            <option value="">All {field.label}</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'multi_select':
        return (
          <select
            multiple
            value={value || []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, opt => opt.value);
              handleFilterChange(field.key, selected.length > 0 ? selected : null);
            }}
            className="filter-bar-select filter-bar-select-multi"
          >
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'amount_range':
        return (
          <div className="filter-bar-amount-range">
            <input
              type="number"
              value={value?.min || ''}
              onChange={(e) => handleFilterChange(field.key, { ...value, min: e.target.value ? Number(e.target.value) : null })}
              placeholder="Min"
              className="filter-bar-input"
            />
            <input
              type="number"
              value={value?.max || ''}
              onChange={(e) => handleFilterChange(field.key, { ...value, max: e.target.value ? Number(e.target.value) : null })}
              placeholder="Max"
              className="filter-bar-input"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="filter-bar">
      {/* Visible filters */}
      <div className="filter-bar-visible">
        {visibleFilters.map(field => (
          <div key={field.key} className="filter-bar-field">
            <label className="filter-bar-label">{field.label}</label>
            {renderFilterInput(field)}
          </div>
        ))}

        {/* More filters button */}
        {hiddenFilters.length > 0 && (
          <button
            className="filter-bar-more-btn"
            onClick={() => setShowMoreFilters(!showMoreFilters)}
          >
            {showMoreFilters ? 'Less filters' : 'More filters'}
          </button>
        )}

        {/* Save view button */}
        {config.showSaveView && onSaveView && (
          <button
            className="filter-bar-save-btn"
            onClick={() => {
              const name = prompt('Enter view name:');
              if (name) {
                onSaveView(name);
              }
            }}
          >
            Save View
          </button>
        )}
      </div>

      {/* Hidden filters panel */}
      {showMoreFilters && (
        <div className="filter-bar-hidden">
          {hiddenFilters.map(field => (
            <div key={field.key} className="filter-bar-field">
              <label className="filter-bar-label">{field.label}</label>
              {renderFilterInput(field)}
            </div>
          ))}
        </div>
      )}

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="filter-bar-chips">
          <span className="filter-bar-chips-count">
            {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} active
          </span>
          {activeFilters.map(key => {
            const field = config.fields.find(f => f.key === key);
            if (!field) return null;
            return (
              <span key={key} className="filter-bar-chip">
                {field.label}: {JSON.stringify(values[key])}
                <button
                  className="filter-bar-chip-remove"
                  onClick={() => handleFilterRemove(key)}
                  aria-label={`Remove ${field.label} filter`}
                >
                  ×
                </button>
              </span>
            );
          })}
          {config.showClearAll && (
            <button
              className="filter-bar-clear-all"
              onClick={handleClearAll}
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
