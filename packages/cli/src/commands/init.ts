import prompts from 'prompts';
import ora from 'ora';
import { apiRequest } from '../lib/api.js';
import { requireAuth } from '../lib/session.js';
import { saveProjectLink } from '../lib/project.js';
import { heading, success, error } from '../lib/display.js';
import type { Project } from '../types.js';

export async function initCommand(): Promise<void> {
  await requireAuth();

  const spinner = ora('Loading projects...').start();

  try {
    const data = await apiRequest('GET', '/api/cli/projects');
    spinner.stop();

    const projectList: Project[] = data.projects;

    if (projectList.length === 0) {
      console.log(error('No projects found. Create one in the Orbit web app first.'));
      process.exit(1);
    }

    console.log(heading('Link this directory to a project'));

    const { projectId } = await prompts({
      type: 'select',
      name: 'projectId',
      message: 'Select project',
      choices: projectList.map((p) => ({
        title: `[${p.key}] ${p.name}`,
        value: p.id,
      })),
    });

    if (!projectId) {
      console.log(error('Init cancelled.'));
      process.exit(1);
    }

    const selected = projectList.find((p) => p.id === projectId)!;
    const cwd = process.cwd();

    const filePath = await saveProjectLink(cwd, {
      project_id: selected.id,
      project_name: selected.name,
      project_key: selected.key,
    });

    await apiRequest('PATCH', `/api/cli/projects/${selected.id}`, { local_path: cwd });

    console.log(success(`Linked to [${selected.key}] ${selected.name}`));
    console.log(success(`Created ${filePath}`));
  } catch (err: unknown) {
    spinner.stop();
    const message = err instanceof Error ? err.message : String(err);
    console.log(error(message));
    process.exit(1);
  }
}
