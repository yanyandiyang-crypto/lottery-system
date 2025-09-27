// Utility functions for handling dates in Philippines timezone

/**
 * Get current date in Philippines timezone (Asia/Manila)
 * Returns date string in YYYY-MM-DD format
 */
export const getCurrentDatePH = () => {
  const now = new Date();
  // Convert to Philippines timezone (UTC+8)
  const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return phTime.toISOString().split('T')[0];
};

/**
 * Get current datetime in Philippines timezone
 * Returns Date object adjusted for Philippines timezone
 */
export const getCurrentDateTimePH = () => {
  const now = new Date();
  // Convert to Philippines timezone (UTC+8)
  return new Date(now.getTime() + (8 * 60 * 60 * 1000));
};

/**
 * Format date for display in Philippines timezone
 * @param {Date|string} date - Date to format
 * @param {string} format - Format type ('date', 'datetime', 'time')
 * @returns {string} Formatted date string
 */
export const formatDatePH = (date, format = 'date') => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Convert to Philippines timezone
  const phDate = new Date(dateObj.getTime() + (8 * 60 * 60 * 1000));
  
  const options = {
    timeZone: 'Asia/Manila',
  };
  
  switch (format) {
    case 'date':
      return phDate.toLocaleDateString('en-PH', {
        ...options,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    case 'datetime':
      return phDate.toLocaleString('en-PH', {
        ...options,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    case 'time':
      return phDate.toLocaleTimeString('en-PH', {
        ...options,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    default:
      return phDate.toLocaleDateString('en-PH', options);
  }
};

/**
 * Check if a date is today in Philippines timezone
 * @param {Date|string} date - Date to check
 * @returns {boolean} True if date is today in PH timezone
 */
export const isToday = (date) => {
  const today = getCurrentDatePH();
  const checkDate = typeof date === 'string' ? date : date.toISOString().split('T')[0];
  return today === checkDate;
};

/**
 * Get date range for today in Philippines timezone
 * @returns {object} Object with startDate and endDate
 */
export const getTodayRange = () => {
  const today = getCurrentDatePH();
  return {
    startDate: today,
    endDate: today
  };
};

/**
 * Convert UTC date to Philippines timezone date string
 * @param {Date} utcDate - UTC date
 * @returns {string} Date string in YYYY-MM-DD format for PH timezone
 */
export const utcToPHDateString = (utcDate) => {
  const phDate = new Date(utcDate.getTime() + (8 * 60 * 60 * 1000));
  return phDate.toISOString().split('T')[0];
};

/**
 * Get current time info for Philippines timezone
 * @returns {object} Object with current time info
 */
export const getCurrentTimeInfoPH = () => {
  const now = getCurrentDateTimePH();
  const hours = now.getUTCHours(); // Using UTC hours since we already adjusted for PH timezone
  const minutes = now.getUTCMinutes();
  
  return {
    date: now.toISOString().split('T')[0],
    time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
    hours,
    minutes,
    isAfterMidnight: hours >= 0 && hours < 6, // 12AM to 6AM
    displayTime: formatDatePH(now, 'time'),
    displayDateTime: formatDatePH(now, 'datetime')
  };
};
