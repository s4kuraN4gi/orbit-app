'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { GitCompareArrows } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { PricingGate } from './PricingGate';
import { getScanSnapshots } from '@/app/actions/context';
import type { PlanTier, ScanSnapshot } from '@/types';

interface ContextDiffViewProps {
  projectId: string;
  currentPlan: PlanTier;
}

interface DiffItem {
  key: string;
  type: 'added' | 'removed' | 'changed';
  before?: string;
  after?: string;
}

function computeScanDiff(before: any, after: any): DiffItem[] {
  const diffs: DiffItem[] = [];
  if (!before || !after) return diffs;

  // Tech stack comparison
  const beforeStack = before.techStack || {};
  const afterStack = after.techStack || {};
  for (const key of new Set([...Object.keys(beforeStack), ...Object.keys(afterStack)])) {
    const bVal = JSON.stringify(beforeStack[key]);
    const aVal = JSON.stringify(afterStack[key]);
    if (bVal === undefined && aVal !== undefined) {
      diffs.push({ key: `techStack.${key}`, type: 'added', after: aVal });
    } else if (bVal !== undefined && aVal === undefined) {
      diffs.push({ key: `techStack.${key}`, type: 'removed', before: bVal });
    } else if (bVal !== aVal) {
      diffs.push({ key: `techStack.${key}`, type: 'changed', before: bVal, after: aVal });
    }
  }

  // Dependency count comparison
  const bDeps = before.dependencies?.total ?? 0;
  const aDeps = after.dependencies?.total ?? 0;
  if (bDeps !== aDeps) {
    diffs.push({ key: 'dependencies.total', type: 'changed', before: String(bDeps), after: String(aDeps) });
  }

  // Code metrics comparison
  const bMetrics = before.codeMetrics || {};
  const aMetrics = after.codeMetrics || {};
  for (const key of ['totalFiles', 'totalLines']) {
    if (bMetrics[key] !== aMetrics[key]) {
      diffs.push({
        key: `codeMetrics.${key}`,
        type: 'changed',
        before: String(bMetrics[key] ?? 0),
        after: String(aMetrics[key] ?? 0),
      });
    }
  }

  // Git branch comparison
  const bBranch = before.git?.branch;
  const aBranch = after.git?.branch;
  if (bBranch !== aBranch) {
    diffs.push({ key: 'git.branch', type: 'changed', before: bBranch || '—', after: aBranch || '—' });
  }

  return diffs;
}

function formatSnapshotDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DiffBadge({ type }: { type: DiffItem['type'] }) {
  const variant = type === 'added' ? 'default' : type === 'removed' ? 'destructive' : 'secondary';
  const label = type === 'added' ? 'Added' : type === 'removed' ? 'Removed' : 'Changed';
  return <Badge variant={variant} className="text-xs">{label}</Badge>;
}

export function ContextDiffView({ projectId, currentPlan }: ContextDiffViewProps) {
  const t = useTranslations('contextDiff');
  const [snapshots, setSnapshots] = useState<ScanSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [beforeId, setBeforeId] = useState<string>('');
  const [afterId, setAfterId] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getScanSnapshots(projectId, 50)
      .then((data) => {
        if (!cancelled) {
          setSnapshots(data);
          if (data.length >= 2) {
            setBeforeId(data[1].id);
            setAfterId(data[0].id);
          }
        }
      })
      .catch(console.error)
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [projectId]);

  const diffs = useMemo(() => {
    const before = snapshots.find((s) => s.id === beforeId);
    const after = snapshots.find((s) => s.id === afterId);
    if (!before || !after) return [];
    return computeScanDiff(before.scan_data, after.scan_data);
  }, [snapshots, beforeId, afterId]);

  const inner = (
    <div className="space-y-4 p-2">
      <div className="flex items-center gap-2 mb-2">
        <GitCompareArrows className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">{t('title')}</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <p>{t('loading')}</p>
        </div>
      ) : snapshots.length < 2 ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">
          <p>{t('notEnough')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">{t('before')}</Label>
              <Select value={beforeId} onValueChange={setBeforeId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {snapshots.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {formatSnapshotDate(s.created_at)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('after')}</Label>
              <Select value={afterId} onValueChange={setAfterId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {snapshots.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {formatSnapshotDate(s.created_at)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {diffs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {t('noDifferences')}
            </div>
          ) : (
            <div className="space-y-2">
              {diffs.map((diff) => (
                <div key={diff.key} className="flex items-center gap-2 p-2 rounded border text-sm">
                  <DiffBadge type={diff.type} />
                  <span className="font-mono text-xs">{diff.key}</span>
                  {diff.type === 'changed' && (
                    <span className="text-muted-foreground ml-auto text-xs">
                      {diff.before} → {diff.after}
                    </span>
                  )}
                  {diff.type === 'added' && (
                    <span className="text-green-600 ml-auto text-xs">{diff.after}</span>
                  )}
                  {diff.type === 'removed' && (
                    <span className="text-red-600 ml-auto text-xs line-through">{diff.before}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <PricingGate feature="context_diff" currentPlan={currentPlan}>
      {inner}
    </PricingGate>
  );
}
