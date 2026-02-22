'use client';

import React, { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Task } from '@/types';
import { isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { TaskList } from './TaskList';
import { TaskBoard } from './TaskBoard';
import { GanttChart } from './GanttChart';
import { AnalyticsView } from './AnalyticsView';
import { ProjectOverview } from './ProjectOverview';
import { LayoutList, KanbanSquare, GanttChartSquare, LogOut, Plus, Settings, PieChart, Lightbulb, FileUp, Monitor } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import { ProjectSelector } from './ProjectSelector';
import { TaskFilters } from './TaskFilters';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { ShortcutsListModal } from './ShortcutsListModal';
import { DashboardStats } from './DashboardStats';
import { ExportMenu } from './ExportMenu';
import { useTaskNotifications } from '@/hooks/useTaskNotifications';
import { IdeaBox } from './IdeaBox';
import { ImportPlanModal } from './ImportPlanModal';

interface Project {
  id: string;
  name: string;
  key: string;
}

interface DashboardViewProps {
  initialTasks: Task[];
  projectName: string;
  projectId: string;
  allProjects: Project[];
  defaultView?: 'list' | 'board' | 'gantt';
  currentUserEmail?: string;
  scanData?: any;
}

// Recursive filter function for hierarchical tasks
function filterTasks(
  tasks: Task[], 
  searchQuery: string, 
  statusFilter: string, 
  priorityFilter: string,
  showCompleted: boolean
): Task[] {
  const searchLower = searchQuery.toLowerCase();
  
  return tasks.reduce<Task[]>((filtered, task) => {
    // Check if task ID matches exactly (case-insensitive, supports partial ID)
    const idMatches = searchQuery && (
      task.id.toLowerCase().includes(searchLower) ||
      task.id.slice(0, 8).toLowerCase() === searchLower // Match short ID format
    );
    
    // If ID matches exactly, include this task with ALL its children (no further filtering)
    if (idMatches) {
      filtered.push({
        ...task,
        children: task.children || [], // Include all children as-is
      });
      return filtered;
    }
    
    // Check if task matches text search (title/description)
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchLower) ||
      (task.description?.toLowerCase().includes(searchLower) ?? false);
    
    // Status Filter: "All", "Todo", "In Progress", "Done"
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;

    // Show Completed Toggle Logic:
    // If showCompleted is FALSE, exclude 'done' tasks.
    // However, if Status Filter is explicitly 'done', we probably should show them anyway?
    // Let's keep it simple: Toggle is a master visibility switch for completed tasks, UNLESS status is exclusively 'done'.
    // If user sets Status='Done' and ShowCompleted=False, showing nothing is confusing.
    // Logic: 
    // If StatusFilter == 'done', ignore showCompleted (Implicitly Show).
    // Else, apply showCompleted logic.
    // const showDone = showCompleted || statusFilter === 'done';
    // if (!showDone && task.status === 'done') return filtered;
    
    const showDone = showCompleted || statusFilter === 'done';
    if (!showDone && task.status === 'done') return filtered;

    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    const taskMatches = matchesSearch && matchesStatus && matchesPriority;
    
    // Recursively filter children
    const filteredChildren = task.children 
      ? filterTasks(task.children, searchQuery, statusFilter, priorityFilter, showCompleted) 
      : [];
    
    // Include task if it matches or has matching children
    // Note: If task is hidden (e.g. done and showCompleted=false), we returned early above.
    // But wait, what if a DONE parent has OPEN children?
    // If parent is hidden, children are hidden in the current UI structure (nested).
    // If we want to show open children of done parents, we need to return the child but maybe "flatten" it or show parent as "ghost"?
    // For now, simpler behavior: Parent Hidden -> Children Hidden.
    
    if (taskMatches || filteredChildren.length > 0) {
      filtered.push({
        ...task,
        children: filteredChildren,
      });
    }
    
    return filtered;
  }, []);
}

export function DashboardView({ initialTasks, projectName, projectId, allProjects, defaultView = 'list', currentUserEmail, scanData }: DashboardViewProps) {
  const router = useRouter();
  const t = useTranslations('dashboard');
  const tCommon = useTranslations('common');
  const tAuth = useTranslations('auth');
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = React.useState(false);
  const [activeView, setActiveView] = React.useState<string>(defaultView);
  const [isIdeaBoxOpen, setIsIdeaBoxOpen] = React.useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = React.useState(false);
  const tImport = useTranslations('import');


  // Derive selected task from initialTasks to ensure it receives updates
  // Need to search recursively if tasks are hierarchical
  const findTaskById = (tasks: Task[], id: string): Task | undefined => {
    for (const task of tasks) {
        if (task.id === id) return task;
        if (task.children) {
            const found = findTaskById(task.children, id);
            if (found) return found;
        }
    }
    return undefined;
  };

  const selectedTask = React.useMemo(() => {
    if (!selectedTaskId) return null;
    return findTaskById(initialTasks, selectedTaskId);
  }, [initialTasks, selectedTaskId]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewTask: () => projectId && setIsCreateModalOpen(true),
    onSearch: () => searchInputRef.current?.focus(),
    onViewList: () => setActiveView('list'),
    onViewBoard: () => setActiveView('board'),
    onViewGantt: () => setActiveView('gantt'),
    onCloseModal: () => {
      if (isCreateModalOpen) setIsCreateModalOpen(false);
      if (isShortcutsModalOpen) setIsShortcutsModalOpen(false);
      if (selectedTaskId) setSelectedTaskId(null);
    },
    onShowShortcuts: () => setIsShortcutsModalOpen(true),
  });

  // ... (notifications logic remains same)
  // Task notifications
  const { checkOverdueTasks, permission } = useTaskNotifications();

  // Check for overdue tasks on load (only if notifications are granted)
  useEffect(() => {
    if (permission === 'granted' && initialTasks.length > 0) {
      // Small delay to avoid showing notification immediately on page load
      const timeout = setTimeout(() => {
        checkOverdueTasks(initialTasks);
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [permission, initialTasks, checkOverdueTasks]);

  const handleProjectChange = (newProjectId: string) => {
    router.push(`/dashboard?projectId=${newProjectId}`);
  };

  // Filters
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [priorityFilter, setPriorityFilter] = React.useState('all');
  const [showCompleted, setShowCompleted] = React.useState(false);
  const [timeframe, setTimeframe] = React.useState('all');

  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTimeframe('all');
    if (searchInputRef.current) {
        searchInputRef.current.focus();
    }
  };

  // Apply filters to tasks (Base filter for Search/Status/Priority/ShowCompleted)
  const filteredTasks = React.useMemo(() => {
    return filterTasks(initialTasks, searchQuery, statusFilter, priorityFilter, showCompleted);
  }, [initialTasks, searchQuery, statusFilter, priorityFilter, showCompleted]);

  // Apply Timeframe Filter (Used by List, Board, Analytics)
  const dateFilteredTasks = React.useMemo(() => {
    if (timeframe === 'all') return filteredTasks;
    return filteredTasks.filter(t => {
       if (!t.due_date) return false;
       const date = parseISO(t.due_date);
       if (timeframe === 'today') return isToday(date);
       if (timeframe === 'thisWeek') return isThisWeek(date, { weekStartsOn: 1 });
       if (timeframe === 'thisMonth') return isThisMonth(date);
       return true;
    });
  }, [filteredTasks, timeframe]);

  // Analytics always shows completed tasks to ensure accurate charts, BUT respects Timeframe
  const analyticsTasks = React.useMemo(() => {
    // 1. Base filter (Force showCompleted=true)
    const base = filterTasks(initialTasks, searchQuery, statusFilter, priorityFilter, true);
    
    // 2. Apply Timeframe
    if (timeframe === 'all') return base;
    return base.filter(t => {
       if (!t.due_date) return false;
       const date = parseISO(t.due_date);
       if (timeframe === 'today') return isToday(date);
       if (timeframe === 'thisWeek') return isThisWeek(date, { weekStartsOn: 1 });
       if (timeframe === 'thisMonth') return isThisMonth(date);
       return true;
    });
  }, [initialTasks, searchQuery, statusFilter, priorityFilter, timeframe]);

  const handleTaskClick = (task: Task) => {
      setSelectedTaskId(task.id);
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* ... (header remains same) ... */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <ProjectSelector
            projects={allProjects}
            currentProjectId={projectId}
            onProjectChange={handleProjectChange}
          />
        </div>
        <div className="flex items-center gap-2">
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
          <ExportMenu tasks={initialTasks} projectName={projectName} />
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
      </div>

      {projectId ? (
        <>
          {/* Stats */}
          <DashboardStats tasks={analyticsTasks} />

          {/* Search and Filters */}
          <TaskFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            priorityFilter={priorityFilter}
            onPriorityChange={setPriorityFilter}
            onClearFilters={handleClearFilters}
            showCompleted={showCompleted}
            onShowCompletedChange={setShowCompleted}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            searchInputRef={searchInputRef}
            view={activeView}
          />

          {/* Main content area with optional IdeaBox sidebar */}
          <div className="flex-1 flex gap-4 min-h-0">
            {/* Tabs - Main content */}
            <Tabs value={activeView} onValueChange={setActiveView} className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between pb-4">
                <TabsList>
                  <TabsTrigger value="overview" className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      {t('views.overview')}
                  </TabsTrigger>
                  <TabsTrigger value="list" className="flex items-center gap-2">
                      <LayoutList className="h-4 w-4" />
                      {t('views.list')}
                  </TabsTrigger>
                  <TabsTrigger value="board" className="flex items-center gap-2">
                      <KanbanSquare className="h-4 w-4" />
                      {t('views.board')}
                  </TabsTrigger>
                  <TabsTrigger value="gantt" className="flex items-center gap-2">
                      <GanttChartSquare className="h-4 w-4" />
                      {t('views.gantt')}
                  </TabsTrigger>
                  <TabsTrigger value="analytics" className="flex items-center gap-2">
                      <PieChart className="h-4 w-4" />
                      {t('views.analytics')}
                  </TabsTrigger>
                </TabsList>
                
                {/* Result Count - Shows count for ACTIVE view context */}
                <span className="text-sm text-muted-foreground">
                  {activeView === 'gantt' 
                    ? t('filters.resultsCount', { count: filteredTasks.length })
                    : t('filters.resultsCount', { count: dateFilteredTasks.length })
                  }
                </span>
              </div>

              <TabsContent value="overview" className="flex-1 border-none p-0 outline-none overflow-y-auto">
                <ProjectOverview scanData={scanData} tasks={initialTasks} />
              </TabsContent>

              <TabsContent value="list" className="flex-1 border-none p-0 outline-none">
                <TaskList 
                  tasks={dateFilteredTasks} 
                  onTaskClick={handleTaskClick} 
                  isModalOpen={!!selectedTaskId || isCreateModalOpen || isShortcutsModalOpen}
                />
              </TabsContent>

              <TabsContent value="board" className="flex-1 border-none p-0 outline-none">
                <TaskBoard tasks={dateFilteredTasks} onTaskClick={handleTaskClick} />
              </TabsContent>

              <TabsContent value="gantt" className="flex-1 border-none p-0 outline-none">
                   <GanttChart tasks={filteredTasks} />
              </TabsContent>

              <TabsContent value="analytics" className="flex-1 border-none p-0 outline-none overflow-y-auto">
                   <AnalyticsView tasks={analyticsTasks} />
              </TabsContent>
            </Tabs>

            {/* IdeaBox Side Panel */}
            {isIdeaBoxOpen && (
              <div className="w-80 shrink-0">
                <IdeaBox projectId={projectId} onTaskCreated={() => router.refresh()} />
              </div>
            )}
          </div>

          <TaskDetailModal 
            task={selectedTask || null} 
            isOpen={!!selectedTask} 
            onClose={() => setSelectedTaskId(null)}
            projectId={projectId}
            currentUserEmail={currentUserEmail}
          />

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
