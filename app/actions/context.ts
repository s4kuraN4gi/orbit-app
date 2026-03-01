'use server';

import { db } from '@/lib/db';
import { aiContexts, tasks, scanSnapshots } from '@/lib/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requireProjectOwner } from '@/lib/auth-helpers';
import type { ScanData } from '@/types';

export async function getContextHistory(projectId: string, limit = 20) {
  await requireProjectOwner(projectId);

  const contexts = await db
    .select({
      id: aiContexts.id,
      sourceTool: aiContexts.sourceTool,
      originalPrompt: aiContexts.originalPrompt,
      createdAt: aiContexts.createdAt,
      taskCount: sql<number>`(
        SELECT COUNT(*) FROM tasks
        WHERE tasks.ai_context_id = ${aiContexts.id}
      )`.as('task_count'),
    })
    .from(aiContexts)
    .where(eq(aiContexts.projectId, projectId))
    .orderBy(desc(aiContexts.createdAt))
    .limit(limit);

  return contexts.map((c) => ({
    id: c.id,
    source_tool: c.sourceTool,
    original_prompt: c.originalPrompt ?? '',
    created_at: c.createdAt?.toISOString() ?? '',
    task_count: Number(c.taskCount) || 0,
  }));
}

export async function getScanSnapshots(projectId: string, limit = 50) {
  await requireProjectOwner(projectId);

  const snapshots = await db
    .select({
      id: scanSnapshots.id,
      scanData: scanSnapshots.scanData,
      createdAt: scanSnapshots.createdAt,
    })
    .from(scanSnapshots)
    .where(eq(scanSnapshots.projectId, projectId))
    .orderBy(desc(scanSnapshots.createdAt))
    .limit(limit);

  return snapshots.map((s) => ({
    id: s.id,
    project_id: projectId,
    scan_data: s.scanData as ScanData,
    created_at: s.createdAt?.toISOString() ?? '',
  }));
}
