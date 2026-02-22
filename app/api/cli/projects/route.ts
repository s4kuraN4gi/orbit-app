import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';
import { authenticateRequest } from '../auth';

export async function GET(request: Request) {
  const session = await authenticateRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await db
    .select()
    .from(projects)
    .where(eq(projects.ownerId, session.user.id))
    .orderBy(desc(projects.createdAt));

  return NextResponse.json({
    projects: data.map((p) => ({
      id: p.id,
      name: p.name,
      key: p.key,
      owner_id: p.ownerId,
      local_path: p.localPath,
      created_at: p.createdAt?.toISOString() ?? '',
    })),
  });
}
