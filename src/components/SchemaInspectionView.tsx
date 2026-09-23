/**
 * Part 02 — Schema Inspection View
 * 
 * Displays the results of the system inspection:
 * - SCHEMA_MAP validation status
 * - Business object mapping (present vs NOT PRESENT)
 * - Gap report
 * - Audit foundation status
 * - Additive-only policy enforcement
 */

import React, { useState, useEffect } from 'react';
import { validateSchemaMap, getSchemaValidationSummary } from '../services/SchemaValidator';
import { auditFoundation } from '../services/AuditFoundation';
import { SCHEMA_MAP, getMissingBusinessObjects, getPresentBusinessObjects } from '../config/schema-map';
import {
  Database,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Shield,
  FileText,
  TrendingUp,
} from 'lucide-react';

export function SchemaInspectionView() {
  const [validationResult, setValidationResult] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [auditStats, setAuditStats] = useState<any>(null);

  useEffect(() => {
    // Run validation on mount
    const result = validateSchemaMap();
    setValidationResult(result);
    
    const summaryData = getSchemaValidationSummary();
    setSummary(summaryData);
    
    // Get audit stats
    const allAudits = auditFoundation.getAll();
    const deniedAudits = auditFoundation.getDeniedActions();
    setAuditStats({
      total: allAudits.totalCount,
      denied: deniedAudits.totalCount,
    });
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'degraded': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 size={20} className="text-emerald-600" />;
      case 'degraded': return <AlertTriangle size={20} className="text-amber-600" />;
      case 'critical': return <XCircle size={20} className="text-red-600" />;
      default: return <Info size={20} className="text-slate-600" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Database size={24} className="text-blue-600" />
            System Inspection & Schema Validation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Part 02 — Existing System Inspection, Database Preservation & Adapter Layer
          </p>
        </div>
        {summary && (
          <div className={`px-4 py-2 rounded-lg border ${getStatusColor(summary.status)}`}>
            <div className="flex items-center gap-2">
              {getStatusIcon(summary.status)}
              <span className="font-semibold text-sm">{summary.status.toUpperCase()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {validationResult && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database size={16} className="text-slate-400" />
              <span className="text-xs font-semibold text-slate-600 uppercase">Total Objects</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{validationResult.totalBusinessObjects}</p>
            <p className="text-xs text-slate-500 mt-1">Business objects defined</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span className="text-xs font-semibold text-slate-600 uppercase">Present</span>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{validationResult.presentObjects}</p>
            <p className="text-xs text-slate-500 mt-1">Mapped to existing tables</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <span className="text-xs font-semibold text-slate-600 uppercase">Not Present</span>
            </div>
            <p className="text-3xl font-bold text-amber-600">{validationResult.missingObjects}</p>
            <p className="text-xs text-slate-500 mt-1">Will show empty states</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} className="text-blue-500" />
              <span className="text-xs font-semibold text-slate-600 uppercase">Audit Events</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{auditStats?.total || 0}</p>
            <p className="text-xs text-slate-500 mt-1">
              {auditStats?.denied || 0} denied actions
            </p>
          </div>
        </div>
      )}

      {/* Validation Summary */}
      {summary && (
        <div className={`rounded-xl border p-4 ${getStatusColor(summary.status)}`}>
          <h2 className="text-sm font-semibold mb-2">{summary.message}</h2>
          <ul className="space-y-1">
            {summary.details.map((detail: string, i: number) => (
              <li key={i} className="text-sm flex items-start gap-2">
                <span className="text-xs mt-1">•</span>
                <span>{detail}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Business Object Mapping */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
          <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <FileText size={16} className="text-slate-400" />
            Business Object to Table Mapping
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Every business object is mapped to a real table name or marked NOT PRESENT
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-slate-700">Business Object</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-700">Status</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-700">Table Name</th>
                <th className="text-left px-4 py-2 font-semibold text-slate-700">Primary Key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(SCHEMA_MAP).map(([businessObject, mapping]) => (
                <tr key={businessObject} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-800">{businessObject}</td>
                  <td className="px-4 py-2">
                    {mapping === null ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <AlertTriangle size={10} />
                        NOT PRESENT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <CheckCircle2 size={10} />
                        PRESENT
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-600 font-mono text-xs">
                    {mapping?.table || '—'}
                  </td>
                  <td className="px-4 py-2 text-slate-600 font-mono text-xs">
                    {mapping?.pk || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gap Report */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-amber-500" />
          Gap Report
        </h2>
        <p className="text-sm text-slate-600 mb-3">
          Business objects marked NOT PRESENT will be created by the parts that own them.
          No tables are created in Part 02.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {getMissingBusinessObjects().map((obj) => (
            <div
              key={obj}
              className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs"
            >
              <span className="font-medium text-amber-800">{obj}</span>
              <span className="text-amber-600 ml-2">→ will be created by owning part</span>
            </div>
          ))}
        </div>
      </div>

      {/* Additive-Only Policy */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
          <Shield size={16} className="text-blue-500" />
          Database Preservation Policy
        </h2>
        <div className="space-y-3 text-sm">
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Forbidden (without written approval)</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-1 text-xs">
              <li>DROP TABLE, DROP COLUMN, RENAME TABLE, RENAME COLUMN</li>
              <li>Changing column data type, nullability, or default</li>
              <li>Changing, dropping or re-pointing primary/foreign keys</li>
              <li>Deleting rows from business tables</li>
              <li>Creating duplicate tables (no projects_new, no vendor_master_v2)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Permitted (additive only)</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-1 text-xs">
              <li>Creating NEW tables prefixed <code className="bg-slate-100 px-1 rounded">dx_</code></li>
              <li>Adding NEW nullable columns to existing tables (with justification)</li>
              <li>Adding read-only views prefixed <code className="bg-slate-100 px-1 rounded">vw_dx_</code></li>
              <li>Adding indexes for dashboard query performance</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-700 mb-1">Migration Discipline</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-1 text-xs">
              <li>One migration file per logical change, forward and reversible</li>
              <li>Every migration is idempotent: CREATE TABLE IF NOT EXISTS</li>
              <li>No migration runs destructive SQL</li>
              <li>Test against restored production copy before applying</li>
              <li>Record in DB_CHANGELOG.md with rollback procedure</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Audit Foundation */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-3">
          <TrendingUp size={16} className="text-blue-500" />
          Audit Foundation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">What is Recorded</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-1 text-xs">
              <li>Timestamp (UTC)</li>
              <li>User ID and impersonated-by</li>
              <li>Session ID, IP, User Agent</li>
              <li>Module, Entity Type, Entity ID</li>
              <li>Action (create, update, delete, approve, etc.)</li>
              <li>Before and After values</li>
              <li>Company/Project/Site scope</li>
              <li>Permission key used</li>
              <li>Result (allowed/denied)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-700 mb-2">Enforcement</h3>
            <ul className="list-disc list-inside text-slate-600 space-y-1 text-xs">
              <li>Audit rows are append-only</li>
              <li>No UPDATE or DELETE permissions</li>
              <li>Enforced at database level, not by convention</li>
              <li>Denied permission attempts are audited</li>
              <li>Hash-chained for tamper detection (Part 09)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Validation Errors and Warnings */}
      {validationResult && (validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Validation Details</h2>
          
          {validationResult.errors.length > 0 && (
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-red-700 mb-2 flex items-center gap-1">
                <XCircle size={12} />
                Errors ({validationResult.errors.length})
              </h3>
              <div className="space-y-1">
                {validationResult.errors.map((error: any, i: number) => (
                  <div key={i} className="text-xs bg-red-50 border border-red-200 rounded px-3 py-2">
                    <span className="font-mono text-red-700">[{error.code}]</span>{' '}
                    <span className="text-slate-700">{error.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {validationResult.warnings.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
                <AlertTriangle size={12} />
                Warnings ({validationResult.warnings.length})
              </h3>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {validationResult.warnings.slice(0, 20).map((warning: any, i: number) => (
                  <div key={i} className="text-xs bg-amber-50 border border-amber-200 rounded px-3 py-2">
                    <span className="font-mono text-amber-700">[{warning.code}]</span>{' '}
                    <span className="text-slate-700">{warning.message}</span>
                  </div>
                ))}
                {validationResult.warnings.length > 20 && (
                  <div className="text-xs text-slate-500 italic px-3 py-2">
                    ... and {validationResult.warnings.length - 20} more warnings
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
