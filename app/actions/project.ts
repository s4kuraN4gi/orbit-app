'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, tasks, member } from '@/lib/schema';
import { eq, desc, and, or, inArray } from 'drizzle-orm';
import { requireProjectAdmin } from '@/lib/auth-helpers';

async function requireUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error('Not authenticated');
  return session.user;
}

export async function getProjects() {
  const user = await requireUser();

  // Get org IDs user belongs to
  const memberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, user.id));

  const orgIds = memberships.map((m) => m.organizationId);

  const conditions = [eq(projects.ownerId, user.id)];
  if (orgIds.length > 0) {
    conditions.push(inArray(projects.organizationId, orgIds));
  }

  const data = await db
    .select()
    .from(projects)
    .where(or(...conditions))
    .orderBy(desc(projects.createdAt));

  return data;
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

  // First delete all tasks belonging to this project
  await db.delete(tasks).where(eq(tasks.projectId, projectId));

  // Then delete the project
  await db.delete(projects).where(eq(projects.id, projectId));

  revalidatePath('/dashboard');
}
