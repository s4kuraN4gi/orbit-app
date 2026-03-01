import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { subscriptions, orgSubscriptions, member } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { stripe } from '@/lib/stripe';
import { rateLimit } from '@/lib/rate-limit';
import { portalSchema } from '@/lib/validations';
import { ZodError } from 'zod';

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
    const raw = await request.json().catch(() => ({}));
    body = portalSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const { organizationId } = body;

  const origin = process.env.BETTER_AUTH_URL || '';

  // Org portal
  if (organizationId) {
    // Verify caller is owner/admin of the org
    const [orgMember] = await db
      .select({ role: member.role })
      .from(member)
      .where(and(
        eq(member.organizationId, organizationId),
        eq(member.userId, session.user.id)
      ));
    if (!orgMember || (orgMember.role !== 'owner' && orgMember.role !== 'admin')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [orgSub] = await db
      .select({ stripeCustomerId: orgSubscriptions.stripeCustomerId })
      .from(orgSubscriptions)
      .where(eq(orgSubscriptions.organizationId, organizationId));

    if (!orgSub?.stripeCustomerId) {
      return NextResponse.json({ error: 'No org subscription found' }, { status: 404 });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: orgSub.stripeCustomerId,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  }

  // Personal portal
  const [sub] = await db
    .select({ stripeCustomerId: subscriptions.stripeCustomerId })
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id));

  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${origin}/settings`,
  });

  return NextResponse.json({ url: portalSession.url });
}
