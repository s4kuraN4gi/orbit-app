import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

export interface ScanResult {
  techStack: string[];
  nodeVersion: string | null;
  packageManager: string | null;
  dependencies: { category: string; packages: string[] }[];
  depCount: { total: number; dev: number };
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

async function readJson(path: string): Promise<any> {
  try {
    const raw = await readFile(path, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function scanProject(dir: string): Promise<ScanResult> {
  const pkg = await readJson(join(dir, 'package.json'));

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

  // Categorize dependencies (prod only, skip devDependencies for display)
  const catMap = new Map<string, string[]>();
  for (const dep of Object.keys(prodDeps)) {
    const cat = categorize(dep);
    if (cat === 'skip') continue;
    if (!catMap.has(cat)) catMap.set(cat, []);
    catMap.get(cat)!.push(dep);
  }

  // Sort: named categories first (alphabetical), "Other" last
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

  return { techStack, nodeVersion, packageManager, dependencies, depCount };
}
