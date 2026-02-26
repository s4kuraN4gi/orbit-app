import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getSubscriptionPlan, getEffectivePlan } from '@/lib/subscription';
import type { PlanLimits } from '@/types';
import { getPlanLimits } from '@/lib/plan-client';

export { getPlanLimits };

export async function getUserPlan(orgId?: string | null): Promise<PlanLimits> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return getPlanLimits('free');

  const tier = orgId
    ? await getEffectivePlan(session.user.id, orgId)
    : await getSubscriptionPlan(session.user.id);
  return getPlanLimits(tier);
}
