import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, tasks, aiContexts } from '@/lib/schema';
import { eq, desc, asc } from 'drizzle-orm';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { Task } from '@/types';
import { getUserSettings } from '@/app/actions/settings';

// Utility to build tree from flat list
function buildTaskTree(taskList: Task[]): Task[] {
  const taskMap = new Map<string, Task & { children: Task[] }>();

  taskList.forEach((task) => {
    taskMap.set(task.id, { ...task, children: [] });
  });

  const roots: Task[] = [];

  taskList.forEach((task) => {
    const node = taskMap.get(task.id);
    if (!node) return;

    if (task.parent_id && taskMap.has(task.parent_id)) {
      const parent = taskMap.get(task.parent_id);
      parent?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  searchParams: Promise<{ projectId?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const params = await searchParams;

  if (!session) {
    redirect('/login');
  }

  const user = session.user;

  // Fetch user settings for default view
  const userSettings = await getUserSettings();

  // Fetch All Projects for the user
  const allProjects = await db
    .select({ id: projects.id, name: projects.name, key: projects.key })
    .from(projects)
    .where(eq(projects.ownerId, user.id))
    .orderBy(desc(projects.createdAt));

  // Determine current project
  let currentProject = null;

  if (params.projectId) {
    currentProject = allProjects.find((p) => p.id === params.projectId) || null;
  }

  if (!currentProject && allProjects.length > 0) {
    currentProject = allProjects[0];
  }

  // No projects at all - show empty state
  if (!currentProject) {
    return (
      <main className="container mx-auto py-6">
        <DashboardView
          initialTasks={[]}
          projectName="プロジェクトなし"
          projectId=""
          allProjects={[]}
        />
      </main>
    );
  }

  // Fetch Tasks for the current Project with ai_context join
  const tasksData = await db
    .select({
      task: tasks,
      aiContext: aiContexts,
    })
    .from(tasks)
    .leftJoin(aiContexts, eq(tasks.aiContextId, aiContexts.id))
    .where(eq(tasks.projectId, currentProject.id))
    .orderBy(asc(tasks.createdAt));

  // Transform to Task type
  const taskList: Task[] = tasksData.map((row) => ({
    id: row.task.id,
    project_id: row.task.projectId,
    parent_id: row.task.parentId,
    ai_context_id: row.task.aiContextId,
    title: row.task.title,
    description: row.task.description ?? '',
    status: row.task.status as Task['status'],
    priority: row.task.priority as Task['priority'],
    start_date: row.task.startDate?.toISOString() ?? null,
    due_date: row.task.dueDate?.toISOString() ?? null,
    created_at: row.task.createdAt?.toISOString() ?? '',
    position: row.task.position ?? undefined,
    completed_at: row.task.completedAt?.toISOString() ?? null,
    recurrence_type: row.task.recurrenceType as Task['recurrence_type'],
    recurrence_interval: row.task.recurrenceInterval ?? undefined,
    recurrence_days: row.task.recurrenceDays ?? undefined,
    recurrence_end_date: row.task.recurrenceEndDate?.toISOString(),
    board_order: row.task.boardOrder ?? undefined,
    ai_context: row.aiContext
      ? {
          id: row.aiContext.id,
          source_tool: row.aiContext.sourceTool as 'Cursor' | 'Antigravity' | 'Manual',
          original_prompt: row.aiContext.originalPrompt ?? '',
          created_at: row.aiContext.createdAt ?? new Date(),
        }
      : undefined,
  }));

  const taskTree = buildTaskTree(taskList);

  return (
    <main className="container mx-auto py-6">
      <DashboardView
        initialTasks={taskTree}
        projectName={currentProject.name}
        projectId={currentProject.id}
        allProjects={allProjects}
        defaultView={userSettings?.default_view || 'list'}
        currentUserEmail={user.email || ''}
      />
    </main>
  );
}
