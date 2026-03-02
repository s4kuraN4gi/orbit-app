'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Users, Shield, CreditCard, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { PlanTier, Organization } from '@/types';

interface PricingTableProps {
  isLoggedIn?: boolean;
  currentPlan?: PlanTier;
  userOrganization?: Organization | null;
}

interface PlanCard {
  tier: PlanTier;
  label: string;
  price: string;
  period: string;
  features: string[];
  highlighted?: boolean;
}

export function PricingTable({ isLoggedIn = false, currentPlan = 'free', userOrganization }: PricingTableProps) {
  const t = useTranslations('pricing');
  const tCommon = useTranslations('common');
  const tTeam = useTranslations('pricing.teamDetails');
  const router = useRouter();
  const [loading, setLoading] = useState<PlanTier | null>(null);
  const [showOrgDialog, setShowOrgDialog] = useState(false);
  const [orgName, setOrgName] = useState('');

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
      price: '$12',
      period: t('pro.period'),
      features: [
        t('pro.feature1'),
        t('pro.feature2'),
        t('pro.feature3'),
        t('pro.feature4'),
        t('pro.feature5'),
        t('pro.feature6'),
        t('pro.feature7'),
      ],
      highlighted: true,
    },
    {
      tier: 'team',
      label: t('team.name'),
      price: '$20',
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

  const proceedToCheckout = async (plan: PlanTier, organizationId?: string) => {
    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, organizationId }),
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

  const handleUpgrade = async (plan: PlanTier) => {
    if (!isLoggedIn) {
      router.push('/login');
      return;
    }

    if (plan === 'free' || plan === currentPlan) return;

    if (plan === 'team') {
      if (userOrganization) {
        await proceedToCheckout('team', userOrganization.id);
      } else {
        setShowOrgDialog(true);
      }
      return;
    }

    await proceedToCheckout(plan);
  };

  const handleCreateOrgAndCheckout = async () => {
    if (!orgName.trim()) return;

    setLoading('team');
    try {
      const slug = orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const res = await fetch('/api/auth/organization/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orgName.trim(), slug }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || t('checkoutError'));
        setLoading(null);
        return;
      }

      const org = await res.json();
      setShowOrgDialog(false);
      setOrgName('');
      await proceedToCheckout('team', org.id);
    } catch {
      toast.error(t('checkoutError'));
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
      {/* Inline Org Creation Dialog */}
      {showOrgDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border rounded-2xl p-8 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-bold mb-2">{t('team.name')}</h3>
            <p className="text-sm text-muted-foreground mb-4">{tTeam('title')}</p>
            <Input
              placeholder={t('team.name')}
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateOrgAndCheckout()}
              className="mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => { setShowOrgDialog(false); setOrgName(''); }}
              >
{tCommon('cancel')}
              </Button>
              <Button
                onClick={handleCreateOrgAndCheckout}
                disabled={!orgName.trim() || loading === 'team'}
              >
                {loading === 'team' ? t('processing') : t('team.cta')}
              </Button>
            </div>
          </div>
        </div>
      )}

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
