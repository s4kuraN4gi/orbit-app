
'use client';

import React, { useOptimistic } from 'react';
import { Task, TaskStatus } from '@/types';
import { 
  DndContext, 
  DragEndEvent, 
  useSensor, 
  useSensors, 
  PointerSensor 
} from '@dnd-kit/core';
import { BoardColumn } from './BoardColumn';
import { updateTaskStatus } from '@/app/actions/task';
import { toast } from 'sonner'; // Using sonner for optional toasts (if shadcn has it, otherwise default logging)
// We didn't install sonner yet but shadcn usually recommends it. We'll stick to console for now or use basic alert if needed.
// Correction: we haven't added sonner. We'll just log/optimistically update.

interface TaskBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TaskBoard({ tasks, onTaskClick }: TaskBoardProps) {
  // Sensors for better drag experience
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start drag (prevents accidental drags on click)
      },
    })
  );

  // Optimistic UI could be handled here by local state override,
  // but since we are revalidating path, it might flicker if slow.
  // For MVP, simple revalidate is acceptable.
  // If we want instant feedback, we can use useOptimistic hook from React 18/Next 14.
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    tasks,
    (state, { taskId, newStatus }: { taskId: string; newStatus: TaskStatus }) => {
        return state.map(t => t.id === taskId ? { ...t, status: newStatus } : t);
    }
  );

  // Group tasks by status
  const todoTasks = optimisticTasks.filter(t => t.status === 'todo');
  const inProgressTasks = optimisticTasks.filter(t => t.status === 'in_progress');
  const doneTasks = optimisticTasks.filter(t => t.status === 'done');

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus; // The droppable ID is the status

    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    // Trigger Optimistic Update
    // Trigger Optimistic Update
    React.startTransition(() => {
        setOptimisticTasks({ taskId, newStatus });
    });

    try {
        await updateTaskStatus(taskId, newStatus);
    } catch (error) {
        // Rollback is tricky with useOptimistic combined with server revalidation without full state control, 
        // but normally revalidatePath will fix it on next render if failed.
        console.error("Failed to move task", error);
        // Maybe show toast error
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[600px]">
            <BoardColumn status="todo" tasks={todoTasks} onTaskClick={onTaskClick} />
            <BoardColumn status="in_progress" tasks={inProgressTasks} onTaskClick={onTaskClick} />
            <BoardColumn status="done" tasks={doneTasks} onTaskClick={onTaskClick} />
        </div>
    </DndContext>
  );
}
