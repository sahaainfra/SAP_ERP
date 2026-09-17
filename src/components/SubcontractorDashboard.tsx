/**
 * Part 16 — Subcontractor Dashboard
 * Main dashboard for subcontractor management
 */

import React, { useState } from 'react';
import { 
  FileText, Package, Users, Award, TrendingUp, 
  AlertTriangle, CheckCircle, DollarSign
} from 'lucide-react';
import { WorkOrderManagement } from './WorkOrderManagement';
import { ScBillingWorkbench } from './ScBillingWorkbench';
import { FreeIssueReconciliation } from './FreeIssueReconciliation';
import { LabourComplianceRegister } from './LabourComplianceRegister';
import { ScPerformanceDashboard } from './ScPerformanceDashboard';
import { scKpis, workOrders, scBills, freeIssueAccounts, scCompliancePeriods } from '../data/subcontractorData';
import { formatCurrency } from '../utils/formatting';

type ScTab = 'overview' | 'workorders' | 'billing' | 'freeissue' | 'compliance' | 'performance';

export function SubcontractorDashboard() {
  const [activeTab, setActiveTab] = useState<ScTab>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'workorders', label: 'Work Orders', icon: FileText },
    { id: 'billing', label: 'SC Billing', icon: DollarSign },
    { id: 'freeissue', label: 'Free Issue', icon: Package },
    { id: 'compliance', label: 'Compliance', icon: Users },
    { id: 'performance', label: 'Performance', icon: Award },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ScOverview />;
      case 'workorders':
        return <WorkOrderManagement />;
      case 'billing':
        return <ScBillingWorkbench />;
      case 'freeissue':
        return <FreeIssueReconciliation />;
      case 'compliance':
        return <LabourComplianceRegister />;
      case 'performance':
        return <ScPerformanceDashboard />;
      default:
        return <ScOverview />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Subcontractor Management
          </h1>
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Work orders, billing, free issue material, compliance, and performance
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sap-card">
        <div className="flex border-b overflow-x-auto" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ScTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[var(--sapSelectedColor)]'
                    : 'border-transparent hover:border-[var(--sapContent_BorderColor)]'
                }`}
                style={{
                  color: activeTab === tab.id ? 'var(--sapSelectedColor)' : 'var(--sapContent_LabelColor)'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="sap-card p-4">
        {renderContent()}
      </div>
    </div>
  );
}

function ScOverview() {
  const pendingBills = scBills.filter(b => b.status === 'MEASURED' || b.status === 'CHECKED');
  const certifiedBills = scBills.filter(b => b.status === 'CERTIFIED' || b.status === 'APPROVED_FOR_PAYMENT');
  const activeWos = workOrders.filter(wo => wo.status === 'IN_PROGRESS' || wo.status === 'RELEASED');
  const complianceIssues = scCompliancePeriods.filter(c => c.status === 'NON_COMPLIANT');
  const freeIssueExcess = freeIssueAccounts.filter(f => f.excessQty > 0);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Active Work Orders
            </span>
            <FileText size={16} style={{ color: 'var(--sapAccentColor6)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {activeWos.length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Value: {formatCurrency(activeWos.reduce((sum, wo) => sum + wo.woValue, 0), { compact: true })}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Pending SC Bills
            </span>
            <DollarSign size={16} style={{ color: 'var(--sapCriticalColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {pendingBills.length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Value: {formatCurrency(pendingBills.reduce((sum, b) => sum + b.grossValue, 0), { compact: true })}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Free Issue Excess
            </span>
            <Package size={16} style={{ color: freeIssueExcess.length > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ 
            color: freeIssueExcess.length > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)'
          }}>
            {freeIssueExcess.length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Recovery: {formatCurrency(freeIssueExcess.reduce((sum, f) => sum + (f.recoveryAmount || 0), 0), { compact: true })}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Compliance Issues
            </span>
            <AlertTriangle size={16} style={{ color: complianceIssues.length > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ 
            color: complianceIssues.length > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)'
          }}>
            {complianceIssues.length}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Withheld: {formatCurrency(complianceIssues.reduce((sum, c) => sum + c.withheldAmount, 0), { compact: true })}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Financial Summary */}
        <div className="sap-card p-4">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
            Financial Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Total WO Value
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {formatCurrency(scKpis.woValueAwarded, { compact: true })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Executed Value
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {formatCurrency(scKpis.woValueOpen + scKpis.woValueCompleted, { compact: true })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                SC Payable
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--sapAccentColor1)' }}>
                {formatCurrency(scKpis.scPayable, { compact: true })}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Retention Held
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--sapCriticalColor)' }}>
                {formatCurrency(scKpis.retentionHeld, { compact: true })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Advance Outstanding
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--sapInformativeColor)' }}>
                {formatCurrency(scKpis.advanceOutstanding, { compact: true })}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <span className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                Average Margin
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--sapPositiveColor)' }}>
                {scKpis.avgMarginPct.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Status Summary */}
        <div className="sap-card p-4">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
            Status Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Certified Bills (Ready for Payment)
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--sapPositiveColor)' }}>
                {certifiedBills.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
                <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Bills Pending Certification
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--sapCriticalColor)' }}>
                {pendingBills.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={16} style={{ color: 'var(--sapAccentColor6)' }} />
                <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Free Issue Items Tracked
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {freeIssueAccounts.length}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} style={{ color: 'var(--sapAccentColor3)' }} />
                <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Labour Compliance Rate
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: scKpis.labourCompliancePct >= 90 ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)' }}>
                {scKpis.labourCompliancePct.toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award size={16} style={{ color: 'var(--sapAccentColor1)' }} />
                <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Average SC Performance
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {scKpis.scPerformanceAvg.toFixed(1)}/100
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} style={{ color: scKpis.negativeMarginWoCount > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)' }} />
                <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Negative Margin WOs
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: scKpis.negativeMarginWoCount > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)' }}>
                {scKpis.negativeMarginWoCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts & Actions */}
      <div className="sap-card p-4">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
          Alerts & Required Actions
        </h3>
        <div className="space-y-2">
          {scKpis.negativeMarginWoCount > 0 && (
            <div className="flex items-start gap-3 p-3 rounded" style={{ background: 'var(--sapErrorBackground)' }}>
              <AlertTriangle size={16} className="mt-0.5" style={{ color: 'var(--sapNegativeColor)' }} />
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: 'var(--sapNegativeTextColor)' }}>
                  {scKpis.negativeMarginWoCount} work orders with negative margin
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--sapNegativeTextColor)' }}>
                  Review and approve margin override or renegotiate with subcontractor
                </div>
              </div>
              <button className="px-3 py-1 rounded text-xs font-medium" style={{
                background: 'var(--sapButton_Reject_Background)',
                color: 'var(--sapButton_Reject_TextColor)',
                border: '1px solid var(--sapButton_Reject_BorderColor)',
              }}>
                Review
              </button>
            </div>
          )}

          {pendingBills.length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
              <AlertTriangle size={16} className="mt-0.5" style={{ color: 'var(--sapCriticalColor)' }} />
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: 'var(--sapCriticalTextColor)' }}>
                  {pendingBills.length} SC bills pending certification
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--sapCriticalTextColor)' }}>
                  Total value: {formatCurrency(pendingBills.reduce((sum, b) => sum + b.grossValue, 0), { compact: true })}
                </div>
              </div>
              <button className="px-3 py-1 rounded text-xs font-medium" style={{
                background: 'var(--sapButton_Attention_Background)',
                color: 'var(--sapButton_Attention_TextColor)',
                border: '1px solid var(--sapButton_Attention_BorderColor)',
              }}>
                Certify
              </button>
            </div>
          )}

          {complianceIssues.length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded" style={{ background: 'var(--sapErrorBackground)' }}>
              <AlertTriangle size={16} className="mt-0.5" style={{ color: 'var(--sapNegativeColor)' }} />
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: 'var(--sapNegativeTextColor)' }}>
                  {complianceIssues.length} subcontractors with labour compliance issues
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--sapNegativeTextColor)' }}>
                  Amount withheld: {formatCurrency(complianceIssues.reduce((sum, c) => sum + c.withheldAmount, 0), { compact: true })}
                </div>
              </div>
              <button className="px-3 py-1 rounded text-xs font-medium" style={{
                background: 'var(--sapButton_Reject_Background)',
                color: 'var(--sapButton_Reject_TextColor)',
                border: '1px solid var(--sapButton_Reject_BorderColor)',
              }}>
                Review
              </button>
            </div>
          )}

          {freeIssueExcess.length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
              <Package size={16} className="mt-0.5" style={{ color: 'var(--sapCriticalColor)' }} />
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: 'var(--sapCriticalTextColor)' }}>
                  {freeIssueExcess.length} free issue items with excess consumption
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--sapCriticalTextColor)' }}>
                  Recovery amount: {formatCurrency(freeIssueExcess.reduce((sum, f) => sum + (f.recoveryAmount || 0), 0), { compact: true })}
                </div>
              </div>
              <button className="px-3 py-1 rounded text-xs font-medium" style={{
                background: 'var(--sapButton_Attention_Background)',
                color: 'var(--sapButton_Attention_TextColor)',
                border: '1px solid var(--sapButton_Attention_BorderColor)',
              }}>
                Reconcile
              </button>
            </div>
          )}

          {scKpis.negativeMarginWoCount === 0 && pendingBills.length === 0 && complianceIssues.length === 0 && freeIssueExcess.length === 0 && (
            <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
              <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
              <div className="text-sm" style={{ color: 'var(--sapPositiveTextColor)' }}>
                No critical alerts. All operations running smoothly.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
