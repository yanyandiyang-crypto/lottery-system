import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDrawTime } from '../../utils/drawTimeFormatter';
import {
  PlusIcon,
  PlayIcon,
  StopIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';

const Draws = () => {
  const { user } = useAuth();
  const [draws, setDraws] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDraw, setNewDraw] = useState({
    name: '',
    drawTime: '',
    drawDate: '',
    prizeAmount: ''
  });

  useEffect(() => {
    fetchDraws();
  }, []);

  const fetchDraws = async () => {
    try {
      setLoading(true);
      const response = await api.get('/draws');
      console.log('Draws API response:', response.data);
      // Handle both possible response structures
      const drawsData = response.data.data || response.data;
      setDraws(Array.isArray(drawsData) ? drawsData : []);
    } catch (err) {
      setError('Failed to fetch draws');
      console.error('Error fetching draws:', err);
      setDraws([]); // Ensure draws is always an array
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDraw = async (e) => {
    e.preventDefault();
    try {
      await api.post('/draws', newDraw);
      setShowCreateModal(false);
      setNewDraw({ name: '', drawTime: '', drawDate: '', prizeAmount: '' });
      fetchDraws(); // Refresh the list
    } catch (err) {
      setError('Failed to create draw');
      console.error('Error creating draw:', err);
    }
  };

  const handleStartDraw = async (drawId) => {
    try {
      await api.post(`/draws/${drawId}/start`);
      fetchDraws(); // Refresh the list
    } catch (err) {
      setError('Failed to start draw');
      console.error('Error starting draw:', err);
    }
  };

  const handleEndDraw = async (drawId) => {
    try {
      await api.post(`/draws/${drawId}/end`);
      fetchDraws(); // Refresh the list
    } catch (err) {
      setError('Failed to end draw');
      console.error('Error ending draw:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Using utility function for draw time formatting

  const canManageDraws = ['superadmin', 'admin', 'area_coordinator'].includes(user.role);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title="Draws Management"
          subtitle="Manage lottery draws and results"
          icon={CalendarDaysIcon}
        >
          {canManageDraws && (
            <ModernButton
              onClick={() => setShowCreateModal(true)}
              variant="primary"
              size="md"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Create Draw
            </ModernButton>
          )}
        </PageHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:gap-6">
          {draws.length === 0 ? (
            <ModernCard className="text-center py-12">
              <CalendarDaysIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Draws Found</h3>
              <p className="text-gray-600 mb-4">Get started by creating your first draw</p>
              {canManageDraws && (
                <ModernButton
                  onClick={() => setShowCreateModal(true)}
                  variant="primary"
                  size="md"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create First Draw
                </ModernButton>
              )}
            </ModernCard>
          ) : (
            draws.map((draw) => (
              <ModernCard key={draw.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="text-xl font-semibold text-gray-900">{draw.name}</h3>
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(draw.status)}`}>
                          {draw.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <CalendarDaysIcon className="h-4 w-4 mr-2" />
                          {draw.drawDate ? new Date(draw.drawDate).toLocaleDateString() : 'No Date'}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <ClockIcon className="h-4 w-4 mr-2" />
                          {formatDrawTime(draw.drawTime)}
                        </div>
                        <div className="flex items-center text-gray-600">
                          <CurrencyDollarIcon className="h-4 w-4 mr-2" />
                          ₱{draw.prizeAmount?.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    {canManageDraws && (
                      <div className="flex flex-col sm:flex-row gap-2">
                        {draw.status === 'scheduled' && (
                          <ModernButton
                            onClick={() => handleStartDraw(draw.id)}
                            variant="success"
                            size="sm"
                          >
                            <PlayIcon className="h-4 w-4 mr-1" />
                            Start
                          </ModernButton>
                        )}
                        {draw.status === 'active' && (
                          <ModernButton
                            onClick={() => handleEndDraw(draw.id)}
                            variant="danger"
                            size="sm"
                          >
                            <StopIcon className="h-4 w-4 mr-1" />
                            End
                          </ModernButton>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {draw.winningNumbers && (
                    <div className="mt-6 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Winning Numbers:</h4>
                      <div className="flex flex-wrap gap-2">
                        {draw.winningNumbers.map((number, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-4 py-2 rounded-full text-lg font-bold bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border border-yellow-300"
                          >
                            {number}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ModernCard>
            ))
          )}
        </div>

        {/* Modern Create Draw Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <ModernCard className="w-full max-w-md">
              <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">Create New Draw</h3>
                <p className="text-sm text-gray-600 mt-1">Set up a new lottery draw</p>
              </div>
              <div className="p-6">
                <form onSubmit={handleCreateDraw} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Draw Name
                    </label>
                    <input
                      type="text"
                      value={newDraw.name}
                      onChange={(e) => setNewDraw({ ...newDraw, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter draw name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Draw Date
                    </label>
                    <input
                      type="date"
                      value={newDraw.drawDate}
                      onChange={(e) => setNewDraw({ ...newDraw, drawDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Draw Time
                    </label>
                    <input
                      type="time"
                      value={newDraw.drawTime}
                      onChange={(e) => setNewDraw({ ...newDraw, drawTime: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prize Amount
                    </label>
                    <input
                      type="number"
                      value={newDraw.prizeAmount}
                      onChange={(e) => setNewDraw({ ...newDraw, prizeAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter prize amount"
                      required
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4">
                    <ModernButton
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      variant="secondary"
                      size="md"
                      className="order-2 sm:order-1"
                    >
                      Cancel
                    </ModernButton>
                    <ModernButton
                      type="submit"
                      variant="primary"
                      size="md"
                      className="order-1 sm:order-2"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Draw
                    </ModernButton>
                  </div>
                </form>
              </div>
            </ModernCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default Draws;

