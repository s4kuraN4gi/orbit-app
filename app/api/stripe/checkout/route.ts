import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { subscriptions, orgSubscriptions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { stripe, getPriceIdFromPlan } from '@/lib/stripe';
import { getMemberCount } from '@/lib/subscription';
import { rateLimit } from '@/lib/rate-limit';
import type { PlanTier } from '@/types';

const limiter = rateLimit({ interval: 60_000, maxRequests: 5 });

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success } = limiter.check(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { plan, organizationId } = (await request.json()) as {
    plan: PlanTier;
    organizationId?: string;
  };
  const priceId = getPriceIdFromPlan(plan);
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const userId = session.user.id;
  const origin = request.headers.get('origin') || process.env.BETTER_AUTH_URL || '';

  // Team plan checkout
  if (plan === 'team' && organizationId) {
    let customerId: string | undefined;
    const [orgSub] = await db
      .select({ stripeCustomerId: orgSubscriptions.stripeCustomerId })
      .from(orgSubscriptions)
      .where(eq(orgSubscriptions.organizationId, organizationId));

    if (orgSub?.stripeCustomerId) {
      customerId = orgSub.stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { organizationId, userId },
      });
      customerId = customer.id;
    }

    const quantity = await getMemberCount(organizationId);

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: Math.max(quantity, 1) }],
      success_url: `${origin}/settings?checkout=success`,
      cancel_url: `${origin}/pricing`,
      metadata: { userId, plan, organizationId },
    });

    return NextResponse.json({ url: checkoutSession.url });
  }

  // Personal plan checkout (pro)
  let customerId: string | undefined;
  const [sub] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId));

  if (sub?.stripeCustomerId) {
    customerId = sub.stripeCustomerId;
  } else {
    const customer = await stripe.customers.create({
      email: session.user.email,
      metadata: { userId },
    });
    customerId = customer.id;
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?checkout=success`,
    cancel_url: `${origin}/pricing`,
    metadata: { userId, plan },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
