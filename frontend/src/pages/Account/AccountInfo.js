import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { 
  UserIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const AccountInfo = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [accountStats, setAccountStats] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || ''
      });
      fetchAccountStats();
    }
  }, [user]);

  const fetchAccountStats = async () => {
    try {
      // Fetch user-specific statistics based on role
      const response = await authAPI.getAccountStats();
      setAccountStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch account stats:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.updateProfile(formData);
      updateUser(response.data.user);
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      superadmin: 'bg-red-100 text-red-800',
      admin: 'bg-purple-100 text-purple-800',
      area_coordinator: 'bg-blue-100 text-blue-800',
      coordinator: 'bg-green-100 text-green-800',
      agent: 'bg-yellow-100 text-yellow-800',
      operator: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  if (!user) return <LoadingSpinner />;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-3 sm:mb-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Account Information</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage your profile and account settings</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <span className={`inline-flex px-2 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
              {user.role.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-2 sm:mb-0">Profile Information</h2>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <PencilIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="p-4 sm:p-6">
              {editing ? (
                <form onSubmit={handleUpdateProfile} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="mt-1 block w-full text-sm sm:text-base border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 block w-full text-sm sm:text-base border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 block w-full text-sm sm:text-base border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setFormData({
                          fullName: user.fullName || '',
                          email: user.email || '',
                          phone: user.phone || ''
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center">
                    <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user.fullName}</div>
                      <div className="text-xs sm:text-sm text-gray-500">Full Name</div>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0">@</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user.username}</div>
                      <div className="text-xs sm:text-sm text-gray-500">Username</div>
                    </div>
                  </div>

                  {user.email && (
                    <div className="flex items-center">
                      <div className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0">✉</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user.email}</div>
                        <div className="text-xs sm:text-sm text-gray-500">Email</div>
                      </div>
                    </div>
                  )}

                  {user.phone && (
                    <div className="flex items-center">
                      <div className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0">📞</div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user.phone}</div>
                        <div className="text-xs sm:text-sm text-gray-500">Phone</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2 sm:mr-3 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-sm font-medium text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500">Member Since</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white shadow rounded-lg mt-4 sm:mt-6">
            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
              <h2 className="text-base sm:text-lg font-medium text-gray-900">Security Settings</h2>
            </div>

            <div className="p-4 sm:p-6">
              {!showPasswordForm ? (
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="mb-3 sm:mb-0">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-900">Password</h3>
                      <p className="text-xs sm:text-sm text-gray-500">Last changed: Unknown</p>
                    </div>
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs sm:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Change Password
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Current Password</label>
                    <div className="mt-1 relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="block w-full text-sm sm:text-base border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.current ? 
                          <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" /> : 
                          <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        }
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">New Password</label>
                    <div className="mt-1 relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        className="block w-full text-sm sm:text-base border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 pr-10"
                        minLength="6"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.new ? 
                          <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" /> : 
                          <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        }
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700">Confirm New Password</label>
                    <div className="mt-1 relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        className="block w-full text-sm sm:text-base border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPasswords.confirm ? 
                          <EyeSlashIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" /> : 
                          <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                        }
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setPasswordData({
                          currentPassword: '',
                          newPassword: '',
                          confirmPassword: ''
                        });
                      }}
                      className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto px-4 py-2 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                    >
                      {loading ? 'Changing...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Account Statistics */}
        <div className="space-y-4 sm:space-y-6">
          {/* Balance Card (for eligible roles) */}
          {['area_coordinator', 'coordinator', 'agent'].includes(user.role) && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">Current Balance</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 flex-shrink-0" />
                  <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                    <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                      {formatCurrency(user.balance?.currentBalance)}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">Available Balance</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Account Stats */}
          {accountStats && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">Account Statistics</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {accountStats.totalTickets !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Total Tickets:</span>
                    <span className="text-xs sm:text-sm font-medium">{accountStats.totalTickets.toLocaleString()}</span>
                  </div>
                )}
                {accountStats.totalSales !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Total Sales:</span>
                    <span className="text-xs sm:text-sm font-medium">{formatCurrency(accountStats.totalSales)}</span>
                  </div>
                )}
                {accountStats.totalWinnings !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Total Winnings:</span>
                    <span className="text-xs sm:text-sm font-medium">{formatCurrency(accountStats.totalWinnings)}</span>
                  </div>
                )}
                {accountStats.activeAgents !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">Active Agents:</span>
                    <span className="text-xs sm:text-sm font-medium">{accountStats.activeAgents}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Hierarchy Info */}
          {user.coordinator && (
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">Reporting Structure</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <div className="text-xs sm:text-sm text-gray-500">Reports to:</div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user.coordinator.fullName}</div>
                  </div>
                  {user.coordinator.coordinator && (
                    <div>
                      <div className="text-xs sm:text-sm text-gray-500">Area Coordinator:</div>
                      <div className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user.coordinator.coordinator.fullName}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;
