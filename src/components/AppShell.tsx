/**
 * Part 01 — Application Shell
 * 
 * SAP S/4HANA Fiori-inspired enterprise workspace shell.
 * Provides the persistent navigation, project context bar,
 * notification centre, and the main content area where the
 * dashboard and module views render.
 */

import React, { useState } from 'react';
import { usePermission } from '../contexts/PermissionContext';
import { useProject } from '../contexts/ProjectContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { NotificationPanel } from './NotificationPanel';
import {
  LayoutDashboard,
  Bell,
  Search,
  ChevronDown,
  Menu,
  X,
  Building2,
  MapPin,
  RefreshCw,
  Settings,
  User,
  LogOut,
  ChevronRight,
  Briefcase,
  FileText,
  Package,
  HardHat,
  Calculator,
  ClipboardList,
  Shield,
  Users,
  Truck,
  FlaskConical,
  FileCheck,
  BarChart3,
  Database,
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
}

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'project.project.view' },
  { id: 'admin', label: 'Admin Console', icon: Users, permission: 'admin.responsibility.configure' },
  { id: 'schema', label: 'Schema Inspection', icon: Database, permission: 'admin.workspace.view' },
  { id: 'validation', label: 'Boot Validation', icon: Shield, permission: 'admin.workspace.view' },
  { id: 'design-system', label: 'Design System', icon: LayoutDashboard, permission: 'admin.workspace.view' },
  { id: 'projects', label: 'Projects', icon: Briefcase, permission: 'project.project.view' },
  { id: 'procurement', label: 'Procurement', icon: Package, permission: 'procure.po.view' },
  { id: 'execution', label: 'Site Execution', icon: HardHat, permission: 'project.dpr.view' },
  { id: 'billing', label: 'Billing & QS', icon: Calculator, permission: 'bill.client.view' },
  { id: 'finance', label: 'Finance', icon: FileText, permission: 'finance.voucher.view' },
  { id: 'hr', label: 'HR & Workforce', icon: Users, permission: 'hr.employee.view' },
  { id: 'equipment', label: 'Equipment', icon: Truck, permission: 'asset.equipment.view' },
  { id: 'quality', label: 'QA/QC', icon: FlaskConical, permission: 'qa.inspection.view' },
  { id: 'safety', label: 'HSE', icon: Shield, permission: 'hse.incident.view' },
  { id: 'documents', label: 'Documents', icon: FileCheck, permission: 'project.dpr.view' },
  { id: 'reports', label: 'MIS Reports', icon: BarChart3, permission: 'report.mis.view' },
];

export function AppShell({ children, currentView, onNavigate }: AppShellProps) {
  const { user } = usePermission();
  const { activeProject, activeSite, availableProjects, availableSites, setProject, setSite } = useProject();
  const { unreadCount, refreshDashboard, isLoading } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProjectDropdown, setShowProjectDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* ─── Top Header Bar ─────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center px-4 z-50 shrink-0">
        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-slate-100 mr-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Sidebar toggle (desktop) */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex p-2 rounded-lg hover:bg-slate-100 mr-2"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Logo / App Name */}
        <div className="flex items-center gap-2 mr-6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <span className="font-bold text-slate-800 hidden sm:block">DX ERP</span>
        </div>

        {/* Project Context Selector */}
        <div className="flex items-center gap-2 flex-1">
          <div className="relative">
            <button
              onClick={() => setShowProjectDropdown(!showProjectDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-sm"
            >
              <Building2 size={14} className="text-blue-600" />
              <span className="hidden md:inline font-medium text-slate-700 max-w-[200px] truncate">
                {activeProject?.name ?? 'Select Project'}
              </span>
              <span className="md:hidden font-medium text-slate-700 max-w-[120px] truncate">
                {activeProject?.code ?? 'Project'}
              </span>
              <ChevronDown size={14} className="text-slate-500" />
            </button>

            {showProjectDropdown && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Projects</p>
                </div>
                {availableProjects.map(project => (
                  <div key={project.id}>
                    <button
                      onClick={() => { setProject(project.id); setShowProjectDropdown(false); }}
                      className={`w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors ${
                        project.id === activeProject?.id ? 'bg-blue-50 border-l-2 border-blue-600' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-800">{project.name}</p>
                          <p className="text-xs text-slate-500">{project.code}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          project.status === 'active' ? 'bg-green-100 text-green-700' :
                          project.status === 'mobilisation' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </button>
                    {/* Sites for this project */}
                    {project.id === activeProject?.id && (
                      <div className="ml-6 border-l border-slate-200">
                        {availableSites.map(site => (
                          <button
                            key={site.id}
                            onClick={() => { setSite(site.id); setShowProjectDropdown(false); }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-slate-50 flex items-center gap-2 ${
                              site.id === activeSite?.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <MapPin size={12} className={site.id === activeSite?.id ? 'text-blue-600' : 'text-slate-400'} />
                            <span className={`text-xs ${site.id === activeSite?.id ? 'text-blue-700 font-medium' : 'text-slate-600'}`}>
                              {site.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active site indicator */}
          {activeSite && (
            <div className="hidden lg:flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={12} />
              <span>{activeSite.name}</span>
            </div>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {/* Search */}
          <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Search">
            <Search size={18} />
          </button>

          {/* Refresh */}
          <button
            onClick={refreshDashboard}
            className={`p-2 rounded-lg hover:bg-slate-100 text-slate-600 ${isLoading ? 'animate-spin' : ''}`}
            aria-label="Refresh"
          >
            <RefreshCw size={18} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative"
              aria-label="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Settings */}
          <button className="hidden sm:flex p-2 rounded-lg hover:bg-slate-100 text-slate-600" aria-label="Settings">
            <Settings size={18} />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 ml-1"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-slate-700 leading-tight">{user.name}</p>
                <p className="text-xs text-slate-500 leading-tight">{user.roles[0]?.replace('_', ' ')}</p>
              </div>
              <ChevronDown size={14} className="hidden md:block text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-800">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email}</p>
                  <p className="text-xs text-slate-400 mt-1">{user.roles.join(', ')}</p>
                </div>
                <button className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700">
                  <User size={14} /> Profile
                </button>
                <button className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-slate-700">
                  <Settings size={14} /> Preferences
                </button>
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <button className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-sm text-red-600">
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Main Content Area ──────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className={`
          ${sidebarOpen ? 'w-56' : 'w-0 lg:w-16'}
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          fixed lg:relative inset-y-14 left-0 z-40
          bg-white border-r border-slate-200
          transition-all duration-200 overflow-y-auto overflow-x-hidden
          shrink-0
        `}>
          <nav className="py-3 px-2">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-colors text-left ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`}
                  title={item.label}
                >
                  <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  <span className={`text-sm font-medium whitespace-nowrap ${!sidebarOpen ? 'lg:hidden' : ''}`}>
                    {item.label}
                  </span>
                  {isActive && sidebarOpen && (
                    <ChevronRight size={14} className="ml-auto text-blue-400" />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-7">
          {children}
        </main>
      </div>

      {/* Notification Panel */}
      <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
    </div>
  );
}
