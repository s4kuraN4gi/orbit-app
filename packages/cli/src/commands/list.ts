import ora from 'ora';
import { getDb } from '../lib/db.js';
import { tasks } from '../lib/schema.js';
import { requireAuth } from '../lib/session.js';
import { getProjectLink } from '../lib/project.js';
import { formatTaskList, heading, error } from '../lib/display.js';
import { eq, asc, inArray } from 'drizzle-orm';
import type { Task, TaskStatus } from '../types.js';

interface ListOptions {
  all?: boolean;
  status?: TaskStatus;
}

export async function listCommand(options: ListOptions): Promise<void> {
  await requireAuth();
  const link = await getProjectLink();

  const spinner = ora('Loading tasks...').start();

  try {
    const db = await getDb();

    let query = db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, link.project_id))
      .orderBy(asc(tasks.position));

    const data = await query;

    spinner.stop();

    // Filter in JS (Drizzle chaining with dynamic conditions is cleaner this way for CLI)
    let filtered = data;
    if (options.status) {
      filtered = data.filter((t) => t.status === options.status);
    } else if (!options.all) {
      filtered = data.filter((t) => t.status === 'todo' || t.status === 'in_progress');
    }

    const taskList: Task[] = filtered.map((t) => ({
      id: t.id,
      project_id: t.projectId,
      parent_id: t.parentId,
      title: t.title,
      description: t.description ?? '',
      status: t.status as Task['status'],
      priority: t.priority as Task['priority'],
      start_date: t.startDate?.toISOString() ?? null,
      due_date: t.dueDate?.toISOString() ?? null,
      created_at: t.createdAt?.toISOString() ?? '',
      position: t.position ?? undefined,
      completed_at: t.completedAt?.toISOString() ?? null,
    }));

    console.log(heading(`[${link.project_key}] ${link.project_name}`));
    console.log(formatTaskList(taskList));
    console.log('');
  } catch (err: unknown) {
    spinner.stop();
    const message = err instanceof Error ? err.message : String(err);
    console.log(error(message));
    process.exit(1);
  }
}
