import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { sql } from 'drizzle-orm';
import { authenticateRequest, checkProjectAccess } from '../../auth';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({ interval: 60_000, maxRequests: 30 });

type TaskRow = typeof import('@/lib/schema').tasks.$inferSelect;

function formatTask(t: TaskRow) {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    position: t.position,
    description: t.description,
    project_id: t.projectId,
    parent_id: t.parentId,
    start_date: t.startDate?.toISOString() ?? null,
    due_date: t.dueDate?.toISOString() ?? null,
    created_at: t.createdAt?.toISOString() ?? '',
    completed_at: t.completedAt?.toISOString() ?? null,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticateRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success } = await limiter.check(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { id: idPrefix } = await params;

  if (idPrefix.length < 4) {
    return NextResponse.json(
      { error: 'Task ID prefix must be at least 4 characters' },
      { status: 400 }
    );
  }

  const matchingTasks = await db
    .select()
    .from(tasks)
    .where(sql`${tasks.id}::text LIKE ${idPrefix + '%'}`);

  if (matchingTasks.length === 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (matchingTasks.length > 1) {
    return NextResponse.json(
      {
        error: 'Multiple tasks match this prefix',
        matching_ids: matchingTasks.map((t) => t.id),
      },
      { status: 409 }
    );
  }

  const task = matchingTasks[0];

  const project = await checkProjectAccess(session.user.id, task.projectId);
  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ task: formatTask(task) });
}
