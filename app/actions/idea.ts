'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { ideas, tasks } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { requireProjectOwner, requireUser } from '@/lib/auth-helpers';

export interface Idea {
  id: string;
  project_id: string;
  content: string;
  notes: string | null;
  created_at: string;
  converted_task_id: string | null;
}

function toIdea(row: typeof ideas.$inferSelect): Idea {
  return {
    id: row.id,
    project_id: row.projectId,
    content: row.content,
    notes: row.notes,
    created_at: row.createdAt?.toISOString() ?? '',
    converted_task_id: row.convertedTaskId,
  };
}

export async function getIdeas(projectId: string): Promise<Idea[]> {
  await requireProjectOwner(projectId);

  const data = await db
    .select()
    .from(ideas)
    .where(eq(ideas.projectId, projectId))
    .orderBy(desc(ideas.createdAt));

  return data.map(toIdea);
}

export async function createIdea(projectId: string, content: string): Promise<Idea | null> {
  await requireProjectOwner(projectId);

  const [data] = await db
    .insert(ideas)
    .values({ projectId, content })
    .returning();

  if (!data) return null;

  revalidatePath('/dashboard');
  return toIdea(data);
}

export async function deleteIdea(ideaId: string): Promise<boolean> {
  const user = await requireUser();

  // Verify ownership via the idea's project
  const [idea] = await db.select().from(ideas).where(eq(ideas.id, ideaId));
  if (!idea) throw new Error('Idea not found');
  await requireProjectOwner(idea.projectId);

  await db.delete(ideas).where(eq(ideas.id, ideaId));
  revalidatePath('/dashboard');
  return true;
}

export async function updateIdea(ideaId: string, updates: { content?: string; notes?: string | null }): Promise<Idea | null> {
  // Verify ownership via the idea's project
  const [idea] = await db.select().from(ideas).where(eq(ideas.id, ideaId));
  if (!idea) throw new Error('Idea not found');
  await requireProjectOwner(idea.projectId);

  const [data] = await db
    .update(ideas)
    .set(updates)
    .where(eq(ideas.id, ideaId))
    .returning();

  if (!data) return null;

  revalidatePath('/dashboard');
  return toIdea(data);
}

export async function convertIdeaToTask(ideaId: string): Promise<string | null> {
  // Verify ownership via the idea's project
  const [idea] = await db.select().from(ideas).where(eq(ideas.id, ideaId));
  if (!idea) throw new Error('Idea not found');
  await requireProjectOwner(idea.projectId);

  // Create task from idea — need returning() so can't fully batch
  const [task] = await db
    .insert(tasks)
    .values({
      projectId: idea.projectId,
      title: idea.content.slice(0, 100),
      description: idea.notes || null,
      status: 'todo',
      priority: 'medium',
    })
    .returning();

  if (!task) return null;

  // Update idea with converted task ID
  await db
    .update(ideas)
    .set({ convertedTaskId: task.id })
    .where(eq(ideas.id, ideaId));

  revalidatePath('/dashboard');
  return task.id;
}
