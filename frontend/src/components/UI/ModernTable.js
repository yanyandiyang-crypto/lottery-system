import React from 'react';
import ModernCard from './ModernCard';

const ModernTable = ({ 
  columns = [], 
  data = [], 
  loading = false,
  emptyMessage = "No data available",
  className = '',
  ...props 
}) => {
  if (loading) {
    return (
      <ModernCard className={`overflow-hidden ${className}`}>
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="px-6 py-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ModernCard>
    );
  }

  if (data.length === 0) {
    return (
      <ModernCard className={`text-center py-12 ${className}`}>
        <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Found</h3>
        <p className="text-gray-500">{emptyMessage}</p>
      </ModernCard>
    );
  }

  return (
    <ModernCard className={`overflow-hidden ${className}`} variant="elevated" {...props}>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={column.key || index}
                  className={`px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider animate-slide-in ${column.className || ''}`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {column.label || column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className="hover:bg-gray-50 transition-colors duration-200 animate-fade-in"
                style={{ animationDelay: `${rowIndex * 50}ms` }}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={`${rowIndex}-${column.key || colIndex}`}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                  >
                    {column.render ? column.render(row[column.key], row, rowIndex) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-gray-200">
        {data.map((row, rowIndex) => (
          <div
            key={row.id || rowIndex}
            className="p-4 hover:bg-gray-50 transition-colors duration-200 animate-fade-in"
            style={{ animationDelay: `${rowIndex * 50}ms` }}
          >
            <div className="space-y-3">
              {columns.map((column, colIndex) => {
                // Skip columns that are marked as hidden on mobile
                if (column.hideOnMobile) return null;
                
                const value = column.render ? column.render(row[column.key], row, rowIndex) : row[column.key];
                
                // Skip empty values
                if (!value && value !== 0) return null;
                
                return (
                  <div key={`mobile-${rowIndex}-${column.key || colIndex}`} className="flex justify-between items-start">
                    <div className="text-sm font-medium text-gray-600 flex-shrink-0 w-24">
                      {column.label || column.title}:
                    </div>
                    <div className="text-sm text-gray-900 flex-1 text-right">
                      {value}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ModernCard>
  );
};

export default ModernTable;
