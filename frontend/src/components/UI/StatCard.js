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
      <ModernCard className={`p-6 ${className}`} hover={false}>
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div className="text-right">
              <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </ModernCard>
    );
  }

  return (
    <ModernCard 
      className={`p-6 ${className}`} 
      variant="elevated"
      hover={true}
      {...props}
    >
      <div className="flex items-center justify-between mb-4">
        {Icon && (
          <div 
            className={`p-3 rounded-xl ${colors.iconBg} transition-transform duration-200 hover:scale-105`}
          >
            <Icon className={`h-6 w-6 ${colors.iconColor}`} />
          </div>
        )}
        <div className="text-right flex-1 ml-4 min-w-0">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            {title}
          </div>
          <div 
            className={`text-lg sm:text-xl lg:text-2xl font-bold ${colors.valueColor} animate-bounce-in whitespace-nowrap`}
          >
            {value}
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        {subtitle && (
          <span className="text-sm text-gray-600 font-medium">
            {subtitle}
          </span>
        )}
        
        {trend && trendValue && (
          <div className="flex items-center text-sm">
            <div
              className={`flex items-center ${trend === 'up' ? colors.trendUp : colors.trendDown} animate-slide-in`}
            >
              {trend === 'up' ? (
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
                </svg>
              ) : (
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
