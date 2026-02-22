'use client';

import React from 'react';
import { Task, TaskDependency } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Link, Plus, Trash2, X, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { addDependency, removeDependency, getDependencies } from '@/app/actions/dependency';
import { getTasks } from '@/app/actions/task';
import { toast } from 'sonner';

interface DependencySectionProps {
  task: Task;
  projectId: string;
}

export function DependencySection({ task, projectId }: DependencySectionProps) {
  const t = useTranslations('task.dependencies');
  const [dependencies, setDependencies] = React.useState<TaskDependency[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [availableTasks, setAvailableTasks] = React.useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = React.useState<string>('');
  const [direction, setDirection] = React.useState<'predecessor' | 'successor'>('predecessor');
  const [isLoading, setIsLoading] = React.useState(false);

  const loadData = React.useCallback(async () => {
    try {
      const deps = await getDependencies(projectId);
      setDependencies(deps);
    } catch (e) {
      console.error(e);
    }
  }, [projectId]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter dependencies relevant to THIS task
  const myPredecessors = dependencies.filter(d => d.successor_id === task.id);
  const mySuccessors = dependencies.filter(d => d.predecessor_id === task.id);

  const handleStartAdd = async () => {
    setIsAdding(true);
    // Fetch potential tasks (exclude self)
    // Note: In a real large app, this should be a search input.
    // For now, fetching first 100 tasks of project.
    const { tasks } = await getTasks(projectId);
    setAvailableTasks(tasks.filter(t => t.id !== task.id));
  };

  const handleAdd = async () => {
    if (!selectedTask) return;
    setIsLoading(true);
    try {
        if (direction === 'predecessor') {
            // Selected task replaces THIS task, so Selected -> This
            await addDependency(projectId, selectedTask, task.id);
        } else {
            // This -> Selected
            await addDependency(projectId, task.id, selectedTask);
        }
        toast.success('Link created');
        await loadData();
        setIsAdding(false);
        setSelectedTask('');
    } catch (e) {
        toast.error('Failed to create link');
    } finally {
        setIsLoading(false);
    }
  };

  const handleRemove = async (id: string) => {
      try {
          await removeDependency(id);
          toast.success('Link removed');
          loadData();
      } catch (e) {
          toast.error('Failed to remove link');
      }
  };

  const getTaskTitle = (id: string) => {
      // If we have availableTasks loaded, use that, otherwise we might see ID if strictly following this.
      // Ideally we need to fetch titles of linked tasks if they are not in availableTasks.
      // For this implementation, let's assume valid ID linked tasks are in the broader list or we fetch them?
      // Optimization: Just show ID or fetch details? 
      // Let's use availableTasks if present, or just try to find it in the global list if passed?
      // Since we don't have global list here, we might show ID or "Loading..."
      // BETTER: When loading dependencies, we should probably join with tasks to get titles.
      // But standard Supabase query in client usage...
      // Let's rely on cached `availableTasks` if user clicked Add, otherwise we might just show ID for now to be safe,
      // OR fetch all project tasks once on mount to map titles? A bit heavy but safest for "Phase A3".
      return availableTasks.find(t => t.id === id)?.title || 'Task...';
  };

  // Effect to load full task list for title mapping if we have dependencies
  React.useEffect(() => {
      if ((myPredecessors.length > 0 || mySuccessors.length > 0) && availableTasks.length === 0) {
          getTasks(projectId).then(({ tasks }) => setAvailableTasks(tasks));
      }
  }, [projectId, myPredecessors.length, mySuccessors.length, availableTasks.length]);


  if (!projectId) return null;

  return (
    <div className="space-y-3">
        <div className="text-sm font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Link className="h-4 w-4" />
                {t('title')}
            </div>
            {!isAdding && (
                <Button variant="ghost" size="sm" onClick={handleStartAdd}>
                    <Plus className="h-3 w-3 mr-1" />
                    {t('add')}
                </Button>
            )}
        </div>

        {/* Existing Links */}
        <div className="space-y-2">
            {myPredecessors.map(dep => (
                <div key={dep.id} className="flex items-center gap-2 p-2 bg-orange-50 dark:bg-orange-950 border border-orange-100 dark:border-orange-900 rounded text-sm text-orange-800 dark:text-orange-300">
                    <ArrowRight className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase opacity-70">Blocked By</span>
                    <span className="truncate">{getTaskTitle(dep.predecessor_id)}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto text-orange-800 dark:text-orange-300 hover:text-orange-900 dark:hover:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900" onClick={() => handleRemove(dep.id)}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            ))}
            {mySuccessors.map(dep => (
                <div key={dep.id} className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded text-sm text-blue-800 dark:text-blue-300">
                    <ArrowRight className="h-4 w-4" />
                    <span className="text-xs font-semibold uppercase opacity-70">Blocking</span>
                    <span className="truncate">{getTaskTitle(dep.successor_id)}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto text-blue-800 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900" onClick={() => handleRemove(dep.id)}>
                        <X className="h-3 w-3" />
                    </Button>
                </div>
            ))}
            {myPredecessors.length === 0 && mySuccessors.length === 0 && !isAdding && (
                <div className="text-sm text-muted-foreground pl-6">{t('noDependencies')}</div>
            )}
        </div>

        {/* Add Form */}
        {isAdding && (
            <div className="p-3 border rounded-lg bg-muted space-y-3">
                <div className="grid grid-cols-2 gap-2">
                     <div className="space-y-1">
                        <Label className="text-xs">Relation</Label>
                        <Select value={direction} onValueChange={(v: any) => setDirection(v)}>
                            <SelectTrigger className="h-8 w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={5} className="z-[100]">
                                <SelectItem value="predecessor">{t('predecessor')}</SelectItem>
                                <SelectItem value="successor">{t('successor')}</SelectItem>
                            </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-1">
                        <Label className="text-xs">Task</Label>
                        <Select value={selectedTask} onValueChange={setSelectedTask}>
                            <SelectTrigger className="h-8 w-full">
                                <SelectValue placeholder={t('selectTask')} />
                            </SelectTrigger>
                            <SelectContent position="popper" sideOffset={5} className="max-h-[200px] z-[100]">
                                {availableTasks.map(t => (
                                    <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                     </div>
                </div>
                <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setIsAdding(false)}>Cancel</Button>
                    <Button size="sm" onClick={handleAdd} disabled={!selectedTask || isLoading}>Link</Button>
                </div>
            </div>
        )}
    </div>
  );
}
