'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Users, Shield, CreditCard, Link2 } from 'lucide-react';
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
  const tTeam = useTranslations('pricing.teamDetails');
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
        t('team.feature6'),
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
        toast.error(data.error || t('checkoutError'));
      }
    } catch {
      toast.error(t('checkoutError'));
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

  const teamDetailCards = [
    { icon: Shield, title: tTeam('roles.title'), desc: tTeam('roles.desc') },
    { icon: Users, title: tTeam('shared.title'), desc: tTeam('shared.desc') },
    { icon: CreditCard, title: tTeam('billing.title'), desc: tTeam('billing.desc') },
    { icon: Link2, title: tTeam('invite.title'), desc: tTeam('invite.desc') },
  ];

  return (
    <div className="space-y-16">
      {/* Plan Cards */}
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

      {/* Team Details Section */}
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h3 className="text-2xl font-bold mb-2">{tTeam('title')}</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">{tTeam('subtitle')}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          {teamDetailCards.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex gap-4 p-5 rounded-xl border bg-card">
              <div className="shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">{title}</h4>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
