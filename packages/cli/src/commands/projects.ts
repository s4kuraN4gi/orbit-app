import ora from 'ora';
import { apiRequest } from '../lib/api.js';
import { requireAuth } from '../lib/session.js';
import { formatProject, heading, error, dim } from '../lib/display.js';
import type { Project } from '../types.js';

export async function projectsCommand(): Promise<void> {
  await requireAuth();

  const spinner = ora('Loading projects...').start();

  try {
    const data = await apiRequest('GET', '/api/cli/projects');
    spinner.stop();

    const projectList: Project[] = data.projects;

    if (projectList.length === 0) {
      console.log(dim('No projects found. Create one in the Orbit web app.'));
      return;
    }

    console.log(heading('Your Projects'));
    for (const p of projectList) {
      console.log(formatProject(p));
    }
    console.log('');
  } catch (err: unknown) {
    spinner.stop();
    const message = err instanceof Error ? err.message : String(err);
    console.log(error(message));
    process.exit(1);
  }
}
