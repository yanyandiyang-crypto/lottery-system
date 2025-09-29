import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
  DevicePhoneMobileIcon,
  LockClosedIcon,
  BellAlertIcon,
  StopIcon,
  CommandLineIcon,
  UserIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';

// Mobile navigation groups with modern emojis and icons (same as desktop)
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
    { name: 'Claim Prize', href: '/claim', icon: GiftIcon, emoji: '💰', roles: ['agent', 'admin', 'superadmin'] },
    { name: 'Claim approvals', href: '/claim-approvals', icon: LockClosedIcon, emoji: '🔒', roles: ['superadmin', 'admin'] },
  ],
  
  system: [
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

const MobileSidebar = ({ isOpen, onClose }) => {
  const { user, hasRole } = useAuth();
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

      // Using static navigation - no dynamic permission fetching needed
      setAllowedFunctions([]);
      setLoading(false);
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

                {/* Navigation - Modern grouped design for mobile */}
                <nav className="flex flex-1 flex-col overflow-y-auto">
                  <div className="space-y-6">
                    {Object.entries(filteredNavigation).map(([groupKey, items]) => (
                      <div key={groupKey} className="space-y-2">
                        {/* Group Header */}
                        <div className="flex items-center justify-between px-3">
                          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            {groupLabels[groupKey]}
                          </h3>
                          <div className="flex-1 ml-3 border-t border-gray-200"></div>
                        </div>
                        
                        {/* Group Items */}
                        <ul className="space-y-1">
                          {items.map((item) => (
                            <li key={item.name}>
                              <NavLink
                                to={item.href}
                                onClick={onClose}
                                className={({ isActive }) =>
                                  `${
                                    isActive
                                      ? 'bg-gradient-to-r from-sky-50 to-blue-50 border-sky-500 text-sky-700 shadow-lg shadow-sky-100'
                                      : 'border-transparent text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-gray-900 hover:shadow-md hover:border-gray-200'
                                  } group flex items-center px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium border-l-4 rounded-r-xl transition-all duration-200 ease-in-out touch-target transform hover:scale-[1.01] active:scale-[0.99]`
                                }
                              >
                                {({ isActive }) => (
                                  <>
                                    <div className="mr-3 sm:mr-4 flex-shrink-0 flex items-center justify-center relative">
                                      {/* Emoji Background */}
                                      <div className={`absolute inset-0 flex items-center justify-center text-lg sm:text-xl transition-all duration-200 ${
                                        isActive ? 'scale-110 opacity-100' : 'scale-100 opacity-70 group-hover:opacity-90'
                                      }`}>
                                        {item.emoji}
                                      </div>
                                      {/* Icon Overlay */}
                                      <item.icon
                                        className={`${
                                          isActive ? 'text-sky-600/20' : 'text-gray-400/20 group-hover:text-gray-600/30'
                                        } h-5 w-5 sm:h-6 sm:w-6 transition-colors duration-200 relative z-10`}
                                        aria-hidden="true"
                                      />
                                    </div>
                                    <span className="truncate font-medium">{item.name}</span>
                                    {isActive && (
                                      <div className="ml-auto w-2 h-2 bg-sky-500 rounded-full animate-pulse shadow-sm"></div>
                                    )}
                                  </>
                                )}
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </nav>
                
                {/* Footer - Enhanced */}
                <div className="pt-4 border-t border-gray-200/50">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <p className="text-xs text-gray-500 font-semibold">NewBetting v2.0.1</p>
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
