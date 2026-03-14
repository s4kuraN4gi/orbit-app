import { db } from '@/lib/db';
import { session, user } from '@/lib/schema';
import { eq, and, gt } from 'drizzle-orm';
import { verifyProjectAccess } from '@/lib/project-access';

export async function authenticateRequest(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;

  // Verify session exists in DB, has not expired, AND has not been revoked.
  // A revoked session is deleted from the session table by Better Auth,
  // so the INNER JOIN + token match ensures the session is still valid.
  // We also explicitly filter by expiresAt > now() in the query itself.
  const now = new Date();
  const [result] = await db
    .select()
    .from(session)
    .innerJoin(user, eq(session.userId, user.id))
    .where(
      and(
        eq(session.token, token),
        gt(session.expiresAt, now)
      )
    );

  if (!result) return null;

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
