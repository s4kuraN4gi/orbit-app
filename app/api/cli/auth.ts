import { db } from '@/lib/db';
import { session, user, projects, member } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function authenticateRequest(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  const [result] = await db
    .select()
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(eq(session.token, token));

  if (!result || result.session.expiresAt < new Date()) return null;

  return {
    session: result.session,
    user: result.user,
  };
}

/**
 * Check project access for CLI routes.
 * Returns project if user has access, null otherwise.
 */
export async function checkProjectAccess(userId: string, projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) return null;

  // Personal project
  if (!project.organizationId) {
    return project.ownerId === userId ? project : null;
  }

  // Team project — check membership
  const [m] = await db
    .select({ id: member.id })
    .from(member)
    .where(
      and(
        eq(member.organizationId, project.organizationId),
        eq(member.userId, userId)
      )
    );

  return m ? project : null;
}
