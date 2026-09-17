/**
 * Part 13 — Resource Histogram Component
 * Stacked bars showing resource deployment over time
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { resourcePlans } from '../data/planningData';

export function ResourceHistogram() {
  // Group resources by type and period
  const manpowerData = resourcePlans
    .filter((r) => r.resourceType === 'MANPOWER')
    .map((r) => ({
      period: `${new Date(r.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      planned: r.plannedQty,
      deployed: r.plannedQty * 0.9, // Mock deployed data
    }));

  const materialData = resourcePlans
    .filter((r) => r.resourceType === 'MATERIAL')
    .map((r) => ({
      period: `${new Date(r.periodStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      planned: r.plannedQty,
      consumed: r.plannedQty * 0.85, // Mock consumed data
    }));

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
        Resource Histogram
      </h3>

      {/* Manpower Histogram */}
      <div className="sap-card p-4 mb-4">
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
          Manpower Deployment
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={manpowerData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--sapContent_GridColor)" />
            <XAxis dataKey="period" stroke="var(--sapContent_LabelColor)" />
            <YAxis stroke="var(--sapContent_LabelColor)" />
            <Tooltip
              contentStyle={{
                background: 'var(--sapTile_Background)',
                border: '1px solid var(--sapGroup_ContentBorderColor)',
                borderRadius: 'var(--sapElement_BorderCornerRadius)',
              }}
            />
            <Legend />
            <Bar dataKey="planned" fill="var(--sapChart_OrderedColor_5)" name="Planned" />
            <Bar dataKey="deployed" fill="var(--sapChart_OrderedColor_1)" name="Deployed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Material Histogram */}
      <div className="sap-card p-4">
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--sapTextColor)' }}>
          Material Consumption
        </h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={materialData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--sapContent_GridColor)" />
            <XAxis dataKey="period" stroke="var(--sapContent_LabelColor)" />
            <YAxis stroke="var(--sapContent_LabelColor)" />
            <Tooltip
              contentStyle={{
                background: 'var(--sapTile_Background)',
                border: '1px solid var(--sapGroup_ContentBorderColor)',
                borderRadius: 'var(--sapElement_BorderCornerRadius)',
              }}
            />
            <Legend />
            <Bar dataKey="planned" fill="var(--sapChart_OrderedColor_5)" name="Planned" />
            <Bar dataKey="consumed" fill="var(--sapChart_OrderedColor_2)" name="Consumed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Total Manpower (Planned)
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            {manpowerData.reduce((sum, d) => sum + d.planned, 0)} nos
          </div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Total Material Cost
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            ₹{(resourcePlans.filter(r => r.resourceType === 'MATERIAL').reduce((sum, r) => sum + (r.plannedCost || 0), 0) / 100000).toFixed(1)}L
          </div>
        </div>
        <div className="sap-card p-4">
          <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Equipment Utilization
          </div>
          <div className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            78%
          </div>
        </div>
      </div>
    </div>
  );
}
