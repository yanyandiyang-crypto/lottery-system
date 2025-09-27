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
  CalendarIcon
} from '@heroicons/react/24/outline';

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
    return <LoadingSpinner />;
  }

  return (
    <div className="p-2 sm:p-4 lg:p-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
            {user?.role === 'agent' ? 'My Sales Dashboard' : 'Sales Dashboard'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {user?.role === 'agent' 
              ? 'Track your sales performance and statistics' 
              : 'Track sales performance and statistics'
            }
          </p>
        </div>

        {/* Daily Sales Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          {/* Today's Sales */}
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Today's Sales</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  ₱{dailyStats.today.sales.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {dailyStats.today.tickets} tickets
                </p>
              </div>
            </div>
          </div>

          {/* This Week */}
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500">This Week</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  ₱{dailyStats.thisWeek.sales.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {dailyStats.thisWeek.tickets} tickets
                </p>
              </div>
            </div>
          </div>

          {/* This Month */}
          <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500">This Month</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  ₱{dailyStats.thisMonth.sales.toLocaleString()}
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  {dailyStats.thisMonth.tickets} tickets
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Date Selector */}
        <div className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-0">
              Sales by Draw
            </h2>
            <div className="flex items-center space-x-2">
              <CalendarDaysIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Sales Cards */}
        {salesData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {drawTimes.map((draw) => {
              const drawData = getDrawData(draw.time);
              return (
                <div key={draw.time} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="p-4 sm:p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                      </div>
                      <div className="ml-3 sm:ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                            {getDrawTimeLabel(draw.time)} Draw Sales
                          </dt>
                          <dd className="text-base sm:text-lg font-medium text-gray-900">
                            ₱{drawData.grossSales.toLocaleString()}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-4 sm:px-5 py-2 sm:py-3">
                    <div className="text-xs sm:text-sm text-gray-600">
                      {drawData.ticketCount} tickets • ₱{(drawData.totalWinnings || 0).toLocaleString()} winnings
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="p-3 sm:p-4 lg:p-6">
              <div className="text-center py-6 sm:py-8">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-9-5.25h5.25M7.5 15h3M3.375 5.25c-.621 0-1.125.504-1.125 1.125v3.026a2.999 2.999 0 0 1 0 5.198v3.026c0 .621.504 1.125 1.125 1.125h17.25c.621 0 1.125-.504 1.125-1.125v-3.026a2.999 2.999 0 0 1 0-5.198V6.375c0-.621-.504-1.125-1.125-1.125H3.375Z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sales data</h3>
                <p className="mt-1 text-xs sm:text-sm text-gray-500">No sales found for the selected date.</p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Table */}
        {salesData.length > 0 && (
          <div className="bg-white rounded-lg shadow">
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Draw Details Summary</h3>
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
        </div>
        )}
      </div>
    </div>
  );
};

export default SalesPerDraw;
