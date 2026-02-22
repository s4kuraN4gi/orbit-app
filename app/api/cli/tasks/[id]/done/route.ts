import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tasks, projects } from '@/lib/schema';
import { eq, like, desc } from 'drizzle-orm';
import { addDays, addWeeks, addMonths, addYears, nextDay, Day } from 'date-fns';
import { authenticateRequest } from '../../../auth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticateRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: idPrefix } = await params;

  if (idPrefix.length < 4) {
    return NextResponse.json(
      { error: 'Task ID prefix must be at least 4 characters' },
      { status: 400 }
    );
  }

  // Find tasks matching the prefix
  const matchingTasks = await db
    .select()
    .from(tasks)
    .where(like(tasks.id, `${idPrefix}%`));

  if (matchingTasks.length === 0) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (matchingTasks.length > 1) {
    return NextResponse.json(
      {
        error: 'Multiple tasks match this prefix',
        matching_ids: matchingTasks.map((t) => t.id),
      },
      { status: 409 }
    );
  }

  const task = matchingTasks[0];

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, task.projectId));

  if (!project || project.ownerId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Already done
  if (task.status === 'done') {
    return NextResponse.json({ task: formatTask(task) });
  }

  // Handle recurring tasks
  if (task.recurrenceType) {
    let nextStartDate: Date | null = null;
    let nextDueDate: Date | null = null;

    const baseDate = task.dueDate
      ? new Date(task.dueDate)
      : task.startDate
        ? new Date(task.startDate)
        : new Date();

    const interval = task.recurrenceInterval || 1;

    switch (task.recurrenceType) {
      case 'daily':
        nextDueDate = addDays(baseDate, interval);
        break;
      case 'weekly':
        if (task.recurrenceDays && task.recurrenceDays.length > 0) {
          const dayMap: Record<string, Day> = {
            su: 0, mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6,
          };
          const targetDays = task.recurrenceDays
            .map((d: string) => dayMap[d])
            .sort((a: number, b: number) => a - b);

          const currentDay = baseDate.getDay();
          const nextDayInWeek = targetDays.find((d: number) => d > currentDay);

          if (nextDayInWeek !== undefined) {
            nextDueDate = nextDay(baseDate, nextDayInWeek as Day);
          } else {
            const firstDay = targetDays[0];
            const nextFirstDay = nextDay(baseDate, firstDay as Day);
            nextDueDate = addWeeks(nextFirstDay, interval - 1);
          }
        } else {
          nextDueDate = addWeeks(baseDate, interval);
        }
        break;
      case 'monthly':
        nextDueDate = addMonths(baseDate, interval);
        break;
      case 'yearly':
        nextDueDate = addYears(baseDate, interval);
        break;
    }

    // Check end date
    if (
      nextDueDate &&
      task.recurrenceEndDate &&
      nextDueDate > new Date(task.recurrenceEndDate)
    ) {
      nextDueDate = null;
    }

    if (nextDueDate) {
      if (task.startDate && task.dueDate) {
        const duration =
          new Date(task.dueDate).getTime() -
          new Date(task.startDate).getTime();
        nextStartDate = new Date(nextDueDate.getTime() - duration);
      } else if (task.startDate && !task.dueDate) {
        nextStartDate = nextDueDate;
        nextDueDate = null;
      }

      // Calculate position for new recurring task
      const [maxPosData] = await db
        .select({ position: tasks.position })
        .from(tasks)
        .where(eq(tasks.projectId, task.projectId))
        .orderBy(desc(tasks.position))
        .limit(1);
      const newPosition = (maxPosData?.position || 0) + 65536;

      await db.insert(tasks).values({
        projectId: task.projectId,
        parentId: task.parentId,
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: 'todo',
        startDate: nextStartDate,
        dueDate: nextDueDate,
        position: newPosition,
        recurrenceType: task.recurrenceType,
        recurrenceInterval: task.recurrenceInterval,
        recurrenceDays: task.recurrenceDays,
        recurrenceEndDate: task.recurrenceEndDate,
      });

      // Mark current task as done and remove recurrence
      const [updated] = await db
        .update(tasks)
        .set({
          status: 'done',
          completedAt: new Date(),
          recurrenceType: null,
          recurrenceInterval: null,
          recurrenceDays: null,
          recurrenceEndDate: null,
        })
        .where(eq(tasks.id, task.id))
        .returning();

      return NextResponse.json({ task: formatTask(updated) });
    }
  }

  // Non-recurring or recurrence ended
  const [updated] = await db
    .update(tasks)
    .set({
      status: 'done',
      completedAt: new Date(),
    })
    .where(eq(tasks.id, task.id))
    .returning();

  return NextResponse.json({ task: formatTask(updated) });
}

function formatTask(t: any) {
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
