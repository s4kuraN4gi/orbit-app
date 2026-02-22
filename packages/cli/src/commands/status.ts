import ora from 'ora';
import { getDb } from '../lib/db.js';
import { tasks } from '../lib/schema.js';
import { requireAuth } from '../lib/session.js';
import { getProjectLink } from '../lib/project.js';
import { formatStatusSummary, heading, error } from '../lib/display.js';
import { eq } from 'drizzle-orm';
import type { Task } from '../types.js';

export async function statusCommand(): Promise<void> {
  await requireAuth();
  const link = await getProjectLink();

  const spinner = ora('Loading status...').start();

  try {
    const db = await getDb();

    const data = await db
      .select()
      .from(tasks)
      .where(eq(tasks.projectId, link.project_id));

    spinner.stop();

    const taskList: Task[] = data.map((t) => ({
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
    console.log(formatStatusSummary(taskList));
    console.log('');
  } catch (err: unknown) {
    spinner.stop();
    const message = err instanceof Error ? err.message : String(err);
    console.log(error(message));
    process.exit(1);
  }
}
