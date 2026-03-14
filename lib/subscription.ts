import { db } from '@/lib/db';
import { subscriptions, orgSubscriptions, usage, member } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';
import { alert } from '@/lib/alert';
import type { PlanTier } from '@/types';

/**
 * Get user's personal subscription plan.
 * Checks subscriptions table (managed by Stripe webhooks) -> 'free'
 */
export async function getSubscriptionPlan(userId: string): Promise<PlanTier> {
  const [sub] = await db
    .select({ plan: subscriptions.plan, status: subscriptions.status, currentPeriodEnd: subscriptions.currentPeriodEnd })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  if (sub && sub.status === 'active') {
    if (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date()) {
      return sub.plan as PlanTier;
    }
  }

  return 'free';
}

/**
 * Get org subscription plan.
 */
export async function getOrgSubscriptionPlan(orgId: string): Promise<PlanTier> {
  const [sub] = await db
    .select({ plan: orgSubscriptions.plan, status: orgSubscriptions.status, currentPeriodEnd: orgSubscriptions.currentPeriodEnd })
    .from(orgSubscriptions)
    .where(eq(orgSubscriptions.organizationId, orgId));

  if (sub && sub.status === 'active') {
    if (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date()) {
      return sub.plan as PlanTier;
    }
  }

  return 'free';
}

/**
 * Get the effective plan for a user, considering org membership.
 * If orgId provided, check org plan. Otherwise check personal plan.
 * The highest plan wins.
 */
export async function getEffectivePlan(userId: string, orgId?: string | null): Promise<PlanTier> {
  const planOrder: Record<PlanTier, number> = { free: 0, pro: 1, team: 2 };

  if (!orgId) {
    return getSubscriptionPlan(userId);
  }

  // Fetch personal and org plans in parallel
  const [personalPlan, orgPlan] = await Promise.all([
    getSubscriptionPlan(userId),
    getOrgSubscriptionPlan(orgId),
  ]);

  return planOrder[orgPlan] >= planOrder[personalPlan] ? orgPlan : personalPlan;
}

/**
 * Get member count for an organization.
 */
export async function getMemberCount(orgId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(member)
    .where(eq(member.organizationId, orgId));

  return result?.count ?? 0;
}

/**
 * Update Stripe subscription quantity to match current member count.
 * Called from Better Auth hooks on member add/remove.
 */
export async function updateOrgSeatCount(orgId: string): Promise<void> {
  const count = await getMemberCount(orgId);

  const [sub] = await db
    .select({
      stripeSubscriptionId: orgSubscriptions.stripeSubscriptionId,
    })
    .from(orgSubscriptions)
    .where(eq(orgSubscriptions.organizationId, orgId));

  if (!sub?.stripeSubscriptionId) {
    // No active Stripe subscription, just update local quantity
    await db
      .update(orgSubscriptions)
      .set({ quantity: count, updatedAt: new Date() })
      .where(eq(orgSubscriptions.organizationId, orgId));
    return;
  }

  // Update Stripe quantity
  try {
    const { stripe } = await import('@/lib/stripe');
    const subscription = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    const item = subscription.items.data[0];
    if (item) {
      await stripe.subscriptionItems.update(item.id, { quantity: count });
    }
  } catch (err) {
    await alert('stripe', 'Failed to update Stripe seat count', { orgId, error: String(err) });
  }

  await db
    .update(orgSubscriptions)
    .set({ quantity: count, updatedAt: new Date() })
    .where(eq(orgSubscriptions.organizationId, orgId));
}

/**
 * Increment monthly usage counter (UPSERT).
 */
export async function incrementUsage(userId: string, feature: string): Promise<number> {
  const month = new Date().toISOString().slice(0, 7); // "2026-02"

  const [result] = await db
    .insert(usage)
    .values({ userId, feature, month, count: 1 })
    .onConflictDoUpdate({
      target: [usage.userId, usage.feature, usage.month],
      set: { count: sql`${usage.count} + 1` },
    })
    .returning({ count: usage.count });

  return result?.count ?? 1;
}

/**
 * Get current monthly usage count for a feature.
 */
export async function getUsageCount(userId: string, feature: string): Promise<number> {
  const month = new Date().toISOString().slice(0, 7);

  const [result] = await db
    .select({ count: usage.count })
    .from(usage)
    .where(
      and(
        eq(usage.userId, userId),
        eq(usage.feature, feature),
        eq(usage.month, month)
      )
    );

  return result?.count ?? 0;
}

/**
 * Plan guard -- throws if user doesn't have required plan.
 */
export async function requirePlan(userId: string, requiredPlan: PlanTier, orgId?: string | null): Promise<void> {
  const plan = await getEffectivePlan(userId, orgId);
  const planOrder: Record<PlanTier, number> = { free: 0, pro: 1, team: 2 };

  if (planOrder[plan] < planOrder[requiredPlan]) {
    throw new Error(`This feature requires ${requiredPlan} plan`);
  }
}
