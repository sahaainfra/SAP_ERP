/**
 * Part 22 — Document Chain Visualization Component
 * 
 * Visual graph showing upstream and downstream document relationships.
 * Nodes are permission-filtered: unauthorized nodes show as "Restricted".
 */

import React, { useState } from 'react';
import { DocumentChain, DocumentChainNode, DocumentChainEdge } from '../../platform/dashboard/role-dashboard-types';

interface DocumentChainGraphProps {
  chain: DocumentChain;
  onNodeClick?: (node: DocumentChainNode) => void;
}

export const DocumentChainGraph: React.FC<DocumentChainGraphProps> = ({ 
  chain, 
  onNodeClick 
}) => {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  // Organize nodes by type for better layout
  const nodesByType = chain.nodes.reduce((acc, node) => {
    if (!acc[node.entityType]) {
      acc[node.entityType] = [];
    }
    acc[node.entityType].push(node);
    return acc;
  }, {} as Record<string, DocumentChainNode[]>);

  const handleNodeClick = (node: DocumentChainNode) => {
    setSelectedNode(node.id);
    if (node.accessible && onNodeClick) {
      onNodeClick(node);
    }
  };

  const getNodeColor = (node: DocumentChainNode): string => {
    if (!node.accessible) return 'var(--sapNeutralColor, #6a6d70)';
    
    const statusColors: Record<string, string> = {
      'DRAFT': 'var(--sapNeutralColor, #6a6d70)',
      'SUBMITTED': 'var(--sapInformativeColor, #0a6ed1)',
      'APPROVED': 'var(--sapPositiveColor, #107e3e)',
      'RELEASED': 'var(--sapPositiveColor, #107e3e)',
      'REJECTED': 'var(--sapNegativeColor, #bb0000)',
      'CANCELLED': 'var(--sapNegativeColor, #bb0000)',
      'POSTED': 'var(--sapPositiveColor, #107e3e)',
      'PAID': 'var(--sapPositiveColor, #107e3e)',
    };
    
    return statusColors[node.status] || 'var(--sapNeutralColor, #6a6d70)';
  };

  const formatValue = (value?: number): string => {
    if (!value) return '';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(2)} Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(2)} L`;
    return `₹${value.toLocaleString('en-IN')}`;
  };

  // Calculate layout positions
  const layoutNodes = (): Array<{ node: DocumentChainNode; x: number; y: number }> => {
    const types = Object.keys(nodesByType);
    const nodeSpacing = 200;
    const typeSpacing = 150;
    
    return chain.nodes.map((node, index) => {
      const typeIndex = types.indexOf(node.entityType);
      const nodesOfType = nodesByType[node.entityType];
      const nodeIndex = nodesOfType.indexOf(node);
      
      return {
        node,
        x: typeIndex * typeSpacing + 100,
        y: nodeIndex * nodeSpacing + 100,
      };
    });
  };

  const positionedNodes = layoutNodes();

  return (
    <div className="document-chain-graph">
      {/* Controls */}
      <div className="graph-controls">
        <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>−</button>
        <span className="zoom-level">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(Math.min(2, zoom + 0.1))}>+</button>
        <button onClick={() => setZoom(1)}>Reset</button>
      </div>

      {/* Graph Container */}
      <div className="graph-container" style={{ transform: `scale(${zoom})` }}>
        <svg width="100%" height="600" className="graph-svg">
          {/* Edges */}
          {chain.edges.map((edge, index) => {
            const fromNode = positionedNodes.find(p => p.node.id === edge.from);
            const toNode = positionedNodes.find(p => p.node.id === edge.to);
            
            if (!fromNode || !toNode) return null;

            return (
              <g key={index}>
                <line
                  x1={fromNode.x + 60}
                  y1={fromNode.y + 40}
                  x2={toNode.x + 60}
                  y2={toNode.y + 40}
                  stroke="var(--sapContent_ForegroundBorderColor, #bfbfbf)"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <text
                  x={(fromNode.x + toNode.x) / 2 + 60}
                  y={(fromNode.y + toNode.y) / 2 + 30}
                  textAnchor="middle"
                  className="edge-label"
                  style={{ fontSize: '10px', fill: 'var(--sapContent_LabelColor, #6a6d70)' }}
                >
                  {edge.relationship}
                </text>
              </g>
            );
          })}

          {/* Arrow marker definition */}
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
              <polygon points="0 0, 10 3, 0 6" fill="var(--sapContent_ForegroundBorderColor, #bfbfbf)" />
            </marker>
          </defs>

          {/* Nodes */}
          {positionedNodes.map(({ node, x, y }) => (
            <g
              key={node.id}
              transform={`translate(${x}, ${y})`}
              onClick={() => handleNodeClick(node)}
              className={`graph-node ${node.accessible ? 'accessible' : 'restricted'} ${selectedNode === node.id ? 'selected' : ''}`}
              style={{ cursor: node.accessible ? 'pointer' : 'default' }}
            >
              {/* Node box */}
              <rect
                width="120"
                height="80"
                rx="4"
                fill={node.accessible ? 'var(--sapTile_Background, #fff)' : 'var(--sapNeutralBackground, #f5f5f5)'}
                stroke={getNodeColor(node)}
                strokeWidth={selectedNode === node.id ? '3' : '2'}
              />

              {/* Node content */}
              {node.accessible ? (
                <>
                  <text x="60" y="20" textAnchor="middle" className="node-type" style={{ fontSize: '10px', fill: 'var(--sapContent_LabelColor, #6a6d70)' }}>
                    {node.entityType.toUpperCase()}
                  </text>
                  <text x="60" y="38" textAnchor="middle" className="node-number" style={{ fontSize: '12px', fontWeight: 'bold', fill: 'var(--sapTextColor, #32363a)' }}>
                    {node.documentNumber}
                  </text>
                  <text x="60" y="55" textAnchor="middle" className="node-status" style={{ fontSize: '10px', fill: getNodeColor(node) }}>
                    {node.status}
                  </text>
                  {node.value && (
                    <text x="60" y="70" textAnchor="middle" className="node-value" style={{ fontSize: '10px', fill: 'var(--sapTextColor, #32363a)' }}>
                      {formatValue(node.value)}
                    </text>
                  )}
                </>
              ) : (
                <>
                  <text x="60" y="35" textAnchor="middle" className="node-restricted-icon" style={{ fontSize: '20px' }}>
                    🔒
                  </text>
                  <text x="60" y="55" textAnchor="middle" className="node-restricted-label" style={{ fontSize: '11px', fill: 'var(--sapContent_LabelColor, #6a6d70)' }}>
                    Restricted
                  </text>
                  <text x="60" y="70" textAnchor="middle" className="node-type-only" style={{ fontSize: '10px', fill: 'var(--sapContent_LabelColor, #6a6d70)' }}>
                    {node.entityType}
                  </text>
                </>
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="graph-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'var(--sapPositiveColor, #107e3e)' }} />
          <span>Approved/Completed</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'var(--sapInformativeColor, #0a6ed1)' }} />
          <span>In Progress</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'var(--sapNegativeColor, #bb0000)' }} />
          <span>Rejected/Cancelled</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: 'var(--sapNeutralColor, #6a6d70)' }} />
          <span>Draft/Restricted</span>
        </div>
      </div>

      {/* Node Details Panel */}
      {selectedNode && (
        <div className="node-details-panel">
          {(() => {
            const node = chain.nodes.find(n => n.id === selectedNode);
            if (!node) return null;

            return (
              <>
                <div className="panel-header">
                  <h3>{node.entityType.toUpperCase()}</h3>
                  <button onClick={() => setSelectedNode(null)}>×</button>
                </div>
                <div className="panel-content">
                  {node.accessible ? (
                    <>
                      <div className="detail-row">
                        <span className="detail-label">Document Number:</span>
                        <span className="detail-value">{node.documentNumber}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Status:</span>
                        <span className="detail-value">{node.status}</span>
                      </div>
                      {node.value && (
                        <div className="detail-row">
                          <span className="detail-label">Value:</span>
                          <span className="detail-value">{formatValue(node.value)}</span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="detail-label">Date:</span>
                        <span className="detail-value">{new Date(node.date).toLocaleDateString('en-GB')}</span>
                      </div>
                      {node.route && (
                        <a href={node.route} className="view-document-link">
                          View Document →
                        </a>
                      )}
                    </>
                  ) : (
                    <div className="restricted-message">
                      <p>This document is restricted based on your permissions.</p>
                      <p>You can see the document type but not its contents.</p>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default DocumentChainGraph;
