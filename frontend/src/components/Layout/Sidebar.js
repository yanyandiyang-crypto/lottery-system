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
  DocumentTextIcon,
  PrinterIcon
} from '@heroicons/react/24/outline';

// Static navigation items that are always visible based on role
const staticNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent', 'operator'] },
  
  // SuperAdmin only features
  { name: 'Admin Management', href: '/admin-management', icon: UsersIcon, roles: ['superadmin'] },
  { name: 'Function Management', href: '/function-management', icon: CogIcon, roles: ['superadmin'] },
  { name: 'Prize Configuration', href: '/prize-configuration', icon: CurrencyDollarIcon, roles: ['superadmin'] },
  { name: 'Mobile POS Templates', href: '/mobile-pos-templates', icon: PrinterIcon, roles: ['superadmin'] },
  
  // Operator Features
  { name: 'Operator Dashboard', href: '/operator-dashboard', icon: ChartPieIcon, roles: ['operator'] },
  { name: 'Operator Sales', href: '/operator-sales', icon: ChartBarIcon, roles: ['operator'] },
  
  // Agent Features
  { name: 'Sales Per draw', href: '/sales-per-draw', icon: ChartBarIcon, roles: ['agent', 'coordinator', 'area_coordinator', 'admin', 'superadmin'] },
  { name: 'Tickets', href: '/agent-tickets', icon: TicketIcon, roles: ['agent'] },
  { name: 'Winning Tickets', href: '/winning-tickets', icon: TrophyIcon, roles: ['agent', 'coordinator', 'area_coordinator', 'admin', 'superadmin'] },
  { name: 'Bet History', href: '/bet-history', icon: ClockIcon, roles: ['agent'] },
  { name: 'Draw Results', href: '/agent-results', icon: TrophyIcon, roles: ['agent'] },
  
  // General Features
  { name: 'Account Info', href: '/account/info', icon: CogIcon, roles: ['superadmin', 'admin', 'area_coordinator', 'coordinator', 'agent', 'operator'] },
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
  { name: 'Ticket Templates', href: '/ticket-templates', icon: DocumentTextIcon, functionKey: 'ticket_templates' },
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

const Sidebar = () => {
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
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 xl:w-72 lg:flex-col">
      <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-3 lg:pt-5 pb-4 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-3 lg:px-4">
          <div className="flex items-center min-w-0">
            <div className="flex-shrink-0">
              <div className="h-7 w-7 lg:h-8 lg:w-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-base lg:text-lg">N</span>
              </div>
            </div>
            <div className="ml-2 lg:ml-3 min-w-0">
              <h1 className="text-lg lg:text-xl font-bold text-gray-900 truncate">NewBetting</h1>
              <p className="text-xs text-gray-500">Lottery System</p>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="mt-3 lg:mt-5 px-3 lg:px-4">
          <div className="bg-gray-50 rounded-lg p-2 lg:p-3">
            <div className="flex items-center min-w-0">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 lg:h-10 lg:w-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-medium text-xs lg:text-sm">
                    {user?.fullName?.charAt(0) || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-2 lg:ml-3 min-w-0">
                <p className="text-xs lg:text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500">{roleLabels[user?.role]}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-3 lg:mt-5 flex-1 px-2 space-y-1 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={`${
                  isActive
                    ? 'bg-primary-50 border-primary-500 text-primary-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-2 py-2 text-xs lg:text-sm font-medium border-l-4 rounded-r-md transition-colors duration-150`}
              >
                <item.icon
                  className={`${
                    isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                  } mr-2 lg:mr-3 flex-shrink-0 h-4 w-4 lg:h-5 lg:w-5`}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

      </div>
    </div>
  );
};

export default Sidebar;
