'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyProjectAccess } from '@/lib/project-access';

/**
 * Require authenticated user. Throws if not authenticated.
 */
export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Not authenticated');
  return session.user;
}

/**
 * Require access to a project (read/write for member+).
 * Personal project: ownerId check.
 * Team project: member table membership check.
 */
export async function requireProjectAccess(projectId: string) {
  const user = await requireUser();
  const result = await verifyProjectAccess(user.id, projectId);
  if (!result) throw new Error('Forbidden');
  return { user, project: result.project, role: result.role };
}

/**
 * Require admin/owner access to a project.
 * Personal project: ownerId check (always owner).
 * Team project: must be owner or admin in org.
 */
export async function requireProjectAdmin(projectId: string) {
  const { user, project, role } = await requireProjectAccess(projectId);

  if (role !== 'owner' && role !== 'admin') {
    throw new Error('Forbidden: admin or owner required');
  }

  return { user, project, role };
}

/**
 * Require access to a task's parent project.
 * Returns user, project, task, and role.
 */
export async function requireTaskAccess(taskId: string) {
  const user = await requireUser();

  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId));

  if (!task) throw new Error('Task not found');

  const result = await verifyProjectAccess(user.id, task.projectId);
  if (!result) throw new Error('Forbidden');

  return { user, project: result.project, task, role: result.role };
}

// Legacy aliases for backward compatibility
export const requireProjectOwner = requireProjectAccess;
export const requireTaskOwner = requireTaskAccess;
