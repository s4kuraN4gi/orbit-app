import { db } from '@/lib/db';
import { session, user } from '@/lib/schema';
import { eq } from 'drizzle-orm';

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
