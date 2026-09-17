/**
 * Part 13 — Gantt Chart Component
 * Interactive Gantt chart with baseline overlay, critical path, and dependencies
 */

import React, { useState } from 'react';
import { scheduleActivities, activityRelations, baselines } from '../data/planningData';
import type { ScheduleActivity } from '../types/planning';

export function GanttChart() {
  const [zoomLevel, setZoomLevel] = useState<'day' | 'week' | 'month'>('week');
  const [showBaseline, setShowBaseline] = useState(true);
  const [showCriticalPath, setShowCriticalPath] = useState(true);

  // Calculate date range
  const minDate = new Date('2024-03-01');
  const maxDate = new Date('2025-04-30');
  const totalDays = Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));

  const getBarPosition = (date: string) => {
    const activityDate = new Date(date);
    const daysFromStart = Math.ceil((activityDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24));
    return (daysFromStart / totalDays) * 100;
  };

  const getBarWidth = (start: string, finish: string) => {
    const startDate = new Date(start);
    const finishDate = new Date(finish);
    const days = Math.ceil((finishDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return (days / totalDays) * 100;
  };

  const getStatusColor = (activity: ScheduleActivity) => {
    if (activity.status === 'COMPLETED') return 'var(--sapPositiveColor)';
    if (activity.status === 'IN_PROGRESS') return 'var(--sapInformativeColor)';
    if (activity.isCritical) return 'var(--sapNegativeColor)';
    return 'var(--sapNeutralColor)';
  };

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
              Zoom:
            </label>
            <select
              value={zoomLevel}
              onChange={(e) => setZoomLevel(e.target.value as any)}
              className="px-2 py-1 text-sm rounded border"
              style={{
                background: 'var(--sapField_Background)',
                borderColor: 'var(--sapField_BorderColor)',
                color: 'var(--sapField_TextColor)',
              }}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showBaseline}
              onChange={(e) => setShowBaseline(e.target.checked)}
              className="rounded"
            />
            <span style={{ color: 'var(--sapTextColor)' }}>Show Baseline</span>
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showCriticalPath}
              onChange={(e) => setShowCriticalPath(e.target.checked)}
              className="rounded"
            />
            <span style={{ color: 'var(--sapTextColor)' }}>Critical Path</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
            {scheduleActivities.length} activities
          </span>
        </div>
      </div>

      {/* Gantt Chart */}
      <div className="sap-card overflow-auto" style={{ maxHeight: '600px' }}>
        {/* Timeline Header */}
        <div className="sticky top-0 z-10 border-b" style={{ 
          background: 'var(--sapList_HeaderBackground)',
          borderColor: 'var(--sapList_BorderColor)'
        }}>
          <div className="flex items-center h-12 px-4">
            <div className="w-64 font-semibold text-sm" style={{ color: 'var(--sapList_HeaderTextColor)' }}>
              Activity
            </div>
            <div className="flex-1 relative h-full">
              {/* Month markers */}
              {Array.from({ length: 14 }, (_, i) => {
                const date = new Date(minDate);
                date.setMonth(date.getMonth() + i);
                const position = getBarPosition(date.toISOString().split('T')[0]);
                return (
                  <div
                    key={i}
                    className="absolute top-0 h-full border-l text-xs px-2 py-1"
                    style={{
                      left: `${position}%`,
                      borderColor: 'var(--sapList_BorderColor)',
                      color: 'var(--sapList_HeaderTextColor)',
                    }}
                  >
                    {date.toLocaleString('default', { month: 'short', year: '2-digit' })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Activity Rows */}
        <div className="divide-y" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          {scheduleActivities.map((activity) => {
            const plannedStart = activity.plannedStart || activity.forecastStart;
            const plannedFinish = activity.plannedFinish || activity.forecastFinish;
            
            if (!plannedStart || !plannedFinish) return null;

            const barLeft = getBarPosition(plannedStart);
            const barWidth = getBarWidth(plannedStart, plannedFinish);

            return (
              <div
                key={activity.id}
                className="flex items-center h-16 px-4 hover:bg-[var(--sapList_Hover_Background)]"
              >
                {/* Activity Name */}
                <div className="w-64 pr-4">
                  <div className="flex items-center gap-2">
                    {activity.isCritical && showCriticalPath && (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: 'var(--sapNegativeColor)' }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono" style={{ color: 'var(--sapContent_LabelColor)' }}>
                        {activity.activityCode}
                      </div>
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--sapTextColor)' }}>
                        {activity.name}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Gantt Bar */}
                <div className="flex-1 relative h-full flex items-center">
                  {/* Baseline Bar */}
                  {showBaseline && activity.plannedStart && activity.plannedFinish && (
                    <div
                      className="absolute h-6 rounded opacity-30"
                      style={{
                        left: `${getBarPosition(activity.plannedStart)}%`,
                        width: `${getBarWidth(activity.plannedStart, activity.plannedFinish)}%`,
                        background: 'var(--sapNeutralColor)',
                      }}
                    />
                  )}

                  {/* Actual/Forecast Bar */}
                  <div
                    className="absolute h-8 rounded flex items-center px-2"
                    style={{
                      left: `${barLeft}%`,
                      width: `${barWidth}%`,
                      background: getStatusColor(activity),
                      minWidth: '40px',
                    }}
                  >
                    <span className="text-xs font-semibold text-white truncate">
                      {activity.progressPercent}%
                    </span>
                  </div>

                  {/* Progress Indicator */}
                  {activity.progressPercent > 0 && (
                    <div
                      className="absolute h-8 rounded-l"
                      style={{
                        left: `${barLeft}%`,
                        width: `${barWidth * (activity.progressPercent / 100)}%`,
                        background: 'rgba(255, 255, 255, 0.3)',
                        minWidth: '2px',
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: 'var(--sapPositiveColor)' }} />
          <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: 'var(--sapInformativeColor)' }} />
          <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded" style={{ background: 'var(--sapNegativeColor)' }} />
          <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>Critical</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded opacity-30" style={{ background: 'var(--sapNeutralColor)' }} />
          <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>Baseline</span>
        </div>
      </div>
    </div>
  );
}
