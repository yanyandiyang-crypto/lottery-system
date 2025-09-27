/**
 * Validation Middleware
 * Centralized validation for API requests
 */

const { sendValidationError } = require('../utils/responseHelper');
const { 
  validateRequiredFields, 
  isValidEmail, 
  validatePassword, 
  isValidTicketNumber,
  validateBetAmount,
  isValidBetCombination,
  validatePagination
} = require('../utils/validators');

/**
 * Validate required fields middleware
 * @param {Array} requiredFields - Array of required field names
 */
const validateRequired = (requiredFields) => {
  return (req, res, next) => {
    const validation = validateRequiredFields(req.body, requiredFields);
    
    if (!validation.isValid) {
      return sendValidationError(res, 
        validation.missingFields.map(field => `${field} is required`)
      );
    }
    
    next();
  };
};

/**
 * Validate user creation data
 */
const validateUserCreation = (req, res, next) => {
  const { username, email, password, fullName, role } = req.body;
  const errors = [];
  
  // Required fields validation
  const requiredValidation = validateRequiredFields(req.body, 
    ['username', 'email', 'password', 'fullName', 'role']
  );
  
  if (!requiredValidation.isValid) {
    errors.push(...requiredValidation.missingFields.map(field => `${field} is required`));
  }
  
  // Email validation
  if (email && !isValidEmail(email)) {
    errors.push('Invalid email format');
  }
  
  // Password validation
  if (password) {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }
  
  // Username length validation
  if (username && (username.length < 3 || username.length > 50)) {
    errors.push('Username must be between 3 and 50 characters');
  }
  
  // Full name length validation
  if (fullName && (fullName.length < 2 || fullName.length > 100)) {
    errors.push('Full name must be between 2 and 100 characters');
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }
  
  next();
};

/**
 * Validate ticket creation data
 */
const validateTicketCreation = (req, res, next) => {
  const { userId, drawId, bets, totalAmount } = req.body;
  const errors = [];
  
  // Debug: Log validation input
  console.log('Validation input:', {
    userId,
    drawId,
    totalAmount,
    betsType: typeof bets,
    betsIsArray: Array.isArray(bets),
    betsLength: bets?.length,
    betsContent: bets
  });
  
  // Required fields validation
  const requiredValidation = validateRequiredFields(req.body, 
    ['userId', 'drawId', 'bets', 'totalAmount']
  );
  
  if (!requiredValidation.isValid) {
    errors.push(...requiredValidation.missingFields.map(field => `${field} is required`));
  }
  
  // Validate bets array
  if (bets) {
    if (!Array.isArray(bets) || bets.length === 0) {
      errors.push('Bets must be a non-empty array');
    } else {
      bets.forEach((bet, index) => {
        console.log(`Validating bet ${index}:`, {
          betCombination: bet.betCombination,
          type: typeof bet.betCombination,
          length: bet.betCombination?.length,
          isValid: isValidBetCombination(bet.betCombination)
        });
        
        // More flexible validation - accept and normalize bet combinations
        if (!bet.betCombination) {
          errors.push(`Bet combination is required at index ${index}`);
        } else {
          // Normalize to 3 digits (pad with zeros if needed)
          const normalized = bet.betCombination.toString().padStart(3, '0');
          if (!/^\d{1,3}$/.test(bet.betCombination.toString())) {
            errors.push(`Invalid bet combination at index ${index}: "${bet.betCombination}" (must be 1-3 digits)`);
          } else {
            // Update the bet combination to normalized format
            bet.betCombination = normalized;
          }
        }
        
        if (!bet.betAmount) {
          errors.push(`Bet amount is required at index ${index}`);
        } else {
          const amountValidation = validateBetAmount(bet.betAmount);
          if (!amountValidation.isValid) {
            errors.push(`${amountValidation.error} at index ${index}`);
          }
        }
        
        if (!bet.betType) {
          errors.push(`Bet type is required at index ${index}`);
        }
      });
    }
  }
  
  // Validate total amount
  if (totalAmount && (isNaN(totalAmount) || totalAmount <= 0)) {
    errors.push('Total amount must be a positive number');
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }
  
  next();
};

/**
 * Validate ticket number parameter
 */
const validateTicketNumber = (req, res, next) => {
  const { ticketNumber } = req.params;
  
  if (!ticketNumber) {
    return sendValidationError(res, ['Ticket number is required']);
  }
  
  if (!isValidTicketNumber(ticketNumber)) {
    return sendValidationError(res, ['Invalid ticket number format. Must be 17 digits.']);
  }
  
  next();
};

/**
 * Validate pagination parameters
 */
const validatePaginationParams = (req, res, next) => {
  const { page, limit } = req.query;
  
  const validation = validatePagination(page, limit);
  
  // Add validated params to request
  req.pagination = validation;
  
  next();
};

/**
 * Validate date range parameters
 */
const validateDateRange = (req, res, next) => {
  const { startDate, endDate } = req.query;
  const errors = [];
  
  if (startDate && isNaN(Date.parse(startDate))) {
    errors.push('Invalid start date format');
  }
  
  if (endDate && isNaN(Date.parse(endDate))) {
    errors.push('Invalid end date format');
  }
  
  if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
    errors.push('Start date must be before end date');
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }
  
  next();
};

/**
 * Validate login credentials
 */
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;
  const errors = [];
  
  if (!username || !username.trim()) {
    errors.push('Username is required');
  }
  
  if (!password || !password.trim()) {
    errors.push('Password is required');
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }
  
  next();
};

/**
 * Validate password change request
 */
const validatePasswordChange = (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const errors = [];
  
  if (!currentPassword) {
    errors.push('Current password is required');
  }
  
  if (!newPassword) {
    errors.push('New password is required');
  }
  
  if (!confirmPassword) {
    errors.push('Password confirmation is required');
  }
  
  if (newPassword && confirmPassword && newPassword !== confirmPassword) {
    errors.push('New password and confirmation do not match');
  }
  
  if (newPassword) {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }
  }
  
  if (errors.length > 0) {
    return sendValidationError(res, errors);
  }
  
  next();
};

/**
 * Sanitize request body
 */
const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitizeValue = (value) => {
      if (typeof value === 'string') {
        return value.trim().replace(/[<>]/g, ''); // Basic XSS prevention
      }
      if (Array.isArray(value)) {
        return value.map(item => sanitizeValue(item));
      }
      if (typeof value === 'object' && value !== null) {
        const sanitized = {};
        for (const [key, val] of Object.entries(value)) {
          sanitized[key] = sanitizeValue(val);
        }
        return sanitized;
      }
      return value;
    };
    
    req.body = sanitizeValue(req.body);
  }
  
  next();
};

module.exports = {
  validateRequired,
  validateUserCreation,
  validateTicketCreation,
  validateTicketNumber,
  validatePaginationParams,
  validateDateRange,
  validateLogin,
  validatePasswordChange,
  sanitizeBody
};
