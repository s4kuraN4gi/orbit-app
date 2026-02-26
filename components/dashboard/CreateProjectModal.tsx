'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createProject } from '@/app/actions/project';
import { toast } from 'sonner';

import { useTranslations } from 'next-intl';
import { PricingGate } from './PricingGate';
import type { PlanTier } from '@/types';

interface OrgOption {
  id: string;
  name: string;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (projectId: string) => void;
  planTier?: PlanTier;
  currentProjectCount?: number;
  organizations?: OrgOption[];
}

export function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated,
  planTier = 'free',
  currentProjectCount = 0,
  organizations = [],
}: CreateProjectModalProps) {
  const t = useTranslations('project');
  const tTeam = useTranslations('team');
  const tCommon = useTranslations('common');
  const [isLoading, setIsLoading] = React.useState(false);
  const [name, setName] = React.useState('');
  const [key, setKey] = React.useState('');
  const [selectedOrgId, setSelectedOrgId] = React.useState<string>('personal');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error(t('nameRequired'));
      return;
    }
    if (!key.trim() || key.length > 10) {
      toast.error(t('keyRequired'));
      return;
    }

    setIsLoading(true);
    try {
      const orgId = selectedOrgId === 'personal' ? null : selectedOrgId;
      const project = await createProject(name, key, orgId);
      toast.success(t('createSuccess'));
      setName('');
      setKey('');
      setSelectedOrgId('personal');
      onClose();
      onProjectCreated(project.id);
    } catch (error) {
      toast.error(t('createError'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{t('createTitle')}</DialogTitle>
          <DialogDescription>
            {t('createDesc')}
          </DialogDescription>
        </DialogHeader>
        <PricingGate feature="project_limit" currentPlan={planTier} itemIndex={currentProjectCount}>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t('name')} *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('namePlaceholder')}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="key">{t('key')} *</Label>
                <Input
                  id="key"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toUpperCase())}
                  placeholder={t('keyPlaceholder')}
                  maxLength={10}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {t('keyHelper')}
                </p>
              </div>
              {organizations.length > 0 && (
                <div className="grid gap-2">
                  <Label>{tTeam('ownerLabel')}</Label>
                  <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">{tTeam('personal')}</SelectItem>
                      {organizations.map((org) => (
                        <SelectItem key={org.id} value={org.id}>
                          {org.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                {tCommon('cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? tCommon('loading') : tCommon('create')}
              </Button>
            </DialogFooter>
          </form>
        </PricingGate>
      </DialogContent>
    </Dialog>
  );
}
