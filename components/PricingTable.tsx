'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { PlanTier } from '@/types';

interface PricingTableProps {
  isLoggedIn?: boolean;
  currentPlan?: PlanTier;
}

interface PlanCard {
  tier: PlanTier;
  label: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
}

export function PricingTable({ isLoggedIn = false, currentPlan = 'free' }: PricingTableProps) {
  const t = useTranslations('pricing');
  const router = useRouter();
  const [loading, setLoading] = useState<PlanTier | null>(null);

  const plans: PlanCard[] = [
    {
      tier: 'free',
      label: t('free.name'),
      price: '$0',
      period: t('free.period'),
      features: [
        t('free.feature1'),
        t('free.feature2'),
        t('free.feature3'),
        t('free.feature4'),
      ],
    },
    {
      tier: 'pro',
      label: t('pro.name'),
      price: '$9',
      period: t('pro.period'),
      features: [
        t('pro.feature1'),
        t('pro.feature2'),
        t('pro.feature3'),
        t('pro.feature4'),
        t('pro.feature5'),
      ],
      highlighted: true,
    },
    {
      tier: 'team',
      label: t('team.name'),
      price: '$19',
      period: t('team.period'),
      features: [
        t('team.feature1'),
        t('team.feature2'),
        t('team.feature3'),
        t('team.feature4'),
        t('team.feature5'),
      ],
    },
  ];

  const handleUpgrade = async (plan: PlanTier) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    if (plan === 'free' || plan === currentPlan) return;

    // Team plan: redirect to settings to create/select team first
    if (plan === 'team') {
      router.push('/settings');
      return;
    }

    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to create checkout session');
      }
    } catch {
      toast.error('Failed to create checkout session');
    } finally {
      setLoading(null);
    }
  };

  const getButtonProps = (plan: PlanCard) => {
    if (plan.tier === currentPlan) {
      return { label: t('currentPlan'), disabled: true };
    }
    if (plan.tier === 'free') {
      return { label: t('free.cta'), href: isLoggedIn ? undefined : '/login' };
    }
    return { label: t(`${plan.tier}.cta`), onClick: () => handleUpgrade(plan.tier) };
  };

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {plans.map((plan) => {
        const btnProps = getButtonProps(plan);
        return (
          <div
            key={plan.tier}
            className={`rounded-2xl border p-8 flex flex-col ${
              plan.highlighted
                ? 'border-primary ring-2 ring-primary relative'
                : 'bg-card'
            }`}
          >
            {plan.highlighted && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                {t('mostPopular')}
              </Badge>
            )}
            <h3 className="text-xl font-bold mb-2">{plan.label}</h3>
            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-muted-foreground ml-1">{plan.period}</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            {btnProps.href ? (
              <Link href={btnProps.href} className="w-full">
                <Button
                  variant={plan.highlighted ? 'default' : 'outline'}
                  className="w-full"
                >
                  {btnProps.label}
                </Button>
              </Link>
            ) : (
              <Button
                variant={plan.highlighted ? 'default' : 'outline'}
                className="w-full"
                disabled={btnProps.disabled || loading === plan.tier}
                onClick={btnProps.onClick}
              >
                {loading === plan.tier ? t('processing') : btnProps.label}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
