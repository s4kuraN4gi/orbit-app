import chalk from 'chalk';
import type { Task, TaskStatus, TaskPriority, Project } from '../types.js';

const STATUS_ICON: Record<TaskStatus, string> = {
  todo: chalk.gray('[ ]'),
  in_progress: chalk.blue('[~]'),
  done: chalk.green('[x]'),
};

const PRIORITY_LABEL: Record<TaskPriority, string> = {
  high: chalk.red('HIGH'),
  medium: chalk.yellow('MED'),
  low: chalk.gray('LOW'),
};

export function formatTask(task: Task, index?: number): string {
  const id = chalk.dim(task.id.slice(0, 6));
  const icon = STATUS_ICON[task.status];
  const priority = PRIORITY_LABEL[task.priority];
  const title = task.status === 'done' ? chalk.strikethrough(task.title) : task.title;
  const due = task.due_date ? chalk.dim(` due:${task.due_date.slice(0, 10)}`) : '';

  return `${icon} ${id}  ${priority}  ${title}${due}`;
}

export function formatTaskList(tasks: Task[]): string {
  if (tasks.length === 0) {
    return chalk.dim('  No tasks found.');
  }
  return tasks.map((t) => formatTask(t)).join('\n');
}

export function formatProject(project: Project, linked = false): string {
  const key = chalk.cyan(`[${project.key}]`);
  const name = project.name;
  const tag = linked ? chalk.green(' (linked)') : '';
  const id = chalk.dim(project.id.slice(0, 8));
  return `  ${key} ${name}${tag}  ${id}`;
}

export function formatStatusSummary(tasks: Task[]): string {
  const total = tasks.length;
  const todo = tasks.filter((t) => t.status === 'todo').length;
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length;
  const done = tasks.filter((t) => t.status === 'done').length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const bar = progressBar(pct);

  return [
    `${bar}  ${pct}% complete`,
    '',
    `  ${chalk.gray('[ ]')} Todo:         ${todo}`,
    `  ${chalk.blue('[~]')} In Progress:  ${inProgress}`,
    `  ${chalk.green('[x]')} Done:         ${done}`,
    `  ${chalk.dim('---')}`,
    `  Total:        ${total}`,
  ].join('\n');
}

function progressBar(pct: number, width = 20): string {
  const filled = Math.round((pct / 100) * width);
  const empty = width - filled;
  return chalk.green('\u2588'.repeat(filled)) + chalk.gray('\u2591'.repeat(empty));
}

export function heading(text: string): string {
  return chalk.bold.cyan(`\n  ${text}\n`);
}

export function success(text: string): string {
  return chalk.green(`  ${text}`);
}

export function error(text: string): string {
  return chalk.red(`  ${text}`);
}

export function dim(text: string): string {
  return chalk.dim(`  ${text}`);
}
