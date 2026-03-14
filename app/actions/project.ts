'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { projects, tasks, member } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { requireProjectAdmin, requireUser } from '@/lib/auth-helpers';
import { getProjectsForUser } from '@/lib/queries';

export async function getProjects() {
  const user = await requireUser();
  return getProjectsForUser(user.id);
}

export async function createProject(
  name: string,
  key: string,
  organizationId?: string | null
) {
  const user = await requireUser();

  // If organizationId provided, verify membership
  if (organizationId) {
    const [m] = await db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, organizationId),
          eq(member.userId, user.id)
        )
      );
    if (!m) throw new Error('Forbidden');
  }

  const [data] = await db
    .insert(projects)
    .values({
      name,
      key: key.toUpperCase(),
      ownerId: user.id,
      organizationId: organizationId || null,
    })
    .returning();

  revalidatePath('/dashboard');
  return data;
}

export async function deleteProject(projectId: string) {
  // Require admin/owner for deletion
  await requireProjectAdmin(projectId);

  // Delete tasks and project in a single batch (1 HTTP round-trip)
  await db.batch([
    db.delete(tasks).where(eq(tasks.projectId, projectId)),
    db.delete(projects).where(eq(projects.id, projectId)),
  ]);

  revalidatePath('/dashboard');
}
