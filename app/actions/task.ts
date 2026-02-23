'use server';

import { Task, TaskStatus, TaskPriority } from '@/types';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { requireProjectOwner, requireTaskOwner } from '@/lib/auth-helpers';

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
  await requireTaskOwner(taskId);

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
  await requireTaskOwner(taskId);

  await db
    .update(tasks)
    .set({ priority: newPriority })
    .where(eq(tasks.id, taskId));

  revalidatePath('/dashboard');
}

export async function updateTaskDates(taskId: string, startDate: Date, dueDate: Date) {
  await requireTaskOwner(taskId);

  await db
    .update(tasks)
    .set({ startDate, dueDate })
    .where(eq(tasks.id, taskId));

  revalidatePath('/dashboard');
}

export async function updateTaskPosition(taskId: string, newPosition: number) {
  await requireTaskOwner(taskId);

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
) {
  await requireProjectOwner(projectId);

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
  };
}

export async function deleteTask(taskId: string) {
  await requireTaskOwner(taskId);

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
    completed_at?: string | null;
  }
) {
  await requireTaskOwner(taskId);

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
  if (updates.completed_at !== undefined) setValues.completedAt = updates.completed_at ? new Date(updates.completed_at) : null;

  await db.update(tasks).set(setValues).where(eq(tasks.id, taskId));

  revalidatePath('/dashboard');
}

export async function getTasks(projectId: string) {
  await requireProjectOwner(projectId);

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
    })),
  };
}
