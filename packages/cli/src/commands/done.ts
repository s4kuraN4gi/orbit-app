import ora from 'ora';
import chalk from 'chalk';
import { getDb } from '../lib/db.js';
import { tasks } from '../lib/schema.js';
import { requireAuth } from '../lib/session.js';
import { getProjectLink } from '../lib/project.js';
import { formatTask, success, error } from '../lib/display.js';
import { eq, and, like } from 'drizzle-orm';
import type { Task } from '../types.js';

export async function doneCommand(idPrefix: string): Promise<void> {
  await requireAuth();
  const link = await getProjectLink();

  if (idPrefix.length < 4) {
    console.log(error('ID prefix must be at least 4 characters.'));
    process.exit(1);
  }

  const spinner = ora('Marking task as done...').start();

  try {
    const db = await getDb();

    // Find task by ID prefix
    const matchingTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.projectId, link.project_id), like(tasks.id, `${idPrefix}%`)));

    if (!matchingTasks || matchingTasks.length === 0) {
      spinner.fail('No task found');
      console.log(error(`No task matching "${idPrefix}" in this project.`));
      process.exit(1);
    }

    if (matchingTasks.length > 1) {
      spinner.fail('Ambiguous ID');
      console.log(error(`Multiple tasks match "${idPrefix}". Use a longer prefix:`));
      for (const t of matchingTasks) {
        console.log(`  ${chalk.dim(t.id.slice(0, 8))}  ${t.title}`);
      }
      process.exit(1);
    }

    const matched = matchingTasks[0];
    const task: Task = {
      id: matched.id,
      project_id: matched.projectId,
      parent_id: matched.parentId,
      title: matched.title,
      description: matched.description ?? '',
      status: matched.status as Task['status'],
      priority: matched.priority as Task['priority'],
      start_date: matched.startDate?.toISOString() ?? null,
      due_date: matched.dueDate?.toISOString() ?? null,
      created_at: matched.createdAt?.toISOString() ?? '',
      position: matched.position ?? undefined,
      completed_at: matched.completedAt?.toISOString() ?? null,
    };

    if (task.status === 'done') {
      spinner.stop();
      console.log(success('Task is already done:'));
      console.log(formatTask(task));
      return;
    }

    // Update status to done
    await db
      .update(tasks)
      .set({
        status: 'done',
        completedAt: new Date(),
      })
      .where(eq(tasks.id, task.id));

    spinner.stop();

    const updatedTask: Task = { ...task, status: 'done' };
    console.log(success('Task completed:'));
    console.log(formatTask(updatedTask));
    console.log('');
  } catch (err: unknown) {
    spinner.stop();
    const message = err instanceof Error ? err.message : String(err);
    console.log(error(message));
    process.exit(1);
  }
}
