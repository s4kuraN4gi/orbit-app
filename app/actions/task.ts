'use server';

import { Task, TaskStatus, TaskPriority } from '@/types';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { addDays, addWeeks, addMonths, addYears, nextDay, Day } from 'date-fns';

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
  // 1. Fetch current task to check for recurrence
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId));

  if (!task) {
    throw new Error('Failed to fetch task');
  }

  // 2. Handle Recurrence Logic: If marking as done and has recurrence
  if (newStatus === 'done' && task.recurrenceType) {
    let nextStartDate: Date | null = null;
    let nextDueDate: Date | null = null;

    const baseDate = task.dueDate
      ? new Date(task.dueDate)
      : task.startDate
        ? new Date(task.startDate)
        : new Date();

    const interval = task.recurrenceInterval || 1;

    switch (task.recurrenceType) {
      case 'daily':
        nextDueDate = addDays(baseDate, interval);
        break;
      case 'weekly':
        if (task.recurrenceDays && task.recurrenceDays.length > 0) {
          const dayMap: Record<string, Day> = { su: 0, mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6 };
          const targetDays = task.recurrenceDays
            .map((d: string) => dayMap[d])
            .sort((a: number, b: number) => a - b);

          const currentDay = baseDate.getDay();
          const nextDayInWeek = targetDays.find((d: number) => d > currentDay);

          if (nextDayInWeek !== undefined) {
            nextDueDate = nextDay(baseDate, nextDayInWeek as Day);
          } else {
            const firstDay = targetDays[0];
            const nextFirstDay = nextDay(baseDate, firstDay as Day);
            nextDueDate = addWeeks(nextFirstDay, interval - 1);
          }
        } else {
          nextDueDate = addWeeks(baseDate, interval);
        }
        break;
      case 'monthly':
        nextDueDate = addMonths(baseDate, interval);
        break;
      case 'yearly':
        nextDueDate = addYears(baseDate, interval);
        break;
    }

    // Check end date
    if (nextDueDate && task.recurrenceEndDate && nextDueDate > new Date(task.recurrenceEndDate)) {
      nextDueDate = null;
    }

    if (nextDueDate) {
      if (task.startDate && task.dueDate) {
        const duration = new Date(task.dueDate).getTime() - new Date(task.startDate).getTime();
        nextStartDate = new Date(nextDueDate.getTime() - duration);
      } else if (task.startDate) {
        if (!task.dueDate) {
          nextStartDate = nextDueDate;
          nextDueDate = null;
        }
      }

      // Create the NEXT task
      await createTask(
        task.projectId,
        task.title,
        task.description ?? undefined,
        task.priority,
        'todo',
        task.parentId ?? undefined,
        nextStartDate?.toISOString(),
        nextDueDate?.toISOString(),
        undefined,
        task.recurrenceType as 'daily' | 'weekly' | 'monthly' | 'yearly',
        task.recurrenceInterval ?? undefined,
        task.recurrenceDays ?? undefined,
        task.recurrenceEndDate?.toISOString()
      );

      // Remove recurrence from the completed task
      await db
        .update(tasks)
        .set({
          status: newStatus,
          recurrenceType: null,
          recurrenceInterval: null,
          recurrenceDays: null,
          recurrenceEndDate: null,
        })
        .where(eq(tasks.id, taskId));

      revalidatePath('/dashboard');
      return;
    }
  }

  // Default behavior (non-recurring or end date reached)
  const updates: Record<string, any> = { status: newStatus };
  if (newStatus === 'done') {
    updates.completedAt = new Date();
  } else {
    updates.completedAt = null;
  }

  await db.update(tasks).set(updates).where(eq(tasks.id, taskId));

  revalidatePath('/dashboard');
}

export async function updateTaskPriority(taskId: string, newPriority: string) {
  await db
    .update(tasks)
    .set({ priority: newPriority })
    .where(eq(tasks.id, taskId));

  revalidatePath('/dashboard');
}

export async function updateTaskDates(taskId: string, startDate: Date, dueDate: Date) {
  await db
    .update(tasks)
    .set({ startDate, dueDate })
    .where(eq(tasks.id, taskId));

  revalidatePath('/dashboard');
}

export async function updateTaskPosition(taskId: string, newPosition: number) {
  await db
    .update(tasks)
    .set({ position: newPosition })
    .where(eq(tasks.id, taskId));

  revalidatePath('/dashboard');
}

export async function createTask(
  projectId: string,
  title: string,
  description?: string,
  priority?: string,
  status?: TaskStatus,
  parentId?: string,
  startDate?: string,
  dueDate?: string,
  templateId?: string,
  recurrenceType?: 'daily' | 'weekly' | 'monthly' | 'yearly',
  recurrenceInterval?: number,
  recurrenceDays?: string[],
  recurrenceEndDate?: string
) {
  // Get current max position
  const [maxPosData] = await db
    .select({ position: tasks.position })
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(desc(tasks.position))
    .limit(1);

  const newPosition = (maxPosData?.position || 0) + 65536;

  const [data] = await db
    .insert(tasks)
    .values({
      projectId,
      parentId: parentId || null,
      title,
      description: description || null,
      priority: priority || 'medium',
      status: status || 'todo',
      startDate: startDate ? new Date(startDate) : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      position: newPosition,
      recurrenceType: recurrenceType || null,
      recurrenceInterval: recurrenceInterval || 1,
      recurrenceDays: recurrenceDays || null,
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
    })
    .returning();

  if (!data) throw new Error('Failed to create task');

  revalidatePath('/dashboard');
  return {
    ...data,
    project_id: data.projectId,
    parent_id: data.parentId,
    ai_context_id: data.aiContextId,
    start_date: data.startDate?.toISOString() ?? null,
    due_date: data.dueDate?.toISOString() ?? null,
    created_at: data.createdAt?.toISOString() ?? '',
    completed_at: data.completedAt?.toISOString() ?? null,
    recurrence_type: data.recurrenceType,
    recurrence_interval: data.recurrenceInterval,
    recurrence_days: data.recurrenceDays,
    recurrence_end_date: data.recurrenceEndDate?.toISOString() ?? null,
    board_order: data.boardOrder,
  };
}

export async function deleteTask(taskId: string) {
  await db.delete(tasks).where(eq(tasks.id, taskId));
  revalidatePath('/dashboard');
}

export async function updateTask(
  taskId: string,
  updates: {
    title?: string;
    description?: string;
    priority?: string;
    status?: TaskStatus;
    start_date?: string | null;
    due_date?: string | null;
    position?: number;
    recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
    recurrence_interval?: number;
    recurrence_days?: string[] | null;
    recurrence_end_date?: string | null;
    completed_at?: string | null;
  }
) {
  // Handle completed_at automatic update if status is changing
  if (updates.status) {
    if (updates.status === 'done') {
      updates.completed_at = new Date().toISOString();
    } else {
      updates.completed_at = null;
    }
  }

  // Map snake_case input to camelCase schema
  const setValues: Record<string, any> = {};
  if (updates.title !== undefined) setValues.title = updates.title;
  if (updates.description !== undefined) setValues.description = updates.description;
  if (updates.priority !== undefined) setValues.priority = updates.priority;
  if (updates.status !== undefined) setValues.status = updates.status;
  if (updates.start_date !== undefined) setValues.startDate = updates.start_date ? new Date(updates.start_date) : null;
  if (updates.due_date !== undefined) setValues.dueDate = updates.due_date ? new Date(updates.due_date) : null;
  if (updates.position !== undefined) setValues.position = updates.position;
  if (updates.recurrence_type !== undefined) setValues.recurrenceType = updates.recurrence_type;
  if (updates.recurrence_interval !== undefined) setValues.recurrenceInterval = updates.recurrence_interval;
  if (updates.recurrence_days !== undefined) setValues.recurrenceDays = updates.recurrence_days;
  if (updates.recurrence_end_date !== undefined) setValues.recurrenceEndDate = updates.recurrence_end_date ? new Date(updates.recurrence_end_date) : null;
  if (updates.completed_at !== undefined) setValues.completedAt = updates.completed_at ? new Date(updates.completed_at) : null;

  await db.update(tasks).set(setValues).where(eq(tasks.id, taskId));

  revalidatePath('/dashboard');
}

export async function getTasks(projectId: string) {
  const data = await db
    .select()
    .from(tasks)
    .where(eq(tasks.projectId, projectId))
    .orderBy(asc(tasks.position));

  return {
    tasks: data.map((t) => ({
      id: t.id,
      project_id: t.projectId,
      parent_id: t.parentId,
      ai_context_id: t.aiContextId,
      title: t.title,
      description: t.description ?? '',
      status: t.status as TaskStatus,
      priority: t.priority as TaskPriority,
      start_date: t.startDate?.toISOString() ?? null,
      due_date: t.dueDate?.toISOString() ?? null,
      created_at: t.createdAt?.toISOString() ?? '',
      position: t.position ?? undefined,
      completed_at: t.completedAt?.toISOString() ?? null,
      recurrence_type: t.recurrenceType as Task['recurrence_type'],
      recurrence_interval: t.recurrenceInterval ?? undefined,
      recurrence_days: t.recurrenceDays ?? undefined,
      recurrence_end_date: t.recurrenceEndDate?.toISOString(),
      board_order: t.boardOrder ?? undefined,
    })),
  };
}
