'use client';

import React from 'react';
import { Task } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Terminal, Layers, Package, CheckCircle2, Circle, Disc, ListTodo,
  Network, Bot, GitBranch, FileCode, Play, Cloud, KeyRound,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ScanData {
  techStack: string[];
  nodeVersion: string | null;
  packageManager: string | null;
  dependencies: { category: string; packages: string[] }[];
  depCount: { total: number; dev: number };
  structure?: {
    pages: string[];
    apiRoutes: { method: string; path: string }[];
    dbTables: { name: string; columns: number }[];
  };
  aiContext?: {
    files: { name: string; path: string }[];
  };
  git?: {
    branch: string;
    lastCommitDate: string | null;
    uncommittedChanges: number;
    totalCommits: number;
    recentCommits: number;
  } | null;
  codeMetrics?: {
    totalFiles: number;
    totalLines: number;
    byDirectory: { dir: string; files: number }[];
    largestFiles: { path: string; lines: number }[];
  };
  scripts?: Record<string, string>;
  deployment?: {
    platform: string | null;
    ci: string | null;
  };
  envVars?: string[];
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
  const tCommon = useTranslations('common');

  const daysAgo = (dateStr: string): string => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return tCommon('today');
    return tCommon('daysAgo', { count: diff });
  };

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

      {/* Structure */}
      {scanData.structure && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('pages')}</CardTitle>
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{scanData.structure.pages.length}</div>
              <div className="flex flex-wrap gap-1">
                {scanData.structure.pages.map(page => (
                  <Badge key={page} variant="secondary" className="text-xs">{page}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('apiRoutes')}</CardTitle>
              <Network className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{scanData.structure.apiRoutes.length}</div>
              <p className="text-xs text-muted-foreground">
                {[...new Set(scanData.structure.apiRoutes.map(r => r.method))].join(', ')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dbTables')}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">{scanData.structure.dbTables.length}</div>
              <div className="flex flex-wrap gap-1">
                {scanData.structure.dbTables.map(table => (
                  <Badge key={table.name} variant="secondary" className="text-xs">
                    {table.name} ({table.columns})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Context + Git + Codebase row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* AI Context */}
        {scanData.aiContext && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('aiContextTitle')}</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {scanData.aiContext.files.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {scanData.aiContext.files.map(f => (
                    <Badge key={f.path} variant="outline">{f.name}</Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t('aiContextNone')}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Git */}
        {scanData.git && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Git</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{scanData.git.branch}</Badge>
                {scanData.git.uncommittedChanges > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {scanData.git.uncommittedChanges} {t('gitUncommitted')}
                  </Badge>
                )}
              </div>
              {scanData.git.lastCommitDate && (
                <p className="text-xs text-muted-foreground">
                  {t('gitLastCommit')}: {daysAgo(scanData.git.lastCommitDate)}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {scanData.git.totalCommits} total / {scanData.git.recentCommits} {t('gitThisWeek')}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Codebase */}
        {scanData.codeMetrics && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('codebase')}</CardTitle>
              <FileCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {scanData.codeMetrics.totalFiles} {t('files')}
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                ~{scanData.codeMetrics.totalLines.toLocaleString()} {t('lines')}
              </p>
              {scanData.codeMetrics.largestFiles.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">{t('largestFiles')}:</span>
                  {scanData.codeMetrics.largestFiles.slice(0, 3).map(f => (
                    <div key={f.path} className="text-xs flex justify-between">
                      <span className="truncate">{f.path.split('/').pop()}</span>
                      <span className="text-muted-foreground ml-2">{f.lines}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Scripts + Deployment + Environment row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Scripts */}
        {scanData.scripts && Object.keys(scanData.scripts).length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('scriptsTitle')}</CardTitle>
              <Play className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(scanData.scripts).map(name => (
                  <Badge key={name} variant="secondary" className="text-xs">{name}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Deployment */}
        {scanData.deployment && (scanData.deployment.platform || scanData.deployment.ci) && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('deployTitle')}</CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {scanData.deployment.platform && (
                  <Badge variant="default">{scanData.deployment.platform}</Badge>
                )}
                {scanData.deployment.ci && (
                  <Badge variant="outline">{scanData.deployment.ci}</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Environment Variables */}
        {scanData.envVars && scanData.envVars.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {t('envTitle')} ({scanData.envVars.length})
              </CardTitle>
              <KeyRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {scanData.envVars.map(v => (
                  <Badge key={v} variant="secondary" className="text-xs font-mono">{v}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
