/**
 * Enhanced Side Navigation - Part 2
 * 
 * Features:
 * - Grouped navigation items
 * - Collapsible groups
 * - Three states: expanded (256px), rail (48px), overlay (mobile)
 * - Active item indicator with aria-current
 * - Badge counts on items
 * - Keyboard accessible
 * - Server-driven menu structure
 */

import { useState } from 'react';
import {
  Home, LayoutDashboard, CheckSquare, FileCheck, FolderKanban, Eye,
  MapPin, Package, FileText, Truck, ClipboardList, FilePlus, Send,
  ShoppingCart, Users, Warehouse, Database, PackageCheck, PackageMinus,
  Layers, Calendar, BookOpen, TrendingUp, Receipt, CreditCard, Landmark,
  PiggyBank, Target, ClipboardCheck, Search, AlertTriangle, HeartPulse,
  AlertCircle, BarChart3, LineChart, Shield, ScrollText, Settings,
  ChevronDown, ChevronRight, Palette, X
} from 'lucide-react';
import { navigationData } from '../data/navigation';
import type { NavGroup, NavItem } from '../data/navigation';

// Icon mapping
const iconMap: Record<string, any> = {
  'home': Home,
  'layout-dashboard': LayoutDashboard,
  'check-square': CheckSquare,
  'file-check': FileCheck,
  'folder-kanban': FolderKanban,
  'eye': Eye,
  'map-pin': MapPin,
  'package': Package,
  'file-text': FileText,
  'truck': Truck,
  'clipboard-list': ClipboardList,
  'file-plus': FilePlus,
  'send': Send,
  'shopping-cart': ShoppingCart,
  'users': Users,
  'warehouse': Warehouse,
  'database': Database,
  'package-check': PackageCheck,
  'package-minus': PackageMinus,
  'layers': Layers,
  'calendar': Calendar,
  'book-open': BookOpen,
  'trending-up': TrendingUp,
  'receipt': Receipt,
  'credit-card': CreditCard,
  'landmark': Landmark,
  'piggy-bank': PiggyBank,
  'target': Target,
  'clipboard-check': ClipboardCheck,
  'search': Search,
  'alert-triangle': AlertTriangle,
  'heart-pulse': HeartPulse,
  'alert-circle': AlertCircle,
  'bar-chart-3': BarChart3,
  'line-chart': LineChart,
  'shield': Shield,
  'scroll-text': ScrollText,
  'settings': Settings,
  'palette': Palette,
};

interface SideNavProps {
  collapsed: boolean;
  activeItem: string;
  onNavigate: (item: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export default function SideNav({ collapsed, activeItem, onNavigate, isMobileOpen, onCloseMobile }: SideNavProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['personal', 'insight']));

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName];
    return Icon ? <Icon size={18} /> : null;
  };

  const navContent = (
    <nav className="flex-1 overflow-y-auto py-2 px-2" aria-label="Main navigation">
      {navigationData.map((group) => (
        <NavGroupComponent
          key={group.key}
          group={group}
          isExpanded={expandedGroups.has(group.key)}
          isCollapsed={collapsed}
          activeItem={activeItem}
          onToggle={() => toggleGroup(group.key)}
          onNavigate={onNavigate}
          getIcon={getIcon}
        />
      ))}
    </nav>
  );

  // Mobile overlay
  if (isMobileOpen) {
    return (
      <>
        <div 
          className="fixed inset-0 z-40 bg-black/50"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
        <aside
          className="fixed left-0 top-[var(--sapElement_Height)] bottom-0 z-50 w-64 flex flex-col animate-slide-in"
          style={{ 
            background: 'var(--sapShell_Navigation_Background)',
            borderRight: '1px solid var(--sapShell_BorderColor)'
          }}
          aria-label="Navigation"
        >
          <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--sapShell_BorderColor)' }}>
            <span className="font-semibold text-sm" style={{ color: 'var(--sapShell_Navigation_TextColor)' }}>Navigation</span>
            <button onClick={onCloseMobile} className="p-1 rounded hover:bg-[var(--sapHoverColor)]">
              <X size={18} />
            </button>
          </div>
          {navContent}
        </aside>
      </>
    );
  }

  return (
    <aside
      className={`fixed left-0 top-[var(--sapElement_Height)] bottom-0 z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-12' : 'w-64'
      }`}
      style={{ 
        background: 'var(--sapShell_Navigation_Background)',
        borderRight: '1px solid var(--sapShell_BorderColor)'
      }}
      aria-label="Navigation"
    >
      {navContent}
    </aside>
  );
}

function NavGroupComponent({ group, isExpanded, isCollapsed, activeItem, onToggle, onNavigate, getIcon }: {
  group: NavGroup;
  isExpanded: boolean;
  isCollapsed: boolean;
  activeItem: string;
  onToggle: () => void;
  onNavigate: (item: string) => void;
  getIcon: (name: string) => React.ReactNode;
}) {
  const GroupIcon = iconMap[group.icon];
  const totalBadge = group.items.reduce((sum, item) => sum + (item.badge || 0), 0);

  if (isCollapsed) {
    // Rail mode - show group icon only
    return (
      <div className="mb-1">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center p-2 rounded-md hover:bg-[var(--sapShell_Hover_Background)] transition-colors relative group"
          style={{ height: '36px' }}
          title={group.label}
          aria-label={group.label}
        >
          {GroupIcon && <GroupIcon size={18} style={{ color: 'var(--sapShell_Navigation_TextColor)' }} />}
          {totalBadge > 0 && (
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full" 
              style={{ background: 'var(--sapNegativeColor)' }} />
          )}
          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50"
            style={{ background: 'var(--sapContent_ForegroundColor)', color: 'var(--sapTextColor)' }}>
            {group.label}
          </div>
        </button>
        {isExpanded && (
          <div className="absolute left-full ml-1 mt-1 w-56 rounded-lg shadow-lg py-1 z-50"
            style={{ 
              background: 'var(--sapTile_Background)',
              border: '1px solid var(--sapGroup_ContentBorderColor)',
              boxShadow: 'var(--sapContent_Shadow2)'
            }}>
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider" 
              style={{ color: 'var(--sapContent_LabelColor)' }}>
              {group.label}
            </div>
            {group.items.map(item => (
              <NavItemComponent
                key={item.key}
                item={item}
                isActive={activeItem === item.key.replace(/-/g, '')}
                onNavigate={onNavigate}
                getIcon={getIcon}
                isCollapsed={false}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Expanded mode
  return (
    <div className="mb-2">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-[var(--sapShell_Hover_Background)] transition-colors"
        aria-expanded={isExpanded}
      >
        {GroupIcon && <GroupIcon size={16} style={{ color: 'var(--sapShell_Navigation_TextColor)' }} />}
        <span className="flex-1 text-left text-[10px] font-semibold uppercase tracking-wider" 
          style={{ color: 'var(--sapContent_LabelColor)' }}>
          {group.label}
        </span>
        {totalBadge > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: 'var(--sapNegativeColor)', color: '#fff' }}>
            {totalBadge}
          </span>
        )}
        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      
      {isExpanded && (
        <div className="mt-1 space-y-0.5">
          {group.items.map(item => (
            <NavItemComponent
              key={item.key}
              item={item}
              isActive={activeItem === item.key.replace(/-/g, '')}
              onNavigate={onNavigate}
              getIcon={getIcon}
              isCollapsed={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function NavItemComponent({ item, isActive, onNavigate, getIcon, isCollapsed }: {
  item: NavItem;
  isActive: boolean;
  onNavigate: (item: string) => void;
  getIcon: (name: string) => React.ReactNode;
  isCollapsed: boolean;
}) {
  const itemKey = item.key.replace(/-/g, '');
  
  return (
    <button
      onClick={() => onNavigate(itemKey)}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150 relative ${
        isActive ? 'font-medium' : ''
      }`}
      style={{
        background: isActive ? 'var(--sapShell_Selected_Background)' : 'transparent',
        color: isActive ? 'var(--sapShell_Navigation_Selected_TextColor)' : 'var(--sapShell_Navigation_TextColor)',
      }}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Active indicator */}
      {isActive && (
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r"
          style={{ background: 'var(--sapShell_Navigation_SelectedColor)' }}
        />
      )}
      
      {getIcon(item.icon)}
      {!isCollapsed && (
        <>
          <span className="text-sm truncate flex-1 text-left">{item.label}</span>
          {item.badge && item.badge > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ 
                background: item.badge > 5 ? 'var(--erp-priority-critical)' : 'var(--sapNeutralBackground)',
                color: item.badge > 5 ? '#fff' : 'var(--sapNeutralTextColor)'
              }}>
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}
