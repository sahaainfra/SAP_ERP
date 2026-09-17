/**
 * Part 14 — Procurement Dashboard
 * Main dashboard for procurement management
 */

import React, { useState } from 'react';
import { ShoppingCart, FileText, GitCompare, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { IndentWorkbench } from './IndentWorkbench';
import { ComparativeStatement } from './ComparativeStatement';
import { procurementKpis } from '../data/procurementData';

type ProcurementTab = 'indents' | 'rfq' | 'comparative' | 'po' | 'rate-contracts' | 'dashboard';

export function ProcurementDashboard() {
  const [activeTab, setActiveTab] = useState<ProcurementTab>('dashboard');

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'indents', label: 'Indents', icon: FileText },
    { id: 'rfq', label: 'RFQ', icon: Package },
    { id: 'comparative', label: 'Comparative', icon: GitCompare },
    { id: 'po', label: 'Purchase Orders', icon: ShoppingCart },
    { id: 'rate-contracts', label: 'Rate Contracts', icon: FileText },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ProcurementOverview />;
      case 'indents':
        return <IndentWorkbench />;
      case 'comparative':
        return <ComparativeStatement />;
      case 'rfq':
        return <RfqPlaceholder />;
      case 'po':
        return <PoPlaceholder />;
      case 'rate-contracts':
        return <RateContractPlaceholder />;
      default:
        return <ProcurementOverview />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Procurement
          </h1>
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Indent → RFQ → Comparative → Purchase Order
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sap-card">
        <div className="flex border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProcurementTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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

function ProcurementOverview() {
  const kpis = procurementKpis;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Indents Pending Approval
            </span>
            <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {kpis.indentsPendingApproval}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Indent-to-PO Cycle
            </span>
            <TrendingUp size={16} style={{ color: 'var(--sapInformativeColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {kpis.indentToPoCycleDays} days
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              PO Value Committed
            </span>
            <Package size={16} style={{ color: 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            ₹{(kpis.poValueCommitted / 10000000).toFixed(1)} Cr
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Savings vs Budget
            </span>
            <TrendingUp size={16} style={{ color: 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapPositiveColor)' }}>
            ₹{(kpis.savingsVsBudget / 100000).toFixed(1)} L
          </div>
        </div>
      </div>

      {/* Budget vs Committed vs Actual */}
      <div className="sap-card p-4">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
          Budget vs Committed vs Actual
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>Budget</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                ₹{(kpis.budgetVsCommittedVsActual.budget / 10000000).toFixed(1)} Cr
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
              <div className="h-full" style={{ width: '100%', background: 'var(--sapNeutralColor)' }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>Committed</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                ₹{(kpis.budgetVsCommittedVsActual.committed / 10000000).toFixed(1)} Cr
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
              <div
                className="h-full"
                style={{
                  width: `${(kpis.budgetVsCommittedVsActual.committed / kpis.budgetVsCommittedVsActual.budget) * 100}%`,
                  background: 'var(--sapInformativeColor)',
                }}
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>Actual</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                ₹{(kpis.budgetVsCommittedVsActual.actual / 10000000).toFixed(1)} Cr
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
              <div
                className="h-full"
                style={{
                  width: `${(kpis.budgetVsCommittedVsActual.actual / kpis.budgetVsCommittedVsActual.budget) * 100}%`,
                  background: 'var(--sapPositiveColor)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Single Source %
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {kpis.singleSourcePct}%
          </div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            L1 Deviation %
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {kpis.l1DeviationPct}%
          </div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Vendor Response Rate
          </div>
          <div className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {kpis.vendorResponseRate}%
          </div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Overdue Deliveries
          </div>
          <div className="text-xl font-bold" style={{ color: kpis.overdueDeliveries > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)' }}>
            {kpis.overdueDeliveries}
          </div>
        </div>
      </div>
    </div>
  );
}

function RfqPlaceholder() {
  return (
    <div className="text-center py-12">
      <Package size={48} className="mx-auto mb-4" style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />
      <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
        RFQ Builder component - Coming in next iteration
      </p>
    </div>
  );
}

function PoPlaceholder() {
  return (
    <div className="text-center py-12">
      <ShoppingCart size={48} className="mx-auto mb-4" style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />
      <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
        Purchase Order component - Coming in next iteration
      </p>
    </div>
  );
}

function RateContractPlaceholder() {
  return (
    <div className="text-center py-12">
      <FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />
      <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
        Rate Contract Console - Coming in next iteration
      </p>
    </div>
  );
}
