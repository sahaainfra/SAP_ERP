/**
 * Part 16 — Shell Bar Component
 * 
 * Top navigation bar with:
 * - Navigation toggle
 * - Company logo and title
 * - Global search
 * - Badge counts (notifications, approvals, tasks, messages)
 * - User avatar and profile
 */

import React, { useState, useEffect } from 'react';
import { ShellBadgeCounts, NavigationState } from '../../platform/shell/types';

interface ShellBarProps {
  onToggleNavigation: () => void;
  navigationState: NavigationState;
  onOpenSearch: () => void;
  onOpenProfile: () => void;
  onOpenNotifications: () => void;
  onOpenApprovals: () => void;
  onOpenTasks: () => void;
  onOpenMessages: () => void;
}

export const ShellBar: React.FC<ShellBarProps> = ({
  onToggleNavigation,
  navigationState,
  onOpenSearch,
  onOpenProfile,
  onOpenNotifications,
  onOpenApprovals,
  onOpenTasks,
  onOpenMessages,
}) => {
  const [badgeCounts, setBadgeCounts] = useState<ShellBadgeCounts>({
    notifications: 0,
    approvals: 0,
    tasks: 0,
    messages: 0,
  });

  // Fetch badge counts
  useEffect(() => {
    const fetchCounts = async () => {
      // In production, would call:
      // GET /api/dx/v1/shell/counts
      // For demo, use mock data
      setBadgeCounts({
        notifications: 5,
        approvals: 3,
        tasks: 7,
        messages: 2,
      });
    };

    fetchCounts();

    // Poll every 60 seconds (in production, would use WebSocket from Part 13)
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatBadgeCount = (count: number): string => {
    if (count === 0) return '';
    if (count > 99) return '99+';
    return count.toString();
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 shadow-md"
      style={{
        height: 'var(--sapElement_Height, 48px)',
        backgroundColor: 'var(--sapShellColor, #354a5f)',
        color: 'var(--sapShell_TextColor, #fff)',
      }}
    >
      {/* Left region */}
      <div className="flex items-center gap-3">
        {/* Navigation toggle */}
        <button
          onClick={onToggleNavigation}
          className="p-2 rounded hover:bg-white/10 transition-colors"
          aria-label="Toggle navigation"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
          </svg>
        </button>

        {/* Company logo */}
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
            style={{ backgroundColor: 'var(--sapAccentColor6, #0a6ed1)', color: '#fff' }}
          >
            AC
          </div>
          <span className="font-semibold hidden md:inline">Acme Construction ERP</span>
        </div>
      </div>

      {/* Centre region - Global search */}
      <div className="flex-1 max-w-2xl mx-4">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Open global search"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <span className="text-sm opacity-80">Search... (Ctrl+K)</span>
        </button>
      </div>

      {/* Right region - Badges and user */}
      <div className="flex items-center gap-1">
        {/* Messages */}
        <button
          onClick={onOpenMessages}
          className="relative p-2 rounded hover:bg-white/10 transition-colors"
          aria-label={`Messages ${badgeCounts.messages > 0 ? `(${badgeCounts.messages})` : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
          {badgeCounts.messages > 0 && (
            <span
              className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold flex items-center justify-center"
              style={{
                backgroundColor: 'var(--sapContent_BadgeBackground, #d32f2f)',
                color: 'var(--sapContent_BadgeTextColor, #fff)',
              }}
            >
              {formatBadgeCount(badgeCounts.messages)}
            </span>
          )}
        </button>

        {/* Tasks */}
        <button
          onClick={onOpenTasks}
          className="relative p-2 rounded hover:bg-white/10 transition-colors"
          aria-label={`Tasks ${badgeCounts.tasks > 0 ? `(${badgeCounts.tasks})` : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3h-4.18C14.4 1.84 13.3 1 12 1c-1.3 0-2.4.84-2.82 2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm2 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
          {badgeCounts.tasks > 0 && (
            <span
              className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold flex items-center justify-center"
              style={{
                backgroundColor: 'var(--sapContent_BadgeBackground, #d32f2f)',
                color: 'var(--sapContent_BadgeTextColor, #fff)',
              }}
            >
              {formatBadgeCount(badgeCounts.tasks)}
            </span>
          )}
        </button>

        {/* Approvals */}
        <button
          onClick={onOpenApprovals}
          className="relative p-2 rounded hover:bg-white/10 transition-colors"
          aria-label={`Approvals ${badgeCounts.approvals > 0 ? `(${badgeCounts.approvals})` : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
          </svg>
          {badgeCounts.approvals > 0 && (
            <span
              className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold flex items-center justify-center"
              style={{
                backgroundColor: 'var(--sapContent_BadgeBackground, #d32f2f)',
                color: 'var(--sapContent_BadgeTextColor, #fff)',
              }}
            >
              {formatBadgeCount(badgeCounts.approvals)}
            </span>
          )}
        </button>

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded hover:bg-white/10 transition-colors"
          aria-label={`Notifications ${badgeCounts.notifications > 0 ? `(${badgeCounts.notifications})` : ''}`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
          </svg>
          {badgeCounts.notifications > 0 && (
            <span
              className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold flex items-center justify-center"
              style={{
                backgroundColor: 'var(--sapContent_BadgeBackground, #d32f2f)',
                color: 'var(--sapContent_BadgeTextColor, #fff)',
              }}
            >
              {formatBadgeCount(badgeCounts.notifications)}
            </span>
          )}
        </button>

        {/* User avatar */}
        <button
          onClick={onOpenProfile}
          className="ml-2 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold hover:opacity-80 transition-opacity"
          style={{
            backgroundColor: 'var(--sapAccentColor6, #0a6ed1)',
            color: '#fff',
          }}
          aria-label="Open user profile"
        >
          RK
        </button>
      </div>
    </header>
  );
};
