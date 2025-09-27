import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
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
  ExclamationTriangleIcon,
  TrophyIcon,
  ClockIcon,
  ChartPieIcon,
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
  // Use the same Tickets page used by agents
  { name: 'Tickets', href: '/agent-tickets', icon: TicketIcon, functionKey: 'tickets' },
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

const MobileSidebar = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();
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
  
  // Combine both navigation arrays
  const filteredNavigation = [...filteredStaticNavigation, ...filteredDynamicNavigation];

  if (loading) {
    return (
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2">
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    );
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-linear duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-linear duration-300"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-900/80" />
        </Transition.Child>

        <div className="fixed inset-0 flex">
          <Transition.Child
            as={Fragment}
            enter="transition ease-in-out duration-300 transform"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <Dialog.Panel className="relative mr-12 sm:mr-16 flex w-full max-w-xs sm:max-w-sm flex-1">
              <Transition.Child
                as={Fragment}
                enter="ease-in-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in-out duration-300"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <div className="absolute left-full top-0 flex w-12 sm:w-16 justify-center pt-5">
                  <button 
                    type="button" 
                    className="-m-2.5 p-2.5 hover:bg-white/20 rounded-full transition-colors duration-200 touch-target" 
                    onClick={onClose}
                    aria-label="Close navigation menu"
                  >
                    <span className="sr-only">Close sidebar</span>
                    <XMarkIcon className="h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow-lg" aria-hidden="true" />
                  </button>
                </div>
              </Transition.Child>
              
              <div className="flex grow flex-col gap-y-4 sm:gap-y-5 overflow-y-auto bg-white/95 backdrop-blur-sm px-4 sm:px-6 pb-4 shadow-xl">
                {/* Logo Section - Enhanced */}
                <div className="flex h-16 sm:h-18 shrink-0 items-center border-b border-gray-200 pb-4">
                  <div className="flex items-center min-w-0 w-full">
                    <div className="h-8 w-8 sm:h-9 sm:w-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-lg sm:text-xl">N</span>
                    </div>
                    <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                      <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">NewBetting</h1>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">Lottery System</p>
                    </div>
                  </div>
                </div>
                
                {/* User Info - Enhanced */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
                  <div className="flex items-center min-w-0">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center border-2 border-primary-300 shadow-sm">
                        <span className="text-primary-700 font-semibold text-sm sm:text-base">
                          {user?.fullName?.charAt(0) || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{user?.fullName}</p>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium">{roleLabels[user?.role]}</p>
                    </div>
                  </div>
                </div>

                {/* Navigation - Enhanced for touch */}
                <nav className="flex flex-1 flex-col overflow-y-auto">
                  <ul className="flex flex-1 flex-col space-y-2">
                    {filteredNavigation.map((item) => (
                      <li key={item.name}>
                        <NavLink
                          to={item.href}
                          onClick={onClose}
                          className={({ isActive }) =>
                            `${
                              isActive
                                ? 'bg-gradient-to-r from-primary-50 to-primary-100 border-primary-500 text-primary-700 shadow-sm'
                                : 'border-transparent text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-sm'
                            } group flex items-center px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium border-l-4 rounded-r-xl transition-all duration-200 ease-in-out touch-target`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <item.icon
                                className={`${
                                  isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
                                } mr-3 sm:mr-4 flex-shrink-0 h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-200`}
                                aria-hidden="true"
                              />
                              <span className="truncate font-medium">{item.name}</span>
                            </>
                          )}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </nav>
                
                {/* Footer */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-center">
                    <p className="text-xs text-gray-400 font-medium">v2.0.1</p>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default MobileSidebar;
