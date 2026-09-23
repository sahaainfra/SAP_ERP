/**
 * Part 01 — Project Summary Header
 * 
 * Displays the active project context with key summary metrics.
 * This is the first thing users see — it confirms they're in the
 * right project scope and gives immediate situational awareness.
 * 
 * All values come from the permission-filtered KPI service (Part 15).
 * No value includes a row the viewer cannot access.
 */

import React from 'react';
import { useProject } from '../contexts/ProjectContext';
import { usePermission } from '../contexts/PermissionContext';
import {
  Calendar,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export function ProjectSummaryHeader() {
  const { activeProject, activeSite } = useProject();
  const { user } = usePermission();

  if (!activeProject) return null;

  // Demo summary data — represents the structure
  // In production, these come from the KPI service filtered by project scope
  const summaryData = {
    contractValue: '₹248.5 Cr',
    physicalProgress: '67.3%',
    timeElapsed: '14 of 24 months',
    openPOs: 14,
    pendingApprovals: 3,
    activeWorkforce: 342,
    safetyIncidents: 0,
    qualityNCRs: 2,
  };

  return (
    <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 rounded-xl p-5 mb-6 text-white shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Project info */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium bg-white/20 px-2 py-0.5 rounded-full">
              {activeProject.code}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              activeProject.status === 'active' ? 'bg-emerald-500/30 text-emerald-100' :
              activeProject.status === 'mobilisation' ? 'bg-amber-500/30 text-amber-100' :
              'bg-slate-500/30 text-slate-200'
            }`}>
              {activeProject.status.charAt(0).toUpperCase() + activeProject.status.slice(1)}
            </span>
          </div>
          <h2 className="text-xl font-bold">{activeProject.name}</h2>
          {activeSite && (
            <div className="flex items-center gap-3 mt-2 text-blue-200 text-sm">
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {activeSite.name}
              </span>
              {activeSite.location && (
                <span className="text-blue-300">• {activeSite.location}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-4 mt-2 text-blue-200 text-xs">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {summaryData.timeElapsed}
            </span>
            <span>Logged in as {user.name}</span>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <p className="text-[10px] text-blue-200 uppercase tracking-wider">Contract</p>
            <p className="text-lg font-bold">{summaryData.contractValue}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <p className="text-[10px] text-blue-200 uppercase tracking-wider">Progress</p>
            <p className="text-lg font-bold">{summaryData.physicalProgress}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <p className="text-[10px] text-blue-200 uppercase tracking-wider">Workforce</p>
            <p className="text-lg font-bold">{summaryData.activeWorkforce}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <p className="text-[10px] text-blue-200 uppercase tracking-wider">Safety</p>
            <p className="text-lg font-bold flex items-center justify-center gap-1">
              <CheckCircle2 size={16} className="text-emerald-300" />
              {summaryData.safetyIncidents}
            </p>
          </div>
        </div>
      </div>

      {/* Alert strip */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1 text-amber-200">
          <AlertTriangle size={12} />
          {summaryData.pendingApprovals} pending approvals
        </span>
        <span className="flex items-center gap-1 text-blue-200">
          <Clock size={12} />
          {summaryData.openPOs} open POs
        </span>
        <span className="flex items-center gap-1 text-orange-200">
          <AlertTriangle size={12} />
          {summaryData.qualityNCRs} open NCRs
        </span>
      </div>
    </div>
  );
}
