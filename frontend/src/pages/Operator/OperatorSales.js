import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  EyeIcon, 
  ArrowPathIcon, 
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  TrophyIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { getCurrentDatePH } from '../../utils/dateUtils';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';
import ModernTable from '../../components/UI/ModernTable';

const OperatorSales = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState({
    dailyStats: {
      totalGross: 0,
      totalWinnings: 0,
      totalNet: 0,
      totalTickets: 0
    },
    perDrawSales: [],
    historicalData: []
  });
  const [selectedDate, setSelectedDate] = useState(getCurrentDatePH());
  const [startDate, setStartDate] = useState(getCurrentDatePH());
  const [endDate, setEndDate] = useState(getCurrentDatePH());
  const [viewMode, setViewMode] = useState('today'); // 'today', 'historical'

  useEffect(() => {
    if (viewMode === 'today') {
      fetchTodaySales();
      // Set up auto-refresh every 60 seconds (reduced from 30s)
      const interval = setInterval(fetchTodaySales, 60000);
      return () => clearInterval(interval);
    } else {
      fetchHistoricalSales();
    }
  }, [selectedDate, viewMode, startDate, endDate]);

  const fetchTodaySales = async () => {
    try {
      setLoading(true);
      
      // Fetch daily stats
      const dailyResponse = await api.get('/sales/daily-operator-stats', {
        params: { date: selectedDate }
      });
      
      // Fetch per-draw sales
      const perDrawResponse = await api.get('/sales/per-draw-operator', {
        params: { date: selectedDate }
      });

      setSalesData({
        dailyStats: dailyResponse.data.data,
        perDrawSales: perDrawResponse.data.data,
        historicalData: []
      });
    } catch (error) {
      toast.error('Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoricalSales = async () => {
    try {
      setLoading(true);
      
      const response = await api.get('/sales/historical-operator', {
        params: { startDate, endDate }
      });

      setSalesData({
        dailyStats: response.data.data.summary,
        perDrawSales: [],
        historicalData: response.data.data.daily
      });
    } catch (error) {
      toast.error('Failed to fetch historical data');
    } finally {
      setLoading(false);
    }
  };

  const handleExportSales = async () => {
    try {
      const params = new URLSearchParams({
        reportType: 'sales',
        startDate: viewMode === 'today' ? selectedDate : startDate,
        endDate: viewMode === 'today' ? selectedDate : endDate,
        format: 'excel'
      });
      
      const response = await api.get(`/reports/export?${params}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `operator-sales-report-${selectedDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Sales report exported successfully');
    } catch (error) {
      console.error('Error exporting sales:', error);
      toast.error('Failed to export sales report');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title="Operator Sales Dashboard"
          subtitle="Monitor sales performance and export reports"
          icon={EyeIcon}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <ModernCard className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">View:</label>
                  <select
                    value={viewMode}
                    onChange={(e) => setViewMode(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="today">Live Today</option>
                    <option value="historical">Historical</option>
                  </select>
                </div>
                
                {/* Date Controls */}
                {viewMode === 'today' ? (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Date:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-gray-700">Range:</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}
              </div>
            </ModernCard>
            
            {/* Action Buttons */}
            <div className="flex gap-3">
              <ModernButton
                onClick={viewMode === 'today' ? fetchTodaySales : fetchHistoricalSales}
                disabled={loading}
                variant="primary"
                size="md"
              >
                <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </ModernButton>
              
              <ModernButton
                onClick={handleExportSales}
                variant="success"
                size="md"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export Excel
              </ModernButton>
            </div>
          </div>
        </PageHeader>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Total Tickets"
            value={salesData.dailyStats.totalTickets?.toLocaleString() || '0'}
            icon={TicketIcon}
            color="primary"
            trend={viewMode === 'today' ? 'Live Updates' : 'Historical Data'}
          />

          <StatCard
            title="Gross Sales"
            value={`₱${salesData.dailyStats.totalGross?.toLocaleString() || '0'}`}
            icon={CurrencyDollarIcon}
            color="success"
            trend="Total Revenue"
          />

          <StatCard
            title="Total Winnings"
            value={`₱${salesData.dailyStats.totalWinnings?.toLocaleString() || '0'}`}
            icon={TrophyIcon}
            color="danger"
            trend="Prize Payouts"
          />

          <StatCard
            title="Net Sales"
            value={`₱${salesData.dailyStats.totalNet?.toLocaleString() || '0'}`}
            icon={ChartBarIcon}
            color="primary"
            trend="After Winnings"
          />
        </div>

        {/* Sales Data Table */}
        <ModernCard>
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {viewMode === 'today' ? 'Per-Draw Sales (Live)' : 'Historical Daily Sales'}
                </h3>
                {viewMode === 'today' && (
                  <p className="text-sm text-green-600 mt-1">
                    🟢 Auto-refreshing every 30 seconds
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <ModernTable
            columns={viewMode === 'today' ? [
              {
                key: 'drawTime',
                label: 'Draw Time',
                render: (item) => (
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDrawTime(item.drawTime)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatDate(item.drawDate)}
                      </div>
                    </div>
                  </div>
                )
              },
              {
                key: 'totalTickets',
                label: 'Tickets',
                render: (item) => (
                  <span className="text-sm text-gray-900 font-medium">
                    {item.totalTickets?.toLocaleString() || '0'}
                  </span>
                )
              },
              {
                key: 'grossSales',
                label: 'Gross Sales',
                render: (item) => (
                  <span className="text-sm font-medium text-green-600">
                    ₱{item.grossSales?.toLocaleString() || '0'}
                  </span>
                )
              },
              {
                key: 'winnings',
                label: 'Winnings',
                render: (item) => (
                  <span className="text-sm font-medium text-red-600">
                    ₱{item.winnings?.toLocaleString() || '0'}
                  </span>
                )
              },
              {
                key: 'netSales',
                label: 'Net Sales',
                render: (item) => (
                  <span className="text-sm font-medium text-blue-600">
                    ₱{item.netSales?.toLocaleString() || '0'}
                  </span>
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (item) => (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    item.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status === 'completed' ? 'Completed' : 'Ongoing'}
                  </span>
                )
              }
            ] : [
              {
                key: 'date',
                label: 'Date',
                render: (item) => (
                  <div className="flex items-center">
                    <CalendarDaysIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900">
                      {formatDate(item.date)}
                    </span>
                  </div>
                )
              },
              {
                key: 'totalTickets',
                label: 'Tickets',
                render: (item) => (
                  <span className="text-sm text-gray-900 font-medium">
                    {item.totalTickets?.toLocaleString() || '0'}
                  </span>
                )
              },
              {
                key: 'grossSales',
                label: 'Gross Sales',
                render: (item) => (
                  <span className="text-sm font-medium text-green-600">
                    ₱{item.grossSales?.toLocaleString() || '0'}
                  </span>
                )
              },
              {
                key: 'winnings',
                label: 'Winnings',
                render: (item) => (
                  <span className="text-sm font-medium text-red-600">
                    ₱{item.winnings?.toLocaleString() || '0'}
                  </span>
                )
              },
              {
                key: 'netSales',
                label: 'Net Sales',
                render: (item) => (
                  <span className="text-sm font-medium text-blue-600">
                    ₱{item.netSales?.toLocaleString() || '0'}
                  </span>
                )
              }
            ]}
            data={viewMode === 'today' ? salesData.perDrawSales : salesData.historicalData}
            loading={loading}
            emptyMessage={`No ${viewMode === 'today' ? 'per-draw' : 'historical'} sales data available`}
          />
        </ModernCard>
      </div>
    </div>
  );
};

export default OperatorSales;
