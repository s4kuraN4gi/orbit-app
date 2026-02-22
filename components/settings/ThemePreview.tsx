'use client';

import React from 'react';
import { ThemeColors } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface ThemePreviewProps {
  colors: ThemeColors;
}

export function ThemePreview({ colors }: ThemePreviewProps) {
  const t = useTranslations('settings.preview');

  return (
    <div
      className="rounded-lg p-4 border"
      style={{
        backgroundColor: colors.background,
        borderColor: colors.border,
      }}
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 
            className="font-semibold"
            style={{ color: colors.foreground }}
          >
            {t('title')}
          </h3>
          <Button
            size="sm"
            style={{
              backgroundColor: colors.primary,
              color: colors.primaryForeground,
            }}
          >
            {t('button')}
          </Button>
        </div>

        {/* Card */}
        <Card
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
          }}
        >
          <CardContent className="p-4">
            <p style={{ color: colors.foreground }}>
              {t('cardContent')}
            </p>
            <p 
              className="text-sm mt-1"
              style={{ color: colors.muted }}
            >
              {t('mutedText')}
            </p>
          </CardContent>
        </Card>

        {/* Badges */}
        <div className="flex gap-2">
          <span
            className="px-2 py-1 rounded text-xs"
            style={{
              backgroundColor: colors.accent,
              color: colors.foreground,
            }}
          >
            {t('accent')}
          </span>
          <span
            className="px-2 py-1 rounded text-xs text-white"
            style={{
              backgroundColor: colors.destructive,
            }}
          >
            {t('destructive')}
          </span>
        </div>
      </div>
    </div>
  );
}
