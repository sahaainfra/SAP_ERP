import {
  LayoutDashboard, FolderKanban, ClipboardList, CheckSquare,
  BarChart3, Shield, Database, Users, FileText, Truck,
  HardHat, DollarSign, AlertTriangle, Settings, ChevronLeft,
  ChevronRight, Workflow
} from 'lucide-react';

interface SideNavProps {
  collapsed: boolean;
  activeItem: string;
  onNavigate: (item: string) => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'approvals', label: 'Approval Centre', icon: CheckSquare, badge: 4 },
  { id: 'tasks', label: 'Task Centre', icon: ClipboardList, badge: 3 },
  { id: 'exceptions', label: 'Exception Centre', icon: AlertTriangle, badge: 2 },
  { id: 'analytics', label: 'Analytics & EVM', icon: BarChart3 },
  { id: 'resources', label: 'Resources', icon: Users },
  { id: 'procurement', label: 'Procurement', icon: Truck },
  { id: 'finance', label: 'Finance', icon: DollarSign },
  { id: 'safety', label: 'Safety & Compliance', icon: HardHat },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'workflows', label: 'Workflows', icon: Workflow },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'backup', label: 'Backup & Restore', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'design-system', label: 'Design System', icon: LayoutDashboard },
];

export default function SideNav({ collapsed, activeItem, onNavigate }: SideNavProps) {
  return (
    <aside
      className={`fixed left-0 top-14 bottom-0 z-40 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
      style={{ background: 'var(--sapGroupContentBG)', borderRight: '1px solid var(--sapBaseColor)' }}
    >
      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-150 group relative ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'
              }`}
              style={{ color: isActive ? undefined : 'var(--sapFontColor)' }}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'} />
              {!collapsed && (
                <>
                  <span className="text-sm truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
              {collapsed && item.badge && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
              )}
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  {item.label}
                  {item.badge && <span className="ml-1 text-red-300">({item.badge})</span>}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t" style={{ borderColor: 'var(--sapBaseColor)' }}>
        <button
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
          style={{ color: 'var(--sapContentLabelColor)' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span className="ml-2 text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
