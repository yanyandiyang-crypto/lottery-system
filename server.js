const express = require('express');
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
const authV2Routes = require('./routes/auth-v2');
const userRoutes = require('./routes/users');
const ticketRoutes = require('./routes/tickets');
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

// Import middleware
const authMiddleware = require('./middleware/auth');
const roleMiddleware = require('./middleware/roleCheck');
const errorHandler = require('./middleware/errorHandler');
const { apiVersioning, versionSecurity, getVersionInfo, listVersions } = require('./middleware/apiVersioning');
const { createSecurityMiddleware, auditLogger, requestSizeLimit } = require('./middleware/security');

// Import services
const drawScheduler = require('./services/drawScheduler');
const notificationService = require('./services/notificationService');
const backupService = require('./services/backupService');
const { initSocket } = require('./utils/socket');

const app = express();
const server = http.createServer(app);

// CORS configuration - Define allowed origins first
const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
  "http://localhost:3000", 
  "http://localhost:3002",
  "https://lottery-system-gamma.vercel.app"
];

const io = socketIo(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-API-Version', 'API-Version', 'x-client-version']
}));

// Global security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
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
app.use('/api/v2/auth', authV2Routes);

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
app.use('/api/v1/function-management', authMiddleware, require('./routes/function-management'));
app.use('/api/v1/ticket-templates', authMiddleware, ticketTemplatesRoutes);
app.use('/api/v1/prize-configuration', authMiddleware, prizeConfigurationRoutes);

// Health check routes (no authentication required)
app.use('/api/v1/health', healthRoutes);

// Setup routes (no authentication required)
app.use('/api/v1', setupRoutes);

// Backup management routes (protected)
app.use('/api/v1/backup', authMiddleware, backupRoutes);

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


// Socket.IO for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user to their role-based room
  socket.on('join-room', (data) => {
    const { userId, role } = data;
    socket.join(`user-${userId}`);
    socket.join(`role-${role}`);
    console.log(`User ${userId} joined role room: ${role}`);
  });

  // Handle ticket creation notifications
  socket.on('ticket-created', (data) => {
    // Broadcast to coordinators and admins
    socket.to('role-coordinator').to('role-admin').to('role-superadmin').emit('new-ticket', data);
  });

  // Handle winning ticket notifications
  socket.on('winning-ticket', (data) => {
    // Broadcast to all relevant users
    socket.to(`user-${data.agentId}`).emit('you-won', data);
    socket.to(`user-${data.coordinatorId}`).emit('agent-won', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Initialize socket utility
initSocket(io);

// Make io available to other modules
app.set('io', io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

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

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 NewBetting Lottery System running on port ${PORT}`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌏 Timezone: ${process.env.TZ || 'UTC'}`);
  
  // Initialize services
  drawScheduler.initialize();
  backupService.scheduleBackups();
  notificationService.initialize(io);
});

module.exports = { app, server, io, prisma };
