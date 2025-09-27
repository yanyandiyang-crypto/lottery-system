const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

// Database connection for storing rate limit data
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Custom store for rate limiting using PostgreSQL
class PostgreSQLStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:';
    this.windowMs = options.windowMs || 900000; // 15 minutes
  }

  async increment(key, cb) {
    const now = Date.now();
    const window = Math.floor(now / this.windowMs);
    const dbKey = `${this.prefix}${key}:${window}`;
    
    try {
      const client = await pool.connect();
      
      try {
        // Try to increment or insert
        const result = await client.query(`
          INSERT INTO rate_limits (key, count, expires_at)
          VALUES ($1, 1, $2)
          ON CONFLICT (key) 
          DO UPDATE SET count = rate_limits.count + 1
          RETURNING count
        `, [dbKey, new Date(now + this.windowMs)]);
        
        const count = result.rows[0].count;
        
        // Clean up expired entries
        await client.query(`
          DELETE FROM rate_limits 
          WHERE expires_at < NOW()
        `);
        
        cb(null, count, new Date(now + this.windowMs));
      } finally {
        client.release();
      }
    } catch (error) {
      cb(error);
    }
  }

  async decrement(key) {
    // Not implemented for this use case
  }

  async resetKey(key) {
    try {
      const client = await pool.connect();
      
      try {
        await client.query(`
          DELETE FROM rate_limits 
          WHERE key LIKE $1
        `, [`${this.prefix}${key}:%`]);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error resetting rate limit key:', error);
    }
  }
}

// Create rate limit table if it doesn't exist
async function initializeRateLimitTable() {
  try {
    const client = await pool.connect();
    
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS rate_limits (
          key VARCHAR(255) PRIMARY KEY,
          count INTEGER DEFAULT 1,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      
      // Create index for cleanup
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_rate_limits_expires 
        ON rate_limits(expires_at)
      `);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error initializing rate limit table:', error);
  }
}

// Initialize the table
initializeRateLimitTable();

// Authentication rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 5, // 5 attempts per 30s
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 30 seconds.',
    retryAfter: '30 seconds'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please wait 30 seconds.',
      retryAfter: '30 seconds'
    });
  }
});

// API rate limiter (moderate)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Ticket creation rate limiter (strict)
const ticketLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 tickets per minute
  message: {
    success: false,
    message: 'Too many ticket creation attempts. Please slow down.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin operations rate limiter
const adminLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 50, // 50 admin operations per 5 minutes
  message: {
    success: false,
    message: 'Too many admin operations. Please slow down.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Password reset rate limiter (very strict)
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts. Please try again in 1 hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// IP-based rate limiter for suspicious activity
const suspiciousActivityLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 failed attempts per hour per IP
  message: {
    success: false,
    message: 'Suspicious activity detected. Access temporarily restricted.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed requests
  handler: async (req, res) => {
    // Log suspicious activity
    try {
      const client = await pool.connect();
      
      try {
        await client.query(`
          INSERT INTO login_audit (user_id, username, ip_address, user_agent, reason, status)
          VALUES (NULL, 'anonymous', $1, $2, 'Rate limit exceeded - suspicious activity', 'failed')
        `, [req.ip, req.get('User-Agent')]);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('Error logging suspicious activity:', error);
    }
    
    res.status(429).json({
      success: false,
      message: 'Suspicious activity detected. Access temporarily restricted.',
      retryAfter: '1 hour'
    });
  }
});

// Dynamic rate limiter based on user role
const createRoleBasedLimiter = (roleLimits) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: (req) => {
      const userRole = req.user?.role || 'guest';
      return roleLimits[userRole] || 10; // Default limit
    },
    message: {
      success: false,
      message: 'Rate limit exceeded for your role.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for superadmin
      return req.user?.role === 'superadmin';
    }
  });
};

// Role-based limits
const roleLimits = {
  'superadmin': 1000,
  'admin': 500,
  'area_coordinator': 200,
  'coordinator': 100,
  'agent': 50,
  'operator': 30,
  'guest': 10
};

const roleBasedLimiter = createRoleBasedLimiter(roleLimits);

// Utility function to reset rate limits for a specific IP or user
const resetRateLimit = async (identifier, type = 'ip') => {
  try {
    const client = await pool.connect();
    
    try {
      if (type === 'ip') {
        await client.query(`
          DELETE FROM rate_limits 
          WHERE key LIKE $1
        `, [`rl:${identifier}:%`]);
      } else if (type === 'user') {
        await client.query(`
          DELETE FROM rate_limits 
          WHERE key LIKE $1
        `, [`rl:user:${identifier}:%`]);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error resetting rate limit:', error);
  }
};

module.exports = {
  authLimiter,
  apiLimiter,
  ticketLimiter,
  adminLimiter,
  passwordResetLimiter,
  suspiciousActivityLimiter,
  roleBasedLimiter,
  resetRateLimit,
  PostgreSQLStore
};
