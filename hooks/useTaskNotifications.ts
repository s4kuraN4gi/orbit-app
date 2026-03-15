'use client';

import { useState, useCallback } from 'react';
import { Task } from '@/types';
import { useTranslations } from 'next-intl';

type NotificationPermission = 'default' | 'granted' | 'denied';

interface UseTaskNotificationsReturn {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  checkOverdueTasks: (tasks: Task[]) => void;
}

// Helper to flatten task tree
function flattenTasks(tasks: Task[]): Task[] {
  let result: Task[] = [];
  tasks.forEach(task => {
    result.push(task);
    if (task.children && task.children.length > 0) {
      result = result.concat(flattenTasks(task.children));
    }
  });
  return result;
}

// Check if a date string is today
function isToday(dateString: string | null): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

// Check if a date string is overdue (before today)
function isOverdue(dateString: string | null): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

export function useTaskNotifications(): UseTaskNotificationsReturn {
  const t = useTranslations('notifications');
  const [permission, setPermission] = useState<NotificationPermission>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission as NotificationPermission;
    }
    return 'default';
  });
  const [isSupported] = useState(() => {
    return typeof window !== 'undefined' && 'Notification' in window;
  });

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermission);
      return result as NotificationPermission;
    } catch {
      return 'denied';
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (permission === 'granted' && isSupported) {
      new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });
    }
  }, [permission, isSupported]);

  const checkOverdueTasks = useCallback((tasks: Task[]) => {
    if (permission !== 'granted') return;

    const allTasks = flattenTasks(tasks);
    
    // Filter incomplete tasks only
    const incompleteTasks = allTasks.filter(task => task.status !== 'done');
    
    // Count overdue and due today
    const overdueTasks = incompleteTasks.filter(task => isOverdue(task.due_date));
    const dueTodayTasks = incompleteTasks.filter(task => isToday(task.due_date));

    // Show notification for overdue tasks
    if (overdueTasks.length > 0) {
      showNotification(
        t('overdueTitle'),
        {
          body: t('overdueBody', { count: overdueTasks.length }),
          tag: 'overdue-tasks', // Prevents duplicate notifications
        }
      );
    }

    // Show notification for tasks due today (separate from overdue)
    if (dueTodayTasks.length > 0) {
      showNotification(
        t('dueTodayTitle'),
        {
          body: t('dueTodayBody', { count: dueTodayTasks.length }),
          tag: 'due-today-tasks',
        }
      );
    }
  }, [permission, showNotification, t]);

  return {
    permission,
    isSupported,
    requestPermission,
    checkOverdueTasks,
  };
}
