import { useState } from 'react';
import {
  Search, Bell, Settings, User, ChevronDown, Menu,
  Moon, Sun, Maximize, HelpCircle, Grid3X3
} from 'lucide-react';
import { alerts } from '../data/mockData';

interface ShellBarProps {
  onToggleSidebar: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  currentProject: string;
  onProjectChange: (project: string) => void;
}

const projectList = [
  { id: 'all', name: 'All Projects' },
  { id: 'MLE-P2', name: 'Metro Line Extension' },
  { id: 'HBR-01', name: 'Highway Bridge' },
  { id: 'CTC-03', name: 'Commercial Tower' },
  { id: 'WTP-04', name: 'Water Treatment Plant' },
  { id: 'ATE-05', name: 'Airport Terminal' },
  { id: 'SFI-06', name: 'Solar Farm' },
];

export default function ShellBar({ onToggleSidebar, theme, onToggleTheme, currentProject, onProjectChange }: ShellBarProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProjectSwitcher, setShowProjectSwitcher] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const unreadAlerts = alerts.filter(a => !a.read).length;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center h-14 px-3"
      style={{ background: 'var(--sapShell)', color: '#fff' }}
    >
      {/* Left Section */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-white/10 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu size={18} />
        </button>

        {/* Logo / Product Name */}
        <div className="flex items-center gap-2 ml-1">
          <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center">
            <Grid3X3 size={16} className="text-blue-300" />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">Construction ERP</span>
            <span className="text-[10px] text-white/60 -mt-0.5">SAP S/4HANA Aligned</span>
          </div>
        </div>

        {/* Context Switcher */}
        <div className="relative ml-4 hidden md:block">
          <button
            onClick={() => setShowProjectSwitcher(!showProjectSwitcher)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 transition-colors text-sm"
          >
            <span className="text-white/70 text-xs">Project:</span>
            <span className="font-medium">
              {projectList.find(p => p.id === currentProject)?.name || 'All Projects'}
            </span>
            <ChevronDown size={14} />
          </button>

          {showProjectSwitcher && (
            <div className="absolute top-full left-0 mt-1 w-64 rounded-lg shadow-lg py-1 z-50"
              style={{ background: 'var(--sapGroupContentBG)', border: '1px solid var(--sapBaseColor)' }}>
              <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--sapContentLabelColor)' }}>
                Switch Project Context
              </div>
              {projectList.map(project => (
                <button
                  key={project.id}
                  onClick={() => { onProjectChange(project.id); setShowProjectSwitcher(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${
                    currentProject === project.id ? 'font-semibold text-blue-600' : ''
                  }`}
                  style={{ color: currentProject === project.id ? 'var(--sapBrand)' : 'var(--sapFontColor)' }}
                >
                  {project.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right Section */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <div className="relative">
          {showSearch && (
            <input
              type="text"
              placeholder="Search projects, tasks, documents..."
              className="absolute right-0 top-1/2 -translate-y-1/2 w-72 px-3 py-1.5 rounded-md text-sm bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
              autoFocus
              onBlur={() => setShowSearch(false)}
            />
          )}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-md hover:bg-white/10 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Fullscreen */}
        <button className="p-2 rounded-md hover:bg-white/10 transition-colors hidden sm:block" aria-label="Fullscreen">
          <Maximize size={18} />
        </button>

        {/* Help */}
        <button className="p-2 rounded-md hover:bg-white/10 transition-colors hidden sm:block" aria-label="Help">
          <HelpCircle size={18} />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-md hover:bg-white/10 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadAlerts > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center">
                {unreadAlerts}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-1 w-80 rounded-lg shadow-lg z-50 overflow-hidden"
              style={{ background: 'var(--sapGroupContentBG)', border: '1px solid var(--sapBaseColor)' }}>
              <div className="px-4 py-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--sapBaseColor)' }}>
                <span className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>Notifications</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">{unreadAlerts} new</span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className={`px-4 py-3 border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${!alert.read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    style={{ borderColor: 'var(--sapBaseColor)' }}>
                    <div className="flex items-start gap-2">
                      <span className={`status-indicator mt-1.5 ${
                        alert.type === 'critical' ? 'status-error' :
                        alert.type === 'warning' ? 'status-warning' :
                        alert.type === 'success' ? 'status-active' : 'status-inactive'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug" style={{ color: 'var(--sapFontColor)' }}>{alert.message}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--sapContentLabelColor)' }}>{alert.timestamp}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 text-center border-t" style={{ borderColor: 'var(--sapBaseColor)' }}>
                <button className="text-sm font-medium" style={{ color: 'var(--sapBrand)' }}>View All Notifications</button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white/10 transition-colors ml-1"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-xs font-bold">
              AK
            </div>
            <span className="text-sm hidden lg:block">Admin User</span>
            <ChevronDown size={14} className="hidden lg:block" />
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-1 w-56 rounded-lg shadow-lg py-1 z-50"
              style={{ background: 'var(--sapGroupContentBG)', border: '1px solid var(--sapBaseColor)' }}>
              <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--sapBaseColor)' }}>
                <p className="font-semibold text-sm" style={{ color: 'var(--sapFontColor)' }}>Admin User</p>
                <p className="text-xs" style={{ color: 'var(--sapContentLabelColor)' }}>Super Administrator</p>
              </div>
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-2" style={{ color: 'var(--sapFontColor)' }}>
                <User size={14} /> Profile Settings
              </button>
              <button className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50 flex items-center gap-2" style={{ color: 'var(--sapFontColor)' }}>
                <Settings size={14} /> System Settings
              </button>
              <div className="border-t my-1" style={{ borderColor: 'var(--sapBaseColor)' }} />
              <button className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                <User size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
