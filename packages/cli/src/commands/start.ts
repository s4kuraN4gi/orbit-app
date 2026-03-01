import ora from 'ora';
import { apiRequest } from '../lib/api.js';
import { requireAuth } from '../lib/session.js';
import { getProjectLink } from '../lib/project.js';
import { formatTask, success, error } from '../lib/display.js';
import type { Task } from '../types.js';

export async function startCommand(idPrefix: string): Promise<void> {
  await requireAuth();
  await getProjectLink();

  if (idPrefix.length < 4) {
    console.log(error('ID prefix must be at least 4 characters.'));
    process.exit(1);
  }

  const spinner = ora('Starting task...').start();

  try {
    const data = await apiRequest<{ task: Task }>('PATCH', `/api/cli/tasks/${idPrefix}/start`);
    spinner.stop();

    const task: Task = data.task;
    console.log(success('Task started:'));
    console.log(formatTask(task));
    console.log('');
  } catch (err: unknown) {
    spinner.stop();
    const message = err instanceof Error ? err.message : String(err);
    console.log(error(message));
    process.exit(1);
  }
}
