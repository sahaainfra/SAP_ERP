/**
 * Part 12 — Organization Structure Explorer
 * Tree view of enterprise hierarchy with drill-down capabilities
 */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Building2, Briefcase, MapPin, Folder, Package, Users } from 'lucide-react';
import { orgNodes } from '../data/masterData';
import type { OrgNode, OrgLevelType } from '../types/masterData';

export function OrgStructureExplorer() {
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set([1]));

  const toggleNode = (nodeId: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const getLevelIcon = (levelType: OrgLevelType) => {
    switch (levelType) {
      case 'COMPANY': return <Building2 size={16} />;
      case 'BU': return <Briefcase size={16} />;
      case 'BRANCH': return <MapPin size={16} />;
      case 'DEPT': return <Users size={16} />;
      case 'PROJECT': return <Folder size={16} />;
      case 'PACKAGE': return <Package size={16} />;
      case 'SITE': return <MapPin size={16} />;
      default: return <Folder size={16} />;
    }
  };

  const getLevelColor = (levelType: OrgLevelType) => {
    switch (levelType) {
      case 'COMPANY': return 'var(--sapAccentColor1)';
      case 'BU': return 'var(--sapAccentColor2)';
      case 'BRANCH': return 'var(--sapAccentColor3)';
      case 'DEPT': return 'var(--sapAccentColor4)';
      case 'PROJECT': return 'var(--sapAccentColor5)';
      case 'PACKAGE': return 'var(--sapAccentColor6)';
      case 'SITE': return 'var(--sapAccentColor7)';
      default: return 'var(--sapAccentColor8)';
    }
  };

  const renderNode = (node: OrgNode, depth: number = 0) => {
    const children = orgNodes.filter(n => n.parentId === node.id);
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = children.length > 0;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--sapList_Hover_Background)] cursor-pointer rounded"
          style={{
            paddingLeft: `${depth * 24 + 12}px`,
            background: selectedNode?.id === node.id ? 'var(--sapList_SelectionBackgroundColor)' : undefined,
          }}
          onClick={() => {
            setSelectedNode(node);
            if (hasChildren) toggleNode(node.id);
          }}
        >
          {hasChildren && (
            <span className="text-[var(--sapContent_LabelColor)]">
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          )}
          {!hasChildren && <span className="w-4" />}
          
          <span style={{ color: getLevelColor(node.levelType) }}>
            {getLevelIcon(node.levelType)}
          </span>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--sapTextColor)]">{node.code}</span>
              <span className="text-[var(--sapContent_LabelColor)] truncate">{node.name}</span>
            </div>
            <div className="text-xs text-[var(--sapContent_LabelColor)]">
              {node.levelType} • {node.childrenCount || 0} children
            </div>
          </div>

          {!node.isActive && (
            <span className="text-xs px-2 py-0.5 rounded bg-[var(--sapErrorBackground)] text-[var(--sapNegativeTextColor)]">
              Inactive
            </span>
          )}
        </div>

        {isExpanded && hasChildren && (
          <div>
            {children.map(child => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootNodes = orgNodes.filter(n => n.parentId === null);

  return (
    <div className="flex gap-4 h-[calc(100vh-200px)]">
      {/* Tree View */}
      <div className="flex-1 sap-card overflow-auto">
        <div className="p-4 border-b border-[var(--sapList_BorderColor)]">
          <h2 className="text-lg font-semibold text-[var(--sapTextColor)]">Organization Structure</h2>
          <p className="text-sm text-[var(--sapContent_LabelColor)]">Enterprise hierarchy explorer</p>
        </div>
        <div className="p-2">
          {rootNodes.map(node => renderNode(node))}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedNode && (
        <div className="w-96 sap-card overflow-auto">
          <div className="p-4 border-b border-[var(--sapList_BorderColor)]">
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: getLevelColor(selectedNode.levelType) }}>
                {getLevelIcon(selectedNode.levelType)}
              </span>
              <h2 className="text-lg font-semibold text-[var(--sapTextColor)]">{selectedNode.name}</h2>
            </div>
            <p className="text-sm text-[var(--sapContent_LabelColor)]">{selectedNode.code}</p>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <label className="text-xs font-medium text-[var(--sapContent_LabelColor)]">Level Type</label>
              <div className="text-sm text-[var(--sapTextColor)]">{selectedNode.levelType}</div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--sapContent_LabelColor)]">Source Table</label>
              <div className="text-sm text-[var(--sapTextColor)] font-mono">{selectedNode.sourceTable}</div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--sapContent_LabelColor)]">Source ID</label>
              <div className="text-sm text-[var(--sapTextColor)]">{selectedNode.sourceId}</div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--sapContent_LabelColor)]">Path</label>
              <div className="text-sm text-[var(--sapTextColor)] font-mono">{selectedNode.path}</div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--sapContent_LabelColor)]">Depth</label>
              <div className="text-sm text-[var(--sapTextColor)]">{selectedNode.depth}</div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--sapContent_LabelColor)]">Status</label>
              <div className="text-sm">
                <span className={`px-2 py-0.5 rounded ${
                  selectedNode.isActive 
                    ? 'bg-[var(--sapSuccessBackground)] text-[var(--sapPositiveTextColor)]'
                    : 'bg-[var(--sapErrorBackground)] text-[var(--sapNegativeTextColor)]'
                }`}>
                  {selectedNode.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--sapContent_LabelColor)]">Children Count</label>
              <div className="text-sm text-[var(--sapTextColor)]">{selectedNode.childrenCount || 0}</div>
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--sapContent_LabelColor)]">Last Synced</label>
              <div className="text-sm text-[var(--sapTextColor)]">
                {new Date(selectedNode.syncedAt).toLocaleString()}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--sapList_BorderColor)]">
              <h3 className="text-sm font-semibold text-[var(--sapTextColor)] mb-2">Where Used</h3>
              <div className="text-xs text-[var(--sapContent_LabelColor)]">
                This node is referenced by {selectedNode.childrenCount || 0} child nodes and multiple transactions.
              </div>
              <button className="mt-2 text-sm text-[var(--sapLinkColor)] hover:underline">
                View all references →
              </button>
            </div>

            <div className="pt-4 border-t border-[var(--sapList_BorderColor)] space-y-2">
              <button className="w-full px-4 py-2 rounded text-sm font-medium bg-[var(--sapButton_Emphasized_Background)] text-[var(--sapButton_Emphasized_TextColor)] hover:opacity-90">
                Edit Details
              </button>
              <button className="w-full px-4 py-2 rounded text-sm font-medium border border-[var(--sapButton_BorderColor)] text-[var(--sapButton_TextColor)] hover:bg-[var(--sapButton_Hover_Background)]">
                View Transactions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
