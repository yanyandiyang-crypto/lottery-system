import React, { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  ArrowPathIcon, 
  ArrowDownTrayIcon,
  CalendarDaysIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDrawTime } from '../../utils/drawTimeFormatter';

const OperatorSales = () => {
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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState('today'); // 'today', 'historical'

  useEffect(() => {
    if (viewMode === 'today') {
      fetchTodaySales();
      // Set up auto-refresh every 30 seconds for live data
      const interval = setInterval(fetchTodaySales, 30000);
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
      console.error('Error fetching today sales:', error);
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
      console.error('Error fetching historical sales:', error);
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
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center mb-4 sm:mb-0">
            <EyeIcon className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Operator Sales Dashboard</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            {/* View Mode Toggle */}
            <select
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="today">Live Today</option>
              <option value="historical">Historical</option>
            </select>
            
            {/* Date Controls */}
            {viewMode === 'today' ? (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <div className="flex gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            {/* Action Buttons */}
            <button
              onClick={viewMode === 'today' ? fetchTodaySales : fetchHistoricalSales}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            
            <button
              onClick={handleExportSales}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export Excel
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Tickets</dt>
                  <dd className="text-lg font-medium text-blue-600">
                    {salesData.dailyStats.totalTickets?.toLocaleString() || '0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Gross Sales</dt>
                  <dd className="text-lg font-medium text-green-600">
                    ₱{salesData.dailyStats.totalGross?.toLocaleString() || '0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Winnings</dt>
                  <dd className="text-lg font-medium text-red-600">
                    ₱{salesData.dailyStats.totalWinnings?.toLocaleString() || '0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Net Sales</dt>
                  <dd className="text-lg font-medium text-blue-600">
                    ₱{salesData.dailyStats.totalNet?.toLocaleString() || '0'}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Data Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {viewMode === 'today' ? 'Per-Draw Sales (Live)' : 'Historical Daily Sales'}
            </h3>
            {viewMode === 'today' && (
              <p className="mt-1 max-w-2xl text-sm text-green-600">
                🟢 Auto-refreshing every 30 seconds
              </p>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {viewMode === 'today' ? (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Draw Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Draw Date</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tickets</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Sales</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Winnings</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Sales</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tickets</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Gross Sales</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Winnings</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Net Sales</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={viewMode === 'today' ? 7 : 5} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <ArrowPathIcon className="h-6 w-6 animate-spin text-blue-600" />
                      <span className="ml-2 text-gray-500">Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                (viewMode === 'today' ? salesData.perDrawSales : salesData.historicalData).map((item, index) => (
                  <tr key={viewMode === 'today' ? item.drawId : item.date} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {viewMode === 'today' ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDrawTime(item.drawTime)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.drawDate)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{item.totalTickets}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">₱{item.grossSales?.toLocaleString() || '0'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 text-right">₱{item.winnings?.toLocaleString() || '0'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 text-right">₱{item.netSales?.toLocaleString() || '0'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {item.status === 'completed' ? 'Completed' : 'Ongoing'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(item.date)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">{item.totalTickets}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 text-right">₱{item.grossSales?.toLocaleString() || '0'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 text-right">₱{item.winnings?.toLocaleString() || '0'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 text-right">₱{item.netSales?.toLocaleString() || '0'}</td>
                      </>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OperatorSales;
