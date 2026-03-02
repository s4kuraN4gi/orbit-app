type TaskRow = typeof import('@/lib/schema').tasks.$inferSelect;

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
