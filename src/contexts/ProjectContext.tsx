/**
 * Part 01 — Project Context
 * 
 * Provides the active project and site context to all components.
 * Every KPI, tile, worklist and query is filtered by this context.
 * A tile never includes a row the viewer cannot access.
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import type { Project, Site, ProjectContext } from '../types/workspace';

const ProjectContextReact = createContext<ProjectContext | null>(null);

// Demo projects — represent real data structure, not fabricated figures
const DEMO_PROJECTS: Project[] = [
  {
    id: 'prj_001',
    code: 'PRJ-2024-001',
    name: 'Metro Corridor IV — Civil Package',
    status: 'active',
    companyId: 'org_001',
    siteIds: ['site_001', 'site_002'],
  },
  {
    id: 'prj_002',
    code: 'PRJ-2024-002',
    name: 'NH-48 Flyover — Package B',
    status: 'active',
    companyId: 'org_001',
    siteIds: ['site_003'],
  },
  {
    id: 'prj_003',
    code: 'PRJ-2023-015',
    name: 'Industrial Park — Phase II',
    status: 'mobilisation',
    companyId: 'org_002',
    siteIds: ['site_004'],
  },
];

const DEMO_SITES: Site[] = [
  { id: 'site_001', code: 'SITE-MC4-01', name: 'Metro Corridor IV — Reach 1', projectId: 'prj_001', location: 'Sector 21, Noida' },
  { id: 'site_002', code: 'SITE-MC4-02', name: 'Metro Corridor IV — Reach 2', projectId: 'prj_001', location: 'Sector 62, Noida' },
  { id: 'site_003', code: 'SITE-NH48-B', name: 'NH-48 Flyover — Site B', projectId: 'prj_002', location: 'Gurgaon, Haryana' },
  { id: 'site_004', code: 'SITE-IP2', name: 'Industrial Park Phase II', projectId: 'prj_003', location: 'Bhiwadi, Rajasthan' },
];

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string>('prj_001');
  const [activeSiteId, setActiveSiteId] = useState<string>('site_001');

  const activeProject = useMemo(
    () => DEMO_PROJECTS.find(p => p.id === activeProjectId) ?? null,
    [activeProjectId]
  );

  const activeSite = useMemo(
    () => DEMO_SITES.find(s => s.id === activeSiteId) ?? null,
    [activeSiteId]
  );

  const availableSites = useMemo(
    () => activeProject
      ? DEMO_SITES.filter(s => s.projectId === activeProject.id)
      : [],
    [activeProject]
  );

  const setProject = useCallback((id: string) => {
    setActiveProjectId(id);
    // Reset site to first available for new project
    const project = DEMO_PROJECTS.find(p => p.id === id);
    if (project && project.siteIds.length > 0) {
      setActiveSiteId(project.siteIds[0]);
    }
  }, []);

  const setSite = useCallback((id: string) => {
    setActiveSiteId(id);
  }, []);

  const value = useMemo<ProjectContext>(() => ({
    activeProject,
    activeSite,
    availableProjects: DEMO_PROJECTS,
    availableSites,
    setProject,
    setSite,
  }), [activeProject, activeSite, availableSites, setProject, setSite]);

  return (
    <ProjectContextReact.Provider value={value}>
      {children}
    </ProjectContextReact.Provider>
  );
}

export function useProject(): ProjectContext {
  const ctx = useContext(ProjectContextReact);
  if (!ctx) throw new Error('useProject must be used within ProjectProvider');
  return ctx;
}
