import ora from 'ora';
import { apiRequest } from '../lib/api.js';
import { requireAuth } from '../lib/session.js';
import { getProjectLink } from '../lib/project.js';
import { formatStatusSummary, heading, error } from '../lib/display.js';
import type { Task } from '../types.js';

export async function statusCommand(): Promise<void> {
  await requireAuth();
  const link = await getProjectLink();

  const spinner = ora('Loading status...').start();

  try {
    const data = await apiRequest<{ tasks: Task[] }>('GET', `/api/cli/projects/${link.project_id}/tasks`);
    spinner.stop();

    const taskList: Task[] = data.tasks;

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
