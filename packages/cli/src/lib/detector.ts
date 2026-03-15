import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, relative, basename, dirname } from 'node:path';

export interface ScanResult {
  techStack: string[];
  nodeVersion: string | null;
  packageManager: string | null;
  dependencies: { category: string; packages: string[] }[];
  depCount: { total: number; dev: number };
  structure: {
    pages: string[];
    apiRoutes: { method: string; path: string }[];
    dbTables: { name: string; columns: number }[];
  };
  aiContext: {
    files: { name: string; path: string }[];
  };
  git: {
    branch: string;
    lastCommitDate: string | null;
    uncommittedChanges: number;
    totalCommits: number;
    recentCommits: number;
  } | null;
  codeMetrics: {
    totalFiles: number;
    totalLines: number;
    byDirectory: { dir: string; files: number }[];
    largestFiles: { path: string; lines: number }[];
  };
  exports: { file: string; name: string; kind: 'function' | 'component' | 'type' | 'const' }[];
  importGraph: { file: string; imports: string[] }[];
  scripts: Record<string, string>;
  deployment: {
    platform: string | null;
    ci: string | null;
  };
  envVars: string[];
}

const CATEGORY_MAP: Record<string, string> = {
  'react': 'UI', 'react-dom': 'UI', '@radix-ui': 'UI',
  'tailwindcss': 'UI', '@tailwindcss': 'UI', 'tailwind-merge': 'UI',
  'lucide-react': 'UI', 'class-variance-authority': 'UI', 'clsx': 'UI',
  'recharts': 'UI', 'gantt-task-react': 'UI', 'sonner': 'UI',
  'drizzle-orm': 'DB', '@neondatabase': 'DB',
  'better-auth': 'Auth',
  'next-intl': 'i18n',
  '@dnd-kit': 'DnD',
  'date-fns': 'Date', 'react-day-picker': 'Date',
  'ws': 'Realtime',
  'next': 'skip',
  'typescript': 'skip',
};

function categorize(pkg: string): string {
  if (CATEGORY_MAP[pkg]) return CATEGORY_MAP[pkg];
  for (const [prefix, cat] of Object.entries(CATEGORY_MAP)) {
    if (pkg.startsWith(prefix + '/') || pkg.startsWith(prefix + '-')) {
      return cat;
    }
  }
  return 'Other';
}

export async function readJson(path: string): Promise<unknown> {
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function readText(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

// Recursive glob (simple, avoids external dependency)
export const IGNORE_DIRS = new Set(['node_modules', '.next', 'dist', '.git', '.vercel', 'coverage']);

export async function globFiles(dir: string, pattern: RegExp, results: string[] = []): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (IGNORE_DIRS.has(entry.name)) continue;
        await globFiles(join(dir, entry.name), pattern, results);
      } else if (pattern.test(entry.name)) {
        results.push(join(dir, entry.name));
      }
    }
  } catch {
    // directory doesn't exist or no permission
  }
  return results;
}

function execGit(cmd: string, cwd: string): string | null {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

// ─── Structure: Pages ───
export async function scanPages(dir: string): Promise<string[]> {
  const files = await globFiles(join(dir, 'app'), /^page\.tsx?$/);
  return files.map(f => {
    let route = relative(join(dir, 'app'), dirname(f));
    // Remove route groups like (dashboard)
    route = route.replace(/\([^)]+\)\/?/g, '');
    return '/' + route.replace(/\\/g, '/');
  }).map(r => r === '/.' ? '/' : r.replace(/\/$/, '')).sort();
}

// ─── Structure: API Routes ───
export async function scanApiRoutes(dir: string): Promise<{ method: string; path: string }[]> {
  const files = await globFiles(join(dir, 'app', 'api'), /^route\.ts$/);
  const routes: { method: string; path: string }[] = [];
  const methodPattern = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)/g;

  for (const file of files) {
    const content = await readText(file);
    if (!content) continue;
    let routePath = '/' + relative(join(dir, 'app'), dirname(file)).replace(/\\/g, '/');
    routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1');

    let match;
    while ((match = methodPattern.exec(content)) !== null) {
      routes.push({ method: match[1], path: routePath });
    }
    methodPattern.lastIndex = 0;
  }
  return routes.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

// ─── Structure: DB Tables ───
export async function scanDbTables(dir: string): Promise<{ name: string; columns: number }[]> {
  // Find schema files
  const candidates = [
    join(dir, 'lib', 'schema.ts'),
    join(dir, 'src', 'lib', 'schema.ts'),
    join(dir, 'db', 'schema.ts'),
    join(dir, 'src', 'db', 'schema.ts'),
  ];

  let schemaContent: string | null = null;
  for (const c of candidates) {
    schemaContent = await readText(c);
    if (schemaContent) break;
  }
  if (!schemaContent) return [];

  const tables: { name: string; columns: number }[] = [];
  // Match pgTable('table_name', { ... })
  const tablePattern = /pgTable\(\s*['"](\w+)['"]\s*,\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
  let match;
  while ((match = tablePattern.exec(schemaContent)) !== null) {
    const tableName = match[1];
    const body = match[2];
    // Count column definitions (lines with : followed by column type)
    const columnCount = (body.match(/\w+\s*:/g) || []).length;
    tables.push({ name: tableName, columns: columnCount });
  }
  return tables;
}

// ─── AI Context Files ───
export function scanAiContext(dir: string): { files: { name: string; path: string }[] } {
  const checks: { name: string; path: string }[] = [
    { name: 'CLAUDE.md', path: 'CLAUDE.md' },
    { name: 'CLAUDE.md', path: '.claude/CLAUDE.md' },
    { name: 'AGENTS.md', path: 'AGENTS.md' },
    { name: '.cursorrules', path: '.cursorrules' },
    { name: '.cursor/rules/', path: '.cursor/rules' },
    { name: '.windsurfrules', path: '.windsurfrules' },
    { name: 'copilot-instructions.md', path: '.github/copilot-instructions.md' },
    { name: '.aider.conf.yml', path: '.aider.conf.yml' },
    { name: '.aiderignore', path: '.aiderignore' },
    { name: '.roomodes', path: '.roomodes' },
    { name: 'devin.json', path: '.devin/devin.json' },
  ];

  const found: { name: string; path: string }[] = [];
  for (const check of checks) {
    if (existsSync(join(dir, check.path))) {
      found.push(check);
    }
  }
  return { files: found };
}

// ─── Export Signatures ───
export async function scanExports(dir: string): Promise<ScanResult['exports']> {
  const files = await globFiles(dir, /\.(ts|tsx)$/);
  const results: ScanResult['exports'] = [];

  // Single-pass regex: matches all export forms in one scan
  const exportRegex = /export\s+(?:(default)\s+)?(?:(async)\s+)?(?:(function|const|type|interface)\s+)(\w+)/g;

  // HTTP method exports in API route files should be classified as 'function', not 'component'
  const HTTP_METHODS = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

  for (const file of files) {
    const content = await readText(file);
    if (!content) continue;
    const relPath = relative(dir, file).replace(/\\/g, '/');
    const seen = new Set<string>();
    const isApiRoute = /route\.(ts|js)$/.test(basename(file)) ||
      relPath.includes('api/') || relPath.includes('pages/api/');

    for (const m of content.matchAll(exportRegex)) {
      const isDefault = !!m[1];
      const keyword = m[3]; // function, const, type, interface
      const name = m[4];

      // Skip duplicates (e.g. export default function Foo after export function Foo)
      const key = `${name}:${keyword}`;
      if (isDefault && seen.has(key)) continue;
      seen.add(key);

      let kind: 'component' | 'function' | 'const' | 'type';
      if (keyword === 'type' || keyword === 'interface') {
        kind = 'type';
      } else if (isApiRoute && HTTP_METHODS.has(name)) {
        // API route handler exports (GET, POST, etc.) are functions, not components
        kind = 'function';
      } else if (keyword === 'function') {
        kind = /^[A-Z]/.test(name) ? 'component' : 'function';
      } else {
        // const
        kind = /^[A-Z]/.test(name) ? 'component' : 'const';
      }

      results.push({ file: relPath, name, kind });
    }
  }

  return results;
}

// ─── Import Graph ───
export async function scanImportGraph(dir: string): Promise<ScanResult['importGraph']> {
  const files = await globFiles(dir, /\.(ts|tsx)$/);
  const results: ScanResult['importGraph'] = [];

  // Match: import ... from '...' or import '...'
  const importPattern = /(?:import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;

  for (const file of files) {
    const content = await readText(file);
    if (!content) continue;
    const relPath = relative(dir, file).replace(/\\/g, '/');
    const imports: string[] = [];

    for (const m of content.matchAll(importPattern)) {
      const specifier = m[1] || m[2];
      if (!specifier) continue;
      // Only track local imports (starting with . or @/)
      if (specifier.startsWith('.') || specifier.startsWith('@/')) {
        imports.push(specifier);
      }
    }

    if (imports.length > 0) {
      results.push({ file: relPath, imports });
    }
  }

  return results;
}

// ─── Git Activity ───
export function scanGit(dir: string): ScanResult['git'] {
  if (!existsSync(join(dir, '.git'))) return null;

  const branch = execGit('git branch --show-current', dir) || 'unknown';
  const lastCommitDate = execGit('git log -1 --format=%ci', dir);
  const uncommittedRaw = execGit('git status --porcelain', dir);
  const uncommittedChanges = uncommittedRaw ? uncommittedRaw.split('\n').filter(Boolean).length : 0;
  const totalCommitsRaw = execGit('git rev-list --count HEAD', dir);
  const totalCommits = totalCommitsRaw ? parseInt(totalCommitsRaw, 10) : 0;
  const recentRaw = execGit('git log --since="7 days ago" --oneline', dir);
  const recentCommits = recentRaw ? recentRaw.split('\n').filter(Boolean).length : 0;

  return { branch, lastCommitDate, uncommittedChanges, totalCommits, recentCommits };
}

// ─── Code Metrics ───
export async function scanCodeMetrics(dir: string): Promise<ScanResult['codeMetrics']> {
  const files = await globFiles(dir, /\.(ts|tsx)$/);
  const fileData: { path: string; lines: number; dir: string }[] = [];

  for (const file of files) {
    const content = await readText(file);
    if (!content) continue;
    const lines = content.split('\n').length;
    const relPath = relative(dir, file).replace(/\\/g, '/');
    const topDir = relPath.split('/')[0];
    fileData.push({ path: relPath, lines, dir: topDir });
  }

  const totalFiles = fileData.length;
  const totalLines = fileData.reduce((sum, f) => sum + f.lines, 0);

  // By directory
  const dirMap = new Map<string, number>();
  for (const f of fileData) {
    dirMap.set(f.dir, (dirMap.get(f.dir) || 0) + 1);
  }
  const byDirectory = [...dirMap.entries()]
    .map(([dir, files]) => ({ dir, files }))
    .sort((a, b) => b.files - a.files);

  // Largest files (top 5)
  const largestFiles = [...fileData]
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 5)
    .map(f => ({ path: f.path, lines: f.lines }));

  return { totalFiles, totalLines, byDirectory, largestFiles };
}

// ─── Deployment Detection ───
export function scanDeployment(dir: string): ScanResult['deployment'] {
  let platform: string | null = null;
  if (existsSync(join(dir, '.vercel')) || existsSync(join(dir, 'vercel.json'))) platform = 'Vercel';
  else if (existsSync(join(dir, 'netlify.toml'))) platform = 'Netlify';
  else if (existsSync(join(dir, 'fly.toml'))) platform = 'Fly.io';
  else if (existsSync(join(dir, 'Dockerfile')) || existsSync(join(dir, 'docker-compose.yml'))) platform = 'Docker';
  else if (existsSync(join(dir, 'railway.toml'))) platform = 'Railway';

  let ci: string | null = null;
  if (existsSync(join(dir, '.github', 'workflows'))) ci = 'GitHub Actions';
  else if (existsSync(join(dir, '.gitlab-ci.yml'))) ci = 'GitLab CI';

  return { platform, ci };
}

// ─── Environment Variables (KEYS ONLY, never read .env values) ───
export async function scanEnvVars(dir: string): Promise<string[]> {
  // Try .env.example first (safe to read)
  const examplePath = join(dir, '.env.example');
  if (existsSync(examplePath)) {
    const content = await readText(examplePath);
    if (content) {
      const keys = content.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.split('=')[0].trim())
        .filter(Boolean);
      return [...new Set(keys)].sort();
    }
  }

  // Fallback: grep source for process.env references
  const sourceFiles = await globFiles(dir, /\.(ts|tsx)$/);
  const envPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
  const keys = new Set<string>();

  for (const file of sourceFiles) {
    const content = await readText(file);
    if (!content) continue;
    let match;
    while ((match = envPattern.exec(content)) !== null) {
      keys.add(match[1]);
    }
    envPattern.lastIndex = 0;
  }
  return [...keys].sort();
}

// ─── Tech Stack & Dependencies ───

export interface TechAndDeps {
  techStack: string[];
  nodeVersion: string | null;
  packageManager: string | null;
  dependencies: { category: string; packages: string[] }[];
  depCount: { total: number; dev: number };
  scripts: Record<string, string>;
}

export async function scanTechAndDeps(dir: string): Promise<TechAndDeps> {
  const pkg = await readJson(join(dir, 'package.json')) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    engines?: { node?: string };
    scripts?: Record<string, string>;
  } | null;

  const techStack: string[] = [];
  const allDeps = { ...pkg?.dependencies, ...pkg?.devDependencies };
  const prodDeps = pkg?.dependencies ?? {};
  const devDeps = pkg?.devDependencies ?? {};

  // Detect Next.js
  if (existsSync(join(dir, 'next.config.ts')) || existsSync(join(dir, 'next.config.js')) || existsSync(join(dir, 'next.config.mjs'))) {
    const ver = allDeps['next']?.replace(/[\^~]/, '') ?? '';
    techStack.push(ver ? `Next.js ${ver}` : 'Next.js');
  }

  // Detect React
  if (allDeps['react']) {
    const ver = allDeps['react'].replace(/[\^~]/, '');
    techStack.push(ver ? `React ${ver}` : 'React');
  }

  // Detect TypeScript
  if (existsSync(join(dir, 'tsconfig.json'))) {
    techStack.push('TypeScript');
  }

  // Detect Tailwind CSS
  if (existsSync(join(dir, 'tailwind.config.ts')) || existsSync(join(dir, 'tailwind.config.js')) || allDeps['tailwindcss'] || allDeps['@tailwindcss/vite']) {
    techStack.push('Tailwind CSS');
  }

  // Detect Drizzle ORM
  if (existsSync(join(dir, 'drizzle.config.ts')) || existsSync(join(dir, 'drizzle.config.js')) || allDeps['drizzle-orm']) {
    techStack.push('Drizzle ORM');
  }

  // Package manager
  let packageManager: string | null = null;
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) packageManager = 'pnpm';
  else if (existsSync(join(dir, 'yarn.lock'))) packageManager = 'yarn';
  else if (existsSync(join(dir, 'package-lock.json'))) packageManager = 'npm';
  else if (existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bun.lock'))) packageManager = 'bun';

  // Node version
  const nodeVersion: string | null = pkg?.engines?.node ?? null;

  // Categorize dependencies
  const catMap = new Map<string, string[]>();
  for (const dep of Object.keys(prodDeps)) {
    const cat = categorize(dep);
    if (cat === 'skip') continue;
    if (!catMap.has(cat)) catMap.set(cat, []);
    catMap.get(cat)!.push(dep);
  }
  const sorted = [...catMap.entries()].sort((a, b) => {
    if (a[0] === 'Other') return 1;
    if (b[0] === 'Other') return -1;
    return a[0].localeCompare(b[0]);
  });
  const dependencies = sorted.map(([category, packages]) => ({ category, packages }));
  const depCount = {
    total: Object.keys(prodDeps).length + Object.keys(devDeps).length,
    dev: Object.keys(devDeps).length,
  };
  const scripts = pkg?.scripts ?? {};

  return { techStack, nodeVersion, packageManager, dependencies, depCount, scripts };
}

// ─── Main ───
export async function scanProject(dir: string): Promise<ScanResult> {
  const techAndDeps = await scanTechAndDeps(dir);
  const { techStack, nodeVersion, packageManager, dependencies, depCount, scripts } = techAndDeps;

  // Run all scans in parallel
  const [pages, apiRoutes, dbTables, codeMetrics, envVars, exports, importGraph] = await Promise.all([
    scanPages(dir),
    scanApiRoutes(dir),
    scanDbTables(dir),
    scanCodeMetrics(dir),
    scanEnvVars(dir),
    scanExports(dir),
    scanImportGraph(dir),
  ]);

  const structure = { pages, apiRoutes, dbTables };
  const aiContext = scanAiContext(dir);
  const git = scanGit(dir);
  const deployment = scanDeployment(dir);

  return {
    techStack, nodeVersion, packageManager, dependencies, depCount,
    structure, aiContext, git, codeMetrics, exports, importGraph,
    scripts, deployment, envVars,
  };
}
