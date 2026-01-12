
import React from 'react';
import { createClient } from '@/lib/supabase';
// Ensure we're not using the browser client directly in Server Components if we needed Auth, 
// but here we are using the simple client which uses env vars.
// Note: In Server Components we might want to use `createClient` from `@supabase/ssr` / `utils/supabase/server` usually,
// but for this MVP without Auth cookie handling yet, the simple client is fine for reading public/anon accessible data 
// (assuming RLS allows it or we are just testing). 
// *Correction*: To work properly in Server Component Next.js 14, we should ensure no caching or correct revalidation.

import { DashboardView } from '@/components/dashboard/DashboardView';
import { Task } from '@/types';

// Utility to build tree from flat list
function buildTaskTree(tasks: Task[]): Task[] {
  const taskMap = new Map<string, Task & { children: Task[] }>();
  
  // 1. Initialize map and add children array
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [] });
  });

  const roots: Task[] = [];

  // 2. Build Hierarchy
  tasks.forEach(task => {
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

export const dynamic = 'force-dynamic'; // Ensure we fetch fresh data

export default async function DashboardPage() {
  const supabase = createClient();

  // 1. Fetch First Project (Temporary logic for MVP)
  // In real app, we would get project ID from params or user preference
  const { data: projects, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .limit(1);

  if (projectError || !projects || projects.length === 0) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold">No Projects Found</h2>
        <p className="text-muted-foreground">Please create a project or use the API to create one.</p>
        {projectError && <p className="text-red-500 mt-2">{projectError.message}</p>}
      </div>
    );
  }

  const project = projects[0];

  // 2. Fetch Tasks for the Project
  const { data: tasksData, error: taskError } = await supabase
    .from('tasks')
    .select('*, ai_context:ai_contexts(*)')
    .eq('project_id', project.id)
    .order('created_at', { ascending: true });

  if (taskError) {
    return <div className="p-10 text-red-500">Error loading tasks: {taskError.message}</div>;
  }

  // 3. Transform to Tree
  // Cast Supabase response to Task type.
  // Note: Supabase types might not match 100% with our Task interface (date strings etc), 
  // but usually they are compatible enough for this demo.
  const tasks = (tasksData as unknown as Task[]) || [];
  const taskTree = buildTaskTree(tasks);

  return (
    <main className="container mx-auto py-6">
      <DashboardView initialTasks={taskTree} projectName={project.name} />
    </main>
  );
}
