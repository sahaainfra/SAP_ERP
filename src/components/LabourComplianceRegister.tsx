/**
 * Part 16 — Labour Compliance Register
 * Track PF/ESIC/wage compliance for subcontractors
 */

import React, { useState } from 'react';
import { 
  Users, CheckCircle, AlertTriangle, XCircle, Clock,
  Eye, Upload, Download, Filter
} from 'lucide-react';
import { scCompliancePeriods } from '../data/subcontractorData';
import type { ScCompliancePeriod, ComplianceStatus } from '../types/subcontractor';
import { formatCurrency, formatDate } from '../utils/formatting';

export function LabourComplianceRegister() {
  const [selectedCompliance, setSelectedCompliance] = useState<ScCompliancePeriod | null>(null);
  const [filterStatus, setFilterStatus] = useState<ComplianceStatus | 'ALL'>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');

  const filteredCompliance = scCompliancePeriods.filter(comp => {
    if (filterStatus !== 'ALL' && comp.status !== filterStatus) return false;
    if (filterMonth !== 'ALL' && comp.periodMonth !== filterMonth) return false;
    return true;
  });

  const getStatusColor = (status: ComplianceStatus) => {
    switch (status) {
      case 'PENDING': return 'var(--sapNeutralColor)';
      case 'SUBMITTED': return 'var(--sapInformativeColor)';
      case 'VERIFIED': return 'var(--sapPositiveColor)';
      case 'NON_COMPLIANT': return 'var(--sapNegativeColor)';
      default: return 'var(--sapContent_LabelColor)';
    }
  };

  const getStatusIcon = (status: ComplianceStatus) => {
    switch (status) {
      case 'VERIFIED': return <CheckCircle size={16} />;
      case 'NON_COMPLIANT': return <XCircle size={16} />;
      case 'SUBMITTED': return <Upload size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const uniqueMonths = Array.from(new Set(scCompliancePeriods.map(c => c.periodMonth))).sort().reverse();
  const compliantCount = filteredCompliance.filter(c => c.status === 'VERIFIED').length;
  const complianceRate = filteredCompliance.length > 0 
    ? (compliantCount / filteredCompliance.length) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Labour Compliance Register
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Track PF, ESIC, wage register, and minimum wage compliance for subcontractors
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
          style={{
            background: 'var(--sapButton_Background)',
            color: 'var(--sapButton_TextColor)',
            border: '1px solid var(--sapButton_BorderColor)',
          }}
        >
          <Download size={16} />
          Export Report
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Compliance Rate
            </span>
            <Users size={16} style={{ color: complianceRate >= 90 ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ 
            color: complianceRate >= 90 ? 'var(--sapPositiveColor)' : 'var(--sapCriticalColor)'
          }}>
            {complianceRate.toFixed(0)}%
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {compliantCount} of {filteredCompliance.length} compliant
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Total Labour Count
            </span>
            <Users size={16} style={{ color: 'var(--sapAccentColor6)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {filteredCompliance.reduce((sum, c) => sum + (c.labourCount || 0), 0)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Across all subcontractors
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Amount Withheld
            </span>
            <AlertTriangle size={16} style={{ color: 'var(--sapNegativeColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapNegativeColor)' }}>
            {formatCurrency(filteredCompliance.reduce((sum, c) => sum + c.withheldAmount, 0), { compact: true })}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Due to non-compliance
          </div>
        </div>

        <div className="sap-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Attendance Variance
            </span>
            <AlertTriangle size={16} style={{ color: 'var(--sapCriticalColor)' }} />
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {filteredCompliance.reduce((sum, c) => sum + (c.attendanceVariance || 0), 0)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Geo vs declared labour
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter size={16} style={{ color: 'var(--sapContent_LabelColor)' }} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ComplianceStatus | 'ALL')}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="VERIFIED">Verified</option>
            <option value="NON_COMPLIANT">Non-Compliant</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 rounded border text-sm"
            style={{
              background: 'var(--sapField_Background)',
              borderColor: 'var(--sapField_BorderColor)',
              color: 'var(--sapField_TextColor)',
            }}
          >
            <option value="ALL">All Months</option>
            {uniqueMonths.map(month => (
              <option key={month} value={month}>
                {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Compliance List */}
      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Period
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Subcontractor
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Labour Count
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                PF Challan
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                ESIC Challan
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Wage Register
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Min Wage
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Withheld
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Status
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredCompliance.map((comp, idx) => (
              <tr
                key={comp.id}
                className="cursor-pointer hover:bg-[var(--sapList_Hover_Background)]"
                style={{
                  borderBottom: '1px solid var(--sapList_BorderColor)',
                  background: idx % 2 === 0 ? 'var(--sapList_Background)' : 'var(--sapList_AlternatingBackground)',
                }}
                onClick={() => setSelectedCompliance(comp)}
              >
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  {new Date(comp.periodMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                    {comp.subcontractorName}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {comp.projectName}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {comp.labourCount || '—'}
                </td>
                <td className="px-4 py-3">
                  {comp.pfChallanNo ? (
                    <div>
                      <div className="text-xs font-mono" style={{ color: 'var(--sapTextColor)' }}>
                        {comp.pfChallanNo}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        {formatCurrency(comp.pfAmount || 0)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--sapNegativeColor)' }}>Missing</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {comp.esicChallanNo ? (
                    <div>
                      <div className="text-xs font-mono" style={{ color: 'var(--sapTextColor)' }}>
                        {comp.esicChallanNo}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        {formatCurrency(comp.esicAmount || 0)}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--sapNegativeColor)' }}>Missing</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {comp.wageRegisterFileId ? (
                    <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                  ) : (
                    <XCircle size={16} style={{ color: 'var(--sapNegativeColor)' }} />
                  )}
                </td>
                <td className="px-4 py-3">
                  {comp.minimumWageCompliant ? (
                    <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                  ) : (
                    <XCircle size={16} style={{ color: 'var(--sapNegativeColor)' }} />
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{ 
                  color: comp.withheldAmount > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)'
                }}>
                  {comp.withheldAmount > 0 ? formatCurrency(comp.withheldAmount) : '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded font-medium"
                    style={{
                      background: `${getStatusColor(comp.status)}20`,
                      color: getStatusColor(comp.status),
                    }}
                  >
                    {getStatusIcon(comp.status)}
                    {comp.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                      title="View Details"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCompliance(comp);
                      }}
                    >
                      <Eye size={16} style={{ color: 'var(--sapButton_TextColor)' }} />
                    </button>
                    {comp.status === 'SUBMITTED' && (
                      <button
                        className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                        title="Verify"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <CheckCircle size={16} style={{ color: 'var(--sapPositiveColor)' }} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Compliance Detail Modal */}
      {selectedCompliance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedCompliance(null)}>
          <div className="sap-card max-w-4xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                    Labour Compliance Details
                  </h3>
                  <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {selectedCompliance.subcontractorName} • {new Date(selectedCompliance.periodMonth + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedCompliance(null)}
                  className="p-2 rounded hover:bg-[var(--sapButton_Hover_Background)]"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Withholding */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Compliance Status
                  </label>
                  <div className="mt-1">
                    <span
                      className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded font-medium"
                      style={{
                        background: `${getStatusColor(selectedCompliance.status)}20`,
                        color: getStatusColor(selectedCompliance.status),
                      }}
                    >
                      {getStatusIcon(selectedCompliance.status)}
                      {selectedCompliance.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    Amount Withheld
                  </label>
                  <div className="text-lg font-bold mt-1" style={{ 
                    color: selectedCompliance.withheldAmount > 0 ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)'
                  }}>
                    {selectedCompliance.withheldAmount > 0 
                      ? formatCurrency(selectedCompliance.withheldAmount)
                      : 'None'
                    }
                  </div>
                </div>
              </div>

              {/* Labour Details */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                  Labour Details
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Declared Labour
                    </div>
                    <div className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedCompliance.labourCount || 0}
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ background: 'var(--sapList_Background)' }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Geo Attendance
                    </div>
                    <div className="text-xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
                      {selectedCompliance.geoAttendanceCount || 0}
                    </div>
                  </div>
                  <div className="p-3 rounded" style={{ 
                    background: (selectedCompliance.attendanceVariance || 0) < 0 ? 'var(--sapWarningBackground)' : 'var(--sapSuccessBackground)'
                  }}>
                    <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                      Variance
                    </div>
                    <div className="text-xl font-bold" style={{ 
                      color: (selectedCompliance.attendanceVariance || 0) < 0 ? 'var(--sapCriticalColor)' : 'var(--sapPositiveColor)'
                    }}>
                      {selectedCompliance.attendanceVariance || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compliance Documents */}
              <div>
                <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
                  Compliance Documents
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded border" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                    <div className="flex items-center gap-3">
                      {selectedCompliance.pfChallanNo ? (
                        <CheckCircle size={20} style={{ color: 'var(--sapPositiveColor)' }} />
                      ) : (
                        <XCircle size={20} style={{ color: 'var(--sapNegativeColor)' }} />
                      )}
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                          PF Challan
                        </div>
                        <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                          {selectedCompliance.pfChallanNo || 'Not submitted'}
                        </div>
                      </div>
                    </div>
                    {selectedCompliance.pfAmount && (
                      <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                        {formatCurrency(selectedCompliance.pfAmount)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded border" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                    <div className="flex items-center gap-3">
                      {selectedCompliance.esicChallanNo ? (
                        <CheckCircle size={20} style={{ color: 'var(--sapPositiveColor)' }} />
                      ) : (
                        <XCircle size={20} style={{ color: 'var(--sapNegativeColor)' }} />
                      )}
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                          ESIC Challan
                        </div>
                        <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                          {selectedCompliance.esicChallanNo || 'Not submitted'}
                        </div>
                      </div>
                    </div>
                    {selectedCompliance.esicAmount && (
                      <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                        {formatCurrency(selectedCompliance.esicAmount)}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between p-3 rounded border" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                    <div className="flex items-center gap-3">
                      {selectedCompliance.wageRegisterFileId ? (
                        <CheckCircle size={20} style={{ color: 'var(--sapPositiveColor)' }} />
                      ) : (
                        <XCircle size={20} style={{ color: 'var(--sapNegativeColor)' }} />
                      )}
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                          Wage Register
                        </div>
                        <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                          {selectedCompliance.wageRegisterFileId ? 'Uploaded' : 'Not submitted'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded border" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                    <div className="flex items-center gap-3">
                      {selectedCompliance.minimumWageCompliant ? (
                        <CheckCircle size={20} style={{ color: 'var(--sapPositiveColor)' }} />
                      ) : (
                        <XCircle size={20} style={{ color: 'var(--sapNegativeColor)' }} />
                      )}
                      <div>
                        <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                          Minimum Wage Compliance
                        </div>
                        <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                          {selectedCompliance.minimumWageCompliant ? 'Compliant' : 'Non-compliant'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Info */}
              {selectedCompliance.verifiedBy && (
                <div className="pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                  <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--sapTextColor)' }}>
                    Verification Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span style={{ color: 'var(--sapContent_LabelColor)' }}>Verified By: </span>
                      <span style={{ color: 'var(--sapTextColor)' }}>User {selectedCompliance.verifiedBy}</span>
                    </div>
                    <div>
                      <span style={{ color: 'var(--sapContent_LabelColor)' }}>Verified At: </span>
                      <span style={{ color: 'var(--sapTextColor)' }}>
                        {selectedCompliance.verifiedAt ? formatDate(selectedCompliance.verifiedAt) : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                {selectedCompliance.status === 'SUBMITTED' && (
                  <>
                    <button className="px-4 py-2 rounded text-sm font-medium" style={{
                      background: 'var(--sapButton_Accept_Background)',
                      color: 'var(--sapButton_Accept_TextColor)',
                      border: '1px solid var(--sapButton_Accept_BorderColor)',
                    }}>
                      Verify & Approve
                    </button>
                    <button className="px-4 py-2 rounded text-sm font-medium" style={{
                      background: 'var(--sapButton_Reject_Background)',
                      color: 'var(--sapButton_Reject_TextColor)',
                      border: '1px solid var(--sapButton_Reject_BorderColor)',
                    }}>
                      Mark Non-Compliant
                    </button>
                  </>
                )}
                {selectedCompliance.status === 'NON_COMPLIANT' && (
                  <button className="px-4 py-2 rounded text-sm font-medium" style={{
                    background: 'var(--sapButton_Emphasized_Background)',
                    color: 'var(--sapButton_Emphasized_TextColor)',
                  }}>
                    Release Withholding
                  </button>
                )}
                <button className="px-4 py-2 rounded text-sm font-medium" style={{
                  background: 'var(--sapButton_Background)',
                  color: 'var(--sapButton_TextColor)',
                  border: '1px solid var(--sapButton_BorderColor)',
                }}>
                  Download Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
