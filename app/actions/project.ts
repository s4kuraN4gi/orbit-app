'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { projects, tasks, member } from '@/lib/schema';
import { eq, desc, and, or, sql } from 'drizzle-orm';
import { requireProjectAdmin, requireUser } from '@/lib/auth-helpers';

export async function getProjects() {
  const user = await requireUser();

  // Single query: LEFT JOIN member to find projects user owns OR is a member of the org
  const rows = await db
    .select({ project: projects })
    .from(projects)
    .leftJoin(
      member,
      sql`${member.organizationId} = ${projects.organizationId} AND ${member.userId} = ${user.id}`
    )
    .where(
      or(
        eq(projects.ownerId, user.id),
        sql`${member.id} IS NOT NULL`
      )
    )
    .orderBy(desc(projects.createdAt));

  // Deduplicate (a project the user owns in their own org could appear twice)
  const seen = new Set<string>();
  return rows
    .map((r) => r.project)
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
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
