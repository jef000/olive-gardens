import Redis from 'ioredis';
import config from '../config/env';
import { MemoryRedisStore } from './memoryRedis';

/**
 * Minimal Redis client surface used across the API.
 * Implemented by ioredis (real Redis) and MemoryRedisStore (in-memory fallback).
 */
export interface RedisPipeline {
  zremrangebyscore(key: string, min: number, max: number): RedisPipeline;
  zcard(key: string): RedisPipeline;
  zadd(key: string, score: number, member: string): RedisPipeline;
  expire(key: string, seconds: number): RedisPipeline;
  exec(): Promise<Array<[Error | null, unknown]> | null>;
}

export interface RedisStore {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<string>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  sadd(key: string, ...members: string[]): Promise<number>;
  smembers(key: string): Promise<string[]>;
  srem(key: string, ...members: string[]): Promise<number>;
  zrem(key: string, ...members: string[]): Promise<number>;
  pipeline(): RedisPipeline;
  ping(): Promise<string>;
  quit(): Promise<string>;
  disconnect(): void;
  status: string;
  readonly isMemory?: boolean;
  healthCheck(): Promise<boolean>;
}

function resolveRedisUrl(): string {
  return (config.redis?.url || process.env.REDIS_URL || '').trim();
}

/**
 * Create the Redis-compatible store.
 *
 * Mode selection:
 * - REDIS_MODE=memory            -> always in-memory
 * - REDIS_URL missing/empty      -> in-memory (shared hosting, single process)
 * - otherwise                    -> real Redis via ioredis
 */
function createStore(): RedisStore {
  const mode = (process.env.REDIS_MODE || '').trim().toLowerCase();
  const redisUrl = resolveRedisUrl();

  if (mode === 'memory' || !redisUrl) {
    console.log(
      mode === 'memory'
        ? 'Redis: REDIS_MODE=memory — using in-memory store.'
        : 'Redis: REDIS_URL not set — using in-memory store (single-process mode).'
    );
    return new MemoryRedisStore() as unknown as RedisStore;
  }

  console.log(`Redis: connecting to ${redisUrl.split('@').pop() ?? redisUrl}...`);

  const client = new Redis(redisUrl, {
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      console.log(`Redis connection retry attempt ${times} in ${delay}ms`);
      return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    // Keep unit tests deterministic when Redis is intentionally unavailable.
    lazyConnect: config.env === 'test',
  });

  client.on('connect', () => {
    console.log('Redis: Connection established');
  });

  client.on('ready', () => {
    console.log('Redis: Client ready');
  });

  client.on('error', (error: Error) => {
    console.error('Redis error:', error.message);
  });

  client.on('close', () => {
    console.log('Redis: Connection closed');
  });

  client.on('reconnecting', () => {
    console.log('Redis: Attempting to reconnect...');
  });

  client.on('end', () => {
    console.log('Redis: Connection ended');
  });

  const store = client as unknown as RedisStore;
  store.healthCheck = async () => {
    try {
      return (await client.ping()) === 'PONG';
    } catch (error) {
      console.error('Redis health check failed:', error);
      return false;
    }
  };
  return store;
}

const redisStore = createStore();

export { redisStore };
export default redisStore;
