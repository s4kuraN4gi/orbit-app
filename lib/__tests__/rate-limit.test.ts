import { describe, it, expect, vi, beforeEach } from 'vitest';

// Ensure in-memory fallback is used (no UPSTASH env vars)
vi.stubEnv('UPSTASH_REDIS_REST_URL', '');
vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');

// Must import after env stub
const { rateLimit } = await import('../rate-limit');

describe('rateLimit (in-memory fallback)', () => {
  beforeEach(() => {
    // Reset the module-level memoryStore by re-importing would be ideal,
    // but since we can't easily, we use unique keys per test
  });

  it('allows requests within limit', async () => {
    const limiter = rateLimit({ interval: 60_000, maxRequests: 3 });
    const key = `test-allow-${Date.now()}`;

    const r1 = await limiter.check(key);
    expect(r1.success).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = await limiter.check(key);
    expect(r2.success).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = await limiter.check(key);
    expect(r3.success).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it('blocks requests exceeding limit', async () => {
    const limiter = rateLimit({ interval: 60_000, maxRequests: 2 });
    const key = `test-block-${Date.now()}`;

    await limiter.check(key);
    await limiter.check(key);

    const r3 = await limiter.check(key);
    expect(r3.success).toBe(false);
    expect(r3.remaining).toBe(0);
  });

  it('isolates different keys', async () => {
    const limiter = rateLimit({ interval: 60_000, maxRequests: 1 });
    const keyA = `test-iso-a-${Date.now()}`;
    const keyB = `test-iso-b-${Date.now()}`;

    const rA = await limiter.check(keyA);
    expect(rA.success).toBe(true);

    const rB = await limiter.check(keyB);
    expect(rB.success).toBe(true);

    // keyA exhausted
    const rA2 = await limiter.check(keyA);
    expect(rA2.success).toBe(false);
  });

  it('allows requests after window expires', async () => {
    vi.useFakeTimers();
    const limiter = rateLimit({ interval: 1000, maxRequests: 1 });
    const key = `test-expire-${Date.now()}`;

    const r1 = await limiter.check(key);
    expect(r1.success).toBe(true);

    const r2 = await limiter.check(key);
    expect(r2.success).toBe(false);

    // Advance time past the window
    vi.advanceTimersByTime(1100);

    const r3 = await limiter.check(key);
    expect(r3.success).toBe(true);

    vi.useRealTimers();
  });

  it('returns correct remaining count', async () => {
    const limiter = rateLimit({ interval: 60_000, maxRequests: 5 });
    const key = `test-remaining-${Date.now()}`;

    for (let i = 4; i >= 0; i--) {
      const r = await limiter.check(key);
      expect(r.success).toBe(true);
      expect(r.remaining).toBe(i);
    }

    const blocked = await limiter.check(key);
    expect(blocked.success).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
});
