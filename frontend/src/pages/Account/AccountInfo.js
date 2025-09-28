import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import { 
  UserIcon, 
  CurrencyDollarIcon,
  ClockIcon,
  PencilIcon,
  EyeIcon,
  EyeSlashIcon,
  ShieldCheckIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import StatCard from '../../components/UI/StatCard';

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
      const response = await api.get('/account/stats');
      setAccountStats(response.data.data);
    } catch (error) {
      console.error('Failed to fetch account stats:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/account/profile', formData);
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
      await api.put('/account/password', {
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-100/30 to-accent-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent-100/30 to-primary-100/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Account Information"
          subtitle="Manage your profile, security settings, and view account statistics"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Account Information' }
          ]}
        >
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
              <UserIcon className="h-4 w-4 mr-1" />
              {user.role.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </PageHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            <ModernCard variant="glass" className="animate-slide-in">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200/50">
                <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent flex items-center">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 mr-3">
                      <UserIcon className="h-6 w-6 text-primary-600 flex-shrink-0" />
                    </div>
                    <span className="truncate">Profile Information</span>
                  </h2>
                  {!editing && (
                    <ModernButton
                      variant="secondary"
                      size="sm"
                      icon={PencilIcon}
                      onClick={() => setEditing(true)}
                      className="w-full sm:w-auto"
                    >
                      Edit Profile
                    </ModernButton>
                  )}
                </div>
              </div>

              <div className="p-6">
                {editing ? (
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:bg-white/80 hover:shadow-soft"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:bg-white/80 hover:shadow-soft"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:bg-white/80 hover:shadow-soft"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                      <ModernButton
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setEditing(false);
                          setFormData({
                            fullName: user.fullName || '',
                            email: user.email || '',
                            phone: user.phone || ''
                          });
                        }}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </ModernButton>
                      <ModernButton
                        type="submit"
                        variant="primary"
                        loading={loading}
                        disabled={loading}
                        className="w-full sm:w-auto"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </ModernButton>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center p-6 rounded-xl bg-gradient-to-r from-primary-50 via-white to-accent-50 border border-primary-100/50 hover:shadow-glow transition-all duration-300 transform hover:scale-[1.02]">
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mr-6 shadow-glow">
                        <UserIcon className="h-8 w-8 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent truncate">{user.fullName}</div>
                        <div className="text-sm text-gray-500 font-medium">Full Name</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-primary-50 hover:to-accent-50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-soft">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 mr-3">
                          <div className="text-primary-600 font-bold text-lg">@</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900 truncate">{user.username}</div>
                          <div className="text-xs text-gray-500 font-medium">Username</div>
                        </div>
                      </div>

                      {user.email && (
                        <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-primary-50 hover:to-accent-50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-soft">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 mr-3">
                            <div className="text-primary-600 text-lg">✉</div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900 truncate">{user.email}</div>
                            <div className="text-xs text-gray-500 font-medium">Email</div>
                          </div>
                        </div>
                      )}

                      {user.phone && (
                        <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-primary-50 hover:to-accent-50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-soft">
                          <div className="p-2 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 mr-3">
                            <div className="text-primary-600 text-lg">📞</div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-gray-900 truncate">{user.phone}</div>
                            <div className="text-xs text-gray-500 font-medium">Phone</div>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-primary-50 hover:to-accent-50 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-soft">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary-100 to-accent-100 mr-3">
                          <ClockIcon className="h-5 w-5 text-primary-600 flex-shrink-0" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-gray-900">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500 font-medium">Member Since</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ModernCard>

            {/* Security Settings */}
            <ModernCard variant="glass" className="animate-slide-in" style={{animationDelay: '200ms'}}>
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200/50">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent flex items-center">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 mr-3">
                    <ShieldCheckIcon className="h-6 w-6 text-primary-600 flex-shrink-0" />
                  </div>
                  <span className="truncate">Security Settings</span>
                </h2>
              </div>

              <div className="p-6">
                {!showPasswordForm ? (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-6 rounded-xl bg-gradient-to-r from-primary-50 via-white to-accent-50 border border-primary-100/50 hover:shadow-glow transition-all duration-300">
                      <div className="mb-3 sm:mb-0">
                        <h3 className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Password</h3>
                        <p className="text-sm text-gray-500 font-medium">Last changed: Unknown</p>
                      </div>
                      <ModernButton
                        variant="primary"
                        size="sm"
                        onClick={() => setShowPasswordForm(true)}
                        className="w-full sm:w-auto transform hover:scale-105"
                      >
                        Change Password
                      </ModernButton>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        >
                          {showPasswords.current ? 
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : 
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          }
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                          minLength="6"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        >
                          {showPasswords.new ? 
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : 
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          }
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute inset-y-0 right-0 pr-4 flex items-center"
                        >
                          {showPasswords.confirm ? 
                            <EyeSlashIcon className="h-5 w-5 text-gray-400" /> : 
                            <EyeIcon className="h-5 w-5 text-gray-400" />
                          }
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                      <ModernButton
                        type="button"
                        variant="ghost"
                        onClick={() => {
                          setShowPasswordForm(false);
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                          });
                        }}
                        className="w-full sm:w-auto"
                      >
                        Cancel
                      </ModernButton>
                      <ModernButton
                        type="submit"
                        variant="primary"
                        loading={loading}
                        disabled={loading}
                        className="w-full sm:w-auto"
                      >
                        {loading ? 'Changing...' : 'Change Password'}
                      </ModernButton>
                    </div>
                  </form>
                )}
              </div>
            </ModernCard>
          </div>

          {/* Account Statistics Sidebar */}
          <div className="space-y-6 animate-slide-in" style={{animationDelay: '400ms'}}>
            {/* Balance Card (for eligible roles) */}
            {['area_coordinator', 'coordinator', 'agent'].includes(user.role) && (
              <div className="transform hover:scale-105 transition-all duration-300">
                <StatCard
                  title="Current Balance"
                  value={formatCurrency(user.balance?.currentBalance)}
                  icon={CurrencyDollarIcon}
                  color="success"
                  className="animate-bounce-in"
                />
              </div>
            )}

            {/* Account Stats */}
            {accountStats && (
              <div className="space-y-4">
                {accountStats.totalTickets !== undefined && (
                  <div className="transform hover:scale-105 transition-all duration-300" style={{animationDelay: '100ms'}}>
                    <StatCard
                      title="Total Tickets"
                      value={accountStats.totalTickets.toLocaleString()}
                      icon={ChartBarIcon}
                      color="primary"
                      className="animate-bounce-in"
                    />
                  </div>
                )}
                {accountStats.totalSales !== undefined && (
                  <div className="transform hover:scale-105 transition-all duration-300" style={{animationDelay: '200ms'}}>
                    <StatCard
                      title="Total Sales"
                      value={formatCurrency(accountStats.totalSales)}
                      icon={CurrencyDollarIcon}
                      color="accent"
                      className="animate-bounce-in"
                    />
                  </div>
                )}
                {accountStats.totalWinnings !== undefined && (
                  <div className="transform hover:scale-105 transition-all duration-300" style={{animationDelay: '300ms'}}>
                    <StatCard
                      title="Total Winnings"
                      value={formatCurrency(accountStats.totalWinnings)}
                      icon={CurrencyDollarIcon}
                      color="warning"
                      className="animate-bounce-in"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Hierarchy Info */}
            {user.coordinator && (
              <ModernCard variant="glass" className="animate-slide-in transform hover:scale-105 transition-all duration-300" style={{animationDelay: '500ms'}}>
                <div className="px-6 py-4 border-b border-gray-200/50">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent flex items-center">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 mr-3">
                      <UserIcon className="h-6 w-6 text-primary-600" />
                    </div>
                    Reporting Structure
                  </h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 border border-primary-100/50 hover:shadow-soft transition-all duration-300">
                    <div className="text-sm text-gray-500 mb-1 font-medium">Reports to:</div>
                    <div className="text-sm font-bold text-gray-900">{user.coordinator.fullName}</div>
                  </div>
                  {user.coordinator.coordinator && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-accent-50 to-primary-50 border border-accent-100/50 hover:shadow-soft transition-all duration-300">
                      <div className="text-sm text-gray-500 mb-1 font-medium">Area Coordinator:</div>
                      <div className="text-sm font-bold text-gray-900">{user.coordinator.coordinator.fullName}</div>
                    </div>
                  )}
                </div>
              </ModernCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountInfo;
