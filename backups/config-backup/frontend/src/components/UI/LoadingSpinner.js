import React from 'react';

const LoadingSpinner = ({ size = 'md', className = '', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex justify-center items-center bg-white bg-opacity-75 z-50'
    : `flex justify-center items-center ${className}`;

  return (
    <div className={containerClasses}>
      <div
        className={`animate-spin rounded-full border-2 border-gray-300 border-t-primary-600 ${sizeClasses[size]}`}
      />
    </div>
  );
};

export default LoadingSpinner;




