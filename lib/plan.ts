import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import type { PlanTier, PlanLimits } from '@/types';
import { getPlanLimits } from '@/lib/plan-client';

export { getPlanLimits };

export async function getUserPlan(): Promise<PlanLimits> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return getPlanLimits('free');

  const [settings] = await db
    .select({ plan: userSettings.plan })
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id));

  const tier = (settings?.plan as PlanTier) || 'free';
  return getPlanLimits(tier);
}
