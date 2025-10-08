import React from 'react';
import ModernCard from './ModernCard';

const StatCard = ({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend,
  trendValue,
  color = 'primary',
  loading = false,
  className = '',
  ...props 
}) => {
  const colorVariants = {
    primary: {
      iconBg: 'bg-gradient-to-br from-blue-100 to-blue-200',
      iconColor: 'text-blue-600',
      valueColor: 'text-blue-600',
      trendUp: 'text-green-600',
      trendDown: 'text-red-600',
    },
    secondary: {
      iconBg: 'bg-gradient-to-br from-purple-100 to-purple-200',
      iconColor: 'text-purple-600',
      valueColor: 'text-purple-600',
      trendUp: 'text-green-600',
      trendDown: 'text-red-600',
    },
    success: {
      iconBg: 'bg-gradient-to-br from-green-100 to-green-200',
      iconColor: 'text-green-600',
      valueColor: 'text-green-600',
      trendUp: 'text-green-600',
      trendDown: 'text-red-600',
    },
    warning: {
      iconBg: 'bg-gradient-to-br from-yellow-100 to-yellow-200',
      iconColor: 'text-yellow-600',
      valueColor: 'text-yellow-600',
      trendUp: 'text-green-600',
      trendDown: 'text-red-600',
    },
    danger: {
      iconBg: 'bg-gradient-to-br from-red-100 to-red-200',
      iconColor: 'text-red-600',
      valueColor: 'text-red-600',
      trendUp: 'text-green-600',
      trendDown: 'text-red-600',
    },
    accent: {
      iconBg: 'bg-gradient-to-br from-indigo-100 to-indigo-200',
      iconColor: 'text-indigo-600',
      valueColor: 'text-indigo-600',
      trendUp: 'text-green-600',
      trendDown: 'text-red-600',
    },
  };

  const colors = colorVariants[color] || colorVariants.primary;

  if (loading) {
    return (
      <ModernCard className={`p-3 sm:p-6 ${className}`} hover={false}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gray-200 rounded-lg sm:rounded-xl"></div>
            <div className="text-right">
              <div className="h-2 sm:h-3 bg-gray-200 rounded w-16 sm:w-20 mb-1 sm:mb-2"></div>
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-20 sm:w-24"></div>
            </div>
          </div>
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-12 sm:w-16"></div>
        </div>
      </ModernCard>
    );
  }

  return (
    <ModernCard 
      className={`p-3 sm:p-6 ${className}`} 
      variant="elevated"
      hover={true}
      {...props}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-4">
        {Icon && (
          <div 
            className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${colors.iconBg} transition-transform duration-200 hover:scale-105`}
          >
            <Icon className={`h-4 w-4 sm:h-6 sm:w-6 ${colors.iconColor}`} />
          </div>
        )}
        <div className="text-right flex-1 ml-2 sm:ml-4 min-w-0">
          <div className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide mb-0.5 sm:mb-1">
            {title}
          </div>
          <div 
            className={`text-sm sm:text-lg lg:text-xl font-bold ${colors.valueColor} animate-bounce-in whitespace-nowrap`}
          >
            {value}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        {subtitle && (
          <span className="text-xs sm:text-sm text-gray-600 font-medium">
            {subtitle}
          </span>
        )}
        
        {trend && trendValue && (
          <div className="flex items-center text-xs sm:text-sm">
            <div
              className={`flex items-center ${trend === 'up' ? colors.trendUp : colors.trendDown} animate-slide-in`}
            >
              {trend === 'up' ? (
                <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              ) : (
                <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5 sm:mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
                </svg>
              )}
              <span className="font-medium">{trendValue}</span>
            </div>
          </div>
        )}
      </div>
    </ModernCard>
  );
};

export default StatCard;
