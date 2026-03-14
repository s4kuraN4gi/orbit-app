import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { eq, asc, and, inArray, desc } from 'drizzle-orm';
import { authenticateRequest, checkProjectAccess } from '../../../auth';
import { createTaskSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { formatTask } from '@/app/api/cli/tasks/utils';

const limiter = rateLimit({ interval: 60_000, maxRequests: 30 });

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
    tasks: data.map(formatTask),
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

  const { success: rateLimitOk } = await limiter.check(session.user.id);
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { id } = await params;

  const project = await checkProjectAccess(session.user.id, id);
  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try {
    const raw = await request.json();
    body = createTaskSchema.parse(raw);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, description, priority, status } = body;

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
    task: formatTask(task),
  });
}
