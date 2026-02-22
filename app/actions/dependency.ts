'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { taskDependencies } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export type Dependency = {
  id: string;
  project_id: string;
  predecessor_id: string;
  successor_id: string;
  dependency_type: string | null;
  created_at: string;
};

export async function addDependency(projectId: string, predecessorId: string, successorId: string) {
  if (predecessorId === successorId) {
    throw new Error('Task cannot depend on itself');
  }

  try {
    const [data] = await db
      .insert(taskDependencies)
      .values({
        projectId,
        predecessorId,
        successorId,
      })
      .returning();

    revalidatePath('/dashboard');
    return {
      ...data,
      project_id: data.projectId,
      predecessor_id: data.predecessorId,
      successor_id: data.successorId,
      dependency_type: data.dependencyType,
      created_at: data.createdAt?.toISOString() ?? '',
    };
  } catch (error: any) {
    if (error.message?.includes('unique') || error.code === '23505') {
      throw new Error('Dependency already exists');
    }
    console.error('Failed to add dependency:', error);
    throw new Error('Failed to add dependency');
  }
}

export async function removeDependency(dependencyId: string) {
  await db.delete(taskDependencies).where(eq(taskDependencies.id, dependencyId));
  revalidatePath('/dashboard');
}

export async function getDependencies(projectId: string): Promise<Dependency[]> {
  const data = await db
    .select()
    .from(taskDependencies)
    .where(eq(taskDependencies.projectId, projectId));

  return data.map((d) => ({
    id: d.id,
    project_id: d.projectId,
    predecessor_id: d.predecessorId,
    successor_id: d.successorId,
    dependency_type: d.dependencyType,
    created_at: d.createdAt?.toISOString() ?? '',
  }));
}
