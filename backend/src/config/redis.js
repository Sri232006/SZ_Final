const redis = require('redis');
const config = require('./env');

const redisClient = redis.createClient({
  url: `redis://${config.REDIS.HOST}:${config.REDIS.PORT}`,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries >= 5) {
        return new Error('Retry time exhausted');
      }
      return Math.min(retries * 1000, 5000);
    }
  }
});

redisClient.on('error', (err) => console.error('Redis Client Error:', err.message));
redisClient.on('connect', () => console.log('Redis Connected'));

// Track connection state
let isRedisReady = false;

redisClient.on('ready', () => {
  isRedisReady = true;
});

redisClient.on('end', () => {
  isRedisReady = false;
});

// Graceful connect — don't crash if Redis is unavailable
(async () => {
  try {
    await redisClient.connect();
  } catch (error) {
    console.warn('Redis connection failed. Caching will be disabled:', error.message);
    isRedisReady = false;
  }
})();

// Export both client and readiness check
module.exports = redisClient;
module.exports.isRedisReady = () => isRedisReady;