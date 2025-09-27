/**
 * Response Helper Utilities
 * Standardized API response formatting
 */

const { RESPONSE_MESSAGES } = require('./constants');

/**
 * Create a standardized success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
const sendSuccess = (res, data = null, message = RESPONSE_MESSAGES.SUCCESS, statusCode = 200) => {
  const response = {
    success: true,
    message,
    timestamp: new Date().toISOString()
  };

  if (data !== null) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

/**
 * Create a standardized error response
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {*} errors - Detailed error information
 */
const sendError = (res, message = RESPONSE_MESSAGES.SERVER_ERROR, statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Create a paginated response
 * @param {Object} res - Express response object
 * @param {Array} data - Response data array
 * @param {number} total - Total count of items
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} message - Success message
 */
const sendPaginatedResponse = (res, data, total, page, limit, message = RESPONSE_MESSAGES.SUCCESS) => {
  const totalPages = Math.ceil(total / limit);
  
  return sendSuccess(res, {
    items: data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  }, message);
};

/**
 * Handle validation errors
 * @param {Object} res - Express response object
 * @param {Array} validationErrors - Array of validation errors
 */
const sendValidationError = (res, validationErrors) => {
  return sendError(res, RESPONSE_MESSAGES.VALIDATION_ERROR, 400, validationErrors);
};

/**
 * Handle not found errors
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name
 */
const sendNotFound = (res, resource = 'Resource') => {
  return sendError(res, `${resource} not found`, 404);
};

/**
 * Handle unauthorized errors
 * @param {Object} res - Express response object
 */
const sendUnauthorized = (res) => {
  return sendError(res, RESPONSE_MESSAGES.UNAUTHORIZED, 401);
};

/**
 * Handle forbidden errors
 * @param {Object} res - Express response object
 */
const sendForbidden = (res) => {
  return sendError(res, RESPONSE_MESSAGES.FORBIDDEN, 403);
};

/**
 * Handle duplicate entry errors
 * @param {Object} res - Express response object
 * @param {string} resource - Resource name
 */
const sendDuplicateError = (res, resource = 'Resource') => {
  return sendError(res, `${resource} already exists`, 409);
};

module.exports = {
  sendSuccess,
  sendError,
  sendPaginatedResponse,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendDuplicateError
};
