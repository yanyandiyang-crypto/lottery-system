import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { getCurrentDatePH } from '../../utils/dateUtils';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDrawTime, getDrawTimeLabel } from '../../utils/drawTimeFormatter';
import { 
  ClockIcon, 
  CalendarDaysIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  CalendarIcon,
  DocumentChartBarIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';
import ModernTable from '../../components/UI/ModernTable';

const SalesPerDraw = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(getCurrentDatePH());
  const [dailyStats, setDailyStats] = useState({
    today: { sales: 0, tickets: 0 },
    thisWeek: { sales: 0, tickets: 0 },
    thisMonth: { sales: 0, tickets: 0 }
  });

  useEffect(() => {
    fetchSalesData();
    fetchDailyStats();
  }, [selectedDate]);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      // If user is an agent, include agentId in the request
      const params = { date: selectedDate };
      if (user?.role === 'agent') {
        params.agentId = user.id;
      }
      const response = await api.get('/sales/per-draw', { params });
      setSalesData(response.data?.data?.draws || []);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      toast.error('Failed to fetch sales data');
      setSalesData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyStats = async () => {
    try {
      // Anchor ranges to the selectedDate instead of the current date
      const base = new Date(selectedDate);
      const selectedISO = base.toISOString().split('T')[0];

      // Week range (Mon-Sun) anchored to selectedDate
      const weekStart = new Date(base);
      const day = weekStart.getDay();
      const diffToMonday = (day + 6) % 7;
      weekStart.setDate(weekStart.getDate() - diffToMonday);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Month range anchored to selectedDate
      const monthStart = new Date(base.getFullYear(), base.getMonth(), 1);
      const monthEnd = new Date(base.getFullYear(), base.getMonth() + 1, 0);

      // Helper to sum a draw-time sales summary (2PM/5PM/9PM)
      const sumSummary = (summary) => {
        if (!summary) return { sales: 0, tickets: 0 };
        const times = ['2PM', '5PM', '9PM'];
        const sales = times.reduce((s, t) => s + (summary[t]?.sales || 0), 0);
        const tickets = times.reduce((s, t) => s + (summary[t]?.tickets || 0), 0);
        return { sales, tickets };
      };

      // Selected day via per-draw tickets (keeps in sync with page cards)
      const todayResp = await api.get('/sales/per-draw', { params: { date: selectedISO } });
      const todayDraws = todayResp.data?.data?.draws || [];
      const todaySales = todayDraws.reduce((sum, d) => sum + (d.grossSales || 0), 0);
      const todayTickets = todayDraws.reduce((sum, d) => sum + (d.ticketCount || 0), 0);

      // Week via reports draw-time-sales (range) then sum
      const weekResp = await api.get('/reports/draw-time-sales', {
        params: {
          startDate: weekStart.toISOString().split('T')[0],
          endDate: weekEnd.toISOString().split('T')[0]
        }
      });
      const weekSummary = weekResp.data?.data?.summary;
      const { sales: weekSales, tickets: weekTickets } = sumSummary(weekSummary);

      // Month via reports draw-time-sales (range) then sum
      const monthResp = await api.get('/reports/draw-time-sales', {
        params: {
          startDate: monthStart.toISOString().split('T')[0],
          endDate: monthEnd.toISOString().split('T')[0]
        }
      });
      const monthSummary = monthResp.data?.data?.summary;
      const { sales: monthSales, tickets: monthTickets } = sumSummary(monthSummary);

      setDailyStats({
        today: { sales: todaySales, tickets: todayTickets },
        thisWeek: { sales: weekSales, tickets: weekTickets },
        thisMonth: { sales: monthSales, tickets: monthTickets }
      });
    } catch (error) {
      console.error('Error fetching daily stats:', error);
      // Don't show error toast for stats as it's not critical
    }
  };

  const drawTimes = [
    { time: 'twoPM', label: `${formatDrawTime('twoPM')} Draw Sales` },
    { time: 'fivePM', label: `${formatDrawTime('fivePM')} Draw Sales` },
    { time: 'ninePM', label: `${formatDrawTime('ninePM')} Draw Sales` }
  ];

  const getDrawData = (drawTime) => {
    const data = salesData.find(draw => draw.drawTime === drawTime) || {
      grossSales: 0,
      ticketCount: 0,
      totalWinnings: 0
    };
    
    // Ensure all values are numbers to prevent NaN
    return {
      grossSales: Number(data.grossSales) || 0,
      ticketCount: Number(data.ticketCount) || 0,
      totalWinnings: Number(data.totalWinnings) || 0
    };
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
          <h1 className="text-lg font-bold text-blue-900 text-center">
            {user?.role === 'agent' ? 'My Sales' : 'Sales'}
          </h1>
          <p className="text-xs text-blue-600 text-center">Sales performance</p>
        </div>

        {/* Ultra-Compact Daily Sales Summary */}
        <div className="grid grid-cols-3 gap-1 mb-2">
          <div className="bg-white rounded p-2 border border-blue-200">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">₱{dailyStats.today.sales.toLocaleString()}</div>
              <div className="text-xs text-blue-600">Today</div>
              <div className="text-xs text-blue-500">{dailyStats.today.tickets} tickets</div>
            </div>
          </div>
          
          <div className="bg-white rounded p-2 border border-blue-200">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">₱{dailyStats.thisWeek.sales.toLocaleString()}</div>
              <div className="text-xs text-blue-600">Week</div>
              <div className="text-xs text-blue-500">{dailyStats.thisWeek.tickets} tickets</div>
            </div>
          </div>
          
          <div className="bg-white rounded p-2 border border-blue-200">
            <div className="text-center">
              <div className="text-sm font-bold text-blue-600">₱{dailyStats.thisMonth.sales.toLocaleString()}</div>
              <div className="text-xs text-blue-600">Month</div>
              <div className="text-xs text-blue-500">{dailyStats.thisMonth.tickets} tickets</div>
            </div>
          </div>
        </div>

        {/* Ultra-Compact Date Selector */}
        <div className="bg-white rounded p-2 mb-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Sales by Draw</h2>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Sales Cards */}
        {salesData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {drawTimes.map((draw) => {
              const drawData = getDrawData(draw.time);
              return (
                <ModernCard key={draw.time} className="hover:shadow-lg transition-shadow duration-200">
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center">
                      <ClockIcon className="h-6 w-6 mr-3 text-blue-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getDrawTimeLabel(draw.time)} Draw
                        </h3>
                        <p className="text-sm text-gray-600">Sales Performance</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold text-green-600">
                        ₱{drawData.grossSales.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">Total Sales</div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-lg font-semibold text-blue-600">
                          {drawData.ticketCount}
                        </div>
                        <div className="text-xs text-gray-600">Tickets</div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-lg font-semibold text-red-600">
                          ₱{(drawData.totalWinnings || 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600">Winnings</div>
                      </div>
                    </div>
                  </div>
                </ModernCard>
              );
            })}
          </div>
        ) : (
          <ModernCard className="mb-8">
            <div className="p-12 text-center">
              <TicketIcon className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Sales Data</h3>
              <p className="text-gray-500">No sales found for the selected date.</p>
            </div>
          </ModernCard>
        )}

        {/* Summary Table */}
        {salesData.length > 0 && (
          <ModernCard>
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <ChartBarIcon className="h-6 w-6 mr-3 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Draw Details Summary</h3>
                  <p className="text-sm text-gray-600 mt-1">Comprehensive breakdown by draw time</p>
                </div>
              </div>
            </div>
          
          {/* Mobile Card Layout */}
          <div className="block sm:hidden">
            <div className="divide-y divide-gray-200">
              {drawTimes.map((draw) => {
                const drawData = getDrawData(draw.time);
                const netRevenue = drawData.grossSales - drawData.totalWinnings;
                return (
                  <div key={draw.time} className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-900">{getDrawTimeLabel(draw.time)} Draw Sales</h4>
                      <span className={`text-sm font-medium ${netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₱{netRevenue.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-gray-500">Sales</div>
                        <div className="font-medium">₱{drawData.grossSales.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Tickets</div>
                        <div className="font-medium">{drawData.ticketCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Winnings</div>
                        <div className="font-medium">₱{(drawData.totalWinnings || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Net Revenue</div>
                        <div className={`font-medium ${netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₱{netRevenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Draw Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Sales
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Tickets
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Winnings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net Revenue
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {drawTimes.map((draw) => {
                  const drawData = getDrawData(draw.time);
                  const netRevenue = drawData.grossSales - drawData.totalWinnings;
                  return (
                    <tr key={draw.time}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getDrawTimeLabel(draw.time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₱{drawData.grossSales.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {drawData.ticketCount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₱{(drawData.totalWinnings || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={netRevenue >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₱{netRevenue.toLocaleString()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    Total
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₱{salesData.reduce((sum, draw) => sum + draw.grossSales, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {salesData.reduce((sum, draw) => sum + draw.ticketCount, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₱{salesData.reduce((sum, draw) => sum + (draw.totalWinnings || 0), 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <span className="text-green-600">
                      ₱{salesData.reduce((sum, draw) => sum + (draw.grossSales - (draw.totalWinnings || 0)), 0).toLocaleString()}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </ModernCard>
        )}
      </div>
    </div>
  );
};

export default SalesPerDraw;
