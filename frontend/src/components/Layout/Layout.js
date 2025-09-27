import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileSidebar from './MobileSidebar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(true); // Default to collapsed
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

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
      <MobileSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Desktop sidebar - collapsible */}
      <Sidebar 
        isCollapsed={desktopSidebarCollapsed}
        onToggleCollapse={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
      />
      
      {/* Main content area - adjusts based on sidebar state */}
      <div className={`flex-1 min-w-0 flex flex-col transition-all duration-300 ${
        desktopSidebarCollapsed 
          ? 'lg:pl-16' 
          : 'lg:pl-64 xl:pl-72 2xl:pl-80'
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




