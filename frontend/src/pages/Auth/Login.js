import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

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
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur border border-gray-100 shadow-xl rounded-2xl overflow-hidden">
          <div className="px-6 sm:px-8 pt-8 pb-2 text-center">
            <div className="mx-auto w-16 h-16 rounded-xl bg-primary-600/10 flex items-center justify-center ring-1 ring-primary-200">
              <img src="/logos/pisting-logo.png" alt="Brand" className="w-10 h-10 object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-gray-900">Welcome back</h1>
            <p className="mt-1 text-sm text-gray-500">Sign in to continue to your dashboard</p>
          </div>

          <form className="px-6 sm:px-8 pt-4 pb-8" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className={`block w-full rounded-lg border ${errors.username ? 'border-red-300 ring-red-200' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200'} px-3 py-2 shadow-sm focus:outline-none focus:ring-2 sm:text-sm`}
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleChange}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-xs text-primary-600 hover:text-primary-700 inline-flex items-center gap-1">
                    {showPassword ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className={`block w-full rounded-lg border ${errors.password ? 'border-red-300 ring-red-200' : 'border-gray-300 focus:border-primary-500 focus:ring-primary-200'} px-3 py-2 pr-10 shadow-sm focus:outline-none focus:ring-2 sm:text-sm`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-xs text-gray-600 select-none">
                  <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  Remember me
                </label>
                <button type="button" className="text-xs font-medium text-primary-600 hover:text-primary-700">
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="mr-2 inline-block h-4 w-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>

            <div className="mt-6 text-center text-xs text-gray-500">
              <p>NewBetting Lottery Management System</p>
              <p className="mt-1">Secure • Reliable • Efficient</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;




