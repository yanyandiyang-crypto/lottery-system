import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
// No longer using SVG icons - using emojis instead

// Admin has management access (no SuperAdmin-only features)
const adminNavigation = {
  main: [
    { name: 'Dashboard', href: '/dashboard', emoji: '🏠' },
  ],
  
  management: [
    { name: 'Users', href: '/users', emoji: '👥' },
    { name: 'Agent Management', href: '/agent-management', emoji: '👤' },
    { name: 'Coordinator Management', href: '/coordinator-management', emoji: '👨‍💼' },
    { name: 'Area Coordinator Management', href: '/area-coordinator-management', emoji: '🎯' },
  ],
  
  financial: [
    { name: 'Balance Management', href: '/balance-management', emoji: '💳' },
    { name: 'Sales Per Draw', href: '/sales-per-draw', emoji: '📈' },
    { name: 'Sales Reports', href: '/reports/sales', emoji: '📊' },
  ],
  
  lottery: [
    { name: 'Draw Results', href: '/draw-results', emoji: '⭐' },
    { name: 'Winning Tickets', href: '/winning-tickets', emoji: '🎁' },
    { name: 'Agent Tickets', href: '/agent-tickets', emoji: '🎫' },
  ],
  
  verification: [
    { name: 'Claim Approvals', href: '/claim-approvals', emoji: '🔒' },
  ],
  
  system: [
    { name: 'Notifications', href: '/notifications', emoji: '🔔' },
    { name: 'Bet Limits', href: '/bet-limits', emoji: '🚫' },
  ],
  
  account: [
    { name: 'Transaction History', href: '/account/transactions', emoji: '📋' },
    { name: 'Account Info', href: '/account/info', emoji: '⚙️' },
  ]
};

const groupLabels = {
  main: '🏠 Overview',
  management: '👥 User Management', 
  financial: '💰 Financial',
  lottery: '🎰 Lottery Operations',
  verification: '✅ Verification & Claims',
  system: '⚙️ System Settings',
  account: '👤 Account'
};

const AdminSidebar = ({ isCollapsed = false, onToggleCollapse }) => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-screen`}>
      
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-800">Admin</h1>
              <p className="text-sm text-gray-600">Management Access</p>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={isCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7M21 19l-7-7 7-7"} />
            </svg>
          </button>
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
              {user.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.username || 'Admin'}
              </p>
              <p className="text-xs text-blue-600 font-medium">
                🔵 ADMIN
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation - Scrollable Container */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100" style={{
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'thin'
      }}>
        {Object.entries(adminNavigation).map(([groupKey, items]) => {
          if (items.length === 0) return null;

          return (
            <div key={groupKey} className="space-y-2">
              {!isCollapsed && (
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2">
                  {groupLabels[groupKey]}
                </h3>
              )}
              
              <div className="space-y-1">
                {items.map((item) => {
                  const isActive = location.pathname === item.href;
                  
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center ${
                        isCollapsed ? 'justify-center px-3 py-2.5' : 'px-3 py-2.5'
                      } text-sm font-medium rounded-lg transition-all duration-200 relative ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                      title={isCollapsed ? item.name : ''}
                    >
                      
                      <span className="flex-shrink-0 text-lg">
                        {item.emoji}
                      </span>
                      
                      {!isCollapsed && (
                        <span className="ml-3 flex-1">{item.name}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default AdminSidebar;
