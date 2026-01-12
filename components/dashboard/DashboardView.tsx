
'use client';

import React from 'react';
import { Task } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskList } from './TaskList';
import { TaskBoard } from './TaskBoard';
import { GanttChart } from './GanttChart';
import { LayoutList, KanbanSquare, GanttChartSquare } from 'lucide-react';

import { TaskDetailModal } from './TaskDetailModal';

interface DashboardViewProps {
  initialTasks: Task[];
  projectName: string;
}

export function DashboardView({ initialTasks, projectName }: DashboardViewProps) {
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold tracking-tight">{projectName}</h1>
         {/* Add Task Button could go here */}
      </div>

      <Tabs defaultValue="list" className="flex-1 flex flex-col">
        <div className="flex items-center justify-between pb-4">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
                <LayoutList className="h-4 w-4" />
                List
            </TabsTrigger>
            <TabsTrigger value="board" className="flex items-center gap-2">
                <KanbanSquare className="h-4 w-4" />
                Board
            </TabsTrigger>
            <TabsTrigger value="gantt" className="flex items-center gap-2">
                <GanttChartSquare className="h-4 w-4" />
                Gantt
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="list" className="flex-1 border-none p-0 outline-none">
          <TaskList tasks={initialTasks} onTaskClick={setSelectedTask} />
        </TabsContent>

        <TabsContent value="board" className="flex-1 border-none p-0 outline-none">
          <TaskBoard tasks={initialTasks} onTaskClick={setSelectedTask} />
        </TabsContent>

        <TabsContent value="gantt" className="flex-1 border-none p-0 outline-none">
             <GanttChart tasks={initialTasks} />
        </TabsContent>
      </Tabs>

      <TaskDetailModal 
        task={selectedTask} 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />
    </div>
  );
}
