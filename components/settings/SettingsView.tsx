'use client';

import React, { useState, useTransition } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ArrowLeft, Moon, Sun, Monitor, Palette, Keyboard, User, Bell, BellOff } from 'lucide-react';
import Link from 'next/link';
import { updateUserSettings } from '@/app/actions/settings';
import { UserSettings, defaultColors, CustomColors, ThemeColors } from '@/lib/theme';
import { ColorPicker } from './ColorPicker';
import { ThemePreview } from './ThemePreview';
import { useTheme } from '@/components/ThemeProvider';
import { useTranslations } from 'next-intl';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';

interface SettingsViewProps {
  initialSettings: UserSettings | null;
  userEmail: string;
}

const colorKeys: (keyof ThemeColors)[] = [
  'primary', 'primaryForeground', 'background', 'foreground', 
  'card', 'accent', 'destructive', 'muted', 'border'
];

export function SettingsView({ initialSettings, userEmail }: SettingsViewProps) {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const tDashboard = useTranslations('dashboard');
  const [isPending, startTransition] = useTransition();
  const { theme, setTheme: setThemeContext, setCustomColors: setContextColors } = useTheme();
  const [defaultView, setDefaultView] = useState<'list' | 'board' | 'gantt'>(initialSettings?.default_view || 'list');
  const [language, setLanguage] = useState<'ja' | 'en'>(initialSettings?.language || 'ja');
  
  // Custom colors state
  const [customColors, setCustomColors] = useState<CustomColors>(
    initialSettings?.custom_colors || defaultColors
  );
  const [activeColorMode, setActiveColorMode] = useState<'light' | 'dark'>('light');

  // Notification hook
  const { permission, isSupported, requestPermission } = useTaskNotifications();

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      toast.success(t('notifications.enabled'));
    } else if (result === 'denied') {
      toast.error(t('notifications.denied'));
    }
  };

  const handleThemeChange = (value: 'light' | 'dark' | 'system') => {
    setThemeContext(value); // Apply theme immediately via context
    startTransition(async () => {
      try {
        await updateUserSettings({ theme: value });
        toast.success('テーマを更新しました');
      } catch {
        toast.error('更新に失敗しました');
      }
    });
  };

  const handleDefaultViewChange = (value: 'list' | 'board' | 'gantt') => {
    setDefaultView(value);
    startTransition(async () => {
      try {
        await updateUserSettings({ default_view: value });
        toast.success('デフォルトビューを更新しました');
      } catch {
        toast.error('更新に失敗しました');
      }
    });
  };

  const handleLanguageChange = (value: 'ja' | 'en') => {
    setLanguage(value);
    // Set cookie for immediate locale switching
    document.cookie = `NEXT_LOCALE=${value}; path=/; max-age=31536000`; // 1 year
    startTransition(async () => {
      try {
        await updateUserSettings({ language: value });
        toast.success(value === 'ja' ? '言語を更新しました' : 'Language updated');
        // Reload page to apply new locale
        window.location.reload();
      } catch {
        toast.error(value === 'ja' ? '更新に失敗しました' : 'Update failed');
      }
    });
  };

  const handleColorChange = (key: keyof ThemeColors, color: string) => {
    setCustomColors(prev => ({
      ...prev,
      [activeColorMode]: {
        ...prev[activeColorMode],
        [key]: color,
      },
    }));
  };

  const handleSaveColors = () => {
    startTransition(async () => {
      try {
        await updateUserSettings({ custom_colors: customColors });
        setContextColors(customColors); // Apply colors immediately via context
        toast.success('カラー設定を保存しました');
      } catch {
        toast.error('保存に失敗しました');
      }
    });
  };

  const handleResetColors = () => {
    setCustomColors(defaultColors);
    startTransition(async () => {
      try {
        await updateUserSettings({ custom_colors: null });
        setContextColors(null); // Reset colors via context
        toast.success('カラー設定をリセットしました');
      } catch {
        toast.error('リセットに失敗しました');
      }
    });
  };

  // applyTheme is now handled by ThemeProvider context

  const applyCustomColors = (colors: CustomColors, currentTheme: string) => {
    const root = document.documentElement;
    const isDark = currentTheme === 'dark' || 
      (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    const activeColors = isDark ? colors.dark : colors.light;
    
    Object.entries(activeColors).forEach(([key, value]) => {
      root.style.setProperty(`--custom-${key}`, value);
    });
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/dashboard">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground">{userEmail}</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5" />
              <CardTitle>{t('general')}</CardTitle>
            </div>
            <CardDescription>{t('generalDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('theme.title')}</Label>
                <p className="text-sm text-muted-foreground">{t('themeDesc')}</p>
              </div>
              <Select value={theme} onValueChange={handleThemeChange} disabled={isPending}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" /> {t('theme.light')}
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" /> {t('theme.dark')}
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" /> {t('theme.system')}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Default View */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('defaultView.title')}</Label>
                <p className="text-sm text-muted-foreground">{t('defaultView.description')}</p>
              </div>
              <Select value={defaultView} onValueChange={handleDefaultViewChange} disabled={isPending}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">{tDashboard('views.list')}</SelectItem>
                  <SelectItem value="board">{tDashboard('views.board')}</SelectItem>
                  <SelectItem value="gantt">{tDashboard('views.gantt')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Language */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>{t('language.title')}</Label>
                <p className="text-sm text-muted-foreground">{t('language.desc')}</p>
              </div>
              <Select value={language} onValueChange={handleLanguageChange} disabled={isPending}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ja">{t('language.ja')}</SelectItem>
                  <SelectItem value="en">{t('language.en')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Custom Colors */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              <CardTitle>{t('customColors.title')}</CardTitle>
            </div>
            <CardDescription>{t('customColors.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={activeColorMode === 'light' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveColorMode('light')}
              >
                <Sun className="h-4 w-4 mr-1" /> {t('customColors.lightMode')}
              </Button>
              <Button
                variant={activeColorMode === 'dark' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveColorMode('dark')}
              >
                <Moon className="h-4 w-4 mr-1" /> {t('customColors.darkMode')}
              </Button>
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {colorKeys.map((key) => (
                <ColorPicker
                  key={key}
                  label={t(`customColors.${key}`)}
                  value={customColors[activeColorMode][key]}
                  onChange={(color) => handleColorChange(key, color)}
                />
              ))}
            </div>

            <Separator />

            {/* Preview */}
            <div>
              <Label className="mb-2 block">{t('customColors.preview')}</Label>
              <ThemePreview colors={customColors[activeColorMode]} />
            </div>

            <Separator />

            {/* Actions */}
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleResetColors} disabled={isPending}>
                {t('resetColors')}
              </Button>
              <Button onClick={handleSaveColors} disabled={isPending}>
                {isPending ? t('saving') : t('saveColors')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Keyboard className="h-5 w-5" />
              <CardTitle>{t('shortcuts.title')}</CardTitle>
            </div>
            <CardDescription>{t('shortcuts.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span>{t('shortcuts.newTask')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">N</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('shortcuts.focusSearch')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">/</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('shortcuts.listView')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">1</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('shortcuts.boardView')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">2</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('shortcuts.ganttView')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">3</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('shortcuts.closeModal')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">Esc</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('shortcuts.showShortcuts')}</span>
                <kbd className="px-2 py-1 bg-muted rounded text-xs font-mono">?</kbd>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>{t('notifications.title')}</CardTitle>
            </div>
            <CardDescription>{t('notifications.desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSupported ? (
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('notifications.browserNotifications')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {permission === 'granted' 
                      ? t('notifications.statusEnabled')
                      : permission === 'denied'
                      ? t('notifications.statusDenied')
                      : t('notifications.statusDefault')}
                  </p>
                </div>
                {permission === 'granted' ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Bell className="h-4 w-4" />
                    <span className="text-sm">{t('notifications.enabled')}</span>
                  </div>
                ) : permission === 'denied' ? (
                  <div className="flex items-center gap-2 text-red-500">
                    <BellOff className="h-4 w-4" />
                    <span className="text-sm">{t('notifications.denied')}</span>
                  </div>
                ) : (
                  <Button onClick={handleEnableNotifications} disabled={isPending}>
                    {t('notifications.enable')}
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('notifications.notSupported')}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
