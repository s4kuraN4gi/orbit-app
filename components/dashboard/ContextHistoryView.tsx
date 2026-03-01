'use client';

import React, { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bot, Terminal, PenLine, ChevronDown, ChevronRight, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PricingGate } from './PricingGate';
import { getContextHistory } from '@/app/actions/context';
import type { PlanTier } from '@/types';

interface ContextItem {
  id: string;
  source_tool: string;
  original_prompt: string;
  created_at: string;
  task_count: number;
}

interface ContextHistoryViewProps {
  projectId: string;
  currentPlan: PlanTier;
}

function SourceIcon({ tool }: { tool: string }) {
  switch (tool) {
    case 'Cursor':
      return <Terminal className="h-4 w-4" />;
    case 'Antigravity':
      return <Bot className="h-4 w-4" />;
    default:
      return <PenLine className="h-4 w-4" />;
  }
}

function formatDate(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function ContextTimelineItem({ item, index, currentPlan }: { item: ContextItem; index: number; currentPlan: PlanTier }) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations('contextHistory');

  const content = (
    <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className="mt-1 p-2 rounded-full bg-muted">
        <SourceIcon tool={item.source_tool} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-xs">{item.source_tool}</Badge>
          {item.task_count > 0 && (
            <Badge variant="outline" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              {item.task_count} {t('tasks')}
            </Badge>
          )}
          <span className="text-xs text-muted-foreground ml-auto shrink-0">
            {formatDate(item.created_at)}
          </span>
        </div>
        {item.original_prompt && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {expanded ? t('collapse') : t('expand')}
          </button>
        )}
        {expanded && item.original_prompt && (
          <pre className="mt-2 text-sm bg-muted/50 rounded p-3 whitespace-pre-wrap break-words max-h-64 overflow-y-auto">
            {item.original_prompt}
          </pre>
        )}
      </div>
    </div>
  );

  if (index >= 5) {
    return (
      <PricingGate feature="context_history" currentPlan={currentPlan} itemIndex={index}>
        {content}
      </PricingGate>
    );
  }

  return content;
}

export function ContextHistoryView({ projectId, currentPlan }: ContextHistoryViewProps) {
  const t = useTranslations('contextHistory');
  const [contexts, setContexts] = useState<ContextItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getContextHistory(projectId, 20)
      .then((data) => {
        if (!cancelled) setContexts(data);
      })
      .catch(() => toast.error('Failed to load context history'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        <p>{t('loading')}</p>
      </div>
    );
  }

  if (contexts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-muted-foreground gap-2">
        <Bot className="h-10 w-10 opacity-50" />
        <p>{t('empty')}</p>
        <p className="text-xs">{t('emptyHint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-2">
      <h3 className="text-sm font-medium text-muted-foreground mb-2">
        {t('title')} ({contexts.length})
      </h3>
      {contexts.map((item, index) => (
        <ContextTimelineItem
          key={item.id}
          item={item}
          index={index}
          currentPlan={currentPlan}
        />
      ))}
    </div>
  );
}
