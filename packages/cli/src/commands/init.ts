import prompts from 'prompts';
import ora from 'ora';
import { getDb } from '../lib/db.js';
import { projects } from '../lib/schema.js';
import { requireAuth } from '../lib/session.js';
import { saveProjectLink } from '../lib/project.js';
import { heading, success, error } from '../lib/display.js';
import { eq, desc } from 'drizzle-orm';
import type { Project } from '../types.js';

export async function initCommand(): Promise<void> {
  const user = await requireAuth();

  const spinner = ora('Loading projects...').start();

  try {
    const db = await getDb();

    const data = await db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, user.id))
      .orderBy(desc(projects.createdAt));

    spinner.stop();

    if (data.length === 0) {
      console.log(error('No projects found. Create one in the Orbit web app first.'));
      process.exit(1);
    }

    const projectList: Project[] = data.map((p) => ({
      id: p.id,
      name: p.name,
      key: p.key,
      owner_id: p.ownerId,
      local_path: p.localPath,
      created_at: p.createdAt?.toISOString(),
    }));

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

    // Save .orbit.json locally
    const filePath = await saveProjectLink(cwd, {
      project_id: selected.id,
      project_name: selected.name,
      project_key: selected.key,
    });

    // Update project's local_path in DB
    await db
      .update(projects)
      .set({ localPath: cwd })
      .where(eq(projects.id, selected.id));

    console.log(success(`Linked to [${selected.key}] ${selected.name}`));
    console.log(success(`Created ${filePath}`));
  } catch (err: unknown) {
    spinner.stop();
    const message = err instanceof Error ? err.message : String(err);
    console.log(error(message));
    process.exit(1);
  }
}
