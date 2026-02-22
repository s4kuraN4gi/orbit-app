'use client';

import React from 'react';
import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Terminal, Layers, Package, CheckCircle2, Circle, Disc, ListTodo } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ScanData {
  techStack: string[];
  nodeVersion: string | null;
  packageManager: string | null;
  dependencies: { category: string; packages: string[] }[];
  depCount: { total: number; dev: number };
}

interface ProjectOverviewProps {
  scanData?: ScanData | null;
  tasks: Task[];
}

function flattenTasks(taskList: Task[]): Task[] {
  let result: Task[] = [];
  taskList.forEach(task => {
    result.push(task);
    if (task.children && task.children.length > 0) {
      result = result.concat(flattenTasks(task.children));
    }
  });
  return result;
}

export function ProjectOverview({ scanData, tasks }: ProjectOverviewProps) {
  const t = useTranslations('dashboard.scan');
  const tStats = useTranslations('dashboard.stats');

  const allTasks = flattenTasks(tasks);
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => t.status === 'done').length;
  const inProgressTasks = allTasks.filter(t => t.status === 'in_progress').length;
  const todoTasks = allTasks.filter(t => t.status === 'todo').length;
  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  if (!scanData) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Terminal className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{t('noData')}</h3>
        <p className="text-sm text-muted-foreground mb-4">{t('noDataDesc')}</p>
        <code className="bg-muted px-4 py-2 rounded-md text-sm">orbit scan</code>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tech Stack */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('techStack')}</CardTitle>
          <Layers className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-3">
            {scanData.techStack.map((tech) => (
              <Badge key={tech} variant="default">{tech}</Badge>
            ))}
          </div>
          {(scanData.nodeVersion || scanData.packageManager) && (
            <div className="flex flex-wrap gap-2">
              {scanData.nodeVersion && (
                <Badge variant="outline">Node {scanData.nodeVersion}</Badge>
              )}
              {scanData.packageManager && (
                <Badge variant="outline">{scanData.packageManager}</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dependencies */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{t('dependencies')}</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('packageCount', { total: scanData.depCount.total, dev: scanData.depCount.dev })}
          </p>
          <div className="space-y-3">
            {scanData.dependencies.map(({ category, packages }) => (
              <div key={category}>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {category}
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {packages.map((pkg) => (
                    <Badge key={pkg} variant="secondary" className="text-xs">
                      {pkg}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tStats('totalTasks')}</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              {tStats('completionRate', { rate: completionRate })}
            </p>
            <Progress value={completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tStats('todo')}</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todoTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tStats('inProgress')}</CardTitle>
            <Disc className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgressTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tStats('done')}</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doneTasks}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
