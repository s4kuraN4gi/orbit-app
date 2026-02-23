import type { PlanTier, PlanLimits } from '@/types';

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    tier: 'free',
    maxProjects: 3,
    maxTasksPerProject: 50,
    maxContextHistory: 5,
    exportFormats: ['markdown'],
    contextDiff: false,
  },
  pro: {
    tier: 'pro',
    maxProjects: Infinity,
    maxTasksPerProject: Infinity,
    maxContextHistory: Infinity,
    exportFormats: ['markdown', 'json', 'custom'],
    contextDiff: true,
  },
  team: {
    tier: 'team',
    maxProjects: Infinity,
    maxTasksPerProject: Infinity,
    maxContextHistory: Infinity,
    exportFormats: ['markdown', 'json', 'custom'],
    contextDiff: true,
  },
};

export function getPlanLimits(tier: PlanTier): PlanLimits {
  return PLAN_LIMITS[tier] ?? PLAN_LIMITS.free;
}
