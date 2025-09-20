const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { createVersionRateLimit } = require('./apiVersioning');

// Enhanced security middleware for different API versions
const createSecurityMiddleware = (version = 'v1') => {
  const config = {
    v1: {
      // Basic security for v1
      helmet: {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
          },
        },
        crossOriginEmbedderPolicy: false
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000,
        message: 'Too many requests from this IP, please try again later.'
      }
    },
    v2: {
      // Enhanced security for v2
      helmet: {
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "wss:", "ws:"],
            fontSrc: ["'self'", "https:", "data:"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
          },
        },
        crossOriginEmbedderPolicy: true,
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      },
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 500, // Stricter limits
        message: 'Rate limit exceeded for API v2. Please upgrade your plan or contact support.'
      }
    }
  };

  const versionConfig = config[version] || config.v1;

  return {
    // Helmet configuration
    helmet: helmet(versionConfig.helmet),

    // Rate limiting
    rateLimit: createVersionRateLimit(version),

    // Additional security headers
    securityHeaders: (req, res, next) => {
      // API version specific headers
      res.set('X-API-Version', version);
      res.set('X-Content-Type-Options', 'nosniff');
      res.set('X-Frame-Options', 'DENY');
      res.set('X-XSS-Protection', '1; mode=block');
      res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      
      // Enhanced headers for v2+
      if (version >= 'v2') {
        res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        res.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        res.set('X-Permitted-Cross-Domain-Policies', 'none');
      }

      next();
    },

    // Request validation
    validateRequest: (req, res, next) => {
      // Check for suspicious patterns
      const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /union\s+select/i,
        /drop\s+table/i,
        /insert\s+into/i,
        /delete\s+from/i
      ];

      const requestBody = JSON.stringify(req.body);
      const requestQuery = JSON.stringify(req.query);
      const requestParams = JSON.stringify(req.params);

      for (const pattern of suspiciousPatterns) {
        if (pattern.test(requestBody) || pattern.test(requestQuery) || pattern.test(requestParams)) {
          return res.status(400).json({
            success: false,
            message: 'Suspicious request detected',
            code: 'SUSPICIOUS_REQUEST'
          });
        }
      }

      next();
    },

    // IP whitelist for admin endpoints
    adminIPWhitelist: (req, res, next) => {
      const adminIPs = process.env.ADMIN_IP_WHITELIST?.split(',') || [];
      const clientIP = req.ip || req.connection.remoteAddress;

      if (adminIPs.length > 0 && !adminIPs.includes(clientIP)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied from this IP address',
          code: 'IP_NOT_WHITELISTED'
        });
      }

      next();
    },

    // API key validation for external services
    apiKeyValidation: (req, res, next) => {
      const apiKey = req.header('X-API-Key');
      const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];

      if (!apiKey || !validApiKeys.includes(apiKey)) {
        return res.status(401).json({
          success: false,
          message: 'Valid API key required',
          code: 'INVALID_API_KEY'
        });
      }

      next();
    }
  };
};

// Endpoint-specific rate limiting
const createEndpointRateLimit = (endpoint, version = 'v1') => {
  const limits = {
    v1: {
      '/auth/login': { windowMs: 15 * 60 * 1000, max: 5 },
      '/auth/register': { windowMs: 60 * 60 * 1000, max: 3 },
      '/tickets': { windowMs: 1 * 60 * 1000, max: 10 },
      '/balance/load': { windowMs: 5 * 60 * 1000, max: 3 }
    },
    v2: {
      '/auth/login': { windowMs: 15 * 60 * 1000, max: 3 },
      '/auth/register': { windowMs: 60 * 60 * 1000, max: 1 },
      '/tickets': { windowMs: 1 * 60 * 1000, max: 5 },
      '/balance/load': { windowMs: 5 * 60 * 1000, max: 1 }
    }
  };

  const versionLimits = limits[version] || limits.v1;
  const endpointLimit = versionLimits[endpoint] || { windowMs: 15 * 60 * 1000, max: 100 };

  return rateLimit({
    ...endpointLimit,
    keyGenerator: (req) => {
      return `${req.ip}:${version}:${endpoint}:${req.user?.id || 'anonymous'}`;
    },
    message: `Rate limit exceeded for ${endpoint} endpoint`,
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Audit logging middleware
const auditLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  console.log(`[AUDIT] ${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${req.ip} - User: ${req.user?.id || 'anonymous'}`);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    console.log(`[AUDIT] ${new Date().toISOString()} - Response: ${res.statusCode} - Duration: ${duration}ms`);
    
    originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Request size limiting
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.header('content-length') || '0');
    const maxBytes = parseInt(maxSize) * 1024 * 1024; // Convert MB to bytes

    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        message: `Request too large. Maximum size allowed: ${maxSize}`,
        code: 'REQUEST_TOO_LARGE'
      });
    }

    next();
  };
};

module.exports = {
  createSecurityMiddleware,
  createEndpointRateLimit,
  auditLogger,
  requestSizeLimit
};




