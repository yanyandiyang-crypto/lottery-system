const rateLimit = require('express-rate-limit');

// API Version Configuration
const API_VERSIONS = {
  v1: {
    name: 'v1',
    status: 'stable',
    deprecationDate: null,
    sunsetDate: null,
    features: ['basic_auth', 'jwt', 'basic_crud'],
    security: {
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000, // requests per window
        message: 'Too many requests from this IP, please try again later.'
      },
      requireAuth: true,
      allowCORS: true
    }
  },
  v2: {
    name: 'v2',
    status: 'beta',
    deprecationDate: null,
    sunsetDate: null,
    features: ['enhanced_auth', 'jwt', 'advanced_crud', 'rate_limiting', 'audit_logging'],
    security: {
      rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 500, // Stricter limits for v2
        message: 'Rate limit exceeded for API v2'
      },
      requireAuth: true,
      requireMFA: false, // Future feature
      allowCORS: true,
      encryption: false // Future feature
    }
  }
};

// Version-specific rate limiting
const createVersionRateLimit = (version) => {
  const config = API_VERSIONS[version];
  if (!config) {
    return rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      message: 'Unknown API version'
    });
  }

  return rateLimit({
    ...config.security.rateLimit,
    keyGenerator: (req) => {
      // Include API version in rate limit key
      return `${req.ip}:${version}:${req.user?.id || 'anonymous'}`;
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// API Version Middleware
const apiVersioning = (req, res, next) => {
  const version = req.apiVersion || 'v1';
  const config = API_VERSIONS[version];

  if (!config) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported API version',
      supportedVersions: Object.keys(API_VERSIONS),
      requestedVersion: version
    });
  }

  // Add version info to request
  req.apiConfig = config;

  // Add version headers to response
  res.set('API-Version', version);
  res.set('X-API-Version', version);
  res.set('X-API-Status', config.status);

  // Add deprecation warnings
  if (config.deprecationDate) {
    res.set('X-API-Deprecation-Date', config.deprecationDate);
    res.set('X-API-Deprecation-Warning', `API version ${version} is deprecated and will be removed on ${config.sunsetDate}`);
  }

  // Add sunset warnings
  if (config.sunsetDate) {
    res.set('X-API-Sunset-Date', config.sunsetDate);
    res.set('X-API-Sunset-Warning', `API version ${version} will be sunset on ${config.sunsetDate}`);
  }

  next();
};

// Version-specific security middleware
const versionSecurity = (req, res, next) => {
  const version = req.apiVersion || 'v1';
  const config = API_VERSIONS[version];

  if (!config) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported API version'
    });
  }

  // Apply version-specific security rules
  // Allow public access to login and health check routes
  const publicRoutes = ['/api/v1/auth/login', '/api/v2/auth/login', '/api/v1/health', '/api/v2/health'];
  const isPublicRoute = publicRoutes.some(route => req.path.startsWith(route));
  
  if (config.security.requireAuth && !req.user && !isPublicRoute) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required for this API version',
      apiVersion: version
    });
  }

  // Future: Add MFA requirement for v2+
  if (config.security.requireMFA && !req.user?.mfaVerified) {
    return res.status(403).json({
      success: false,
      message: 'Multi-factor authentication required for this API version',
      apiVersion: version
    });
  }

  next();
};

// API Version Info Endpoint
const getVersionInfo = (req, res) => {
  const version = req.apiVersion || 'v1';
  const config = API_VERSIONS[version];

  if (!config) {
    return res.status(400).json({
      success: false,
      message: 'Unsupported API version',
      supportedVersions: Object.keys(API_VERSIONS)
    });
  }

  res.json({
    success: true,
    data: {
      version: config.name,
      status: config.status,
      features: config.features,
      security: {
        rateLimit: config.security.rateLimit,
        requireAuth: config.security.requireAuth,
        allowCORS: config.security.allowCORS
      },
      deprecation: {
        deprecationDate: config.deprecationDate,
        sunsetDate: config.sunsetDate
      },
      documentation: `/api/${version}/docs`,
      changelog: `/api/${version}/changelog`
    }
  });
};

// List all available versions
const listVersions = (req, res) => {
  const versions = Object.keys(API_VERSIONS).map(version => ({
    version,
    ...API_VERSIONS[version]
  }));

  res.json({
    success: true,
    data: {
      versions,
      current: 'v1',
      latest: 'v2',
      deprecated: versions.filter(v => v.deprecationDate),
      sunset: versions.filter(v => v.sunsetDate)
    }
  });
};

module.exports = {
  apiVersioning,
  versionSecurity,
  createVersionRateLimit,
  getVersionInfo,
  listVersions,
  API_VERSIONS
};

