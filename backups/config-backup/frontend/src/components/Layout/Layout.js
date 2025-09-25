import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileSidebar from './MobileSidebar';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Mobile sidebar */}
      <MobileSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
      
      {/* Desktop sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 lg:pl-64 xl:pl-72 min-w-0 flex flex-col">
        {/* Header */}
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        {/* Page content */}
        <main className="flex-1 py-1 sm:py-2 lg:py-4 overflow-auto">
          <div className="px-1 sm:px-2 lg:px-4 xl:px-8 h-full">
            <div className="h-full max-w-full">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;




