
'use client';

import React from 'react';
import { Task } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const priorityColors = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-red-100 text-red-700',
};

export function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: {
        type: 'task',
        task,
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="touch-none mb-3">
       <Card 
         onClick={onClick}
         className={cn(
         "cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
         isDragging && "opacity-50 border-blue-400 border-2"
       )}>
        <CardContent className="p-3 flex items-start gap-2">
           <GripVertical className="h-5 w-5 text-slate-300 flex-shrink-0 mt-0.5" />
           <div className="flex-1 space-y-2">
              <p className="text-sm font-medium leading-none">{task.title}</p>
              <div className="flex gap-2">
                 <Badge variant="secondary" className={cn("text-[10px] px-1 py-0 h-5", priorityColors[task.priority])}>
                    {task.priority}
                 </Badge>
              </div>
           </div>
        </CardContent>
       </Card>
    </div>
  );
}
