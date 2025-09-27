/**
 * Reusable Button Component
 * Clean, consistent button styling with variants
 */

import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon = null,
  ...props
}) => {
  // Base styles
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease-in-out',
    textDecoration: 'none',
    outline: 'none',
    fontFamily: 'inherit'
  };

  // Variant styles
  const variantStyles = {
    primary: {
      backgroundColor: disabled ? '#94a3b8' : '#3b82f6',
      color: 'white',
      '&:hover': !disabled && !loading ? { backgroundColor: '#2563eb' } : {},
      '&:focus': { boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.3)' }
    },
    secondary: {
      backgroundColor: disabled ? '#f1f5f9' : '#f8fafc',
      color: disabled ? '#94a3b8' : '#475569',
      border: `1px solid ${disabled ? '#e2e8f0' : '#d1d5db'}`,
      '&:hover': !disabled && !loading ? { backgroundColor: '#f1f5f9', borderColor: '#9ca3af' } : {}
    },
    success: {
      backgroundColor: disabled ? '#94a3b8' : '#10b981',
      color: 'white',
      '&:hover': !disabled && !loading ? { backgroundColor: '#059669' } : {}
    },
    danger: {
      backgroundColor: disabled ? '#94a3b8' : '#ef4444',
      color: 'white',
      '&:hover': !disabled && !loading ? { backgroundColor: '#dc2626' } : {}
    },
    warning: {
      backgroundColor: disabled ? '#94a3b8' : '#f59e0b',
      color: 'white',
      '&:hover': !disabled && !loading ? { backgroundColor: '#d97706' } : {}
    },
    ghost: {
      backgroundColor: 'transparent',
      color: disabled ? '#94a3b8' : '#475569',
      '&:hover': !disabled && !loading ? { backgroundColor: '#f1f5f9' } : {}
    }
  };

  // Size styles
  const sizeStyles = {
    small: {
      padding: '6px 12px',
      fontSize: '14px',
      minHeight: '32px'
    },
    medium: {
      padding: '10px 16px',
      fontSize: '16px',
      minHeight: '40px'
    },
    large: {
      padding: '12px 24px',
      fontSize: '18px',
      minHeight: '48px'
    }
  };

  // Combine styles
  const buttonStyles = {
    ...baseStyles,
    ...variantStyles[variant],
    ...sizeStyles[size]
  };

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault();
      return;
    }
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <button
      type={type}
      style={buttonStyles}
      className={className}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}
      {!loading && icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

// CSS for spinner animation (add to your global CSS)
const spinnerCSS = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Inject spinner CSS if not already present
if (typeof document !== 'undefined' && !document.getElementById('button-spinner-css')) {
  const style = document.createElement('style');
  style.id = 'button-spinner-css';
  style.textContent = spinnerCSS;
  document.head.appendChild(style);
}

export default Button;
