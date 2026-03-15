import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock DB with response queue ───
// Each .where() call pops the next response from the queue.
let responseQueue: Record<string, unknown>[][] = [];

function createChain() {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn(() => chain);
  chain.from = vi.fn(() => chain);
  chain.where = vi.fn(() => {
    const result = responseQueue.shift() || [];
    return Promise.resolve(result);
  });
  chain.insert = vi.fn(() => chain);
  chain.values = vi.fn(() => chain);
  chain.onConflictDoUpdate = vi.fn(() => chain);
  chain.returning = vi.fn(() => Promise.resolve(responseQueue.shift() || []));
  chain.update = vi.fn(() => chain);
  chain.set = vi.fn(() => chain);
  return chain;
}

const mockDbChain = createChain();

vi.mock('@/lib/db', () => ({
  db: new Proxy({}, {
    get(_, prop) {
      if (typeof prop === 'string' && prop in mockDbChain) return mockDbChain[prop];
      return vi.fn(() => mockDbChain);
    },
  }),
}));

vi.mock('@/lib/schema', () => ({
  subscriptions: { userId: 'userId', plan: 'plan', status: 'status', currentPeriodEnd: 'currentPeriodEnd' },
  orgSubscriptions: { organizationId: 'organizationId', plan: 'plan', status: 'status', currentPeriodEnd: 'currentPeriodEnd', stripeSubscriptionId: 'stripeSubscriptionId', quantity: 'quantity' },
  usage: { userId: 'userId', feature: 'feature', month: 'month', count: 'count' },
  member: { organizationId: 'organizationId' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
  and: vi.fn((...args: unknown[]) => args),
  sql: vi.fn(),
}));

import {
  getSubscriptionPlan,
  getOrgSubscriptionPlan,
  getEffectivePlan,
  requirePlan,
} from '@/lib/subscription';

beforeEach(() => {
  responseQueue = [];
  vi.clearAllMocks();
  // Re-wire the chain after clearAllMocks
  mockDbChain.select = vi.fn(() => mockDbChain);
  mockDbChain.from = vi.fn(() => mockDbChain);
  mockDbChain.where = vi.fn(() => {
    const result = responseQueue.shift() || [];
    return Promise.resolve(result);
  });
});

// ─── getSubscriptionPlan ───
describe('getSubscriptionPlan', () => {
  it('returns active subscription plan', async () => {
    responseQueue = [
      [{ plan: 'pro', status: 'active', currentPeriodEnd: new Date(Date.now() + 86400000) }],
    ];
    const result = await getSubscriptionPlan('user-1');
    expect(result).toBe('pro');
  });

  it('returns "free" when subscription is canceled', async () => {
    responseQueue = [
      [{ plan: 'pro', status: 'canceled', currentPeriodEnd: null }],
    ];
    const result = await getSubscriptionPlan('user-1');
    expect(result).toBe('free');
  });

  it('returns "free" when no subscription exists', async () => {
    responseQueue = [
      [],
    ];
    const result = await getSubscriptionPlan('user-1');
    expect(result).toBe('free');
  });

  it('returns "free" when no subscription and no settings', async () => {
    responseQueue = [
      [],
    ];
    const result = await getSubscriptionPlan('user-1');
    expect(result).toBe('free');
  });

  it('returns "free" when subscription period has expired', async () => {
    responseQueue = [
      [{ plan: 'pro', status: 'active', currentPeriodEnd: new Date(Date.now() - 86400000) }],
    ];
    const result = await getSubscriptionPlan('user-1');
    expect(result).toBe('free');
  });
});

// ─── getOrgSubscriptionPlan ───
describe('getOrgSubscriptionPlan', () => {
  it('returns active org plan', async () => {
    responseQueue = [
      [{ plan: 'team', status: 'active', currentPeriodEnd: new Date(Date.now() + 86400000) }],
    ];
    const result = await getOrgSubscriptionPlan('org-1');
    expect(result).toBe('team');
  });

  it('returns "free" when no org subscription', async () => {
    responseQueue = [[]];
    const result = await getOrgSubscriptionPlan('org-1');
    expect(result).toBe('free');
  });

  it('returns "free" when org subscription expired', async () => {
    responseQueue = [
      [{ plan: 'team', status: 'active', currentPeriodEnd: new Date(Date.now() - 86400000) }],
    ];
    const result = await getOrgSubscriptionPlan('org-1');
    expect(result).toBe('free');
  });
});

// ─── getEffectivePlan ───
describe('getEffectivePlan', () => {
  it('returns personal plan when no orgId', async () => {
    responseQueue = [
      [{ plan: 'pro', status: 'active', currentPeriodEnd: new Date(Date.now() + 86400000) }],
    ];
    const result = await getEffectivePlan('user-1');
    expect(result).toBe('pro');
  });

  it('returns higher plan when org plan > personal plan', async () => {
    responseQueue = [
      // getSubscriptionPlan: no active sub
      [],
      // getOrgSubscriptionPlan: team
      [{ plan: 'team', status: 'active', currentPeriodEnd: new Date(Date.now() + 86400000) }],
    ];
    const result = await getEffectivePlan('user-1', 'org-1');
    expect(result).toBe('team');
  });

  it('returns personal plan when personal > org plan', async () => {
    responseQueue = [
      // getSubscriptionPlan: pro
      [{ plan: 'pro', status: 'active', currentPeriodEnd: new Date(Date.now() + 86400000) }],
      // getOrgSubscriptionPlan: free
      [],
    ];
    const result = await getEffectivePlan('user-1', 'org-1');
    expect(result).toBe('pro');
  });
});

// ─── requirePlan ───
describe('requirePlan', () => {
  it('does not throw when user has sufficient plan', async () => {
    responseQueue = [
      [{ plan: 'pro', status: 'active', currentPeriodEnd: new Date(Date.now() + 86400000) }],
    ];
    await expect(requirePlan('user-1', 'pro')).resolves.toBeUndefined();
  });

  it('does not throw when user has higher plan than required', async () => {
    responseQueue = [
      [{ plan: 'team', status: 'active', currentPeriodEnd: new Date(Date.now() + 86400000) }],
    ];
    await expect(requirePlan('user-1', 'pro')).resolves.toBeUndefined();
  });

  it('throws when user has insufficient plan', async () => {
    responseQueue = [
      [],
    ];
    await expect(requirePlan('user-1', 'pro')).rejects.toThrow('This feature requires pro plan');
  });

  it('throws with correct plan name in message', async () => {
    responseQueue = [[]];
    await expect(requirePlan('user-1', 'team')).rejects.toThrow('This feature requires team plan');
  });
});
