import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  TicketIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  ClockIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  EyeIcon,
  PresentationChartLineIcon,
  SwatchIcon,
  // Modern icons for better identification
  Squares2X2Icon,
  UserCircleIcon,
  CreditCardIcon,
  ChartBarSquareIcon,
  DocumentDuplicateIcon,
  StarIcon,
  QrCodeIcon,
  GiftIcon,
  WrenchScrewdriverIcon,
  DevicePhoneMobileIcon,
  LockClosedIcon,
  BellAlertIcon,
  StopIcon,
  CommandLineIcon,
  UserIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';

// Organized navigation groups with modern emojis and icons
const navigationGroups = {
  main: [
    { name: 'Dashboard', href: '/dashboard', icon: Squares2X2Icon, emoji: '🏠', roles: ['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent', 'operator'] },
  ],
  
  management: [
    { name: 'Users', href: '/users', icon: UserGroupIcon, emoji: '👥', functionKey: 'users' },
    { name: 'Admin Management', href: '/admin-management', icon: BuildingOfficeIcon, emoji: '🏢', roles: ['superadmin'] },
    { name: 'Agent Management', href: '/agent-management', icon: UserIcon, emoji: '👤', functionKey: 'agent_management' },
    { name: 'Coordinator Management', href: '/coordinator-management', icon: UserCircleIcon, emoji: '👨‍💼', functionKey: 'coordinator_management' },
    { name: 'Area Coordinator Management', href: '/area-coordinator-management', icon: IdentificationIcon, emoji: '🎯', functionKey: 'area_coordinator_management' },
  ],
  
  financial: [
    { name: 'Balance Management', href: '/balance-management', icon: CreditCardIcon, emoji: '💳', functionKey: 'balance_management' },
    { name: 'Sales Per Draw', href: '/sales-per-draw', icon: PresentationChartLineIcon, emoji: '📈', roles: ['agent', 'coordinator', 'area_coordinator', 'admin', 'superadmin'] },
    { name: 'Sales Reports', href: '/reports/sales', icon: ChartBarSquareIcon, emoji: '📊', functionKey: 'sales_reports' },
    { name: 'Transaction History', href: '/account/transactions', icon: DocumentDuplicateIcon, emoji: '📋', roles: ['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent', 'operator'] },
  ],
  
  lottery: [
    { name: 'Draw Results', href: '/draw-results', icon: StarIcon, emoji: '⭐', functionKey: 'draw_results' },
    { name: 'Agent Results', href: '/agent-results', icon: TrophyIcon, emoji: '🏆', roles: ['agent'] },
    { name: 'Winning Tickets', href: '/winning-tickets', icon: GiftIcon, emoji: '🎁', roles: ['agent', 'coordinator', 'area_coordinator', 'admin', 'superadmin'] },
    { name: 'Agent Tickets', href: '/agent-tickets', icon: TicketIcon, emoji: '🎫', functionKey: 'agent_tickets' },
    { name: 'Bet History', href: '/bet-history', icon: ClockIcon, emoji: '🕒', roles: ['agent'] },
  ],
  
  verification: [
    { name: 'Verify Ticket', href: '/verify', icon: QrCodeIcon, emoji: '📱', roles: ['agent', 'admin', 'superadmin'] },
    { name: 'Claim Prize', href: '/claim', icon: GiftIcon, emoji: '💰', roles: ['agent', 'admin', 'superadmin'] },
    { name: 'Claim Approvals', href: '/claim-approvals', icon: LockClosedIcon, emoji: '🔒', roles: ['superadmin', 'admin'] },
  ],
  
  system: [
    { name: 'Function Management', href: '/function-management', icon: WrenchScrewdriverIcon, emoji: '🔧', roles: ['superadmin'] },
    { name: 'Prize Configuration', href: '/prize-configuration', icon: CurrencyDollarIcon, emoji: '💵', roles: ['superadmin'] },
    { name: 'Template Assignment', href: '/template-assignment', icon: SwatchIcon, emoji: '🎨', roles: ['superadmin'] },
    { name: 'Mobile POS Templates', href: '/mobile-pos-templates', icon: DevicePhoneMobileIcon, emoji: '📱', roles: ['superadmin'] },
    { name: 'Security Audit', href: '/admin/audit', icon: ShieldCheckIcon, emoji: '🛡️', roles: ['superadmin', 'admin'] },
    { name: 'Notifications', href: '/notifications', icon: BellAlertIcon, emoji: '🔔', functionKey: 'notifications' },
    { name: 'Bet Limits', href: '/bet-limits', icon: StopIcon, emoji: '🚫', functionKey: 'bet_limits' },
  ],
  
  operator: [
    { name: 'Operator Dashboard', href: '/operator-dashboard', icon: CommandLineIcon, emoji: '💻', roles: ['operator'] },
    { name: 'Operator Sales', href: '/operator-sales', icon: EyeIcon, emoji: '👁️', roles: ['operator'] },
  ],
  
  account: [
    { name: 'Account Info', href: '/account/info', icon: UserCircleIcon, emoji: '⚙️', roles: ['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent', 'operator'] },
  ]
};

const groupLabels = {
  main: '🏠 Overview',
  management: '👥 User Management', 
  financial: '💰 Financial',
  lottery: '🎰 Lottery Operations',
  verification: '✅ Verification & Claims',
  system: '⚙️ System Settings',
  operator: '💻 Operator Tools',
  account: '👤 Account'
};


const roleLabels = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  area_coordinator: 'Area Coordinator',
  coordinator: 'Coordinator',
  agent: 'Agent',
  operator: 'Operator'
};

const Sidebar = ({ isCollapsed = false, onToggleCollapse }) => {
  const { user, hasRole } = useAuth();
  const location = useLocation();
  const [allowedFunctions, setAllowedFunctions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get all function keys from navigation groups
  const getAllFunctionKeys = () => {
    const functionKeys = [];
    Object.values(navigationGroups).forEach(group => {
      group.forEach(item => {
        if (item.functionKey) {
          functionKeys.push(item.functionKey);
        }
      });
    });
    return functionKeys;
  };

  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!user || user.role === 'superadmin') {
        // SuperAdmin has access to all functions
        setAllowedFunctions(getAllFunctionKeys());
        setLoading(false);
        return;
      }

      // Admin has access to all functions by default
      if (user.role === 'admin') {
        setAllowedFunctions(getAllFunctionKeys());
        setLoading(false);
        return;
      }
      
      // Area Coordinator has limited access to specific functions
      if (user.role === 'area_coordinator') {
        const areaCoordinatorFunctions = [
          'users',
          'balance_management', 
          'sales_reports',
          'draw_results',
          'agent_tickets'
        ];
        setAllowedFunctions(areaCoordinatorFunctions);
        setLoading(false);
        return;
      }
      
      // Coordinator has limited access to specific functions
      if (user.role === 'coordinator') {
        const coordinatorFunctions = [
          'users',
          'balance_management', 
          'sales_reports',
          'draw_results'
        ];
        setAllowedFunctions(coordinatorFunctions);
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/function-management/permissions/${user.role}`);
        setAllowedFunctions(response.data.data || []);
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        // Fallback to empty array if error
        setAllowedFunctions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPermissions();
  }, [user]);

  // Filter navigation items by roles and permissions
  const getFilteredNavigation = () => {
    const filteredGroups = {};
    
    Object.entries(navigationGroups).forEach(([groupKey, items]) => {
      const filteredItems = items.filter(item => {
        // Check role-based access
        if (item.roles && !hasRole(item.roles)) {
          return false;
        }
        
        // Check function-based access
        if (item.functionKey) {
          if (user?.role === 'superadmin') return true;
          
          // Hide notifications for coordinator, area_coordinator, and agent
          if (item.functionKey === 'notifications' && ['coordinator', 'area_coordinator', 'agent'].includes(user?.role)) {
            return false;
          }
          
          return allowedFunctions.includes(item.functionKey);
        }
        
        return true;
      });
      
      if (filteredItems.length > 0) {
        filteredGroups[groupKey] = filteredItems;
      }
    });
    
    return filteredGroups;
  };
  
  const filteredNavigation = getFilteredNavigation();

  if (loading) {
    return (
      <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col z-30 transition-all duration-300 ${
        isCollapsed ? 'lg:w-16' : 'lg:w-64 xl:w-72 2xl:w-80'
      }`}>
        <div className="flex flex-col flex-grow bg-white/95 backdrop-blur-sm border-r border-gray-200 pt-5 pb-4 overflow-y-auto shadow-lg">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col z-30 transition-all duration-300 ${
      isCollapsed ? 'lg:w-16' : 'lg:w-64 xl:w-72 2xl:w-80'
    }`}>
      <div className="flex flex-col flex-grow bg-white/95 backdrop-blur-sm border-r border-gray-200 pt-4 lg:pt-5 pb-4 overflow-y-auto shadow-lg">
        {/* Logo - Enhanced responsive design with collapse support */}
        <div className={`flex items-center flex-shrink-0 ${isCollapsed ? 'px-2 justify-center' : 'px-4 lg:px-5 xl:px-6'}`}>
          <div className="flex items-center min-w-0 w-full">
            <div className="flex-shrink-0">
              <button
                onClick={onToggleCollapse}
                className="h-8 w-8 lg:h-9 lg:w-9 xl:h-10 xl:w-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-md hover:from-primary-700 hover:to-primary-800 transition-all duration-200 cursor-pointer"
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              >
                <span className="text-white font-bold text-lg lg:text-xl xl:text-2xl">N</span>
              </button>
            </div>
            {!isCollapsed && (
              <div className="ml-3 lg:ml-4 min-w-0 flex-1">
                <h1 className="text-lg lg:text-xl xl:text-2xl font-bold text-gray-900 truncate">NewBetting</h1>
                <p className="text-xs lg:text-sm text-gray-500 font-medium">Lottery System</p>
              </div>
            )}
          </div>
        </div>

        {/* User Info - Enhanced design with collapse support */}
        {!isCollapsed && (
          <div className="mt-4 lg:mt-5 xl:mt-6 px-4 lg:px-5 xl:px-6">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 lg:p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center min-w-0">
                <div className="flex-shrink-0">
                  <div className="h-9 w-9 lg:h-10 lg:w-10 xl:h-12 xl:w-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center border-2 border-primary-300 shadow-sm">
                    <span className="text-primary-700 font-semibold text-sm lg:text-base xl:text-lg">
                      {user?.fullName?.charAt(0) || 'U'}
                    </span>
                  </div>
                </div>
                <div className="ml-3 lg:ml-4 min-w-0 flex-1">
                  <p className="text-sm lg:text-base xl:text-lg font-semibold text-gray-900 truncate">{user?.fullName}</p>
                  <p className="text-xs lg:text-sm text-gray-600 font-medium">{roleLabels[user?.role]}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation - Modern grouped design with collapse support */}
        <nav className={`mt-4 lg:mt-5 xl:mt-6 flex-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3 lg:px-4 xl:px-5'}`}>
          <div className="space-y-6">
            {Object.entries(filteredNavigation).map(([groupKey, items]) => (
              <div key={groupKey} className="space-y-2">
                {/* Group Header */}
                {!isCollapsed && (
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                      {groupLabels[groupKey]}
                    </h3>
                    <div className="flex-1 ml-3 border-t border-gray-200"></div>
                  </div>
                )}
                
                {/* Group Items */}
                <div className="space-y-1">
                  {items.map((item) => {
                    const isActive = location.pathname === item.href;
                    return (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        onClick={(e) => {
                          // Prevent navigation if already on the same page
                          if (location.pathname === item.href) {
                            e.preventDefault();
                            return false;
                          }
                        }}
                        className={({ isActive: navIsActive }) => `${
                          navIsActive || location.pathname === item.href
                            ? 'bg-gradient-to-r from-sky-50 to-blue-50 border-sky-500 text-sky-700 shadow-lg shadow-sky-100'
                            : 'border-transparent text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-md hover:border-gray-200'
                        } group flex items-center ${
                          isCollapsed 
                            ? 'px-2 py-3 justify-center' 
                            : 'px-3 lg:px-4 py-2.5 lg:py-3'
                        } text-sm lg:text-base font-medium border-l-4 rounded-r-xl transition-all duration-200 ease-in-out transform hover:scale-[1.01] active:scale-[0.99]`}
                        title={isCollapsed ? item.name : ''}
                      >
                        <div className={`${isCollapsed ? '' : 'mr-3 lg:mr-4'} flex-shrink-0 flex items-center justify-center relative`}>
                          {/* Emoji Background */}
                          <div className={`absolute inset-0 flex items-center justify-center text-lg lg:text-xl transition-all duration-200 ${
                            isActive ? 'scale-110 opacity-100' : 'scale-100 opacity-70 group-hover:opacity-90'
                          }`}>
                            {item.emoji}
                          </div>
                          {/* Icon Overlay */}
                          <item.icon
                            className={`${
                              isActive ? 'text-sky-600/20' : 'text-gray-400/20 group-hover:text-gray-600/30'
                            } h-5 w-5 lg:h-6 lg:w-6 transition-colors duration-200 relative z-10`}
                            aria-hidden="true"
                          />
                        </div>
                        {!isCollapsed && (
                          <span className="truncate font-medium">{item.name}</span>
                        )}
                        {isActive && !isCollapsed && (
                          <div className="ml-auto w-2 h-2 bg-sky-500 rounded-full animate-pulse shadow-sm"></div>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer info - Enhanced */}
        {!isCollapsed && (
          <div className="mt-4 px-4 lg:px-5 xl:px-6 py-3 border-t border-gray-200/50">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <p className="text-xs text-gray-500 font-semibold">NewBetting v2.0.1</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
