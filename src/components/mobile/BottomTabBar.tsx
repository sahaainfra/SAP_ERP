/**
 * Part 19 — Bottom Tab Bar Component
 * 
 * Mobile-only navigation component with 5 fixed slots:
 * 1. Home — role dashboard
 * 2. Work — combined Approvals + Tasks + Exceptions
 * 3. Create — centre action button, opens permitted-create sheet
 * 4. Search — permission-aware global search
 * 5. More — full module tree, notifications, profile, settings, offline queue
 * 
 * Features:
 * - Respects safe-area insets
 * - Hides on scroll down, reappears on scroll up
 * - Never covers primary form actions
 * - Badge counts for actionable items
 */

import React, { useState, useEffect } from 'react';
import { useBreakpoint } from '../../config/breakpoints';

export interface TabItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
  onClick?: () => void;
}

interface BottomTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  onCreateClick?: () => void;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  onCreateClick,
}) => {
  const { isPhone } = useBreakpoint();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Only render on phone
  if (!isPhone) {
    return null;
  }

  // Handle scroll to hide/show tab bar
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Format badge count
  const formatBadge = (count?: number): string => {
    if (!count || count === 0) return '';
    if (count > 99) return '99+';
    return count.toString();
  };

  return (
    <nav
      className={`bottom-tab-bar ${isVisible ? 'visible' : 'hidden'}`}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'var(--sapShellColor, #fff)',
        borderTop: '1px solid var(--sapShell_BorderColor, #e5e5e5)',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '56px',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 1000,
        transition: 'transform 0.3s ease',
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
      }}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isCreate = tab.id === 'create';

        return (
          <button
            key={tab.id}
            className={`tab-item ${isActive ? 'active' : ''} ${isCreate ? 'create-button' : ''}`}
            onClick={() => {
              if (isCreate && onCreateClick) {
                onCreateClick();
              } else {
                onTabChange(tab.id);
                tab.onClick?.();
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '8px 4px',
              border: 'none',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              position: 'relative',
              minWidth: '44px',
              minHeight: '44px',
            }}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            {/* Icon */}
            <span
              className="tab-icon"
              style={{
                fontSize: '24px',
                marginBottom: '2px',
                color: isActive
                  ? 'var(--sapShell_Active_TextColor, #0a6ed1)'
                  : 'var(--sapShell_TextColor, #32363a)',
              }}
            >
              {tab.icon}
            </span>

            {/* Label */}
            <span
              className="tab-label"
              style={{
                fontSize: '10px',
                fontWeight: isActive ? 600 : 400,
                color: isActive
                  ? 'var(--sapShell_Active_TextColor, #0a6ed1)'
                  : 'var(--sapShell_TextColor, #32363a)',
              }}
            >
              {tab.label}
            </span>

            {/* Badge */}
            {tab.badge && tab.badge > 0 && (
              <span
                className="tab-badge"
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '50%',
                  transform: 'translateX(12px)',
                  backgroundColor: 'var(--sapContent_BadgeBackground, #d32f2f)',
                  color: 'var(--sapContent_BadgeTextColor, #fff)',
                  borderRadius: '10px',
                  padding: '2px 6px',
                  fontSize: '10px',
                  fontWeight: 600,
                  minWidth: '18px',
                  textAlign: 'center',
                }}
              >
                {formatBadge(tab.badge)}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};

/**
 * Default tab configuration for mobile
 */
export function getDefaultMobileTabs(
  approvalCount: number = 0,
  taskCount: number = 0,
  exceptionCount: number = 0
): TabItem[] {
  return [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      route: '/',
    },
    {
      id: 'work',
      label: 'Work',
      icon: '📋',
      route: '/work',
      badge: approvalCount + taskCount + exceptionCount,
    },
    {
      id: 'create',
      label: 'Create',
      icon: '➕',
      route: '#create',
    },
    {
      id: 'search',
      label: 'Search',
      icon: '🔍',
      route: '/search',
    },
    {
      id: 'more',
      label: 'More',
      icon: '☰',
      route: '/more',
    },
  ];
}

export default BottomTabBar;
