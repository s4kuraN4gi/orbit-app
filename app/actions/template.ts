'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { taskTemplates } from '@/lib/schema';
import { eq, desc } from 'drizzle-orm';

export async function createTemplate(projectId: string, data: { name: string; title: string; description?: string; priority?: string }) {
  try {
    await db.insert(taskTemplates).values({
      projectId,
      name: data.name,
      title: data.title,
      description: data.description || '',
      priority: data.priority || 'medium',
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to create template:', error);
    return { success: false, error: 'Failed to create template' };
  }
}

export async function getTemplates(projectId: string) {
  try {
    const rows = await db
      .select()
      .from(taskTemplates)
      .where(eq(taskTemplates.projectId, projectId))
      .orderBy(desc(taskTemplates.createdAt));

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      title: r.title,
      description: r.description ?? '',
      priority: r.priority ?? 'medium',
      created_at: r.createdAt?.toISOString() ?? '',
    }));

    return { success: true, data };
  } catch (error) {
    console.error('Failed to get templates:', error);
    return { success: false, error: 'Failed to get templates' };
  }
}

export async function deleteTemplate(templateId: string) {
  try {
    await db.delete(taskTemplates).where(eq(taskTemplates.id, templateId));

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete template:', error);
    return { success: false, error: 'Failed to delete template' };
  }
}
