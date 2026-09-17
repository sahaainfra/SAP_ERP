/**
 * Part 13 — S-Curve Component
 * Planned vs Actual vs Earned value curve
 */

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { progressSnapshots } from '../data/planningData';

export function SCurve() {
  const chartData = progressSnapshots.map((snapshot) => ({
    date: new Date(snapshot.snapshotDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    planned: snapshot.plannedPercent,
    actual: snapshot.actualPercent,
    earned: snapshot.earnedValue ? (snapshot.earnedValue / 10000000).toFixed(2) : 0,
  }));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
        S-Curve Analysis
      </h3>
      <div className="sap-card p-4">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--sapContent_GridColor)" />
            <XAxis dataKey="date" stroke="var(--sapContent_LabelColor)" />
            <YAxis stroke="var(--sapContent_LabelColor)" />
            <Tooltip
              contentStyle={{
                background: 'var(--sapTile_Background)',
                border: '1px solid var(--sapGroup_ContentBorderColor)',
                borderRadius: 'var(--sapElement_BorderCornerRadius)',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="planned"
              stroke="var(--sapChart_OrderedColor_5)"
              strokeWidth={2}
              name="Planned %"
              dot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="var(--sapChart_OrderedColor_1)"
              strokeWidth={2}
              name="Actual %"
              dot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Planned Progress
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {progressSnapshots[progressSnapshots.length - 1]?.plannedPercent || 0}%
          </div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Actual Progress
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {progressSnapshots[progressSnapshots.length - 1]?.actualPercent || 0}%
          </div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Variance
          </div>
          <div
            className="text-2xl font-bold"
            style={{
              color:
                (progressSnapshots[progressSnapshots.length - 1]?.variancePercent || 0) >= 0
                  ? 'var(--sapPositiveColor)'
                  : 'var(--sapNegativeColor)',
            }}
          >
            {progressSnapshots[progressSnapshots.length - 1]?.variancePercent || 0}%
          </div>
        </div>
      </div>
    </div>
  );
}
