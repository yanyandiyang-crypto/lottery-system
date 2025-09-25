import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api, { salesAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon,
  CalendarDaysIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const OperatorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState({
    todayGross: 0,
    todayNet: 0,
    todayWinnings: 0,
    perDrawSales: []
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [liveData, setLiveData] = useState({
    activeBets: 0,
    pendingTickets: 0,
    currentDrawSales: 0
  });

  useEffect(() => {
    fetchSalesData();
    fetchLiveData();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      fetchLiveData();
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedDate]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      
      // Fetch daily sales for selected date
      const salesResponse = await salesAPI.getDailySales({
        date: selectedDate
      });

      // Fetch per-draw sales
      const drawSalesResponse = await salesAPI.getPerDrawSales({
        date: selectedDate
      });

      setSalesData({
        todayGross: salesResponse.data.grossSales || 0,
        todayNet: salesResponse.data.netSales || 0,
        todayWinnings: salesResponse.data.totalWinnings || 0,
        perDrawSales: drawSalesResponse.data.draws || []
      });

    } catch (error) {
      toast.error('Failed to fetch sales data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveData = async () => {
    try {
      // Fetch live statistics
      const liveResponse = await salesAPI.getLiveStats();
      setLiveData(liveResponse.data);
    } catch (error) {
      console.error('Failed to fetch live data:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  // Using utility function for draw time formatting

  const getDrawStatusColor = (status) => {
    const colors = {
      'open': 'bg-green-100 text-green-800',
      'closed': 'bg-yellow-100 text-yellow-800',
      'settled': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Operator Dashboard</h1>
            <p className="text-gray-600">Live sales monitoring and daily reports</p>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            />
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {/* Live Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Today's Gross Sales
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(salesData.todayGross)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-600">Live: </span>
              <span className="font-medium text-green-600">
                {formatCurrency(liveData.currentDrawSales)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Winnings
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(salesData.todayWinnings)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-600">Impact: </span>
              <span className="font-medium text-red-600">
                -{((salesData.todayWinnings / salesData.todayGross) * 100 || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Net Sales
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatCurrency(salesData.todayNet)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-600">Margin: </span>
              <span className="font-medium text-green-600">
                {((salesData.todayNet / salesData.todayGross) * 100 || 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Tickets
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {liveData.pendingTickets.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-600">Live bets: </span>
              <span className="font-medium text-blue-600">
                {liveData.activeBets}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Per Draw Sales */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Sales by Draw</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Draw Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gross Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Winnings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tickets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Winners
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {salesData.perDrawSales.map((draw) => (
                <tr key={draw.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {formatDrawTime(draw.drawTime)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(draw.drawDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDrawStatusColor(draw.status)}`}>
                      {draw.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatCurrency(draw.grossSales || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                    {formatCurrency(draw.totalWinnings || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency((draw.grossSales || 0) - (draw.totalWinnings || 0))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(draw.ticketCount || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {draw.winnersCount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Today's Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tickets Sold:</span>
              <span className="font-medium">
                {salesData.perDrawSales.reduce((sum, draw) => sum + (draw.ticketCount || 0), 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Winners:</span>
              <span className="font-medium">
                {salesData.perDrawSales.reduce((sum, draw) => sum + (draw.winnersCount || 0), 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Win Rate:</span>
              <span className="font-medium">
                {(
                  (salesData.perDrawSales.reduce((sum, draw) => sum + (draw.winnersCount || 0), 0) /
                  Math.max(salesData.perDrawSales.reduce((sum, draw) => sum + (draw.ticketCount || 0), 0), 1)) * 100
                ).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-600 font-medium">Profit Margin:</span>
              <span className="font-bold text-green-600">
                {((salesData.todayNet / Math.max(salesData.todayGross, 1)) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Indicators</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Sales Target Progress</span>
                <span className="font-medium">75%</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Risk Exposure</span>
                <span className="font-medium text-orange-600">Medium</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">System Health</span>
                <span className="font-medium text-green-600">Excellent</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
