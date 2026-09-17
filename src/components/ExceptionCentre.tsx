/**
 * Exception Centre Component - Part 7
 * 
 * Management view of all exceptions, ranked by impact
 */

import { useState } from 'react';
import { 
  AlertTriangle, DollarSign, Settings, Shield, Workflow,
  TrendingUp, Filter, Download, User, Calendar,
  CheckCircle2, Clock, ArrowRight
} from 'lucide-react';
import { exceptions } from '../data/workflowData';
import type { Exception, ExceptionCategory, ExceptionStatus } from '../types/workflow';
import { formatCurrency, formatDate } from '../utils/formatting';
import { StatusChip } from './SupportingComponents';
import Chart from './Chart';

type ExceptionView = 'list' | 'trend';

export default function ExceptionCentre() {
  const [currentView, setCurrentView] = useState<ExceptionView>('list');
  const [filterCategory, setFilterCategory] = useState<ExceptionCategory[]>([]);
  const [filterStatus, setFilterStatus] = useState<ExceptionStatus[]>([]);
  const [selectedException, setSelectedException] = useState<Exception | null>(null);

  // Filter exceptions
  const filteredExceptions = exceptions.filter(exc => {
    if (filterCategory.length > 0 && !filterCategory.includes(exc.category)) return false;
    if (filterStatus.length > 0 && !filterStatus.includes(exc.status)) return false;
    return true;
  });

  // Sort by impact (descending), then severity, then age
  const sortedExceptions = [...filteredExceptions].sort((a, b) => {
    // Sort by impact first
    const impactA = a.impact || 0;
    const impactB = b.impact || 0;
    if (impactA !== impactB) return impactB - impactA;

    // Then by age (older first)
    return b.age - a.age;
  });

  // Summary stats
  const stats = {
    total: exceptions.length,
    open: exceptions.filter(e => e.status === 'open').length,
    inProgress: exceptions.filter(e => e.status === 'in_progress' || e.status === 'assigned').length,
    resolved: exceptions.filter(e => e.status === 'resolved').length,
    totalImpact: exceptions.reduce((sum, e) => sum + (e.impact || 0), 0)
  };

  // Category breakdown
  const categoryBreakdown = {
    financial: exceptions.filter(e => e.category === 'financial').length,
    operational: exceptions.filter(e => e.category === 'operational').length,
    compliance: exceptions.filter(e => e.category === 'compliance').length,
    process: exceptions.filter(e => e.category === 'process').length
  };

  // Trend data (mock)
  const trendData = [
    { period: 'Week 1', raised: 8, resolved: 5 },
    { period: 'Week 2', raised: 12, resolved: 7 },
    { period: 'Week 3', raised: 6, resolved: 9 },
    { period: 'Week 4', raised: 10, resolved: 8 },
    { period: 'Week 5', raised: 15, resolved: 11 },
    { period: 'Week 6', raised: 9, resolved: 12 }
  ];

  const getCategoryIcon = (category: ExceptionCategory) => {
    switch (category) {
      case 'financial': return <DollarSign size={16} />;
      case 'operational': return <Settings size={16} />;
      case 'compliance': return <Shield size={16} />;
      case 'process': return <Workflow size={16} />;
    }
  };

  const getCategoryColor = (category: ExceptionCategory) => {
    switch (category) {
      case 'financial': return 'var(--sapAccentColor1)';
      case 'operational': return 'var(--sapAccentColor6)';
      case 'compliance': return 'var(--sapAccentColor2)';
      case 'process': return 'var(--sapAccentColor9)';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
          Exception Centre
        </h1>
        <div className="flex items-center gap-2">
          <button
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
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4 mb-4">
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Total Exceptions</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>{stats.total}</div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Open</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapNegativeTextColor)' }}>{stats.open}</div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>In Progress</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapCriticalTextColor)' }}>{stats.inProgress}</div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Resolved</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapPositiveTextColor)' }}>{stats.resolved}</div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>Total Impact</div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(stats.totalImpact, { compact: true })}
          </div>
        </div>
      </div>

      {/* View Switcher and Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--sapGroup_ContentBackground)' }}>
          <button
            onClick={() => setCurrentView('list')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              currentView === 'list' ? 'bg-[var(--sapSelectedColor)] text-white' : ''
            }`}
            style={{ color: currentView === 'list' ? 'white' : 'var(--sapContent_LabelColor)' }}
          >
            Exception List
          </button>
          <button
            onClick={() => setCurrentView('trend')}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              currentView === 'trend' ? 'bg-[var(--sapSelectedColor)] text-white' : ''
            }`}
            style={{ color: currentView === 'trend' ? 'white' : 'var(--sapContent_LabelColor)' }}
          >
            Trend Analysis
          </button>
        </div>

        {currentView === 'list' && (
          <div className="flex items-center gap-2">
            <select
              multiple
              value={filterCategory}
              onChange={(e) => setFilterCategory(Array.from(e.target.selectedOptions, o => o.value as ExceptionCategory))}
              className="text-sm px-3 py-1.5 rounded border"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)'
              }}
            >
              <option value="financial">Financial</option>
              <option value="operational">Operational</option>
              <option value="compliance">Compliance</option>
              <option value="process">Process</option>
            </select>
            <select
              multiple
              value={filterStatus}
              onChange={(e) => setFilterStatus(Array.from(e.target.selectedOptions, o => o.value as ExceptionStatus))}
              className="text-sm px-3 py-1.5 rounded border"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)'
              }}
            >
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="accepted">Accepted</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content */}
      {currentView === 'list' && (
        <div className="flex gap-4 flex-1 min-h-0">
          {/* Exception List */}
          <div className="flex-1 sap-card overflow-y-auto">
            <div className="p-4">
              {/* Category Breakdown */}
              <div className="grid grid-cols-4 gap-3 mb-6">
                {Object.entries(categoryBreakdown).map(([category, count]) => (
                  <div
                    key={category}
                    className="p-3 rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                    style={{
                      background: 'var(--sapGroup_ContentBackground)',
                      border: `2px solid ${getCategoryColor(category as ExceptionCategory)}`
                    }}
                    onClick={() => setFilterCategory([category as ExceptionCategory])}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: getCategoryColor(category as ExceptionCategory) }}>
                        {getCategoryIcon(category as ExceptionCategory)}
                      </span>
                      <span className="text-xs font-medium capitalize" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        {category}
                      </span>
                    </div>
                    <div className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                      {count}
                    </div>
                  </div>
                ))}
              </div>

              {/* Exception Items */}
              <div className="space-y-2">
                {sortedExceptions.map(exception => (
                  <div
                    key={exception.id}
                    onClick={() => setSelectedException(exception)}
                    className={`p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedException?.id === exception.id
                        ? 'bg-[var(--sapList_SelectionBackgroundColor)]'
                        : 'hover:bg-[var(--sapList_Hover_Background)]'
                    }`}
                    style={{ border: '1px solid var(--sapList_BorderColor)' }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{
                          background: getCategoryColor(exception.category) + '20',
                          color: getCategoryColor(exception.category)
                        }}
                      >
                        {getCategoryIcon(exception.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                            {exception.title}
                          </span>
                          <StatusChip
                            status={exception.status}
                            type={
                              exception.status === 'resolved' ? 'success' :
                              exception.status === 'in_progress' || exception.status === 'assigned' ? 'info' :
                              'warning'
                            }
                          />
                        </div>
                        <p className="text-xs mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                          {exception.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs">
                          {exception.impact && (
                            <span className="flex items-center gap-1" style={{ color: 'var(--sapNegativeTextColor)' }}>
                              <DollarSign size={12} />
                              {formatCurrency(exception.impact, { compact: true })}
                            </span>
                          )}
                          {exception.projectName && (
                            <span style={{ color: 'var(--sapContent_LabelColor)' }}>
                              {exception.projectName}
                            </span>
                          )}
                          {exception.ownerName && (
                            <span className="flex items-center gap-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                              <User size={12} />
                              {exception.ownerName}
                            </span>
                          )}
                          <span className="flex items-center gap-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                            <Clock size={12} />
                            {exception.age} days old
                          </span>
                        </div>
                      </div>
                      <ArrowRight size={16} style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Exception Detail */}
          {selectedException && (
            <div className="w-96 sap-card overflow-y-auto">
              <div className="p-4">
                <div className="flex items-start gap-3 mb-4">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      background: getCategoryColor(selectedException.category) + '20',
                      color: getCategoryColor(selectedException.category)
                    }}
                  >
                    {getCategoryIcon(selectedException.category)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium capitalize" style={{ color: getCategoryColor(selectedException.category) }}>
                        {selectedException.category}
                      </span>
                      <StatusChip
                        status={selectedException.status}
                        type={
                          selectedException.status === 'resolved' ? 'success' :
                          selectedException.status === 'in_progress' || selectedException.status === 'assigned' ? 'info' :
                          'warning'
                        }
                      />
                    </div>
                    <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedException.title}
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      {selectedException.description}
                    </p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-6">
                  {selectedException.impact && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Impact</span>
                      <span className="text-sm font-semibold" style={{ color: 'var(--sapNegativeTextColor)' }}>
                        {formatCurrency(selectedException.impact)}
                      </span>
                    </div>
                  )}
                  {selectedException.projectName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Project</span>
                      <span className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                        {selectedException.projectName}
                      </span>
                    </div>
                  )}
                  {selectedException.entityNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Related Document</span>
                      <span className="text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                        {selectedException.entityNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Raised</span>
                    <span className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                      {formatDate(selectedException.raisedAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Age</span>
                    <span className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedException.age} days
                    </span>
                  </div>
                  {selectedException.ownerName && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Owner</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                          {selectedException.ownerName}
                        </span>
                      </div>
                    </div>
                  )}
                  {selectedException.targetResolutionDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Target Resolution</span>
                      <span className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                        {formatDate(selectedException.targetResolutionDate)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-4 border-t" style={{ borderColor: 'var(--sapGroup_ContentBorderColor)' }}>
                  {selectedException.status === 'open' && (
                    <button
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium"
                      style={{
                        background: 'var(--sapButton_Emphasized_Background)',
                        color: 'var(--sapButton_Emphasized_TextColor)'
                      }}
                    >
                      <User size={16} />
                      Assign Owner
                    </button>
                  )}
                  {selectedException.status !== 'resolved' && (
                    <button
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium"
                      style={{
                        background: 'var(--sapButton_Accept_Background)',
                        color: 'var(--sapButton_Accept_TextColor)',
                        border: '1px solid var(--sapButton_Accept_BorderColor)'
                      }}
                    >
                      <CheckCircle2 size={16} />
                      Mark Resolved
                    </button>
                  )}
                  <button
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded text-sm font-medium"
                    style={{
                      background: 'var(--sapButton_Background)',
                      color: 'var(--sapButton_TextColor)',
                      border: '1px solid var(--sapButton_BorderColor)'
                    }}
                  >
                    <Calendar size={16} />
                    Set Target Date
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {currentView === 'trend' && (
        <div className="flex-1 sap-card overflow-y-auto p-4">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
            Exceptions Raised vs Resolved (Last 6 Weeks)
          </h3>
          <Chart
            type="line"
            data={[
              { name: 'Raised', data: trendData.map(d => ({ label: d.period, value: d.raised })), color: 'var(--sapNegativeColor)' },
              { name: 'Resolved', data: trendData.map(d => ({ label: d.period, value: d.resolved })), color: 'var(--sapPositiveColor)' }
            ]}
            height={400}
            showLegend={true}
            yAxisLabel="Count"
          />
        </div>
      )}
    </div>
  );
}
