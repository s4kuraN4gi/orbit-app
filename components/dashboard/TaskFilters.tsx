'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface TaskFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onClearFilters: () => void;
  showCompleted: boolean;
  onShowCompletedChange: (show: boolean) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function TaskFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onClearFilters,
  showCompleted,
  onShowCompletedChange,
  searchInputRef,
}: TaskFiltersProps) {
  const t = useTranslations();
  const tFilters = useTranslations('dashboard.filters');
  const hasFilters = searchQuery || statusFilter !== 'all';

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-muted rounded-lg border">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          placeholder={t('dashboard.filters.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      {/* Show Completed Toggle */}
      <div className="flex items-center space-x-2 bg-background px-3 py-2 rounded-md border">
        <Switch
          id="show-completed"
          checked={showCompleted}
          onCheckedChange={onShowCompletedChange}
        />
        <Label htmlFor="show-completed" className="text-sm cursor-pointer whitespace-nowrap">
          {tFilters('showCompleted')}
        </Label>
      </div>

      {/* Status Filter */}
      <Select value={statusFilter} onValueChange={onStatusChange}>
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder={t('task.status.label')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('dashboard.filters.all')}</SelectItem>
          <SelectItem value="todo">{t('task.status.todo')}</SelectItem>
          <SelectItem value="in_progress">{t('task.status.in_progress')}</SelectItem>
          <SelectItem value="done">{t('task.status.done')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearFilters}
        disabled={!hasFilters}
        className="text-muted-foreground"
      >
        <X className="h-4 w-4 mr-1" />
        {t('common.reset')}
      </Button>
    </div>
  );
}
