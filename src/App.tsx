import { useState, useEffect } from 'react';
import { useThemeEngine } from './hooks/useThemeEngine';
import ShellBar from './components/ShellBar';
import SideNav from './components/SideNav';
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
  const [activeNav, setActiveNav] = useState('dashboard');
  const [currentProject, setCurrentProject] = useState('all');

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

  const handleThemeToggle = () => {
    // Toggle between morning and evening horizon
    if (resolvedTheme === 'morning-horizon') {
      setTheme('evening-horizon');
    } else {
      setTheme('morning-horizon');
    }
  };

  const renderPage = () => {
    switch (activeNav) {
      case 'dashboard':
        return <Dashboard currentProject={currentProject} />;
      case 'projects':
        return <ProjectsPage />;
      case 'approvals':
        return <ApprovalCentre />;
      case 'tasks':
        return <TaskCentre />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'exceptions':
        return <ExceptionCentre />;
      case 'design-system':
        return <DesignSystemShowcase />;
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
        return <Dashboard currentProject={currentProject} />;
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--sapBackgroundColor)' }}>
      {/* Shell Bar */}
      <ShellBar
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        theme={resolvedTheme === 'morning-horizon' ? 'light' : 'dark'}
        onToggleTheme={handleThemeToggle}
        currentProject={currentProject}
        onProjectChange={setCurrentProject}
      />

      {/* Side Navigation */}
      <SideNav
        collapsed={sidebarCollapsed}
        activeItem={activeNav}
        onNavigate={setActiveNav}
      />

      {/* Main Content */}
      <main
        className={`pt-14 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        }`}
      >
        <div className="p-5 max-w-[1600px] mx-auto">
          {/* Breadcrumb */}
          {activeNav !== 'design-system' && (
            <div className="flex items-center gap-2 text-xs mb-4" style={{ color: 'var(--sapContent_LabelColor)' }}>
              <span className="hover:underline cursor-pointer">Home</span>
              <span>/</span>
              <span className="font-medium" style={{ color: 'var(--sapTextColor)' }}>
                {activeNav.charAt(0).toUpperCase() + activeNav.slice(1).replace(/([A-Z])/g, ' $1')}
              </span>
              {currentProject !== 'all' && (
                <>
                  <span>/</span>
                  <span className="font-medium" style={{ color: 'var(--sapTextColor)' }}>
                    {currentProject}
                  </span>
                </>
              )}
            </div>
          )}

          {/* Page Content */}
          {renderPage()}
        </div>
      </main>
    </div>
  );
}

export default App;
