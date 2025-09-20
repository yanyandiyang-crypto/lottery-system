import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import './AgentResults.css';

const AgentResults = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    drawTime: 'all',
    page: 1
  });

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, filters]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/draw-results/agent/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.drawTime !== 'all') params.append('drawTime', filters.drawTime);
      params.append('page', filters.page);
      params.append('limit', '20');

      const response = await api.get(`/draw-results/agent/history?${params}`);
      if (response.data.success) {
        setHistoryData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
      toast.error('Failed to load history data');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key !== 'page' ? 1 : value
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      open: { color: '#10b981', text: 'Open' },
      closed: { color: '#f59e0b', text: 'Closed' },
      settled: { color: '#3b82f6', text: 'Settled' }
    };
    
    const config = statusConfig[status] || { color: '#6b7280', text: status };
    
    return (
      <span 
        className="status-badge"
        style={{ backgroundColor: config.color }}
      >
        {config.text}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading results...</p>
      </div>
    );
  }

  return (
    <div className="agent-results">
      <div className="page-header">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Draw Results</h1>
        <p className="text-sm sm:text-base text-gray-600">View lottery draw results and winning numbers</p>
      </div>

      <div className="tabs-container">
        <div className="tabs">
          <button
            className={`tab text-xs sm:text-sm ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={`tab text-xs sm:text-sm ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' && dashboardData && (
        <div className="dashboard-content">
          {/* Today's Draws */}
          <div className="section">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Today's Draws</h2>
            <div className="draws-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {dashboardData.todayDraws.map(draw => (
                <div key={draw.id} className="draw-card bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
                  <div className="draw-header flex items-center justify-between mb-2 sm:mb-3">
                    <span className="draw-time text-sm sm:text-base font-medium text-gray-900">{formatDrawTime(draw.drawTime)}</span>
                    {getStatusBadge(draw.status)}
                  </div>
                  <div className="draw-result text-center">
                    {draw.winningNumber ? (
                      <span className="winning-number text-lg sm:text-xl font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{draw.winningNumber}</span>
                    ) : (
                      <span className="no-result text-sm sm:text-base text-gray-500 italic">Result pending</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Results */}
          <div className="section">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Recent Results</h2>
            <div className="results-table overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Winning Number</th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Tickets</th>
                    <th className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Winners</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recentDraws.map(draw => (
                    <tr key={draw.id} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">{formatDate(draw.drawDate)}</td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">{formatDrawTime(draw.drawTime)}</td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                        <span className="winning-number-cell text-xs sm:text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{draw.winningNumber}</span>
                      </td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{getStatusBadge(draw.status)}</td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">{draw._count?.tickets || 0}</td>
                      <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">{draw._count?.winningTickets || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="history-content bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4">
          {/* Filters */}
          <div className="filters-section mb-4 sm:mb-6">
            <div className="filters grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="filter-group">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Start Date:</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="filter-group">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">End Date:</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="filter-group">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Draw Time:</label>
                <select
                  value={filters.drawTime}
                  onChange={(e) => handleFilterChange('drawTime', e.target.value)}
                  className="w-full text-xs sm:text-sm border border-gray-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Times</option>
                  <option value="twoPM">2:00 PM</option>
                  <option value="fivePM">5:00 PM</option>
                  <option value="ninePM">9:00 PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* History Table */}
          {historyLoading ? (
            <div className="loading-container flex flex-col items-center justify-center py-8">
              <div className="loading-spinner"></div>
              <p className="text-sm text-gray-600 mt-2">Loading history...</p>
            </div>
          ) : (
            <>
              <div className="results-table overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Draw Time</th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Winning Number</th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Total Tickets</th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Winners</th>
                      <th className="px-2 sm:px-3 py-2 text-left text-xs sm:text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historyData.draws?.map(draw => (
                      <tr key={draw.id} className="hover:bg-gray-50">
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">{formatDateTime(draw.drawDate)}</td>
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">{formatDrawTime(draw.drawTime)}</td>
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap">
                          <span className="winning-number-cell text-xs sm:text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{draw.winningNumber}</span>
                        </td>
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">{draw._count?.tickets || 0}</td>
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap text-xs sm:text-sm text-gray-900">{draw._count?.winningTickets || 0}</td>
                        <td className="px-2 sm:px-3 py-2 whitespace-nowrap">{getStatusBadge(draw.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {historyData.pagination && historyData.pagination.totalPages > 1 && (
                <div className="pagination flex items-center justify-between mt-4 sm:mt-6">
                  <button
                    onClick={() => handleFilterChange('page', filters.page - 1)}
                    disabled={filters.page <= 1}
                    className="px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="pagination-info text-xs sm:text-sm text-gray-700">
                    Page {historyData.pagination.currentPage} of {historyData.pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handleFilterChange('page', filters.page + 1)}
                    disabled={filters.page >= historyData.pagination.totalPages}
                    className="px-3 py-1 text-xs sm:text-sm border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default AgentResults;
