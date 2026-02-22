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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createTask } from '@/app/actions/task';
import { getTemplates } from '@/app/actions/template';
import { toast } from 'sonner';
import { LayoutTemplate } from 'lucide-react';
import { TemplateManager } from './TemplateManager';

import { RecurrenceSelector } from './RecurrenceSelector';
import { useTranslations } from 'next-intl';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

interface Template {
  id: string;
  name: string;
  title: string;
  description: string;
  priority: string;
}

export function CreateTaskModal({ isOpen, onClose, projectId }: CreateTaskModalProps) {
  const t = useTranslations('task');
  const tCommon = useTranslations('common');
  const tTemplates = useTranslations('templates');
  
  const [isLoading, setIsLoading] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [priority, setPriority] = React.useState('medium');
  const [status, setStatus] = React.useState('todo');
  const [startDate, setStartDate] = React.useState('');
  const [dueDate, setDueDate] = React.useState('');

  // Recurrence State
  const [recurrenceType, setRecurrenceType] = React.useState<'daily' | 'weekly' | 'monthly' | 'yearly' | undefined>(undefined);
  const [recurrenceInterval, setRecurrenceInterval] = React.useState(1);
  const [recurrenceDays, setRecurrenceDays] = React.useState<string[]>([]);
  const [recurrenceEndDate, setRecurrenceEndDate] = React.useState<string | undefined>(undefined);

  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = React.useState(false);

  const [selectedTemplateId, setSelectedTemplateId] = React.useState('');

  // Load templates and reset form when modal opens
  React.useEffect(() => {
    if (isOpen && projectId) {
      loadTemplates();
      // Reset all form fields
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setStartDate('');
      setDueDate('');
      setSelectedTemplateId('');
      
      // Reset Recurrence
      setRecurrenceType(undefined);
      setRecurrenceInterval(1);
      setRecurrenceDays([]);
      setRecurrenceEndDate(undefined);
    }
  }, [isOpen, projectId]);

  const loadTemplates = async () => {
    const result = await getTemplates(projectId);
    if (result.success && result.data) {
      setTemplates(result.data);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    if (templateId === 'manage') {
      setIsTemplateManagerOpen(true);
      // Reset selection so "Manage" doesn't stay selected
      setSelectedTemplateId('');
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setTitle(template.title);
      setDescription(template.description || '');
      setPriority(template.priority || 'medium');
      toast.success(tTemplates('loaded'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error(t('titleRequired'));
      return;
    }

    // Validate dates if both are provided
    if (startDate && dueDate && new Date(startDate) > new Date(dueDate)) {
      toast.error(t('dateError'));
      return;
    }

    setIsLoading(true);
    try {
      await createTask(
        projectId, 
        title, 
        description, 
        priority, 
        status as 'todo' | 'in_progress' | 'done',
        undefined, // parentId
        startDate || undefined,
        dueDate || undefined,
        undefined, // templateId
        recurrenceType,
        recurrenceInterval,
        recurrenceDays,
        recurrenceEndDate
      );
      toast.success(t('create.success'));
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('todo');
      setStartDate('');
      setDueDate('');
      setSelectedTemplateId('');
      
      setRecurrenceType(undefined);
      setRecurrenceInterval(1);
      setRecurrenceDays([]);
      setRecurrenceEndDate(undefined);
      
      onClose();
    } catch (error) {
      toast.error(t('create.error'));
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('create.title')}</DialogTitle>
            <DialogDescription>
              {t('create.desc')}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              {/* Template Selector */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <LayoutTemplate className="h-4 w-4" />
                  {tTemplates('select')}
                </Label>
                <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder={tTemplates('select')} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                    <div className="border-t my-1"></div>
                    <SelectItem value="manage" className="text-primary font-medium cursor-pointer">
                      {tTemplates('manage')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="title">{t('title')} *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (selectedTemplateId) setSelectedTemplateId(''); // Detach template
                  }}
                  placeholder={t('titlePlaceholder')}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (selectedTemplateId) setSelectedTemplateId(''); // Detach template
                  }}
                  placeholder={t('descriptionPlaceholder')}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="priority">{t('priority.label')}</Label>
                  <Select 
                    value={priority} 
                    onValueChange={(value) => {
                      setPriority(value);
                      if (selectedTemplateId) setSelectedTemplateId(''); // Detach template
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('priority.label')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{t('priority.low')}</SelectItem>
                      <SelectItem value="medium">{t('priority.medium')}</SelectItem>
                      <SelectItem value="high">{t('priority.high')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">{t('status.label')}</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('status.label')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todo">{t('status.todo')}</SelectItem>
                      <SelectItem value="in_progress">{t('status.in_progress')}</SelectItem>
                      <SelectItem value="done">{t('status.done')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">{t('startDate')}</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">{t('dueDate')}</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <RecurrenceSelector
                recurrenceType={recurrenceType}
                recurrenceInterval={recurrenceInterval}
                recurrenceDays={recurrenceDays}
                recurrenceEndDate={recurrenceEndDate}
                onRecurrenceChange={(data) => {
                  setRecurrenceType(data.type);
                  if (data.interval) setRecurrenceInterval(data.interval);
                  setRecurrenceDays(data.days || []);
                  setRecurrenceEndDate(data.endDate);
                }}
              />
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

      <TemplateManager 
        isOpen={isTemplateManagerOpen} 
        projectId={projectId} 
        onClose={() => {
          setIsTemplateManagerOpen(false);
          loadTemplates(); // Reload templates after manager closes (in case of deletions)
        }} 
      />
    </>
  );
}
