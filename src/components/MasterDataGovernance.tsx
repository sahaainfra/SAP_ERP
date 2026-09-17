/**
 * Part 12 — Master Data Governance
 * Change request management and approval workflow for master data
 */

import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, AlertCircle, Eye, Edit } from 'lucide-react';
import { masterChangeRequests, masterGovernance } from '../data/masterData';
import type { MasterChangeRequest, MasterGovernance } from '../types/masterData';

export function MasterDataGovernance() {
  const [selectedRequest, setSelectedRequest] = useState<MasterChangeRequest | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredRequests = filterStatus === 'ALL'
    ? masterChangeRequests
    : masterChangeRequests.filter(r => r.status === filterStatus);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'APPLIED':
        return <CheckCircle size={16} className="text-[var(--sapPositiveColor)]" />;
      case 'REJECTED':
      case 'CANCELLED':
        return <XCircle size={16} className="text-[var(--sapNegativeColor)]" />;
      case 'PENDING':
        return <Clock size={16} className="text-[var(--sapCriticalColor)]" />;
      case 'DRAFT':
        return <Edit size={16} className="text-[var(--sapContent_LabelColor)]" />;
      default:
        return <AlertCircle size={16} className="text-[var(--sapContent_LabelColor)]" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
      case 'APPLIED':
        return 'bg-[var(--sapSuccessBackground)] text-[var(--sapPositiveTextColor)]';
      case 'REJECTED':
      case 'CANCELLED':
        return 'bg-[var(--sapErrorBackground)] text-[var(--sapNegativeTextColor)]';
      case 'PENDING':
        return 'bg-[var(--sapWarningBackground)] text-[var(--sapCriticalTextColor)]';
      case 'DRAFT':
        return 'bg-[var(--sapNeutralBackground)] text-[var(--sapNeutralTextColor)]';
      default:
        return 'bg-[var(--sapNeutralBackground)] text-[var(--sapNeutralTextColor)]';
    }
  };

  const renderDiff = (current: any, proposed: any) => {
    const allKeys = new Set([...Object.keys(current || {}), ...Object.keys(proposed || {})]);
    
    return (
      <div className="space-y-2">
        {Array.from(allKeys).map(key => {
          const currentValue = current?.[key];
          const proposedValue = proposed?.[key];
          const hasChanged = currentValue !== proposedValue;

          return (
            <div key={key} className="grid grid-cols-2 gap-4 p-3 rounded border border-[var(--sapList_BorderColor)]">
              <div>
                <label className="text-xs font-medium text-[var(--sapContent_LabelColor)] block mb-1">
                  Current Value
                </label>
                <div className={`text-sm p-2 rounded ${
                  hasChanged 
                    ? 'bg-[var(--sapErrorBackground)] text-[var(--sapNegativeTextColor)] line-through'
                    : 'bg-[var(--sapNeutralBackground)] text-[var(--sapTextColor)]'
                }`}>
                  {currentValue !== undefined ? String(currentValue) : '—'}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[var(--sapContent_LabelColor)] block mb-1">
                  Proposed Value
                </label>
                <div className={`text-sm p-2 rounded ${
                  hasChanged 
                    ? 'bg-[var(--sapSuccessBackground)] text-[var(--sapPositiveTextColor)] font-medium'
                    : 'bg-[var(--sapNeutralBackground)] text-[var(--sapTextColor)]'
                }`}>
                  {proposedValue !== undefined ? String(proposedValue) : '—'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sap-card p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--sapTextColor)]">Master Data Governance</h2>
            <p className="text-sm text-[var(--sapContent_LabelColor)]">
              Review and approve change requests for master data
            </p>
          </div>
          <div className="flex gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded border border-[var(--sapField_BorderColor)] bg-[var(--sapField_Background)] text-[var(--sapField_TextColor)]"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Governance Configuration */}
      <div className="sap-card p-4">
        <h3 className="text-sm font-semibold text-[var(--sapTextColor)] mb-3">Governance Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {masterGovernance.filter(g => g.isEnabled).map(gov => (
            <div key={gov.id} className="p-3 rounded border border-[var(--sapList_BorderColor)]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-[var(--sapTextColor)]">{gov.masterType}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-[var(--sapSuccessBackground)] text-[var(--sapPositiveTextColor)]">
                  Enabled
                </span>
              </div>
              <div className="text-xs text-[var(--sapContent_LabelColor)] space-y-1">
                <div>Create: {gov.approvalOnCreate ? '✓ Required' : '✗ Not required'}</div>
                <div>Update: {gov.approvalOnUpdate ? '✓ Required' : '✗ Not required'}</div>
                <div>Deactivate: {gov.approvalOnDeactivate ? '✓ Required' : '✗ Not required'}</div>
                <div>Controlled fields: {gov.controlledFields.length}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Change Requests List */}
      <div className="flex gap-4">
        <div className="flex-1 sap-card">
          <div className="p-4 border-b border-[var(--sapList_BorderColor)]">
            <h3 className="text-sm font-semibold text-[var(--sapTextColor)]">
              Change Requests ({filteredRequests.length})
            </h3>
          </div>
          <div className="divide-y divide-[var(--sapList_BorderColor)]">
            {filteredRequests.map(request => (
              <div
                key={request.id}
                className={`p-4 cursor-pointer hover:bg-[var(--sapList_Hover_Background)] ${
                  selectedRequest?.id === request.id ? 'bg-[var(--sapList_SelectionBackgroundColor)]' : ''
                }`}
                onClick={() => setSelectedRequest(request)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(request.status)}
                    <span className="font-medium text-[var(--sapTextColor)]">{request.requestNo}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(request.status)}`}>
                    {request.status}
                  </span>
                </div>
                <div className="text-sm text-[var(--sapTextColor)] mb-1">
                  {request.masterType} — {request.changeType}
                </div>
                <div className="text-xs text-[var(--sapContent_LabelColor)]">
                  Requested by {request.requestedBy} on {new Date(request.requestedAt).toLocaleDateString()}
                </div>
                <div className="text-xs text-[var(--sapContent_LabelColor)] mt-1 line-clamp-2">
                  {request.reason}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedRequest && (
          <div className="w-[500px] sap-card overflow-auto">
            <div className="p-4 border-b border-[var(--sapList_BorderColor)]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-[var(--sapTextColor)]">
                  {selectedRequest.requestNo}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(selectedRequest.status)}`}>
                  {selectedRequest.status}
                </span>
              </div>
              <div className="text-sm text-[var(--sapContent_LabelColor)]">
                {selectedRequest.masterType} — {selectedRequest.changeType}
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-[var(--sapContent_LabelColor)] block mb-1">
                  Reason for Change
                </label>
                <div className="text-sm text-[var(--sapTextColor)] p-3 rounded bg-[var(--sapNeutralBackground)]">
                  {selectedRequest.reason}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--sapContent_LabelColor)] block mb-2">
                  Changes
                </label>
                {renderDiff(selectedRequest.currentData, selectedRequest.proposedData)}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-[var(--sapContent_LabelColor)]">Requested By</label>
                  <div className="text-sm text-[var(--sapTextColor)]">User {selectedRequest.requestedBy}</div>
                  <div className="text-xs text-[var(--sapContent_LabelColor)]">
                    {new Date(selectedRequest.requestedAt).toLocaleString()}
                  </div>
                </div>
                {selectedRequest.decidedBy && (
                  <div>
                    <label className="text-xs font-medium text-[var(--sapContent_LabelColor)]">Decided By</label>
                    <div className="text-sm text-[var(--sapTextColor)]">User {selectedRequest.decidedBy}</div>
                    <div className="text-xs text-[var(--sapContent_LabelColor)]">
                      {new Date(selectedRequest.decidedAt!).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {selectedRequest.decisionNote && (
                <div>
                  <label className="text-xs font-medium text-[var(--sapContent_LabelColor)] block mb-1">
                    Decision Note
                  </label>
                  <div className="text-sm text-[var(--sapTextColor)] p-3 rounded bg-[var(--sapNeutralBackground)]">
                    {selectedRequest.decisionNote}
                  </div>
                </div>
              )}

              {selectedRequest.status === 'PENDING' && (
                <div className="pt-4 border-t border-[var(--sapList_BorderColor)] space-y-2">
                  <textarea
                    placeholder="Add decision note (optional)..."
                    className="w-full px-3 py-2 rounded border border-[var(--sapField_BorderColor)] bg-[var(--sapField_Background)] text-[var(--sapField_TextColor)]"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button className="flex-1 px-4 py-2 rounded text-sm font-medium bg-[var(--sapButton_Accept_Background)] text-[var(--sapButton_Accept_TextColor)] border border-[var(--sapButton_Accept_BorderColor)] hover:opacity-90">
                      Approve
                    </button>
                    <button className="flex-1 px-4 py-2 rounded text-sm font-medium bg-[var(--sapButton_Reject_Background)] text-[var(--sapButton_Reject_TextColor)] border border-[var(--sapButton_Reject_BorderColor)] hover:opacity-90">
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
