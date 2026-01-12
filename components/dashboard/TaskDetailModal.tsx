
'use client';

import React from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { AIContextCard } from './AIContextCard';
import { updateTaskStatus, updateTaskPriority } from '@/app/actions/task';
import { toast } from 'sonner';

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  if (!task) return null;

  const handleStatusChange = async (value: string) => {
     try {
         await updateTaskStatus(task.id, value as TaskStatus);
         toast.success("Status updated");
     } catch (e) {
         toast.error("Failed to update status");
     }
  };

  const handlePriorityChange = async (value: string) => {
     try {
         await updateTaskPriority(task.id, value as TaskPriority);
         toast.success("Priority updated");
     } catch (e) {
         toast.error("Failed to update priority");
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
                 {task.status.replace('_', ' ')}
             </div>
          </div>
          <DialogTitle className="text-xl leading-normal">{task.title}</DialogTitle>
          {/* DialogDescription is required for accessiblity if description is not present, but using it for created date or similar is good */}
          <DialogDescription>
            Created at {task.start_date || 'N/A'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
            {/* Controls */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <div className="text-sm font-medium">Status</div>
                    <Select defaultValue={task.status} onValueChange={handleStatusChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todo">Todo</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <div className="text-sm font-medium">Priority</div>
                    <Select defaultValue={task.priority} onValueChange={handlePriorityChange}>
                        <SelectTrigger>
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
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
                <div className="text-sm font-semibold">Description</div>
                <div className="p-4 bg-slate-50 border rounded-lg text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {task.description || "No description provided."}
                </div>
            </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
