import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface RateLimitConfig {
  interval: number; // ms (e.g. 60_000 = 1 minute)
  maxRequests: number; // max requests within interval
}

// Upstash 環境変数が設定されていれば Redis ベース
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// フォールバック: インメモリ（開発環境用）
const memoryStore = new Map<string, number[]>();

export function rateLimit(config: RateLimitConfig) {
  if (redis) {
    const limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.interval}ms`),
    });

    return {
      async check(key: string): Promise<{ success: boolean; remaining: number }> {
        const result = await limiter.limit(key);
        return { success: result.success, remaining: result.remaining };
      },
    };
  }

  // Fallback: in-memory (dev only)
  return {
    async check(key: string): Promise<{ success: boolean; remaining: number }> {
      const now = Date.now();
      const windowStart = now - config.interval;
      const timestamps = (memoryStore.get(key) || []).filter((t) => t > windowStart);

      if (timestamps.length >= config.maxRequests) {
        memoryStore.set(key, timestamps);
        return { success: false, remaining: 0 };
      }

      timestamps.push(now);
      memoryStore.set(key, timestamps);
      return { success: true, remaining: config.maxRequests - timestamps.length };
    },
  };
}
