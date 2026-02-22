'use client';

import React, { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Tag, Plus, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { labelColors } from '@/lib/constants';
import {
  Label,
  getProjectLabels,
  getTaskLabels,
  createLabel,
  addLabelToTask,
  removeLabelFromTask,
} from '@/app/actions/label';
import { useTranslations } from 'next-intl';

interface LabelSelectorProps {
  taskId: string;
  projectId: string;
}

export function LabelSelector({ taskId, projectId }: LabelSelectorProps) {
  const t = useTranslations('labels');
  const tCommon = useTranslations('common');
  const [projectLabels, setProjectLabels] = useState<Label[]>([]);
  const [taskLabels, setTaskLabels] = useState<Label[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(labelColors[0]);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Initial load of task labels
  useEffect(() => {
    getTaskLabels(taskId)
      .then(setTaskLabels)
      .catch((e) => console.error('Failed to load task labels:', e))
      .finally(() => setIsLoading(false));
  }, [taskId]);

  // Load project labels when popover opens
  useEffect(() => {
    if (isOpen) {
      setIsProjectLabelsLoading(true);
      getProjectLabels(projectId)
        .then(setProjectLabels)
        .catch((e) => {
          console.error('Failed to load project labels:', e);
          toast.error(t('loadError'));
        })
        .finally(() => setIsProjectLabelsLoading(false));
    }
  }, [isOpen, projectId, t]);

  const [isProjectLabelsLoading, setIsProjectLabelsLoading] = useState(false);

  const handleToggleLabel = (label: Label) => {
    const isSelected = taskLabels.some(l => l.id === label.id);
    
    startTransition(async () => {
      try {
        if (isSelected) {
          await removeLabelFromTask(taskId, label.id);
          setTaskLabels(prev => prev.filter(l => l.id !== label.id));
        } else {
          await addLabelToTask(taskId, label.id);
          setTaskLabels(prev => [...prev, label]);
        }
      } catch {
        toast.error(t('updateError'));
      }
    });
  };

  const handleCreateLabel = () => {
    if (!newLabelName.trim()) return;

    startTransition(async () => {
      try {
        const label = await createLabel(projectId, newLabelName, newLabelColor);
        if (label) {
          setProjectLabels(prev => [...prev, label]);
          setNewLabelName('');
          setIsCreating(false);
          toast.success(t('createSuccess'));
        }
      } catch {
        toast.error(t('createError'));
      }
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Tag className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{t('title')}</span>
      </div>

      {/* Current Labels */}
      <div className="flex flex-wrap gap-1.5">
        {taskLabels.length === 0 && !isLoading ? (
          <span className="text-sm text-muted-foreground">{t('noLabels')}</span>
        ) : (
          taskLabels.map((label) => (
            <Badge
              key={label.id}
              style={{ backgroundColor: label.color }}
              className="text-white px-2 py-0.5 text-xs cursor-pointer hover:opacity-80"
              onClick={() => handleToggleLabel(label)}
            >
              {label.name}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))
        )}
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 px-2">
              <Plus className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2" align="start">
            {isProjectLabelsLoading ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                {tCommon('loading')}
              </div>
            ) : isCreating ? (
              <div className="space-y-3">
                <div className="text-sm font-medium">{t('newLabel')}</div>
                <Input
                  placeholder={t('labelName')}
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === 'Enter') handleCreateLabel();
                    if (e.key === 'Escape') setIsCreating(false);
                  }}
                  autoFocus
                />
                <div className="flex gap-1 flex-wrap">
                  {labelColors.map((color) => (
                    <button
                      key={color}
                      className="w-6 h-6 rounded-full border-2 transition-transform hover:scale-110"
                      style={{
                        backgroundColor: color,
                        borderColor: color === newLabelColor ? 'white' : 'transparent',
                        boxShadow: color === newLabelColor ? `0 0 0 2px ${color}` : 'none',
                      }}
                      onClick={() => setNewLabelColor(color)}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCreateLabel} disabled={isPending || !newLabelName.trim()}>
                    {tCommon('create')}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
                    {tCommon('cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-medium mb-2">{t('selectLabel')}</div>
                {projectLabels.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-2">
                    {t('noLabelsInProject')}
                  </div>
                ) : (
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {projectLabels.map((label) => {
                      const isSelected = taskLabels.some(l => l.id === label.id);
                      return (
                        <button
                          key={label.id}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-left"
                          onClick={() => handleToggleLabel(label)}
                          disabled={isPending}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: label.color }}
                          />
                          <span className="flex-1 text-sm">{label.name}</span>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setIsCreating(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('createNew')}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
