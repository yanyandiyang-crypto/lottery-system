const cacheService = require('../services/cacheService');
const logger = require('../utils/logger');

const cacheMiddleware = (keyGenerator, ttl = 300) => {
  return async (req, res, next) => {
    const cacheKey = keyGenerator(req);
    
    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.debug('Cache hit in middleware', { key: cacheKey });
        return res.json(cached);
      }
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message });
    }

    // Store original res.json
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Cache the response (non-blocking)
      cacheService.set(cacheKey, data, ttl).catch(error => {
        logger.error('Cache set error in middleware', { error: error.message });
      });
      
      // Send response
      originalJson(data);
    };

    next();
  };
};

module.exports = cacheMiddleware;
