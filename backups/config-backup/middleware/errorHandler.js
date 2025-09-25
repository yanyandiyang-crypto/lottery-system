const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('Error:', err);

  // Prisma errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        error.message = 'Duplicate field value. This record already exists.';
        error.statusCode = 400;
        break;
      case 'P2025':
        error.message = 'Record not found.';
        error.statusCode = 404;
        break;
      case 'P2003':
        error.message = 'Foreign key constraint failed.';
        error.statusCode = 400;
        break;
      default:
        error.message = 'Database error occurred.';
        error.statusCode = 500;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token.';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired.';
    error.statusCode = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error.message = message;
    error.statusCode = 400;
  }

  // Cast errors
  if (err.name === 'CastError') {
    error.message = 'Invalid ID format.';
    error.statusCode = 400;
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;


