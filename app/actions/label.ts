'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { labels, taskLabels } from '@/lib/schema';
import { eq, asc, and } from 'drizzle-orm';

export interface Label {
  id: string;
  project_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TaskLabel {
  id: string;
  task_id: string;
  label_id: string;
  created_at: string;
}

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Not authenticated');
  return session.user;
}

function toLabel(row: typeof labels.$inferSelect): Label {
  return {
    id: row.id,
    project_id: row.projectId,
    name: row.name,
    color: row.color,
    created_at: row.createdAt?.toISOString() ?? '',
  };
}

export async function getProjectLabels(projectId: string): Promise<Label[]> {
  await requireUser();

  const data = await db
    .select()
    .from(labels)
    .where(eq(labels.projectId, projectId))
    .orderBy(asc(labels.name));

  return data.map(toLabel);
}

export async function getTaskLabels(taskId: string): Promise<Label[]> {
  await requireUser();

  const data = await db
    .select({ label: labels })
    .from(taskLabels)
    .innerJoin(labels, eq(taskLabels.labelId, labels.id))
    .where(eq(taskLabels.taskId, taskId));

  return data.map((row) => toLabel(row.label));
}

export async function createLabel(projectId: string, name: string, color: string): Promise<Label | null> {
  await requireUser();

  const [data] = await db
    .insert(labels)
    .values({
      projectId,
      name: name.trim(),
      color,
    })
    .returning();

  if (!data) throw new Error('Failed to create label');

  revalidatePath('/dashboard');
  return toLabel(data);
}

export async function updateLabel(labelId: string, name: string, color: string): Promise<Label | null> {
  await requireUser();

  const [data] = await db
    .update(labels)
    .set({
      name: name.trim(),
      color,
    })
    .where(eq(labels.id, labelId))
    .returning();

  if (!data) throw new Error('Failed to update label');

  revalidatePath('/dashboard');
  return toLabel(data);
}

export async function deleteLabel(labelId: string): Promise<void> {
  await requireUser();

  await db.delete(labels).where(eq(labels.id, labelId));

  revalidatePath('/dashboard');
}

export async function addLabelToTask(taskId: string, labelId: string): Promise<void> {
  await requireUser();

  try {
    await db.insert(taskLabels).values({ taskId, labelId });
  } catch (error: any) {
    // Ignore duplicate errors
    if (!error.message?.includes('unique') && error.code !== '23505') {
      console.error('Failed to add label to task:', error);
      throw new Error('Failed to add label');
    }
  }

  revalidatePath('/dashboard');
}

export async function removeLabelFromTask(taskId: string, labelId: string): Promise<void> {
  await requireUser();

  await db
    .delete(taskLabels)
    .where(and(eq(taskLabels.taskId, taskId), eq(taskLabels.labelId, labelId)));

  revalidatePath('/dashboard');
}
