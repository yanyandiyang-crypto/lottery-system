import React from 'react';

const PageHeader = ({ 
  title, 
  subtitle, 
  children,
  breadcrumbs = [],
  className = '',
  ...props 
}) => {
  return (
    <div
      className={`mb-8 animate-slide-in ${className}`}
      {...props}
    >
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-3">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="inline-flex items-center">
                {index > 0 && (
                  <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-sm font-medium text-gray-900">
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header Content */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
        <div className="flex-1 min-w-0">
          <h1 
            className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent animate-fade-in"
            style={{ animationDelay: '100ms' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p 
              className="mt-2 text-lg text-gray-600 font-medium animate-fade-in"
              style={{ animationDelay: '200ms' }}
            >
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Action buttons or additional content */}
        {children && (
          <div
            className="flex-shrink-0 animate-fade-in"
            style={{ animationDelay: '300ms' }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;
