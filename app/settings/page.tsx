import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserSettings } from '@/app/actions/settings';
import { SettingsView } from '@/components/settings/SettingsView';
import { db } from '@/lib/db';
import { subscriptions } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getSubscriptionPlan } from '@/lib/subscription';

export const metadata: Metadata = {
  title: '設定 | Orbit',
  description: 'Orbitの設定を管理します',
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/login');
  }

  const [settings, plan, subRows] = await Promise.all([
    getUserSettings(),
    getSubscriptionPlan(session.user.id),
    db.select().from(subscriptions).where(eq(subscriptions.userId, session.user.id)),
  ]);

  const subscription = subRows[0] ?? null;

  return (
    <div className="min-h-screen bg-background">
      <SettingsView
        initialSettings={settings}
        userEmail={session.user.email || ''}
        userId={session.user.id}
        currentPlan={plan}
        subscription={subscription ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd ?? false,
          hasStripeCustomer: !!subscription.stripeCustomerId,
        } : null}
      />
    </div>
  );
}
