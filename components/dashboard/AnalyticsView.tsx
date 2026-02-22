'use client';

import React from 'react';
import { Task } from '@/types';
import { useTranslations } from 'next-intl';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface AnalyticsViewProps {
  tasks: Task[];
}

export function AnalyticsView({ tasks }: AnalyticsViewProps) {
  const t = useTranslations('dashboard.analytics');
  const tStatus = useTranslations('task.status');
  const tPriority = useTranslations('task.priority');

  // Calculate stats based on RECEIVED tasks (already filtered by parent)
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'done').length;
  const rate = total === 0 ? 0 : Math.round((done / total) * 100);

  // Status Data
  const statusData = React.useMemo(() => {
    const counts = { todo: 0, in_progress: 0, done: 0 };
    tasks.forEach(task => {
      if (task.status in counts) {
        counts[task.status as keyof typeof counts]++;
      }
    });
    return [
      { name: tStatus('todo'), value: counts.todo, color: '#94a3b8' }, // Slate 400
      { name: tStatus('in_progress'), value: counts.in_progress, color: '#3b82f6' }, // Blue 500
      { name: tStatus('done'), value: counts.done, color: '#22c55e' }, // Green 500
    ];
  }, [tasks, tStatus]);

  // Priority Data
  const priorityData = React.useMemo(() => {
    const counts = { high: 0, medium: 0, low: 0 };
    tasks.forEach(task => {
      if (task.priority in counts) {
        counts[task.priority as keyof typeof counts]++;
      }
    });
    return [
      { name: tPriority('high'), count: counts.high },
      { name: tPriority('medium'), count: counts.medium },
      { name: tPriority('low'), count: counts.low },
    ];
  }, [tasks, tPriority]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-300">
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('totalTasks')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('doneTasks')}</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-green-600">{done}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('completionRate')}</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex items-end gap-2">
               <div className="text-2xl font-bold text-blue-600">{rate}%</div>
             </div>
             <Progress value={rate} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row: Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status Chart */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>{t('statusDistribution')}</CardTitle>
            <CardDescription>{t('statusDistributionDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            {total > 0 ? (
              <PieChart width={400} height={300}>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            ) : (
              <div className="text-muted-foreground text-sm flex items-center justify-center h-full">
                {t('noData')}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Priority Chart */}
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle>{t('priorityBreakdown')}</CardTitle>
            <CardDescription>{t('priorityBreakdownDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
               {total > 0 ? (
                 <BarChart 
                   width={500} 
                   height={300} 
                   data={priorityData} 
                   layout="vertical" 
                   margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                 >
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                   <XAxis type="number" allowDecimals={false} />
                   <YAxis dataKey="name" type="category" width={80} />
                   <Tooltip cursor={{fill: 'transparent'}} />
                   <Bar dataKey="count" fill="#8884d8" radius={[0, 4, 4, 0]}>
                      {
                        priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#eab308' : '#3b82f6'} />
                        ))
                      }
                   </Bar>
                 </BarChart>
               ) : (
                  <div className="text-muted-foreground text-sm flex items-center justify-center h-full min-h-[300px]">
                    {t('noData')}
                  </div>
               )}
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Charts */}
      <div className="grid grid-cols-1 gap-6">
         {/* Trend Chart (Completed by Day) */}
         <TrendChart tasks={tasks} />
      </div>

    </div>
  );
}

// Sub-components for Charts
import { format, subDays, eachDayOfInterval, startOfDay, endOfDay, isSameDay, parseISO, compareAsc } from 'date-fns';

function TrendChart({ tasks }: { tasks: Task[] }) {
  const t = useTranslations('dashboard.analytics');
  
  const data = React.useMemo(() => {
    // 1. Determine date range from tasks or default to last 30 days if no filter?
    // Actually, the tasks passed here are already filtered by the global "Timeframe".
    // If "All Time", showing daily trend for years is messy.
    // Let's dynamically decide granularity or just show last 14-30 days present in data?
    
    // Find min and max completed_at
    const completedTasks = tasks.filter(t => t.status === 'done' && t.completed_at);
    if (completedTasks.length === 0) return [];

    const dates = completedTasks.map(t => parseISO(t.completed_at!));
    dates.sort(compareAsc);
    
    // If no tasks, return empty
    if (dates.length === 0) return [];

    const startDate = dates[0];
    const endDate = dates[dates.length - 1];
    
    // Generate all days in between
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Safety check: if > 60 days, maybe group by week? For now, just cap or show all.
    // If > 90 days, let's just show last 30 active days to avoid performance issues?
    // Or just show all. Recharts handles it okay-ish.
    
    return days.map(day => {
       const count = completedTasks.filter(t => isSameDay(parseISO(t.completed_at!), day)).length;
       return {
         date: format(day, 'MM/dd'),
         count
       };
    });
  }, [tasks]);

  if (data.length === 0) return null;

  return (
    <Card className="shadow-sm border-border">
      <CardHeader>
        <CardTitle>{t('trendTitle')}</CardTitle>
        <CardDescription>{t('trendDesc')}</CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] w-full">
         <div className="w-full h-full"> 
           {/* ResponsiveContainer is tricky with strict mode sometimes, fixed width/height for safety first */}
            <BarChart
              width={800} // Ideally use ResponsiveContainer
              height={300}
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                cursor={{ fill: '#f1f5f9' }}
              />
              <Bar dataKey="count" name={t('completedCount')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
         </div>
      </CardContent>
    </Card>
  );
}

