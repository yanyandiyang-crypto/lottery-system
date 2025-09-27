import React, { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

/**
 * MobileTable - A responsive table component that adapts to mobile screens
 * Converts table layout to card-based layout on mobile devices
 */
const MobileTable = ({ 
  data = [], 
  columns = [], 
  className = '',
  showSearch = false,
  searchPlaceholder = "Search...",
  emptyMessage = "No data available"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());

  // Filter data based on search term
  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    return columns.some(col => {
      const value = col.accessor ? row[col.accessor] : '';
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  const toggleRowExpansion = (index) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  // Get primary columns (first 2-3 most important columns)
  const primaryColumns = columns.slice(0, 2);
  const secondaryColumns = columns.slice(2);

  return (
    <div className={`w-full ${className}`}>
      {/* Search Bar */}
      {showSearch && (
        <div className="mb-4">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-gray-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(row[column.accessor], row, rowIndex) : row[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3">
        {filteredData.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {emptyMessage}
          </div>
        ) : (
          filteredData.map((row, rowIndex) => (
            <div key={rowIndex} className="bg-white border border-gray-200 rounded-lg shadow-sm">
              {/* Primary Information - Always Visible */}
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    {primaryColumns.map((column, colIndex) => (
                      <div key={colIndex} className={colIndex === 0 ? "mb-1" : "mb-2"}>
                        {colIndex === 0 ? (
                          // First column as main title
                          <div className="text-base font-semibold text-gray-900 truncate">
                            {column.render ? column.render(row[column.accessor], row, rowIndex) : row[column.accessor]}
                          </div>
                        ) : (
                          // Second column as subtitle
                          <div className="text-sm text-gray-600 truncate">
                            <span className="font-medium text-gray-500">{column.header}:</span>{' '}
                            {column.render ? column.render(row[column.accessor], row, rowIndex) : row[column.accessor]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Expand/Collapse Button - Only show if there are secondary columns */}
                  {secondaryColumns.length > 0 && (
                    <button
                      onClick={() => toggleRowExpansion(rowIndex)}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      {expandedRows.has(rowIndex) ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Secondary Information - Expandable */}
              {secondaryColumns.length > 0 && expandedRows.has(rowIndex) && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-3 space-y-2">
                    {secondaryColumns.map((column, colIndex) => (
                      <div key={colIndex} className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-500">{column.header}:</span>
                        <span className="text-sm text-gray-900 text-right">
                          {column.render ? column.render(row[column.accessor], row, rowIndex) : row[column.accessor]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * SimpleTable - A basic responsive table for simple data
 */
export const SimpleTable = ({ 
  headers = [], 
  rows = [], 
  className = '',
  emptyMessage = "No data available"
}) => {
  return (
    <div className={`w-full ${className}`}>
      {/* Desktop View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="px-3 py-8 text-center text-gray-500 text-sm">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-4 text-sm text-gray-900">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="sm:hidden space-y-3">
        {rows.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {emptyMessage}
          </div>
        ) : (
          rows.map((row, rowIndex) => (
            <div key={rowIndex} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="space-y-2">
                {row.map((cell, cellIndex) => (
                  <div key={cellIndex} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">{headers[cellIndex]}:</span>
                    <span className="text-sm text-gray-900 text-right flex-1 ml-2 truncate">{cell}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

/**
 * DataTable - Advanced table with sorting, pagination, and mobile optimization
 */
export const DataTable = ({ 
  data = [], 
  columns = [], 
  pageSize = 10,
  showPagination = true,
  showSearch = true,
  className = ''
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Filter and sort data
  let processedData = [...data];
  
  if (searchTerm) {
    processedData = processedData.filter(row =>
      columns.some(col => {
        const value = col.accessor ? row[col.accessor] : '';
        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }

  if (sortConfig.key) {
    processedData.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = showPagination 
    ? processedData.slice(startIndex, startIndex + pageSize)
    : processedData;

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Search */}
      {showSearch && (
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Table */}
      <MobileTable 
        data={paginatedData} 
        columns={columns}
        showSearch={false}
        emptyMessage="No data found"
      />

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, processedData.length)} of {processedData.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileTable;
