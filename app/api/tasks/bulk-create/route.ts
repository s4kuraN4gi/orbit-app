import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { tasks, aiContexts, projects } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import type { Task } from '@/types';

async function insertTasks(
  taskList: Task[],
  projectId: string,
  aiContextId: string,
  parentId: string | null = null
) {
  for (const task of taskList) {
    const [insertedTask] = await db
      .insert(tasks)
      .values({
        projectId,
        parentId,
        aiContextId,
        title: task.title,
        description: task.description,
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        startDate: task.start_date ? new Date(task.start_date) : null,
        dueDate: task.due_date ? new Date(task.due_date) : null,
      })
      .returning({ id: tasks.id });

    if (!insertedTask) {
      throw new Error(`Failed to insert task: ${task.title}`);
    }

    if (task.children && task.children.length > 0) {
      await insertTasks(task.children, projectId, aiContextId, insertedTask.id);
    }
  }
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

    const body: BulkCreateRequestBody = await request.json();

    if (!body.project_id || !body.tasks || !Array.isArray(body.tasks)) {
      return NextResponse.json(
        { error: 'Invalid request body. project_id and tasks array are required.' },
        { status: 400 }
      );
    }

    // Authorization: verify project ownership
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, body.project_id));

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.ownerId !== session.user.id) {
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

    // 2. Insert Tasks Recursively
    await insertTasks(body.tasks, body.project_id, aiContext.id, null);

    return NextResponse.json({
      success: true,
      message: 'Tasks created successfully',
      ai_context_id: aiContext.id,
    });
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
