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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Sales Dashboard"
          subtitle="Track your sales performance, statistics, and draw-by-draw analytics"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Agent', href: '/agent' },
            { label: 'Sales Dashboard' }
          ]}
        />

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <StatCard
            title="Today's Sales"
            value={formatCurrency(salesData.today.totalSales)}
            subtitle={`${salesData.today.totalTickets} tickets`}
            icon={CurrencyDollarIcon}
            color="success"
            className="animate-bounce-in"
            style={{ animationDelay: '0ms' }}
          />
          <StatCard
            title="This Week"
            value={formatCurrency(salesData.thisWeek.totalSales)}
            subtitle={`${salesData.thisWeek.totalTickets} tickets`}
            icon={ChartBarIcon}
            color="primary"
            className="animate-bounce-in"
            style={{ animationDelay: '100ms' }}
          />
          <StatCard
            title="This Month"
            value={formatCurrency(salesData.thisMonth.totalSales)}
            subtitle={`${salesData.thisMonth.totalTickets} tickets`}
            icon={CalendarIcon}
            color="accent"
            className="animate-bounce-in sm:col-span-2 lg:col-span-1"
            style={{ animationDelay: '200ms' }}
          />
        </div>

        {/* Per-Draw Sales */}
        <ModernCard variant="elevated" className="animate-fade-in">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-6 w-6 text-primary-600 flex-shrink-0" />
                <h2 className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Sales by Draw
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white/50 backdrop-blur-sm transition-all duration-200"
                />
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
                <p className="text-gray-600 font-medium">Loading draw sales...</p>
              </div>
            ) : perDrawSales.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {perDrawSales.map((draw, index) => (
                  <ModernCard 
                    key={draw.drawTime} 
                    variant="glass" 
                    className="hover:shadow-glow transition-all duration-300 animate-slide-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold text-gray-900">{formatDrawTime(draw.drawTime)}</h3>
                        <div className="p-2 rounded-full bg-gradient-to-br from-primary-50 to-accent-50">
                          <TicketIcon className="h-5 w-5 text-primary-600" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-2xl font-bold text-success-600">{formatCurrency(draw.totalSales)}</p>
                        <p className="text-sm text-gray-600 font-medium">{draw.totalTickets} tickets sold</p>
                        <p className="text-xs text-gray-500">
                          Avg per ticket: {formatCurrency(draw.totalTickets > 0 ? draw.totalSales / draw.totalTickets : 0)}
                        </p>
                      </div>
                    </div>
                  </ModernCard>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <TicketIcon className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No sales data</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  No sales found for the selected date. Try selecting a different date or check back later.
                </p>
              </div>
            )}
          </div>
        </ModernCard>
      </div>
    </div>
  );
};

export default AgentSales;
