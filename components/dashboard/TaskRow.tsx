
import React from 'react';
import { Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Disc, Circle, CheckCircle2 } from 'lucide-react';

interface TaskRowProps {
  task: Task;
  level: number;
  onClick: () => void;
}

const statusIcons = {
  todo: <Circle className="h-4 w-4 text-slate-500" />,
  in_progress: <Disc className="h-4 w-4 text-blue-500 animate-spin-slow" />, // animate-spin might be too fast, using custom or just normal
  done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
};

const priorityColors = {
  low: 'bg-slate-200 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-red-100 text-red-700',
};

export function TaskRow({ task, level, onClick }: TaskRowProps) {
  return (
    <TableRow className="hover:bg-slate-50/50 cursor-pointer" onClick={onClick}>
      <TableCell className="font-medium">
        <div 
          className="flex items-center gap-2"
          style={{ paddingLeft: `${level * 24}px` }}
        >
           {statusIcons[task.status] || <Circle className="h-4 w-4" />}
           <span className={cn(task.status === 'done' && 'text-slate-400 line-through')}>
             {task.title}
           </span>
        </div>
      </TableCell>
      <TableCell className="w-[100px]">
        <Badge variant="secondary" className="capitalize">
            {task.status.replace('_', ' ')}
        </Badge>
      </TableCell>
      <TableCell className="w-[100px]">
        <Badge 
          className={cn("capitalize border-0", priorityColors[task.priority])}
          variant="outline"
        >
          {task.priority}
        </Badge>
      </TableCell>
    </TableRow>
  );
}
