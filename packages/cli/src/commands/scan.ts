import { writeFile, mkdir } from 'node:fs/promises';
import { join, basename, dirname } from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { apiRequest } from '../lib/api.js';
import { sessionExists, isLoggedIn } from '../lib/config.js';
import { getProjectLink } from '../lib/project.js';
import { scanProject } from '../lib/detector.js';
import { buildContextIR } from '../lib/context-ir.js';
import { renderContext, renderCursorMdc, RENDER_TARGETS } from '../lib/renderers.js';
import type { RenderTarget } from '../lib/renderers.js';
import { formatScanResult } from '../lib/formatters.js';
import type { OutputFormat } from '../lib/formatters.js';
import { error, dim, heading } from '../lib/display.js';
import { checkFeatureAccess, recordFeatureUsage } from '../lib/plan-check.js';
import type { Task, OrbitProjectLink } from '../types.js';

export interface ScanOptions {
  generateContext?: boolean;
  output?: string;
  format?: OutputFormat;
  target?: RenderTarget;
  focus?: boolean;
  issues?: boolean;
  smart?: boolean;
  quiet?: boolean;
  verbose?: boolean;
}

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

/**
 * Try to resolve auth + project link.
 * Returns null if not authenticated or no .orbit.json found.
 */
async function tryGetProjectLink(): Promise<OrbitProjectLink | null> {
  if (!sessionExists()) return null;
  try {
    return await getProjectLink();
  } catch {
    return null;
  }
}

export async function scanCommand(options: ScanOptions = {}): Promise<void> {
  const link = await tryGetProjectLink();
  const scanStart = performance.now();

  const spinner = ora('Scanning project...').start();

  try {
    // Always run local scan; fetch tasks only when authenticated + linked
    const scanPromise = scanProject(process.cwd());
    const taskPromise = link
      ? apiRequest<{ tasks: Task[] }>('GET', `/api/cli/projects/${link.project_id}/tasks`).catch(() => null)
      : Promise.resolve(null);

    const [scan, taskData] = await Promise.all([scanPromise, taskPromise]);
    spinner.stop();

    const tasks: Task[] = taskData?.tasks ?? [];
    const projectName = link?.project_name ?? basename(process.cwd());

    if (!options.quiet) {
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
      if (scan.exports.length > 0) {
        const components = scan.exports.filter(e => e.kind === 'component').length;
        const functions = scan.exports.filter(e => e.kind === 'function').length;
        const types = scan.exports.filter(e => e.kind === 'type').length;
        console.log(`    ${chalk.dim('Exports:')}  ${scan.exports.length} (${components} components, ${functions} functions, ${types} types)`);
      }
      if (scan.importGraph.length > 0) {
        const totalImports = scan.importGraph.reduce((sum, f) => sum + f.imports.length, 0);
        console.log(`    ${chalk.dim('Imports:')}  ${totalImports} local imports across ${scan.importGraph.length} files`);
      }
      console.log('');

      // Verbose: Full exports list
      if (options.verbose && scan.exports.length > 0) {
        console.log(chalk.bold('  Exports (detailed)'));
        for (const exp of scan.exports) {
          console.log(`    ${chalk.dim(exp.kind.padEnd(10))} ${exp.name}  ${chalk.dim(exp.file)}`);
        }
        console.log('');
      }

      // Verbose: All import graph edges
      if (options.verbose && scan.importGraph.length > 0) {
        console.log(chalk.bold('  Import Graph (all edges)'));
        for (const file of scan.importGraph) {
          if (file.imports.length > 0) {
            console.log(`    ${chalk.cyan(file.file)}`);
            for (const imp of file.imports) {
              console.log(`      ${chalk.dim('->')} ${imp}`);
            }
          }
        }
        console.log('');
      }

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
        if (options.verbose) {
          console.log(chalk.bold(`  Environment (${scan.envVars.length} vars)`));
          console.log(`    ${scan.envVars.join(', ')}`);
        } else {
          console.log(chalk.bold(`  Environment (${scan.envVars.length} vars)`));
          const varList = scan.envVars.length > 6
            ? scan.envVars.slice(0, 6).join(', ') + `, +${scan.envVars.length - 6}`
            : scan.envVars.join(', ');
          console.log(`    ${varList}`);
        }
        console.log('');
      }

      // Tasks (only shown when connected)
      if (tasks.length > 0) {
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
      } else if (!link) {
        console.log(dim('  Run `orbit login` + `orbit init` to include task context.'));
        console.log('');
      }
    }

    // Format output (--format json|yaml|markdown)
    if (options.format) {
      const formatted = formatScanResult(scan, options.format);
      console.log(formatted);
    }

    // Generate context file
    if (options.generateContext) {
      const target: RenderTarget = options.target ?? 'claude';
      const outputFile = options.output ?? RENDER_TARGETS[target];
      const ir = buildContextIR(scan, tasks, projectName);
      if (options.issues) {
        const access = await checkFeatureAccess('cliIssues');
        if (!access.allowed) {
          console.error(access.message);
          process.exit(1);
        }
        const { fetchExternalIssues } = await import('../lib/issue-providers/index.js');
        ir.activeWork.externalIssues = await fetchExternalIssues(process.cwd());
        await recordFeatureUsage('cliIssues');
      }
      if (options.focus) {
        const access = await checkFeatureAccess('cliFocus');
        if (!access.allowed) {
          console.error(access.message);
          process.exit(1);
        }
        const { resolveTaskFocus } = await import('../lib/task-focus.js');
        ir.focusAreas = resolveTaskFocus(tasks, ir);
        await recordFeatureUsage('cliFocus');
      }
      if (options.smart) {
        const access = await checkFeatureAccess('cliSmart');
        if (!access.allowed) {
          console.error(access.message);
          process.exit(1);
        }
        const { analyzeWorkContext } = await import('../lib/smart-context.js');
        ir.smartRecommendation = analyzeWorkContext(ir, process.cwd());
        await recordFeatureUsage('cliSmart');
      }
      if (target === 'cursor-mdc') {
        const mdcFiles = renderCursorMdc(ir);
        const mdcDir = join(process.cwd(), '.cursor', 'rules');
        await mkdir(mdcDir, { recursive: true });
        for (const [filename, content] of mdcFiles) {
          await writeFile(join(mdcDir, filename), content, 'utf-8');
        }
        console.log(chalk.green(`  Generated: .cursor/rules/ (${mdcFiles.size} files)`));
      } else {
        const content = renderContext(ir, target);
        const outputPath = join(process.cwd(), outputFile);
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, content, 'utf-8');
        console.log(chalk.green(`  Generated: ${outputFile}`));
      }

      // "What's next?" guide for first-time users
      if (!options.quiet && !await isLoggedIn()) {
        console.log('');
        console.log(heading("What's next?"));
        console.log(dim('  1. Open the generated file in your AI assistant'));
        console.log(dim('  2. Connect to dashboard:  orbit login'));
        console.log(dim('  3. Add tasks:             orbit add "My first task"'));
        console.log(dim('  4. Watch for changes:     orbit watch'));
        console.log(dim('  5. Smart context (Pro):   orbit scan -g --smart'));
        console.log('');
      }

      console.log('');
    }

    // Upload scan data to server (only when connected)
    if (link) {
      try {
        await apiRequest('PUT', `/api/cli/projects/${link.project_id}/scan`, {
          scan_data: scan,
        });
        if (!options.quiet) {
          console.log(dim('  Synced to Orbit.'));
        }
      } catch {
        if (!options.quiet) {
          console.log(dim('  (Sync skipped)'));
        }
      }
      if (!options.quiet) {
        console.log('');
      }
    }
    const scanDuration = ((performance.now() - scanStart) / 1000).toFixed(1);
    console.log(chalk.dim(`  Scan completed in ${scanDuration}s`));
    console.log('');
  } catch (err: unknown) {
    spinner.stop();
    const message = err instanceof Error ? err.message : String(err);
    console.log(error(message));
    process.exit(1);
  }
}
