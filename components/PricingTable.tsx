'use client';

import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';

interface PlanCard {
  tier: string;
  price: string;
  period: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
  disabled?: boolean;
}

export function PricingTable() {
  const t = useTranslations('pricing');

  const plans: PlanCard[] = [
    {
      tier: t('free.name'),
      price: '$0',
      period: t('free.period'),
      features: [
        t('free.feature1'),
        t('free.feature2'),
        t('free.feature3'),
        t('free.feature4'),
      ],
      cta: t('free.cta'),
      href: '/login',
    },
    {
      tier: t('pro.name'),
      price: '$9',
      period: t('pro.period'),
      features: [
        t('pro.feature1'),
        t('pro.feature2'),
        t('pro.feature3'),
        t('pro.feature4'),
        t('pro.feature5'),
      ],
      cta: t('pro.cta'),
      href: '/pricing',
      highlighted: true,
      disabled: true,
    },
    {
      tier: t('team.name'),
      price: '$19',
      period: t('team.period'),
      features: [
        t('team.feature1'),
        t('team.feature2'),
        t('team.feature3'),
        t('team.feature4'),
        t('team.feature5'),
      ],
      cta: t('team.cta'),
      href: '/pricing',
      disabled: true,
    },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      {plans.map((plan) => (
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
          <h3 className="text-xl font-bold mb-2">{plan.tier}</h3>
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
          {plan.disabled ? (
            <Button variant="outline" disabled className="w-full">
              {plan.cta}
            </Button>
          ) : (
            <Link href={plan.href} className="w-full">
              <Button
                variant={plan.highlighted ? 'default' : 'outline'}
                className="w-full"
              >
                {plan.cta}
              </Button>
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
