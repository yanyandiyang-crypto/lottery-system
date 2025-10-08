/**
 * Utility function to get consistent role badge colors across the application
 * @param {string} role - The user role (superadmin, admin, area_coordinator, coordinator, agent, operator)
 * @returns {string} - Tailwind CSS classes for background, text, and border colors
 */
export const getRoleBadgeColor = (role) => {
  const colors = {
    superadmin: 'bg-red-100 text-red-800 border-red-200',
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    area_coordinator: 'bg-blue-100 text-blue-800 border-blue-200',
    coordinator: 'bg-green-100 text-green-800 border-green-200',
    agent: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    operator: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Get role gradient colors for more vibrant displays
 * @param {string} role - The user role
 * @returns {string} - Gradient color classes
 */
export const getRoleGradientColor = (role) => {
  const gradients = {
    superadmin: 'from-red-500 to-red-700',
    admin: 'from-purple-500 to-purple-700',
    area_coordinator: 'from-blue-500 to-blue-700',
    coordinator: 'from-green-500 to-green-700',
    agent: 'from-yellow-500 to-yellow-700',
    operator: 'from-gray-500 to-gray-700'
  };
  return gradients[role] || 'from-gray-500 to-gray-700';
};

/**
 * Format role name for display
 * @param {string} role - The user role
 * @returns {string} - Formatted role name
 */
export const formatRoleName = (role) => {
  if (!role) return 'Unknown';
  return role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};


