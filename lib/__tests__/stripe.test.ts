import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub env vars BEFORE importing the module
const MOCK_PRO_PRICE = 'price_pro_123';
const MOCK_TEAM_PRICE = 'price_team_456';

vi.stubEnv('STRIPE_SECRET_KEY', 'sk_test_fake');
vi.stubEnv('STRIPE_PRO_PRICE_ID', MOCK_PRO_PRICE);
vi.stubEnv('STRIPE_TEAM_PRICE_ID', MOCK_TEAM_PRICE);

// Mock Stripe constructor so it doesn't try to connect
vi.mock('stripe', () => ({
  default: class MockStripe {},
}));

const { getPlanFromPriceId, getPriceIdFromPlan } = await import('@/lib/stripe');

describe('getPlanFromPriceId', () => {
  it('returns "pro" for pro price ID', () => {
    expect(getPlanFromPriceId(MOCK_PRO_PRICE)).toBe('pro');
  });

  it('returns "team" for team price ID', () => {
    expect(getPlanFromPriceId(MOCK_TEAM_PRICE)).toBe('team');
  });

  it('returns "free" for unknown price ID', () => {
    expect(getPlanFromPriceId('price_unknown')).toBe('free');
  });

  it('returns "free" for empty string', () => {
    expect(getPlanFromPriceId('')).toBe('free');
  });
});

describe('getPriceIdFromPlan', () => {
  it('returns pro price ID for "pro"', () => {
    expect(getPriceIdFromPlan('pro')).toBe(MOCK_PRO_PRICE);
  });

  it('returns team price ID for "team"', () => {
    expect(getPriceIdFromPlan('team')).toBe(MOCK_TEAM_PRICE);
  });

  it('returns null for "free"', () => {
    expect(getPriceIdFromPlan('free')).toBeNull();
  });
});
