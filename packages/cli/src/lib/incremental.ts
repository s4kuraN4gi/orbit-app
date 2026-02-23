import {
  scanPages,
  scanApiRoutes,
  scanDbTables,
  scanAiContext,
  scanExports,
  scanImportGraph,
  scanGit,
  scanCodeMetrics,
  scanDeployment,
  scanEnvVars,
  scanTechAndDeps,
} from './detector.js';
import type { ScanResult } from './detector.js';

// ─── Change classification ───

export type ChangeCategory =
  | 'package'
  | 'schema'
  | 'page'
  | 'apiRoute'
  | 'tsAdded'
  | 'tsChanged'
  | 'tsDeleted'
  | 'envExample'
  | 'deploy'
  | 'aiContext'
  | 'other';

export interface ChangeEvent {
  path: string;
  type: 'add' | 'change' | 'unlink';
}

export interface RescanScope {
  techStack: boolean;
  pages: boolean;
  apiRoutes: boolean;
  dbTables: boolean;
  codeMetrics: boolean;
  exports: boolean;
  importGraph: boolean;
  envVars: boolean;
  deployment: boolean;
  aiContext: boolean;
}

const DEPLOY_FILES = new Set([
  'vercel.json', 'netlify.toml', 'fly.toml',
  'Dockerfile', 'docker-compose.yml', 'railway.toml',
]);

const AI_CONTEXT_FILES = new Set([
  'CLAUDE.md', 'AGENTS.md', '.cursorrules', '.windsurfrules',
  'copilot-instructions.md', '.aider.conf.yml', '.aiderignore',
  '.roomodes', 'devin.json',
]);

export function classifyChange(filePath: string): ChangeCategory {
  const normalized = filePath.replace(/\\/g, '/');
  const base = normalized.split('/').pop() ?? '';

  if (base === 'package.json') return 'package';
  if (base === 'schema.ts' && (normalized.includes('/lib/') || normalized.includes('/db/'))) return 'schema';
  if (base === 'page.tsx' || base === 'page.ts') return 'page';
  if (base === 'route.ts' && normalized.includes('/api/')) return 'apiRoute';
  if (base === '.env.example') return 'envExample';
  if (DEPLOY_FILES.has(base)) return 'deploy';
  if (AI_CONTEXT_FILES.has(base)) return 'aiContext';
  if (/\.(ts|tsx)$/.test(base)) return 'tsChanged'; // default for ts files

  return 'other';
}

export function computeRescanScope(changes: ChangeEvent[]): RescanScope {
  const scope: RescanScope = {
    techStack: false,
    pages: false,
    apiRoutes: false,
    dbTables: false,
    codeMetrics: false,
    exports: false,
    importGraph: false,
    envVars: false,
    deployment: false,
    aiContext: false,
  };

  for (const change of changes) {
    const cat = classifyChange(change.path);

    // Override category for ts add/delete
    const effectiveCat = /\.(ts|tsx)$/.test(change.path) && (change.type === 'add' || change.type === 'unlink')
      ? (change.type === 'add' ? 'tsAdded' : 'tsDeleted')
      : cat;

    switch (effectiveCat) {
      case 'package':
        scope.techStack = true;
        scope.envVars = true;
        break;
      case 'schema':
        scope.dbTables = true;
        break;
      case 'page':
        scope.pages = true;
        break;
      case 'apiRoute':
        scope.apiRoutes = true;
        break;
      case 'tsAdded':
      case 'tsDeleted':
        scope.codeMetrics = true;
        scope.exports = true;
        scope.importGraph = true;
        break;
      case 'tsChanged':
        scope.exports = true;
        scope.importGraph = true;
        break;
      case 'envExample':
        scope.envVars = true;
        break;
      case 'deploy':
        scope.deployment = true;
        break;
      case 'aiContext':
        scope.aiContext = true;
        break;
    }
  }

  return scope;
}

export async function incrementalScan(
  dir: string,
  prev: ScanResult,
  scope: RescanScope,
): Promise<ScanResult> {
  const result = { ...prev };

  // Git is always re-fetched
  result.git = scanGit(dir);

  const promises: Promise<void>[] = [];

  if (scope.techStack) {
    promises.push(
      scanTechAndDeps(dir).then(td => {
        result.techStack = td.techStack;
        result.nodeVersion = td.nodeVersion;
        result.packageManager = td.packageManager;
        result.dependencies = td.dependencies;
        result.depCount = td.depCount;
        result.scripts = td.scripts;
      }),
    );
  }

  if (scope.pages) {
    promises.push(scanPages(dir).then(p => { result.structure = { ...result.structure, pages: p }; }));
  }

  if (scope.apiRoutes) {
    promises.push(scanApiRoutes(dir).then(r => { result.structure = { ...result.structure, apiRoutes: r }; }));
  }

  if (scope.dbTables) {
    promises.push(scanDbTables(dir).then(t => { result.structure = { ...result.structure, dbTables: t }; }));
  }

  if (scope.codeMetrics) {
    promises.push(scanCodeMetrics(dir).then(m => { result.codeMetrics = m; }));
  }

  if (scope.exports) {
    promises.push(scanExports(dir).then(e => { result.exports = e; }));
  }

  if (scope.importGraph) {
    promises.push(scanImportGraph(dir).then(g => { result.importGraph = g; }));
  }

  if (scope.envVars) {
    promises.push(scanEnvVars(dir).then(v => { result.envVars = v; }));
  }

  if (scope.deployment) {
    result.deployment = scanDeployment(dir);
  }

  if (scope.aiContext) {
    result.aiContext = scanAiContext(dir);
  }

  await Promise.all(promises);

  return result;
}
