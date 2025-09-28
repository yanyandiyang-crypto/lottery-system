import React from 'react';

const ModernCard = ({ 
  children, 
  className = '', 
  variant = 'default',
  hover = true,
  glass = false,
  glow = false,
  ...props 
}) => {
  const baseClasses = 'rounded-2xl border transition-all duration-300 animate-fade-in';
  
  const variants = {
    default: 'bg-white border-gray-200 shadow-soft',
    glass: 'bg-white/10 backdrop-blur-md border-white/20 shadow-glass',
    elevated: 'bg-white border-gray-100 shadow-medium',
    gradient: 'bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-soft',
  };
  
  const hoverEffects = hover ? 'hover:shadow-hard hover:-translate-y-1' : '';
  const glowEffect = glow ? 'shadow-glow' : '';
  const glassEffect = glass ? 'backdrop-blur-md bg-white/10 border-white/20' : '';
  
  const cardClasses = `
    ${baseClasses}
    ${variants[variant]}
    ${hoverEffects}
    ${glowEffect}
    ${glassEffect}
    ${className}
  `.trim();

  return (
    <div
      className={cardClasses}
      {...props}
    >
      {children}
    </div>
  );
};

export default ModernCard;
