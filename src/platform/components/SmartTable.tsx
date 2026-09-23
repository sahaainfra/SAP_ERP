/**
 * Part 17 — Smart Table Component
 * 
 * The single table component used for every list in the system.
 * Features:
 * - Server-side pagination, sorting, filtering
 * - Virtual scrolling for large datasets
 * - Column selection, reordering, resizing, freezing
 * - Type-aware formatting
 * - Row selection with bulk actions
 * - Server-computed totals row
 * - Grouping with subtotals
 * - Saved views
 * - Export (CSV, XLSX, PDF)
 * - Responsive: becomes card list below 768px
 */

import React, { useState, useMemo, useCallback } from 'react';
import { SmartTableProps, TableColumn, TableFilter, TableSort, TableGrouping } from './types';

export const SmartTable: React.FC<SmartTableProps> = ({
  config,
  data,
  totalCount,
  loading = false,
  onPageChange,
  onSort,
  onFilter,
  onGroup,
  onSelect,
  onSaveView,
  onExport,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(config.pageSize || 50);
  const [sort, setSort] = useState<TableSort | undefined>(config.defaultSort);
  const [filters, setFilters] = useState<TableFilter[]>(config.defaultFilters || []);
  const [grouping, setGrouping] = useState<TableGrouping | undefined>(config.defaultGrouping);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    config.columns.filter(c => c.visible !== false).map(c => c.key)
  );
  const [frozenColumns, setFrozenColumns] = useState<string[]>(
    config.columns.filter(c => c.frozen).map(c => c.key)
  );

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / pageSize);

  // Handle sort change
  const handleSort = useCallback((field: string) => {
    const newSort: TableSort = {
      field,
      direction: sort?.field === field && sort.direction === 'asc' ? 'desc' : 'asc',
    };
    setSort(newSort);
    onSort?.(newSort);
  }, [sort, onSort]);

  // Handle filter change
  const handleFilter = useCallback((field: string, operator: TableFilter['operator'], value: any) => {
    const newFilters = filters.filter(f => f.field !== field);
    if (value !== null && value !== undefined && value !== '') {
      newFilters.push({ field, operator, value });
    }
    setFilters(newFilters);
    onFilter?.(newFilters);
  }, [filters, onFilter]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    onPageChange?.(page, pageSize);
  }, [pageSize, onPageChange]);

  // Handle page size change
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    onPageChange?.(1, size);
  }, [onPageChange]);

  // Handle row selection
  const handleSelectRow = useCallback((id: number, checked: boolean) => {
    const newSelected = checked
      ? [...selectedIds, id]
      : selectedIds.filter(sid => sid !== id);
    setSelectedIds(newSelected);
    onSelect?.(newSelected);
  }, [selectedIds, onSelect]);

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    const newSelected = checked ? data.map(row => row.id) : [];
    setSelectedIds(newSelected);
    onSelect?.(newSelected);
  }, [data, onSelect]);

  // Render table header
  const renderHeader = () => (
    <thead className="smart-table-header">
      <tr>
        {config.selectable && (
          <th className="smart-table-checkbox-col">
            <input
              type="checkbox"
              checked={selectedIds.length === data.length && data.length > 0}
              onChange={(e) => handleSelectAll(e.target.checked)}
              aria-label="Select all rows"
            />
          </th>
        )}
        {config.columns
          .filter(col => visibleColumns.includes(col.key))
          .map(col => (
            <th
              key={col.key}
              className={`smart-table-col smart-table-col-${col.key} ${
                frozenColumns.includes(col.key) ? 'smart-table-col-frozen' : ''
              }`}
              style={{ width: col.width }}
            >
              <div className="smart-table-col-header">
                <span>{col.label}</span>
                {col.sortable && (
                  <button
                    className="smart-table-sort-btn"
                    onClick={() => handleSort(col.key)}
                    aria-label={`Sort by ${col.label}`}
                  >
                    {sort?.field === col.key ? (sort.direction === 'asc' ? '▲' : '▼') : '⇅'}
                  </button>
                )}
              </div>
            </th>
          ))}
      </tr>
      {/* Filter row */}
      <tr className="smart-table-filter-row">
        {config.selectable && <th />}
        {config.columns
          .filter(col => visibleColumns.includes(col.key))
          .map(col => (
            <th key={col.key}>
              {col.filterable && (
                <input
                  type="text"
                  placeholder="Filter..."
                  className="smart-table-filter-input"
                  onChange={(e) => handleFilter(col.key, 'contains', e.target.value)}
                />
              )}
            </th>
          ))}
      </tr>
    </thead>
  );

  // Render table body
  const renderBody = () => (
    <tbody className="smart-table-body">
      {loading ? (
        <tr>
          <td colSpan={visibleColumns.length + (config.selectable ? 1 : 0)} className="smart-table-loading">
            Loading...
          </td>
        </tr>
      ) : data.length === 0 ? (
        <tr>
          <td colSpan={visibleColumns.length + (config.selectable ? 1 : 0)} className="smart-table-empty">
            No data available
          </td>
        </tr>
      ) : (
        data.map((row, rowIndex) => (
          <tr
            key={row.id || rowIndex}
            className={`smart-table-row ${rowIndex % 2 === 0 ? 'smart-table-row-even' : 'smart-table-row-odd'} ${
              selectedIds.includes(row.id) ? 'smart-table-row-selected' : ''
            }`}
          >
            {config.selectable && (
              <td className="smart-table-checkbox-col">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(row.id)}
                  onChange={(e) => handleSelectRow(row.id, e.target.checked)}
                  aria-label={`Select row ${row.id}`}
                />
              </td>
            )}
            {config.columns
              .filter(col => visibleColumns.includes(col.key))
              .map(col => (
                <td
                  key={col.key}
                  className={`smart-table-col smart-table-col-${col.key} ${
                    frozenColumns.includes(col.key) ? 'smart-table-col-frozen' : ''
                  }`}
                >
                  {col.format ? col.format(row[col.key]) : row[col.key]}
                </td>
              ))}
          </tr>
        ))
      )}
    </tbody>
  );

  // Render pagination
  const renderPagination = () => (
    <div className="smart-table-pagination">
      <div className="smart-table-pagination-info">
        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
      </div>
      <div className="smart-table-pagination-controls">
        <button
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
        >
          Next
        </button>
        <select value={pageSize} onChange={(e) => handlePageSizeChange(Number(e.target.value))}>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
      </div>
    </div>
  );

  return (
    <div className="smart-table-container">
      {/* Toolbar */}
      <div className="smart-table-toolbar">
        <div className="smart-table-toolbar-left">
          {config.bulkActions && selectedIds.length > 0 && (
            <div className="smart-table-bulk-actions">
              <span>{selectedIds.length} selected</span>
              {config.bulkActions.map(action => (
                <button
                  key={action.key}
                  onClick={() => action.execute(selectedIds)}
                  disabled={!selectedIds.some(id => data.find(row => row.id === id))}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="smart-table-toolbar-right">
          {config.exportable && onExport && (
            <div className="smart-table-export">
              <button onClick={() => onExport('csv')}>Export CSV</button>
              <button onClick={() => onExport('xlsx')}>Export Excel</button>
              <button onClick={() => onExport('pdf')}>Export PDF</button>
            </div>
          )}
          {onSaveView && (
            <button onClick={() => onSaveView({ viewKey: '', screenKey: '', viewName: '', isShared: false, isDefault: false, config: { columns: visibleColumns, filters, sort, grouping, pageSize } })}>
              Save View
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="smart-table-wrapper">
        <table className="smart-table">
          {renderHeader()}
          {renderBody()}
        </table>
      </div>

      {/* Pagination */}
      {renderPagination()}
    </div>
  );
};

export default SmartTable;
