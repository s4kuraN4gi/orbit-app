import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest } from '../../auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticateRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, id));

  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

  if (project.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { local_path } = body;

  const [updated] = await db
    .update(projects)
    .set({ localPath: local_path })
    .where(eq(projects.id, id))
    .returning();

  return NextResponse.json({
    project: {
      id: updated.id,
      name: updated.name,
      key: updated.key,
      owner_id: updated.ownerId,
      local_path: updated.localPath,
      created_at: updated.createdAt?.toISOString() ?? '',
    },
  });
}
