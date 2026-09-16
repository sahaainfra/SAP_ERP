import { useState, useEffect } from 'react';
import { useThemeEngine } from './hooks/useThemeEngine';
import ShellBar from './components/ShellBar';
import SideNav from './components/SideNav';
import ContextSwitcher from './components/ContextSwitcher';
import GlobalSearch from './components/GlobalSearch';
import UserProfilePanel from './components/UserProfilePanel';
import Dashboard from './components/Dashboard';
import ProjectsPage from './components/ProjectsPage';
import ApprovalCentre from './components/ApprovalCentre';
import TaskCentre from './components/TaskCentre';
import AnalyticsPage from './components/AnalyticsPage';
import ExceptionCentre from './components/ExceptionCentre';
import PlaceholderPage from './components/PlaceholderPage';
import DesignSystemShowcase from './components/DesignSystemShowcase';

function App() {
  const { theme, resolvedTheme, density, setTheme, setDensity } = useThemeEngine();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [context, setContext] = useState({
    company: 'acme',
    project: 'all',
    site: 'all',
    fy: '2026-27',
  });

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Global keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleThemeToggle = () => {
    if (resolvedTheme === 'morning-horizon') {
      setTheme('evening-horizon');
    } else {
      setTheme('morning-horizon');
    }
  };

  const handleNavigate = (item: string) => {
    setActiveNav(item);
    setMobileNavOpen(false);
  };

  const handleContextChange = (key: string, value: string) => {
    setContext(prev => ({ ...prev, [key]: value }));
    // Update project in dashboard context
    if (key === 'project') {
      // This would trigger a coordinated refresh in production
    }
  };

  const handleToggleSidebar = () => {
    if (window.innerWidth < 768) {
      setMobileNavOpen(!mobileNavOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const renderPage = () => {
    switch (activeNav) {
      case 'dashboard':
        return <Dashboard currentProject={context.project} />;
      case 'projects':
      case 'projectlist':
        return <ProjectsPage />;
      case 'approvals':
      case 'myapprovals':
        return <ApprovalCentre />;
      case 'tasks':
      case 'mytasks':
        return <TaskCentre />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'exceptions':
        return <ExceptionCentre />;
      case 'designsystem':
        return <DesignSystemShowcase />;
      case 'home':
        return <Dashboard currentProject={context.project} />;
      case 'resources':
        return <PlaceholderPage title="Resource Management" description="Workforce planning, allocation, and utilization tracking across all projects." />;
      case 'procurement':
        return <PlaceholderPage title="Procurement" description="Purchase orders, vendor management, material tracking, and supply chain coordination." />;
      case 'finance':
        return <PlaceholderPage title="Finance & Cost Control" description="Cost tracking, invoicing, payment processing, and financial reporting." />;
      case 'safety':
        return <PlaceholderPage title="Safety & Compliance" description="Safety incidents, inspections, permits, compliance tracking, and HSE reporting." />;
      case 'documents':
        return <PlaceholderPage title="Document Management" description="Drawings, specifications, correspondence, and document control workflow." />;
      case 'workflows':
        return <PlaceholderPage title="Workflow Engine" description="Business process automation, approval routing, and workflow configuration." />;
      case 'permissions':
        return <PlaceholderPage title="Permissions & Authority" description="Project-wise responsibility, role-based access control, and delegation management." />;
      case 'backup':
        return <PlaceholderPage title="Backup & Restore" description="Data backup scheduling, encryption, download, restore, and validation tools." />;
      case 'settings':
        return <PlaceholderPage title="System Settings" description="System configuration, user preferences, notification settings, and integrations." />;
      default:
        return <Dashboard currentProject={context.project} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--sapBackgroundColor)' }}>
      {/* Shell Bar */}
      <ShellBar
        onToggleSidebar={handleToggleSidebar}
        theme={resolvedTheme === 'morning-horizon' ? 'light' : 'dark'}
        onToggleTheme={handleThemeToggle}
        onOpenProfile={() => setProfileOpen(true)}
        onOpenSearch={() => setSearchOpen(true)}
      />

      {/* Context Switcher */}
      <ContextSwitcher 
        context={context} 
        onContextChange={handleContextChange} 
      />

      {/* Side Navigation */}
      <SideNav
        collapsed={sidebarCollapsed}
        activeItem={activeNav}
        onNavigate={handleNavigate}
        isMobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-12' : 'ml-64'
        }`}
        style={{ paddingTop: 'calc(var(--sapElement_Height) + 40px)' }}
      >
        <div className="p-5 max-w-[1600px] mx-auto">
          {renderPage()}
        </div>
      </main>

      {/* Global Search Overlay */}
      <GlobalSearch
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={(route) => {
          setSearchOpen(false);
          // Map route to nav item
          if (route === '/dashboard') setActiveNav('dashboard');
          else if (route === '/projects') setActiveNav('projects');
          else if (route === '/approvals') setActiveNav('approvals');
          else if (route === '/tasks') setActiveNav('tasks');
          else if (route === '/analytics') setActiveNav('analytics');
          else if (route === '/exceptions') setActiveNav('exceptions');
        }}
      />

      {/* User Profile Panel */}
      <UserProfilePanel
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </div>
  );
}

export default App;
