'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { tasks, aiContexts } from '@/lib/schema';
import { requireProjectOwner } from '@/lib/auth-helpers';
import { getSubscriptionPlan, getUsageCount, incrementUsage } from '@/lib/subscription';
import { getPlanLimits } from '@/lib/plan-client';

interface TaskInput {
  title: string;
  description?: string | null;
  status?: string;
  priority?: string;
  children?: TaskInput[];
}

interface BulkCreateInput {
  project_id: string;
  source_tool: 'Antigravity' | 'Cursor' | 'Manual';
  original_prompt: string;
  tasks: TaskInput[];
}

async function insertTasks(
  taskList: TaskInput[],
  projectId: string,
  aiContextId: string,
  parentId: string | null = null
): Promise<void> {
  for (const task of taskList) {
    const [insertedTask] = await db
      .insert(tasks)
      .values({
        projectId,
        parentId,
        aiContextId,
        title: task.title,
        description: task.description || null,
        status: task.status || 'todo',
        priority: task.priority || 'medium',
      })
      .returning({ id: tasks.id });

    if (!insertedTask) {
      throw new Error(`Failed to insert task: ${task.title}`);
    }

    if (task.children && task.children.length > 0) {
      await insertTasks(task.children, projectId, aiContextId, insertedTask.id);
    }
  }
}

export async function bulkCreateTasks(
  input: BulkCreateInput
): Promise<{ success: boolean; error?: string; ai_context_id?: string }> {
  if (!input.project_id || !input.tasks || !Array.isArray(input.tasks)) {
    return { success: false, error: 'Invalid input: project_id and tasks array are required' };
  }

  // Auth + Authorization: verify project ownership
  const { user } = await requireProjectOwner(input.project_id);

  // Usage limit check for Free plan
  const plan = await getSubscriptionPlan(user.id);
  const limits = getPlanLimits(plan);
  if (limits.maxImportsPerMonth !== Infinity) {
    const currentUsage = await getUsageCount(user.id, 'import_plan');
    if (currentUsage >= limits.maxImportsPerMonth) {
      return { success: false, error: `Free plan limit: ${limits.maxImportsPerMonth} imports per month` };
    }
  }

  try {
    // 1. Create AI Context
    const [aiContext] = await db
      .insert(aiContexts)
      .values({
        projectId: input.project_id,
        sourceTool: input.source_tool || 'Manual',
        originalPrompt: input.original_prompt || '',
        rawData: input,
      })
      .returning({ id: aiContexts.id });

    if (!aiContext) {
      return { success: false, error: 'Failed to create AI context' };
    }

    // 2. Insert Tasks Recursively
    await insertTasks(input.tasks, input.project_id, aiContext.id, null);

    // 3. Increment usage counter
    await incrementUsage(user.id, 'import_plan');

    revalidatePath('/dashboard');

    return { success: true, ai_context_id: aiContext.id };
  } catch (error: any) {
    console.error('Bulk create error:', error);
    return { success: false, error: 'Internal error' };
  }
}
