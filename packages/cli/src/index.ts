#!/usr/bin/env node

import { Command } from 'commander';
import { loginCommand } from './commands/login.js';
import { logoutCommand } from './commands/logout.js';
import { projectsCommand } from './commands/projects.js';
import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';
import { addCommand } from './commands/add.js';
import { doneCommand } from './commands/done.js';
import { startCommand } from './commands/start.js';
import { listCommand } from './commands/list.js';
import { scanCommand } from './commands/scan.js';
import type { ScanOptions } from './commands/scan.js';
import { watchCommand } from './commands/watch.js';
import type { WatchOptions } from './commands/watch.js';
import { mcpServeCommand } from './commands/mcp-serve.js';
import { OrbitError } from './lib/errors.js';
import type { TaskPriority, TaskStatus } from './types.js';

const program = new Command();

program
  .name('orbit')
  .description('Orbit — AI context engine for your codebase')
  .version('0.1.0');

// --- Auth ---

program
  .command('login')
  .description('Sign in to Orbit')
  .action(loginCommand);

program
  .command('logout')
  .description('Sign out and clear session')
  .action(logoutCommand);

// --- Projects ---

program
  .command('projects')
  .description('List your projects')
  .action(projectsCommand);

program
  .command('init')
  .description('Link this directory to an Orbit project')
  .action(initCommand);

// --- Tasks ---

program
  .command('status')
  .description('Show task summary for the linked project')
  .action(statusCommand);

program
  .command('add <title>')
  .description('Create a new task')
  .option('-p, --priority <priority>', 'Priority: low, medium, high', 'medium')
  .option('-d, --description <text>', 'Task description')
  .action((title: string, options: { priority?: TaskPriority; description?: string }) => {
    return addCommand(title, options);
  });

program
  .command('start <id-prefix>')
  .description('Start a task (set to in_progress, match by ID prefix, min 4 chars)')
  .action((idPrefix: string) => {
    return startCommand(idPrefix);
  });

program
  .command('done <id-prefix>')
  .description('Mark a task as done (match by ID prefix, min 4 chars)')
  .action((idPrefix: string) => {
    return doneCommand(idPrefix);
  });

program
  .command('list')
  .description('List tasks for the linked project')
  .option('-a, --all', 'Include completed tasks')
  .option('--status <status>', 'Filter by status: todo, in_progress, done')
  .action((options: { all?: boolean; status?: TaskStatus }) => {
    return listCommand(options);
  });

// --- Scan ---

program
  .command('scan')
  .description('Scan project and show overview')
  .option('-g, --generate-context', 'Generate AI context file from scan results')
  .option('-o, --output <file>', 'Output file for context (default: auto by target)')
  .option('-f, --format <format>', 'Output format: json, yaml, or markdown')
  .option('-t, --target <target>', 'Context target: claude, cursor, copilot, windsurf (default: claude)')
  .action((options: ScanOptions) => scanCommand(options));

// --- Watch ---

program
  .command('watch')
  .description('Watch for file changes and auto-regenerate context')
  .option('-o, --output <file>', 'Output file (default: auto by target)')
  .option('-t, --target <target>', 'Context target: claude, cursor, copilot, windsurf (default: claude)')
  .option('--debounce <ms>', 'Debounce interval in ms (default: 2000)')
  .action((options: WatchOptions) => watchCommand(options));

// --- MCP ---

program
  .command('mcp-serve')
  .description('Start MCP server for AI tool integration (stdio)')
  .action(() => mcpServeCommand());

// --- Error handling ---

program.hook('postAction', () => {
  // Ensure clean exit after commands
});

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (err: unknown) {
    if (err instanceof OrbitError) {
      const chalk = await import('chalk');
      console.error(chalk.default.red(`\n  Error: ${err.message}\n`));
      process.exit(1);
    }
    throw err;
  }
}

main();
