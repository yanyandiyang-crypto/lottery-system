import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import SuperAdminSidebar from './SuperAdminSidebar';
import AdminSidebar from './AdminSidebar';
import AreaCoordinatorSidebar from './AreaCoordinatorSidebar';
import CoordinatorSidebar from './CoordinatorSidebar';
import AgentSidebar from './AgentSidebar';
import Header from './Header';
import RoleMobileSidebar from './RoleMobileSidebar';

const Layout = ({ children }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(true); // Default to collapsed
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  
  // Check if user should have mobile navigation spacing
  const useMobileNav = ['agent', 'coordinator', 'area_coordinator'].includes(user?.role);

  // Dynamic sidebar component based on user role
  const getSidebarComponent = () => {
    switch (user?.role) {
      case 'superadmin':
        return SuperAdminSidebar;
      case 'admin':
        return AdminSidebar;
      case 'area_coordinator':
        return AreaCoordinatorSidebar;
      case 'coordinator':
        return CoordinatorSidebar;
      case 'agent':
        return AgentSidebar;
      default:
        return SuperAdminSidebar; // Fallback
    }
  };

  const SidebarComponent = getSidebarComponent();

  // Detect screen size changes for better responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width < 640);
      setIsTablet(width >= 640 && width < 1024);
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile sidebar when screen becomes desktop size
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setSidebarOpen(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row relative">
      {/* Mobile sidebar overlay */}
      <RoleMobileSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Desktop sidebar - fixed positioning */}
      <div className={`hidden lg:block fixed left-0 top-0 h-full z-30 transition-all duration-300 ${
        desktopSidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        <SidebarComponent 
          isCollapsed={desktopSidebarCollapsed}
          onToggleCollapse={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
        />
      </div>
      
      {/* Main content area - adjusts based on sidebar state */}
      <div className={`flex-1 min-w-0 flex flex-col transition-all duration-300 relative z-10 ${
        desktopSidebarCollapsed 
          ? 'lg:ml-16' 
          : 'lg:ml-64'
      }`}>
        {/* Header - responsive across all devices */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Page content with responsive padding and full-width support */}
        <main className="flex-1 overflow-auto">
          <div className={`
            h-full w-full
            ${isMobile ? 'px-2 py-2' : ''}
            ${isTablet ? 'px-4 py-3' : ''}
            ${!isMobile && !isTablet ? (
              desktopSidebarCollapsed 
                ? 'px-3 py-3 lg:px-4 lg:py-4 xl:px-6 xl:py-6' 
                : 'px-4 py-4 lg:px-6 lg:py-6 xl:px-8 xl:py-8'
            ) : ''}
            safe-area-inset-bottom safe-area-inset-left safe-area-inset-right
            ${isMobile && useMobileNav ? 'mobile-nav-spacing' : ''}
          `}>
            <div className="h-full w-full mx-auto">
              {/* Content wrapper with dynamic max-width based on sidebar state */}
              <div className={`
                h-full w-full
                ${isMobile ? 'max-w-full' : ''}
                ${isTablet ? 'max-w-4xl mx-auto' : ''}
                ${!isMobile && !isTablet ? (
                  desktopSidebarCollapsed 
                    ? 'max-w-full' 
                    : 'max-w-7xl mx-auto'
                ) : ''}
              `}>
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;




