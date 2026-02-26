import Stripe from 'stripe';
import type { PlanTier } from '@/types';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PRICE_MAP: Record<string, PlanTier> = {
  [process.env.STRIPE_PRO_PRICE_ID!]: 'pro',
  [process.env.STRIPE_TEAM_PRICE_ID!]: 'team',
};

export function getPlanFromPriceId(priceId: string): PlanTier {
  return PRICE_MAP[priceId] ?? 'free';
}

export function getPriceIdFromPlan(plan: PlanTier): string | null {
  if (plan === 'pro') return process.env.STRIPE_PRO_PRICE_ID!;
  if (plan === 'team') return process.env.STRIPE_TEAM_PRICE_ID!;
  return null;
}
