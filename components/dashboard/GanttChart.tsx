
'use client';

import { useTranslations } from 'next-intl';

import React from 'react';
import { Task } from '@/types';
import { Gantt, Task as GanttTask, EventOption, StylingOption, ViewMode, DisplayOption } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { updateTaskDates } from '@/app/actions/task';
import { toast } from 'sonner';
import { getDependencies } from '@/app/actions/dependency';
import { TaskDependency } from '@/types';
import { differenceInDays, subMonths } from 'date-fns';

interface GanttChartProps {
  tasks: Task[];
}

export function GanttChart({ tasks }: GanttChartProps) {
  const t = useTranslations('dashboard.gantt');
  const [dependencies, setDependencies] = React.useState<TaskDependency[]>([]);


  React.useEffect(() => {
    if (tasks.length > 0) {
      const projectId = tasks[0].project_id;
      getDependencies(projectId).then(setDependencies).catch(console.error);
    }
  }, [tasks]);

  // Transform Orbit Tasks to Gantt Tasks
  const ganttTasks: GanttTask[] = React.useMemo(() => {
    if (tasks.length === 0) return [];

    const now = new Date();
    
    return tasks.map(task => {
      const startDate = task.start_date ? new Date(task.start_date) : now;
      const endDate = task.due_date ? new Date(task.due_date) : new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Ensure end > start
      const safeEndDate = endDate > startDate ? endDate : new Date(startDate.getTime() + 60 * 60 * 1000);

      // Map dependencies: Find all where THIS task is the successor (dependent on others)
      // The library expects "dependencies" = array of PREDECESSOR IDs.
      const taskDeps = dependencies
        .filter(d => d.successor_id === task.id)
        .map(d => d.predecessor_id);



      const isOverdue = task.status !== 'done' && safeEndDate < now;
      const taskColor = isOverdue ? '#ef4444' : (task.status === 'done' ? '#10b981' : '#3b82f6');
      
      return {
        start: startDate,
        end: safeEndDate,
        name: task.title,
        id: task.id,
        type: 'task',
        progress: task.status === 'done' ? 100 : (task.status === 'in_progress' ? 50 : 0),
        dependencies: taskDeps,
        isDisabled: false,
        styles: { 
            progressColor: taskColor,
            progressSelectedColor: taskColor,
            backgroundColor: taskColor,
            backgroundSelectedColor: taskColor
        },
      };
    });
  }, [tasks, dependencies]);

  const handleDateChange = async (task: GanttTask) => {
    // Guard: Check if dates actually changed to prevent accidental updates
    const originalTask = tasks.find(t => t.id === task.id);
    if (originalTask) {
        const originalStart = new Date(originalTask.start_date || new Date());
        const originalEnd = new Date(originalTask.due_date || new Date());
        
        // Compare timestamps (ignoring milliseconds if usually stripped)
        const isStartSame = originalStart.toDateString() === task.start.toDateString();
        const isEndSame = originalEnd.toDateString() === task.end.toDateString();

        if (isStartSame && isEndSame) {
            return;
        }
    }

    try {
        await updateTaskDates(task.id, task.start, task.end);
        toast.success(t('dateUpdated'));
    } catch (e) {
        toast.error(t('dateUpdateError'));
    }
  };

  if (ganttTasks.length === 0) {
      return <div className="p-8 text-center text-slate-500">{t('noTasks')}</div>;
  }

  // Set the view date to today initially
  const [viewDate, setViewDate] = React.useState(new Date());

  const handleTaskClick = (task: GanttTask) => {
      // When a task is clicked (list or bar), jump to its start date
      // We subtract a small buffer (e.g. 1 day) so the bar isn't right at the edge
      const newDate = new Date(task.start);
      newDate.setDate(newDate.getDate() - 1); 
      setViewDate(newDate);
  };

  // Custom Task List Header
  const TaskListHeader = ({ headerHeight }: { headerHeight: number }) => {
    return (
      <div 
        className="h-full border-b flex items-center px-4 bg-slate-50 font-medium text-sm text-slate-500 border-r"
        style={{ height: headerHeight, width: '155px' }}
      >
        {t('taskName')}
      </div>
    );
  };

  // Custom Task List to ensure clickability
  const TaskListTable = ({
    tasks,
    selectedTaskId,
    setSelectedTask,
    onExpanderClick,
    rowHeight,
  }: {
    tasks: GanttTask[];
    selectedTaskId: string;
    setSelectedTask: (taskId: string) => void;
    onExpanderClick: (task: GanttTask) => void;
    rowHeight: number;
  }) => {
    return (
      <div className="font-sans border-r bg-white" style={{ width: '155px' }}>
        {tasks.map((task) => (
            <div 
                key={task.id} 
                className={`
                    border-b flex items-center px-4 text-sm cursor-pointer hover:bg-slate-50 transition-colors
                    ${task.id === selectedTaskId ? 'bg-orange-50' : ''}
                `}
                style={{ height: rowHeight }}
                onClick={() => {
                    handleTaskClick(task);
                    setSelectedTask(task.id);
                }}
            >
                <div className="truncate w-full" title={task.name}>
                    {task.name}
                </div>
            </div>
        ))}
      </div>
    );
  };

  return (
    <div className="overflow-x-auto h-full border rounded-md">
       <Gantt
        tasks={ganttTasks}
        viewMode={ViewMode.Day}
        viewDate={viewDate}
        onDateChange={handleDateChange}
        onClick={handleTaskClick}
        TaskListHeader={TaskListHeader}
        TaskListTable={TaskListTable}
        listCellWidth="155px"
        columnWidth={60}
        headerHeight={50}
        rowHeight={50}
      />
    </div>
  );
}
