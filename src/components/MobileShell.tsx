/**
 * Part 11 — Mobile Shell Component
 * Mobile-optimized application shell with bottom navigation
 */

import { useState } from 'react';
import { Home, Search, Bell, User, Menu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useResponsive } from '../utils/responsive';

interface MobileShellProps {
  children: React.ReactNode;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
  onNotificationsClick?: () => void;
  onProfileClick?: () => void;
  activeTab?: 'home' | 'search' | 'notifications' | 'profile';
}

export default function MobileShell({
  children,
  onMenuClick,
  onSearchClick,
  onNotificationsClick,
  onProfileClick,
  activeTab = 'home',
}: MobileShellProps) {
  const { isMobile } = useResponsive();
  const [showBackButton, setShowBackButton] = useState(false);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--sapBackgroundColor)' }}>
      {/* Top Header */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 safe-area-top"
        style={{
          background: 'var(--sapShellColor)',
          borderBottom: '1px solid var(--sapGroupContentBorderColor)',
          boxShadow: 'var(--sapShadow1)',
        }}
      >
        <div className="flex items-center gap-3">
          {showBackButton ? (
            <button
              onClick={() => window.history.back()}
              className="touch-target-comfortable rounded-full hover:bg-[var(--sapHoverColor)]"
              aria-label="Go back"
            >
              <ChevronLeft size={24} style={{ color: 'var(--sapTextColor)' }} />
            </button>
          ) : (
            <button
              onClick={onMenuClick}
              className="touch-target-comfortable rounded-full hover:bg-[var(--sapHoverColor)]"
              aria-label="Open menu"
            >
              <Menu size={24} style={{ color: 'var(--sapTextColor)' }} />
            </button>
          )}
          <h1 className="text-lg font-semibold" style={{ color: 'var(--sapTextColor)' }}>
            Construction ERP
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav
        className="sticky bottom-0 z-40 flex items-center justify-around py-2 safe-area-bottom"
        style={{
          background: 'var(--sapShellColor)',
          borderTop: '1px solid var(--sapGroupContentBorderColor)',
          boxShadow: 'var(--sapShadow1)',
        }}
        aria-label="Main navigation"
      >
        <BottomNavItem
          icon={<Home size={24} />}
          label="Home"
          isActive={activeTab === 'home'}
          onClick={onMenuClick}
        />
        <BottomNavItem
          icon={<Search size={24} />}
          label="Search"
          isActive={activeTab === 'search'}
          onClick={onSearchClick}
        />
        <BottomNavItem
          icon={<Bell size={24} />}
          label="Alerts"
          isActive={activeTab === 'notifications'}
          onClick={onNotificationsClick}
          badge={3}
        />
        <BottomNavItem
          icon={<User size={24} />}
          label="Profile"
          isActive={activeTab === 'profile'}
          onClick={onProfileClick}
        />
      </nav>
    </div>
  );
}

interface BottomNavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick?: () => void;
  badge?: number;
}

function BottomNavItem({ icon, label, isActive, onClick, badge }: BottomNavItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-4 py-2 touch-target-comfortable relative"
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
    >
      <div className="relative">
        <div style={{ color: isActive ? 'var(--sapBrandColor)' : 'var(--sapContentIconColor)' }}>
          {icon}
        </div>
        {badge && badge > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-xs font-bold flex items-center justify-center"
            style={{
              background: 'var(--sapNegativeColor)',
              color: '#ffffff',
            }}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span
        className="text-xs font-medium"
        style={{ color: isActive ? 'var(--sapBrandColor)' : 'var(--sapContentIconColor)' }}
      >
        {label}
      </span>
    </button>
  );
}
