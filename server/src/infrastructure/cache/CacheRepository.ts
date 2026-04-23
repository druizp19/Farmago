// ============================================================================
// CACHE REPOSITORY - Redis with Memory fallback
// ============================================================================

import { createClient, RedisClientType } from 'redis';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { ENV } from '../../config/env';
import { logger } from '../../shared/logger';

export class CacheRepository implements ICacheRepository {
  private client: RedisClientType | null = null;
  private memoryCache: Map<string, any> = new Map();
  private useRedis = false;

  async connect(): Promise<void> {
    try {
      // Build Redis config - prefer URL, fallback to individual params
      const redisConfig: any = {};
      
      if (ENV.REDIS_URL) {
        redisConfig.url = ENV.REDIS_URL;
      } else if (ENV.REDIS_HOST) {
        redisConfig.socket = {
          host: ENV.REDIS_HOST,
          port: ENV.REDIS_PORT || 6379,
        };
        if (ENV.REDIS_PASSWORD) {
          redisConfig.password = ENV.REDIS_PASSWORD;
        }
      } else {
        // No Redis config, use memory cache
        logger.warn('⚠️ No Redis configuration found, using memory cache');
        this.useRedis = false;
        return;
      }

      this.client = createClient(redisConfig);

      this.client.on('error', (err) => {
        logger.warn('Redis error, falling back to memory cache:', err.message);
        this.useRedis = false;
        this.client = null;
      });

      await this.client.connect();
      this.useRedis = true;
      logger.info('✅ Connected to Redis cache');
    } catch (err) {
      logger.warn('⚠️ Redis not available, using memory cache');
      this.useRedis = false;
      this.client = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
    this.memoryCache.clear();
  }

  isConnected(): boolean {
    return this.useRedis ? this.client?.isOpen ?? false : true;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.useRedis && this.client?.isOpen) {
        const value = await this.client.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        return this.memoryCache.get(key) ?? null;
      }
    } catch (err) {
      logger.error(`Cache get error for key ${key}:`, err);
      // Fallback to memory on error
      this.useRedis = false;
      return this.memoryCache.get(key) ?? null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      if (this.useRedis && this.client?.isOpen) {
        const serialized = JSON.stringify(value);
        if (ttl && ttl > 0) {
          await this.client.setEx(key, ttl, serialized);
        } else {
          await this.client.set(key, serialized);
        }
      } else {
        this.memoryCache.set(key, value);
        
        // Memory cache TTL simulation
        if (ttl && ttl > 0) {
          setTimeout(() => {
            this.memoryCache.delete(key);
          }, ttl * 1000);
        }
      }
    } catch (err) {
      logger.error(`Cache set error for key ${key}:`, err);
      // Fallback to memory on error
      this.useRedis = false;
      this.memoryCache.set(key, value);
      
      if (ttl && ttl > 0) {
        setTimeout(() => {
          this.memoryCache.delete(key);
        }, ttl * 1000);
      }
    }
  }

  async delete(key: string): Promise<void> {
    try {
      if (this.useRedis && this.client?.isOpen) {
        await this.client.del(key);
      } else {
        this.memoryCache.delete(key);
      }
    } catch (err) {
      logger.error(`Cache delete error for key ${key}:`, err);
      // Fallback to memory on error
      this.useRedis = false;
      this.memoryCache.delete(key);
    }
  }

  getCacheType(): 'redis' | 'memory' {
    return this.useRedis ? 'redis' : 'memory';
  }
}

// Singleton instance
export const cacheRepository = new CacheRepository();
