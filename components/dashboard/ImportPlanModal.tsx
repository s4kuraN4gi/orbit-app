'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { FileUp, ChevronRight, ChevronDown, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { parsePlanMarkdown, convertToApiFormat, ParsedTask } from '@/lib/planParser';
import { bulkCreateTasks } from '@/app/actions/bulkCreate';
import { Badge } from '@/components/ui/badge';
import type { PlanTier } from '@/types';

interface ImportPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  planTier?: PlanTier;
}

// Recursive component to display task preview
function TaskPreviewItem({ task, depth = 0 }: { task: ParsedTask; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = task.children && task.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className="flex items-center gap-1 py-1 hover:bg-muted/50 rounded cursor-pointer"
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-3" />
        )}
        <span className="text-sm truncate">{task.title}</span>
      </div>
      {hasChildren && isExpanded && (
        <div>
          {task.children!.map((child, i) => (
            <TaskPreviewItem key={i} task={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

// Count total tasks recursively
function countTasks(tasks: ParsedTask[]): number {
  return tasks.reduce((count, task) => {
    return count + 1 + (task.children ? countTasks(task.children) : 0);
  }, 0);
}

export function ImportPlanModal({ isOpen, onClose, projectId, planTier = 'free' }: ImportPlanModalProps) {
  const t = useTranslations('import');
  const router = useRouter();
  const [markdown, setMarkdown] = useState('');
  const [sourceTool, setSourceTool] = useState<'Cursor' | 'Antigravity' | 'Manual'>('Manual');
  const [isImporting, setIsImporting] = useState(false);

  // Parse markdown on change
  const parsedTasks = useMemo(() => {
    if (!markdown.trim()) return [];
    try {
      return parsePlanMarkdown(markdown);
    } catch (e) {
      console.error('Parse error:', e);
      return [];
    }
  }, [markdown]);

  const taskCount = useMemo(() => countTasks(parsedTasks), [parsedTasks]);

  const handleImport = async () => {
    if (parsedTasks.length === 0) {
      toast.error(t('noTasksError'));
      return;
    }

    setIsImporting(true);
    try {
      const payload = convertToApiFormat(parsedTasks, projectId, sourceTool, markdown);
      
      const result = await bulkCreateTasks(payload);

      if (!result.success) {
        throw new Error(result.error || 'Import failed');
      }

      toast.success(t('success', { count: taskCount }));
      setMarkdown('');
      onClose();
      router.refresh();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(t('error') + ': ' + error.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      setMarkdown('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!w-[90vw] !max-w-[1200px] h-[85vh] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
            {planTier === 'free' && (
              <span className="block mt-1 text-xs">
                <Badge variant="secondary" className="text-[10px]">{t('freeBadge')}</Badge>{' '}
                {t('freeLimit')}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
          {/* Left: Input */}
          <div className="flex flex-col gap-2 min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <Label>{t('markdownLabel')}</Label>
              <Select value={sourceTool} onValueChange={(v: any) => setSourceTool(v)}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cursor">Cursor</SelectItem>
                  <SelectItem value="Antigravity">Antigravity</SelectItem>
                  <SelectItem value="Manual">{t('sourceManual')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder={t('placeholder')}
              className="flex-1 font-mono text-sm resize-none"
            />
          </div>

          {/* Right: Preview */}
          <div className="flex flex-col gap-2 min-h-0">
            <Label>
              {t('preview')} 
              {taskCount > 0 && (
                <span className="text-muted-foreground ml-2">
                  ({taskCount} {t('tasks')})
                </span>
              )}
            </Label>
            <div className="flex-1 border rounded-md p-2 overflow-y-auto bg-muted/30">
              {parsedTasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  {t('noPreview')}
                </div>
              ) : (
                parsedTasks.map((task, i) => (
                  <TaskPreviewItem key={i} task={task} />
                ))
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isImporting}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={isImporting || parsedTasks.length === 0}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('importing')}
              </>
            ) : (
              <>
                <FileUp className="h-4 w-4 mr-2" />
                {t('import')} ({taskCount})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
