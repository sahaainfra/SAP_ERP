/**
 * Part 18 — Billing Dashboard Component
 * Main dashboard for client billing, variations, claims, and revenue tracking
 */

import React, { useState } from 'react';
import { 
  FileText, TrendingUp, AlertTriangle, CheckCircle, 
  DollarSign, Clock, Calendar, Hash
} from 'lucide-react';
import { BillWorkbench } from './BillWorkbench';
import { VariationRegister } from './VariationRegister';
import { ClaimsRegister } from './ClaimsRegister';
import { billingKpis, clientBills, variations, claims } from '../data/billingData';
import { formatCurrency } from '../utils/formatting';

type BillingTab = 'overview' | 'bills' | 'variations' | 'claims' | 'certification' | 'retention';

export function BillingDashboard() {
  const [activeTab, setActiveTab] = useState<BillingTab>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'bills', label: 'Bills', icon: FileText },
    { id: 'variations', label: 'Variations', icon: Hash },
    { id: 'claims', label: 'Claims', icon: AlertTriangle },
    { id: 'certification', label: 'Certification', icon: CheckCircle },
    { id: 'retention', label: 'Retention', icon: DollarSign },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <BillingOverview />;
      case 'bills':
        return <BillWorkbench />;
      case 'variations':
        return <VariationRegister />;
      case 'claims':
        return <ClaimsRegister />;
      case 'certification':
        return <CertificationTracker />;
      case 'retention':
        return <RetentionDashboard />;
      default:
        return <BillingOverview />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Client Billing & Revenue
          </h1>
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            RA billing, variations, claims, and revenue tracking
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
                onClick={() => setActiveTab(tab.id as BillingTab)}
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

// ─── Billing Overview ────────────────────────────────────────────────────────

function BillingOverview() {
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Contract Position
            </span>
            <DollarSign size={16} style={{ color: 'var(--sapAccentColor6)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(billingKpis.contractValue, { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Balance: {formatCurrency(billingKpis.contractBalance, { compact: true })}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Total Billed
            </span>
            <FileText size={16} style={{ color: 'var(--sapInformativeColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(billingKpis.totalBilled, { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {((billingKpis.totalBilled / billingKpis.contractValue) * 100).toFixed(1)}% of contract
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Work Done but Unbilled
            </span>
            <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapCriticalColor)' }}>
            {formatCurrency(billingKpis.workDoneButUnbilled, { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Most important commercial number
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Retention Held
            </span>
            <Clock size={16} style={{ color: 'var(--sapAccentColor1)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(billingKpis.retentionHeld, { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Due for release: {formatCurrency(billingKpis.retentionDueForRelease, { compact: true })}
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="sap-card p-4">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
            Revenue Summary
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Contract Value</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                {formatCurrency(billingKpis.contractValue)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Variations Approved</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapPositiveColor)' }}>
                +{formatCurrency(billingKpis.variationValueApproved)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Variations Pending</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapCriticalColor)' }}>
                +{formatCurrency(billingKpis.variationValuePending)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>Revised Contract Value</span>
              <span className="text-sm font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {formatCurrency(billingKpis.contractValue + billingKpis.variationValueApproved)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Total Billed</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapInformativeColor)' }}>
                {formatCurrency(billingKpis.totalBilled)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Contract Balance</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                {formatCurrency(billingKpis.contractBalance)}
              </span>
            </div>
          </div>
        </div>

        <div className="sap-card p-4">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
            Receivables & Deductions
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Receivables (Current)</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                {formatCurrency(billingKpis.receivablesAgeing.current)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Receivables (30-60 days)</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapCriticalColor)' }}>
                {formatCurrency(billingKpis.receivablesAgeing.days30To60)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Receivables (60-90 days)</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapCriticalColor)' }}>
                {formatCurrency(billingKpis.receivablesAgeing.days60To90)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Receivables (90+ days)</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapNegativeColor)' }}>
                {formatCurrency(billingKpis.receivablesAgeing.days90Plus)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>Total Receivables</span>
              <span className="text-sm font-bold" style={{ color: 'var(--sapTextColor)' }}>
                {formatCurrency(
                  billingKpis.receivablesAgeing.current +
                  billingKpis.receivablesAgeing.days30To60 +
                  billingKpis.receivablesAgeing.days60To90 +
                  billingKpis.receivablesAgeing.days90Plus
                )}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Retention Held</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapAccentColor1)' }}>
                {formatCurrency(billingKpis.retentionHeld)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>Advance Outstanding</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapAccentColor2)' }}>
                {formatCurrency(billingKpis.advanceOutstanding)}
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
          {billingKpis.workDoneButUnbilled > 1000000 && (
            <div className="flex items-start gap-3 p-3 rounded" style={{ background: 'var(--sapErrorBackground)' }}>
              <AlertTriangle size={16} style={{ color: 'var(--sapNegativeColor)' }} />
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: 'var(--sapNegativeTextColor)' }}>
                  High Work-in-Progress (WIP)
                </div>
                <div className="text-xs" style={{ color: 'var(--sapNegativeTextColor)' }}>
                  {formatCurrency(billingKpis.workDoneButUnbilled)} of work done but not yet billed. Generate bills immediately.
                </div>
              </div>
              <button className="px-3 py-1 rounded text-xs font-medium" style={{
                background: 'var(--sapButton_Reject_Background)',
                color: 'var(--sapButton_Reject_TextColor)',
                border: '1px solid var(--sapButton_Reject_BorderColor)',
              }}>
                Generate Bill
              </button>
            </div>
          )}

          {billingKpis.variationValuePending > 0 && (
            <div className="flex items-start gap-3 p-3 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
              <Clock size={16} style={{ color: 'var(--sapCriticalColor)' }} />
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: 'var(--sapCriticalTextColor)' }}>
                  Pending Variations
                </div>
                <div className="text-xs" style={{ color: 'var(--sapCriticalTextColor)' }}>
                  {formatCurrency(billingKpis.variationValuePending)} of variations pending client approval
                </div>
              </div>
              <button className="px-3 py-1 rounded text-xs font-medium" style={{
                background: 'var(--sapButton_Attention_Background)',
                color: 'var(--sapButton_Attention_TextColor)',
                border: '1px solid var(--sapButton_Attention_BorderColor)',
              }}>
                Follow Up
              </button>
            </div>
          )}

          {claims.filter(c => c.noticeOverdue).length > 0 && (
            <div className="flex items-start gap-3 p-3 rounded" style={{ background: 'var(--sapErrorBackground)' }}>
              <AlertTriangle size={16} style={{ color: 'var(--sapNegativeColor)' }} />
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: 'var(--sapNegativeTextColor)' }}>
                  Overdue Claim Notices
                </div>
                <div className="text-xs" style={{ color: 'var(--sapNegativeTextColor)' }}>
                  {claims.filter(c => c.noticeOverdue).length} claim(s) with overdue notice deadlines. Issue notices immediately.
                </div>
              </div>
              <button className="px-3 py-1 rounded text-xs font-medium" style={{
                background: 'var(--sapButton_Reject_Background)',
                color: 'var(--sapButton_Reject_TextColor)',
                border: '1px solid var(--sapButton_Reject_BorderColor)',
              }}>
                View Claims
              </button>
            </div>
          )}

          {billingKpis.workDoneButUnbilled <= 1000000 && 
           billingKpis.variationValuePending === 0 && 
           claims.filter(c => c.noticeOverdue).length === 0 && (
            <div className="flex items-center gap-3 p-3 rounded" style={{ background: 'var(--sapSuccessBackground)' }}>
              <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
              <div className="text-sm" style={{ color: 'var(--sapPositiveTextColor)' }}>
                All operations running smoothly. No critical alerts.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Certification Tracker ───────────────────────────────────────────────────

function CertificationTracker() {
  const bills = clientBills.filter(b => b.submittedAt);
  const pendingCertification = bills.filter(b => !b.certifiedAt);
  const certified = bills.filter(b => b.certifiedAt);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
        Certification Tracker
      </h3>
      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Bill No</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Submitted</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Claimed</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Certified</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Shortfall</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((bill, idx) => (
              <tr
                key={bill.id}
                style={{
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                  background: idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                }}
              >
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  {bill.billNo}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {bill.submittedAt ? new Date(bill.submittedAt).toLocaleDateString() : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(bill.netReceivable)}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {bill.certifiedValue ? formatCurrency(bill.certifiedValue) : '—'}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ 
                  color: bill.shortfallValue && bill.shortfallValue > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)'
                }}>
                  {bill.shortfallValue ? formatCurrency(bill.shortfallValue) : '—'}
                </td>
                <td className="px-4 py-3">
                  {bill.certifiedAt ? (
                    <span className="text-xs px-2 py-1 rounded" style={{
                      background: 'var(--sapSuccessBackground)',
                      color: 'var(--sapPositiveTextColor)',
                    }}>
                      Certified
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded" style={{
                      background: 'var(--sapWarningBackground)',
                      color: 'var(--sapCriticalTextColor)',
                    }}>
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Retention Dashboard ─────────────────────────────────────────────────────

function RetentionDashboard() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
        Retention & DLP Management
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="sap-card p-4">
          <div className="text-xs mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Total Retention Held
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapAccentColor1)' }}>
            {formatCurrency(billingKpis.retentionHeld)}
          </div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Due for Release
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapPositiveColor)' }}>
            {formatCurrency(billingKpis.retentionDueForRelease)}
          </div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Advance Outstanding
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapAccentColor2)' }}>
            {formatCurrency(billingKpis.advanceOutstanding)}
          </div>
        </div>
      </div>
    </div>
  );
}
