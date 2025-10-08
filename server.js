
// DEPLOYMENT VERSION: 2.0.0 - 2025-09-27T12:03:10.316Z
const express = require('express');
// Sentry for error tracking and tracing
const Sentry = require('@sentry/node');
const { captureException } = require('@sentry/node');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const socketIo = require('socket.io');
const http = require('http');
require('dotenv').config();

// Import logger and metrics
const logger = require('./utils/logger');
const { register } = require('./utils/metrics');
const metricsMiddleware = require('./middleware/metrics');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users-clean');
const ticketRoutes = require('./routes/tickets-clean');
const drawRoutes = require('./routes/draws');
const salesRoutes = require('./routes/sales');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const balanceRoutes = require('./routes/balance');
const balanceManagementRoutes = require('./routes/balance-management');
const betLimitsRoutes = require('./routes/bet-limits');
const drawResultsRoutes = require('./routes/draw-results');
const ticketsReprintRoutes = require('./routes/tickets-reprint');
const userManagementRoutes = require('./routes/user-management');
const ticketTemplatesRoutes = require('./routes/ticket-templates');
const prizeConfigurationRoutes = require('./routes/prize-configuration');
const healthRoutes = require('./routes/health');
const backupRoutes = require('./routes/backup');
const setupRoutes = require('./routes/setup');
const auditRoutes = require('./routes/audit');
const transactionsRoutes = require('./routes/transactions');
const databaseResetRoutes = require('./routes/database-reset');
const ticketVerificationRoutes = require('./routes/ticket-verification-clean');
const winningReportsRoutes = require('./routes/winning-reports-proper');
const claimApprovalsRoutes = require('./routes/claim-approvals-simple');

// Import middleware
const authMiddleware = require('./middleware/auth');
const roleMiddleware = require('./middleware/roleCheck');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { sanitizeBody } = require('./middleware/validation');
const { apiVersioning, versionSecurity, getVersionInfo, listVersions } = require('./middleware/apiVersioning');
const { createSecurityMiddleware, auditLogger, requestSizeLimit } = require('./middleware/security');
const requestId = require('./middleware/requestId');
const { apiLimiter, roleBasedLimiter } = require('./middleware/rateLimiting');

// Import services
const drawScheduler = require('./services/drawScheduler');
const notificationService = require('./services/notificationService');
const backupService = require('./services/backupService');
const { initSocket } = require('./utils/socket');

// Initialize Sentry (conditionally, only if DSN provided)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENV || process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
  });
}

const app = express();
const server = http.createServer(app);

// CORS configuration - Using pattern matching for Cloudflare Pages
// Allows: *.lottery-system.pages.dev and http://localhost:*
console.log('CORS: Using wildcard pattern for Cloudflare Pages deployments');
console.log('CORS: Allowed patterns: *.lottery-system.pages.dev, http://localhost:*');

// Socket.IO DISABLED - Preventing disconnection issues
const io = {
  on: () => {},
  emit: () => {},
  to: () => ({ emit: () => {} }),
  adapter: () => {},
  engine: { opts: { transports: [], cors: {} } }
};

// const io = socketIo(server, {
//   cors: {
//     origin: allowedOrigins,
//     methods: ["GET", "POST"]
//   },
//   // Render-compatible Socket.IO configuration
//   transports: ["websocket", "polling"],
//   allowEIO3: true,
//   // Socket.IO timeout configuration
//   pingTimeout: 60000,        // 60 seconds
//   pingInterval: 25000,       // 25 seconds
//   upgradeTimeout: 10000,     // 10 seconds
//   // Connection timeout
//   connectTimeout: 45000,     // 45 seconds
//   // Heartbeat configuration
//   heartbeatInterval: 25000   // 25 seconds
// });

// Socket.IO Redis adapter DISABLED
// try {
//   if (process.env.REDIS_URL) {
//     const { createAdapter } = require('@socket.io/redis-adapter');
//     const { createClient } = require('redis');
//     const pubClient = createClient({ url: process.env.REDIS_URL });
//     const subClient = pubClient.duplicate();
//     pubClient.on('error', (err) => logger.error('Redis pubClient error', { error: err.message }));
//     subClient.on('error', (err) => logger.error('Redis subClient error', { error: err.message }));
//     Promise.all([pubClient.connect(), subClient.connect()])
//       .then(() => {
//         io.adapter(createAdapter(pubClient, subClient));
//         logger.info('Socket.IO Redis adapter attached');
//       })
//       .catch((e) => logger.error('Failed to connect Redis adapter', { error: e.message }));
//   }
// } catch (e) {
//   logger.error('Socket.IO Redis adapter initialization failed', { error: e.message });
// }

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Sentry request handler must be the first middleware on the app
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.requestHandler());
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin matches allowed patterns
    const isCloudflarePages = origin.endsWith('.lottery-system.pages.dev') || origin === 'https://lottery-system.pages.dev';
    const isLocalhost = origin === 'http://localhost:3002' || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
    
    console.log('CORS: Checking origin:', origin);
    console.log('CORS: Cloudflare Pages?', isCloudflarePages);
    console.log('CORS: Localhost?', isLocalhost);
    
    if (isCloudflarePages || isLocalhost) {
      console.log('CORS: Origin allowed:', origin);
      callback(null, true);
    } else {
      console.log('CORS: Blocked origin:', origin);
      callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-API-Version', 'API-Version', 'x-client-version', 'cache-control']
}));

// Global security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));


// Explicit preflight handling for CORS
app.options('*', (req, res) => {
  console.log('CORS: Handling preflight request for:', req.headers.origin);
  const origin = req.headers.origin;
  
  // Check if origin matches allowed patterns
  const isCloudflarePages = origin && (origin.endsWith('.lottery-system.pages.dev') || origin === 'https://lottery-system.pages.dev');
  const isLocalhost = origin && (origin === 'http://localhost:3002' || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'));
  
  if (isCloudflarePages || isLocalhost) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Version, API-Version, x-client-version, cache-control');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
  } else {
    res.status(403).end();
  }
});
// Handle preflight requests explicitly
app.options('*', (req, res) => {
  console.log('CORS: Handling preflight request for:', req.headers.origin);
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Version, API-Version, x-client-version, cache-control');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});
app.use(requestSizeLimit('10mb'));

// Request logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message) => {
      logger.info(message.trim());
    }
  }
}));

// Metrics middleware
app.use(metricsMiddleware);

// API Versioning
app.use('/api', apiVersioning);

// Version-specific security middleware (basic security only)
app.use('/api/v1', createSecurityMiddleware('v1').helmet);
app.use('/api/v1', createSecurityMiddleware('v1').rateLimit);
app.use('/api/v1', createSecurityMiddleware('v1').securityHeaders);

app.use('/api/v2', createSecurityMiddleware('v2').helmet);
app.use('/api/v2', createSecurityMiddleware('v2').rateLimit);
app.use('/api/v2', createSecurityMiddleware('v2').securityHeaders);

// Audit logging for all API requests
app.use('/api', auditLogger);

// Remove version security middleware that checks req.user before auth
// app.use('/api', versionSecurity);

// Body parsing middleware
app.use(compression());
app.use(requestId);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

// API Version info endpoints
app.get('/api/versions', listVersions);
app.get('/api/v1/info', (req, res) => {
  req.apiVersion = 'v1';
  getVersionInfo(req, res);
});
app.get('/api/v2/info', (req, res) => {
  req.apiVersion = 'v2';
  getVersionInfo(req, res);
});

// API Versioning Middleware
app.use('/api', (req, res, next) => {
  // Extract version from URL
  const version = req.path.split('/')[2] || 'v1';
  req.apiVersion = version;
  
  // Add version to response headers
  res.set('API-Version', version);
  res.set('X-API-Version', version);
  
  next();
});

// API Routes with Versioning
// Auth routes (public)
app.use('/api/v1/auth', authRoutes);
// V2 auth routes removed - using V1 only

// Public ticket verification routes (MUST come before protected routes)
app.use('/api/v1/tickets', ticketVerificationRoutes);

// Protected v1 routes
app.use('/api/v1/users', authMiddleware, userRoutes);
app.use('/api/v1/admin-users', authMiddleware, require('./routes/admin-users'));
app.use('/api/v1/user-management', authMiddleware, userManagementRoutes);
app.use('/api/v1/tickets', authMiddleware, ticketRoutes);
app.use('/api/v1/tickets', authMiddleware, ticketsReprintRoutes);
app.use('/api/v1/draws', authMiddleware, drawRoutes);
app.use('/api/v1/sales', authMiddleware, salesRoutes);
app.use('/api/v1/reports', authMiddleware, reportRoutes);
app.use('/api/v1/notifications', authMiddleware, notificationRoutes);
app.use('/api/v1/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/v1/balance', authMiddleware, balanceRoutes);
app.use('/api/v1/balance-management', authMiddleware, balanceManagementRoutes);
app.use('/api/v1/bet-limits', authMiddleware, betLimitsRoutes);
app.use('/api/v1/draw-results', authMiddleware, drawResultsRoutes);
app.use('/api/v1/ticket-templates', authMiddleware, ticketTemplatesRoutes);
app.use('/api/v1/prize-configuration', authMiddleware, prizeConfigurationRoutes);
app.use('/api/v1/winning-reports', authMiddleware, winningReportsRoutes);
app.use('/api/v1/claim-approvals', authMiddleware, claimApprovalsRoutes);

// Direct health endpoints for Render (no authentication required)
app.get('/v1/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '3.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {}
  };

  try {
    // Database health check
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - start;
    
    health.services.database = { 
      status: 'healthy', 
      responseTime: `${dbResponseTime}ms` 
    };
  } catch (error) {
    health.services.database = { 
      status: 'unhealthy', 
      error: error.message 
    };
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Simple ping endpoint for Render
app.get('/v1/ping', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

// Health check routes (no authentication required)
app.use('/api/v1/health', healthRoutes);

// Setup routes (no authentication required)
app.use('/api/v1', setupRoutes);

// Backup management routes (protected)
app.use('/api/v1/backup', authMiddleware, backupRoutes);

// Audit routes (protected with role-based rate limiting)
app.use('/api/v1/audit', authMiddleware, roleBasedLimiter, auditRoutes);

// Transactions routes (protected)
app.use('/api/v1/transactions', authMiddleware, transactionsRoutes);

// Database reset routes (no authentication for setup purposes)
app.use('/api/database-reset', databaseResetRoutes);

// Metrics endpoint (no authentication required)
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    logger.error('Metrics endpoint error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate metrics' });
  }
});

// Sentry debug endpoint (non-production only)
if ((process.env.NODE_ENV || 'development') !== 'production') {
  app.get('/api/v1/debug/sentry', (req, res, next) => {
    const err = new Error('Sentry debug test error');
    err.context = { requestedBy: req.ip, at: new Date().toISOString() };
    next(err);
  });
}


// Socket.IO WebSocket debugging - DISABLED
// io.engine.on("connection_error", (err) => {
//   console.log("Socket.IO connection error:", err.req, err.code, err.message, err.context);
// });

// io.engine.on("upgrade_error", (err) => {
//   console.log("Socket.IO upgrade error:", err.req, err.code, err.message, err.context);
// });

console.log('Socket.IO DISABLED - Real-time features turned off');
// console.log('Socket.IO server configured with transports:', io.engine.opts.transports);
// console.log('Socket.IO CORS origins:', io.engine.opts.cors?.origin);
// // Socket.IO for real-time features
// io.on('connection', (socket) => {
//   console.log('User connected:', socket.id);

//   // Join user to their role-based room
//   socket.on('join-room', (data) => {
//     const { userId, role } = data;
//     socket.join(`user-${userId}`);
//     socket.join(`role-${role}`);
//     console.log(`User ${userId} joined role room: ${role}`);
//   });

//   // Handle ticket creation notifications
//   socket.on('ticket-created', (data) => {
//     // Broadcast to coordinators and admins
//     socket.to('role-coordinator').to('role-admin').to('role-superadmin').emit('new-ticket', data);
//   });

//   // Handle winning ticket notifications
//   socket.on('winning-ticket', (data) => {
//     // Broadcast to all relevant users
//     socket.to(`user-${data.agentId}`).emit('you-won', data);
//     socket.to(`user-${data.coordinatorId}`).emit('agent-won', data);
//   });

//   socket.on('disconnect', () => {
//     console.log('User disconnected:', socket.id);
//   });
// });

// Initialize socket utility
initSocket(io);

// Make io available to other modules
app.set('io', io);

// Error handling middleware
// Sentry error handler should come before any other error middleware
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// 404 handler (must come before error handler)
app.use('*', notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('Process terminated');
  });
});

// Start server with keep-alive settings
server.listen(PORT, () => {
  logger.info(`🚀 NewBetting Lottery System running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌏 Timezone: ${process.env.TZ || 'UTC'}`);
  console.log(`🕐 Server started at: ${new Date().toISOString()}`);
  
  // Initialize services
  drawScheduler.initialize();
  backupService.scheduleBackups();
  // notificationService.initialize(io); // DISABLED - Socket.IO turned off
});

// Keep-alive settings for mobile connections
server.keepAliveTimeout = 120000; // 2 minutes
server.headersTimeout = 125000; // 2 minutes + 5 seconds

module.exports = { app, server, io, prisma };
