import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import WinnerNotifications from '../../components/Notifications/WinnerNotifications';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import {
  ClockIcon,
  CheckCircleIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [showWinnerNotifications, setShowWinnerNotifications] = useState(false);

  // Check if user is an agent (only agents get the betting interface)
  const isAgent = user?.role === 'agent';

  // Fetch active draws
  const { data: activeDraws, isLoading: drawsLoading, error: drawsError } = useQuery({
    queryKey: ['activeDraws'],
    queryFn: async () => {
      const response = await api.get('/draws/current/active');
      return response.data.data || [];
    },
    refetchInterval: 60000, // Reduced from 30s to 60s
    staleTime: 30000, // Consider data fresh for 30s
  });

  // Create all three draws with proper status
  const createDrawCard = (drawTime, hour, label) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const drawDateTime = new Date(today);
    drawDateTime.setHours(hour, 0, 0, 0);
    
    // Find existing draw from API data
    const existingDraw = Array.isArray(activeDraws) ? 
      activeDraws.find(draw => draw.drawTime === drawTime) : null;
    
    let status, color, description, icon;
    
    // Calculate cutoff time (5 minutes before draw)
    const cutoffTime = new Date(drawDateTime.getTime() - 5 * 60 * 1000);
    
    if (existingDraw) {
      if (existingDraw.isAvailable && now < cutoffTime) {
        status = 'betting';
        color = 'green';
        description = 'Betting Open';
      } else if (existingDraw.isAvailable && now >= cutoffTime && now < drawDateTime) {
        status = 'cutoff';
        color = 'orange';
        description = 'Closing Soon';
      } else if (now >= drawDateTime) {
        if (existingDraw.result) {
          status = 'completed';
          color = 'blue';
          description = 'Draw Completed';
        } else {
          status = 'closed';
          color = 'red';
          description = 'Betting Closed';
        }
      } else {
        status = 'upcoming';
        color = 'gray';
        description = 'Upcoming Draw';
      }
    } else {
      if (now < drawDateTime - 30 * 60 * 1000) {
        status = 'upcoming';
        color = 'gray';
        description = 'Upcoming Draw';
      } else if (now >= drawDateTime) {
        status = 'unavailable';
        color = 'gray';
        description = 'Draw Unavailable';
      } else {
        status = 'pending';
        color = 'yellow';
        description = 'Draw Pending';
      }
    }
    
    icon = status === 'betting' ? PlayIcon : 
           status === 'upcoming' ? ClockIcon : CheckCircleIcon;
    
    return {
      id: existingDraw?.id || `temp-${drawTime}`,
      time: formatDrawTime(drawTime),
      label: label,
      status: status,
      prize: '₱4,500',
      description: description,
      color: color,
      icon: icon,
      drawTime: drawTime
    };
  };

  const drawTimes = [
    createDrawCard('twoPM', 14, '2P'),
    createDrawCard('fivePM', 17, '5P'),
    createDrawCard('ninePM', 21, '9P')
  ];

  // Simple loading state
  if (drawsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading draws...</span>
      </div>
    );
  }

  // Simple error state
  if (drawsError) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-red-600 text-lg font-medium">Error loading draws</div>
          <div className="text-gray-500 text-sm mt-2">{drawsError.message}</div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Simplified Agent Dashboard for Low-End POS Devices
  return (
    <div className="min-h-screen bg-blue-50">
      <div className="max-w-md mx-auto px-4 py-4">
        {/* Simple Header */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-blue-900 text-center">
            3D LOTTO
          </h1>
          <p className="text-sm text-blue-700 text-center mt-1">
            Select a draw to place bets
          </p>
        </div>

        {/* Simple Draw Cards */}
        <div className="space-y-3">
          {drawTimes.map((draw) => (
            <div
              key={draw.id}
              className={`rounded-lg border-2 p-3 ${
                (draw.status === 'betting' || draw.status === 'cutoff')
                  ? 'cursor-pointer border-blue-500 bg-blue-50 hover:bg-blue-100' 
                  : 'border-blue-200 bg-white'
              }`}
              onClick={() => {
                if (draw.status === 'betting' || draw.status === 'cutoff') {
                  window.location.href = `/betting?draw=${draw.id}&time=${encodeURIComponent(draw.time)}`;
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold ${
                    draw.status === 'betting' ? 'bg-blue-600' :
                    draw.status === 'cutoff' ? 'bg-blue-500' :
                    draw.status === 'completed' ? 'bg-blue-400' :
                    'bg-blue-300'
                  }`}>
                    {draw.label}
                  </div>
                  <div>
                    <div className="font-semibold text-blue-900">{draw.time}</div>
                    <div className="text-xs text-blue-600">{draw.description}</div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-blue-900">{draw.prize}</div>
                  <div className={`text-xs px-2 py-1 rounded ${
                    draw.status === 'betting' ? 'bg-blue-200 text-blue-800' :
                    draw.status === 'cutoff' ? 'bg-blue-300 text-blue-900' :
                    'bg-blue-100 text-blue-600'
                  }`}>
                    {draw.status === 'betting' ? 'OPEN' :
                     draw.status === 'cutoff' ? 'CLOSING' :
                     draw.status === 'completed' ? 'DONE' :
                     draw.status === 'closed' ? 'CLOSED' :
                     draw.status === 'upcoming' ? 'SOON' : 'WAIT'}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Simple Stats */}
        <div className="mt-4 bg-white rounded-lg p-3 border border-blue-200">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-blue-600">
                {drawTimes.filter(d => d.status === 'betting').length}
              </div>
              <div className="text-xs text-blue-600">Open</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">₱4.5K</div>
              <div className="text-xs text-blue-600">Prize</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">3</div>
              <div className="text-xs text-blue-600">Draws</div>
            </div>
          </div>
        </div>

        {/* Winner Notifications Modal */}
        <WinnerNotifications 
          isOpen={showWinnerNotifications}
          onClose={() => setShowWinnerNotifications(false)}
        />
      </div>
    </div>
  );
};

export default Dashboard;

