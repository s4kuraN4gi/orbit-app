/**
 * Project Context Generator
 * 
 * Generates project context in Markdown or JSON format
 * for use in AI prompts.
 */

import { Task } from '@/types';

export interface ContextOptions {
  projectName: string;
  includeCompleted: boolean;
  includeDescription: boolean;
  format: 'markdown' | 'json';
  maxDepth: number;
}

interface TaskStats {
  total: number;
  completed: number;
  inProgress: number;
  todo: number;
  highPriority: number;
  overdue: number;
}

/**
 * Calculate task statistics
 */
function calculateStats(tasks: Task[]): TaskStats {
  const stats: TaskStats = {
    total: 0,
    completed: 0,
    inProgress: 0,
    todo: 0,
    highPriority: 0,
    overdue: 0,
  };

  const now = new Date();

  const countTasks = (taskList: Task[]) => {
    for (const task of taskList) {
      stats.total++;
      
      if (task.status === 'done') stats.completed++;
      else if (task.status === 'in_progress') stats.inProgress++;
      else stats.todo++;
      
      if (task.priority === 'high') stats.highPriority++;
      
      if (task.due_date && new Date(task.due_date) < now && task.status !== 'done') {
        stats.overdue++;
      }

      if (task.children) {
        countTasks(task.children);
      }
    }
  };

  countTasks(tasks);
  return stats;
}

/**
 * Filter tasks based on options
 */
function filterTasks(tasks: Task[], options: ContextOptions): Task[] {
  return tasks
    .filter(task => options.includeCompleted || task.status !== 'done')
    .map(task => ({
      ...task,
      children: task.children ? filterTasks(task.children, options) : undefined,
    }));
}

/**
 * Generate Markdown format
 */
function generateMarkdown(tasks: Task[], options: ContextOptions): string {
  const stats = calculateStats(tasks);
  const filteredTasks = filterTasks(tasks, options);
  const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  let markdown = `# プロジェクト: ${options.projectName}\n\n`;
  
  // Progress summary
  markdown += `## 進捗状況\n`;
  markdown += `- **完了**: ${stats.completed}件 / **全体**: ${stats.total}件 (${progressPercent}%)\n`;
  markdown += `- **進行中**: ${stats.inProgress}件\n`;
  markdown += `- **未着手**: ${stats.todo}件\n`;
  if (stats.overdue > 0) {
    markdown += `- **期限超過**: ${stats.overdue}件 ⚠️\n`;
  }
  markdown += `\n`;

  // Group tasks by priority
  const highPriority = filteredTasks.filter(t => t.priority === 'high');
  const mediumPriority = filteredTasks.filter(t => t.priority === 'medium');
  const lowPriority = filteredTasks.filter(t => t.priority === 'low');

  markdown += `## タスク一覧\n\n`;

  const renderTask = (task: Task, depth: number): string => {
    if (depth > options.maxDepth) return '';
    
    const indent = '  '.repeat(depth);
    const checkbox = task.status === 'done' ? '[x]' : '[ ]';
    let line = `${indent}- ${checkbox} ${task.title}`;
    
    if (task.due_date) {
      const dueDate = new Date(task.due_date).toLocaleDateString('ja-JP');
      line += ` (期限: ${dueDate})`;
    }
    
    line += '\n';

    if (options.includeDescription && task.description) {
      line += `${indent}  > ${task.description.slice(0, 100)}${task.description.length > 100 ? '...' : ''}\n`;
    }

    if (task.children) {
      for (const child of task.children) {
        line += renderTask(child, depth + 1);
      }
    }

    return line;
  };

  if (highPriority.length > 0) {
    markdown += `### 🔴 高優先度\n`;
    for (const task of highPriority) {
      markdown += renderTask(task, 0);
    }
    markdown += '\n';
  }

  if (mediumPriority.length > 0) {
    markdown += `### 🟡 中優先度\n`;
    for (const task of mediumPriority) {
      markdown += renderTask(task, 0);
    }
    markdown += '\n';
  }

  if (lowPriority.length > 0) {
    markdown += `### 🟢 低優先度\n`;
    for (const task of lowPriority) {
      markdown += renderTask(task, 0);
    }
    markdown += '\n';
  }

  return markdown;
}

/**
 * Generate JSON format
 */
function generateJson(tasks: Task[], options: ContextOptions): string {
  const stats = calculateStats(tasks);
  const filteredTasks = filterTasks(tasks, options);

  const simplifyTask = (task: Task): any => ({
    title: task.title,
    status: task.status,
    priority: task.priority,
    ...(options.includeDescription && task.description ? { description: task.description } : {}),
    ...(task.due_date ? { due_date: task.due_date } : {}),
    ...(task.children && task.children.length > 0 ? { children: task.children.map(simplifyTask) } : {}),
  });

  const output = {
    project: options.projectName,
    stats: {
      total: stats.total,
      completed: stats.completed,
      in_progress: stats.inProgress,
      todo: stats.todo,
      progress_percent: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
    },
    tasks: filteredTasks.map(simplifyTask),
  };

  return JSON.stringify(output, null, 2);
}

/**
 * Main generator function
 */
export function generateProjectContext(tasks: Task[], options: ContextOptions): string {
  if (options.format === 'json') {
    return generateJson(tasks, options);
  }
  return generateMarkdown(tasks, options);
}
