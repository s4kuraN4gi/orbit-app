import ora from 'ora';
import { apiRequest } from '../lib/api.js';
import { requireAuth } from '../lib/session.js';
import { getProjectLink } from '../lib/project.js';
import { formatTaskList, heading, error } from '../lib/display.js';
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
    let path = `/api/cli/projects/${link.project_id}/tasks`;
    if (options.status) {
      path += `?status=${options.status}`;
    } else if (!options.all) {
      path += '?status=todo,in_progress';
    }

    const data = await apiRequest<{ tasks: Task[] }>('GET', path);
    spinner.stop();

    const taskList: Task[] = data.tasks;

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
