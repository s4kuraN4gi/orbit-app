import { db } from '@/lib/db';
import { session, user } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { verifyProjectAccess } from '@/lib/project-access';

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
  const result = await verifyProjectAccess(userId, projectId);
  return result?.project ?? null;
}
