import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { authenticateRequest, checkProjectAccess } from '../../../auth';
import { rateLimit } from '@/lib/rate-limit';
import { formatTask, findTasksByIdPrefix } from '../../utils';

const limiter = rateLimit({ interval: 60_000, maxRequests: 30 });

export async function PATCH(
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

  const matchingTasks = await findTasksByIdPrefix(idPrefix);

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

  if (task.status === 'in_progress') {
    return NextResponse.json({ task: formatTask(task) });
  }

  const [updated] = await db
    .update(tasks)
    .set({
      status: 'in_progress',
      completedAt: null,
    })
    .where(eq(tasks.id, task.id))
    .returning();

  return NextResponse.json({ task: formatTask(updated) });
}

