'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Repeat, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

interface RecurrenceSelectorProps {
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrenceInterval?: number;
  recurrenceDays?: string[];
  recurrenceEndDate?: string;
  onRecurrenceChange: (data: {
    type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number;
    days?: string[];
    endDate?: string;
  }) => void;
}

export function RecurrenceSelector({
  recurrenceType,
  recurrenceInterval = 1,
  recurrenceDays = [],
  recurrenceEndDate,
  onRecurrenceChange
}: RecurrenceSelectorProps) {
  const t = useTranslations('recurrence');
  const tCommon = useTranslations('common');

  const weekDays = [
    { key: 'sun', label: t('days.su') },
    { key: 'mon', label: t('days.mo') },
    { key: 'tue', label: t('days.tu') },
    { key: 'wed', label: t('days.we') },
    { key: 'thu', label: t('days.th') },
    { key: 'fri', label: t('days.fr') },
    { key: 'sat', label: t('days.sa') },
  ];

  const handleTypeChange = (value: string) => {
    if (value === 'none') {
      onRecurrenceChange({ type: undefined });
    } else {
      onRecurrenceChange({ 
        type: value as any,
        interval: recurrenceInterval || 1,
        days: value === 'weekly' ? recurrenceDays : undefined,
        endDate: recurrenceEndDate
      });
    }
  };

  const toggleDay = (dayKey: string) => {
    const currentDays = recurrenceDays || [];
    const newDays = currentDays.includes(dayKey)
      ? currentDays.filter(d => d !== dayKey)
      : [...currentDays, dayKey];
    
    onRecurrenceChange({
      type: recurrenceType,
      interval: recurrenceInterval,
      days: newDays,
      endDate: recurrenceEndDate
    });
  };

  return (
    <div className="space-y-4 rounded-lg border p-4 bg-slate-50">
      <div className="flex items-center gap-2 mb-2">
        <Repeat className="h-4 w-4 text-muted-foreground" />
        <Label className="font-semibold">{t('title')}</Label>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Select 
            value={recurrenceType || 'none'} 
            onValueChange={handleTypeChange}
          >
            <SelectTrigger>
              <SelectValue placeholder={t('select')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('none')}</SelectItem>
              <SelectItem value="daily">{t('daily')}</SelectItem>
              <SelectItem value="weekly">{t('weekly')}</SelectItem>
              <SelectItem value="monthly">{t('monthly')}</SelectItem>
              <SelectItem value="yearly">{t('yearly')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {recurrenceType && (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('every')}</span>
              <Input
                type="number"
                min={1}
                value={recurrenceInterval}
                onChange={(e) => onRecurrenceChange({
                  type: recurrenceType,
                  interval: parseInt(e.target.value) || 1,
                  days: recurrenceDays,
                  endDate: recurrenceEndDate
                })}
                className="w-20"
              />
              <span className="text-sm text-muted-foreground">
                {t(`units.${recurrenceType}`)}
              </span>
            </div>

            {recurrenceType === 'weekly' && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">{t('repeatOn')}</Label>
                <div className="flex gap-1 flex-wrap">
                  {weekDays.map((day) => (
                    <button
                      key={day.key}
                      type="button"
                      onClick={() => toggleDay(day.key)}
                      className={cn(
                        "h-8 w-8 rounded-full text-xs flex items-center justify-center border transition-colors",
                        recurrenceDays?.includes(day.key)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-slate-100"
                      )}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Label className="text-xs text-muted-foreground">{t('endDate')}</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !recurrenceEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {recurrenceEndDate ? format(new Date(recurrenceEndDate), "PPP") : <span>{t('noEndDate')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={recurrenceEndDate ? new Date(recurrenceEndDate) : undefined}
                      onSelect={(date) => onRecurrenceChange({
                        type: recurrenceType,
                        interval: recurrenceInterval,
                        days: recurrenceDays,
                        endDate: date ? date.toISOString() : undefined
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {recurrenceEndDate && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRecurrenceChange({
                      type: recurrenceType,
                      interval: recurrenceInterval,
                      days: recurrenceDays,
                      endDate: undefined
                    })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
