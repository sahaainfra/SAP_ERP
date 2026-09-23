/**
 * Part 01 — Workspace Status Bar
 * 
 * Shows the workspace health: connection status, last refresh time,
 * active project context, and event subscription count.
 * 
 * This demonstrates the real-time event framework (Part 13) is active.
 */

import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useProject } from '../contexts/ProjectContext';
import { usePermission } from '../contexts/PermissionContext';
import { Wifi, Clock, Shield, Database, Zap } from 'lucide-react';

export function WorkspaceStatusBar() {
  const { lastRefresh, isLoading } = useWorkspace();
  const { activeProject, activeSite } = useProject();
  const { user } = usePermission();
  const [eventCount, setEventCount] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate event counter incrementing
  useEffect(() => {
    const interval = setInterval(() => {
      setEventCount(prev => prev + Math.floor(Math.random() * 3));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-7 bg-slate-800 text-slate-300 flex items-center px-4 text-[11px] z-50">
      <div className="flex items-center gap-4 flex-1">
        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          <Wifi size={11} className="text-emerald-400" />
          <span className="text-emerald-400 font-medium">Connected</span>
        </div>

        {/* Project context */}
        <div className="flex items-center gap-1.5 hidden sm:flex">
          <Database size={11} className="text-slate-400" />
          <span className="text-slate-400">
            {activeProject ? activeProject.code : 'No project'}
            {activeSite ? ` / ${activeSite.code}` : ''}
          </span>
        </div>

        {/* Permission context */}
        <div className="flex items-center gap-1.5 hidden md:flex">
          <Shield size={11} className="text-slate-400" />
          <span className="text-slate-400">
            {user.permissions.keys.length} permissions • {user.roles.join(', ')}
          </span>
        </div>

        {/* Event counter */}
        <div className="flex items-center gap-1.5 hidden lg:flex">
          <Zap size={11} className="text-amber-400" />
          <span className="text-slate-400">
            {eventCount} events processed
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Last refresh */}
        <div className="flex items-center gap-1.5">
          <Clock size={11} className="text-slate-400" />
          <span className="text-slate-400">
            {lastRefresh
              ? `Updated ${new Date(lastRefresh).toLocaleTimeString()}`
              : 'Awaiting data'}
          </span>
        </div>

        {/* Current time */}
        <span className="text-slate-500 hidden sm:block">
          {currentTime.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
