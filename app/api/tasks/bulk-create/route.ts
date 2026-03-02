import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { tasks, aiContexts } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';
import { verifyProjectAccess } from '@/lib/project-access';
import { bulkCreateSchema } from '@/lib/validations';
import { ZodError } from 'zod';
import type { Task } from '@/types';

const limiter = rateLimit({ interval: 60_000, maxRequests: 10 });

const MAX_RECURSION_DEPTH = 5;

interface FlatTask {
  title: string;
  description: string | null;
  status: string;
  priority: string;
  startDate: Date | null;
  dueDate: Date | null;
  tempParentIndex: number | null;
}

function flattenTasks(
  taskList: Task[],
  parentIndex: number | null = null,
  depth: number = 0
): FlatTask[] {
  if (depth > MAX_RECURSION_DEPTH) {
    throw new Error(`Maximum nesting depth (${MAX_RECURSION_DEPTH}) exceeded`);
  }

  const result: FlatTask[] = [];
  for (const task of taskList) {
    const currentIndex = result.length + (parentIndex !== null ? parentIndex + 1 : 0);
    result.push({
      title: task.title,
      description: task.description || null,
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      startDate: task.start_date ? new Date(task.start_date) : null,
      dueDate: task.due_date ? new Date(task.due_date) : null,
      tempParentIndex: parentIndex,
    });

    if (task.children && task.children.length > 0) {
      const childFlat = flattenTasks(task.children, result.length - 1, depth + 1);
      result.push(...childFlat);
    }
  }
  return result;
}

interface BulkCreateRequestBody {
  project_id: string;
  source_tool: 'Antigravity' | 'Cursor' | 'Manual';
  original_prompt: string;
  tasks: Task[];
}

export async function POST(request: Request) {
  try {
    // Authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { success } = await limiter.check(session.user.id);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const raw = await request.json();
    const body = bulkCreateSchema.parse(raw) as BulkCreateRequestBody;

    // Authorization: verify project access (personal + org)
    const access = await verifyProjectAccess(session.user.id, body.project_id);
    if (!access) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Create AI Context
    const [aiContext] = await db
      .insert(aiContexts)
      .values({
        projectId: body.project_id,
        sourceTool: body.source_tool || 'Manual',
        originalPrompt: body.original_prompt || '',
        rawData: body,
      })
      .returning({ id: aiContexts.id });

    if (!aiContext) {
      return NextResponse.json(
        { error: 'Failed to create AI context' },
        { status: 500 }
      );
    }

    // 2. Flatten task tree and batch insert
    const flatTasks = flattenTasks(body.tasks);

    // Insert all tasks in a single batch
    const insertedTasks = await db
      .insert(tasks)
      .values(
        flatTasks.map((t) => ({
          projectId: body.project_id,
          aiContextId: aiContext.id,
          parentId: null as string | null,
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          startDate: t.startDate,
          dueDate: t.dueDate,
        }))
      )
      .returning({ id: tasks.id });

    // 3. Update parent IDs for child tasks (single batch round-trip)
    const parentUpdates = flatTasks
      .map((t, i) => ({ task: t, index: i }))
      .filter(({ task }) => task.tempParentIndex !== null && task.tempParentIndex >= 0 && task.tempParentIndex < insertedTasks.length)
      .map(({ task, index }) =>
        db.update(tasks)
          .set({ parentId: insertedTasks[task.tempParentIndex!].id })
          .where(eq(tasks.id, insertedTasks[index].id))
      );

    if (parentUpdates.length > 0) {
      await db.batch(parentUpdates as [typeof parentUpdates[0], ...typeof parentUpdates]);
    }

    return NextResponse.json({
      success: true,
      message: 'Tasks created successfully',
      ai_context_id: aiContext.id,
    });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
