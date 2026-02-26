import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { eq, asc, and, inArray, desc } from 'drizzle-orm';
import { authenticateRequest, checkProjectAccess } from '../../../auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticateRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const project = await checkProjectAccess(session.user.id, id);
  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get('status');

  let conditions = [eq(tasks.projectId, id)];
  if (statusParam) {
    const statuses = statusParam.split(',').map((s) => s.trim());
    conditions.push(inArray(tasks.status, statuses));
  }

  const data = await db
    .select()
    .from(tasks)
    .where(and(...conditions))
    .orderBy(asc(tasks.position));

  return NextResponse.json({
    tasks: data.map((t) => ({
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
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticateRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  const project = await checkProjectAccess(session.user.id, id);
  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { title, description, priority, status } = body;

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  // Calculate position
  const [maxPosData] = await db
    .select({ position: tasks.position })
    .from(tasks)
    .where(eq(tasks.projectId, id))
    .orderBy(desc(tasks.position))
    .limit(1);

  const newPosition = (maxPosData?.position || 0) + 65536;

  const [task] = await db
    .insert(tasks)
    .values({
      projectId: id,
      title,
      description: description || null,
      priority: priority || 'medium',
      status: status || 'todo',
      position: newPosition,
    })
    .returning();

  return NextResponse.json({
    task: {
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      position: task.position,
      description: task.description,
      project_id: task.projectId,
      parent_id: task.parentId,
      start_date: task.startDate?.toISOString() ?? null,
      due_date: task.dueDate?.toISOString() ?? null,
      created_at: task.createdAt?.toISOString() ?? '',
      completed_at: task.completedAt?.toISOString() ?? null,
    },
  });
}
