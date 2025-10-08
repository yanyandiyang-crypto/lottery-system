import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import {
  ChartBarIcon,
  ClockIcon,
  CalendarIcon,
  FunnelIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import ModernTable from '../../components/UI/ModernTable';

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
      open: { color: 'bg-success-100 text-success-700', text: 'Open' },
      closed: { color: 'bg-warning-100 text-warning-700', text: 'Closed' },
      settled: { color: 'bg-primary-100 text-primary-700', text: 'Settled' }
    };
    
    const config = statusConfig[status] || { color: 'bg-gray-100 text-gray-700', text: status };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${config.color}`}>
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
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-blue-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="w-full px-2 py-2">
        <div className="mb-2">
          <h1 className="text-lg font-bold text-blue-900 text-center">Results</h1>
          <p className="text-xs text-blue-600 text-center">Draw results & winning numbers</p>
        </div>

        {/* Ultra-Compact Tab Navigation */}
        <div className="bg-white rounded p-1 mb-2">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-1 text-xs rounded ${
                activeTab === 'dashboard' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-1 text-xs rounded ${
                activeTab === 'history' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-50 text-blue-600'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-2">
            {/* Ultra-Compact Today's Draws */}
            <div className="bg-white rounded p-2">
              <h2 className="text-sm font-semibold text-gray-900 mb-2 text-center">Today's Results</h2>
              <div className="space-y-1">
                {dashboardData.todayDraws.map((draw) => (
                  <div key={draw.id} className="bg-gray-50 rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-gray-900">{formatDrawTime(draw.drawTime)}</span>
                      {getStatusBadge(draw.status)}
                    </div>
                    <div className="text-center">
                      {draw.winningNumber ? (
                        <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                          {draw.winningNumber}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-xs">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simplified Recent Results */}
            <div className="bg-white rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Results</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tickets</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {dashboardData.recentDraws.map((draw) => (
                      <tr key={draw.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-gray-900">{formatDate(draw.drawDate)}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{formatDrawTime(draw.drawTime)}</td>
                        <td className="px-3 py-2 text-sm">
                          <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded text-xs">
                            {draw.winningNumber}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm">{getStatusBadge(draw.status)}</td>
                        <td className="px-3 py-2 text-sm text-gray-900">{draw._count?.tickets || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Simplified Filters */}
            <div className="bg-white rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">History Filters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Draw Time</label>
                  <select
                    value={filters.drawTime}
                    onChange={(e) => handleFilterChange('drawTime', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Times</option>
                    <option value="twoPM">2:00 PM</option>
                    <option value="fivePM">5:00 PM</option>
                    <option value="ninePM">9:00 PM</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Simplified History Table */}
            <div className="bg-white rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Draw History</h2>
              
              {historyLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tickets</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Winners</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {historyData.draws?.map((draw) => (
                          <tr key={draw.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-900">{formatDateTime(draw.drawDate)}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{formatDrawTime(draw.drawTime)}</td>
                            <td className="px-3 py-2 text-sm">
                              <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded text-xs">
                                {draw.winningNumber}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">{draw._count?.tickets || 0}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{draw._count?.winningTickets || 0}</td>
                            <td className="px-3 py-2 text-sm">{getStatusBadge(draw.status)}</td>
                          </tr>
                        )) || []}
                      </tbody>
                    </table>
                  </div>

                  {/* Simplified Pagination */}
                  {historyData.pagination && historyData.pagination.totalPages > 1 && (
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-sm text-gray-700">
                        Page {historyData.pagination.currentPage} of {historyData.pagination.totalPages}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleFilterChange('page', filters.page - 1)}
                          disabled={filters.page <= 1}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => handleFilterChange('page', filters.page + 1)}
                          disabled={filters.page >= historyData.pagination.totalPages}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentResults;
