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

function daysAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'today';
  if (diff === 1) return '1 day ago';
  return `${diff} days ago`;
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

    // Structure
    console.log(chalk.bold('  Structure'));
    if (scan.structure.pages.length > 0) {
      const pageList = scan.structure.pages.length > 8
        ? scan.structure.pages.slice(0, 8).join('  ') + `  +${scan.structure.pages.length - 8}`
        : scan.structure.pages.join('  ');
      console.log(`    ${chalk.dim('Pages:')}      ${pageList}`);
    }
    if (scan.structure.apiRoutes.length > 0) {
      const methods = [...new Set(scan.structure.apiRoutes.map(r => r.method))].join(', ');
      console.log(`    ${chalk.dim('API Routes:')} ${scan.structure.apiRoutes.length} endpoints (${methods})`);
    }
    if (scan.structure.dbTables.length > 0) {
      const tableNames = scan.structure.dbTables.length > 6
        ? scan.structure.dbTables.slice(0, 6).map(t => t.name).join(', ') + `, +${scan.structure.dbTables.length - 6}`
        : scan.structure.dbTables.map(t => t.name).join(', ');
      console.log(`    ${chalk.dim('DB Tables:')}  ${scan.structure.dbTables.length} tables (${tableNames})`);
    }
    console.log('');

    // Dependencies
    console.log(chalk.bold(`  Dependencies (${scan.depCount.total} packages)`));
    if (scan.dependencies.length > 0) {
      const catLabelWidth = Math.max(...scan.dependencies.map((d) => d.category.length));
      for (const { category, packages } of scan.dependencies) {
        const label = `${category}:`.padEnd(catLabelWidth + 1);
        const pkgList = packages.length > 5
          ? packages.slice(0, 5).join(', ') + `, +${packages.length - 5}`
          : packages.join(', ');
        console.log(`    ${chalk.dim(label)} ${pkgList}`);
      }
    }
    console.log('');

    // AI Context
    if (scan.aiContext.files.length > 0) {
      console.log(chalk.bold('  AI Context'));
      console.log(`    ${scan.aiContext.files.map(f => f.name).join('  ')} (${scan.aiContext.files.length} files)`);
      console.log('');
    }

    // Git
    if (scan.git) {
      console.log(chalk.bold('  Git'));
      console.log(`    ${chalk.dim('Branch:')}     ${scan.git.branch}`);
      if (scan.git.lastCommitDate) {
        const uncommitted = scan.git.uncommittedChanges > 0
          ? chalk.yellow(` (${scan.git.uncommittedChanges} uncommitted)`)
          : '';
        console.log(`    ${chalk.dim('Last commit:')} ${daysAgo(scan.git.lastCommitDate)}${uncommitted}`);
      }
      console.log(`    ${chalk.dim('Activity:')}   ${scan.git.totalCommits} total / ${scan.git.recentCommits} this week`);
      console.log('');
    }

    // Codebase
    console.log(chalk.bold('  Codebase'));
    console.log(`    ${scan.codeMetrics.totalFiles} files, ~${scan.codeMetrics.totalLines.toLocaleString()} lines`);
    if (scan.codeMetrics.largestFiles.length > 0) {
      const top = scan.codeMetrics.largestFiles.slice(0, 3)
        .map(f => `${f.path.split('/').pop()} (${f.lines})`)
        .join(', ');
      console.log(`    ${chalk.dim('Largest:')}  ${top}`);
    }
    console.log('');

    // Scripts
    const scriptNames = Object.keys(scan.scripts);
    if (scriptNames.length > 0) {
      console.log(chalk.bold('  Scripts'));
      console.log(`    ${scriptNames.join(', ')}`);
      console.log('');
    }

    // Deployment
    if (scan.deployment.platform || scan.deployment.ci) {
      console.log(chalk.bold('  Deployment'));
      if (scan.deployment.platform) console.log(`    ${chalk.dim('Platform:')} ${scan.deployment.platform}`);
      if (scan.deployment.ci) console.log(`    ${chalk.dim('CI:')}       ${scan.deployment.ci}`);
      console.log('');
    }

    // Environment Variables
    if (scan.envVars.length > 0) {
      console.log(chalk.bold(`  Environment (${scan.envVars.length} vars)`));
      const varList = scan.envVars.length > 6
        ? scan.envVars.slice(0, 6).join(', ') + `, +${scan.envVars.length - 6}`
        : scan.envVars.join(', ');
      console.log(`    ${varList}`);
      console.log('');
    }

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
