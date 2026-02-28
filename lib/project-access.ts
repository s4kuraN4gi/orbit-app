import { db } from '@/lib/db';
import { projects, member } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Core project access verification logic.
 * Used by both Server Actions (auth-helpers.ts) and CLI API routes (cli/auth.ts).
 *
 * Returns { project, role } if the user has access, null otherwise.
 * Does NOT throw — callers decide how to handle denial.
 */
export async function verifyProjectAccess(userId: string, projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) return null;

  // Team project — check org membership
  if (project.organizationId) {
    const [m] = await db
      .select({ id: member.id, role: member.role })
      .from(member)
      .where(
        and(
          eq(member.organizationId, project.organizationId),
          eq(member.userId, userId)
        )
      );
    return m ? { project, role: m.role } : null;
  }

  // Personal project — check ownership
  if (project.ownerId !== userId) return null;
  return { project, role: 'owner' as const };
}
