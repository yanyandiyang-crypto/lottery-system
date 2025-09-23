import React, { useState, useEffect } from 'react';

const PasswordStrength = ({ password, onStrengthChange }) => {
  const [strength, setStrength] = useState(0);
  const [errors, setErrors] = useState([]);
  const [strengthInfo, setStrengthInfo] = useState({ level: 'Very Weak', color: 'red' });

  useEffect(() => {
    if (password) {
      validatePassword(password);
    } else {
      setStrength(0);
      setErrors([]);
      setStrengthInfo({ level: 'Very Weak', color: 'red' });
    }
  }, [password]);

  const validatePassword = async (pwd) => {
    try {
      const response = await fetch('/api/v1/auth/validate-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: pwd }),
      });

      const data = await response.json();

      if (data.success) {
        setStrength(data.strength);
        setErrors(data.errors);
        setStrengthInfo(data.strengthInfo);
        
        if (onStrengthChange) {
          onStrengthChange({
            strength: data.strength,
            isValid: data.isValid,
            errors: data.errors,
            isCompromised: data.isCompromised
          });
        }
      }
    } catch (error) {
      console.error('Password validation error:', error);
    }
  };

  const getStrengthBarStyle = () => {
    const width = strength;
    return {
      width: `${width}%`,
      backgroundColor: strengthInfo.color,
      height: '4px',
      borderRadius: '2px',
      transition: 'all 0.3s ease'
    };
  };

  const getStrengthTextColor = () => {
    return strengthInfo.color;
  };

  return (
    <div className="password-strength-container">
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex-1 bg-gray-200 rounded-full h-1">
          <div style={getStrengthBarStyle()}></div>
        </div>
        <span 
          className="text-sm font-medium"
          style={{ color: getStrengthTextColor() }}
        >
          {strengthInfo.level}
        </span>
      </div>
      
      {errors.length > 0 && (
        <div className="text-sm text-red-600 space-y-1">
          {errors.map((error, index) => (
            <div key={index} className="flex items-center space-x-1">
              <span>•</span>
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}
      
      {password && errors.length === 0 && (
        <div className="text-sm text-green-600">
          ✓ Password meets all security requirements
        </div>
      )}
    </div>
  );
};

export default PasswordStrength;
