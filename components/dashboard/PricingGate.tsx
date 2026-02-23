'use client';

import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import type { PlanTier, PlanLimits } from '@/types';
import { getPlanLimits } from '@/lib/plan-client';

type GatedFeature =
  | 'context_history'
  | 'context_diff'
  | 'export_json'
  | 'project_limit'
  | 'task_limit';

interface PricingGateProps {
  feature: GatedFeature;
  currentPlan: PlanTier;
  children: React.ReactNode;
  itemIndex?: number;
}

function isLocked(feature: GatedFeature, limits: PlanLimits, itemIndex?: number): boolean {
  switch (feature) {
    case 'context_history':
      return itemIndex !== undefined && itemIndex >= limits.maxContextHistory;
    case 'context_diff':
      return !limits.contextDiff;
    case 'export_json':
      return !limits.exportFormats.includes('json');
    case 'project_limit':
      return itemIndex !== undefined && itemIndex >= limits.maxProjects;
    case 'task_limit':
      return itemIndex !== undefined && itemIndex >= limits.maxTasksPerProject;
    default:
      return false;
  }
}

export function PricingGate({ feature, currentPlan, children, itemIndex }: PricingGateProps) {
  const t = useTranslations('gate');
  const limits = getPlanLimits(currentPlan);

  if (!isLocked(feature, limits, itemIndex)) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="blur-sm opacity-50 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-card border rounded-lg p-6 shadow-lg text-center max-w-sm">
          <Lock className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
          <h3 className="font-semibold mb-1">{t('title')}</h3>
          <p className="text-sm text-muted-foreground mb-4">{t('description')}</p>
          <Link href="/pricing">
            <Button size="sm">{t('upgrade')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
