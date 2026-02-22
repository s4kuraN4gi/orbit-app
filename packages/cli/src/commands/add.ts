import ora from 'ora';
import { getDb } from '../lib/db.js';
import { tasks } from '../lib/schema.js';
import { requireAuth } from '../lib/session.js';
import { getProjectLink } from '../lib/project.js';
import { formatTask, success, error } from '../lib/display.js';
import { eq, desc } from 'drizzle-orm';
import type { Task, TaskPriority } from '../types.js';

interface AddOptions {
  priority?: TaskPriority;
  status?: string;
  description?: string;
}

export async function addCommand(title: string, options: AddOptions): Promise<void> {
  await requireAuth();
  const link = await getProjectLink();

  const spinner = ora('Creating task...').start();

  try {
    const db = await getDb();

    // Get max position
    const [maxPosData] = await db
      .select({ position: tasks.position })
      .from(tasks)
      .where(eq(tasks.projectId, link.project_id))
      .orderBy(desc(tasks.position))
      .limit(1);

    const newPosition = (maxPosData?.position || 0) + 65536;

    const [data] = await db
      .insert(tasks)
      .values({
        projectId: link.project_id,
        title,
        description: options.description || null,
        priority: options.priority || 'medium',
        status: options.status || 'todo',
        position: newPosition,
        parentId: null,
      })
      .returning();

    spinner.stop();

    if (!data) {
      console.log(error('Failed to create task'));
      process.exit(1);
    }

    const task: Task = {
      id: data.id,
      project_id: data.projectId,
      parent_id: data.parentId,
      title: data.title,
      description: data.description ?? '',
      status: data.status as Task['status'],
      priority: data.priority as Task['priority'],
      start_date: data.startDate?.toISOString() ?? null,
      due_date: data.dueDate?.toISOString() ?? null,
      created_at: data.createdAt?.toISOString() ?? '',
      position: data.position ?? undefined,
      completed_at: data.completedAt?.toISOString() ?? null,
    };

    console.log(success('Task created:'));
    console.log(formatTask(task));
    console.log('');
  } catch (err: unknown) {
    spinner.stop();
    const message = err instanceof Error ? err.message : String(err);
    console.log(error(message));
    process.exit(1);
  }
}
