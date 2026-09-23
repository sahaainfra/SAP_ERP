/**
 * Part 01 — Application Entry Point
 * 
 * SAP S/4HANA-Aligned Real-Time Dashboard & Enterprise Workspace Foundation
 * 
 * This is the foundation that all 68 subsequent parts plug into.
 * It establishes:
 * - Permission-aware workspace (Rule 4)
 * - Project-scoped context for all data
 * - Tile registration contracts for modules
 * - Real-time event subscription framework
 * - Responsive layout (desktop, tablet, mobile)
 * - Empty states where no data exists (Rule 3)
 * 
 * No fabricated data — all figures trace to the defined data contracts.
 */

import React, { useState } from 'react';
import { PermissionProvider } from './contexts/PermissionContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { AppShell } from './components/AppShell';
import { Dashboard } from './components/Dashboard';
import { ModulePlaceholder } from './components/ModulePlaceholder';
import { WorkspaceStatusBar } from './components/WorkspaceStatusBar';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <PermissionProvider>
      <ProjectProvider>
        <WorkspaceProvider>
          <div className="h-screen flex flex-col">
            <div className="flex-1 overflow-hidden">
              <AppShell currentView={currentView} onNavigate={setCurrentView}>
                {currentView === 'dashboard' ? (
                  <Dashboard />
                ) : (
                  <ModulePlaceholder module={currentView} />
                )}
              </AppShell>
            </div>
            <WorkspaceStatusBar />
          </div>
        </WorkspaceProvider>
      </ProjectProvider>
    </PermissionProvider>
  );
}
