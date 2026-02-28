interface RateLimitConfig {
  interval: number; // ms (e.g. 60_000 = 1 minute)
  maxRequests: number; // max requests within interval
}

const store = new Map<string, number[]>();

export function rateLimit(config: RateLimitConfig) {
  return {
    check(key: string): { success: boolean; remaining: number } {
      const now = Date.now();
      const windowStart = now - config.interval;
      const timestamps = (store.get(key) || []).filter((t) => t > windowStart);

      if (timestamps.length >= config.maxRequests) {
        store.set(key, timestamps);
        return { success: false, remaining: 0 };
      }

      timestamps.push(now);
      store.set(key, timestamps);
      return {
        success: true,
        remaining: config.maxRequests - timestamps.length,
      };
    },
  };
}
