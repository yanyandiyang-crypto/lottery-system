import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  
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
    
    // Username validation
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.trim().length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username.trim())) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (formData.password.length > 50) {
      newErrors.password = 'Password must be less than 50 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLocked) {
      toast.error('Account temporarily locked due to multiple failed attempts');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await login(formData);
      
      if (result.success) {
        setLoginAttempts(0);
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setIsLocked(true);
          toast.error('Account locked due to multiple failed attempts. Please try again later.');
          setTimeout(() => {
            setIsLocked(false);
            setLoginAttempts(0);
          }, 300000); // 5 minutes lockout
        } else {
          toast.error(result.message || 'Invalid username or password');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Login failed. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
          {/* Modern Header with Glass Effect */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-8 py-10 text-center relative overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/95 via-indigo-600/95 to-purple-600/95"></div>
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
            </div>
            
            <div className="relative z-10">
              {/* Modern Logo Container */}
              <div className="mx-auto w-20 h-20 bg-white/95 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl mb-4 transform hover:rotate-6 transition-all duration-300 animate-bounce-in">
                <img 
                  src="/logos/pisting-logo.png" 
                  alt="Logo" 
                  className="w-12 h-12 object-contain" 
                  onError={(e) => { 
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement.innerHTML = '<svg class="w-12 h-12 text-gradient-to-r from-blue-600 to-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path></svg>';
                  }} 
                />
              </div>
              
              {/* Title with Animation */}
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight animate-slide-in">
                Welcome!
              </h1>
            </div>
          </div>

          {/* Modern Security Warning */}
          {loginAttempts > 0 && (
            <div className="bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 border-l-4 border-amber-400 p-4 animate-slide-in">
              <div className="flex items-start">
                <div className="p-2 rounded-lg bg-amber-100">
                  <ExclamationTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-bold text-amber-900">
                    {loginAttempts >= 3 ? '🔒 Account Temporarily Locked' : '⚠️ Security Alert'}
                  </p>
                  <p className="text-xs text-amber-700 mt-1 font-medium">
                    {loginAttempts >= 3 ? 'Please wait 5 minutes before trying again' : `${3 - loginAttempts} attempts remaining`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <form className="px-6 sm:px-8 py-8" onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Modern Username Field */}
              <div className="animate-slide-in" style={{animationDelay: '100ms'}}>
                <label htmlFor="username" className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                  <span className="mr-2">👤</span> Username
                </label>
                <div className="relative group">
                  <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    disabled={isLocked}
                    className={`block w-full rounded-xl border-2 ${
                      errors.username 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/50' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white/70'
                    } px-4 py-3.5 focus:outline-none focus:ring-4 transition-all duration-300 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed backdrop-blur-sm placeholder-gray-400 font-medium group-hover:border-blue-300 shadow-sm`}
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                  />
                  {errors.username && (
                    <div className="absolute right-3 top-3.5 animate-bounce-in">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                  {!errors.username && formData.username && (
                    <div className="absolute right-3 top-3.5 animate-fade-in">
                      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {errors.username && (
                  <p className="mt-2 text-xs text-red-600 flex items-center font-medium animate-slide-in">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1.5" />
                    {errors.username}
                  </p>
                )}
              </div>

              {/* Modern Password Field */}
              <div className="animate-slide-in" style={{animationDelay: '200ms'}}>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-bold text-gray-700 flex items-center">
                    <span className="mr-2">🔒</span> Password
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)} 
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-blue-50 transition-all duration-200"
                    disabled={isLocked}
                  >
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className={`h-5 w-5 transition-colors duration-200 ${errors.password ? 'text-red-400' : 'text-gray-400 group-hover:text-blue-500'}`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    disabled={isLocked}
                    className={`block w-full rounded-xl border-2 ${
                      errors.password 
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200 bg-red-50/50' 
                        : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200 bg-white/70'
                    } pl-12 pr-12 py-3.5 focus:outline-none focus:ring-4 transition-all duration-300 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed backdrop-blur-sm placeholder-gray-400 font-medium group-hover:border-blue-300 shadow-sm`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  {errors.password && (
                    <div className="absolute right-3 top-3.5 animate-bounce-in">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    </div>
                  )}
                  {!errors.password && formData.password && (
                    <div className="absolute right-3 top-3.5 animate-fade-in">
                      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {errors.password && (
                  <p className="mt-2 text-xs text-red-600 flex items-center font-medium animate-slide-in">
                    <ExclamationTriangleIcon className="h-4 w-4 mr-1.5" />
                    {errors.password}
                  </p>
                )}
              </div>
            </div>

            {/* Modern Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting || isLocked}
              className="mt-8 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-2xl text-sm sm:text-base transform hover:scale-[1.02] active:scale-95 animate-slide-in relative overflow-hidden group"
              style={{animationDelay: '300ms'}}
            >
              {/* Button Shine Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <span className="relative z-10">
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                    <span className="font-semibold">Signing in...</span>
                  </div>
                ) : isLocked ? (
                  <div className="flex items-center justify-center">
                    <LockClosedIcon className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Account Locked</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <span className="font-bold tracking-wide">Sign In</span>
                    <svg className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </span>
            </button>
          </form>

          {/* Bottom Accent */}
          <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;




