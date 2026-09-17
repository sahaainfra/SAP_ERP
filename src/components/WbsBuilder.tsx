/**
 * Part 13 — WBS Builder Component
 * Tree view with drag reorder, weightage editor, and BOQ mapping
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Edit2, Check, X, Link2 } from 'lucide-react';
import { wbsTree, wbsBoqMaps } from '../data/planningData';
import type { WbsNode } from '../types/planning';

export function WbsBuilder() {
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([1]));
  const [selectedNode, setSelectedNode] = useState<WbsNode | null>(null);
  const [editingWeightage, setEditingWeightage] = useState<number | null>(null);
  const [weightageValue, setWeightageValue] = useState<string>('');

  const toggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleWeightageEdit = (node: WbsNode) => {
    setEditingWeightage(node.id);
    setWeightageValue(node.weightage.toString());
  };

  const handleWeightageSave = () => {
    // In production, this would call the API
    console.log('Saving weightage:', editingWeightage, weightageValue);
    setEditingWeightage(null);
  };

  const handleWeightageCancel = () => {
    setEditingWeightage(null);
  };

  const renderNode = (node: WbsNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode?.id === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[var(--sapList_Hover_Background)] ${
            isSelected ? 'bg-[var(--sapList_SelectionBackgroundColor)]' : ''
          }`}
          style={{ paddingLeft: `${level * 24 + 12}px` }}
          onClick={() => setSelectedNode(node)}
        >
          {/* Expand/Collapse Icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleNode(node.id);
            }}
            className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
            style={{ visibility: hasChildren ? 'visible' : 'hidden' }}
          >
            {isExpanded ? (
              <ChevronDown size={16} style={{ color: 'var(--sapContent_IconColor)' }} />
            ) : (
              <ChevronRight size={16} style={{ color: 'var(--sapContent_IconColor)' }} />
            )}
          </button>

          {/* WBS Code */}
          <span className="font-mono text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
            {node.wbsCode}
          </span>

          {/* Name */}
          <span className="flex-1 text-sm" style={{ color: 'var(--sapTextColor)' }}>
            {node.name}
          </span>

          {/* Weightage */}
          {editingWeightage === node.id ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                value={weightageValue}
                onChange={(e) => setWeightageValue(e.target.value)}
                className="w-20 px-2 py-1 text-sm rounded border"
                style={{
                  background: 'var(--sapField_Background)',
                  borderColor: 'var(--sapField_BorderColor)',
                  color: 'var(--sapField_TextColor)',
                }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleWeightageSave();
                }}
                className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
              >
                <Check size={14} style={{ color: 'var(--sapPositiveColor)' }} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleWeightageCancel();
                }}
                className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
              >
                <X size={14} style={{ color: 'var(--sapNegativeColor)' }} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                {node.weightage}%
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleWeightageEdit(node);
                }}
                className="p-1 rounded hover:bg-[var(--sapButton_Hover_Background)]"
              >
                <Edit2 size={14} style={{ color: 'var(--sapContent_IconColor)' }} />
              </button>
            </div>
          )}

          {/* Progress */}
          <div className="flex items-center gap-2 w-32">
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${node.progressPercent || 0}%`,
                  background: 'var(--sapProgress_Value_PositiveBackground)',
                }}
              />
            </div>
            <span className="text-xs font-semibold" style={{ color: 'var(--sapTextColor)' }}>
              {node.progressPercent || 0}%
            </span>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Calculate total weightage for validation
  const calculateTotalWeightage = (node: WbsNode): number => {
    if (!node.children || node.children.length === 0) {
      return node.weightage;
    }
    return node.children.reduce((sum, child) => sum + calculateTotalWeightage(child), 0);
  };

  const totalWeightage = wbsTree[0] ? calculateTotalWeightage(wbsTree[0]) : 0;
  const isWeightageValid = Math.abs(totalWeightage - 100) < 0.001;

  return (
    <div className="flex gap-4">
      {/* WBS Tree */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
            Work Breakdown Structure
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Total Weightage:
            </span>
            <span
              className="text-sm font-semibold"
              style={{ color: isWeightageValid ? 'var(--sapPositiveColor)' : 'var(--sapNegativeColor)' }}
            >
              {totalWeightage.toFixed(2)}%
            </span>
            {!isWeightageValid && (
              <span className="text-xs" style={{ color: 'var(--sapNegativeColor)' }}>
                (Must equal 100%)
              </span>
            )}
          </div>
        </div>

        <div className="sap-card overflow-auto" style={{ maxHeight: '600px' }}>
          {wbsTree.map((node) => renderNode(node))}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedNode && (
        <div className="w-96 sap-card p-4">
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
            WBS Details
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                WBS Code
              </label>
              <div className="text-sm font-mono" style={{ color: 'var(--sapTextColor)' }}>
                {selectedNode.wbsCode}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Name
              </label>
              <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                {selectedNode.name}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Type
              </label>
              <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                {selectedNode.wbsType}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Weight Basis
              </label>
              <div className="text-sm" style={{ color: 'var(--sapTextColor)' }}>
                {selectedNode.weightBasis}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Budget Cost
              </label>
              <div className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                {selectedNode.budgetCost
                  ? `₹${(selectedNode.budgetCost / 10000000).toFixed(2)} Cr`
                  : '—'}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Progress
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapProgress_Background)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${selectedNode.progressPercent || 0}%`,
                      background: 'var(--sapProgress_Value_PositiveBackground)',
                    }}
                  />
                </div>
                <span className="text-sm font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                  {selectedNode.progressPercent || 0}%
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Variance
              </label>
              <div
                className="text-sm font-semibold"
                style={{
                  color:
                    (selectedNode.variancePercent || 0) >= 0
                      ? 'var(--sapPositiveColor)'
                      : 'var(--sapNegativeColor)',
                }}
              >
                {(selectedNode.variancePercent || 0) >= 0 ? '+' : ''}
                {selectedNode.variancePercent || 0}%
              </div>
            </div>

            {/* BOQ Mapping */}
            <div className="pt-3 border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: 'var(--sapContent_LabelColor)' }}>
                  BOQ Items Mapped
                </label>
                <button className="flex items-center gap-1 text-xs" style={{ color: 'var(--sapLinkColor)' }}>
                  <Link2 size={12} />
                  Map BOQ
                </button>
              </div>
              <div className="space-y-1">
                {wbsBoqMaps
                  .filter((map) => map.wbsId === selectedNode.id)
                  .map((map) => (
                    <div
                      key={map.id}
                      className="flex items-center justify-between text-xs p-2 rounded"
                      style={{ background: 'var(--sapList_Background)' }}
                    >
                      <span style={{ color: 'var(--sapTextColor)' }}>BOQ Item {map.boqItemId}</span>
                      <span className="font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                        {map.mappedQty} units
                      </span>
                    </div>
                  ))}
                {wbsBoqMaps.filter((map) => map.wbsId === selectedNode.id).length === 0 && (
                  <div className="text-xs text-center py-2" style={{ color: 'var(--sapContent_LabelColor)' }}>
                    No BOQ items mapped
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
