'use client';

import React from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { AIContextCard } from './AIContextCard';
import { CommentSection } from './CommentSection';
import { LabelSelector } from './LabelSelector';
import { updateTaskStatus, updateTaskPriority, deleteTask, updateTask, createTask, updateTaskDates } from '@/app/actions/task';
import { createTemplate } from '@/app/actions/template';
import { getTaskComments, Comment } from '@/app/actions/comment';
import { toast } from 'sonner';
import { Trash2, Pencil, Check, X, Plus, ChevronRight, Calendar, LayoutTemplate, Repeat } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { RecurrenceSelector } from './RecurrenceSelector';
import { DependencySection } from './DependencySection';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
  currentUserEmail?: string;
}

export function TaskDetailModal({ task, isOpen, onClose, projectId, currentUserEmail }: TaskDetailModalProps) {
  const t = useTranslations('task');
  const tCommon = useTranslations('common');
  const tTemplates = useTranslations('templates');
  const tRecurrence = useTranslations('recurrence');
  const locale = useLocale();

  // Helper function to format date for display
  const formatDate = (dateStr: string | null | undefined): string => {
    if (!dateStr) return t('notSet');
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
    } catch {
      return t('notSet');
    }
  };

  // Helper function to format date for input
  const formatDateForInput = (dateStr: string | null | undefined): string => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const [isDeleting, setIsDeleting] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [editStartDate, setEditStartDate] = React.useState('');
  const [editDueDate, setEditDueDate] = React.useState('');
  
  // Recurrence Edit State
  const [editRecurrenceType, setEditRecurrenceType] = React.useState<'daily' | 'weekly' | 'monthly' | 'yearly' | undefined>(undefined);
  const [editRecurrenceInterval, setEditRecurrenceInterval] = React.useState(1);
  const [editRecurrenceDays, setEditRecurrenceDays] = React.useState<string[]>([]);
  const [editRecurrenceEndDate, setEditRecurrenceEndDate] = React.useState<string | undefined>(undefined);
  
  const [isSaving, setIsSaving] = React.useState(false);
  
  // Subtask creation
  const [isAddingSubtask, setIsAddingSubtask] = React.useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');
  const [isCreatingSubtask, setIsCreatingSubtask] = React.useState(false);

  // Comments
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = React.useState(false);

  // Track last task ID to detect actual task changes vs revalidation
  const lastTaskIdRef = React.useRef<string | null>(null);

  // Reset edit state only when switching to a different task
  React.useEffect(() => {
    if (task && task.id !== lastTaskIdRef.current) {
      lastTaskIdRef.current = task.id;
      setEditTitle(task.title);
      setEditDescription(task.description || '');
      setEditStartDate(formatDateForInput(task.start_date));
      setEditDueDate(formatDateForInput(task.due_date));
      
      // Initialize recurrence state
      setEditRecurrenceType(task.recurrence_type);
      setEditRecurrenceInterval(task.recurrence_interval || 1);
      setEditRecurrenceDays(task.recurrence_days || []);
      setEditRecurrenceEndDate(task.recurrence_end_date || undefined);
      
      setIsEditing(false);
      setIsAddingSubtask(false);
      setNewSubtaskTitle('');
    }
  }, [task]);

  // Reset task ID ref when modal closes so same task can be reopened fresh
  React.useEffect(() => {
    if (!isOpen) {
      lastTaskIdRef.current = null;
      setComments([]);
    }
  }, [isOpen]);

  // Load comments when task changes
  React.useEffect(() => {
    if (task && isOpen) {
      setIsLoadingComments(true);
      getTaskComments(task.id)
        .then(setComments)
        .finally(() => setIsLoadingComments(false));
    }
  }, [task?.id, isOpen]);

  if (!task) return null;

  const handleStatusChange = async (value: string) => {
     try {
         await updateTaskStatus(task.id, value as TaskStatus);
         toast.success(t('statusUpdated'));
     } catch (e) {
         toast.error(t('statusUpdateError'));
     }
  };

  const handlePriorityChange = async (value: string) => {
     try {
         await updateTaskPriority(task.id, value as TaskPriority);
         toast.success(t('priorityUpdated'));
     } catch (e) {
         toast.error(t('priorityUpdateError'));
     }
  };

  const handleDelete = async () => {
    if (!confirm(t('deleteConfirm', { title: task.title }))) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await deleteTask(task.id);
      toast.success(t('taskDeleted'));
      onClose();
    } catch (e) {
      toast.error(t('taskDeleteError'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStartEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditStartDate(formatDateForInput(task.start_date));
    setEditDueDate(formatDateForInput(task.due_date));
    
    setEditRecurrenceType(task.recurrence_type);
    setEditRecurrenceInterval(task.recurrence_interval || 1);
    setEditRecurrenceDays(task.recurrence_days || []);
    setEditRecurrenceEndDate(task.recurrence_end_date || undefined);
    
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditStartDate(formatDateForInput(task.start_date));
    setEditDueDate(formatDateForInput(task.due_date));
    
    // Reset to task props
    // ... no need to reset specific recurrence states here as they'll be reset on next open or useEffect
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast.error(t('titleRequired'));
      return;
    }

    // Validate dates if both are provided
    if (editStartDate && editDueDate && new Date(editStartDate) > new Date(editDueDate)) {
      toast.error(t('dateError'));
      return;
    }

    setIsSaving(true);
    try {
      // Calculate dates
      const startDate = editStartDate ? new Date(editStartDate).toISOString() : null;
      const dueDate = editDueDate ? new Date(editDueDate).toISOString() : (startDate ? new Date(new Date(startDate).getTime() + 24 * 60 * 60 * 1000).toISOString() : null);

      // Update task with all fields
      await updateTask(task.id, {
        title: editTitle,
        description: editDescription || undefined,
        start_date: startDate,
        due_date: dueDate,
        recurrence_type: editRecurrenceType || null,
        recurrence_interval: editRecurrenceInterval,
        recurrence_days: editRecurrenceDays?.length ? editRecurrenceDays : null,
        recurrence_end_date: editRecurrenceEndDate || null,
      });

      toast.success(t('taskUpdated'));
      setIsEditing(false);
    } catch (e) {
      toast.error(t('taskUpdateError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim()) {
      toast.error(t('subtaskTitleRequired'));
      return;
    }

    if (!projectId) {
      toast.error(t('projectNotFound'));
      return;
    }

    setIsCreatingSubtask(true);
    try {
      await createTask(
        projectId,
        newSubtaskTitle,
        undefined,
        'medium',
        'todo',
        task.id
      );
      toast.success(t('subtaskCreated'));
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
    } catch (e) {
      toast.error(t('subtaskCreateError'));
    } finally {
      setIsCreatingSubtask(false);
    }
  };

  const statusColors = {
      todo: 'bg-slate-100',
      in_progress: 'bg-blue-50 text-blue-700',
      done: 'bg-green-50 text-green-700'
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
             <span className="text-xs font-mono text-muted-foreground uppercase">{task.id.slice(0, 8)}</span>
             <div className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[task.status]}`}>
                 {t(`status.${task.status}`)}
             </div>
          </div>
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="text-xl font-semibold"
              placeholder={t('titlePlaceholder')}
            />
            ) : (
            <DialogTitle className="text-xl leading-normal flex items-center gap-2">
              {task.title}
              <Button variant="ghost" size="icon" onClick={handleStartEdit} className="h-6 w-6">
                <Pencil className="h-3 w-3" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto text-xs font-normal"
                onClick={async () => {
                  if (!projectId) return;
                  const name = prompt(tTemplates('namePlaceholder'));
                  if (name) {
                    const result = await createTemplate(projectId, {
                      name,
                      title: task.title,
                      description: task.description,
                      priority: task.priority
                    });
                    if (result.success) {
                      toast.success(tTemplates('saved'));
                    } else {
                      toast.error(tCommon('error'));
                    }
                  }
                }}
              >
                <LayoutTemplate className="h-3 w-3 mr-1" />
                {tTemplates('saveAs')}
              </Button>
            </DialogTitle>
          )}
          <DialogDescription>
            {t('createdAt')}: {formatDate(task.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
            {/* Controls */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="text-sm font-medium">{t('status.label')}</div>
                    <Select defaultValue={task.status} onValueChange={handleStatusChange}>
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
                <div className="space-y-2">
                    <div className="text-sm font-medium">{t('priority.label')}</div>
                    <Select defaultValue={task.priority} onValueChange={handlePriorityChange}>
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
            </div>

            {/* Labels Section */}
            {projectId && (
              <LabelSelector taskId={task.id} projectId={projectId} />
            )}

            <Separator />

            {/* Dependencies Section */}
            {projectId && (
              <DependencySection task={task} projectId={projectId} />
            )}

            <Separator />

            {/* Dates Section */}
            <div className="space-y-3">
              <div className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('schedule')}
                {!isEditing && (
                  <Button variant="ghost" size="icon" onClick={handleStartEdit} className="h-5 w-5">
                    <Pencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
              {isEditing ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">{t('startDate')}</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dueDate">{t('dueDate')}</Label>
                      <Input
                        id="dueDate"
                        type="date"
                        value={editDueDate}
                        onChange={(e) => setEditDueDate(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <RecurrenceSelector
                      recurrenceType={editRecurrenceType}
                      recurrenceInterval={editRecurrenceInterval}
                      recurrenceDays={editRecurrenceDays}
                      recurrenceEndDate={editRecurrenceEndDate}
                      onRecurrenceChange={(data) => {
                        setEditRecurrenceType(data.type);
                        if (data.interval) setEditRecurrenceInterval(data.interval);
                        setEditRecurrenceDays(data.days || []);
                        setEditRecurrenceEndDate(data.endDate);
                      }}
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-slate-50 rounded-lg border">
                      <div className="text-muted-foreground mb-1">{t('startDate')}</div>
                      <div className="font-medium">{editStartDate ? formatDate(editStartDate) : t('notSet')}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border">
                      <div className="text-muted-foreground mb-1">{t('dueDate')}</div>
                      <div className="font-medium">{editDueDate ? formatDate(editDueDate) : t('notSet')}</div>
                    </div>
                  </div>
                  
                  {task.recurrence_type && (
                    <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg border border-blue-100 text-sm">
                      <Repeat className="h-4 w-4" />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {tRecurrence(task.recurrence_type)} 
                          {task.recurrence_interval && task.recurrence_interval > 1 && ` (x${task.recurrence_interval})`}
                        </span>
                        {task.recurrence_end_date && (
                           <span className="text-xs opacity-70">
                             {tRecurrence('endDate')}: {formatDate(task.recurrence_end_date)}
                           </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* AI Context */}
            {task.ai_context && (
                <div className="space-y-2">
                    <div className="text-sm font-semibold flex items-center gap-2">
                        AI Context
                        <span className="text-xs font-normal text-muted-foreground">(Source: {task.ai_context.source_tool})</span>
                    </div>
                    <AIContextCard context={task.ai_context} />
                </div>
            )}

            {/* Description */}
            <div className="space-y-2">
                <div className="text-sm font-semibold flex items-center gap-2">
                  {t('description')}
                  {!isEditing && (
                    <Button variant="ghost" size="icon" onClick={handleStartEdit} className="h-5 w-5">
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {isEditing ? (
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder={t('descriptionPlaceholder')}
                    rows={5}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        handleSaveEdit();
                      }
                    }}
                  />
                ) : (
                  <div className="p-4 bg-slate-50 border rounded-lg text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {task.description || t('noDescription')}
                  </div>
                )}
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>
                  <X className="h-4 w-4 mr-1" />
                  {tCommon('cancel')}
                </Button>
                <Button onClick={handleSaveEdit} disabled={isSaving}>
                  <Check className="h-4 w-4 mr-1" />
                  {isSaving ? t('saving') : tCommon('save')}
                </Button>
              </div>
            )}

            <Separator />

            {/* Subtasks Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{t('subtasks')}</div>
                {!isAddingSubtask && (
                  <Button variant="outline" size="sm" onClick={() => setIsAddingSubtask(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    {t('addSubtask')}
                  </Button>
                )}
              </div>

              {/* Existing Subtasks */}
              {task.children && task.children.length > 0 ? (
                <div className="space-y-2">
                  {task.children.map((subtask) => (
                    <div 
                      key={subtask.id} 
                      className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border text-sm"
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      <span className={subtask.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                        {subtask.title}
                      </span>
                      <div className={`ml-auto px-2 py-0.5 rounded text-xs ${statusColors[subtask.status]}`}>
                        {t(`status.${subtask.status}`)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                !isAddingSubtask && (
                  <div className="text-sm text-muted-foreground">{t('noSubtasks')}</div>
                )
              )}

              {/* Add Subtask Form */}
              {isAddingSubtask && (
                <div className="flex gap-2">
                  <Input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder={t('subtaskPlaceholder')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                        handleCreateSubtask();
                      } else if (e.key === 'Escape') {
                        setIsAddingSubtask(false);
                        setNewSubtaskTitle('');
                      }
                    }}
                    autoFocus
                  />
                  <Button onClick={handleCreateSubtask} disabled={isCreatingSubtask} size="sm">
                    {isCreatingSubtask ? '...' : t('createSubtask')}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsAddingSubtask(false);
                      setNewSubtaskTitle('');
                    }}
                  >
                    {t('cancelSubtask')}
                  </Button>
                </div>
              )}
            </div>
        </div>

        {/* Comments Section */}
        <div className="mt-4">
          {isLoadingComments ? (
            <div className="text-sm text-muted-foreground text-center py-4">{t('loadingComments')}</div>
          ) : (
            <CommentSection
              taskId={task.id}
              initialComments={comments}
              currentUserEmail={currentUserEmail || ''}
            />
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting || isEditing}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? t('deleting') : t('deleteTask')}
          </Button>
          <Button variant="outline" onClick={onClose}>{t('close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
