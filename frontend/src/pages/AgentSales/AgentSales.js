import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { getCurrentDatePH } from '../../utils/dateUtils';
import {
  ChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  TicketIcon
} from '@heroicons/react/24/outline';

const AgentSales = () => {
  const { user } = useAuth();
  const [salesData, setSalesData] = useState({
    today: { totalSales: 0, totalTickets: 0 },
    thisWeek: { totalSales: 0, totalTickets: 0 },
    thisMonth: { totalSales: 0, totalTickets: 0 }
  });
  const [perDrawSales, setPerDrawSales] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getCurrentDatePH());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSalesData();
    fetchPerDrawSales();
  }, [selectedDate]);

  const fetchSalesData = async () => {
    try {
      const response = await api.get(`/sales/agent-summary/${user.id}`);
      if (response.data.success) {
        setSalesData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast.error('Failed to fetch sales data');
    }
  };

  const fetchPerDrawSales = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sales/per-draw?agentId=${user.id}&date=${selectedDate}`);
      if (response.data.success) {
        setPerDrawSales(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching per-draw sales:', error);
      toast.error('Failed to fetch per-draw sales');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDrawTime = (drawTime) => {
    const timeMap = {
      '2PM': '2:00 PM',
      '5PM': '5:00 PM', 
      '9PM': '9:00 PM'
    };
    return timeMap[drawTime] || drawTime;
  };

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Sales Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Track your sales performance and statistics</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CurrencyDollarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">Today's Sales</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{formatCurrency(salesData.today.totalSales)}</p>
              <p className="text-xs sm:text-sm text-gray-500">{salesData.today.totalTickets} tickets</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">This Week</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{formatCurrency(salesData.thisWeek.totalSales)}</p>
              <p className="text-xs sm:text-sm text-gray-500">{salesData.thisWeek.totalTickets} tickets</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-medium text-gray-500">This Month</p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{formatCurrency(salesData.thisMonth.totalSales)}</p>
              <p className="text-xs sm:text-sm text-gray-500">{salesData.thisMonth.totalTickets} tickets</p>
            </div>
          </div>
        </div>
      </div>

      {/* Per-Draw Sales */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-0">Sales by Draw</h2>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm"
              />
            </div>
          </div>
        </div>

        <div className="p-3 sm:p-4 lg:p-6">
          {loading ? (
            <div className="flex justify-center py-6 sm:py-8">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : perDrawSales.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {perDrawSales.map((draw) => (
                <div key={draw.drawTime} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">{formatDrawTime(draw.drawTime)}</h3>
                    <TicketIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 truncate">{formatCurrency(draw.totalSales)}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{draw.totalTickets} tickets sold</p>
                    <p className="text-xs text-gray-400">
                      Avg: {formatCurrency(draw.totalTickets > 0 ? draw.totalSales / draw.totalTickets : 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8">
              <TicketIcon className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sales data</h3>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">No sales found for the selected date.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentSales;
