import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { formatDrawTime } from '../../utils/drawTimeFormatter';

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
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Draws</h1>
          <p className="text-gray-600 mt-2">Manage lottery draws and results</p>
        </div>
        {canManageDraws && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Create Draw
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid gap-6">
        {draws.map((draw) => (
          <div key={draw.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{draw.name}</h3>
                <p className="text-gray-600 mt-1">
                  {draw.drawDate ? new Date(draw.drawDate).toLocaleDateString() : 'No Date'} at {formatDrawTime(draw.drawTime)}
                </p>
                <p className="text-gray-600">Prize: ₱{draw.prizeAmount?.toLocaleString()}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(draw.status)}`}>
                  {draw.status}
                </span>
                {canManageDraws && (
                  <div className="flex space-x-2">
                    {draw.status === 'scheduled' && (
                      <button
                        onClick={() => handleStartDraw(draw.id)}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Start
                      </button>
                    )}
                    {draw.status === 'active' && (
                      <button
                        onClick={() => handleEndDraw(draw.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                      >
                        End
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
            
            {draw.winningNumbers && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Winning Numbers:</h4>
                <div className="flex flex-wrap gap-2">
                  {draw.winningNumbers.map((number, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800"
                    >
                      {number}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Create Draw Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Draw</h3>
              <form onSubmit={handleCreateDraw}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Draw Name
                  </label>
                  <input
                    type="text"
                    value={newDraw.name}
                    onChange={(e) => setNewDraw({ ...newDraw, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Draw Date
                  </label>
                  <input
                    type="date"
                    value={newDraw.drawDate}
                    onChange={(e) => setNewDraw({ ...newDraw, drawDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Draw Time
                  </label>
                  <input
                    type="time"
                    value={newDraw.drawTime}
                    onChange={(e) => setNewDraw({ ...newDraw, drawTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prize Amount
                  </label>
                  <input
                    type="number"
                    value={newDraw.prizeAmount}
                    onChange={(e) => setNewDraw({ ...newDraw, prizeAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Create Draw
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Draws;

