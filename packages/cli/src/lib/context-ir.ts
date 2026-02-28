import type { ScanResult } from './detector.js';
import type { Task } from '../types.js';
import type { FocusArea } from './task-focus.js';
import type { ExternalIssue } from './issue-providers/types.js';

// ─── Sub-types ───

export interface Layer {
  type: 'pages' | 'api' | 'db' | 'lib' | 'components';
  items: string[];
}

export interface Edge {
  from: string;
  to: string;
}

export interface TaskSummary {
  id: string;
  title: string;
  status: string;
  priority: string;
}

export interface ModuleSummary {
  path: string;
  exports: { name: string; kind: string }[];
  imports: string[];
  importedBy: number;
}

// ─── ContextIR ───

export interface ContextIR {
  version: '1.0';
  generatedAt: string;
  project: {
    name: string;
    techStack: string[];
    packageManager: string | null;
    nodeVersion: string | null;
  };
  architecture: {
    layers: Layer[];
    importGraph: Edge[];
    hubModules: { path: string; importedBy: number }[];
  };
  activeWork: {
    tasks: TaskSummary[];
    externalIssues?: ExternalIssue[];
    git: {
      branch: string;
      uncommittedChanges: number;
      recentCommits: number;
      totalCommits: number;
    } | null;
  };
  codeMap: {
    modules: ModuleSummary[];
    entryPoints: string[];
    totalFiles: number;
    totalLines: number;
    largestFiles: { path: string; lines: number }[];
  };
  constraints: {
    envVars: string[];
    deployTarget: string | null;
    ci: string | null;
    scripts: Record<string, string>;
  };
  aiContext: {
    existingFiles: { name: string; path: string }[];
  };
  focusAreas?: FocusArea[];
}

// ─── Builder ───

export function buildContextIR(
  scan: ScanResult,
  tasks: Task[],
  projectName: string,
): ContextIR {
  const now = new Date().toISOString();

  // ── Architecture layers ──
  const layers: Layer[] = [];

  if (scan.structure.pages.length > 0) {
    layers.push({ type: 'pages', items: scan.structure.pages });
  }
  if (scan.structure.apiRoutes.length > 0) {
    layers.push({
      type: 'api',
      items: scan.structure.apiRoutes.map(r => `${r.method} ${r.path}`),
    });
  }
  if (scan.structure.dbTables.length > 0) {
    layers.push({
      type: 'db',
      items: scan.structure.dbTables.map(t => t.name),
    });
  }

  // ── Import graph edges + hub calculation ──
  const edges: Edge[] = [];
  const importedByCount = new Map<string, number>();

  for (const entry of scan.importGraph) {
    for (const imp of entry.imports) {
      edges.push({ from: entry.file, to: imp });
      importedByCount.set(imp, (importedByCount.get(imp) || 0) + 1);
    }
  }

  const hubModules = [...importedByCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, importedBy]) => ({ path, importedBy }));

  // ── Modules ──
  const moduleMap = new Map<string, ModuleSummary>();

  for (const exp of scan.exports) {
    if (!moduleMap.has(exp.file)) {
      moduleMap.set(exp.file, {
        path: exp.file,
        exports: [],
        imports: [],
        importedBy: 0,
      });
    }
    moduleMap.get(exp.file)!.exports.push({ name: exp.name, kind: exp.kind });
  }

  for (const entry of scan.importGraph) {
    if (!moduleMap.has(entry.file)) {
      moduleMap.set(entry.file, {
        path: entry.file,
        exports: [],
        imports: [],
        importedBy: 0,
      });
    }
    moduleMap.get(entry.file)!.imports = entry.imports;
  }

  for (const [path, count] of importedByCount) {
    if (moduleMap.has(path)) {
      moduleMap.get(path)!.importedBy = count;
    }
  }

  const modules = [...moduleMap.values()];

  // ── Entry points (pages) ──
  const entryPoints = scan.structure.pages;

  // ── Tasks ──
  const taskSummaries: TaskSummary[] = tasks.map(t => ({
    id: t.id,
    title: t.title,
    status: t.status,
    priority: t.priority,
  }));

  // ── Git ──
  const git = scan.git
    ? {
        branch: scan.git.branch,
        uncommittedChanges: scan.git.uncommittedChanges,
        recentCommits: scan.git.recentCommits,
        totalCommits: scan.git.totalCommits,
      }
    : null;

  return {
    version: '1.0',
    generatedAt: now,
    project: {
      name: projectName,
      techStack: scan.techStack,
      packageManager: scan.packageManager,
      nodeVersion: scan.nodeVersion,
    },
    architecture: {
      layers,
      importGraph: edges,
      hubModules,
    },
    activeWork: {
      tasks: taskSummaries,
      git,
    },
    codeMap: {
      modules,
      entryPoints,
      totalFiles: scan.codeMetrics.totalFiles,
      totalLines: scan.codeMetrics.totalLines,
      largestFiles: scan.codeMetrics.largestFiles,
    },
    constraints: {
      envVars: scan.envVars,
      deployTarget: scan.deployment.platform,
      ci: scan.deployment.ci,
      scripts: scan.scripts,
    },
    aiContext: {
      existingFiles: scan.aiContext.files,
    },
  };
}
