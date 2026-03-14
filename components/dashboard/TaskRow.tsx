'use client';

import React, { forwardRef } from 'react';
import { Task } from '@/types';
import { Badge } from '@/components/ui/badge';
import { TableRow, TableCell } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Disc, Circle, CheckCircle2, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface TaskRowProps {
  task: Task;
  level: number;
  onClick: () => void;
  hasChildren?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  childrenCount?: number;
  isFocused?: boolean;
  isDragging?: boolean;
}

const statusIcons = {
  todo: <Circle className="h-4 w-4 text-muted-foreground" />,
  in_progress: <Disc className="h-4 w-4 text-blue-500" />,
  done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
};

const priorityColors: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  high: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  urgent: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
};

export const TaskRow = forwardRef<HTMLTableRowElement, TaskRowProps>(({ 
  task, 
  level, 
  onClick, 
  hasChildren = false, 
  isExpanded = false, 
  onToggleExpand,
  childrenCount = 0,
  isFocused = false,
  isDragging = false,
}, ref) => {
  const t = useTranslations('task');
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isSortableDragging ? 10 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand?.();
  };

  return (
    <TableRow 
      ref={(node) => {
          setNodeRef(node);
          if (typeof ref === 'function') ref(node);
          else if (ref) (ref as React.MutableRefObject<HTMLTableRowElement | null>).current = node;
      }}
      style={style}
      className={cn(
        "hover:bg-muted/50 cursor-pointer transition-colors group",
        isFocused && "bg-primary/10 ring-2 ring-primary/50 ring-inset",
        isDragging && "bg-muted"
      )} 
      onClick={onClick}
      tabIndex={isFocused ? 0 : -1}
    >
      <TableCell className="w-8 p-0 text-center">
        <div 
            {...attributes} 
            {...listeners}
            className="w-8 h-full flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
        >
            <GripVertical className="h-4 w-4 text-muted-foreground/40 hover:text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="font-medium">
        <div 
          className="flex items-center gap-1"
          style={{ paddingLeft: `${level * 24}px` }}
        >
          {/* Expand/Collapse Toggle */}
          {hasChildren ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={handleToggleClick}
              tabIndex={-1}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
          ) : (
            <div className="w-6" /> // Spacer for alignment
          )}
          
          {statusIcons[task.status] || <Circle className="h-4 w-4" />}
          
          <span className={cn(task.status === 'done' && 'text-muted-foreground line-through')}>
            {task.title}
          </span>

          {/* Show children count when collapsed */}
          {hasChildren && !isExpanded && (
            <span className="ml-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {t('subtaskCount', { count: childrenCount })}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="w-[100px]">
        <Badge variant="secondary" className="capitalize">
            {t(`status.${task.status}`)}
        </Badge>
      </TableCell>
      <TableCell className="w-[100px]">
        <Badge 
          className={cn("capitalize border-0", priorityColors[task.priority])}
          variant="outline"
        >
          {t(`priority.${task.priority}`)}
        </Badge>
      </TableCell>
    </TableRow>
  );
});

TaskRow.displayName = 'TaskRow';
