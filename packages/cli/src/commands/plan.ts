import { writeFileSync } from 'node:fs';
import { basename } from 'node:path';
import ora from 'ora';
import chalk from 'chalk';
import { apiRequest } from '../lib/api.js';
import { loadSession } from '../lib/config.js';
import { getProjectLink } from '../lib/project.js';
import { scanProject } from '../lib/detector.js';
import { buildContextIR } from '../lib/context-ir.js';
import { resolveTaskFocus } from '../lib/task-focus.js';
import { generatePlan } from '../lib/plan-generator.js';
import { checkFeatureAccess, recordFeatureUsage } from '../lib/plan-check.js';
import { error } from '../lib/display.js';
import type { Task } from '../types.js';

export interface PlanOptions {
  output?: string;
  format?: 'markdown' | 'json';
}

export async function planCommand(taskIdPrefix: string, options: PlanOptions = {}): Promise<void> {
  // 1. Require auth
  try {
    await loadSession();
  } catch {
    console.log(error('Not logged in. Run `orbit login` first.'));
    process.exit(1);
  }

  // 2. Require project link
  let link;
  try {
    link = await getProjectLink();
  } catch {
    console.log(error('No project linked. Run `orbit init` first.'));
    process.exit(1);
  }

  // 3. Pro gate check
  const access = await checkFeatureAccess('cliPlan');
  if (!access.allowed) {
    console.error(access.message);
    process.exit(1);
  }

  const spinner = ora('Generating implementation plan...').start();

  try {
    // 4. Fetch task details
    const taskData = await apiRequest<{ task: Task }>('GET', `/api/cli/tasks/${taskIdPrefix}`);
    const task: Task = taskData.task;

    // 5. Scan project
    const scan = await scanProject(process.cwd());

    // 6. Fetch all tasks + build ContextIR
    const tasksData = await apiRequest<{ tasks: Task[] }>('GET', `/api/cli/projects/${link.project_id}/tasks`);
    const tasks: Task[] = tasksData?.tasks ?? [];
    const projectName = link.project_name ?? basename(process.cwd());
    const ir = buildContextIR(scan, tasks, projectName);

    // 7. Resolve focus areas for this task
    const focusAreas = resolveTaskFocus([{ ...task, status: 'in_progress' }], ir);

    // 8. Generate plan
    const plan = generatePlan(task, ir, focusAreas);

    spinner.stop();

    // 9. Output
    if (options.format === 'json') {
      const jsonPlan = {
        task: { id: task.id, title: task.title, priority: task.priority, status: task.status },
        focusAreas,
        project: { name: ir.project.name, techStack: ir.project.techStack },
        plan,
      };
      if (options.output) {
        writeFileSync(options.output, JSON.stringify(jsonPlan, null, 2));
        console.log(chalk.green(`  Plan written to ${options.output}`));
      } else {
        console.log(JSON.stringify(jsonPlan, null, 2));
      }
    } else {
      if (options.output) {
        writeFileSync(options.output, plan);
        console.log(chalk.green(`  Plan written to ${options.output}`));
      } else {
        console.log('');
        console.log(plan);
      }
    }

    await recordFeatureUsage('cliPlan');
  } catch (err: unknown) {
    spinner.stop();
    const message = err instanceof Error ? err.message : String(err);
    console.log(error(message));
    process.exit(1);
  }
}
