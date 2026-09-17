/**
 * Part 17 — Measurement Dashboard
 * Main dashboard for measurement book management
 */

import React, { useState } from 'react';
import { 
  FileText, CheckCircle, Clock, AlertTriangle, 
  TrendingUp, Calculator, Lock
} from 'lucide-react';
import { MbWorkbench } from './MbWorkbench';
import { measurementBooks, mbKpis } from '../data/measurementData';
import { formatCurrency, formatDate } from '../utils/formatting';

type MbTab = 'workbench' | 'pending' | 'certified' | 'reports';

export function MeasurementDashboard() {
  const [activeTab, setActiveTab] = useState<MbTab>('workbench');

  const tabs = [
    { id: 'workbench', label: 'MB Workbench', icon: Calculator },
    { id: 'pending', label: 'Pending Certification', icon: Clock },
    { id: 'certified', label: 'Certified MBs', icon: CheckCircle },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const pendingMbs = measurementBooks.filter(mb => 
    mb.status === 'MEASURED' || mb.status === 'CHECKED'
  );

  const certifiedMbs = measurementBooks.filter(mb => mb.status === 'CERTIFIED');

  const renderContent = () => {
    switch (activeTab) {
      case 'workbench':
        return <MbWorkbench />;
      case 'pending':
        return <PendingCertification mbs={pendingMbs} />;
      case 'certified':
        return <CertifiedMbs mbs={certifiedMbs} />;
      case 'reports':
        return <MbReports />;
      default:
        return <MbWorkbench />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Measurement Book (e-MB)
          </h1>
          <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Legal record of work done with tamper-evident calculations
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Certified This Period
            </span>
            <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(mbKpis.valueCertifiedThisPeriod, { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {mbKpis.quantityCertifiedThisPeriod} units
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Pending Certification
            </span>
            <Clock size={16} style={{ color: 'var(--sapCriticalColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {mbKpis.mbsPendingCheck + mbKpis.mbsPendingCertification}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {mbKpis.mbsPendingCheck} checked, {mbKpis.mbsPendingCertification} measured
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Measured but Unbilled
            </span>
            <TrendingUp size={16} style={{ color: 'var(--sapInformativeColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {formatCurrency(mbKpis.measuredButUnbilledValue, { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {formatCurrency(mbKpis.measuredButUnbilledQty, { compact: true })} quantity
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Certification Cycle
            </span>
            <Lock size={16} style={{ color: 'var(--sapAccentColor7)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {mbKpis.measurementToCertificationCycleDays} days
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Target: ≤ 3 days
          </div>
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
                onClick={() => setActiveTab(tab.id as MbTab)}
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

function PendingCertification({ mbs }: { mbs: typeof measurementBooks }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
        Measurement Books Pending Certification
      </h3>
      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>MB No</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Context</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Value</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Measured By</th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mbs.map((mb, idx) => (
              <tr
                key={mb.id}
                style={{
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                  background: idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                }}
              >
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  {mb.mbNo}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  {mb.measurementContext}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {formatDate(mb.measurementDate)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(mb.totalValue)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs px-2 py-1 rounded"
                    style={{
                      background: mb.status === 'CHECKED' ? 'var(--sapWarningBackground)' : 'var(--sapInformationBackground)',
                      color: mb.status === 'CHECKED' ? 'var(--sapCriticalTextColor)' : 'var(--sapInformativeTextColor)',
                    }}
                  >
                    {mb.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  User {mb.measuredBy}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    className="px-3 py-1 rounded text-xs font-medium"
                    style={{
                      background: 'var(--sapButton_Emphasized_Background)',
                      color: 'var(--sapButton_Emphasized_TextColor)',
                    }}
                  >
                    {mb.status === 'MEASURED' ? 'Check' : 'Certify'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CertifiedMbs({ mbs }: { mbs: typeof measurementBooks }) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
        Certified Measurement Books
      </h3>
      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>MB No</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Context</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Date</th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Value</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Certified By</th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Lock Hash</th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mbs.map((mb, idx) => (
              <tr
                key={mb.id}
                style={{
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                  background: idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                }}
              >
                <td className="px-4 py-3 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                  {mb.mbNo}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  {mb.measurementContext}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {formatDate(mb.measurementDate)}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {formatCurrency(mb.totalValue)}
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  User {mb.certifiedBy}
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  {mb.lockHash?.substring(0, 16)}...
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                    title="View"
                  >
                    <FileText size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                  </button>
                  <button
                    className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                    title="Print"
                  >
                    <Lock size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MbReports() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
        Measurement Reports
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="sap-card p-4 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={24} style={{ color: 'var(--sapAccentColor6)' }} />
            <h4 className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              Abstract of Quantities
            </h4>
          </div>
          <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            BOQ item-wise certified quantities and values
          </p>
        </div>

        <div className="sap-card p-4 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={24} style={{ color: 'var(--sapAccentColor6)' }} />
            <h4 className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              Measurement Register
            </h4>
          </div>
          <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Chronological list of all MBs with status
          </p>
        </div>

        <div className="sap-card p-4 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={24} style={{ color: 'var(--sapAccentColor6)' }} />
            <h4 className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              Quantity Reconciliation
            </h4>
          </div>
          <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            BOQ vs certified vs billed quantities
          </p>
        </div>

        <div className="sap-card p-4 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <FileText size={24} style={{ color: 'var(--sapAccentColor6)' }} />
            <h4 className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              Balance Quantity Statement
            </h4>
          </div>
          <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Remaining quantities for each BOQ item
          </p>
        </div>

        <div className="sap-card p-4 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle size={24} style={{ color: 'var(--sapAccentColor1)' }} />
            <h4 className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              Disputed Quantity Report
            </h4>
          </div>
          <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Lines with disputed quantities and status
          </p>
        </div>

        <div className="sap-card p-4 cursor-pointer hover:shadow-lg transition-shadow">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp size={24} style={{ color: 'var(--sapAccentColor8)' }} />
            <h4 className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              Measurement Productivity
            </h4>
          </div>
          <p className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Quantity per day per engineer analysis
          </p>
        </div>
      </div>
    </div>
  );
}
