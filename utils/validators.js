/**
 * Validation Utilities
 * Reusable validation functions
 */

const { VALIDATION_RULES, USER_ROLES, TICKET_STATUS } = require('./constants');

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} - Is valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format (Philippine format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - Is valid phone number
 */
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^(\+63|0)?9\d{9}$/;
  return phoneRegex.test(phone);
};

/**
 * Validate ticket number format
 * @param {string} ticketNumber - Ticket number to validate
 * @returns {boolean} - Is valid ticket number
 */
const isValidTicketNumber = (ticketNumber) => {
  const cleanNumber = ticketNumber.replace(/\s/g, '');
  return /^\d{17}$/.test(cleanNumber);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with errors
 */
const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < VALIDATION_RULES.MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${VALIDATION_RULES.MIN_PASSWORD_LENGTH} characters long`);
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Validate user role
 * @param {string} role - Role to validate
 * @returns {boolean} - Is valid role
 */
const isValidUserRole = (role) => {
  return Object.values(USER_ROLES).includes(role);
};

/**
 * Validate ticket status
 * @param {string} status - Status to validate
 * @returns {boolean} - Is valid status
 */
const isValidTicketStatus = (status) => {
  return Object.values(TICKET_STATUS).includes(status);
};

/**
 * Validate bet amount
 * @param {number} amount - Amount to validate
 * @returns {Object} - Validation result
 */
const validateBetAmount = (amount) => {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Bet amount must be a valid number' };
  }
  
  if (numAmount < VALIDATION_RULES.MIN_BET_AMOUNT) {
    return { isValid: false, error: `Minimum bet amount is ₱${VALIDATION_RULES.MIN_BET_AMOUNT}` };
  }
  
  if (numAmount > VALIDATION_RULES.MAX_BET_AMOUNT) {
    return { isValid: false, error: `Maximum bet amount is ₱${VALIDATION_RULES.MAX_BET_AMOUNT}` };
  }
  
  return { isValid: true };
};

/**
 * Validate bet combination (3-digit number)
 * @param {string} combination - Bet combination to validate
 * @returns {boolean} - Is valid combination
 */
const isValidBetCombination = (combination) => {
  const result = /^\d{3}$/.test(combination.toString());
  console.log('Bet combination validation:', {
    input: combination,
    type: typeof combination,
    string: combination.toString(),
    length: combination.toString().length,
    result: result
  });
  return result;
};

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Object} - Validated pagination params
 */
const validatePagination = (page, limit) => {
  const validatedPage = Math.max(1, parseInt(page) || 1);
  const validatedLimit = Math.min(
    Math.max(1, parseInt(limit) || 20),
    VALIDATION_RULES.MAX_LIMIT || 100
  );
  
  return {
    page: validatedPage,
    limit: validatedLimit,
    offset: (validatedPage - 1) * validatedLimit
  };
};

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string} - Sanitized string
 */
const sanitizeString = (input, maxLength = 255) => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Basic XSS prevention
};

/**
 * Validate required fields
 * @param {Object} data - Data object to validate
 * @param {Array} requiredFields - Array of required field names
 * @returns {Object} - Validation result
 */
const validateRequiredFields = (data, requiredFields) => {
  const missingFields = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missingFields.push(field);
    }
  });
  
  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

module.exports = {
  isValidEmail,
  isValidPhoneNumber,
  isValidTicketNumber,
  validatePassword,
  isValidUserRole,
  isValidTicketStatus,
  validateBetAmount,
  isValidBetCombination,
  validatePagination,
  sanitizeString,
  validateRequiredFields
};
