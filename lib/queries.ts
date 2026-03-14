import { db } from '@/lib/db';
import { projects, member } from '@/lib/schema';
import { eq, desc, or, sql } from 'drizzle-orm';

/**
 * Fetch all projects accessible to a user (owned or via org membership).
 * Single query with DISTINCT ON to avoid duplicates from LEFT JOIN.
 */
export async function getProjectsForUser(userId: string) {
  const rows = await db
    .selectDistinctOn([projects.id], { project: projects })
    .from(projects)
    .leftJoin(
      member,
      sql`${member.organizationId} = ${projects.organizationId} AND ${member.userId} = ${userId}`
    )
    .where(
      or(
        eq(projects.ownerId, userId),
        sql`${member.id} IS NOT NULL`
      )
    )
    .orderBy(projects.id, desc(projects.createdAt));

  return rows.map((r) => r.project);
}
