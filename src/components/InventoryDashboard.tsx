/**
 * Part 15 — Inventory Dashboard
 * Main dashboard for inventory and material management
 */

import React, { useState } from 'react';
import { Package, TrendingUp, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { StockLedgerView } from './StockLedgerView';
import { GrnWithThreeWayMatch } from './GrnWithThreeWayMatch';
import { IssueWithTheoreticalCheck } from './IssueWithTheoreticalCheck';
import { ConsumptionReconciliation } from './ConsumptionReconciliation';
import { StockTakeBlindCount } from './StockTakeBlindCount';
import { inventoryKpis, reorderSuggestions, expiryAlerts, stockAgeing } from '../data/inventoryData';
import { formatCurrency } from '../utils/formatting';

type InventoryTab = 'overview' | 'ledger' | 'grn' | 'issue' | 'consumption' | 'stocktake' | 'transfers' | 'ageing';

export function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState<InventoryTab>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Package },
    { id: 'ledger', label: 'Stock Ledger', icon: TrendingUp },
    { id: 'grn', label: 'GRN', icon: CheckCircle },
    { id: 'issue', label: 'Material Issue', icon: Package },
    { id: 'consumption', label: 'Consumption', icon: TrendingUp },
    { id: 'stocktake', label: 'Stock Take', icon: CheckCircle },
    { id: 'transfers', label: 'Transfers', icon: Package },
    { id: 'ageing', label: 'Ageing', icon: Clock },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <InventoryOverview />;
      case 'ledger':
        return <StockLedgerView />;
      case 'grn':
        return <GrnWithThreeWayMatch />;
      case 'issue':
        return <IssueWithTheoreticalCheck />;
      case 'consumption':
        return <ConsumptionReconciliation />;
      case 'stocktake':
        return <StockTakeBlindCount />;
      case 'transfers':
        return <TransfersPlaceholder />;
      case 'ageing':
        return <AgeingAnalysis />;
      default:
        return <InventoryOverview />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Inventory & Material Management
          </h1>
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Stock ledger, GRN, issue, consumption reconciliation, and stock take
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
                onClick={() => setActiveTab(tab.id as InventoryTab)}
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

function InventoryOverview() {
  const kpis = inventoryKpis;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Total Stock Value
            </span>
            <Package size={16} style={{ color: 'var(--sapAccentColor6)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(kpis.totalStockValue, { compact: true })}
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Stock Turnover
            </span>
            <TrendingUp size={16} style={{ color: 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {kpis.stockTurnoverRatio}x
          </div>
          <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {kpis.avgDaysOfCover} days cover
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Consumption Variance
            </span>
            <AlertTriangle size={16} style={{ color: kpis.consumptionVariancePct > 5 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: kpis.consumptionVariancePct > 5 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)' }}>
            {kpis.consumptionVariancePct}%
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Non-Moving Stock
            </span>
            <Clock size={16} style={{ color: 'var(--sapCriticalColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(kpis.nonMovingStockValue, { compact: true })}
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Reorder Suggestions */}
        <div className="sap-card p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
            Reorder Suggestions ({reorderSuggestions.length})
          </h3>
          <div className="space-y-2">
            {reorderSuggestions.map((suggestion, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded border" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                    {suggestion.itemName}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Current: {suggestion.currentStock} • Min: {suggestion.minLevel} • {suggestion.daysOfCover} days cover
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                    {suggestion.suggestedQty}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Suggested
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expiry Alerts */}
        <div className="sap-card p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
            Expiry Alerts ({expiryAlerts.length})
          </h3>
          <div className="space-y-2">
            {expiryAlerts.map((alert, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded border" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                    {alert.itemName}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Batch: {alert.batchId} • Qty: {alert.quantity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold" style={{ color: alert.alertLevel === 'EXPIRED' ? 'var(--sapNegativeColor)' : 'var(--sapCriticalColor)' }}>
                    {alert.daysToExpiry} days
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {alert.alertLevel.replace('_', ' ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="sap-card p-4">
        <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
          Key Metrics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
              GRN Pending QC
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
              {kpis.grnPendingQc}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
              In-Transit Value
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
              {formatCurrency(kpis.inTransitValue, { compact: true })}
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Stock Take Accuracy
            </div>
            <div className="text-xl font-bold" style={{ color: 'var(--sapPositiveColor)' }}>
              {kpis.stockTakeAccuracyPct}%
            </div>
          </div>
          <div>
            <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Items Below Reorder
            </div>
            <div className="text-xl font-bold" style={{ color: kpis.itemsBelowReorder > 0 ? 'var(--sapCriticalColor)' : 'var(--sapPositiveColor)' }}>
              {kpis.itemsBelowReorder}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TransfersPlaceholder() {
  return (
    <div className="text-center py-12">
      <Package size={48} className="mx-auto mb-4" style={{ color: 'var(--sapContent_NonInteractiveIconColor)' }} />
      <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
        Transfer console with in-transit tracking - Coming in next iteration
      </p>
    </div>
  );
}

function AgeingAnalysis() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
        Stock Ageing Analysis
      </h3>
      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Item
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Quantity
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Value
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Age (Days)
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Age Bucket
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Last Issue
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Suggested Action
              </th>
            </tr>
          </thead>
          <tbody>
            {stockAgeing.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  {item.itemName}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {item.quantity}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(item.value)}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {item.ageDays}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded" style={{
                    background: item.ageBucket === '365+' ? 'var(--sapErrorBackground)' :
                               item.ageBucket === '181-365' ? 'var(--sapWarningBackground)' :
                               'var(--sapInformationBackground)',
                    color: item.ageBucket === '365+' ? 'var(--sapNegativeTextColor)' :
                           item.ageBucket === '181-365' ? 'var(--sapCriticalTextColor)' :
                           'var(--sapInformativeTextColor)'
                  }}>
                    {item.ageBucket}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {item.lastIssueDate ? new Date(item.lastIssueDate).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded" style={{
                    background: item.suggestedAction === 'SCRAP' ? 'var(--sapErrorBackground)' :
                               item.suggestedAction === 'TRANSFER' ? 'var(--sapWarningBackground)' :
                               'var(--sapInformationBackground)',
                    color: item.suggestedAction === 'SCRAP' ? 'var(--sapNegativeTextColor)' :
                           item.suggestedAction === 'TRANSFER' ? 'var(--sapCriticalTextColor)' :
                           'var(--sapInformativeTextColor)'
                  }}>
                    {item.suggestedAction}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
