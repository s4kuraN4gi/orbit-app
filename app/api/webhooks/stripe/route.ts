import { NextRequest, NextResponse } from 'next/server';
import { stripe, getPlanFromPriceId } from '@/lib/stripe';
import { db } from '@/lib/db';
import { subscriptions, orgSubscriptions, webhookEvents } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { alert } from '@/lib/alert';
import { trackMetric, flushAfterRequest } from '@/lib/monitoring';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    await alert('webhook', 'Stripe webhook signature verification failed', { error: String(err) });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency check
  const [existing] = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(eq(webhookEvents.id, event.id));

  if (existing) {
    return NextResponse.json({ received: true });
  }

  // NOTE: The idempotency record is inserted AFTER successful processing
  // so that if processing fails, Stripe can retry the event.
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan;
        const organizationId = session.metadata?.organizationId;
        if (!userId || !plan) break;

        const subscriptionId = session.subscription as string;
        const sub = await stripe.subscriptions.retrieve(subscriptionId);

        const item = sub.items.data[0];
        const periodEnd = item?.current_period_end
          ? new Date(item.current_period_end * 1000)
          : null;

        // Team plan -> orgSubscriptions
        if (plan === 'team' && organizationId) {
          await db
            .insert(orgSubscriptions)
            .values({
              organizationId,
              plan,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: item?.price.id ?? null,
              quantity: item?.quantity ?? 1,
              status: 'active',
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            })
            .onConflictDoUpdate({
              target: orgSubscriptions.organizationId,
              set: {
                plan,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: item?.price.id ?? null,
                quantity: item?.quantity ?? 1,
                status: 'active',
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: sub.cancel_at_period_end,
                updatedAt: new Date(),
              },
            });
        } else {
          // Personal plan -> subscriptions
          await db
            .insert(subscriptions)
            .values({
              userId,
              plan,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: subscriptionId,
              stripePriceId: item?.price.id ?? null,
              status: 'active',
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
            })
            .onConflictDoUpdate({
              target: subscriptions.userId,
              set: {
                plan,
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscriptionId,
                stripePriceId: item?.price.id ?? null,
                status: 'active',
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: sub.cancel_at_period_end,
                updatedAt: new Date(),
              },
            });
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const subItem = sub.items.data[0];
        const priceId = subItem?.price.id;
        const plan = priceId ? getPlanFromPriceId(priceId) : 'free';

        const status = sub.status === 'active' ? 'active'
          : sub.status === 'past_due' ? 'past_due'
          : sub.status === 'canceled' ? 'canceled'
          : 'incomplete';

        const subPeriodEnd = subItem?.current_period_end
          ? new Date(subItem.current_period_end * 1000)
          : null;

        // Try personal subscription first
        const [personalSub] = await db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, sub.id));

        if (personalSub) {
          await db
            .update(subscriptions)
            .set({
              plan,
              stripePriceId: priceId ?? null,
              status,
              currentPeriodEnd: subPeriodEnd,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubscriptionId, sub.id));
        } else {
          // Try org subscription
          await db
            .update(orgSubscriptions)
            .set({
              plan,
              stripePriceId: priceId ?? null,
              quantity: subItem?.quantity ?? 1,
              status,
              currentPeriodEnd: subPeriodEnd,
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              updatedAt: new Date(),
            })
            .where(eq(orgSubscriptions.stripeSubscriptionId, sub.id));
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;

        // Try personal subscription first
        const [personalSub] = await db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, sub.id));

        if (personalSub) {
          await db
            .update(subscriptions)
            .set({
              plan: 'free',
              status: 'canceled',
              cancelAtPeriodEnd: false,
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubscriptionId, sub.id));
        } else {
          await db
            .update(orgSubscriptions)
            .set({
              plan: 'free',
              status: 'canceled',
              cancelAtPeriodEnd: false,
              updatedAt: new Date(),
            })
            .where(eq(orgSubscriptions.stripeSubscriptionId, sub.id));
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof invoice.parent?.subscription_details?.subscription === 'string'
          ? invoice.parent.subscription_details.subscription
          : null;
        if (!subscriptionId) break;

        // Try personal first, then org
        const [personalSub] = await db
          .select({ id: subscriptions.id })
          .from(subscriptions)
          .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));

        if (personalSub) {
          await db
            .update(subscriptions)
            .set({ status: 'past_due', updatedAt: new Date() })
            .where(eq(subscriptions.stripeSubscriptionId, subscriptionId));
        } else {
          await db
            .update(orgSubscriptions)
            .set({ status: 'past_due', updatedAt: new Date() })
            .where(eq(orgSubscriptions.stripeSubscriptionId, subscriptionId));
        }
        break;
      }
    }
  } catch (err) {
    // Do NOT record the event as processed — allow Stripe to retry
    await alert('stripe', `Webhook handler error for ${event.type}`, { eventId: event.id, error: String(err) });
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  // Record event for idempotency only after successful processing
  await db.insert(webhookEvents).values({ id: event.id, type: event.type });

  trackMetric('webhook_processed', 1, { type: event.type });
  flushAfterRequest();

  return NextResponse.json({ received: true });
}
