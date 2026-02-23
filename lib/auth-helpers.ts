'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, tasks } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/**
 * Require authenticated user. Throws if not authenticated.
 */
export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Not authenticated');
  return session.user;
}

/**
 * Require that the authenticated user owns the given project.
 * Returns both user and project. Throws if not authenticated or not owner.
 */
export async function requireProjectOwner(projectId: string) {
  const user = await requireUser();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) throw new Error('Project not found');
  if (project.ownerId !== user.id) throw new Error('Forbidden');

  return { user, project };
}

/**
 * Require that the authenticated user owns the project containing the given task.
 * Returns user, project, and task. Throws if not authenticated, task not found, or not owner.
 */
export async function requireTaskOwner(taskId: string) {
  const user = await requireUser();

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId));

  if (!task) throw new Error('Task not found');

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, task.projectId));

  if (!project) throw new Error('Project not found');
  if (project.ownerId !== user.id) throw new Error('Forbidden');

  return { user, project, task };
}
