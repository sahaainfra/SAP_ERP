/**
 * Part 13 — Look-ahead Board Component
 * Kanban-style board for weekly/fortnightly planning
 */

import React from 'react';
import { lookaheads } from '../data/planningData';

export function LookaheadBoard() {
  return (
    <div>
      <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--sapTextColor)' }}>
        Look-ahead Planning
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {lookaheads.map((lookahead) => (
          <div key={lookahead.id} className="sap-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold" style={{ color: 'var(--sapTextColor)' }}>
                {lookahead.periodType.replace('_', ' ')}
              </h4>
              <span className="text-xs px-2 py-1 rounded" style={{ 
                background: lookahead.status === 'CLOSED' ? 'var(--sapSuccessBackground)' : 'var(--sapWarningBackground)',
                color: lookahead.status === 'CLOSED' ? 'var(--sapPositiveTextColor)' : 'var(--sapCriticalTextColor)'
              }}>
                {lookahead.status}
              </span>
            </div>
            <div className="text-xs mb-3" style={{ color: 'var(--sapContent_LabelColor)' }}>
              {lookahead.periodStart} to {lookahead.periodEnd}
            </div>
            {lookahead.ppcPercent && (
              <div className="mb-3">
                <div className="text-xs mb-1" style={{ color: 'var(--sapContent_LabelColor)' }}>PPC</div>
                <div className="text-lg font-bold" style={{ color: 'var(--sapTextColor)' }}>
                  {lookahead.ppcPercent}%
                </div>
              </div>
            )}
            <div className="space-y-2">
              {lookahead.tasks?.map((task) => (
                <div key={task.id} className="p-2 rounded text-xs" style={{ background: 'var(--sapList_Background)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium" style={{ color: 'var(--sapTextColor)' }}>
                      {task.description}
                    </span>
                    {task.isCompleted && (
                      <span style={{ color: 'var(--sapPositiveColor)' }}>✓</span>
                    )}
                  </div>
                  {task.isConstrained && (
                    <div className="text-xs" style={{ color: 'var(--sapNegativeColor)' }}>
                      ⚠ Constrained
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
