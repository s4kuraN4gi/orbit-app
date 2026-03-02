import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, member } from '@/lib/schema';
import { eq, desc, or, sql } from 'drizzle-orm';
import { authenticateRequest } from '../auth';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({ interval: 60_000, maxRequests: 10 });

export async function GET(request: Request) {
  const session = await authenticateRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success } = await limiter.check(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const userId = session.user.id;

  // Single query: LEFT JOIN member to find projects user owns OR is a member of the org
  const rows = await db
    .select({ project: projects })
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
    .orderBy(desc(projects.createdAt));

  // Deduplicate
  const seen = new Set<string>();
  const data = rows
    .map((r) => r.project)
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

  return NextResponse.json({
    projects: data.map((p) => ({
      id: p.id,
      name: p.name,
      key: p.key,
      owner_id: p.ownerId,
      organization_id: p.organizationId,
      local_path: p.localPath,
      created_at: p.createdAt?.toISOString() ?? '',
    })),
  });
}
