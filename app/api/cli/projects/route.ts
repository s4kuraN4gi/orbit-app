import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, member } from '@/lib/schema';
import { eq, desc, or, inArray } from 'drizzle-orm';
import { authenticateRequest } from '../auth';

export async function GET(request: Request) {
  const session = await authenticateRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Get org IDs user belongs to
  const memberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, userId));

  const orgIds = memberships.map((m) => m.organizationId);

  // Fetch personal + team projects
  const conditions = [eq(projects.ownerId, userId)];
  if (orgIds.length > 0) {
    conditions.push(inArray(projects.organizationId, orgIds));
  }

  const data = await db
    .select()
    .from(projects)
    .where(or(...conditions))
    .orderBy(desc(projects.createdAt));

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
