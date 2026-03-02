import { db } from '@/lib/db';
import { projects, member } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Core project access verification logic.
 * Used by both Server Actions (auth-helpers.ts) and CLI API routes (cli/auth.ts).
 *
 * Returns { project, role } if the user has access, null otherwise.
 * Does NOT throw — callers decide how to handle denial.
 *
 * Uses a single LEFT JOIN query for both personal and team projects.
 */
export async function verifyProjectAccess(userId: string, projectId: string) {
  const [row] = await db
    .select({
      project: projects,
      memberId: member.id,
      memberRole: member.role,
    })
    .from(projects)
    .leftJoin(
      member,
      and(
        eq(member.organizationId, projects.organizationId),
        eq(member.userId, userId)
      )
    )
    .where(eq(projects.id, projectId));

  if (!row) return null;

  const project = row.project;

  // Team project — check org membership via JOIN result
  if (project.organizationId) {
    return row.memberId ? { project, role: row.memberRole! } : null;
  }

  // Personal project — check ownership
  if (project.ownerId !== userId) return null;
  return { project, role: 'owner' as const };
}
