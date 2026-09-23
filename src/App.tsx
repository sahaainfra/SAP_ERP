/**
 * Part 01 — Application Entry Point (Enhanced)
 * 
 * SAP S/4HANA-Aligned Real-Time Dashboard & Enterprise Workspace Foundation
 * 
 * This enhanced version demonstrates:
 * - Boot-time validation (Rule WS-03, WS-04)
 * - Deny-by-default permission interface (Rule WS-01)
 * - Universal band structure with band omission
 * - Workspace resolution with permission filtering
 * - Complete tile contract with all mandatory fields
 * - KPI governance with all 10 fields
 * - Personalisation model
 * - Drill-down architecture
 * 
 * No fabricated data — all figures trace to the defined data contracts.
 */

import React, { useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { PermissionProvider } from './contexts/PermissionContext';
import { ProjectProvider } from './contexts/ProjectContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { AppShell } from './components/AppShell';
import { Dashboard } from './components/Dashboard';
import { ModulePlaceholder } from './components/ModulePlaceholder';
import { WorkspaceStatusBar } from './components/WorkspaceStatusBar';
import { BootValidationDemo } from './components/BootValidationDemo';
import { BandVisibilityMap } from './components/UniversalBands';
import { SchemaInspectionView } from './components/SchemaInspectionView';
import { DesignSystemShowcase } from './components/DesignSystemShowcase';
import { SuperAdminConsole } from './components/admin/SuperAdminConsole';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');

  return (
    <ThemeProvider>
      <PermissionProvider>
        <ProjectProvider>
          <WorkspaceProvider>
            <div className="h-screen flex flex-col" style={{ backgroundColor: 'var(--sapBackgroundColor)' }}>
              <div className="flex-1 overflow-hidden">
                <AppShell currentView={currentView} onNavigate={setCurrentView}>
                {currentView === 'dashboard' ? (
                  <Dashboard />
                ) : currentView === 'design-system' ? (
                  <DesignSystemShowcase />
                ) : currentView === 'validation' ? (
                  <div className="p-6 max-w-6xl mx-auto space-y-6">
                    <BootValidationDemo />
                    <BandVisibilityMap />
                  </div>
                ) : currentView === 'schema' ? (
                  <SchemaInspectionView />
                ) : currentView === 'admin' ? (
                  <SuperAdminConsole />
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
    </ThemeProvider>
  );
}
