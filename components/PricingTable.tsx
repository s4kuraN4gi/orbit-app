'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Star, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export function PricingTable() {
  const t = useTranslations('pricing');

  const features: string[] = [
    t('features.f1'),
    t('features.f2'),
    t('features.f3'),
    t('features.f4'),
    t('features.f5'),
    t('features.f6'),
    t('features.f7'),
    t('features.f8'),
    t('features.f9'),
    t('features.f10'),
  ];

  return (
    <div className="space-y-16">
      {/* Single Free Plan Card */}
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl border-2 border-primary ring-2 ring-primary p-10 bg-card relative">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-2">{t('title')}</h3>
            <div className="mb-4">
              <span className="text-5xl font-bold">$0</span>
              <span className="text-muted-foreground ml-2">{t('period')}</span>
            </div>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t('subtitle')}
            </p>
          </div>

          <ul className="grid sm:grid-cols-2 gap-3 mb-8">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto px-8">
                {t('cta')}
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Sponsor Section */}
      <div className="max-w-2xl mx-auto text-center">
        <div className="rounded-2xl border p-8 bg-card">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="h-5 w-5 text-pink-500" />
            <h3 className="text-xl font-bold">{t('sponsor.title')}</h3>
          </div>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {t('sponsor.desc')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://github.com/s4kuraN4gi/orbit-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="gap-2">
                <Star className="h-4 w-4" />
                {t('sponsor.starCta')}
              </Button>
            </a>
            <a
              href="https://github.com/sponsors/s4kuraN4gi"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="lg" className="gap-2">
                <Heart className="h-4 w-4" />
                {t('sponsor.sponsorCta')}
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
