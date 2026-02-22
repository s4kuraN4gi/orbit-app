'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, tasks } from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Not authenticated');
  return session.user;
}

export async function getProjects() {
  const user = await requireUser();

  const data = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, user.id))
    .orderBy(desc(projects.createdAt));

  return data;
}

export async function createProject(name: string, key: string) {
  const user = await requireUser();

  const [data] = await db
    .insert(projects)
    .values({
      name,
      key: key.toUpperCase(),
      ownerId: user.id,
    })
    .returning();

  revalidatePath('/dashboard');
  return data;
}

export async function deleteProject(projectId: string) {
  const user = await requireUser();

  // First delete all tasks belonging to this project
  await db.delete(tasks).where(eq(tasks.projectId, projectId));

  // Then delete the project (only if owned by the user)
  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, user.id)));

  revalidatePath('/dashboard');
}
