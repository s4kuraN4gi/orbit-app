
import React from 'react';
import { Task } from '@/types';
import { TaskRow } from './TaskRow';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TaskListProps {
  tasks: Task[];
}

// Helper to recursively render rows
const RenderTaskAndChildren = ({ task, level, onTaskClick }: { task: Task; level: number; onTaskClick: (task: Task) => void }) => {
  return (
    <>
      <TaskRow task={task} level={level} onClick={() => onTaskClick(task)} />
      {task.children && task.children.length > 0 && (
        task.children.map(child => (
          <RenderTaskAndChildren key={child.id} task={child} level={level + 1} onTaskClick={onTaskClick} />
        ))
      )}
    </>
  );
};

export function TaskList({ tasks, onTaskClick }: TaskListProps & { onTaskClick: (task: Task) => void }) {
  if (tasks.length === 0) {
     return <div className="p-8 text-center text-slate-500">No tasks found. Create one to get started!</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => (
            <RenderTaskAndChildren key={task.id} task={task} level={0} onTaskClick={onTaskClick} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
