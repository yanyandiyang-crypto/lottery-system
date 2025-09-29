import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  HomeIcon,
  TicketIcon,
  QrCodeIcon,
  ChartBarIcon,
  UserIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import {
  HomeIcon as HomeIconSolid,
  TicketIcon as TicketIconSolid,
  QrCodeIcon as QrCodeIconSolid,
  ChartBarIcon as ChartBarIconSolid,
  UserIcon as UserIconSolid,
  CurrencyDollarIcon as CurrencyDollarIconSolid
} from '@heroicons/react/24/solid';

const MobileNavigation = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items based on user role
  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        path: '/dashboard',
        icon: HomeIcon,
        activeIcon: HomeIconSolid,
        roles: ['agent', 'coordinator', 'area_coordinator', 'admin', 'superadmin']
      }
    ];

    // Agent-specific navigation
    if (user?.role === 'agent') {
      return [
        ...baseItems,
        {
          name: 'Betting',
          path: '/betting',
          icon: TicketIcon,
          activeIcon: TicketIconSolid,
          roles: ['agent']
        },
        {
          name: 'Scan QR',
          path: '/verify',
          icon: QrCodeIcon,
          activeIcon: QrCodeIconSolid,
          roles: ['agent']
        },
        {
          name: 'Sales',
          path: '/agent-sales',
          icon: ChartBarIcon,
          activeIcon: ChartBarIconSolid,
          roles: ['agent']
        },
        {
          name: 'Account',
          path: '/account',
          icon: UserIcon,
          activeIcon: UserIconSolid,
          roles: ['agent']
        }
      ];
    }

    // Coordinator navigation
    if (user?.role === 'coordinator' || user?.role === 'area_coordinator') {
      return [
        ...baseItems,
        {
          name: 'Sales',
          path: '/sales-per-draw',
          icon: CurrencyDollarIcon,
          activeIcon: CurrencyDollarIconSolid,
          roles: ['coordinator', 'area_coordinator']
        },
        {
          name: 'Reports',
          path: '/reports',
          icon: ChartBarIcon,
          activeIcon: ChartBarIconSolid,
          roles: ['coordinator', 'area_coordinator']
        },
        {
          name: 'Scan QR',
          path: '/verify',
          icon: QrCodeIcon,
          activeIcon: QrCodeIconSolid,
          roles: ['coordinator', 'area_coordinator']
        },
        {
          name: 'Account',
          path: '/account',
          icon: UserIcon,
          activeIcon: UserIconSolid,
          roles: ['coordinator', 'area_coordinator']
        }
      ];
    }

    // Default navigation for other roles
    return [
      ...baseItems,
      {
        name: 'Reports',
        path: '/reports',
        icon: ChartBarIcon,
        activeIcon: ChartBarIconSolid,
        roles: ['admin', 'superadmin']
      },
      {
        name: 'Account',
        path: '/account',
        icon: UserIcon,
        activeIcon: UserIconSolid,
        roles: ['admin', 'superadmin']
      }
    ];
  };

  const navigationItems = getNavigationItems().filter(item => 
    item.roles.includes(user?.role)
  );

  const isActive = (path) => {
    return location.pathname === path || 
           (path === '/dashboard' && location.pathname === '/');
  };

  const handleNavigation = (path) => {
    navigate(path);
    
    // Add haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom">
      <div className="flex justify-around items-center py-1">
        {navigationItems.map((item) => {
          const Icon = isActive(item.path) ? item.activeIcon : item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.name}
              onClick={() => handleNavigation(item.path)}
              className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 transition-colors duration-200 ${
                active 
                  ? 'text-primary-600' 
                  : 'text-gray-500 hover:text-gray-700 active:text-primary-500'
              }`}
              style={{ minHeight: '60px' }} // Touch-friendly height
            >
              <Icon className={`h-6 w-6 mb-1 ${active ? 'text-primary-600' : ''}`} />
              <span className={`text-xs font-medium truncate w-full text-center ${
                active ? 'text-primary-600' : 'text-gray-500'
              }`}>
                {item.name}
              </span>
              
              {/* Active indicator */}
              {active && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-white"></div>
    </nav>
  );
};

export default MobileNavigation;
