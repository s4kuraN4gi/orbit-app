import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, projects } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { authenticateRequest } from '../../../auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticateRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, task.projectId));

  if (!project || project.ownerId !== session.user.id) {
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

function formatTask(t: any) {
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
