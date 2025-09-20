const Redis = require('ioredis');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.fallbackMode = true; // Start in fallback mode
    
    this.initializeRedis();
  }

  async initializeRedis() {
    try {
      // Only initialize Redis if REDIS_HOST is configured
      if (process.env.REDIS_HOST || process.env.REDIS_URL) {
        this.client = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
          retryDelayOnFailover: 100,
          maxRetriesPerRequest: 3,
          lazyConnect: true,
          connectTimeout: 5000,
          commandTimeout: 5000
        });

        this.client.on('error', (error) => {
          logger.warn('Redis connection error', { error: error.message });
          this.isConnected = false;
          this.fallbackMode = true;
        });

        this.client.on('connect', () => {
          logger.info('Redis connected successfully');
          this.isConnected = true;
          this.fallbackMode = false;
        });

        this.client.on('ready', () => {
          logger.info('Redis is ready');
          this.isConnected = true;
          this.fallbackMode = false;
        });

        // Test connection
        await this.client.ping();
        logger.info('Redis cache service initialized');
      } else {
        logger.info('Redis not configured, running in fallback mode');
      }
    } catch (error) {
      logger.warn('Redis initialization failed, running in fallback mode', { error: error.message });
      this.fallbackMode = true;
      this.isConnected = false;
    }
  }

  async get(key) {
    if (this.fallbackMode || !this.isConnected) {
      logger.debug('Cache miss (fallback mode)', { key });
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        logger.debug('Cache hit', { key });
        return JSON.parse(value);
      }
      logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, ttl = 300) {
    if (this.fallbackMode || !this.isConnected) {
      logger.debug('Cache set skipped (fallback mode)', { key });
      return true;
    }

    try {
      await this.client.setex(key, ttl, JSON.stringify(value));
      logger.debug('Cache set', { key, ttl });
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }

  async del(key) {
    if (this.fallbackMode || !this.isConnected) {
      logger.debug('Cache delete skipped (fallback mode)', { key });
      return true;
    }

    try {
      await this.client.del(key);
      logger.debug('Cache delete', { key });
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }

  async invalidatePattern(pattern) {
    if (this.fallbackMode || !this.isConnected) {
      logger.debug('Cache pattern invalidation skipped (fallback mode)', { pattern });
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.debug('Cache pattern invalidation', { pattern, deletedCount: keys.length });
      }
      return keys.length;
    } catch (error) {
      logger.error('Cache pattern invalidation error', { pattern, error: error.message });
      return 0;
    }
  }

  async flush() {
    if (this.fallbackMode || !this.isConnected) {
      logger.debug('Cache flush skipped (fallback mode)');
      return true;
    }

    try {
      await this.client.flushdb();
      logger.info('Cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush error', { error: error.message });
      return false;
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      fallbackMode: this.fallbackMode,
      redisConfigured: !!(process.env.REDIS_HOST || process.env.REDIS_URL)
    };
  }
}

module.exports = new CacheService();
