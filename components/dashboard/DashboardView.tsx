'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Task, PlanTier } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TaskList } from './TaskList';
import { ProjectOverview } from './ProjectOverview';
import { ContextHistoryView } from './ContextHistoryView';
import { ContextDiffView } from './ContextDiffView';
import { LayoutList, LogOut, Plus, Settings, Lightbulb, FileUp, Monitor, Bot, Sparkles, MoreHorizontal, X } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { logout } from '@/app/actions/auth';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { CreateTaskModal } from './CreateTaskModal';
import { ProjectSelector } from './ProjectSelector';
import { TaskFilters } from './TaskFilters';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ShortcutsListModal } from './ShortcutsListModal';
import { DashboardStats } from './DashboardStats';
import { ExportMenu } from './ExportMenu';
import { ExportContextModal } from './ExportContextModal';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
import { IdeaBox } from './IdeaBox';
import { ImportPlanModal } from './ImportPlanModal';
import { toast } from 'sonner';

interface Project {
  id: string;
  name: string;
  key: string;
  organizationId?: string | null;
}

interface OrgOption {
  id: string;
  name: string;
}

interface DashboardViewProps {
  initialTasks: Task[];
  projectName: string;
  projectId: string;
  allProjects: Project[];
  defaultView?: 'list' | 'overview';
  currentUserEmail?: string;
  scanData?: Record<string, unknown> | null;
  planTier?: PlanTier;
  currentProjectCount?: number;
  checkoutSuccess?: boolean;
  organizations?: OrgOption[];
}

// Recursive filter function for hierarchical tasks
function filterTasks(
  tasks: Task[],
  searchQuery: string,
  statusFilter: string,
  showCompleted: boolean
): Task[] {
  const searchLower = searchQuery.toLowerCase();

  return tasks.reduce<Task[]>((filtered, task) => {
    const idMatches = searchQuery && (
      task.id.toLowerCase().includes(searchLower) ||
      task.id.slice(0, 8).toLowerCase() === searchLower
    );

    if (idMatches) {
      filtered.push({ ...task, children: task.children || [] });
      return filtered;
    }

    const matchesSearch = !searchQuery ||
      task.title.toLowerCase().includes(searchLower) ||
      (task.description?.toLowerCase().includes(searchLower) ?? false);

    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const showDone = showCompleted || statusFilter === 'done';
    if (!showDone && task.status === 'done') return filtered;

    const taskMatches = matchesSearch && matchesStatus;

    const filteredChildren = task.children
      ? filterTasks(task.children, searchQuery, statusFilter, showCompleted)
      : [];

    if (taskMatches || filteredChildren.length > 0) {
      filtered.push({ ...task, children: filteredChildren });
    }

    return filtered;
  }, []);
}

export function DashboardView({ initialTasks, projectName, projectId, allProjects, defaultView = 'overview', currentUserEmail, scanData, planTier = 'free', currentProjectCount, checkoutSuccess, organizations = [] }: DashboardViewProps) {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = React.useState(false);
  const [activeView, setActiveView] = React.useState<string>(defaultView);
  const [isIdeaBoxOpen, setIsIdeaBoxOpen] = React.useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const [isExportContextOpen, setIsExportContextOpen] = React.useState(false);
  const tImport = useTranslations('import');
  const tPricing = useTranslations('pricing');
  const tExport = useTranslations('dashboard.export');

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewTask: () => projectId && setIsCreateModalOpen(true),
    onSearch: () => searchInputRef.current?.focus(),
    onViewList: () => setActiveView('tasks'),
    onCloseModal: () => {
      if (isCreateModalOpen) setIsCreateModalOpen(false);
      if (isShortcutsModalOpen) setIsShortcutsModalOpen(false);
    },
    onShowShortcuts: () => setIsShortcutsModalOpen(true),
  });

  // Task notifications
  const { checkOverdueTasks, permission } = useTaskNotifications();

  useEffect(() => {
    if (permission === 'granted' && initialTasks.length > 0) {
      const timeout = setTimeout(() => {
        checkOverdueTasks(initialTasks);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [permission, initialTasks, checkOverdueTasks]);

  // Checkout success notification
  useEffect(() => {
    if (checkoutSuccess) {
      toast.success(tPricing('checkoutSuccess', { plan: planTier.charAt(0).toUpperCase() + planTier.slice(1) }));
      // Clean up URL param
      const url = new URL(window.location.href);
      url.searchParams.delete('checkout');
      window.history.replaceState({}, '', url.toString());
    }
  }, [checkoutSuccess, planTier]);

  const handleProjectChange = (newProjectId: string) => {
    router.push(`/dashboard?projectId=${newProjectId}`);
  };

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [showCompleted, setShowCompleted] = React.useState(false);

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const filteredTasks = React.useMemo(() => {
    return filterTasks(initialTasks, searchQuery, statusFilter, showCompleted);
  }, [initialTasks, searchQuery, statusFilter, showCompleted]);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-4 min-w-0">
          <ProjectSelector
            projects={allProjects}
            currentProjectId={projectId}
            onProjectChange={handleProjectChange}
            planTier={planTier}
            organizations={organizations}
          />
        </div>
        {/* Desktop: full button bar */}
        <div className="hidden lg:flex items-center gap-2">
          <Button onClick={() => setIsCreateModalOpen(true)} size="sm" className="flex items-center gap-2" disabled={!projectId}>
            <Plus className="h-4 w-4" />
            {t('newTask')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2"
            disabled={!projectId}
          >
            <FileUp className="h-4 w-4" />
            {tImport('button')}
          </Button>
          <Button
            variant={isIdeaBoxOpen ? "default" : "outline"}
            size="sm"
            onClick={() => setIsIdeaBoxOpen(!isIdeaBoxOpen)}
            className="flex items-center gap-2"
            disabled={!projectId}
          >
            <Lightbulb className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => setIsExportContextOpen(true)}
            className="flex items-center gap-2"
            disabled={!projectId}
          >
            <Bot className="h-4 w-4" />
            {tExport('contextButton')}
          </Button>
          <ExportMenu tasks={initialTasks} projectName={projectName} planTier={planTier} />
          <Link href="/settings">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {tCommon('settings')}
            </Button>
          </Link>
          <form action={logout}>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              {tAuth('logout')}
            </Button>
          </form>
        </div>
        {/* Mobile/Tablet: primary action + dropdown */}
        <div className="flex lg:hidden items-center gap-2">
          <Button onClick={() => setIsCreateModalOpen(true)} size="sm" disabled={!projectId}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline ml-1">{t('newTask')}</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setIsImportModalOpen(true)} disabled={!projectId}>
                <FileUp className="h-4 w-4 mr-2" />
                {tImport('button')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsIdeaBoxOpen(!isIdeaBoxOpen)} disabled={!projectId}>
                <Lightbulb className="h-4 w-4 mr-2" />
                {t('ideaBox')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsExportContextOpen(true)} disabled={!projectId}>
                <Bot className="h-4 w-4 mr-2" />
                {tExport('contextButton')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="h-4 w-4 mr-2" />
                  {tCommon('settings')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="h-4 w-4 mr-2" />
                {tAuth('logout')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {projectId ? (
        <>
          <div className="flex-1 flex gap-4 min-h-0">
            <Tabs value={activeView} onValueChange={setActiveView} className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between pb-4">
                <TabsList>
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    {t('views.overview')}
                  </TabsTrigger>
                  <TabsTrigger value="tasks" className="flex items-center gap-2">
                    <LayoutList className="h-4 w-4" />
                    {t('views.tasks')}
                  </TabsTrigger>
                  <TabsTrigger value="context" className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    {t('views.context')}
                  </TabsTrigger>
                </TabsList>

                {activeView === 'tasks' && (
                  <span className="text-sm text-muted-foreground">
                    {t('filters.resultsCount', { count: filteredTasks.length })}
                  </span>
                )}
              </div>

              <TabsContent value="overview" className="flex-1 border-none p-0 outline-none overflow-y-auto">
                <ProjectOverview scanData={scanData as never} tasks={initialTasks} />
              </TabsContent>

              <TabsContent value="tasks" className="flex-1 border-none p-0 outline-none flex flex-col gap-4">
                <DashboardStats tasks={filteredTasks} />
                <TaskFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  onClearFilters={handleClearFilters}
                  showCompleted={showCompleted}
                  onShowCompletedChange={setShowCompleted}
                  searchInputRef={searchInputRef}
                />
                <div className="flex-1">
                  <TaskList
                    tasks={filteredTasks}
                    isModalOpen={isCreateModalOpen || isShortcutsModalOpen}
                  />
                </div>
              </TabsContent>

              <TabsContent value="context" className="flex-1 border-none p-0 outline-none overflow-y-auto">
                <div className="space-y-8">
                  <ContextHistoryView projectId={projectId} currentPlan={planTier} />
                  <div className="border-t pt-6">
                    <ContextDiffView projectId={projectId} currentPlan={planTier} />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Desktop sidebar */}
            {isIdeaBoxOpen && (
              <div className="hidden lg:block w-80 shrink-0">
                <IdeaBox projectId={projectId} onTaskCreated={() => router.refresh()} />
              </div>
            )}
            {/* Mobile slide-over */}
            {isIdeaBoxOpen && (
              <div className="lg:hidden fixed inset-0 z-50">
                <div className="absolute inset-0 bg-black/50" onClick={() => setIsIdeaBoxOpen(false)} />
                <div className="absolute right-0 top-0 bottom-0 w-full max-w-sm bg-background shadow-xl p-4 overflow-y-auto">
                  <div className="flex justify-end mb-2">
                    <Button variant="ghost" size="icon" onClick={() => setIsIdeaBoxOpen(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <IdeaBox projectId={projectId} onTaskCreated={() => router.refresh()} />
                </div>
              </div>
            )}
          </div>

          <CreateTaskModal
            isOpen={isCreateModalOpen}
            onClose={() => setIsCreateModalOpen(false)}
            projectId={projectId}
          />

          <ShortcutsListModal
            open={isShortcutsModalOpen}
            onOpenChange={setIsShortcutsModalOpen}
          />

          <ImportPlanModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            projectId={projectId}
            planTier={planTier}
          />

          <ExportContextModal
            isOpen={isExportContextOpen}
            onClose={() => setIsExportContextOpen(false)}
            tasks={initialTasks}
            projectName={projectName}
            planTier={planTier}
          />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">{t('noProjectTitle')}</h2>
            <p className="text-muted-foreground">{t('noProjectDesc')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
