
'use client';

import React from 'react';
import { Task, TaskStatus } from '@/types';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const columnLabels: Record<TaskStatus, string> = {
    todo: 'To Do',
    in_progress: 'In Progress',
    done: 'Done'
};

const columnColors: Record<TaskStatus, string> = {
    todo: 'bg-slate-50 border-slate-200',
    in_progress: 'bg-blue-50/50 border-blue-200',
    done: 'bg-green-50/50 border-green-200'
};

export function BoardColumn({ status, tasks, onTaskClick }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
        type: 'column',
        status,
    }
  });

  return (
    <div className="flex flex-col h-full rounded-lg border bg-slate-50/50">
        {/* Header */}
        <div className={cn("p-3 border-b bg-white rounded-t-lg font-semibold text-sm flex items-center justify-between", columnColors[status])}>
            <span>{columnLabels[status]}</span>
            <span className="text-xs text-muted-foreground bg-white/50 px-2 py-0.5 rounded-full border">
                {tasks.length}
            </span>
        </div>

        {/* Drop Zone */}
        <div 
          ref={setNodeRef} 
          className={cn(
              "flex-1 p-3 overflow-y-auto min-h-[500px] transition-colors",
              isOver && "bg-slate-100/80"
          )}
        >
            {tasks.map((task) => (
                <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
            ))}
            {tasks.length === 0 && (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic opacity-50">
                    Drop here
                </div>
            )}
        </div>
    </div>
  );
}
