import ora from 'ora';
import chalk from 'chalk';
import { apiRequest } from '../lib/api.js';
import { requireAuth } from '../lib/session.js';
import { getProjectLink } from '../lib/project.js';
import { scanProject } from '../lib/detector.js';
import { error, dim } from '../lib/display.js';
import type { Task } from '../types.js';

function progressBar(pct: number, width = 20): string {
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  return chalk.green('\u2588'.repeat(filled)) + chalk.gray('\u2591'.repeat(empty));
}

export async function scanCommand(): Promise<void> {
  await requireAuth();
  const link = await getProjectLink();

  const spinner = ora('Scanning project...').start();

  try {
    const [scan, taskData] = await Promise.all([
      scanProject(process.cwd()),
      apiRequest('GET', `/api/cli/projects/${link.project_id}/tasks`),
    ]);
    spinner.stop();

    const tasks: Task[] = taskData.tasks;

    // Header
    console.log('');
    console.log(chalk.bold.cyan('  [ORB] Orbit — Project Scan'));
    console.log('');

    // Tech Stack
    console.log(chalk.bold('  Tech Stack'));
    if (scan.techStack.length > 0) {
      console.log(chalk.white(`    ${scan.techStack.join(' / ')}`));
    }
    const meta: string[] = [];
    if (scan.nodeVersion) meta.push(`Node ${scan.nodeVersion}`);
    if (scan.packageManager) meta.push(scan.packageManager);
    if (meta.length > 0) {
      console.log(chalk.dim(`    ${meta.join(' / ')}`));
    }
    console.log('');

    // Dependencies
    console.log(chalk.bold(`  Dependencies (${scan.depCount.total} packages)`));
    const catLabelWidth = Math.max(...scan.dependencies.map((d) => d.category.length));
    for (const { category, packages } of scan.dependencies) {
      const label = `${category}:`.padEnd(catLabelWidth + 1);
      const pkgList = packages.length > 5
        ? packages.slice(0, 5).join(', ') + `, +${packages.length - 5}`
        : packages.join(', ');
      console.log(`    ${chalk.dim(label)} ${pkgList}`);
    }
    console.log('');

    // Tasks
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === 'todo').length;
    const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
    const done = tasks.filter((t) => t.status === 'done').length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    console.log(chalk.bold('  Tasks') + `                          ${progressBar(pct)}  ${pct}%`);
    console.log(`    ${chalk.gray('[ ]')} Todo:         ${todo}`);
    console.log(`    ${chalk.blue('[~]')} In Progress:  ${inProgress}`);
    console.log(`    ${chalk.green('[x]')} Done:         ${done}`);
    console.log(`    ${chalk.dim('Total:')}        ${total}`);
    console.log('');

    // Upload scan data to server
    try {
      await apiRequest('PUT', `/api/cli/projects/${link.project_id}/scan`, {
        scan_data: scan,
      });
      console.log(dim('Synced to Orbit.'));
    } catch {
      console.log(dim('(Sync skipped)'));
    }
    console.log('');
  } catch (err: unknown) {
    spinner.stop();
    const message = err instanceof Error ? err.message : String(err);
    console.log(error(message));
    process.exit(1);
  }
}
