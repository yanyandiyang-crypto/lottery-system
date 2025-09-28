import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { salesAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import { 
  CurrencyDollarIcon, 
  ChartBarIcon,
  CalendarDaysIcon,
  TrophyIcon,
  ArrowTrendingUpIcon,
  ComputerDesktopIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';
import ModernTable from '../../components/UI/ModernTable';

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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title="Operator Dashboard"
          subtitle="Live sales monitoring and daily reports"
          icon={ComputerDesktopIcon}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="text-sm text-gray-500 bg-white px-3 py-2 rounded-lg border">
              <span className="font-medium">Last updated:</span> {new Date().toLocaleTimeString()}
            </div>
          </div>
        </PageHeader>

        {/* Live Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Today's Gross Sales"
            value={formatCurrency(salesData.todayGross)}
            icon={CurrencyDollarIcon}
            color="primary"
            trend={`Live: ${formatCurrency(liveData.currentDrawSales)}`}
          />

          <StatCard
            title="Total Winnings"
            value={formatCurrency(salesData.todayWinnings)}
            icon={TrophyIcon}
            color="danger"
            trend={`Impact: -${((salesData.todayWinnings / salesData.todayGross) * 100 || 0).toFixed(1)}%`}
          />

          <StatCard
            title="Net Sales"
            value={formatCurrency(salesData.todayNet)}
            icon={ArrowTrendingUpIcon}
            color="success"
            trend={`Margin: ${((salesData.todayNet / salesData.todayGross) * 100 || 0).toFixed(1)}%`}
          />

          <StatCard
            title="Active Tickets"
            value={liveData.pendingTickets.toLocaleString()}
            icon={ChartBarIcon}
            color="primary"
            trend={`Live bets: ${liveData.activeBets}`}
          />
        </div>

        {/* Per Draw Sales */}
        <ModernCard className="mb-8">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Sales by Draw</h2>
            <p className="text-sm text-gray-600 mt-1">Detailed breakdown of sales per draw time</p>
          </div>
          
          <ModernTable
            columns={[
              {
                key: 'drawTime',
                label: 'Draw Time',
                render: (draw) => (
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
                )
              },
              {
                key: 'status',
                label: 'Status',
                render: (draw) => (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDrawStatusColor(draw.status)}`}>
                    {draw.status.toUpperCase()}
                  </span>
                )
              },
              {
                key: 'grossSales',
                label: 'Gross Sales',
                render: (draw) => (
                  <span className="text-sm font-medium text-gray-900">
                    {formatCurrency(draw.grossSales || 0)}
                  </span>
                )
              },
              {
                key: 'totalWinnings',
                label: 'Winnings',
                render: (draw) => (
                  <span className="text-sm text-red-600">
                    {formatCurrency(draw.totalWinnings || 0)}
                  </span>
                )
              },
              {
                key: 'netSales',
                label: 'Net Sales',
                render: (draw) => (
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency((draw.grossSales || 0) - (draw.totalWinnings || 0))}
                  </span>
                )
              },
              {
                key: 'ticketCount',
                label: 'Tickets',
                render: (draw) => (
                  <span className="text-sm text-gray-500">
                    {(draw.ticketCount || 0).toLocaleString()}
                  </span>
                )
              },
              {
                key: 'winnersCount',
                label: 'Winners',
                render: (draw) => (
                  <span className="text-sm text-gray-500">
                    {draw.winnersCount || 0}
                  </span>
                )
              }
            ]}
            data={salesData.perDrawSales}
            emptyMessage="No draw sales data available for selected date"
          />
        </ModernCard>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModernCard>
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Today's Summary</h3>
              <p className="text-sm text-gray-600 mt-1">Key performance metrics</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Tickets Sold:</span>
                  <span className="font-semibold text-lg text-gray-900">
                    {salesData.perDrawSales.reduce((sum, draw) => sum + (draw.ticketCount || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Winners:</span>
                  <span className="font-semibold text-lg text-gray-900">
                    {salesData.perDrawSales.reduce((sum, draw) => sum + (draw.winnersCount || 0), 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Win Rate:</span>
                  <span className="font-semibold text-lg text-blue-600">
                    {(
                      (salesData.perDrawSales.reduce((sum, draw) => sum + (draw.winnersCount || 0), 0) /
                      Math.max(salesData.perDrawSales.reduce((sum, draw) => sum + (draw.ticketCount || 0), 0), 1)) * 100
                    ).toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-gray-700 font-medium">Profit Margin:</span>
                  <span className="font-bold text-xl text-green-600">
                    {((salesData.todayNet / Math.max(salesData.todayGross, 1)) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </ModernCard>

          <ModernCard>
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">Performance Indicators</h3>
              <p className="text-sm text-gray-600 mt-1">System health and targets</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Sales Target Progress</span>
                    <span className="font-semibold text-blue-600">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: '75%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">Risk Exposure</span>
                    <span className="font-semibold text-orange-600">Medium</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-orange-400 to-orange-500 h-3 rounded-full transition-all duration-300" style={{ width: '45%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 font-medium">System Health</span>
                    <span className="font-semibold text-green-600">Excellent</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-green-400 to-green-500 h-3 rounded-full transition-all duration-300" style={{ width: '95%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
