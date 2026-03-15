'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Task } from '@/types';
import { TaskRow } from './TaskRow';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { useTranslations } from 'next-intl';
import { 
  DndContext, 
  DragEndEvent, 
  DragOverlay,
  useSensor, 
  useSensors, 
  PointerSensor,
  closestCenter,
  DragStartEvent
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy, 
} from '@dnd-kit/sortable';
import { updateTaskPosition, updateTask } from '@/app/actions/task';
import { toast } from 'sonner';
import { GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import {
  isToday,
  isTomorrow,
  isPast,
  addWeeks,
  isAfter,
  startOfDay,
  endOfDay,
  endOfWeek,
  addDays
} from 'date-fns';

interface TaskListProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  isModalOpen?: boolean;
}

// Helper to flatten visible tasks (respecting expanded state)
function flattenVisibleTasks(
  tasks: Task[],
  expandedIds: Set<string>,
  result: { task: Task; level: number }[] = [],
  level: number = 0
): { task: Task; level: number }[] {
  for (const task of tasks) {
    result.push({ task, level });
    if (task.children && task.children.length > 0 && expandedIds.has(task.id)) {
      flattenVisibleTasks(task.children, expandedIds, result, level + 1);
    }
  }
  return result;
}

export function TaskList({ tasks, onTaskClick, isModalOpen = false }: TaskListProps) {
  const t = useTranslations();
  const tDateGroups = useTranslations('dateGroups');
  // Track which tasks are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // Track which groups are collapsed
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  // Track focused task index for keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const focusedRowRef = useRef<HTMLTableRowElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Grouping logic
  const groupedTasks = useMemo(() => {
    // 1. First, we need to apply hierarchy/flattening to the raw 'tasks'
    // BUT we want to group by ROOT task date.
    // So distinct logic: 
    // Bucket ROOTS. Then flatten each bucket.
    
    const buckets: Record<string, Task[]> = {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      nextWeek: [],
      later: [],
      noDate: []
    };

    const now = new Date();
    const tomorrowEnd = endOfDay(addDays(now, 1));
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 });

    // Iterate over tasks (which are root tasks or filtered list)
    tasks.forEach(task => {
        if (!task.due_date) {
            buckets.noDate.push(task);
            return;
        }

        const dueDate = new Date(task.due_date);
        
        // "Overdue" logic: due_date < today (start of today?) AND status != done
        // Actually comparison with isPast checks if date < now. 
        // If due_date is "2023-01-01" (assumed midnight), isPast is true.
        // If due_date is Today (midnight), isToday is true.
        // We want Overdue to mean "Before Today".
        // so if due < startOfToday.
        // And usually we ignore 'done' tasks for overdue warning, but for grouping?
        // If a task is Done, it arguably belongs to "Today" (if completed today) or just its Date Group?
        // Decision: Group purely by Date for Done tasks too?
        // Or "Overdue" group should only contain OPEN tasks?
        // Common pattern: Overdue (Open), Today (Mixed), etc.
        // If a task is Done and date was yesterday, it's not "Overdue", it's just "Yesterday" (which we don't have).
        // Maybe put Done tasks in "Today" or their respective date group but "Overdue" implies Action Needed.
        // Let's stick to simple Date Buckets:
        // Overdue: Date < Today AND status != done.
        // If Date < Today AND status == done -> Maybe "Later" or just "Past"? Or specific "Done" section?
        // Or just put in "Today" or "No Date"? 
        // Let's put completed past tasks in "Today" or filter them out? 
        // Actually, normally we might want to see what we did.
        // Let's put past done tasks in "Today" for visibility, or "No Date"?
        // Simpler: Just group by date properly.
        // Overdue = Date < Today & !Done.
        // Past & Done = "Today" (Completed recently?) or maybe we don't care.
        // Let's fallback Past & Done to "today".
        
        if (task.status !== 'done' && isPast(dueDate) && !isToday(dueDate)) {
             buckets.overdue.push(task);
        } else if (isToday(dueDate) || (task.status === 'done' && isPast(dueDate))) {
             buckets.today.push(task);
        } else if (isTomorrow(dueDate)) {
             buckets.tomorrow.push(task);
        } else if (isAfter(dueDate, tomorrowEnd) && !isAfter(dueDate, thisWeekEnd)) {
             buckets.thisWeek.push(task);
        } else if (isAfter(dueDate, thisWeekEnd) && !isAfter(dueDate, nextWeekEnd)) {
             buckets.nextWeek.push(task);
        } else {
             buckets.later.push(task);
        }
    });

    // Flatten each bucket
    const result: Record<string, { task: Task; level: number }[]> = {};
    const groupOrder = ['overdue', 'today', 'tomorrow', 'thisWeek', 'nextWeek', 'later', 'noDate'];
    
    groupOrder.forEach(key => {
        result[key] = flattenVisibleTasks(buckets[key], expandedIds);
    });

    return result;
  }, [tasks, expandedIds]);



  const handleToggleGroup = (groupKey: string) => {
      setCollapsedGroups(prev => {
          const newSet = new Set(prev);
          if (newSet.has(groupKey)) {
              newSet.delete(groupKey);
          } else {
              newSet.add(groupKey);
          }
          return newSet;
      });
  };


  
  // Derived visible tasks for keyboard nav (flatten all groups in order)
  const visibleTasks = useMemo(() => {
    const groupOrder = ['overdue', 'today', 'tomorrow', 'thisWeek', 'nextWeek', 'later', 'noDate'];
    return groupOrder.flatMap(key => {
        if (collapsedGroups.has(key)) return [];
        return groupedTasks[key];
    });
  }, [groupedTasks, collapsedGroups]);


  const handleToggleExpand = (taskId: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    // If dropped on nothing or on itself
    if (!over || active.id === over.id) return;

    // Resolve tasks
    const activeTask = visibleTasks.find(t => t.task.id === active.id)?.task;
    const overTask = visibleTasks.find(t => t.task.id === over.id)?.task;

    if (!activeTask) return;

    // Find groups
    const groupOrder = ['overdue', 'today', 'tomorrow', 'thisWeek', 'nextWeek', 'later', 'noDate'];
    
    let activeGroup = '';
    let overGroup = '';
    
    // Helper to find group of a task ID
    const findGroup = (id: string) => {
        for (const key of groupOrder) {
            if (groupedTasks[key].some(t => t.task.id === id)) return key;
        }
        return '';
    };

    activeGroup = findGroup(active.id as string);
    overGroup = findGroup(over.id as string);
    
    // Note: If dropping on a group header (not a task), over.id might be different?
    // DndKit usually needs a droppable. Rows are droppable. Group Headers are NOT droppable in my render currently.
    // If I want to drop on empty group, I need Droppable Headers or Droppable Areas.
    // For now, assume drop on existing tasks in the group. If group empty, can't drop?
    // MVP Limitation: Can only drop if tasks exist in target group.
    
    if (!overGroup) {
         // Maybe dropped on a container, or something else. Ignore.
         return;
    }

    // Restriction: Only Root tasks can change Date Groups for now (visual consistency)
    if (activeGroup !== overGroup && activeTask.parent_id) {
         // Prevent dragging subtasks to different date groups if it breaks hierarchy
         return;
    }

    const isDateChange = activeGroup !== overGroup;
    let newDate: Date | null | undefined = undefined; // undefined = no change

    if (isDateChange) {
        // Calculate new date based on overGroup
        const now = new Date();
        switch (overGroup) {
            case 'overdue':
                newDate = startOfDay(addDays(now, -1)); // Set to yesterday
                break;
            case 'today':
                newDate = startOfDay(now);
                break;
            case 'tomorrow':
                newDate = startOfDay(addDays(now, 1));
                break;
            case 'thisWeek':
                // Default to day after tomorrow? Or just keep it simpler: 2 days from now.
                newDate = startOfDay(addDays(now, 2));
                break;
            case 'nextWeek':
                newDate = startOfDay(addDays(now, 7)); // Next week
                break;
            case 'later':
                newDate = startOfDay(addDays(now, 14)); // 2 weeks later
                break;
            case 'noDate':
                newDate = null;
                break;
        }

        // If dropped OVER a task in that group, maybe inherit that task's date?
        // This is better for "Later" or "Next Week" which are ranges.
        if (overTask && overTask.due_date) {
            // Only inherit if it makes sense? Yes.
            newDate = new Date(overTask.due_date);
        }
    }

    // Position Calculation
    // We need to find siblings in the OVER group to calculate position.
    // If Date Change -> We are moving into 'overGroup'.
    // We should treat 'activeTask' as ALREADY in 'overGroup' for position calculation intent,
    // but calculating its new position relative to 'overTask'.
    
    // Tasks in overGroup
    const groupItems = groupedTasks[overGroup];
    
    // Filter for relevant siblings (Roots if active is Root, Subtasks if active is Subtask)
    const siblings = groupItems
       .map(i => i.task)
       .filter(t => t.parent_id === activeTask.parent_id);
    
    // If activeTask is NOT in this group (Date Change), it won't be in 'siblings' yet.
    // So 'active' index is -1.
    // We want to insert 'active' relative to 'over'.
    
    // Sort siblings by position
    const sortedSiblings = [...siblings].sort((a, b) => (a.position || 0) - (b.position || 0));
    
    const overIndex = sortedSiblings.findIndex(t => t.id === over.id);
    
    // If overIndex is -1 (dropped on header?), weird.
    if (overIndex === -1 && !isDateChange) return;
    
    let newPosition: number;
    
    if (isDateChange) {
        // Inserting into new group
        if (overIndex === -1) {
             // Dropped on empty group? (Not possible with current logic as over is a task)
             // Default to top or bottom?
             // Since we drop ON a task, overIndex must exist if overTask exists.
             // If overTask doesn't exist (dropped on something else?), ignore.
             if (!overTask) return; 
             newPosition = (overTask.position || 0) + 1024; // Just put nearby
        } else {
             // Deciding whether to put Above or Below 'overTask'.
             // In drag logic, usually depends on cursor position or direction.
             // dnd-kit gives active.rect and over.rect?
             // Simplified: Always put AFTER if moving down?
             // But here we are crossing lists. Hard to guess direction.
             // Let's assume dropping ON means "Place below"? Or default insert.
             // Better: "Place Before" is safer? 
             // Let's use standard midpoint logic assuming we insert BEFORE 'overTask'
             // If we want to be precise, we need collision details.
             // For MVP, placing BEFORE is fine.
             const overPos = sortedSiblings[overIndex].position || 0;
             const prevTask = sortedSiblings[overIndex - 1];
             const prevPos = prevTask ? (prevTask.position || overPos - 2048) : (overPos - 2048);
             newPosition = (prevPos + overPos) / 2;
        }
    } else {
        // Same group reorder (existing logic)
        const activeIndex = sortedSiblings.findIndex(t => t.id === active.id);
        if (activeIndex === -1 || overIndex === -1) return;

        if (activeIndex < overIndex) {
            const afterTask = sortedSiblings[overIndex];
            const nextTask = sortedSiblings[overIndex + 1];
            const afterPos = afterTask.position || 0;
            const nextPos = nextTask ? (nextTask.position || afterPos + 2048) : (afterPos + 2048);
            newPosition = (afterPos + nextPos) / 2;
        } else {
            const beforeTask = sortedSiblings[overIndex];
            const prevTask = sortedSiblings[overIndex - 1];
            const beforePos = beforeTask.position || 0;
            const prevPos = prevTask ? (prevTask.position || beforePos - 2048) : (beforePos - 2048);
            newPosition = (prevPos + beforePos) / 2;
        }
    }

    try {
      if (isDateChange) {
           await updateTask(activeTask.id, {
               due_date: newDate === null ? null : newDate?.toISOString(),
               position: newPosition
           });
      } else {
           await updateTaskPosition(activeTask.id, newPosition);
      }
    } catch {
      toast.error(t('common.errorUpdateTask'));
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // ... existing keyboard logic uses visibleTasks, which we updated ...
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const totalTasks = visibleTasks.length;
    if (totalTasks === 0) return;

    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          if (prev === -1) return 0;
          return Math.min(prev + 1, totalTasks - 1);
        });
        break;
      case 'k':
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => {
          if (prev === -1) return totalTasks - 1;
          return Math.max(prev - 1, 0);
        });
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < totalTasks) {
          onTaskClick?.(visibleTasks[focusedIndex].task);
        }
        break;
      case 'ArrowRight':
      case 'l':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < totalTasks) {
          const task = visibleTasks[focusedIndex].task;
          if (task.children && task.children.length > 0 && !expandedIds.has(task.id)) {
            handleToggleExpand(task.id);
          }
        }
        break;
      case 'ArrowLeft':
      case 'h':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < totalTasks) {
          const task = visibleTasks[focusedIndex].task;
          if (expandedIds.has(task.id)) {
            handleToggleExpand(task.id);
          }
        }
        break;
      case 'g':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'G':
        e.preventDefault();
        setFocusedIndex(totalTasks - 1);
        break;
    }
  }, [visibleTasks, focusedIndex, expandedIds, onTaskClick]);

  // Attach keyboard listener (disabled when modal is open)
  useEffect(() => {
    if (isModalOpen) return;
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, isModalOpen]);

  // Scroll focused row into view
  useEffect(() => {
    if (focusedRowRef.current) {
      focusedRowRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [focusedIndex]);

  // Clamp focusedIndex when tasks list shrinks
  const clampedFocusedIndex = useMemo(() => {
    if (visibleTasks.length === 0) return 0;
    return Math.min(focusedIndex, visibleTasks.length - 1);
  }, [focusedIndex, visibleTasks.length]);

  if (tasks.length === 0) {
     return <div className="p-8 text-center text-muted-foreground">{t('dashboard.noTasks')}</div>;
  }

  const focusedTaskId = clampedFocusedIndex >= 0 && clampedFocusedIndex < visibleTasks.length
    ? visibleTasks[clampedFocusedIndex].task.id
    : null;
  
  const groupOrder = ['overdue', 'today', 'tomorrow', 'thisWeek', 'nextWeek', 'later', 'noDate'];

  return (
    <DndContext
      id="task-list-dnd"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
        <div ref={containerRef} className="rounded-md border" role="region" aria-label={t('dashboard.taskList')}>
        <div className="px-3 py-2 bg-muted/50 border-b text-xs text-muted-foreground">
            <span className="font-medium">{t('dashboard.keyboard.title')}:</span>{' '}
            <kbd className="px-1 bg-background rounded">↑</kbd>/<kbd className="px-1 bg-background rounded">↓</kbd> {t('dashboard.keyboard.upDown')} • 
            <kbd className="px-1 bg-background rounded ml-1">Enter</kbd> {t('dashboard.keyboard.enter')} • 
            <kbd className="px-1 bg-background rounded ml-1">←</kbd>/<kbd className="px-1 bg-background rounded">→</kbd> {t('dashboard.keyboard.expand')}
        </div>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>{t('task.title')}</TableHead>
                <TableHead>{t('task.status.label')}</TableHead>
                <TableHead>{t('task.priority.label')}</TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
                {groupOrder.map(groupKey => {
                    const items = groupedTasks[groupKey];
                    if (items.length === 0) return null;
                    const isCollapsed = collapsedGroups.has(groupKey);

                    return (
                        <React.Fragment key={groupKey}>
                            <TableRow
                                className="bg-muted/50 hover:bg-muted cursor-pointer transition-colors"
                                onClick={() => handleToggleGroup(groupKey)}
                                role="button"
                                aria-expanded={!isCollapsed}
                                aria-label={`${tDateGroups(groupKey)} (${items.length})`}
                            >
                                <TableCell colSpan={4} className="py-2 px-4">
                                    <div className="flex items-center gap-2 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                                        {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                        <span>{tDateGroups(groupKey)}</span>
                                        <span className="ml-1 bg-muted text-foreground px-1.5 py-0.5 rounded-full text-[10px]">
                                            {items.length}
                                        </span>
                                    </div>
                                </TableCell>
                            </TableRow>
                            {!isCollapsed && (
                                <SortableContext 
                                    items={items.map(t => t.task.id)} 
                                    strategy={verticalListSortingStrategy}
                                >
                                    {items.map(({ task, level }) => (
                                        <TaskRow
                                            key={task.id}
                                            ref={task.id === focusedTaskId ? focusedRowRef : undefined}
                                            task={task}
                                            level={level}
                                            onClick={() => {
                                                 const idx = visibleTasks.findIndex(vt => vt.task.id === task.id);
                                                 setFocusedIndex(idx);
                                                 onTaskClick?.(task);
                                            }}
                                            hasChildren={!!(task.children && task.children.length > 0)}
                                            isExpanded={expandedIds.has(task.id)}
                                            onToggleExpand={() => handleToggleExpand(task.id)}
                                            childrenCount={task.children?.length || 0}
                                            isFocused={task.id === focusedTaskId}
                                            isDragging={task.id === activeId}
                                        />
                                    ))}
                                </SortableContext>
                            )}
                        </React.Fragment>
                    );
                })}

            </TableBody>
        </Table>
        </div>

        <DragOverlay>
            {activeId ? (
                 <div className="bg-background border rounded p-3 shadow-lg flex items-center gap-2 opacity-90 overflow-hidden w-[300px]">
                     <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                     <span className="font-medium truncate">
                         {visibleTasks.find(t => t.task.id === activeId)?.task.title}
                     </span>
                 </div>
            ) : null}
        </DragOverlay>
    </DndContext>
  );
}
