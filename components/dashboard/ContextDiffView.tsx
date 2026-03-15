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
import { toast } from 'sonner';
import { PricingGate } from './PricingGate';
import { getScanSnapshots } from '@/app/actions/context';
import type { PlanTier, ScanSnapshot, ScanData, ScanDependency, ScanApiRoute, ScanDbTable } from '@/types';

interface ContextDiffViewProps {
  projectId: string;
  currentPlan: PlanTier;
}

interface DiffItem {
  category: string;
  key: string;
  type: 'added' | 'removed' | 'changed';
  before?: string;
  after?: string;
}

// ─── Diff helpers ───

function diffArrays(category: string, keyPrefix: string, before: string[], after: string[]): DiffItem[] {
  const diffs: DiffItem[] = [];
  const bSet = new Set(before);
  const aSet = new Set(after);
  for (const item of after) {
    if (!bSet.has(item)) diffs.push({ category, key: `${keyPrefix}: ${item}`, type: 'added', after: item });
  }
  for (const item of before) {
    if (!aSet.has(item)) diffs.push({ category, key: `${keyPrefix}: ${item}`, type: 'removed', before: item });
  }
  return diffs;
}

function diffScalar(category: string, key: string, before: unknown, after: unknown): DiffItem | null {
  const b = before ?? null;
  const a = after ?? null;
  if (b === a) return null;
  if (b === null && a !== null) return { category, key, type: 'added', after: String(a) };
  if (b !== null && a === null) return { category, key, type: 'removed', before: String(b) };
  return { category, key, type: 'changed', before: String(b), after: String(a) };
}

function computeScanDiff(before: ScanData, after: ScanData): DiffItem[] {
  if (!before || !after) return [];
  const diffs: DiffItem[] = [];

  // Tech Stack (string[])
  diffs.push(...diffArrays('Tech Stack', 'Tech', before.techStack || [], after.techStack || []));

  // Package Manager / Node Version
  const pm = diffScalar('Tech Stack', 'Package Manager', before.packageManager, after.packageManager);
  if (pm) diffs.push(pm);
  const nv = diffScalar('Tech Stack', 'Node Version', before.nodeVersion, after.nodeVersion);
  if (nv) diffs.push(nv);

  // Dependencies
  const bDepPkgs = (before.dependencies || []).flatMap((d: ScanDependency) => d.packages || []);
  const aDepPkgs = (after.dependencies || []).flatMap((d: ScanDependency) => d.packages || []);
  diffs.push(...diffArrays('Dependencies', 'Package', bDepPkgs, aDepPkgs));
  const depTotal = diffScalar('Dependencies', 'Total count', before.depCount?.total, after.depCount?.total);
  if (depTotal) diffs.push(depTotal);

  // Pages
  const bPages = before.structure?.pages || [];
  const aPages = after.structure?.pages || [];
  diffs.push(...diffArrays('Routes', 'Page', bPages, aPages));

  // API Routes
  const bApi = (before.structure?.apiRoutes || []).map((r: ScanApiRoute) => `${r.method} ${r.path}`);
  const aApi = (after.structure?.apiRoutes || []).map((r: ScanApiRoute) => `${r.method} ${r.path}`);
  diffs.push(...diffArrays('Routes', 'API', bApi, aApi));

  // DB Tables
  const bTables = (before.structure?.dbTables || []).map((t: ScanDbTable) => `${t.name} (${t.columns} cols)`);
  const aTables = (after.structure?.dbTables || []).map((t: ScanDbTable) => `${t.name} (${t.columns} cols)`);
  diffs.push(...diffArrays('Database', 'Table', bTables, aTables));

  // Code Metrics
  const bm = before.codeMetrics || {};
  const am = after.codeMetrics || {};
  const files = diffScalar('Code Metrics', 'Total files', bm.totalFiles, am.totalFiles);
  if (files) diffs.push(files);
  const lines = diffScalar('Code Metrics', 'Total lines', bm.totalLines, am.totalLines);
  if (lines) diffs.push(lines);

  // Exports count
  const bExports = (before.exports || []).length;
  const aExports = (after.exports || []).length;
  const exp = diffScalar('Code Metrics', 'Exports', bExports, aExports);
  if (exp) diffs.push(exp);

  // Import graph file count
  const bGraph = (before.importGraph || []).length;
  const aGraph = (after.importGraph || []).length;
  const graph = diffScalar('Code Metrics', 'Files with imports', bGraph, aGraph);
  if (graph) diffs.push(graph);

  // Environment Variables
  diffs.push(...diffArrays('Environment', 'Env var', before.envVars || [], after.envVars || []));

  // Git
  const bg = before.git || {};
  const ag = after.git || {};
  const branch = diffScalar('Git', 'Branch', bg.branch, ag.branch);
  if (branch) diffs.push(branch);
  const commits = diffScalar('Git', 'Total commits', bg.totalCommits, ag.totalCommits);
  if (commits) diffs.push(commits);

  // Deployment
  const dp = diffScalar('Deployment', 'Platform', before.deployment?.platform, after.deployment?.platform);
  if (dp) diffs.push(dp);
  const ci = diffScalar('Deployment', 'CI', before.deployment?.ci, after.deployment?.ci);
  if (ci) diffs.push(ci);

  // Scripts
  const bScripts = Object.keys(before.scripts || {});
  const aScripts = Object.keys(after.scripts || {});
  diffs.push(...diffArrays('Scripts', 'Script', bScripts, aScripts));

  return diffs;
}

// ─── Formatting helpers ───

function formatSnapshotDate(iso: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DiffBadge({ type, t }: { type: DiffItem['type']; t: (key: string) => string }) {
  const variant = type === 'added' ? 'default' : type === 'removed' ? 'destructive' : 'secondary';
  return <Badge variant={variant} className="text-xs shrink-0">{t(type)}</Badge>;
}

// ─── Grouped diff display ───

function DiffCategory({ category, items, t }: { category: string; items: DiffItem[]; t: (key: string) => string }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{category}</h4>
      {items.map((diff) => (
        <div key={`${diff.category}-${diff.key}-${diff.type}`} className="flex items-center gap-2 p-2 rounded border text-sm">
          <DiffBadge type={diff.type} t={t} />
          <span className="font-mono text-xs truncate">{diff.key}</span>
          {diff.type === 'changed' && (
            <span className="text-muted-foreground ml-auto text-xs shrink-0">
              {diff.before} → {diff.after}
            </span>
          )}
          {diff.type === 'added' && (
            <span className="text-green-600 dark:text-green-400 ml-auto text-xs shrink-0">+ {diff.after}</span>
          )}
          {diff.type === 'removed' && (
            <span className="text-red-600 dark:text-red-400 ml-auto text-xs shrink-0 line-through">{diff.before}</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Summary bar ───

function DiffSummary({ diffs, t }: { diffs: DiffItem[]; t: ReturnType<typeof useTranslations> }) {
  const added = diffs.filter(d => d.type === 'added').length;
  const removed = diffs.filter(d => d.type === 'removed').length;
  const changed = diffs.filter(d => d.type === 'changed').length;

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground py-2 px-1">
      <span className="font-medium">{t('summaryChanges', { count: diffs.length })}</span>
      {added > 0 && <span className="text-green-600 dark:text-green-400">{t('summaryAdded', { count: added })}</span>}
      {removed > 0 && <span className="text-red-600 dark:text-red-400">{t('summaryRemoved', { count: removed })}</span>}
      {changed > 0 && <span className="text-amber-600 dark:text-amber-400">{t('summaryChanged', { count: changed })}</span>}
    </div>
  );
}

// ─── Main component ───

export function ContextDiffView({ projectId, currentPlan }: ContextDiffViewProps) {
  const t = useTranslations('contextDiff');
  const tCommon = useTranslations('common');
  const [snapshots, setSnapshots] = useState<ScanSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [beforeId, setBeforeId] = useState<string>('');
  const [afterId, setAfterId] = useState<string>('');
  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const data = await getScanSnapshots(projectId, 50);
        if (!cancelled) {
          setSnapshots(data);
          if (data.length >= 2) {
            setBeforeId(data[1].id);
            setAfterId(data[0].id);
          }
        }
      } catch {
        if (!cancelled) toast.error(tCommon('errorLoadSnapshots'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [projectId, tCommon]);

  const diffs = useMemo(() => {
    const before = snapshots.find((s) => s.id === beforeId);
    const after = snapshots.find((s) => s.id === afterId);
    if (!before || !after) return [];
    return computeScanDiff(before.scan_data as ScanData, after.scan_data as ScanData);
  }, [snapshots, beforeId, afterId]);

  // Group diffs by category, preserving order of first appearance
  const groupedDiffs = useMemo(() => {
    const groups: { category: string; items: DiffItem[] }[] = [];
    const seen = new Map<string, DiffItem[]>();
    for (const diff of diffs) {
      if (!seen.has(diff.category)) {
        const items: DiffItem[] = [];
        seen.set(diff.category, items);
        groups.push({ category: diff.category, items });
      }
      seen.get(diff.category)!.push(diff);
    }
    return groups;
  }, [diffs]);

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
            <>
              <DiffSummary diffs={diffs} t={t} />
              <div className="space-y-6">
                {groupedDiffs.map(({ category, items }) => (
                  <DiffCategory key={category} category={category} items={items} t={t} />
                ))}
              </div>
            </>
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
