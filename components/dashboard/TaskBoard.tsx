'use client';

import React, { useOptimistic, useState } from 'react';
import { Task, TaskStatus } from '@/types';
import { 
  DndContext, 
  DragEndEvent, 
  DragStartEvent,
  DragOverlay,
  useSensor, 
  useSensors, 
  PointerSensor 
} from '@dnd-kit/core';
import { BoardColumn } from './BoardColumn';
import { TaskCard } from './TaskCard';
import { updateTaskStatus } from '@/app/actions/task';
import { toast } from 'sonner';

import { useTranslations } from 'next-intl';

interface TaskBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TaskBoard({ tasks, onTaskClick }: TaskBoardProps) {
  const t = useTranslations('task');
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Sensors for better drag experience
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start drag (prevents accidental drags on click)
      },
    })
  );

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

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus; // The droppable ID is the status

    const currentTask = tasks.find(t => t.id === taskId);
    if (!currentTask || currentTask.status === newStatus) return;

    // Trigger Optimistic Update
    React.startTransition(() => {
        setOptimisticTasks({ taskId, newStatus });
    });

    try {
        await updateTaskStatus(taskId, newStatus);
    } catch (error) {
        console.error("Failed to move task", error);
        toast.error(t('statusUpdateError'));
    }
  }

  function handleDragCancel() {
    setActiveTask(null);
  }

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[600px]">
            <BoardColumn status="todo" tasks={todoTasks} onTaskClick={onTaskClick} />
            <BoardColumn status="in_progress" tasks={inProgressTasks} onTaskClick={onTaskClick} />
            <BoardColumn status="done" tasks={doneTasks} onTaskClick={onTaskClick} />
        </div>
        
        {/* Drag Overlay - renders above all content via portal */}
        <DragOverlay dropAnimation={null}>
          {activeTask && (
            <div className="opacity-90 shadow-2xl">
              <TaskCard task={activeTask} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
    </DndContext>
  );
}
