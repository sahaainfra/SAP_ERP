/**
 * Report Builder Component - Part 8
 * 
 * User-configurable report builder without SQL access
 */

import { useState } from 'react';
import { FileText, Plus, Edit2, Trash2, Download, Play, Save, Filter, Columns } from 'lucide-react';
import type { ReportDefinition, ReportDataSource } from '../types/analytics';
import { standardReports } from '../data/analyticsData';
import SmartTable from './SmartTable';

export default function ReportBuilder() {
  const [reports, setReports] = useState<ReportDefinition[]>(standardReports);
  const [selectedReport, setSelectedReport] = useState<ReportDefinition | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateReport = () => {
    setShowCreateModal(true);
  };

  const handleEditReport = (report: ReportDefinition) => {
    setSelectedReport(report);
    setIsEditing(true);
  };

  const handleDeleteReport = (reportId: number) => {
    if (confirm('Are you sure you want to delete this report?')) {
      setReports(reports.filter(r => r.id !== reportId));
    }
  };

  const handleRunReport = (report: ReportDefinition) => {
    console.log('Running report:', report.name);
    // In production, this would call the API to run the report
  };

  const handleExportReport = (report: ReportDefinition, format: 'csv' | 'xlsx' | 'pdf') => {
    console.log(`Exporting report: ${report.name} as ${format}`);
    // In production, this would call the API to export the report
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Report Builder
          </h1>
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Create and manage custom reports without SQL
          </p>
        </div>
        <button
          onClick={handleCreateReport}
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{
            background: 'var(--sapButton_Emphasized_Background)',
            color: 'var(--sapButton_Emphasized_TextColor)'
          }}
        >
          <Plus size={16} />
          Create Report
        </button>
      </div>

      {/* Report List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <div key={report.id} className="sap-card p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <FileText size={24} style={{ color: 'var(--sapAccentColor6)' }} />
                <div>
                  <h3 className="text-base font-semibold mb-1" style={{ color: 'var(--sapTextColor)' }}>
                    {report.name}
                  </h3>
                  {report.description && (
                    <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {report.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Data Source
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                {report.dataSource.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                <Columns size={12} />
                <span>{report.columns.length} columns</span>
              </div>
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                <Filter size={12} />
                <span>{report.filters.length} filters</span>
              </div>
              {report.isShared && (
                <div className="text-xs px-2 py-0.5 rounded" style={{ background: 'var(--sapInformationBackground)', color: 'var(--sapInformativeTextColor)' }}>
                  Shared
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleRunReport(report)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded text-sm font-medium"
                style={{
                  background: 'var(--sapButton_Emphasized_Background)',
                  color: 'var(--sapButton_Emphasized_TextColor)'
                }}
              >
                <Play size={14} />
                Run
              </button>
              <button
                onClick={() => handleEditReport(report)}
                className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                title="Edit"
              >
                <Edit2 size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
              </button>
              <button
                onClick={() => handleExportReport(report, 'xlsx')}
                className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                title="Export"
              >
                <Download size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
              </button>
              <button
                onClick={() => handleDeleteReport(report.id)}
                className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                title="Delete"
              >
                <Trash2 size={16} style={{ color: 'var(--sapNegativeColor)' }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Report Preview Modal */}
      {selectedReport && !isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="sap-card max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {selectedReport.name}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportReport(selectedReport, 'xlsx')}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                  style={{
                    background: 'var(--sapButton_Background)',
                    color: 'var(--sapButton_TextColor)',
                    border: '1px solid var(--sapButton_BorderColor)'
                  }}
                >
                  <Download size={16} />
                  Export
                </button>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              {/* Mock table data */}
              <SmartTable
                columns={selectedReport.columns.map(col => ({
                  key: col.field,
                  label: col.label,
                  type: col.type === 'currency' ? 'currency' : col.type === 'date' ? 'date' : 'text',
                  sortable: true,
                  filterable: true
                }))}
                data={[
                  { id: 1, projectCode: 'PRJ-001', projectName: 'Metro Line Extension', progressPercent: 68, budget: 2450000000, actualCost: 1720000000, variance: -70000000, status: 'active' },
                  { id: 2, projectCode: 'PRJ-002', projectName: 'Highway Bridge', progressPercent: 45, budget: 890000000, actualCost: 420000000, variance: -20000000, status: 'active' },
                  { id: 3, projectCode: 'PRJ-003', projectName: 'Commercial Tower', progressPercent: 82, budget: 1560000000, actualCost: 1280000000, variance: 15000000, status: 'active' }
                ]}
                totalCount={3}
                page={1}
                pageSize={50}
                filters={[]}
                sort={[]}
                onPageChange={() => {}}
                onPageSizeChange={() => {}}
                onFilterChange={() => {}}
                onSortChange={() => {}}
                views={[]}
                onViewChange={() => {}}
                onViewSave={() => {}}
                onExport={() => {}}
              />
            </div>
          </div>
        </div>
      )}

      {/* Create Report Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="sap-card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                Create New Report
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Report Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter report name"
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      background: 'var(--sapField_Background)',
                      borderColor: 'var(--sapField_BorderColor)',
                      color: 'var(--sapField_TextColor)'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Description
                  </label>
                  <textarea
                    placeholder="Enter report description"
                    rows={3}
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      background: 'var(--sapField_Background)',
                      borderColor: 'var(--sapField_BorderColor)',
                      color: 'var(--sapField_TextColor)'
                    }}
                  />
                </div>

                {/* Data Source */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Data Source
                  </label>
                  <select
                    className="w-full px-3 py-2 rounded border"
                    style={{
                      background: 'var(--sapField_Background)',
                      borderColor: 'var(--sapField_BorderColor)',
                      color: 'var(--sapField_TextColor)'
                    }}
                  >
                    <option value="">Select data source...</option>
                    <option value="projects">Projects</option>
                    <option value="purchase_orders">Purchase Orders</option>
                    <option value="vendors">Vendors</option>
                    <option value="stock">Stock</option>
                    <option value="ra_bills">RA Bills</option>
                    <option value="receivables">Receivables</option>
                    <option value="payables">Payables</option>
                    <option value="attendance">Attendance</option>
                    <option value="plant">Plant & Equipment</option>
                    <option value="quality">Quality</option>
                    <option value="safety">Safety</option>
                  </select>
                </div>

                {/* Columns */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Columns
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 rounded" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="flex-1 text-sm" style={{ color: 'var(--sapTextColor)' }}>Project Code</span>
                      <select className="px-2 py-1 rounded border text-sm" style={{ background: 'var(--sapField_Background)', borderColor: 'var(--sapField_BorderColor)', color: 'var(--sapField_TextColor)' }}>
                        <option>Text</option>
                        <option>Number</option>
                        <option>Currency</option>
                        <option>Date</option>
                        <option>Percent</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="flex-1 text-sm" style={{ color: 'var(--sapTextColor)' }}>Project Name</span>
                      <select className="px-2 py-1 rounded border text-sm" style={{ background: 'var(--sapField_Background)', borderColor: 'var(--sapField_BorderColor)', color: 'var(--sapField_TextColor)' }}>
                        <option>Text</option>
                        <option>Number</option>
                        <option>Currency</option>
                        <option>Date</option>
                        <option>Percent</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
                      <input type="checkbox" defaultChecked className="rounded" />
                      <span className="flex-1 text-sm" style={{ color: 'var(--sapTextColor)' }}>Budget</span>
                      <select className="px-2 py-1 rounded border text-sm" style={{ background: 'var(--sapField_Background)', borderColor: 'var(--sapField_BorderColor)', color: 'var(--sapField_TextColor)' }}>
                        <option>Text</option>
                        <option>Number</option>
                        <option selected>Currency</option>
                        <option>Date</option>
                        <option>Percent</option>
                      </select>
                    </div>
                  </div>
                  <button className="mt-2 flex items-center gap-2 text-sm" style={{ color: 'var(--sapLinkColor)' }}>
                    <Plus size={14} />
                    Add Column
                  </button>
                </div>

                {/* Filters */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Filters
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 rounded" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
                      <select className="px-2 py-1 rounded border text-sm flex-1" style={{ background: 'var(--sapField_Background)', borderColor: 'var(--sapField_BorderColor)', color: 'var(--sapField_TextColor)' }}>
                        <option>Status</option>
                        <option>Project</option>
                        <option>Date</option>
                      </select>
                      <select className="px-2 py-1 rounded border text-sm" style={{ background: 'var(--sapField_Background)', borderColor: 'var(--sapField_BorderColor)', color: 'var(--sapField_TextColor)' }}>
                        <option>Equals</option>
                        <option>Contains</option>
                        <option>Greater than</option>
                        <option>Less than</option>
                        <option>Between</option>
                      </select>
                      <input type="text" placeholder="Value" className="px-2 py-1 rounded border text-sm flex-1" style={{ background: 'var(--sapField_Background)', borderColor: 'var(--sapField_BorderColor)', color: 'var(--sapField_TextColor)' }} />
                      <label className="flex items-center gap-1 text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        <input type="checkbox" className="rounded" />
                        Runtime
                      </label>
                    </div>
                  </div>
                  <button className="mt-2 flex items-center gap-2 text-sm" style={{ color: 'var(--sapLinkColor)' }}>
                    <Plus size={14} />
                    Add Filter
                  </button>
                </div>

                {/* Visualization */}
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Visualization
                  </label>
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 rounded text-sm font-medium" style={{ background: 'var(--sapSelectedColor)', color: 'white' }}>
                      Table
                    </button>
                    <button className="flex-1 px-4 py-2 rounded text-sm font-medium" style={{ background: 'var(--sapButton_Background)', color: 'var(--sapButton_TextColor)', border: '1px solid var(--sapButton_BorderColor)' }}>
                      Chart
                    </button>
                    <button className="flex-1 px-4 py-2 rounded text-sm font-medium" style={{ background: 'var(--sapButton_Background)', color: 'var(--sapButton_TextColor)', border: '1px solid var(--sapButton_BorderColor)' }}>
                      Both
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded text-sm font-medium"
                style={{
                  background: 'var(--sapButton_Background)',
                  color: 'var(--sapButton_TextColor)',
                  border: '1px solid var(--sapButton_BorderColor)'
                }}
              >
                Cancel
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
                style={{
                  background: 'var(--sapButton_Emphasized_Background)',
                  color: 'var(--sapButton_Emphasized_TextColor)'
                }}
              >
                <Save size={16} />
                Save Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
