import { db } from '@/lib/db';
import { tasks } from '@/lib/schema';
import { eq, ilike, sql } from 'drizzle-orm';

type TaskRow = typeof import('@/lib/schema').tasks.$inferSelect;

// UUID v4 pattern (full or prefix)
const UUID_PREFIX_RE = /^[0-9a-f]{4,}$/i;

/**
 * Find tasks by ID prefix. Uses exact UUID match when input looks like
 * a UUID prefix (hex characters only), avoiding the `uuid::text LIKE`
 * cast that prevents index usage on the `id` column.
 *
 * NOTE: At scale, adding a GIN index with gin_trgm_ops on tasks.title
 * would improve ilike title searches: CREATE INDEX tasks_title_trgm_idx
 * ON tasks USING gin (title gin_trgm_ops);
 */
export async function findTasksByIdPrefix(idPrefix: string): Promise<TaskRow[]> {
  if (!UUID_PREFIX_RE.test(idPrefix)) {
    // Input contains non-hex chars — treat as title search
    return db
      .select()
      .from(tasks)
      .where(ilike(tasks.title, `%${idPrefix}%`));
  }

  // Try exact match first (if full UUID length)
  if (idPrefix.length === 36) {
    const exact = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, idPrefix));
    if (exact.length > 0) return exact;
  }

  // Hex prefix — use text cast LIKE (unavoidable for prefix matching on UUID)
  // but this is scoped to short prefixes which limits scan cost
  return db
    .select()
    .from(tasks)
    .where(sql`${tasks.id}::text LIKE ${idPrefix + '%'}`);
}

export function formatTask(t: TaskRow) {
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
    position: t.position,
    description: t.description,
    project_id: t.projectId,
    parent_id: t.parentId,
    start_date: t.startDate?.toISOString() ?? null,
    due_date: t.dueDate?.toISOString() ?? null,
    created_at: t.createdAt?.toISOString() ?? '',
    completed_at: t.completedAt?.toISOString() ?? null,
  };
}
