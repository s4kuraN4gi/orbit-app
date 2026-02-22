'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { taskComments } from '@/lib/schema';
import { eq, asc, and } from 'drizzle-orm';

export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user_email?: string;
}

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Not authenticated');
  return session.user;
}

export async function getTaskComments(taskId: string): Promise<Comment[]> {
  const user = await requireUser();

  const data = await db
    .select()
    .from(taskComments)
    .where(eq(taskComments.taskId, taskId))
    .orderBy(asc(taskComments.createdAt));

  return data.map((c) => ({
    id: c.id,
    task_id: c.taskId,
    user_id: c.userId,
    content: c.content,
    created_at: c.createdAt?.toISOString() ?? '',
    updated_at: c.updatedAt?.toISOString() ?? '',
    user_email: c.userId === user.id ? user.email : 'Unknown User',
  }));
}

export async function addComment(taskId: string, content: string): Promise<Comment | null> {
  const user = await requireUser();

  if (!content.trim()) {
    throw new Error('Comment content is required');
  }

  const [data] = await db
    .insert(taskComments)
    .values({
      taskId,
      userId: user.id,
      content: content.trim(),
    })
    .returning();

  if (!data) throw new Error('Failed to add comment');

  revalidatePath('/dashboard');

  return {
    id: data.id,
    task_id: data.taskId,
    user_id: data.userId,
    content: data.content,
    created_at: data.createdAt?.toISOString() ?? '',
    updated_at: data.updatedAt?.toISOString() ?? '',
    user_email: user.email,
  };
}

export async function updateComment(commentId: string, content: string): Promise<Comment | null> {
  const user = await requireUser();

  if (!content.trim()) {
    throw new Error('Comment content is required');
  }

  const [data] = await db
    .update(taskComments)
    .set({
      content: content.trim(),
      updatedAt: new Date(),
    })
    .where(and(eq(taskComments.id, commentId), eq(taskComments.userId, user.id)))
    .returning();

  if (!data) throw new Error('Failed to update comment');

  revalidatePath('/dashboard');

  return {
    id: data.id,
    task_id: data.taskId,
    user_id: data.userId,
    content: data.content,
    created_at: data.createdAt?.toISOString() ?? '',
    updated_at: data.updatedAt?.toISOString() ?? '',
  };
}

export async function deleteComment(commentId: string): Promise<void> {
  const user = await requireUser();

  await db
    .delete(taskComments)
    .where(and(eq(taskComments.id, commentId), eq(taskComments.userId, user.id)));

  revalidatePath('/dashboard');
}
