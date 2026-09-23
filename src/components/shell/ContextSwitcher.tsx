/**
 * Part 16 — Context Switcher Component
 * 
 * Multi-dimensional context selector (company, project, site, FY) with:
 * - Server-driven available options
 * - Permission-filtered selections
 * - Coordinated refresh on change
 * - Persistence per user
 */

import React, { useState, useEffect } from 'react';
import { UserContext, AvailableContext } from '../../platform/shell/types';
import { contextService } from '../../platform/shell/context-service';

interface ContextSwitcherProps {
  onContextChange: (context: UserContext) => void;
}

export const ContextSwitcher: React.FC<ContextSwitcherProps> = ({
  onContextChange,
}) => {
  const [available, setAvailable] = useState<AvailableContext | null>(null);
  const [current, setCurrent] = useState<UserContext | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Fetch available context
    const fetchContext = async () => {
      const avail = await contextService.fetchAvailableContext();
      setAvailable(avail);

      // Get current context
      const curr = contextService.getCurrentContext();
      if (curr) {
        setCurrent(curr);
      } else {
        // Set default context
        const defaultContext: UserContext = {
          companyId: avail.companies[0]?.id,
          branchId: avail.branches[0]?.id,
          projectIds: avail.projects.length > 0 ? [avail.projects[0].id] : [],
          siteIds: [],
          financialYear: avail.financialYears[0],
        };
        await contextService.setContext(defaultContext);
        setCurrent(defaultContext);
      }
    };

    fetchContext();

    // Subscribe to context changes
    const unsubscribe = contextService.subscribe((event) => {
      setCurrent(event.current);
      onContextChange(event.current);
    });

    return unsubscribe;
  }, [onContextChange]);

  const handleCompanyChange = async (companyId: number) => {
    if (!available) return;

    // Filter branches, projects, sites to selected company
    const branches = available.branches.filter(b => b.companyId === companyId);
    const projects = available.projects.filter(p => p.companyId === companyId);

    const newContext: UserContext = {
      companyId,
      branchId: branches[0]?.id,
      projectIds: projects.length > 0 ? [projects[0].id] : [],
      siteIds: [],
      financialYear: current?.financialYear,
    };

    await contextService.setContext(newContext);
  };

  const handleProjectChange = async (projectIds: number[]) => {
    if (!available) return;

    // Filter sites to selected projects
    const sites = available.sites.filter(s => projectIds.includes(s.projectId));

    const newContext: UserContext = {
      ...current!,
      projectIds,
      siteIds: sites.length > 0 ? [sites[0].id] : [],
    };

    await contextService.setContext(newContext);
  };

  const handleSiteChange = async (siteIds: number[]) => {
    const newContext: UserContext = {
      ...current!,
      siteIds,
    };

    await contextService.setContext(newContext);
  };

  const handleFinancialYearChange = async (financialYear: string) => {
    const newContext: UserContext = {
      ...current!,
      financialYear,
    };

    await contextService.setContext(newContext);
  };

  if (!available || !current) {
    return (
      <div className="h-10 flex items-center px-4 bg-gray-50 border-b">
        <span className="text-sm text-gray-500">Loading context...</span>
      </div>
    );
  }

  const selectedCompany = available.companies.find(c => c.id === current.companyId);
  const selectedProjects = available.projects.filter(p => current.projectIds.includes(p.id));
  const selectedSites = available.sites.filter(s => current.siteIds.includes(s.id));

  const contextSummary = [
    selectedCompany?.code,
    selectedProjects.length > 0 ? `${selectedProjects.length} project${selectedProjects.length > 1 ? 's' : ''}` : null,
    current.financialYear,
  ].filter(Boolean).join(' · ');

  return (
    <div className="relative">
      {/* Context bar */}
      <div
        className="h-10 flex items-center justify-between px-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
        style={{ backgroundColor: 'var(--sapInfobar_NonInteractive_Background, #e8e8e8)' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-4 text-sm">
          {/* Company */}
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Company:</span>
            <span className="font-medium">{selectedCompany?.name || 'All'}</span>
          </div>

          {/* Projects */}
          <div className="flex items-center gap-1">
            <span className="text-gray-600">Projects:</span>
            <span className="font-medium">
              {selectedProjects.length === 0
                ? 'All'
                : selectedProjects.length === 1
                ? selectedProjects[0].name
                : `${selectedProjects.length} selected`}
            </span>
          </div>

          {/* Sites */}
          {selectedSites.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-gray-600">Sites:</span>
              <span className="font-medium">
                {selectedSites.length === 1
                  ? selectedSites[0].name
                  : `${selectedSites.length} selected`}
              </span>
            </div>
          )}

          {/* Financial Year */}
          <div className="flex items-center gap-1">
            <span className="text-gray-600">FY:</span>
            <span className="font-medium">{current.financialYear || 'Current'}</span>
          </div>
        </div>

        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
        </svg>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg border z-50 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Company selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <select
                  value={current.companyId || ''}
                  onChange={(e) => handleCompanyChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Companies</option>
                  {available.companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Project selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Projects
                </label>
                <select
                  multiple
                  value={current.projectIds.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, opt => Number(opt.value));
                    handleProjectChange(selected);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                >
                  {available.projects
                    .filter(p => !current.companyId || p.companyId === current.companyId)
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
              </div>

              {/* Site selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sites
                </label>
                <select
                  multiple
                  value={current.siteIds.map(String)}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, opt => Number(opt.value));
                    handleSiteChange(selected);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                  disabled={current.projectIds.length === 0}
                >
                  {available.sites
                    .filter(s => current.projectIds.includes(s.projectId))
                    .map((site) => (
                      <option key={site.id} value={site.id}>
                        {site.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Financial Year selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Financial Year
                </label>
                <select
                  value={current.financialYear || ''}
                  onChange={(e) => handleFinancialYearChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {available.financialYears.map((fy) => (
                    <option key={fy} value={fy}>
                      {fy}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
