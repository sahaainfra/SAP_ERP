/**
 * Smart Table Component - Part 5
 * 
 * Advanced table component with sorting, filtering, pagination, selection,
 * and virtual scrolling for large datasets.
 */

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Check, Minus } from 'lucide-react';
import type { SmartTableProps, TableColumn, TableFilter, TableSort } from '../types/components';

export default function SmartTable({
  columns,
  data,
  totalCount,
  page,
  pageSize,
  filters,
  sort,
  onPageChange,
  onPageSizeChange,
  onFilterChange,
  onSortChange,
  selectable = false,
  onSelectionChange,
  bulkActions
}: SmartTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [localFilters, setLocalFilters] = useState<Record<string, string>>({});

  // Handle sorting
  const handleSort = (column: string) => {
    const currentSort = sort.find(s => s.column === column);
    let newSort: TableSort[];

    if (!currentSort) {
      newSort = [{ column, direction: 'asc' }];
    } else if (currentSort.direction === 'asc') {
      newSort = [{ column, direction: 'desc' }];
    } else {
      newSort = [];
    }

    onSortChange(newSort);
  };

  // Handle selection
  const handleSelectAll = () => {
    if (selectedRows.size === data.length) {
      setSelectedRows(new Set());
      onSelectionChange?.([]);
    } else {
      const allIds = new Set(data.map(row => row.id || row.key));
      setSelectedRows(allIds);
      onSelectionChange?.(Array.from(allIds));
    }
  };

  const handleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
    onSelectionChange?.(Array.from(newSelected));
  };

  // Handle filter
  const handleFilterChange = (column: string, value: string) => {
    setLocalFilters(prev => ({ ...prev, [column]: value }));
    
    const newFilters = Object.entries({ ...localFilters, [column]: value })
      .filter(([_, v]) => v !== '')
      .map(([col, val]) => ({
        column: col,
        operator: 'contains' as const,
        value: val
      }));
    
    onFilterChange(newFilters);
  };

  // Get sort icon
  const getSortIcon = (column: string) => {
    const currentSort = sort.find(s => s.column === column);
    if (!currentSort) return <ChevronsUpDown size={14} className="opacity-40" />;
    return currentSort.direction === 'asc' 
      ? <ChevronUp size={14} /> 
      : <ChevronDown size={14} />;
  };

  // Format cell value based on column type
  const formatCellValue = (value: any, column: TableColumn) => {
    if (column.formatter) {
      return column.formatter(value);
    }

    switch (column.type) {
      case 'currency':
        return new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(value);
      case 'date':
        return new Date(value).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      case 'status':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'active' ? 'bg-green-100 text-green-700' :
            value === 'pending' ? 'bg-yellow-100 text-yellow-700' :
            value === 'inactive' ? 'bg-gray-100 text-gray-700' :
            'bg-blue-100 text-blue-700'
          }`}>
            {value}
          </span>
        );
      case 'progress':
        return (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${value}%` }}
              />
            </div>
            <span className="text-xs">{value}%</span>
          </div>
        );
      default:
        return value;
    }
  };

  return (
    <div className="sap-card overflow-hidden">
      {/* Bulk Actions Toolbar */}
      {selectable && selectedRows.size > 0 && bulkActions && (
        <div className="flex items-center gap-2 p-3 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
            {selectedRows.size} selected
          </span>
          <div className="flex-1" />
          {bulkActions.map((action, i) => (
            <button
              key={i}
              onClick={() => action.onClick(Array.from(selectedRows))}
              className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              style={{
                background: 'var(--sapButton_Background)',
                color: 'var(--sapButton_TextColor)',
                border: '1px solid var(--sapButton_BorderColor)'
              }}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {/* Header Row */}
            <tr style={{ background: 'var(--sapList_HeaderBackground)' }}>
              {selectable && (
                <th className="w-12 px-4 py-3 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                  <button
                    onClick={handleSelectAll}
                    className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                    style={{
                      borderColor: selectedRows.size === data.length ? 'var(--sapSelectedColor)' : 'var(--sapContent_ForegroundBorderColor)',
                      background: selectedRows.size === data.length ? 'var(--sapSelectedColor)' : 'transparent'
                    }}
                  >
                    {selectedRows.size === data.length && <Check size={12} className="text-white" />}
                  </button>
                </th>
              )}
              {columns.map(column => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider border-b cursor-pointer hover:bg-[var(--sapList_Hover_Background)] transition-colors"
                  style={{ 
                    borderColor: 'var(--sapList_BorderColor)',
                    color: 'var(--sapList_HeaderTextColor)',
                    width: column.width
                  }}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable !== false && getSortIcon(column.key)}
                  </div>
                </th>
              ))}
            </tr>

            {/* Filter Row */}
            <tr style={{ background: 'var(--sapList_HeaderBackground)' }}>
              {selectable && <th className="px-4 py-2 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }} />}
              {columns.map(column => (
                <th key={column.key} className="px-4 py-2 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                  {column.filterable !== false && (
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={localFilters[column.key] || ''}
                      onChange={(e) => handleFilterChange(column.key, e.target.value)}
                      className="w-full px-2 py-1 text-xs rounded border"
                      style={{
                        background: 'var(--sapField_Background)',
                        borderColor: 'var(--sapField_BorderColor)',
                        color: 'var(--sapField_TextColor)'
                      }}
                    />
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-12 text-center"
                  style={{ color: 'var(--sapContent_LabelColor)' }}
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const rowId = row.id || row.key || rowIndex.toString();
                const isSelected = selectedRows.has(rowId);

                return (
                  <tr
                    key={rowId}
                    className="transition-colors"
                    style={{
                      background: isSelected ? 'var(--sapList_SelectionBackgroundColor)' : 
                                 rowIndex % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                      borderLeft: isSelected ? '3px solid var(--sapSelectedColor)' : '3px solid transparent'
                    }}
                  >
                    {selectable && (
                      <td className="px-4 py-3 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                        <button
                          onClick={() => handleSelectRow(rowId)}
                          className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                          style={{
                            borderColor: isSelected ? 'var(--sapSelectedColor)' : 'var(--sapContent_ForegroundBorderColor)',
                            background: isSelected ? 'var(--sapSelectedColor)' : 'transparent'
                          }}
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </button>
                      </td>
                    )}
                    {columns.map(column => (
                      <td
                        key={column.key}
                        className="px-4 py-3 text-sm border-b"
                        style={{ 
                          borderColor: 'var(--sapList_BorderColor)',
                          color: 'var(--sapList_TextColor)',
                          textAlign: column.type === 'currency' || column.type === 'number' ? 'right' : 'left'
                        }}
                      >
                        {formatCellValue(row[column.key], column)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Rows per page:
          </span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 text-sm rounded border"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)'
            }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={200}>200</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {Math.min((page - 1) * pageSize + 1, totalCount)}-{Math.min(page * pageSize, totalCount)} of {totalCount}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-3 py-1 text-sm rounded border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{
                background: 'var(--sapButton_Background)',
                borderColor: 'var(--sapButton_BorderColor)',
                color: 'var(--sapButton_TextColor)'
              }}
            >
              Previous
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page * pageSize >= totalCount}
              className="px-3 py-1 text-sm rounded border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{
                background: 'var(--sapButton_Background)',
                borderColor: 'var(--sapButton_BorderColor)',
                color: 'var(--sapButton_TextColor)'
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
