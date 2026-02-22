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
import { createProject } from '@/app/actions/project';
import { toast } from 'sonner';

import { useTranslations } from 'next-intl';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (projectId: string) => void;
}

export function CreateProjectModal({ isOpen, onClose, onProjectCreated }: CreateProjectModalProps) {
  const t = useTranslations('project');
  const tCommon = useTranslations('common');
  const [isLoading, setIsLoading] = React.useState(false);
  const [name, setName] = React.useState('');
  const [key, setKey] = React.useState('');

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
      const project = await createProject(name, key);
      toast.success(t('createSuccess'));
      setName('');
      setKey('');
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
      </DialogContent>
    </Dialog>
  );
}
