import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

// Only use Redis if configured, otherwise fallback to memory store
let redisClient: any = null;

if (process.env.REDIS_URL || process.env.REDIS_HOST) {
  const host = process.env.REDIS_HOST || 'redis';
  redisClient = createClient({
    url: process.env.REDIS_URL || `redis://${host}:6379`,
  });

  redisClient.connect().catch((err: any) => {
    console.error('Redis connection failed, rate limit will fall back to memory store', err);
    redisClient = null;
  });
}

export const shareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 share requests per `window`
  message: 'Too many share links generated from this IP, please try again after 15 minutes',
  standardHeaders: true, 
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }) : undefined, // Mem store fallback
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // Limit each IP to 100 requests per `window`
  standardHeaders: true, 
  legacyHeaders: false,
  store: redisClient ? new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }) : undefined,
});
