/**
 * Part 13 — Progress Entry Component
 * Grid by WBS with method-appropriate inputs
 */

import React, { useState } from 'react';
import { wbsTree, progressEntries } from '../data/planningData';
import type { WbsNode, ProgressMethod } from '../types/planning';

export function ProgressEntry() {
  const [selectedWbs, setSelectedWbs] = useState<WbsNode | null>(null);
  const [progressMethod, setProgressMethod] = useState<ProgressMethod>('QUANTITY');
  const [progressValue, setProgressValue] = useState<string>('');
  const [cutoffDate, setCutoffDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [remark, setRemark] = useState<string>('');

  const flattenWbs = (nodes: WbsNode[]): WbsNode[] => {
    return nodes.reduce((acc, node) => {
      acc.push(node);
      if (node.children) {
        acc.push(...flattenWbs(node.children));
      }
      return acc;
    }, [] as WbsNode[]);
  };

  const allWbsNodes = flattenWbs(wbsTree);

  const handleSubmit = () => {
    console.log('Submitting progress:', {
      wbsId: selectedWbs?.id,
      method: progressMethod,
      value: progressValue,
      cutoffDate,
      remark,
    });
  };

  return (
    <div className="flex gap-4">
      {/* WBS List */}
      <div className="flex-1">
        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
          Select WBS Node
        </h3>
        <div className="sap-card overflow-auto" style={{ maxHeight: '600px' }}>
          <table className="w-full">
            <thead className="sticky top-0" style={{ background: 'var(--sapList_HeaderBackground)' }}>
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  WBS Code
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  Name
                </th>
                <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  Current %
                </th>
                <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  Planned %
                </th>
                <th className="text-right px-4 py-2 text-xs font-semibold" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
                  Variance
                </th>
              </tr>
            </thead>
            <tbody>
              {allWbsNodes.map((node) => (
                <tr
                  key={node.id}
                  className={`cursor-pointer hover:bg-[var(--sapList_Hover_Background)] ${
                    selectedWbs?.id === node.id ? 'bg-[var(--sapList_SelectionBackgroundColor)]' : ''
                  }`}
                  onClick={() => setSelectedWbs(node)}
                >
                  <td className="px-4 py-2 text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                    {node.wbsCode}
                  </td>
                  <td className="px-4 py-2 text-sm" style={{ color: 'var(--sapTextColor)' }}>
                    {node.name}
                  </td>
                  <td className="px-4 py-2 text-sm text-right font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                    {node.progressPercent || 0}%
                  </td>
                  <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    {node.plannedPercent || 0}%
                  </td>
                  <td
                    className="px-4 py-2 text-sm text-right font-semibold"
                    style={{
                      color:
                        (node.variancePercent || 0) >= 0
                          ? 'var(--sapPositiveColor)'
                          : 'var(--sapNegativeColor)',
                    }}
                  >
                    {(node.variancePercent || 0) >= 0 ? '+' : ''}
                    {node.variancePercent || 0}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Progress Entry Form */}
      {selectedWbs && (
        <div className="w-96 sap-card p-4">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
            Record Progress
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--sapTextColor)' }}>
                WBS Node
              </label>
              <div className="text-sm font-mono" style={{ color: 'var(--sapContent_LabelColor)' }}>
                {selectedWbs.wbsCode} - {selectedWbs.name}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Progress Method
              </label>
              <select
                value={progressMethod}
                onChange={(e) => setProgressMethod(e.target.value as ProgressMethod)}
                className="w-full px-3 py-2 text-sm rounded border"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
              >
                <option value="QUANTITY">Quantity (from MB)</option>
                <option value="MILESTONE">Milestone</option>
                <option value="STEP">Step</option>
                <option value="DURATION">Duration</option>
                <option value="UNITS">Units</option>
                <option value="MANUAL">Manual</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Cut-off Date
              </label>
              <input
                type="date"
                value={cutoffDate}
                onChange={(e) => setCutoffDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded border"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--sapTextColor)' }}>
                {progressMethod === 'QUANTITY' ? 'Executed Quantity' : 'Progress %'}
              </label>
              <input
                type="number"
                value={progressValue}
                onChange={(e) => setProgressValue(e.target.value)}
                placeholder={progressMethod === 'QUANTITY' ? 'Enter quantity' : 'Enter percentage'}
                className="w-full px-3 py-2 text-sm rounded border"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: 'var(--sapTextColor)' }}>
                Remark
              </label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded border"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
              />
            </div>

            {progressMethod === 'MANUAL' && (
              <div className="p-3 rounded" style={{ background: 'var(--sapWarningBackground)' }}>
                <p className="text-xs" style={{ color: 'var(--sapCriticalTextColor)' }}>
                  Manual progress requires approval and is capped at 90% without QA verification.
                </p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="w-full px-4 py-2 rounded text-sm font-medium"
              style={{
                background: 'var(--sapButton_Emphasized_Background)',
                color: 'var(--sapButton_Emphasized_TextColor)',
              }}
            >
              Submit Progress
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
