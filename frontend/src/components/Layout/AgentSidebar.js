import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Complete navigation for agents - matches mobile sidebar
const agentNavigation = [
  { name: 'Dashboard', href: '/dashboard', emoji: '🏠', group: 'Overview' },
  { name: 'Notifications', href: '/notifications', emoji: '🔔', group: 'Overview' },
  { name: 'Bet History', href: '/bet-history', emoji: '🕒', group: 'Betting' },
  { name: 'Sales Per Draw', href: '/sales-per-draw', emoji: '📈', group: 'Betting' },
  { name: 'Agent Results', href: '/agent-results', emoji: '🏆', group: 'Results' },
  { name: 'Agent Sales', href: '/agent-sales', emoji: '💳', group: 'Results' },
  { name: 'Winning Tickets', href: '/winning-tickets', emoji: '🎁', group: 'Results' },
  { name: 'Agent Tickets', href: '/agent-tickets', emoji: '🎫', group: 'Results' },
  { name: 'Transaction History', href: '/account/transactions', emoji: '📋', group: 'Tools' },
  { name: 'Account Info', href: '/account/info', emoji: '⚙️', group: 'Account' },
];

const AgentSidebar = ({ isCollapsed = false, onToggleCollapse }) => {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className={`bg-white border-r border-blue-200 ${
      isCollapsed ? 'w-12' : 'w-40'
    } flex flex-col h-screen`}>
      
      {/* Compact Header */}
      <div className="p-2 border-b border-blue-200 bg-blue-50">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-sm font-bold text-blue-800">Agent</h1>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded hover:bg-blue-100 text-sm text-blue-600"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* Compact User Info */}
      {!isCollapsed && user && (
        <div className="p-2 border-b border-blue-200 bg-blue-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
              {user.username?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-blue-900 truncate">
                {user.username || 'Agent'}
              </p>
              <p className="text-xs text-blue-600">AGENT</p>
            </div>
          </div>
        </div>
      )}

      {/* Compact Navigation with Fixed Scroll */}
      <nav className="flex-1 overflow-y-auto bg-white" style={{ 
        scrollbarWidth: 'none', 
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      }}>
        <div className="p-1 space-y-1">
          {agentNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`flex items-center ${
                  isCollapsed ? 'justify-center p-1.5' : 'p-1.5'
                } text-xs font-medium rounded ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-700 hover:bg-blue-50'
                }`}
                title={isCollapsed ? item.name : ''}
              >
                <span className="text-sm mr-1">{item.emoji}</span>
                {!isCollapsed && (
                  <span className="truncate">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AgentSidebar;
