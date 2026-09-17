/**
 * Context Switcher Bar - Part 2
 * 
 * Horizontal bar under shell bar showing:
 * - Company, Branch, Project, Site, Financial Year selectors
 * - Collapses to single button on narrow screens
 * - Persists selection per user
 */

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Building2, FolderKanban, MapPin, Calendar, X } from 'lucide-react';
import { projects } from '../data/mockData';

interface ContextSwitcherProps {
  context: {
    company: string;
    project: string;
    site: string;
    fy: string;
  };
  onContextChange: (key: string, value: string) => void;
}

const companies = [
  { id: 'acme', name: 'Acme Construction Ltd' },
  { id: 'buildco', name: 'BuildCo Infra Pvt Ltd' },
];

const financialYears = [
  { id: '2026-27', label: 'FY 2026-27' },
  { id: '2025-26', label: 'FY 2025-26' },
  { id: '2024-25', label: 'FY 2024-25' },
];

const sites = [
  { id: 'all', name: 'All Sites' },
  { id: 'site-1', name: 'Downtown Corridor - Site A' },
  { id: 'site-2', name: 'River Crossing - Site B' },
  { id: 'site-3', name: 'Business District - Site C' },
];

export default function ContextSwitcher({ context, onContextChange }: ContextSwitcherProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setIsMobileView(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const projectName = context.project === 'all' 
    ? 'All Projects' 
    : projects.find(p => p.code === context.project)?.name || context.project;

  const companyName = companies.find(c => c.id === context.company)?.name || context.company;
  const fyLabel = financialYears.find(f => f.id === context.fy)?.label || context.fy;

  if (isMobileView) {
    return (
      <div 
        className="fixed left-0 right-0 z-30 px-3 py-2 flex items-center"
        style={{ 
          top: 'var(--sapElement_Height)',
          background: 'var(--sapInfobar_Background)',
          borderBottom: '1px solid var(--sapShell_BorderColor)',
          height: '40px'
        }}
      >
        <button
          onClick={() => setOpenDropdown(openDropdown ? null : 'mobile-context')}
          className="flex items-center gap-2 text-xs font-medium flex-1"
          style={{ color: 'var(--sapInfobar_TextColor)' }}
        >
          <Building2 size={14} />
          <span className="truncate">{companyName} • {projectName} • {fyLabel}</span>
          <ChevronDown size={12} />
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={ref}
      className="fixed left-0 right-0 z-30 flex items-center gap-4 px-4"
      style={{ 
        top: 'var(--sapElement_Height)',
        background: 'var(--sapInfobar_Background)',
        borderBottom: '1px solid var(--sapShell_BorderColor)',
        height: '40px'
      }}
    >
      <ContextDropdown
        label="Company"
        value={companyName}
        icon={<Building2 size={14} />}
        isOpen={openDropdown === 'company'}
        onToggle={() => setOpenDropdown(openDropdown === 'company' ? null : 'company')}
        options={companies.map(c => ({ id: c.id, label: c.name }))}
        onSelect={(id) => { onContextChange('company', id); setOpenDropdown(null); }}
      />
      
      <ContextDropdown
        label="Project"
        value={projectName}
        icon={<FolderKanban size={14} />}
        isOpen={openDropdown === 'project'}
        onToggle={() => setOpenDropdown(openDropdown === 'project' ? null : 'project')}
        options={[
          { id: 'all', label: 'All Projects' },
          ...projects.map(p => ({ id: p.code, label: p.name }))
        ]}
        onSelect={(id) => { onContextChange('project', id); setOpenDropdown(null); }}
      />

      <ContextDropdown
        label="Site"
        value={context.site === 'all' ? 'All Sites' : sites.find(s => s.id === context.site)?.name || context.site}
        icon={<MapPin size={14} />}
        isOpen={openDropdown === 'site'}
        onToggle={() => setOpenDropdown(openDropdown === 'site' ? null : 'site')}
        options={sites.map(s => ({ id: s.id, label: s.name }))}
        onSelect={(id) => { onContextChange('site', id); setOpenDropdown(null); }}
      />

      <ContextDropdown
        label="Financial Year"
        value={fyLabel}
        icon={<Calendar size={14} />}
        isOpen={openDropdown === 'fy'}
        onToggle={() => setOpenDropdown(openDropdown === 'fy' ? null : 'fy')}
        options={financialYears.map(f => ({ id: f.id, label: f.label }))}
        onSelect={(id) => { onContextChange('fy', id); setOpenDropdown(null); }}
      />

      {/* Live indicator */}
      <div className="ml-auto flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: 'var(--sapPositiveColor)' }} />
        <span className="text-[10px] font-medium" style={{ color: 'var(--sapInfobar_TextColor)' }}>
          Live
        </span>
      </div>
    </div>
  );
}

function ContextDropdown({ label, value, icon, isOpen, onToggle, options, onSelect }: {
  label: string;
  value: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  options: Array<{ id: string; label: string }>;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs hover:bg-white/10 transition-colors"
        style={{ color: 'var(--sapInfobar_TextColor)' }}
        aria-label={`${label}: ${value}`}
      >
        {icon}
        <span className="font-medium max-w-[180px] truncate">{value}</span>
        <ChevronDown size={12} />
      </button>
      
      {isOpen && (
        <div 
          className="absolute top-full left-0 mt-1 w-64 rounded-lg shadow-lg py-1 z-50"
          style={{ 
            background: 'var(--sapTile_Background)',
            border: '1px solid var(--sapGroup_ContentBorderColor)',
            boxShadow: 'var(--sapContent_Shadow2)'
          }}
        >
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--sapContent_LabelColor)' }}>
            {label}
          </div>
          {options.map(option => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-[var(--sapList_Hover_Background)] transition-colors"
              style={{ color: 'var(--sapList_TextColor)' }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
