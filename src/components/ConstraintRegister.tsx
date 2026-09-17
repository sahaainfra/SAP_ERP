/**
 * Part 13 — Constraint Register Component
 * List of constraints/obstructions with severity and ageing
 */

import React from 'react';
import { constraints } from '../data/planningData';

export function ConstraintRegister() {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
        Constraint Register
      </h3>
      <div className="sap-card overflow-hidden">
        <table className="w-full">
          <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
            <tr>
              <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Title</th>
              <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Type</th>
              <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Severity</th>
              <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Status</th>
              <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Delay (days)</th>
              <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>Cost Impact</th>
            </tr>
          </thead>
          <tbody>
            {constraints.map((constraint) => (
              <tr key={constraint.id} style={{ borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>{constraint.title}</div>
                  <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>{constraint.description}</div>
                </td>
                <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>{constraint.constraintType}</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded" style={{
                    background: constraint.severity === 'CRITICAL' ? 'var(--sapErrorBackground)' :
                               constraint.severity === 'HIGH' ? 'var(--sapWarningBackground)' : 'var(--sapInformationBackground)',
                    color: constraint.severity === 'CRITICAL' ? 'var(--sapNegativeTextColor)' :
                           constraint.severity === 'HIGH' ? 'var(--sapCriticalTextColor)' : 'var(--sapInformativeTextColor)'
                  }}>
                    {constraint.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-1 rounded" style={{
                    background: constraint.status === 'RESOLVED' ? 'var(--sapSuccessBackground)' :
                               constraint.status === 'OPEN' ? 'var(--sapWarningBackground)' : 'var(--sapInformationBackground)',
                    color: constraint.status === 'RESOLVED' ? 'var(--sapPositiveTextColor)' :
                           constraint.status === 'OPEN' ? 'var(--sapCriticalTextColor)' : 'var(--sapInformativeTextColor)'
                  }}>
                    {constraint.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {constraint.delayDays || 0}
                </td>
                <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--sapTextColor)' }}>
                  {constraint.costImpact ? `₹${(constraint.costImpact / 100000).toFixed(1)}L` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
