'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, tasks, member } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Require authenticated user. Throws if not authenticated.
 */
export async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Not authenticated');
  return session.user;
}

/**
 * Check if user is a member of the given organization.
 */
async function isOrgMember(userId: string, organizationId: string) {
  const [m] = await db
    .select({ id: member.id, role: member.role })
    .from(member)
    .where(
      and(eq(member.organizationId, organizationId), eq(member.userId, userId))
    );
  return m ?? null;
}

/**
 * Require access to a project (read/write for member+).
 * Personal project: ownerId check.
 * Team project: member table membership check.
 */
export async function requireProjectAccess(projectId: string) {
  const user = await requireUser();

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) throw new Error('Project not found');

  // Team project
  if (project.organizationId) {
    const m = await isOrgMember(user.id, project.organizationId);
    if (!m) throw new Error('Forbidden');
    return { user, project, role: m.role };
  }

  // Personal project
  if (project.ownerId !== user.id) throw new Error('Forbidden');
  return { user, project, role: 'owner' as const };
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

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, task.projectId));

  if (!project) throw new Error('Project not found');

  // Team project
  if (project.organizationId) {
    const m = await isOrgMember(user.id, project.organizationId);
    if (!m) throw new Error('Forbidden');
    return { user, project, task, role: m.role };
  }

  // Personal project
  if (project.ownerId !== user.id) throw new Error('Forbidden');
  return { user, project, task, role: 'owner' as const };
}

// Legacy aliases for backward compatibility
export const requireProjectOwner = requireProjectAccess;
export const requireTaskOwner = requireTaskAccess;
