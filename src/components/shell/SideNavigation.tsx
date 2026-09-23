/**
 * Part 16 — Side Navigation Component
 * 
 * Server-driven, permission-filtered navigation with:
 * - Three states: expanded, rail, overlay
 * - Collapsible groups
 * - Active item indicator
 * - Badge counts
 * - Keyboard navigation
 */

import React, { useState, useEffect } from 'react';
import { MenuItem, NavigationState } from '../../platform/shell/types';
import { navigationService } from '../../platform/shell/navigation-service';

interface SideNavigationProps {
  state: NavigationState;
  currentRoute: string;
  onNavigate: (route: string) => void;
  onClose?: () => void; // For overlay mode
}

export const SideNavigation: React.FC<SideNavigationProps> = ({
  state,
  currentRoute,
  onNavigate,
  onClose,
}) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Fetch menu from service
    const fetchMenu = async () => {
      const navMenu = await navigationService.fetchMenu();
      setMenu(navMenu.groups);
      
      // Expand all groups by default
      const groups = new Set(navMenu.groups.map(g => g.key));
      setExpandedGroups(groups);
    };

    fetchMenu();

    // Subscribe to menu changes
    const unsubscribe = navigationService.subscribe((newMenu) => {
      setMenu(newMenu.groups);
    });

    return unsubscribe;
  }, []);

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const isActive = (item: MenuItem): boolean => {
    return item.route === currentRoute;
  };

  const formatBadgeCount = (count?: number): string => {
    if (!count || count === 0) return '';
    if (count > 99) return '99+';
    return count.toString();
  };

  const renderRailMode = () => (
    <nav className="flex flex-col gap-1 p-2">
      {menu.map((group) => (
        <button
          key={group.key}
          onClick={() => toggleGroup(group.key)}
          className="w-10 h-10 rounded flex items-center justify-center hover:bg-gray-100 transition-colors relative group"
          title={group.label}
          aria-label={group.label}
        >
          <span className="text-xl">{group.icon}</span>
          {group.badge && group.badge > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-xs font-bold flex items-center justify-center bg-red-500 text-white">
              {formatBadgeCount(group.badge)}
            </span>
          )}
          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
            {group.label}
          </div>
        </button>
      ))}
    </nav>
  );

  const renderExpandedMode = () => (
    <nav className="flex flex-col overflow-y-auto">
      {menu.map((group) => (
        <div key={group.key} className="border-b border-gray-200">
          {/* Group header */}
          <button
            onClick={() => toggleGroup(group.key)}
            className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
            aria-expanded={expandedGroups.has(group.key)}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{group.icon}</span>
              <span className="text-sm font-semibold text-gray-700 uppercase">
                {group.label}
              </span>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={`transform transition-transform ${
                expandedGroups.has(group.key) ? 'rotate-180' : ''
              }`}
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          </button>

          {/* Group items */}
          {expandedGroups.has(group.key) && group.children && (
            <div className="pb-2">
              {group.children.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    if (item.route) {
                      onNavigate(item.route);
                      if (state === 'overlay' && onClose) {
                        onClose();
                      }
                    }
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                    isActive(item)
                      ? 'bg-blue-50 text-blue-700 border-l-3 border-blue-700'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                  aria-current={isActive(item) ? 'page' : undefined}
                >
                  <div className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center bg-red-500 text-white">
                      {formatBadgeCount(item.badge)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );

  const renderOverlayMode = () => (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer */}
      <div className="fixed left-0 top-0 bottom-0 w-64 bg-white shadow-xl z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <span className="font-semibold">Navigation</span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100"
            aria-label="Close navigation"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {renderExpandedMode()}
        </div>
      </div>
    </>
  );

  if (state === 'overlay') {
    return renderOverlayMode();
  }

  return (
    <aside
      className="fixed left-0 top-12 bottom-0 bg-white shadow-r overflow-y-auto z-30 transition-all duration-200"
      style={{
        width: state === 'expanded' ? '256px' : '64px',
      }}
    >
      {state === 'rail' ? renderRailMode() : renderExpandedMode()}
    </aside>
  );
};
