import ora from 'ora';
import { apiRequest } from '../lib/api.js';
import { requireAuth } from '../lib/session.js';
import { getProjectLink } from '../lib/project.js';
import { formatTask, success, error } from '../lib/display.js';
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
    const data = await apiRequest('POST', `/api/cli/projects/${link.project_id}/tasks`, {
      title,
      description: options.description || undefined,
      priority: options.priority || 'medium',
      status: options.status || 'todo',
    });

    spinner.stop();

    const task: Task = data.task;

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
