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
import ModernCard from '../../components/UI/ModernCard';
import StatCard from '../../components/UI/StatCard';
import PageHeader from '../../components/UI/PageHeader';

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
    <div className="min-h-screen bg-blue-50">
      <div className="w-full px-2 py-2">
        <div className="mb-2">
          <h1 className="text-lg font-bold text-blue-900 text-center">Sales</h1>
          <p className="text-xs text-blue-600 text-center">Track sales performance</p>
        </div>

        {/* Ultra-Compact Summary Cards */}
        <div className="grid grid-cols-3 gap-1 mb-2">
          <div className="bg-white rounded p-2 border border-blue-200">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">{formatCurrency(salesData.today.totalSales)}</div>
              <div className="text-xs text-blue-600">Today</div>
              <div className="text-xs text-blue-500">{salesData.today.totalTickets} tickets</div>
            </div>
          </div>
          
          <div className="bg-white rounded p-2 border border-blue-200">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">{formatCurrency(salesData.thisWeek.totalSales)}</div>
              <div className="text-xs text-blue-600">Week</div>
              <div className="text-xs text-blue-500">{salesData.thisWeek.totalTickets} tickets</div>
            </div>
          </div>
          
          <div className="bg-white rounded p-2 border border-blue-200">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">{formatCurrency(salesData.thisMonth.totalSales)}</div>
              <div className="text-xs text-blue-600">Month</div>
              <div className="text-xs text-blue-500">{salesData.thisMonth.totalTickets} tickets</div>
            </div>
          </div>
        </div>

        {/* Simplified Per-Draw Sales */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Sales by Draw</h2>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : perDrawSales.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {perDrawSales.map((draw) => (
                <div key={draw.drawTime} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">{formatDrawTime(draw.drawTime)}</h3>
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xs">🎫</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-bold text-green-600">{formatCurrency(draw.totalSales)}</p>
                    <p className="text-sm text-gray-600">{draw.totalTickets} tickets sold</p>
                    <p className="text-xs text-gray-500">
                      Avg: {formatCurrency(draw.totalTickets > 0 ? draw.totalSales / draw.totalTickets : 0)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">🎫</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No sales data</h3>
              <p className="text-gray-500 text-sm">
                No sales found for the selected date. Try selecting a different date.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentSales;
