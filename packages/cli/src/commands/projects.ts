import ora from 'ora';
import { getDb } from '../lib/db.js';
import { projects } from '../lib/schema.js';
import { requireAuth } from '../lib/session.js';
import { loadSession } from '../lib/config.js';
import { formatProject, heading, error, dim } from '../lib/display.js';
import { eq, desc } from 'drizzle-orm';
import type { Project } from '../types.js';

export async function projectsCommand(): Promise<void> {
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
      console.log(dim('No projects found. Create one in the Orbit web app.'));
      return;
    }

    const projectList: Project[] = data.map((p) => ({
      id: p.id,
      name: p.name,
      key: p.key,
      owner_id: p.ownerId,
      local_path: p.localPath,
      created_at: p.createdAt?.toISOString(),
    }));

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
