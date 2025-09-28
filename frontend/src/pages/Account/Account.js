import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import {
  UserIcon,
  ShieldCheckIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';

const Account = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile form
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phone: ''
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Preferences form
  const [preferences, setPreferences] = useState({
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
    language: 'en',
    timezone: 'Asia/Manila'
  });

  useEffect(() => {
    if (user) {
      setProfile({
        username: user.username || '',
        email: user.email || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || ''
      });
      setPreferences({
        notifications: user.preferences?.notifications ?? true,
        emailNotifications: user.preferences?.emailNotifications ?? true,
        smsNotifications: user.preferences?.smsNotifications ?? false,
        language: user.preferences?.language || 'en',
        timezone: user.preferences?.timezone || 'Asia/Manila'
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.put('/account/profile', profile);
      updateUser(response.data);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await api.put('/account/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess('Password changed successfully');
    } catch (err) {
      setError('Failed to change password');
      console.error('Error changing password:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await api.put('/account/preferences', preferences);
      updateUser(response.data);
      setSuccess('Preferences updated successfully');
    } catch (err) {
      setError('Failed to update preferences');
      console.error('Error updating preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: ShieldCheckIcon },
    { id: 'preferences', name: 'Preferences', icon: CogIcon }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-purple-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-100/30 to-accent-100/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent-100/30 to-primary-100/30 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>
      
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="Account Settings"
          subtitle="Manage your account information, security, and preferences"
          breadcrumbs={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Account Settings' }
          ]}
        />

        {error && (
          <ModernCard className="p-4 mb-6 border-red-200 bg-red-50 animate-slide-in" variant="glass">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-red-100 mr-3">
                <ExclamationCircleIcon className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </ModernCard>
        )}

        {success && (
          <ModernCard className="p-4 mb-6 border-green-200 bg-green-50 animate-slide-in" variant="glass">
            <div className="flex items-center">
              <div className="p-2 rounded-full bg-green-100 mr-3">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-green-800">{success}</p>
            </div>
          </ModernCard>
        )}

        {/* Modern Tab Navigation */}
        <ModernCard className="mb-6 animate-fade-in" variant="glass">
          <div className="px-4 sm:px-6 py-4">
            <nav className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-8" aria-label="Tabs">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group relative flex items-center justify-center sm:justify-start space-x-2 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 w-full sm:w-auto transform hover:scale-105 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 via-primary-600 to-accent-500 text-white shadow-glow animate-bounce-in'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-soft'
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span className="whitespace-nowrap">{tab.name}</span>
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-xl"></div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </ModernCard>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <ModernCard className="p-6 animate-fade-in" variant="glass">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent flex items-center">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 mr-3">
                  <UserIcon className="h-6 w-6 text-primary-600" />
                </div>
                Profile Information
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"></div>
            </div>
            <form onSubmit={handleProfileUpdate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    value={profile.username}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profile.firstName}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profile.lastName}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <input
                    type="text"
                    value={user?.role?.replace('_', ' ').toUpperCase() || ''}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                    disabled
                  />
                </div>
              </div>
              <div className="mt-8">
                <ModernButton
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </ModernButton>
              </div>
            </form>
          </ModernCard>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <ModernCard className="p-6 animate-fade-in" variant="glass">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent flex items-center">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 mr-3">
                  <ShieldCheckIcon className="h-6 w-6 text-primary-600" />
                </div>
                Change Password
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"></div>
            </div>
            <form onSubmit={handlePasswordChange}>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>
              <div className="mt-8">
                <ModernButton
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Changing...' : 'Change Password'}
                </ModernButton>
              </div>
            </form>
          </ModernCard>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <ModernCard className="p-6 animate-fade-in" variant="glass">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent flex items-center">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 mr-3">
                  <CogIcon className="h-6 w-6 text-primary-600" />
                </div>
                Preferences
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"></div>
            </div>
            <form onSubmit={handlePreferencesUpdate}>
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">Notifications</h3>
                  <div className="space-y-4">
                    <label className="flex items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-primary-50 hover:to-accent-50 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-soft">
                      <input
                        type="checkbox"
                        checked={preferences.notifications}
                        onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-4"
                      />
                      <span className="text-sm font-medium text-gray-700">Enable notifications</span>
                    </label>
                    <label className="flex items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-primary-50 hover:to-accent-50 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-soft">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-4"
                      />
                      <span className="text-sm font-medium text-gray-700">Email notifications</span>
                    </label>
                    <label className="flex items-center p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-primary-50 hover:to-accent-50 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-soft">
                      <input
                        type="checkbox"
                        checked={preferences.smsNotifications}
                        onChange={(e) => setPreferences({ ...preferences, smsNotifications: e.target.checked })}
                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mr-4"
                      />
                      <span className="text-sm font-medium text-gray-700">SMS notifications</span>
                    </label>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-6">Localization</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:bg-white/80 hover:shadow-soft"
                      >
                        <option value="en">English</option>
                        <option value="fil">Filipino</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <select
                        value={preferences.timezone}
                        onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:bg-white/80 hover:shadow-soft"
                      >
                        <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                        <option value="UTC">UTC (UTC+0)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <ModernButton
                  type="submit"
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Preferences'}
                </ModernButton>
              </div>
            </form>
          </ModernCard>
        )}
      </div>
    </div>
  );
};

export default Account;

