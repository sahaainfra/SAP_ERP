/**
 * Enhanced Shell Bar - Part 2
 * 
 * Features:
 * - Left region: Nav toggle, logo, product title
 * - Center region: Global search
 * - Right region: AI Copilot, Messages, Tasks, Approvals, Notifications, Help, User avatar
 * - Popovers for each badge item
 * - Keyboard accessible
 * - Responsive
 */

import { useState, useRef, useEffect } from 'react';
import {
  Search, Bell, Settings, User, ChevronDown, Menu, X,
  Moon, Sun, Maximize2, HelpCircle, Grid3X3, MessageSquare,
  CheckSquare, Bot, LogOut, Key, Monitor
} from 'lucide-react';
import { alerts, approvals, tasks } from '../data/mockData';

interface ShellBarProps {
  onToggleSidebar: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
}

export default function ShellBar({ 
  onToggleSidebar, 
  theme, 
  onToggleTheme, 
  onOpenProfile,
  onOpenSearch 
}: ShellBarProps) {
  const [activePopover, setActivePopover] = useState<string | null>(null);
  const [badgeCounts] = useState({
    messages: 2,
    tasks: tasks.filter(t => t.status !== 'completed').length,
    approvals: approvals.filter(a => a.status === 'pending').length,
    notifications: alerts.filter(a => !a.read).length,
  });

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-popover]') && !target.closest('[data-popover-trigger]')) {
        setActivePopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close popover on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePopover(null);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  const togglePopover = (id: string) => {
    setActivePopover(activePopover === id ? null : id);
  };

  const renderBadge = (count: number, critical?: boolean) => {
    if (count === 0) return null;
    const displayCount = count > 99 ? '99+' : count;
    return (
      <span 
        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
        style={{ 
          background: critical ? 'var(--erp-priority-critical)' : 'var(--sapNegativeColor)',
          color: '#ffffff'
        }}
      >
        {displayCount}
      </span>
    );
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center px-3"
      style={{ 
        background: 'var(--sapShell_Background)', 
        color: 'var(--sapShell_TextColor)',
        height: 'var(--sapElement_Height)',
        boxShadow: 'var(--sapShell_Shadow)',
        borderBottom: '1px solid var(--sapShell_BorderColor)'
      }}
    >
      {/* Left Region */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-md hover:bg-[var(--sapShell_Hover_Background)] transition-colors"
          style={{ width: '36px', height: '36px' }}
          aria-label="Toggle navigation"
        >
          <Menu size={18} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2 ml-1">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--sapAccentColor6)' }}
          >
            <Grid3X3 size={16} className="text-white" />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="text-sm font-semibold" style={{ color: 'var(--sapShell_TextColor)' }}>
              Construction ERP
            </span>
            <span className="text-[10px] opacity-60 -mt-0.5">SAP Fiori Horizon</span>
          </div>
        </div>
      </div>

      {/* Center Region - Global Search */}
      <div className="flex-1 flex justify-center px-4">
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors w-full max-w-md"
          style={{ 
            background: 'var(--sapField_Background)',
            border: '1px solid var(--sapField_BorderColor)',
            color: 'var(--sapField_PlaceholderTextColor)'
          }}
        >
          <Search size={16} />
          <span className="hidden sm:inline">Search projects, documents, tasks...</span>
          <span className="sm:hidden">Search...</span>
          <kbd className="hidden md:inline ml-auto px-1.5 py-0.5 text-[10px] rounded" 
            style={{ background: 'var(--sapBaseColor)', color: 'var(--sapContent_LabelColor)' }}>
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Region */}
      <div className="flex items-center gap-1">
        {/* AI Copilot */}
        <button 
          className="p-2 rounded-md hover:bg-[var(--sapShell_Hover_Background)] transition-colors hidden md:flex"
          style={{ width: '36px', height: '36px' }}
          aria-label="AI Copilot"
        >
          <Bot size={18} />
        </button>

        {/* Messages */}
        <div className="relative" data-popover-trigger>
          <button
            onClick={() => togglePopover('messages')}
            className="p-2 rounded-md hover:bg-[var(--sapShell_Hover_Background)] transition-colors relative"
            style={{ width: '36px', height: '36px' }}
            aria-label="Messages"
          >
            <MessageSquare size={18} />
            {renderBadge(badgeCounts.messages)}
          </button>
          {activePopover === 'messages' && (
            <MessagesPopover onClose={() => setActivePopover(null)} />
          )}
        </div>

        {/* Tasks */}
        <div className="relative" data-popover-trigger>
          <button
            onClick={() => togglePopover('tasks')}
            className="p-2 rounded-md hover:bg-[var(--sapShell_Hover_Background)] transition-colors relative"
            style={{ width: '36px', height: '36px' }}
            aria-label="Tasks"
          >
            <CheckSquare size={18} />
            {renderBadge(badgeCounts.tasks)}
          </button>
          {activePopover === 'tasks' && (
            <TasksPopover onClose={() => setActivePopover(null)} />
          )}
        </div>

        {/* Approvals */}
        <div className="relative" data-popover-trigger>
          <button
            onClick={() => togglePopover('approvals')}
            className="p-2 rounded-md hover:bg-[var(--sapShell_Hover_Background)] transition-colors relative"
            style={{ width: '36px', height: '36px' }}
            aria-label="Approvals"
          >
            <CheckSquare size={18} />
            {renderBadge(badgeCounts.approvals, true)}
          </button>
          {activePopover === 'approvals' && (
            <ApprovalsPopover onClose={() => setActivePopover(null)} />
          )}
        </div>

        {/* Notifications */}
        <div className="relative" data-popover-trigger>
          <button
            onClick={() => togglePopover('notifications')}
            className="p-2 rounded-md hover:bg-[var(--sapShell_Hover_Background)] transition-colors relative"
            style={{ width: '36px', height: '36px' }}
            aria-label="Notifications"
          >
            <Bell size={18} />
            {renderBadge(badgeCounts.notifications)}
          </button>
          {activePopover === 'notifications' && (
            <NotificationsPopover onClose={() => setActivePopover(null)} />
          )}
        </div>

        {/* Help */}
        <button 
          className="p-2 rounded-md hover:bg-[var(--sapShell_Hover_Background)] transition-colors hidden sm:flex"
          style={{ width: '36px', height: '36px' }}
          aria-label="Help"
        >
          <HelpCircle size={18} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-md hover:bg-[var(--sapShell_Hover_Background)] transition-colors"
          style={{ width: '36px', height: '36px' }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* User Avatar */}
        <button
          onClick={onOpenProfile}
          className="flex items-center gap-2 p-1 rounded-md hover:bg-[var(--sapShell_Hover_Background)] transition-colors ml-1"
          aria-label="User profile"
        >
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: 'var(--sapAccentColor6)' }}
          >
            AK
          </div>
          <span className="text-sm hidden lg:block">Admin User</span>
        </button>
      </div>
    </header>
  );
}

// Popover Components
function PopoverWrapper({ children, onClose, title, footer }: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  footer?: React.ReactNode;
}) {
  return (
    <div
      data-popover
      className="absolute top-full right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-lg shadow-lg overflow-hidden"
      style={{ 
        background: 'var(--sapTile_Background)',
        border: '1px solid var(--sapGroup_ContentBorderColor)',
        boxShadow: 'var(--sapContent_Shadow2)'
      }}
    >
      <div className="px-4 py-3 flex items-center justify-between border-b" 
        style={{ borderColor: 'var(--sapList_BorderColor)' }}>
        <span className="font-semibold text-sm" style={{ color: 'var(--sapTile_TitleTextColor)' }}>{title}</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-[var(--sapHoverColor)]">
          <X size={14} />
        </button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {children}
      </div>
      {footer && (
        <div className="px-4 py-2 text-center border-t" style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          {footer}
        </div>
      )}
    </div>
  );
}

function NotificationsPopover({ onClose }: { onClose: () => void }) {
  return (
    <PopoverWrapper 
      onClose={onClose} 
      title="Notifications"
      footer={<button className="text-sm font-medium" style={{ color: 'var(--sapLinkColor)' }}>View All</button>}
    >
      {alerts.slice(0, 5).map(alert => (
        <div key={alert.id} className="px-4 py-3 border-b hover:bg-[var(--sapList_Hover_Background)]"
          style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <div className="flex items-start gap-2">
            <span className={`status-indicator mt-1.5 ${
              alert.type === 'critical' ? 'status-error' :
              alert.type === 'warning' ? 'status-warning' :
              alert.type === 'success' ? 'status-active' : 'status-inactive'
            }`} />
            <div className="flex-1">
              <p className="text-sm" style={{ color: 'var(--sapList_TextColor)' }}>{alert.message}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>{alert.timestamp}</p>
            </div>
          </div>
        </div>
      ))}
    </PopoverWrapper>
  );
}

function ApprovalsPopover({ onClose }: { onClose: () => void }) {
  return (
    <PopoverWrapper 
      onClose={onClose} 
      title="Pending Approvals"
      footer={<button className="text-sm font-medium" style={{ color: 'var(--sapLinkColor)' }}>View All</button>}
    >
      {approvals.filter(a => a.status === 'pending').slice(0, 5).map(approval => (
        <div key={approval.id} className="px-4 py-3 border-b hover:bg-[var(--sapList_Hover_Background)]"
          style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--sapList_TextColor)' }}>
              {approval.title}
            </span>
            {approval.priority === 'urgent' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded" 
                style={{ background: 'var(--sapErrorBackground)', color: 'var(--sapNegativeTextColor)' }}>
                URGENT
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>
              {approval.requester} • ${(approval.amount / 1000000).toFixed(1)}M
            </span>
          </div>
        </div>
      ))}
    </PopoverWrapper>
  );
}

function TasksPopover({ onClose }: { onClose: () => void }) {
  return (
    <PopoverWrapper 
      onClose={onClose} 
      title="My Tasks"
      footer={<button className="text-sm font-medium" style={{ color: 'var(--sapLinkColor)' }}>View All</button>}
    >
      {tasks.filter(t => t.status !== 'completed').slice(0, 5).map(task => (
        <div key={task.id} className="px-4 py-3 border-b hover:bg-[var(--sapList_Hover_Background)]"
          style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--sapList_TextColor)' }}>
              {task.title}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              task.status === 'overdue' 
                ? 'bg-[var(--sapErrorBackground)] text-[var(--sapNegativeTextColor)]'
                : task.status === 'in-progress'
                ? 'bg-[var(--sapInformationBackground)] text-[var(--sapInformativeTextColor)]'
                : 'bg-[var(--sapNeutralBackground)] text-[var(--sapNeutralTextColor)]'
            }`}>
              {task.status}
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--sapContent_LabelColor)' }}>
            Due: {task.dueDate} • {task.project}
          </p>
        </div>
      ))}
    </PopoverWrapper>
  );
}

function MessagesPopover({ onClose }: { onClose: () => void }) {
  const messages = [
    { id: 1, from: 'Sarah Chen', subject: 'Metro Line progress update', time: '10 min ago' },
    { id: 2, from: 'System', subject: 'Backup completed successfully', time: '1 hour ago' },
  ];

  return (
    <PopoverWrapper 
      onClose={onClose} 
      title="Messages"
      footer={<button className="text-sm font-medium" style={{ color: 'var(--sapLinkColor)' }}>View All</button>}
    >
      {messages.map(msg => (
        <div key={msg.id} className="px-4 py-3 border-b hover:bg-[var(--sapList_Hover_Background)]"
          style={{ borderColor: 'var(--sapList_BorderColor)' }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--sapList_TextColor)' }}>
              {msg.from}
            </span>
            <span className="text-xs" style={{ color: 'var(--sapContent_LabelColor)' }}>{msg.time}</span>
          </div>
          <p className="text-sm mt-1" style={{ color: 'var(--sapList_TextColor)' }}>{msg.subject}</p>
        </div>
      ))}
    </PopoverWrapper>
  );
}
