import React from 'react';

/**
 * ResponsiveContainer - A utility component to handle responsive layouts
 * Provides consistent spacing and layout patterns across all pages
 */
const ResponsiveContainer = ({ 
  children, 
  className = '', 
  maxWidth = '7xl',
  padding = 'responsive',
  spacing = 'normal'
}) => {
  // Base responsive padding classes
  const paddingClasses = {
    none: '',
    tight: 'px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4',
    responsive: 'px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6 xl:px-8 xl:py-8',
    loose: 'px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-12 xl:py-12'
  };

  // Max width classes
  const maxWidthClasses = {
    'sm': 'max-w-sm',
    'md': 'max-w-md', 
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full'
  };

  // Spacing classes for child elements
  const spacingClasses = {
    tight: 'space-y-2 sm:space-y-3',
    normal: 'space-y-3 sm:space-y-4 lg:space-y-6',
    loose: 'space-y-4 sm:space-y-6 lg:space-y-8'
  };

  return (
    <div className={`
      w-full mx-auto
      ${maxWidthClasses[maxWidth] || maxWidthClasses['7xl']}
      ${paddingClasses[padding] || paddingClasses.responsive}
      ${className}
    `}>
      <div className={spacingClasses[spacing] || spacingClasses.normal}>
        {children}
      </div>
    </div>
  );
};

/**
 * ResponsiveCard - A responsive card component
 */
export const ResponsiveCard = ({ 
  children, 
  className = '', 
  padding = 'normal',
  shadow = 'normal'
}) => {
  const paddingClasses = {
    tight: 'p-3 sm:p-4',
    normal: 'p-4 sm:p-5 lg:p-6',
    loose: 'p-5 sm:p-6 lg:p-8'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    normal: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  return (
    <div className={`
      bg-white rounded-lg sm:rounded-xl border border-gray-200
      ${paddingClasses[padding] || paddingClasses.normal}
      ${shadowClasses[shadow] || shadowClasses.normal}
      ${className}
    `}>
      {children}
    </div>
  );
};

/**
 * ResponsiveGrid - A responsive grid component
 */
export const ResponsiveGrid = ({ 
  children, 
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'normal',
  className = ''
}) => {
  const gapClasses = {
    tight: 'gap-2 sm:gap-3',
    normal: 'gap-3 sm:gap-4 lg:gap-6',
    loose: 'gap-4 sm:gap-6 lg:gap-8'
  };

  const gridCols = `grid-cols-${cols.mobile} sm:grid-cols-${cols.tablet} lg:grid-cols-${cols.desktop}`;

  return (
    <div className={`
      grid ${gridCols}
      ${gapClasses[gap] || gapClasses.normal}
      ${className}
    `}>
      {children}
    </div>
  );
};

/**
 * ResponsiveButtonGroup - A responsive button group component
 */
export const ResponsiveButtonGroup = ({ 
  children, 
  direction = 'responsive', // 'horizontal', 'vertical', 'responsive'
  spacing = 'normal',
  className = ''
}) => {
  const spacingClasses = {
    tight: 'gap-1 sm:gap-2',
    normal: 'gap-2 sm:gap-3',
    loose: 'gap-3 sm:gap-4'
  };

  const directionClasses = {
    horizontal: 'flex flex-row',
    vertical: 'flex flex-col',
    responsive: 'flex flex-col sm:flex-row'
  };

  return (
    <div className={`
      ${directionClasses[direction] || directionClasses.responsive}
      ${spacingClasses[spacing] || spacingClasses.normal}
      ${className}
    `}>
      {children}
    </div>
  );
};

/**
 * ResponsiveTable - A responsive table wrapper
 */
export const ResponsiveTable = ({ children, className = '' }) => {
  return (
    <div className="w-full overflow-x-auto -mx-2 sm:mx-0">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden shadow-sm ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <table className={`min-w-full divide-y divide-gray-200 ${className}`}>
            {children}
          </table>
        </div>
      </div>
    </div>
  );
};

/**
 * ResponsiveModal - A responsive modal component
 */
export const ResponsiveModal = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  size = 'md',
  className = ''
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md sm:max-w-lg',
    lg: 'max-w-lg sm:max-w-xl lg:max-w-2xl',
    xl: 'max-w-xl sm:max-w-2xl lg:max-w-4xl',
    full: 'max-w-full'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center p-0 sm:items-center sm:p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className={`
          relative w-full transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white 
          shadow-xl transition-all
          ${sizeClasses[size] || sizeClasses.md}
          ${className}
        `}>
          {title && (
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          )}
          <div className="px-4 py-4 sm:px-6 sm:py-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponsiveContainer;
