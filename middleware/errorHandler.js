/**
 * Enhanced Error Handler Middleware
 * Centralized error handling with proper logging and response formatting
 */

const { sendError } = require('../utils/responseHelper');
const { RESPONSE_MESSAGES } = require('../utils/constants');

/**
 * Main error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Enhanced error logging
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    timestamp: new Date().toISOString()
  });

  // Prisma/Database errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        const duplicateField = err.meta?.target?.[0] || 'field';
        return sendError(res, `${duplicateField} already exists`, 409);
      
      case 'P2025':
        return sendError(res, 'Record not found', 404);
      
      case 'P2003':
        return sendError(res, 'Invalid reference to related record', 400);
      
      case 'P2014':
        return sendError(res, 'Invalid ID provided', 400);
      
      case 'P2021':
        return sendError(res, 'Table does not exist', 500);
      
      case 'P2022':
        return sendError(res, 'Column does not exist', 500);
      
      default:
        return sendError(res, 'Database operation failed', 500);
    }
  }

  // JWT Authentication errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid authentication token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Authentication token has expired', 401);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return sendError(res, message, 400);
  }

  // Cast errors (invalid ID format)
  if (err.name === 'CastError') {
    return sendError(res, 'Invalid ID format provided', 400);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 'File size too large', 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return sendError(res, 'Unexpected file field', 400);
  }

  // Rate limiting errors
  if (err.status === 429) {
    return sendError(res, 'Too many requests, please try again later', 429);
  }

  // Syntax errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 'Invalid JSON format in request body', 400);
  }

  // Custom application errors
  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode || 400);
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || RESPONSE_MESSAGES.SERVER_ERROR;

  return sendError(res, message, statusCode, 
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null
  );
};

/**
 * Handle async errors in routes
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Handle 404 errors
 */
const notFoundHandler = (req, res, next) => {
  return sendError(res, `Route ${req.originalUrl} not found`, 404);
};

/**
 * Custom error class for operational errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  asyncHandler,
  notFoundHandler,
  AppError
};


