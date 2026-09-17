/**
 * Part 13 — Baseline Compare Component
 * Side-by-side comparison of baseline vs actual
 */

import React, { useState } from 'react';
import { baselines, baselineActivities, scheduleActivities } from '../data/planningData';

export function BaselineCompare() {
  const [selectedBaseline, setSelectedBaseline] = useState(baselines.find(b => b.isCurrent)?.id || 1);

  const baseline = baselines.find(b => b.id === selectedBaseline);
  const baselineActs = baselineActivities.filter(a => a.baselineId === selectedBaseline);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
          Baseline Comparison
        </h3>
        <select
          value={selectedBaseline}
          onChange={(e) => setSelectedBaseline(Number(e.target.value))}
          className="px-3 py-2 text-sm rounded border"
          style={{
            background: 'var(--sapField_Background)',
            borderColor: 'var(--sapField_BorderColor)',
            color: 'var(--sapField_TextColor)',
          }}
        >
          {baselines.map((b) => (
            <option key={b.id} value={b.id}>
              Baseline {b.baselineNo} - {b.baselineType} {b.isCurrent ? '(Current)' : ''}
            </option>
          ))}
        </select>
      </div>

      {baseline && (
        <>
          {/* Baseline Info */}
          <div className="sap-card p-4 mb-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Baseline No
                </div>
                <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                  {baseline.baselineNo}
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Type
                </div>
                <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                  {baseline.baselineType}
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Snapshot Date
                </div>
                <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                  {new Date(baseline.snapshotAt).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Status
                </div>
                <div
                  className="text-lg font-bold"
                  style={{
                    color:
                      baseline.status === 'APPROVED'
                        ? 'var(--sapPositiveColor)'
                        : 'var(--sapCriticalColor)',
                  }}
                >
                  {baseline.status}
                </div>
              </div>
            </div>
            {baseline.reason && (
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  Reason
                </div>
                <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                  {baseline.reason}
                </div>
              </div>
            )}
          </div>

          {/* Activity Comparison */}
          <div className="sap-card overflow-hidden">
            <table className="w-full">
              <thead style={{ background: 'var(--sapList_HeaderBackground)' }}>
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                    Activity
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                    Baseline Start
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                    Baseline Finish
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                    Actual Start
                  </th>
                  <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                    Actual Finish
                  </th>
                  <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                    Variance (days)
                  </th>
                </tr>
              </thead>
              <tbody>
                {baselineActs.map((blAct) => {
                  const actualAct = scheduleActivities.find((a) => a.id === blAct.activityId);
                  const startVariance = actualAct?.actualStart
                    ? Math.ceil(
                        (new Date(actualAct.actualStart).getTime() - new Date(blAct.plannedStart).getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    : null;

                  return (
                    <tr key={blAct.id} style={{ borderBottom: '1px solid var(--sapList_BorderColor)' }}>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium" style={{ color: 'var(--sapTextColor)' }}>
                          {actualAct?.activityCode}
                        </div>
                        <div className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
                          {actualAct?.name}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                        {new Date(blAct.plannedStart).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                        {new Date(blAct.plannedFinish).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                        {actualAct?.actualStart
                          ? new Date(actualAct.actualStart).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                        {actualAct?.actualFinish
                          ? new Date(actualAct.actualFinish).toLocaleDateString()
                          : '—'}
                      </td>
                      <td
                        className="px-4 py-3 text-sm text-right font-semibold"
                        style={{
                          color:
                            startVariance === null
                              ? 'var(--sapContent_LabelColor)'
                              : startVariance <= 0
                              ? 'var(--sapPositiveColor)'
                              : 'var(--sapNegativeColor)',
                        }}
                      >
                        {startVariance !== null ? (startVariance > 0 ? '+' : '') + startVariance : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
