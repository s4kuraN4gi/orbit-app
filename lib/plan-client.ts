import type { PlanTier, PlanLimits } from '@/types';

const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    tier: 'free',
    maxProjects: 1,
    maxTasksPerProject: 20,
    maxContextHistory: 3,
    maxImportsPerMonth: 1,
    exportFormats: ['markdown'],
    contextDiff: false,
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
