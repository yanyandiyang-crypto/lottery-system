import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  HomeIcon,
  UsersIcon,
  TicketIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  BellIcon,
  CogIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ChartPieIcon,
  PrinterIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

// Static navigation items that are always visible based on role
const staticNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent', 'operator'] },
  
  // SuperAdmin only features
  { name: 'Admin Management', href: '/admin-management', icon: UsersIcon, roles: ['superadmin'] },
  { name: 'Function Management', href: '/function-management', icon: CogIcon, roles: ['superadmin'] },
  { name: 'Prize Configuration', href: '/prize-configuration', icon: CurrencyDollarIcon, roles: ['superadmin'] },
  { name: 'Template Assignment', href: '/template-assignment', icon: CogIcon, roles: ['superadmin'] },
  { name: 'Mobile POS Templates', href: '/mobile-pos-templates', icon: PrinterIcon, roles: ['superadmin'] },
  { name: 'Winning Reports', href: '/winning-reports', icon: ChartBarIcon, roles: ['superadmin', 'admin', 'area_coordinator', 'coordinator'] },
  { name: 'Claim Approvals', href: '/claim-approvals', icon: ShieldCheckIcon, roles: ['superadmin', 'admin'] },
  { name: 'Security Audit', href: '/admin/audit', icon: ShieldCheckIcon, roles: ['superadmin', 'admin'] },
  
  // Operator Features
  { name: 'Operator Dashboard', href: '/operator-dashboard', icon: ChartPieIcon, roles: ['operator'] },
  { name: 'Operator Sales', href: '/operator-sales', icon: ChartBarIcon, roles: ['operator'] },
  
  // Agent Features
  { name: 'Sales Per draw', href: '/sales-per-draw', icon: ChartBarIcon, roles: ['agent', 'coordinator', 'area_coordinator', 'admin', 'superadmin'] },
  { name: 'Tickets', href: '/agent-tickets', icon: TicketIcon, roles: ['agent'] },
  { name: 'Winning Tickets', href: '/winning-tickets', icon: TrophyIcon, roles: ['agent', 'coordinator', 'area_coordinator', 'admin', 'superadmin'] },
  { name: 'Bet History', href: '/bet-history', icon: ClockIcon, roles: ['agent'] },
  { name: 'Draw Results', href: '/agent-results', icon: TrophyIcon, roles: ['agent'] },
  
  // Ticket Verification & Claiming
  { name: 'Verify Ticket', href: '/verify', icon: ShieldCheckIcon, roles: ['agent', 'admin', 'superadmin'] },
  { name: 'Claim Prize', href: '/claim', icon: TrophyIcon, roles: ['agent', 'admin', 'superadmin'] },
  
  // General Features
  { name: 'Account Info', href: '/account/info', icon: CogIcon, roles: ['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent', 'operator'] },
  { name: 'Transaction History', href: '/account/transactions', icon: CurrencyDollarIcon, roles: ['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent', 'operator'] },
];

// Dynamic navigation items controlled by function management
const dynamicNavigation = [
  { name: 'Users', href: '/users', icon: UsersIcon, functionKey: 'users' },
  { name: 'Agent Management', href: '/agent-management', icon: UsersIcon, functionKey: 'agent_management' },
  { name: 'Coordinator Management', href: '/coordinator-management', icon: UsersIcon, functionKey: 'coordinator_management' },
  { name: 'Area Coordinator Management', href: '/area-coordinator-management', icon: UsersIcon, functionKey: 'area_coordinator_management' },
  { name: 'Balance Management', href: '/balance-management', icon: CurrencyDollarIcon, functionKey: 'balance_management' },
  { name: 'Bet Limits', href: '/bet-limits', icon: ExclamationTriangleIcon, functionKey: 'bet_limits' },
  { name: 'Draw Results', href: '/draw-results', icon: TrophyIcon, functionKey: 'draw_results' },
  { name: 'Agent Tickets', href: '/agent-tickets', icon: TicketIcon, functionKey: 'agent_tickets' },
  { name: 'Sales Reports', href: '/reports/sales', icon: DocumentChartBarIcon, functionKey: 'sales_reports' },
  { name: 'Notifications', href: '/notifications', icon: BellIcon, functionKey: 'notifications' },
];

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

  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (!user || user.role === 'superadmin') {
        // SuperAdmin has access to all functions
        setAllowedFunctions(dynamicNavigation.map(item => item.functionKey));
        setLoading(false);
        return;
      }

      // Admin has access to all functions by default
      if (user.role === 'admin') {
        setAllowedFunctions(dynamicNavigation.map(item => item.functionKey));
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

  // Filter static navigation by roles
  const filteredStaticNavigation = staticNavigation.filter(item => hasRole(item.roles));
  
  // Filter dynamic navigation by function permissions
  const filteredDynamicNavigation = dynamicNavigation.filter(item => {
    if (user?.role === 'superadmin') return true;
    
    // Hide notifications for coordinator, area_coordinator, and agent
    if (item.functionKey === 'notifications' && ['coordinator', 'area_coordinator', 'agent'].includes(user?.role)) {
      return false;
    }
    
    return allowedFunctions.includes(item.functionKey);
  });
  
  // Create ordered navigation for coordinators
  const getOrderedNavigation = () => {
    if (user?.role === 'area_coordinator') {
      // Custom order for area coordinators
      const areaCoordinatorOrder = [
        'Dashboard',
        'Users', 
        'Balance Management',
        'Sales Reports',
        'Sales Per draw',
        'Draw Results',
        'Winning Tickets',
        'Agent Tickets',
        'Account Info'
      ];
      
      const orderedItems = [];
      
      // Add items in the specified order
      areaCoordinatorOrder.forEach(itemName => {
        // Check static navigation first
        const staticItem = filteredStaticNavigation.find(item => item.name === itemName);
        if (staticItem) {
          orderedItems.push(staticItem);
        }
        
        // Check dynamic navigation
        const dynamicItem = filteredDynamicNavigation.find(item => item.name === itemName);
        if (dynamicItem) {
          orderedItems.push(dynamicItem);
        }
      });
      
      // Add any remaining items that weren't in the order list
      const remainingStatic = filteredStaticNavigation.filter(item => 
        !areaCoordinatorOrder.includes(item.name)
      );
      const remainingDynamic = filteredDynamicNavigation.filter(item => 
        !areaCoordinatorOrder.includes(item.name)
      );
      
      return [...orderedItems, ...remainingStatic, ...remainingDynamic];
    }
    
    if (user?.role === 'coordinator') {
      // Custom order for coordinators (no Notifications in sidebar)
      const coordinatorOrder = [
        'Dashboard',
        'Users', 
        'Balance Management',
        'Sales Reports',
        'Sales Per draw',
        'Draw Results',
        'Winning Tickets',
        'Account Info'
      ];
      
      const orderedItems = [];
      
      // Add items in the specified order
      coordinatorOrder.forEach(itemName => {
        // Check static navigation first
        const staticItem = filteredStaticNavigation.find(item => item.name === itemName);
        if (staticItem) {
          orderedItems.push(staticItem);
        }
        
        // Check dynamic navigation
        const dynamicItem = filteredDynamicNavigation.find(item => item.name === itemName);
        if (dynamicItem) {
          orderedItems.push(dynamicItem);
        }
      });
      
      // Add any remaining items that weren't in the order list
      const remainingStatic = filteredStaticNavigation.filter(item => 
        !coordinatorOrder.includes(item.name)
      );
      const remainingDynamic = filteredDynamicNavigation.filter(item => 
        !coordinatorOrder.includes(item.name)
      );
      
      return [...orderedItems, ...remainingStatic, ...remainingDynamic];
    }
    
    if (['superadmin', 'admin'].includes(user?.role)) {
      // Custom order for admin/superadmin (includes Notifications)
      const adminOrder = [
        'Dashboard',
        'Users',
        'Balance Management',
        'Sales Reports',
        'Sales Per draw',
        'Draw Results',
        'Winning Tickets',
        'Agent Management',
        'Coordinator Management',
        'Area Coordinator Management',
        'Bet Limits',
        'Agent Tickets',
        'Template Designer',
        'Template Assignment',
        'Mobile POS Templates',
        'Notifications',
        'Account Info'
      ];
      
      const orderedItems = [];
      
      // Add items in the specified order
      adminOrder.forEach(itemName => {
        // Check static navigation first
        const staticItem = filteredStaticNavigation.find(item => item.name === itemName);
        if (staticItem) {
          orderedItems.push(staticItem);
        }
        
        // Check dynamic navigation
        const dynamicItem = filteredDynamicNavigation.find(item => item.name === itemName);
        if (dynamicItem) {
          orderedItems.push(dynamicItem);
        }
      });
      
      // Add any remaining items that weren't in the order list
      const remainingStatic = filteredStaticNavigation.filter(item => 
        !adminOrder.includes(item.name)
      );
      const remainingDynamic = filteredDynamicNavigation.filter(item => 
        !adminOrder.includes(item.name)
      );
      
      return [...orderedItems, ...remainingStatic, ...remainingDynamic];
    }
    
    // Default behavior for other roles
    return [...filteredStaticNavigation, ...filteredDynamicNavigation];
  };
  
  const filteredNavigation = getOrderedNavigation();

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

        {/* Navigation - Enhanced responsive design with collapse support */}
        <nav className={`mt-4 lg:mt-5 xl:mt-6 flex-1 space-y-1 overflow-y-auto ${isCollapsed ? 'px-2' : 'px-3 lg:px-4 xl:px-5'}`}>
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-gradient-to-r from-primary-50 to-primary-100 border-primary-500 text-primary-700 shadow-sm'
                    : 'border-transparent text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-sm'
                } group flex items-center ${
                  isCollapsed 
                    ? 'px-2 py-3 justify-center' 
                    : 'px-3 lg:px-4 py-2.5 lg:py-3'
                } text-sm lg:text-base font-medium border-l-4 rounded-r-xl transition-all duration-200 ease-in-out`}
                title={isCollapsed ? item.name : ''}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                  } ${isCollapsed ? '' : 'mr-3 lg:mr-4'} flex-shrink-0 h-5 w-5 lg:h-6 lg:w-6 transition-colors duration-200`}
                  aria-hidden="true"
                />
                {!isCollapsed && (
                  <span className="truncate font-medium">{item.name}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer info */}
        {!isCollapsed && (
          <div className="mt-4 px-4 lg:px-5 xl:px-6 py-3 border-t border-gray-200">
            <div className="flex items-center justify-center">
              <p className="text-xs text-gray-400 font-medium">v2.0.1</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
