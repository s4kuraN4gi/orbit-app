import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { projects, tasks, aiContexts, member, organization } from '@/lib/schema';
import { eq, desc, asc, or, inArray } from 'drizzle-orm';
import { DashboardView } from '@/components/dashboard/DashboardView';
import { Task } from '@/types';
import { getUserSettings } from '@/app/actions/settings';
import { getUserPlan } from '@/lib/plan';

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
  searchParams: Promise<{ projectId?: string; checkout?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const headersList = await headers();
  const session = await auth.api.getSession({ headers: headersList });
  const params = await searchParams;

  if (!session) {
    redirect('/login');
  }

  const user = session.user;

  // Fetch user settings and plan
  const [userSettings, planLimits] = await Promise.all([
    getUserSettings(),
    getUserPlan(),
  ]);

  // Get org IDs user belongs to
  const memberships = await db
    .select({ organizationId: member.organizationId })
    .from(member)
    .where(eq(member.userId, user.id));

  const orgIds = memberships.map((m) => m.organizationId);

  // Fetch org names for CreateProjectModal
  let userOrgs: { id: string; name: string }[] = [];
  if (orgIds.length > 0) {
    userOrgs = await db
      .select({ id: organization.id, name: organization.name })
      .from(organization)
      .where(inArray(organization.id, orgIds));
  }

  // Fetch personal + team projects
  const projectConditions = [eq(projects.ownerId, user.id)];
  if (orgIds.length > 0) {
    projectConditions.push(inArray(projects.organizationId, orgIds));
  }

  const allProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      key: projects.key,
      scanData: projects.scanData,
      organizationId: projects.organizationId,
    })
    .from(projects)
    .where(or(...projectConditions))
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
          planTier={planLimits.tier}
          organizations={userOrgs}
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
        defaultView="overview"
        currentUserEmail={user.email || ''}
        scanData={currentProject.scanData as Record<string, unknown> | null}
        planTier={planLimits.tier}
        currentProjectCount={allProjects.length}
        checkoutSuccess={params.checkout === 'success'}
        organizations={userOrgs}
      />
    </main>
  );
}
