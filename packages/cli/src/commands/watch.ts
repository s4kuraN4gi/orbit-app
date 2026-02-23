import { writeFile, mkdir } from 'node:fs/promises';
import { join, basename, dirname, relative } from 'node:path';
import chalk from 'chalk';
import ora from 'ora';
import { watch as chokidarWatch } from 'chokidar';
import { scanProject, IGNORE_DIRS } from '../lib/detector.js';
import type { ScanResult } from '../lib/detector.js';
import { buildContextIR } from '../lib/context-ir.js';
import { renderContext, RENDER_TARGETS } from '../lib/renderers.js';
import type { RenderTarget } from '../lib/renderers.js';
import { ScanCache } from '../lib/cache.js';
import { computeRescanScope, incrementalScan } from '../lib/incremental.js';
import type { ChangeEvent } from '../lib/incremental.js';
import { apiRequest } from '../lib/api.js';
import { sessionExists } from '../lib/config.js';
import { getProjectLink } from '../lib/project.js';
import type { Task, OrbitProjectLink } from '../types.js';

export interface WatchOptions {
  output?: string;
  target?: RenderTarget;
  debounce?: string;
}

async function tryGetProjectLink(): Promise<OrbitProjectLink | null> {
  if (!sessionExists()) return null;
  try {
    return await getProjectLink();
  } catch {
    return null;
  }
}

async function fetchTasks(link: OrbitProjectLink | null): Promise<Task[]> {
  if (!link) return [];
  try {
    const data = await apiRequest('GET', `/api/cli/projects/${link.project_id}/tasks`);
    return data?.tasks ?? [];
  } catch {
    return [];
  }
}

export async function watchCommand(options: WatchOptions = {}): Promise<void> {
  const dir = process.cwd();
  const target: RenderTarget = options.target ?? 'claude';
  const outputFile = options.output ?? RENDER_TARGETS[target];
  const debounceMs = options.debounce ? parseInt(options.debounce, 10) : 2000;
  const cache = new ScanCache();

  const link = await tryGetProjectLink();
  const projectName = link?.project_name ?? basename(dir);

  // ── Initial full scan ──
  const spinner = ora('Running initial scan...').start();

  let currentScan: ScanResult;
  let lastContent = '';

  try {
    currentScan = await scanProject(dir);
    const tasks = await fetchTasks(link);
    const ir = buildContextIR(currentScan, tasks, projectName);
    lastContent = renderContext(ir, target);

    const outputPath = join(dir, outputFile);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, lastContent, 'utf-8');
    await cache.set(dir, currentScan, ir);

    spinner.succeed(chalk.green(`Initial scan complete. Generated ${outputFile}`));
  } catch (err: unknown) {
    spinner.fail('Initial scan failed');
    const message = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(message));
    process.exit(1);
  }

  // ── File watcher ──
  console.log('');
  console.log(chalk.cyan(`  Watching for changes... (target: ${target}, debounce: ${debounceMs}ms)`));
  console.log(chalk.dim('  Press Ctrl+C to stop'));
  console.log('');

  // Use function-based ignored to prevent chokidar from descending into
  // heavy directories (node_modules, .next, etc.) — avoids EMFILE errors.
  const ignored = (filePath: string): boolean => {
    const parts = filePath.split('/');
    return parts.some(part => IGNORE_DIRS.has(part));
  };

  const watcher = chokidarWatch('.', {
    cwd: dir,
    ignored,
    ignoreInitial: true,
    persistent: true,
    // Limit open file descriptors to avoid EMFILE on large repos
    depth: 10,
  });

  watcher.on('error', (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`  Watcher error: ${msg}`));
  });

  let pendingChanges: ChangeEvent[] = [];
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let processing = false;

  async function processChanges(): Promise<void> {
    if (processing || pendingChanges.length === 0) return;
    processing = true;

    const changes = [...pendingChanges];
    pendingChanges = [];

    try {
      const scope = computeRescanScope(changes);
      const anyScope = Object.values(scope).some(Boolean);

      if (!anyScope) {
        processing = false;
        return;
      }

      const scopeNames = Object.entries(scope)
        .filter(([, v]) => v)
        .map(([k]) => k);

      console.log(chalk.dim(`  [${new Date().toLocaleTimeString()}] ${changes.length} change(s) detected → rescan: ${scopeNames.join(', ')}`));

      currentScan = await incrementalScan(dir, currentScan, scope);
      const tasks = await fetchTasks(link);
      const ir = buildContextIR(currentScan, tasks, projectName);
      const newContent = renderContext(ir, target);

      if (newContent !== lastContent) {
        lastContent = newContent;
        const outputPath = join(dir, outputFile);
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, newContent, 'utf-8');
        await cache.set(dir, currentScan, ir);
        console.log(chalk.green(`  Updated ${outputFile}`));
      } else {
        console.log(chalk.dim('  No content change, skipping write'));
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(chalk.red(`  Rescan error: ${message}`));
    }

    processing = false;

    // Process any changes that arrived during processing
    if (pendingChanges.length > 0) {
      debounceTimer = setTimeout(processChanges, debounceMs);
    }
  }

  function onFileChange(eventType: 'add' | 'change' | 'unlink', filePath: string): void {
    pendingChanges.push({ path: filePath, type: eventType });

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(processChanges, debounceMs);
  }

  watcher.on('add', (path) => onFileChange('add', path));
  watcher.on('change', (path) => onFileChange('change', path));
  watcher.on('unlink', (path) => onFileChange('unlink', path));

  // ── Graceful shutdown ──
  const shutdown = async () => {
    console.log('');
    console.log(chalk.dim('  Stopping watcher...'));
    if (debounceTimer) clearTimeout(debounceTimer);
    await watcher.close();
    console.log(chalk.dim('  Done.'));
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
