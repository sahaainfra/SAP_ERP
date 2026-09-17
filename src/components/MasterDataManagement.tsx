/**
 * Part 12 — Master Data Management
 * Main page for managing enterprise master data
 */

import React, { useState } from 'react';
import { Building2, Folder, Package, Users, FileText, TrendingUp, Shield, AlertTriangle } from 'lucide-react';
import { OrgStructureExplorer } from './OrgStructureExplorer';
import { MasterDataGovernance } from './MasterDataGovernance';
import { DataQualityDashboard } from './DataQualityDashboard';
import { projectProfiles, boqVersions, rateMasters, numberSeries } from '../data/masterData';

type MasterDataTab = 'org' | 'project' | 'boq' | 'vendor' | 'item' | 'rate' | 'governance' | 'quality';

export function MasterDataManagement() {
  const [activeTab, setActiveTab] = useState<MasterDataTab>('org');

  const tabs = [
    { id: 'org', label: 'Organization', icon: Building2 },
    { id: 'project', label: 'Projects', icon: Folder },
    { id: 'boq', label: 'BOQ', icon: FileText },
    { id: 'vendor', label: 'Vendors', icon: Users },
    { id: 'item', label: 'Items', icon: Package },
    { id: 'rate', label: 'Rates', icon: TrendingUp },
    { id: 'governance', label: 'Governance', icon: Shield },
    { id: 'quality', label: 'Data Quality', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="sap-card">
        <div className="flex border-b border-[var(--sapList_BorderColor)] overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as MasterDataTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[var(--sapSelectedColor)] text-[var(--sapSelectedColor)]'
                    : 'border-transparent text-[var(--sapContent_LabelColor)] hover:text-[var(--sapTextColor)]'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'org' && <OrgStructureExplorer />}
        {activeTab === 'project' && <ProjectMasterList />}
        {activeTab === 'boq' && <BoqWorkbench />}
        {activeTab === 'vendor' && <VendorMasterList />}
        {activeTab === 'item' && <ItemMasterList />}
        {activeTab === 'rate' && <RateMasterList />}
        {activeTab === 'governance' && <MasterDataGovernance />}
        {activeTab === 'quality' && <DataQualityDashboard />}
      </div>
    </div>
  );
}

// ─── Project Master List ─────────────────────────────────────────────────────

function ProjectMasterList() {
  return (
    <div className="sap-card">
      <div className="p-4 border-b border-[var(--sapList_BorderColor)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--sapTextColor)]">Project Master</h2>
            <p className="text-sm text-[var(--sapContent_LabelColor)]">
              Manage project profiles, configurations, and contract details
            </p>
          </div>
          <button className="px-4 py-2 rounded text-sm font-medium bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)] hover:opacity-90">
            New Project
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--sapList_BorderColor)] bg-[var(--sapList_HeaderBackground)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Project</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Contract Type</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Contract Value</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Client</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projectProfiles.map(profile => (
              <tr key={profile.projectId} className="border-b border-[var(--sapList_BorderColor)] hover:bg-[var(--sapList_Hover_Background)]">
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--sapTextColor)]">Project {profile.projectId}</div>
                  <div className="text-xs text-[var(--sapContent_LabelColor)]">{profile.loaNumber}</div>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--sapTextColor)]">{profile.contractType}</td>
                <td className="px-4 py-3 text-sm text-[var(--sapTextColor)] text-right">
                  ₹{(profile.contractValue / 10000000).toFixed(2)} Cr
                </td>
                <td className="px-4 py-3 text-sm text-[var(--sapTextColor)]">Client {profile.clientId}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    profile.isClosed
                      ? 'bg-[var(--sapNeutralBackground)] text-[var(--sapNeutralTextColor)]'
                      : 'bg-[var(--sapSuccessBackground)] text-[var(--sapPositiveTextColor)]'
                  }`}>
                    {profile.isClosed ? 'Closed' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs text-[var(--sapLinkColor)] hover:underline">
                    View Details →
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

// ─── BOQ Workbench ───────────────────────────────────────────────────────────

function BoqWorkbench() {
  return (
    <div className="sap-card">
      <div className="p-4 border-b border-[var(--sapList_BorderColor)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--sapTextColor)]">BOQ Workbench</h2>
            <p className="text-sm text-[var(--sapContent_LabelColor)]">
              Manage Bill of Quantities with version control
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 rounded text-sm font-medium border border-[var(--sapButton_BorderColor)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]">
              Import BOQ
            </button>
            <button className="px-4 py-2 rounded text-sm font-medium bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)] hover:opacity-90">
              New Version
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--sapList_BorderColor)] bg-[var(--sapList_HeaderBackground)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Version</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Reference</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Effective From</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Total Value</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {boqVersions.map(version => (
              <tr key={version.id} className="border-b border-[var(--sapList_BorderColor)] hover:bg-[var(--sapList_Hover_Background)]">
                <td className="px-4 py-3">
                  <div className="font-medium text-[var(--sapTextColor)]">V{version.versionNo}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    version.versionType === 'ORIGINAL'
                      ? 'bg-[var(--sapInformationBackground)] text-[var(--sapInformativeTextColor)]'
                      : version.versionType === 'VARIATION'
                      ? 'bg-[var(--sapWarningBackground)] text-[var(--sapCriticalTextColor)]'
                      : 'bg-[var(--sapNeutralBackground)] text-[var(--sapNeutralTextColor)]'
                  }`}>
                    {version.versionType}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--sapTextColor)] font-mono">{version.referenceNo}</td>
                <td className="px-4 py-3 text-sm text-[var(--sapTextColor)]">
                  {new Date(version.effectiveFrom).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--sapTextColor)] text-right">
                  ₹{(version.totalValue / 10000000).toFixed(2)} Cr
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    version.status === 'APPROVED'
                      ? 'bg-[var(--sapSuccessBackground)] text-[var(--sapPositiveTextColor)]'
                      : 'bg-[var(--sapWarningBackground)] text-[var(--sapCriticalTextColor)]'
                  }`}>
                    {version.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="text-xs text-[var(--sapLinkColor)] hover:underline">
                    View Items →
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

// ─── Vendor Master List ──────────────────────────────────────────────────────

function VendorMasterList() {
  return (
    <div className="sap-card">
      <div className="p-4 border-b border-[var(--sapList_BorderColor)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--sapTextColor)]">Vendor Master</h2>
            <p className="text-sm text-[var(--sapContent_LabelColor)]">
              Manage vendors with compliance tracking and performance scorecards
            </p>
          </div>
          <button className="px-4 py-2 rounded text-sm font-medium bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)] hover:opacity-90">
            New Vendor
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="text-sm text-[var(--sapContent_LabelColor)]">
          Vendor master list would be displayed here with compliance status, scorecards, and approval workflows.
        </div>
        <div className="mt-4 p-4 rounded border border-[var(--sapList_BorderColor)] bg-[var(--sapNeutralBackground)]">
          <div className="text-sm text-[var(--sapTextColor)]">
            This section integrates with Part 14 (Procurement) for vendor selection and compliance checking during PO creation.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Item Master List ────────────────────────────────────────────────────────

function ItemMasterList() {
  return (
    <div className="sap-card">
      <div className="p-4 border-b border-[var(--sapList_BorderColor)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--sapTextColor)]">Item Master</h2>
            <p className="text-sm text-[var(--sapContent_LabelColor)]">
              Manage materials with categories, UoM conversions, and specifications
            </p>
          </div>
          <button className="px-4 py-2 rounded text-sm font-medium bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)] hover:opacity-90">
            New Item
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="text-sm text-[var(--sapContent_LabelColor)]">
          Item master list would be displayed here with category hierarchy, UoM conversions, and duplicate detection.
        </div>
        <div className="mt-4 p-4 rounded border border-[var(--sapList_BorderColor)] bg-[var(--sapNeutralBackground)]">
          <div className="text-sm text-[var(--sapTextColor)]">
            This section integrates with Part 15 (Inventory) for stock management and Part 17 (MB) for measurement items.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Rate Master List ────────────────────────────────────────────────────────

function RateMasterList() {
  return (
    <div className="sap-card">
      <div className="p-4 border-b border-[var(--sapList_BorderColor)]">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--sapTextColor)]">Rate Master</h2>
            <p className="text-sm text-[var(--sapContent_LabelColor)]">
              Manage effective-dated rates for items, labour, equipment, and subcontractors
            </p>
          </div>
          <button className="px-4 py-2 rounded text-sm font-medium bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)] hover:opacity-90">
            New Rate
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--sapList_BorderColor)] bg-[var(--sapList_HeaderBackground)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Rate Type</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Scope</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Reference</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">UoM</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Rate</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Effective From</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--sapList_HeaderTextColor)]">Status</th>
            </tr>
          </thead>
          <tbody>
            {rateMasters.map(rate => (
              <tr key={rate.id} className="border-b border-[var(--sapList_BorderColor)] hover:bg-[var(--sapList_Hover_Background)]">
                <td className="px-4 py-3 text-sm text-[var(--sapTextColor)]">{rate.rateType}</td>
                <td className="px-4 py-3 text-sm text-[var(--sapTextColor)]">{rate.scopeType}</td>
                <td className="px-4 py-3 text-sm text-[var(--sapTextColor)]">Ref {rate.referenceId}</td>
                <td className="px-4 py-3 text-sm text-[var(--sapTextColor)]">{rate.uom}</td>
                <td className="px-4 py-3 text-sm text-[var(--sapTextColor)] text-right">
                  ₹{rate.rate.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--sapTextColor)]">
                  {new Date(rate.effectiveFrom).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    rate.approvalStatus === 'APPROVED'
                      ? 'bg-[var(--sapSuccessBackground)] text-[var(--sapPositiveTextColor)]'
                      : 'bg-[var(--sapWarningBackground)] text-[var(--sapCriticalTextColor)]'
                  }`}>
                    {rate.approvalStatus}
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
