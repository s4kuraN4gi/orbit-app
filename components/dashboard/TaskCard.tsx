'use client';

import React from 'react';
import { Task } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical, ListTree } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
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
    zIndex: isDragging ? 1000 : undefined,
  };

  const childrenCount = task.children?.length || 0;

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...listeners} 
      {...attributes} 
      className={cn(
        "touch-none mb-3 relative",
        isDragging && "z-[1000]"
      )}
    >
       <Card 
         onClick={onClick}
         className={cn(
         "cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow",
         isDragging && "opacity-80 border-blue-400 border-2 shadow-xl"
       )}>
        <CardContent className="p-3 flex items-start gap-2">
           <GripVertical className="h-5 w-5 text-muted-foreground/40 flex-shrink-0 mt-0.5" />
           <div className="flex-1 space-y-2">
              <p className="text-sm font-medium leading-none">{task.title}</p>
              <div className="flex gap-2 items-center">
                 <Badge variant="secondary" className={cn("text-[10px] px-1 py-0 h-5", priorityColors[task.priority])}>
                    {task.priority}
                 </Badge>
                 {childrenCount > 0 && (
                   <div className="flex items-center gap-1 text-xs text-muted-foreground">
                     <ListTree className="h-3 w-3" />
                     <span>{childrenCount}</span>
                   </div>
                 )}
              </div>
           </div>
        </CardContent>
       </Card>
    </div>
  );
}
