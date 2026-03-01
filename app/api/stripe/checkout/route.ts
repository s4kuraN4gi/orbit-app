import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { subscriptions, orgSubscriptions, member } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { stripe, getPriceIdFromPlan } from '@/lib/stripe';
import { getMemberCount } from '@/lib/subscription';
import { rateLimit } from '@/lib/rate-limit';
import { checkoutSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import type { PlanTier } from '@/types';

const limiter = rateLimit({ interval: 60_000, maxRequests: 5 });

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success } = await limiter.check(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body;
  try {
    const raw = await request.json();
    body = checkoutSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { plan, organizationId } = body;
  const priceId = getPriceIdFromPlan(plan as PlanTier);
  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const userId = session.user.id;
  const origin = process.env.BETTER_AUTH_URL || '';

  // Team plan checkout
  if (plan === 'team' && organizationId) {
    // Verify caller is owner/admin of the org
    const [orgMember] = await db
      .select({ role: member.role })
      .from(member)
      .where(and(
        eq(member.organizationId, organizationId),
        eq(member.userId, userId)
      ));
    if (!orgMember || (orgMember.role !== 'owner' && orgMember.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

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
