
'use client';

import React from 'react';
import { Task } from '@/types';
import { Gantt, Task as GanttTask, EventOption, StylingOption, ViewMode, DisplayOption } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { updateTaskDates } from '@/app/actions/task';
import { toast } from 'sonner';

interface GanttChartProps {
  tasks: Task[];
}

export function GanttChart({ tasks }: GanttChartProps) {
  // Transform Orbit Tasks to Gantt Tasks
  const ganttTasks: GanttTask[] = React.useMemo(() => {
    if (tasks.length === 0) return [];

    const now = new Date();
    
    // Flatten the tree if tasks come as a tree (which they do from initialTasks).
    // Our initialTasks in DashboardView are a tree.
    // We need to flatten them for the Gantt library, but we can keep hierarchy if supported.
    // gantt-task-react supports project/task types but simple list is easier first.
    // Let's perform a flattening.
    
    const flattened: Task[] = [];
    const traverse = (nodes: Task[]) => {
        nodes.forEach(node => {
            flattened.push(node);
            if (node.children) traverse(node.children);
        });
    };
    traverse(tasks);

    return flattened.map(t => {
      const startDate = t.start_date ? new Date(t.start_date) : now;
      const endDate = t.due_date ? new Date(t.due_date) : new Date(now.getTime() + 24 * 60 * 60 * 1000); // +1 day fallback

      // Ensure end > start
      const safeEndDate = endDate > startDate ? endDate : new Date(startDate.getTime() + 60 * 60 * 1000);

      return {
        start: startDate,
        end: safeEndDate,
        name: t.title,
        id: t.id,
        type: 'task', // or 'project' if it has children, maybe later
        progress: t.status === 'done' ? 100 : (t.status === 'in_progress' ? 50 : 0),
        isDisabled: false,
        styles: { 
            progressColor: t.status === 'done' ? '#10b981' : '#3b82f6', 
            progressSelectedColor: '#2563eb' 
        },
      };
    });
  }, [tasks]);

  const handleDateChange = async (task: GanttTask) => {
    try {
        await updateTaskDates(task.id, task.start, task.end);
        toast.success("Date updated");
    } catch (e) {
        toast.error("Failed to update date");
    }
  };

  if (ganttTasks.length === 0) {
      return <div className="p-8 text-center text-slate-500">No tasks to display in Gantt chart.</div>;
  }

  return (
    <div className="overflow-x-auto h-full border rounded-md">
       <Gantt
        tasks={ganttTasks}
        viewMode={ViewMode.Day}
        onDateChange={handleDateChange}
        listCellWidth="155px"
        columnWidth={60}
      />
    </div>
  );
}
