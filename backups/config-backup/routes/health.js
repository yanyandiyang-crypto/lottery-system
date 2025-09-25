const express = require('express');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');
const cacheService = require('../services/cacheService');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
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
    
    logger.debug('Health check - Database OK', { responseTime: dbResponseTime });
  } catch (error) {
    health.services.database = { 
      status: 'unhealthy', 
      error: error.message 
    };
    health.status = 'unhealthy';
    
    logger.error('Health check - Database failed', { error: error.message });
  }

  // Socket.IO health check
  try {
    const io = req.app.get('io');
    if (io) {
      health.services.socketio = { 
        status: 'healthy', 
        connections: io.engine.clientsCount 
      };
    } else {
      health.services.socketio = { 
        status: 'unavailable', 
        error: 'Socket.IO not initialized' 
      };
    }
  } catch (error) {
    health.services.socketio = { 
      status: 'unhealthy', 
      error: error.message 
    };
  }

  // Cache service health check
  try {
    const cacheStatus = cacheService.getStatus();
    health.services.cache = {
      status: cacheStatus.connected ? 'healthy' : 'fallback',
      connected: cacheStatus.connected,
      fallbackMode: cacheStatus.fallbackMode,
      configured: cacheStatus.redisConfigured
    };
  } catch (error) {
    health.services.cache = { 
      status: 'unhealthy', 
      error: error.message 
    };
  }

  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Simple ping endpoint
router.get('/ping', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;
