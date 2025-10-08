import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Define navigation configs directly since they're not exported from sidebar files
const superAdminNavigation = {
  main: [
    { name: 'Dashboard', href: '/dashboard', icon: 'Squares2X2Icon', emoji: '🏠' },
  ],
  management: [
    { name: 'Users', href: '/users', icon: 'UserGroupIcon', emoji: '👥' },
    { name: 'Admin Management', href: '/admin-management', icon: 'BuildingOfficeIcon', emoji: '🏢' },
    { name: 'Agent Management', href: '/agent-management', icon: 'UserIcon', emoji: '👤' },
    { name: 'Coordinator Management', href: '/coordinator-management', icon: 'UserCircleIcon', emoji: '👨‍💼' },
    { name: 'Area Coordinator Management', href: '/area-coordinator-management', icon: 'IdentificationIcon', emoji: '🎯' },
  ],
  financial: [
    { name: 'Balance Management', href: '/balance-management', icon: 'CreditCardIcon', emoji: '💳' },
    { name: 'Sales Per Draw', href: '/sales-per-draw', icon: 'PresentationChartLineIcon', emoji: '📈' },
    { name: 'Sales Reports', href: '/reports/sales', icon: 'ChartBarSquareIcon', emoji: '📊' },
    { name: 'Transaction History', href: '/account/transactions', icon: 'DocumentDuplicateIcon', emoji: '📋' },
  ],
  lottery: [
    { name: 'Draw Results', href: '/draw-results', icon: 'StarIcon', emoji: '⭐' },
    { name: 'Winning Tickets', href: '/winning-tickets', icon: 'GiftIcon', emoji: '🎁' },
    { name: 'Agent Tickets', href: '/agent-tickets', icon: 'TicketIcon', emoji: '🎫' },
  ],
  verification: [
    { name: 'Claim Approvals', href: '/claim-approvals', icon: 'LockClosedIcon', emoji: '🔒' },
  ],
  system: [
    { name: 'Prize Configuration', href: '/prize-configuration', icon: 'CurrencyDollarIcon', emoji: '💵' },
    { name: 'Template Assignment', href: '/template-assignment', icon: 'SwatchIcon', emoji: '🎨' },
    { name: 'Security Audit', href: '/admin/audit', icon: 'ShieldCheckIcon', emoji: '🛡️' },
    { name: 'Notifications', href: '/notifications', icon: 'BellAlertIcon', emoji: '🔔' },
    { name: 'Bet Limits', href: '/bet-limits', icon: 'StopIcon', emoji: '🚫' },
  ],
  account: [
    { name: 'Account Info', href: '/account/info', icon: 'UserCircleIcon', emoji: '⚙️' },
  ]
};

const adminNavigation = {
  main: [
    { name: 'Dashboard', href: '/dashboard', icon: 'Squares2X2Icon', emoji: '🏠' },
  ],
  management: [
    { name: 'Users', href: '/users', icon: 'UserGroupIcon', emoji: '👥' },
    { name: 'Agent Management', href: '/agent-management', icon: 'UserIcon', emoji: '👤' },
    { name: 'Coordinator Management', href: '/coordinator-management', icon: 'UserCircleIcon', emoji: '👨‍💼' },
    { name: 'Area Coordinator Management', href: '/area-coordinator-management', icon: 'IdentificationIcon', emoji: '🎯' },
  ],
  financial: [
    { name: 'Balance Management', href: '/balance-management', icon: 'CreditCardIcon', emoji: '💳' },
    { name: 'Sales Per Draw', href: '/sales-per-draw', icon: 'PresentationChartLineIcon', emoji: '📈' },
    { name: 'Sales Reports', href: '/reports/sales', icon: 'ChartBarSquareIcon', emoji: '📊' },
    { name: 'Transaction History', href: '/account/transactions', icon: 'DocumentDuplicateIcon', emoji: '📋' },
  ],
  lottery: [
    { name: 'Draw Results', href: '/draw-results', icon: 'StarIcon', emoji: '⭐' },
    { name: 'Winning Tickets', href: '/winning-tickets', icon: 'GiftIcon', emoji: '🎁' },
    { name: 'Agent Tickets', href: '/agent-tickets', icon: 'TicketIcon', emoji: '🎫' },
  ],
  verification: [
    { name: 'Claim Approvals', href: '/claim-approvals', icon: 'LockClosedIcon', emoji: '🔒' },
  ],
  system: [
    { name: 'Security Audit', href: '/admin/audit', icon: 'ShieldCheckIcon', emoji: '🛡️' },
    { name: 'Notifications', href: '/notifications', icon: 'BellAlertIcon', emoji: '🔔' },
    { name: 'Bet Limits', href: '/bet-limits', icon: 'StopIcon', emoji: '🚫' },
  ],
  account: [
    { name: 'Account Info', href: '/account/info', icon: 'UserCircleIcon', emoji: '⚙️' },
  ]
};

const areaCoordinatorNavigation = {
  main: [
    { name: 'Dashboard', href: '/dashboard', icon: 'Squares2X2Icon', emoji: '🏠' },
  ],
  management: [
    { name: 'Users', href: '/users', icon: 'UserGroupIcon', emoji: '👥' },
  ],
  financial: [
    { name: 'Balance Management', href: '/balance-management', icon: 'CreditCardIcon', emoji: '💳' },
    { name: 'Sales Per Draw', href: '/sales-per-draw', icon: 'PresentationChartLineIcon', emoji: '📈' },
    { name: 'Sales Reports', href: '/reports/sales', icon: 'ChartBarSquareIcon', emoji: '📊' },
    { name: 'Transaction History', href: '/account/transactions', icon: 'DocumentDuplicateIcon', emoji: '📋' },
  ],
  lottery: [
    { name: 'Draw Results', href: '/draw-results', icon: 'StarIcon', emoji: '⭐' },
    { name: 'Winning Tickets', href: '/winning-tickets', icon: 'GiftIcon', emoji: '🎁' },
    { name: 'Agent Tickets', href: '/agent-tickets', icon: 'TicketIcon', emoji: '🎫' },
  ],
  account: [
    { name: 'Account Info', href: '/account/info', icon: 'UserCircleIcon', emoji: '⚙️' },
  ]
};

const coordinatorNavigation = {
  main: [
    { name: 'Dashboard', href: '/dashboard', icon: 'Squares2X2Icon', emoji: '🏠' },
  ],
  management: [
    { name: 'Users', href: '/users', icon: 'UserGroupIcon', emoji: '👥' },
  ],
  financial: [
    { name: 'Balance Management', href: '/balance-management', icon: 'CreditCardIcon', emoji: '💳' },
    { name: 'Sales Per Draw', href: '/sales-per-draw', icon: 'PresentationChartLineIcon', emoji: '📈' },
    { name: 'Sales Reports', href: '/reports/sales', icon: 'ChartBarSquareIcon', emoji: '📊' },
    { name: 'Transaction History', href: '/account/transactions', icon: 'DocumentDuplicateIcon', emoji: '📋' },
  ],
  lottery: [
    { name: 'Draw Results', href: '/draw-results', icon: 'StarIcon', emoji: '⭐' },
    { name: 'Winning Tickets', href: '/winning-tickets', icon: 'GiftIcon', emoji: '🎁' },
    { name: 'Agent Tickets', href: '/agent-tickets', icon: 'TicketIcon', emoji: '🎫' },
  ],
  account: [
    { name: 'Account Info', href: '/account/info', icon: 'UserCircleIcon', emoji: '⚙️' },
  ]
};

const agentNavigation = {
  main: [
    { name: 'Dashboard', href: '/dashboard', icon: 'Squares2X2Icon', emoji: '🏠' },
  ],
  betting: [
    { name: 'Bet History', href: '/bet-history', icon: 'ClockIcon', emoji: '🕒' },
    { name: 'Sales Per Draw', href: '/sales-per-draw', icon: 'PresentationChartLineIcon', emoji: '📈' },
  ],
  results: [
    { name: 'Agent Results', href: '/agent-results', icon: 'TrophyIcon', emoji: '🏆' },
    { name: 'Agent Sales', href: '/agent-sales', icon: 'CreditCardIcon', emoji: '💳' },
    { name: 'Winning Tickets', href: '/winning-tickets', icon: 'GiftIcon', emoji: '🎁' },
    { name: 'Agent Tickets', href: '/agent-tickets', icon: 'TicketIcon', emoji: '🎫' },
  ],
  tools: [
    { name: 'Transaction History', href: '/account/transactions', icon: 'DocumentDuplicateIcon', emoji: '📋' },
  ],
  account: [
    { name: 'Account Info', href: '/account/info', icon: 'UserCircleIcon', emoji: '⚙️' },
  ]
};

const RoleMobileSidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Get navigation based on user role
  const getNavigationForRole = () => {
    switch (user?.role) {
      case 'superadmin':
        return { nav: superAdminNavigation, color: 'red', label: 'SUPER ADMIN' };
      case 'admin':
        return { nav: adminNavigation, color: 'blue', label: 'ADMIN' };
      case 'area_coordinator':
        return { nav: areaCoordinatorNavigation, color: 'purple', label: 'AREA COORDINATOR' };
      case 'coordinator':
        return { nav: coordinatorNavigation, color: 'green', label: 'COORDINATOR' };
      case 'agent':
        return { nav: agentNavigation, color: 'blue', label: 'AGENT' };
      default:
        return { nav: {}, color: 'gray', label: 'USER' };
    }
  };

  const { nav: navigation, color, label } = getNavigationForRole();

  // Get color classes based on role (Tailwind-safe)
  const getColorClasses = () => {
    switch (color) {
      case 'red':
        return {
          bg50: 'bg-red-50',
          bg100: 'bg-red-100',
          bg600: 'bg-red-600',
          border200: 'border-red-200',
          text600: 'text-red-600',
          text800: 'text-red-800',
          text900: 'text-red-900',
          hover100: 'hover:bg-red-100'
        };
      case 'purple':
        return {
          bg50: 'bg-purple-50',
          bg100: 'bg-purple-100',
          bg600: 'bg-purple-600',
          border200: 'border-purple-200',
          text600: 'text-purple-600',
          text800: 'text-purple-800',
          text900: 'text-purple-900',
          hover100: 'hover:bg-purple-100'
        };
      case 'green':
        return {
          bg50: 'bg-green-50',
          bg100: 'bg-green-100',
          bg600: 'bg-green-600',
          border200: 'border-green-200',
          text600: 'text-green-600',
          text800: 'text-green-800',
          text900: 'text-green-900',
          hover100: 'hover:bg-green-100'
        };
      case 'blue':
      default:
        return {
          bg50: 'bg-blue-50',
          bg100: 'bg-blue-100',
          bg600: 'bg-blue-600',
          border200: 'border-blue-200',
          text600: 'text-blue-600',
          text800: 'text-blue-800',
          text900: 'text-blue-900',
          hover100: 'hover:bg-blue-100'
        };
    }
  };

  const colors = getColorClasses();

  const groupLabels = {
    main: '🏠 Overview',
    management: '👥 User Management',
    financial: '💰 Financial',
    lottery: '🎰 Lottery Operations',
    betting: '💰 Betting Operations',
    results: '🏆 Results & Sales',
    tools: '🛠️ Tools',
    verification: '✅ Verification & Claims',
    system: '⚙️ System Settings',
    operator: '💻 Operator Tools',
    account: '👤 Account'
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Mobile Sidebar - Simplified for Low-End Devices */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-blue-200 z-50 lg:hidden flex flex-col">
        
        {/* Simple Header */}
        <div className={`p-3 border-b ${colors.border200} ${colors.bg50}`}>
          <div className="flex items-center justify-between">
            <h1 className={`text-lg font-bold ${colors.text800}`}>{label}</h1>
            <button
              onClick={onClose}
              className={`p-1 rounded ${colors.hover100} ${colors.text600}`}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Simple User Info */}
        {user && (
          <div className={`p-3 border-b ${colors.border200} ${colors.bg50}`}>
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 ${colors.bg600} rounded-full flex items-center justify-center text-white font-bold text-sm`}>
                {user.username?.charAt(0).toUpperCase() || label.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${colors.text900} truncate`}>
                  {user.username || label}
                </p>
                <p className={`text-xs ${colors.text600}`}>{label}</p>
              </div>
            </div>
          </div>
        )}

        {/* Simple Navigation */}
        <nav className="flex-1 overflow-y-auto bg-white" style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          <div className="p-2 space-y-1">
            {Object.entries(navigation).map(([groupKey, items]) => {
              if (items.length === 0) return null;

              return (
                <div key={groupKey} className="space-y-1">
                  <h3 className={`text-xs font-semibold ${colors.text600} uppercase px-2 py-1`}>
                    {groupLabels[groupKey]}
                  </h3>
                  
                  <div className="space-y-1">
                    {items.map((item) => {
                      const isActive = location.pathname === item.href;
                      
                      return (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={onClose}
                          className={
                            isActive
                              ? `flex items-center p-2 text-sm font-medium rounded ${colors.bg600} text-white`
                              : `flex items-center p-2 text-sm font-medium rounded ${colors.text800} ${colors.hover100}`
                          }
                        >
                          <span className="text-lg mr-2">{item.emoji}</span>
                          <span className="truncate">{item.name}</span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
};

export default RoleMobileSidebar;
