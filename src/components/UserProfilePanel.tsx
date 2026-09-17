/**
 * User Profile Panel - Part 2
 * 
 * Right-side panel (360px) with:
 * - Identity block
 * - Active context
 * - Quick settings (theme, density)
 * - Actions
 */

import { X, User, Building2, Shield, Moon, Sun, Monitor, LogOut, Key, Settings } from 'lucide-react';
import { useThemeEngine, THEMES } from '../hooks/useThemeEngine';

interface UserProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfilePanel({ isOpen, onClose }: UserProfilePanelProps) {
  const { theme, density, setTheme, setDensity } = useThemeEngine();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[90] bg-black/30"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className="fixed top-0 right-0 bottom-0 z-[91] w-96 max-w-full overflow-y-auto animate-slide-in"
        style={{ 
          background: 'var(--sapTile_Background)',
          boxShadow: 'var(--sapContent_Shadow3)',
          borderLeft: '1px solid var(--sapGroup_ContentBorderColor)'
        }}
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-5 py-4 border-b"
          style={{ 
            background: 'var(--sapTile_Background)',
            borderColor: 'var(--sapList_BorderColor)'
          }}>
          <h2 className="font-semibold" style={{ color: 'var(--sapTile_TitleTextColor)' }}>Profile</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--sapHoverColor)]">
            <X size={18} />
          </button>
        </div>

        {/* Identity Block */}
        <div className="px-5 py-6 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold text-white"
              style={{ background: 'var(--sapAccentColor6)' }}
            >
              AK
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--sapTile_TitleTextColor)' }}>
                Admin User
              </h3>
              <p className="text-sm" style={{ color: 'var(--sapContent_LabelColor)' }}>
                Super Administrator
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
                admin@construction-erp.com
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
            <div>
              <div className="font-medium mb-0.5" style={{ color: 'var(--sapContent_LabelColor)' }}>Employee ID</div>
              <div style={{ color: 'var(--sapTextColor)' }}>EMP-001</div>
            </div>
            <div>
              <div className="font-medium mb-0.5" style={{ color: 'var(--sapContent_LabelColor)' }}>Department</div>
              <div style={{ color: 'var(--sapTextColor)' }}>Administration</div>
            </div>
            <div>
              <div className="font-medium mb-0.5" style={{ color: 'var(--sapContent_LabelColor)' }}>Last Login</div>
              <div style={{ color: 'var(--sapTextColor)' }}>Today, 09:45</div>
            </div>
            <div>
              <div className="font-medium mb-0.5" style={{ color: 'var(--sapContent_LabelColor)' }}>Active Sessions</div>
              <div style={{ color: 'var(--sapTextColor)' }}>2 devices</div>
            </div>
          </div>
        </div>

        {/* Active Context */}
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" 
            style={{ color: 'var(--sapContent_LabelColor)' }}>
            Active Context
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Building2 size={14} style={{ color: 'var(--sapContent_IconColor)' }} />
              <span style={{ color: 'var(--sapTextColor)' }}>Acme Construction Ltd</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield size={14} style={{ color: 'var(--sapContent_IconColor)' }} />
              <span style={{ color: 'var(--sapTextColor)' }}>All Projects (6 active)</span>
            </div>
            <div className="flex items-center gap-2">
              <User size={14} style={{ color: 'var(--sapContent_IconColor)' }} />
              <span style={{ color: 'var(--sapTextColor)' }}>FY 2026-27</span>
            </div>
          </div>
        </div>

        {/* Quick Settings */}
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" 
            style={{ color: 'var(--sapContent_LabelColor)' }}>
            Appearance
          </h4>
          
          {/* Theme Selection */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--sapTextColor)' }}>
              Theme
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(THEMES).slice(0, 4).map(([key, info]) => (
                <button
                  key={key}
                  onClick={() => setTheme(key as any)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    background: theme === key ? 'var(--sapList_SelectionBackgroundColor)' : 'var(--sapBaseColor)',
                    border: theme === key ? '2px solid var(--sapSelectedColor)' : '2px solid transparent',
                    color: 'var(--sapTextColor)'
                  }}
                >
                  <span>{info.icon}</span>
                  <span className="text-xs">{info.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Density Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--sapTextColor)' }}>
              Density
            </label>
            <div className="flex gap-2">
              {(['cozy', 'compact', 'condensed'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                  style={{
                    background: density === d ? 'var(--sapList_SelectionBackgroundColor)' : 'var(--sapBaseColor)',
                    border: density === d ? '2px solid var(--sapSelectedColor)' : '2px solid transparent',
                    color: 'var(--sapTextColor)'
                  }}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" 
            style={{ color: 'var(--sapContent_LabelColor)' }}>
            Actions
          </h4>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[var(--sapList_Hover_Background)] transition-colors text-left"
              style={{ color: 'var(--sapTextColor)' }}>
              <User size={16} />
              My Profile
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[var(--sapList_Hover_Background)] transition-colors text-left"
              style={{ color: 'var(--sapTextColor)' }}>
              <Key size={16} />
              Change Password
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[var(--sapList_Hover_Background)] transition-colors text-left"
              style={{ color: 'var(--sapTextColor)' }}>
              <Settings size={16} />
              Settings
            </button>
            <div className="border-t my-2" style={{ borderColor: 'var(--sapList_BorderColor)' }} />
            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[var(--sapErrorBackground)] transition-colors text-left"
              style={{ color: 'var(--sapNegativeTextColor)' }}>
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
