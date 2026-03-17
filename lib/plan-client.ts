import type { PlanTier, PlanLimits } from '@/types';

// [Sponsorware] Free tier limits relaxed — all features free during adoption phase
const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    tier: 'free',
    maxProjects: Infinity,
    maxTasksPerProject: Infinity,
    maxContextHistory: Infinity,
    maxImportsPerMonth: Infinity,
    exportFormats: ['markdown', 'json', 'custom'],
    contextDiff: true,
  },
  pro: {
    tier: 'pro',
    maxProjects: Infinity,
    maxTasksPerProject: Infinity,
    maxContextHistory: Infinity,
    maxImportsPerMonth: Infinity,
    exportFormats: ['markdown', 'json', 'custom'],
    contextDiff: true,
  },
  team: {
    tier: 'team',
    maxProjects: Infinity,
    maxTasksPerProject: Infinity,
    maxContextHistory: Infinity,
    maxImportsPerMonth: Infinity,
    exportFormats: ['markdown', 'json', 'custom'],
    contextDiff: true,
  },
};

export function getPlanLimits(tier: PlanTier): PlanLimits {
  return PLAN_LIMITS[tier] ?? PLAN_LIMITS.free;
}
