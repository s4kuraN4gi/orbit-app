'use client';

import React, { useState } from 'react';
import { Task, PlanTier } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Download, FileJson, FileSpreadsheet, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { ExportContextModal } from './ExportContextModal';

interface ExportMenuProps {
  tasks: Task[];
  projectName: string;
  planTier?: PlanTier;
}

export function ExportMenu({ tasks, projectName, planTier }: ExportMenuProps) {
  const t = useTranslations('dashboard.export');
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);

  // Convert tasks to CSV
  const handleExportCSV = () => {
    const flatten = (nodes: Task[]): Task[] => {
      let flat: Task[] = [];
      nodes.forEach(node => {
        flat.push(node);
        if (node.children) {
          flat = flat.concat(flatten(node.children));
        }
      });
      return flat;
    };

    const allTasks = flatten(tasks);

    const headers = [
      'ID',
      'Title',
      'Status',
      'Priority',
      'Start Date',
      'Due Date',
      'Created At',
      'Parent ID',
      'Description'
    ];

    const rows = allTasks.map(task => [
      task.id,
      task.title,
      task.status,
      task.priority,
      task.start_date || '',
      task.due_date || '',
      task.created_at,
      task.parent_id || '',
      `"${(task.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${projectName}_tasks.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export JSON
  const handleExportJSON = () => {
    const flatten = (nodes: Task[]): Task[] => {
      let flat: Task[] = [];
      nodes.forEach(node => {
        const { children, ...rest } = node;
        flat.push(rest as Task);
        if (children) {
          flat = flat.concat(flatten(children));
        }
      });
      return flat;
    };

    const allTasks = flatten(tasks);
    const jsonContent = JSON.stringify(allTasks, null, 2);

    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${projectName}_tasks.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t('button')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsContextModalOpen(true)}>
            <Bot className="mr-2 h-4 w-4" />
            {t('contextButton')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportCSV}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            {t('csv')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              if (planTier === 'free') {
                toast.error(t('jsonProOnly'));
                return;
              }
              handleExportJSON();
            }}
            className={planTier === 'free' ? 'opacity-50' : ''}
          >
            <FileJson className="mr-2 h-4 w-4" />
            {t('json')}
            {planTier === 'free' && (
              <Badge variant="secondary" className="ml-auto text-[10px] px-1 py-0">Pro</Badge>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ExportContextModal
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        tasks={tasks}
        projectName={projectName}
        planTier={planTier}
      />
    </>
  );
}

