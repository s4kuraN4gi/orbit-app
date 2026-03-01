import { isLoggedIn } from './config.js';
import { apiRequest } from './api.js';

interface PlanInfo {
  plan: string;
  limits: Record<string, number | null>;
  usage: Record<string, number>;
}

let cachedPlan: PlanInfo | null = null;

export async function checkFeatureAccess(feature: string): Promise<{ allowed: boolean; message?: string }> {
  // Unauthenticated users must log in to use gated features
  if (!(await isLoggedIn())) {
    return {
      allowed: false,
      message: 'Login required to use this feature. Run:\n  orbit login\n\nFree plan includes limited access. Upgrade to Pro for unlimited:\n  https://orbit.dev/pricing',
    };
  }

  try {
    if (!cachedPlan) {
      cachedPlan = await apiRequest<PlanInfo>('GET', '/api/cli/plan');
    }

    const plan = cachedPlan!;
    const limit = plan.limits[feature];
    const used = plan.usage[feature] ?? 0;

    if (limit === undefined || limit === null) {
      return { allowed: true }; // Pro/Team or unknown feature
    }

    if (used >= limit) {
      return {
        allowed: false,
        message: `Free plan limit reached (${used}/${limit} this month). Upgrade to Pro for unlimited access:\n  https://orbit.dev/pricing`,
      };
    }

    return { allowed: true };
  } catch {
    // API error: don't block (graceful degradation)
    return { allowed: true };
  }
}

export async function recordFeatureUsage(feature: string): Promise<void> {
  if (!(await isLoggedIn())) return;
  try {
    await apiRequest('POST', '/api/cli/usage', { feature });
    cachedPlan = null; // Clear cache
  } catch {
    // Recording failure is non-critical
  }
}
