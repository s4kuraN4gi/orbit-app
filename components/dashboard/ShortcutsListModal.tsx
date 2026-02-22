'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslations } from 'next-intl';
import { Command, LayoutList, KanbanSquare, GanttChart, Search, Plus } from "lucide-react";

interface ShortcutsListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsListModal({ open, onOpenChange }: ShortcutsListModalProps) {
  const t = useTranslations('shortcuts');

  const shortcuts = [
    { key: 'N', description: t('newTask'), icon: <Plus className="h-4 w-4" /> },
    { key: '/', description: t('search'), icon: <Search className="h-4 w-4" /> },
    { key: '1', description: t('viewList'), icon: <LayoutList className="h-4 w-4" /> },
    { key: '2', description: t('viewBoard'), icon: <KanbanSquare className="h-4 w-4" /> },
    { key: '3', description: t('viewGantt'), icon: <GanttChart className="h-4 w-4" /> },
    { key: '?', description: t('showShortcuts'), icon: <span className="font-bold text-xs">?</span> },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Command className="h-5 w-5" />
            {t('title')}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            {shortcuts.map((shortcut) => (
              <div
                key={shortcut.key}
                className="flex items-center justify-between p-3 rounded-lg border bg-slate-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-md shadow-sm border text-slate-500">
                    {shortcut.icon}
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {shortcut.description}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="pointer-events-none inline-flex h-6 select-none items-center gap-1 rounded border bg-white px-2.5 font-mono text-[11px] font-medium text-slate-500 shadow-sm opacity-100">
                    <span className="text-xs">{shortcut.key}</span>
                  </kbd>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
