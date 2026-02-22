'use client';

import { useEffect, useCallback } from 'react';

export interface ShortcutHandlers {
  onNewTask?: () => void;
  onSearch?: () => void;
  onViewList?: () => void;
  onViewBoard?: () => void;
  onViewGantt?: () => void;
  onCloseModal?: () => void;
  onShowShortcuts?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled: boolean = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in inputs
    const target = event.target as HTMLElement;
    const isInputField = 
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.isContentEditable;

    // Always allow Escape
    if (event.key === 'Escape') {
      handlers.onCloseModal?.();
      return;
    }

    // Don't trigger other shortcuts when in input fields
    if (isInputField) return;

    // Don't trigger if modifier keys are pressed (except for Shift)
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    switch (event.key.toLowerCase()) {
      case 'n':
        event.preventDefault();
        handlers.onNewTask?.();
        break;
      case '/':
        event.preventDefault();
        handlers.onSearch?.();
        break;
      case '1':
        event.preventDefault();
        handlers.onViewList?.();
        break;
      case '2':
        event.preventDefault();
        handlers.onViewBoard?.();
        break;
      case '3':
        event.preventDefault();
        handlers.onViewGantt?.();
        break;
      case '?':
        event.preventDefault();
        handlers.onShowShortcuts?.();
        break;
    }
  }, [handlers]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}
