import { useState } from 'react';
import {
  Search, Filter, Plus, MoreVertical, MapPin, Calendar,
  User, TrendingUp, AlertTriangle, DollarSign, HardHat,
  ChevronRight, ArrowUpDown
} from 'lucide-react';
import { projects } from '../data/mockData';
import type { Project } from '../data/mockData';

export default function ProjectsPage() {
  const [view, setView] = useState<'grid' | 'table'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.client.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    delayed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'on-hold': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const riskColors: Record<string, string> = {
    low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="space-y-5 animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--sapFontColor)' }}>Projects</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
            {projects.length} projects • {projects.filter(p => p.status === 'active').length} active
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
          style={{ background: 'var(--sapBrand)' }}>
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Filter Bar */}
      <div className="sap-card p-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--sapContentLabelColor)' }} />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            style={{ borderColor: 'var(--sapBaseColor)', background: 'var(--sapGroupContentBG)', color: 'var(--sapFontColor)' }}
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            style={{ borderColor: 'var(--sapBaseColor)', background: 'var(--sapGroupContentBG)', color: 'var(--sapFontColor)' }}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="delayed">Delayed</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
          </select>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm border hover:bg-gray-50 dark:hover:bg-gray-800/50"
            style={{ borderColor: 'var(--sapBaseColor)', color: 'var(--sapFontColor)' }}>
            <Filter size={14} />
            More Filters
          </button>
        </div>
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={() => setView('table')}
            className={`p-2 rounded ${view === 'table' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
            style={{ color: view === 'table' ? undefined : 'var(--sapContentLabelColor)' }}
          >
            <ArrowUpDown size={16} />
          </button>
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded ${view === 'grid' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}
            style={{ color: view === 'grid' ? undefined : 'var(--sapContentLabelColor)' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1" />
              <rect x="9" y="1" width="6" height="6" rx="1" />
              <rect x="1" y="9" width="6" height="6" rx="1" />
              <rect x="9" y="9" width="6" height="6" rx="1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Table View */}
      {view === 'table' && (
        <div className="sap-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{ borderColor: 'var(--sapBaseColor)' }}>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sapContentLabelColor)' }}>Project</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sapContentLabelColor)' }}>Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sapContentLabelColor)' }}>Progress</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sapContentLabelColor)' }}>Budget</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sapContentLabelColor)' }}>Risk</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sapContentLabelColor)' }}>Manager</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sapContentLabelColor)' }}>Safety</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => (
                  <ProjectRow key={project.id} project={project} statusColors={statusColors} riskColors={riskColors} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid View */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} statusColors={statusColors} riskColors={riskColors} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectRow({ project, statusColors, riskColors }: { project: Project; statusColors: Record<string, string>; riskColors: Record<string, string> }) {
  const budgetPercent = Math.round((project.spent / project.budget) * 100);
  return (
    <tr className="border-b last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors cursor-pointer" style={{ borderColor: 'var(--sapBaseColor)' }}>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-8 rounded-full ${
            project.status === 'active' ? 'bg-green-500' :
            project.status === 'delayed' ? 'bg-red-500' :
            project.status === 'on-hold' ? 'bg-yellow-500' : 'bg-gray-400'
          }`} />
          <div>
            <div className="text-sm font-medium" style={{ color: 'var(--sapFontColor)' }}>{project.name}</div>
            <div className="text-xs flex items-center gap-2 mt-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
              <span>{project.code}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5"><MapPin size={10} />{project.location}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[project.status]}`}>
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--sapBaseColor)' }}>
            <div className="h-full rounded-full" style={{
              width: `${project.progress}%`,
              background: project.progress > 80 ? 'var(--sapPositive)' : project.progress > 50 ? 'var(--sapBrand)' : 'var(--sapCritical)'
            }} />
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--sapFontColor)' }}>{project.progress}%</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="text-sm font-medium" style={{ color: 'var(--sapFontColor)' }}>
          ${(project.budget / 1000000).toFixed(0)}M
        </div>
        <div className="text-[10px]" style={{ color: budgetPercent > 90 ? 'var(--sapNegative)' : 'var(--sapContentLabelColor)' }}>
          {budgetPercent}% spent
        </div>
      </td>
      <td className="px-4 py-3">
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${riskColors[project.risk]}`}>
          {project.risk.charAt(0).toUpperCase() + project.risk.slice(1)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
            {project.manager.split(' ').map(n => n[0]).join('')}
          </div>
          <span className="text-xs" style={{ color: 'var(--sapFontColor)' }}>{project.manager}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <HardHat size={12} className={project.safety.score >= 95 ? 'text-green-500' : project.safety.score >= 90 ? 'text-yellow-500' : 'text-red-500'} />
          <span className="text-xs font-medium" style={{ color: 'var(--sapFontColor)' }}>{project.safety.score}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <button className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronRight size={16} style={{ color: 'var(--sapContentLabelColor)' }} />
        </button>
      </td>
    </tr>
  );
}

function ProjectCard({ project, statusColors, riskColors }: { project: Project; statusColors: Record<string, string>; riskColors: Record<string, string> }) {
  const budgetPercent = Math.round((project.spent / project.budget) * 100);
  return (
    <div className="sap-tile p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>{project.name}</h3>
          <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: 'var(--sapContentLabelColor)' }}>
            <MapPin size={10} /> {project.location}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[project.status]}`}>
          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span style={{ color: 'var(--sapContentLabelColor)' }}>Progress</span>
          <span className="font-medium" style={{ color: 'var(--sapFontColor)' }}>{project.progress}%</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--sapBaseColor)' }}>
          <div className="h-full rounded-full animate-progress" style={{
            width: `${project.progress}%`,
            background: project.progress > 80 ? 'var(--sapPositive)' : project.progress > 50 ? 'var(--sapBrand)' : 'var(--sapCritical)'
          }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <DollarSign size={12} style={{ color: 'var(--sapContentLabelColor)' }} />
          <span style={{ color: 'var(--sapContentLabelColor)' }}>Budget:</span>
          <span className="font-medium" style={{ color: 'var(--sapFontColor)' }}>${(project.budget / 1000000).toFixed(0)}M</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp size={12} style={{ color: 'var(--sapContentLabelColor)' }} />
          <span style={{ color: 'var(--sapContentLabelColor)' }}>Spent:</span>
          <span className="font-medium" style={{ color: budgetPercent > 90 ? 'var(--sapNegative)' : 'var(--sapFontColor)' }}>{budgetPercent}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar size={12} style={{ color: 'var(--sapContentLabelColor)' }} />
          <span style={{ color: 'var(--sapContentLabelColor)' }}>End:</span>
          <span className="font-medium" style={{ color: 'var(--sapFontColor)' }}>{project.endDate}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <User size={12} style={{ color: 'var(--sapContentLabelColor)' }} />
          <span className="font-medium truncate" style={{ color: 'var(--sapFontColor)' }}>{project.manager}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--sapBaseColor)' }}>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${riskColors[project.risk]}`}>
            {project.risk.toUpperCase()} RISK
          </span>
          <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--sapContentLabelColor)' }}>
            <HardHat size={10} className={project.safety.score >= 95 ? 'text-green-500' : 'text-yellow-500'} />
            Safety: {project.safety.score}
          </span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
          project.milestones.completed / project.milestones.total > 0.7 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
        }`}>
          {project.milestones.completed}/{project.milestones.total} milestones
        </span>
      </div>
    </div>
  );
}
