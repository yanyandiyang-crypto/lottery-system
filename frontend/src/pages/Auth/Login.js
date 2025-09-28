import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const result = await login(formData);
    if (result.success) {
      navigate('/dashboard');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md animate-fade-in">
        <ModernCard variant="elevated" className="overflow-hidden">
          <div className="px-6 sm:px-8 pt-8 pb-2 text-center">
            <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center ring-2 ring-primary-200 shadow-glow animate-bounce-in">
              <img 
                src="/logos/pisting-logo.png" 
                alt="Brand" 
                className="w-12 h-12 object-contain" 
                onError={(e) => { 
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement.innerHTML = '<div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center"><svg class="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path></svg></div>';
                }} 
              />
            </div>
            <h1 className="mt-6 text-3xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">Welcome Back</h1>
            <p className="mt-2 text-gray-600">Sign in to continue to your dashboard</p>
          </div>

          <form className="px-6 sm:px-8 pt-4 pb-8" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className={`block w-full rounded-xl border-2 ${errors.username ? 'border-danger-300 ring-danger-200 focus:border-danger-500 focus:ring-danger-200' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'} px-4 py-3 bg-white/50 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 text-sm placeholder-gray-400`}
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && (
                  <p className="mt-2 text-sm text-danger-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.username}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">Password</label>
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="text-xs text-primary-600 hover:text-primary-700 inline-flex items-center gap-1 px-2 py-1 rounded-md hover:bg-primary-50 transition-colors duration-200"
                  >
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className={`block w-full rounded-xl border-2 ${errors.password ? 'border-danger-300 ring-danger-200 focus:border-danger-500 focus:ring-danger-200' : 'border-gray-200 focus:border-primary-500 focus:ring-primary-200'} pl-12 pr-4 py-3 bg-white/50 backdrop-blur-sm shadow-sm focus:outline-none focus:ring-2 transition-all duration-200 text-sm placeholder-gray-400`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                {errors.password && (
                  <p className="mt-2 text-sm text-danger-600 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.password}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm text-gray-600 select-none cursor-pointer hover:text-gray-800 transition-colors duration-200">
                  <input 
                    type="checkbox" 
                    className="rounded-md border-gray-300 text-primary-600 focus:ring-primary-500 focus:ring-2 transition-all duration-200" 
                  />
                  Remember me
                </label>
                <button 
                  type="button" 
                  className="text-sm font-medium text-primary-600 hover:text-primary-700 px-2 py-1 rounded-md hover:bg-primary-50 transition-all duration-200"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <ModernButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              className="mt-8 w-full shadow-glow"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </ModernButton>

            <div className="mt-8 text-center">
              <div className="text-sm font-medium bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                NewBetting Lottery Management System
              </div>
              <div className="mt-2 flex items-center justify-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                  <span>Reliable</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-accent-500 rounded-full"></div>
                  <span>Efficient</span>
                </div>
              </div>
            </div>
          </form>
        </ModernCard>
      </div>
    </div>
  );
};

export default Login;




