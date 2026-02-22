#!/usr/bin/env node

import { Command } from 'commander';
import { loginCommand } from './commands/login.js';
import { logoutCommand } from './commands/logout.js';
import { projectsCommand } from './commands/projects.js';
import { initCommand } from './commands/init.js';
import { statusCommand } from './commands/status.js';
import { addCommand } from './commands/add.js';
import { doneCommand } from './commands/done.js';
import { listCommand } from './commands/list.js';
import { OrbitError } from './lib/errors.js';
import type { TaskPriority, TaskStatus } from './types.js';

const program = new Command();

program
  .name('orbit')
  .description('Orbit CLI — manage tasks from the terminal')
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
