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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading draw results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Draw Results"
          subtitle="View lottery draw results, winning numbers, and historical data"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Agent', href: '/agent' },
            { label: 'Draw Results' }
          ]}
        />

        {/* Tab Navigation */}
        <ModernCard variant="elevated" className="mb-8">
          <div className="px-4 sm:px-6 py-4">
            <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4" aria-label="Results Tabs">
              <ModernButton
                variant={activeTab === 'dashboard' ? 'primary' : 'ghost'}
                onClick={() => setActiveTab('dashboard')}
                className="w-full sm:w-auto justify-center sm:justify-start"
              >
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="h-5 w-5 flex-shrink-0" />
                  <span>Dashboard</span>
                </div>
              </ModernButton>
              <ModernButton
                variant={activeTab === 'history' ? 'primary' : 'ghost'}
                onClick={() => setActiveTab('history')}
                className="w-full sm:w-auto justify-center sm:justify-start"
              >
                <div className="flex items-center space-x-2">
                  <ClockIcon className="h-5 w-5 flex-shrink-0" />
                  <span>History</span>
                </div>
              </ModernButton>
            </nav>
          </div>
        </ModernCard>

        {activeTab === 'dashboard' && dashboardData && (
          <div className="space-y-8 animate-fade-in">
            {/* Today's Draws */}
            <ModernCard variant="elevated">
              <div className="p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <CalendarIcon className="h-6 w-6 text-primary-600" />
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Today's Draws
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {dashboardData.todayDraws.map((draw, index) => (
                    <ModernCard 
                      key={draw.id} 
                      variant="glass" 
                      className="hover:shadow-glow transition-all duration-300 animate-slide-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-base font-semibold text-gray-900">{formatDrawTime(draw.drawTime)}</span>
                          {getStatusBadge(draw.status)}
                        </div>
                        <div className="text-center">
                          {draw.winningNumber ? (
                            <span className="inline-block text-2xl font-bold text-success-600 bg-success-50 px-4 py-2 rounded-lg">
                              {draw.winningNumber}
                            </span>
                          ) : (
                            <span className="text-gray-500 italic">Result pending</span>
                          )}
                        </div>
                      </div>
                    </ModernCard>
                  ))}
                </div>
              </div>
            </ModernCard>

            {/* Recent Results */}
            <ModernCard variant="elevated">
              <div className="p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <EyeIcon className="h-6 w-6 text-primary-600" />
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Recent Results
                  </h2>
                </div>
                <ModernTable
                  columns={[
                    { key: 'drawDate', label: 'Date', sortable: true, render: (value) => formatDate(value) },
                    { key: 'drawTime', label: 'Time', sortable: true, render: (value) => formatDrawTime(value) },
                    { 
                      key: 'winningNumber', 
                      label: 'Winning Number', 
                      render: (value) => (
                        <span className="inline-block font-bold text-success-600 bg-success-50 px-3 py-1 rounded-lg">
                          {value}
                        </span>
                      )
                    },
                    { key: 'status', label: 'Status', render: (value) => getStatusBadge(value) },
                    { key: '_count.tickets', label: 'Tickets', render: (value, row) => row._count?.tickets || 0 },
                    { key: '_count.winningTickets', label: 'Winners', render: (value, row) => row._count?.winningTickets || 0 }
                  ]}
                  data={dashboardData.recentDraws}
                  emptyMessage="No recent draw results available"
                />
              </div>
            </ModernCard>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-fade-in">
            {/* Filters */}
            <ModernCard variant="glass">
              <div className="p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <FunnelIcon className="h-5 w-5 text-primary-600 flex-shrink-0" />
                  <h3 className="text-lg font-semibold text-gray-900">History Filters</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Draw Time</label>
                    <select
                      value={filters.drawTime}
                      onChange={(e) => handleFilterChange('drawTime', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                    >
                      <option value="all">All Times</option>
                      <option value="twoPM">2:00 PM</option>
                      <option value="fivePM">5:00 PM</option>
                      <option value="ninePM">9:00 PM</option>
                    </select>
                  </div>
                </div>
              </div>
            </ModernCard>

            {/* History Table */}
            <ModernCard variant="elevated">
              <div className="p-4 sm:p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <ClockIcon className="h-6 w-6 text-primary-600" />
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                    Draw History
                  </h2>
                </div>
                
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading history...</p>
                  </div>
                ) : (
                  <>
                    <ModernTable
                      columns={[
                        { key: 'drawDate', label: 'Date & Time', sortable: true, render: (value) => formatDateTime(value) },
                        { key: 'drawTime', label: 'Draw Time', sortable: true, render: (value) => formatDrawTime(value) },
                        { 
                          key: 'winningNumber', 
                          label: 'Winning Number', 
                          render: (value) => (
                            <span className="inline-block font-bold text-success-600 bg-success-50 px-3 py-1 rounded-lg">
                              {value}
                            </span>
                          )
                        },
                        { key: '_count.tickets', label: 'Total Tickets', render: (value, row) => row._count?.tickets || 0 },
                        { key: '_count.winningTickets', label: 'Winners', render: (value, row) => row._count?.winningTickets || 0 },
                        { key: 'status', label: 'Status', render: (value) => getStatusBadge(value) }
                      ]}
                      data={historyData.draws || []}
                      emptyMessage="No draw history found for the selected filters"
                    />

                    {/* Pagination */}
                    {historyData.pagination && historyData.pagination.totalPages > 1 && (
                      <ModernCard variant="glass" className="mt-6">
                        <div className="px-6 py-4">
                          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                            <div className="text-sm text-gray-700 font-medium">
                              Page <span className="font-semibold text-primary-600">{historyData.pagination.currentPage}</span> of <span className="font-semibold text-primary-600">{historyData.pagination.totalPages}</span>
                            </div>
                            <div className="flex space-x-2">
                              <ModernButton
                                variant="secondary"
                                size="sm"
                                onClick={() => handleFilterChange('page', filters.page - 1)}
                                disabled={filters.page <= 1}
                              >
                                Previous
                              </ModernButton>
                              <ModernButton
                                variant="secondary"
                                size="sm"
                                onClick={() => handleFilterChange('page', filters.page + 1)}
                                disabled={filters.page >= historyData.pagination.totalPages}
                              >
                                Next
                              </ModernButton>
                            </div>
                          </div>
                        </div>
                      </ModernCard>
                    )}
                  </>
                )}
              </div>
            </ModernCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentResults;
