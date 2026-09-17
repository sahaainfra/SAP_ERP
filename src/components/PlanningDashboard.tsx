/**
 * Part 13 — Planning Dashboard
 * Main dashboard for planning, WBS, scheduling, and progress tracking
 */

import React, { useState } from 'react';
import { 
  GitBranch, Calendar, TrendingUp, ClipboardList, AlertCircle, 
  BarChart3, Users, Target 
} from 'lucide-react';
import { WbsBuilder } from './WbsBuilder';
import { GanttChart } from './GanttChart';
import { ProgressEntry } from './ProgressEntry';
import { LookaheadBoard } from './LookaheadBoard';
import { ConstraintRegister } from './ConstraintRegister';
import { SCurve } from './SCurve';
import { ResourceHistogram } from './ResourceHistogram';
import { BaselineCompare } from './BaselineCompare';

type PlanningTab = 'wbs' | 'gantt' | 'progress' | 'lookahead' | 'constraints' | 'scurve' | 'resources' | 'baseline';

export function PlanningDashboard() {
  const [activeTab, setActiveTab] = useState<PlanningTab>('gantt');

  const tabs = [
    { id: 'wbs', label: 'WBS', icon: GitBranch },
    { id: 'gantt', label: 'Gantt Chart', icon: Calendar },
    { id: 'progress', label: 'Progress', icon: TrendingUp },
    { id: 'lookahead', label: 'Look-ahead', icon: ClipboardList },
    { id: 'constraints', label: 'Constraints', icon: AlertCircle },
    { id: 'scurve', label: 'S-Curve', icon: BarChart3 },
    { id: 'resources', label: 'Resources', icon: Users },
    { id: 'baseline', label: 'Baseline', icon: Target },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'wbs':
        return <WbsBuilder />;
      case 'gantt':
        return <GanttChart />;
      case 'progress':
        return <ProgressEntry />;
      case 'lookahead':
        return <LookaheadBoard />;
      case 'constraints':
        return <ConstraintRegister />;
      case 'scurve':
        return <SCurve />;
      case 'resources':
        return <ResourceHistogram />;
      case 'baseline':
        return <BaselineCompare />;
      default:
        return <GanttChart />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--sapTextColor)' }}>
            Planning & Scheduling
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            WBS, schedule, baseline, and progress tracking
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="sap-card">
        <div className="flex border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as PlanningTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[var(--sapSelectedColor)]'
                    : 'border-transparent hover:border-[var(--sapContent_BorderColor)]'
                }`}
                style={{
                  color: activeTab === tab.id ? 'var(--sapSelectedColor)' : 'var(--sapContent_LabelColor)'
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="sap-card p-4">
        {renderContent()}
      </div>
    </div>
  );
}
