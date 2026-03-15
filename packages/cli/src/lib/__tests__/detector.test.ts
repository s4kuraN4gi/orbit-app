/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { join } from 'node:path';

// ─── Mocks ───
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));
vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
}));
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

const mockReadFile = vi.mocked(readFile);
const mockReaddir = vi.mocked(readdir);
const mockExistsSync = vi.mocked(existsSync);
const mockExecSync = vi.mocked(execSync);

import {
  scanExports,
  scanImportGraph,
  scanDbTables,
  scanPages,
  scanApiRoutes,
  scanCodeMetrics,
  scanGit,
  readJson,
  readText,
  globFiles,
} from '../detector.js';

const ROOT = '/fake/project';

// Helper: set up readdir to return file entries for globFiles
function setupFiles(fileMap: Record<string, string>) {
  const dirs = new Map<string, { name: string; isDir: boolean }[]>();

  for (const filePath of Object.keys(fileMap)) {
    const parts = filePath.split('/').filter(Boolean);
    // Build directory tree
    for (let i = 0; i < parts.length - 1; i++) {
      // Build directory tree (simplified; we register each directory level)
      void i;
    }
  }

  // Group files by directory
  for (const filePath of Object.keys(fileMap)) {
    const dir = filePath.substring(0, filePath.lastIndexOf('/'));
    if (!dirs.has(dir)) dirs.set(dir, []);
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    dirs.get(dir)!.push({ name: fileName, isDir: false });
  }

  // Also register parent dirs for nested files
  const allDirs = new Set<string>();
  for (const filePath of Object.keys(fileMap)) {
    const parts = filePath.split('/');
    for (let i = 2; i < parts.length; i++) {
      allDirs.add(parts.slice(0, i).join('/'));
    }
  }
  for (const dir of allDirs) {
    const parent = dir.substring(0, dir.lastIndexOf('/'));
    if (!dirs.has(parent)) dirs.set(parent, []);
    const dirName = dir.substring(dir.lastIndexOf('/') + 1);
    // Add as directory entry if not already present
    const entries = dirs.get(parent)!;
    if (!entries.some(e => e.name === dirName && e.isDir)) {
      entries.push({ name: dirName, isDir: true });
    }
  }

  mockReaddir.mockImplementation(async (dirPath: unknown) => {
    const entries = dirs.get(String(dirPath)) || [];
    return entries.map(e => ({
      name: e.name,
      isDirectory: () => e.isDir,
      isFile: () => !e.isDir,
    })) as unknown as Awaited<ReturnType<typeof readdir>>;
  });

  mockReadFile.mockImplementation(async (filePath: unknown) => {
    const content = fileMap[String(filePath)];
    if (content === undefined) throw new Error(`ENOENT: ${filePath}`);
    return content;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockExistsSync.mockReturnValue(false);
});

// ─── readJson / readText ───
describe('readJson', () => {
  it('parses valid JSON file', async () => {
    mockReadFile.mockResolvedValueOnce('{"name":"test"}' as any);
    const result = await readJson('/some/file.json');
    expect(result).toEqual({ name: 'test' });
  });

  it('returns null for missing file', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
    const result = await readJson('/missing.json');
    expect(result).toBeNull();
  });
});

describe('readText', () => {
  it('reads file content', async () => {
    mockReadFile.mockResolvedValueOnce('hello world' as any);
    const result = await readText('/some/file.ts');
    expect(result).toBe('hello world');
  });

  it('returns null for missing file', async () => {
    mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));
    const result = await readText('/missing.ts');
    expect(result).toBeNull();
  });
});

// ─── scanExports ───
describe('scanExports', () => {
  it('detects exported functions (lowercase = function)', async () => {
    setupFiles({
      [`${ROOT}/lib/utils.ts`]: `
export function formatDate(d: Date) { return d.toISOString(); }
export async function fetchData() { return []; }
`,
    });
    const result = await scanExports(ROOT);
    const fns = result.filter(e => e.kind === 'function');
    expect(fns).toContainEqual({ file: 'lib/utils.ts', name: 'formatDate', kind: 'function' });
    expect(fns).toContainEqual({ file: 'lib/utils.ts', name: 'fetchData', kind: 'function' });
  });

  it('detects exported components (PascalCase = component)', async () => {
    setupFiles({
      [`${ROOT}/components/Button.tsx`]: `
export function Button() { return <button />; }
export const Card = () => <div />;
`,
    });
    const result = await scanExports(ROOT);
    const comps = result.filter(e => e.kind === 'component');
    expect(comps).toContainEqual({ file: 'components/Button.tsx', name: 'Button', kind: 'component' });
    expect(comps).toContainEqual({ file: 'components/Button.tsx', name: 'Card', kind: 'component' });
  });

  it('detects exported types', async () => {
    setupFiles({
      [`${ROOT}/types.ts`]: `
export type PlanTier = 'free' | 'pro';
export interface User { id: string; }
`,
    });
    const result = await scanExports(ROOT);
    const types = result.filter(e => e.kind === 'type');
    expect(types).toContainEqual({ file: 'types.ts', name: 'PlanTier', kind: 'type' });
    expect(types).toContainEqual({ file: 'types.ts', name: 'User', kind: 'type' });
  });

  it('detects export default function', async () => {
    setupFiles({
      [`${ROOT}/pages/Home.tsx`]: `
export default function HomePage() { return <div />; }
`,
    });
    const result = await scanExports(ROOT);
    expect(result).toContainEqual({ file: 'pages/Home.tsx', name: 'HomePage', kind: 'component' });
  });

  it('detects lowercase const as const kind', async () => {
    setupFiles({
      [`${ROOT}/lib/config.ts`]: `
export const maxRetries = 3;
`,
    });
    const result = await scanExports(ROOT);
    expect(result).toContainEqual({ file: 'lib/config.ts', name: 'maxRetries', kind: 'const' });
  });
});

// ─── scanImportGraph ───
describe('scanImportGraph', () => {
  it('tracks local imports (. and @/ prefixed)', async () => {
    setupFiles({
      [`${ROOT}/app/page.tsx`]: `
import { Button } from '@/components/ui/button';
import { cn } from '../lib/utils';
import React from 'react';
`,
    });
    const result = await scanImportGraph(ROOT);
    expect(result).toHaveLength(1);
    expect(result[0].file).toBe('app/page.tsx');
    expect(result[0].imports).toContain('@/components/ui/button');
    expect(result[0].imports).toContain('../lib/utils');
  });

  it('excludes external package imports', async () => {
    setupFiles({
      [`${ROOT}/lib/db.ts`]: `
import { drizzle } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';
`,
    });
    const result = await scanImportGraph(ROOT);
    // No local imports → should not appear or have empty imports
    expect(result).toHaveLength(0);
  });

  it('handles require() calls', async () => {
    setupFiles({
      [`${ROOT}/lib/legacy.ts`]: `
const utils = require('./utils');
const fs = require('fs');
`,
    });
    const result = await scanImportGraph(ROOT);
    expect(result).toHaveLength(1);
    expect(result[0].imports).toContain('./utils');
    expect(result[0].imports).not.toContain('fs');
  });
});

// ─── scanDbTables ───
describe('scanDbTables', () => {
  it('detects pgTable definitions', async () => {
    mockReadFile.mockImplementation(async (filePath: any) => {
      if (String(filePath).endsWith('schema.ts')) {
        return `
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const projects = pgTable('projects', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  userId: text('user_id').references(() => user.id),
});
` as any;
      }
      throw new Error('ENOENT');
    });

    const result = await scanDbTables(ROOT);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('user');
    expect(result[0].columns).toBe(4);
    expect(result[1].name).toBe('projects');
    expect(result[1].columns).toBe(3);
  });

  it('returns empty when no schema file exists', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));
    const result = await scanDbTables(ROOT);
    expect(result).toEqual([]);
  });
});

// ─── scanPages ───
describe('scanPages', () => {
  it('detects app router pages', async () => {
    setupFiles({
      [`${ROOT}/app/page.tsx`]: 'export default function Home() {}',
      [`${ROOT}/app/dashboard/page.tsx`]: 'export default function Dashboard() {}',
      [`${ROOT}/app/settings/page.tsx`]: 'export default function Settings() {}',
    });
    const result = await scanPages(ROOT);
    // Root page: relative('app', 'app') = '' → '/' → .replace(/\/$/, '') = ''
    expect(result).toContain('');
    expect(result).toContain('/dashboard');
    expect(result).toContain('/settings');
  });

  it('strips route groups like (dashboard)', async () => {
    setupFiles({
      [`${ROOT}/app/(dashboard)/overview/page.tsx`]: 'export default function Overview() {}',
    });
    const result = await scanPages(ROOT);
    expect(result).toContain('/overview');
  });
});

// ─── scanApiRoutes ───
describe('scanApiRoutes', () => {
  it('detects HTTP methods from route.ts files', async () => {
    setupFiles({
      [`${ROOT}/app/api/users/route.ts`]: `
export async function GET(req: Request) { return Response.json([]); }
export async function POST(req: Request) { return Response.json({}); }
`,
    });
    const result = await scanApiRoutes(ROOT);
    expect(result).toContainEqual({ method: 'GET', path: '/api/users' });
    expect(result).toContainEqual({ method: 'POST', path: '/api/users' });
  });

  it('converts dynamic segments [id] to :id', async () => {
    setupFiles({
      [`${ROOT}/app/api/users/[id]/route.ts`]: `
export function GET() { return Response.json({}); }
export function PATCH() { return Response.json({}); }
`,
    });
    const result = await scanApiRoutes(ROOT);
    expect(result).toContainEqual({ method: 'GET', path: '/api/users/:id' });
    expect(result).toContainEqual({ method: 'PATCH', path: '/api/users/:id' });
  });
});

// ─── scanCodeMetrics ───
describe('scanCodeMetrics', () => {
  it('counts files and lines correctly', async () => {
    setupFiles({
      [`${ROOT}/lib/utils.ts`]: 'line1\nline2\nline3',
      [`${ROOT}/lib/db.ts`]: 'line1\nline2',
      [`${ROOT}/components/Button.tsx`]: 'line1',
    });
    const result = await scanCodeMetrics(ROOT);
    expect(result.totalFiles).toBe(3);
    expect(result.totalLines).toBe(6); // 3 + 2 + 1
  });

  it('reports largest files sorted by line count', async () => {
    setupFiles({
      [`${ROOT}/small.ts`]: 'a',
      [`${ROOT}/big.ts`]: 'a\nb\nc\nd\ne\nf\ng\nh\ni\nj',
      [`${ROOT}/medium.ts`]: 'a\nb\nc\nd\ne',
    });
    const result = await scanCodeMetrics(ROOT);
    expect(result.largestFiles[0].path).toBe('big.ts');
    expect(result.largestFiles[0].lines).toBe(10);
  });

  it('groups files by top-level directory', async () => {
    setupFiles({
      [`${ROOT}/lib/a.ts`]: 'x',
      [`${ROOT}/lib/b.ts`]: 'x',
      [`${ROOT}/components/c.tsx`]: 'x',
    });
    const result = await scanCodeMetrics(ROOT);
    const libDir = result.byDirectory.find(d => d.dir === 'lib');
    expect(libDir?.files).toBe(2);
    const compDir = result.byDirectory.find(d => d.dir === 'components');
    expect(compDir?.files).toBe(1);
  });
});

// ─── scanGit ───
describe('scanGit', () => {
  it('returns null when .git does not exist', () => {
    mockExistsSync.mockReturnValue(false);
    const result = scanGit(ROOT);
    expect(result).toBeNull();
  });

  it('returns git info when .git exists', () => {
    mockExistsSync.mockImplementation((p: unknown) => String(p) === join(ROOT, '.git'));
    mockExecSync.mockImplementation((cmd: any) => {
      const c = String(cmd);
      if (c.includes('branch --show-current')) return 'main' as any;
      if (c.includes('log -1 --format=%ci')) return '2026-02-27 10:00:00 +0900' as any;
      if (c.includes('status --porcelain')) return 'M file.ts\nA new.ts' as any;
      if (c.includes('rev-list --count')) return '42' as any;
      if (c.includes('log --since')) return 'abc commit1\ndef commit2' as any;
      return '' as any;
    });

    const result = scanGit(ROOT);
    expect(result).not.toBeNull();
    expect(result!.branch).toBe('main');
    expect(result!.uncommittedChanges).toBe(2);
    expect(result!.totalCommits).toBe(42);
    expect(result!.recentCommits).toBe(2);
  });
});

// ─── globFiles ───
describe('globFiles', () => {
  it('skips node_modules and other ignored dirs', async () => {
    mockReaddir.mockImplementation(async (dirPath: unknown) => {
      const p = String(dirPath);
      if (p === ROOT) {
        return [
          { name: 'lib', isDirectory: () => true, isFile: () => false },
          { name: 'node_modules', isDirectory: () => true, isFile: () => false },
          { name: 'index.ts', isDirectory: () => false, isFile: () => true },
        ] as unknown as Awaited<ReturnType<typeof readdir>>;
      }
      if (p === join(ROOT, 'lib')) {
        return [
          { name: 'utils.ts', isDirectory: () => false, isFile: () => true },
        ] as unknown as Awaited<ReturnType<typeof readdir>>;
      }
      return [] as unknown as Awaited<ReturnType<typeof readdir>>;
    });

    const result = await globFiles(ROOT, /\.ts$/);
    expect(result).toContain(join(ROOT, 'index.ts'));
    expect(result).toContain(join(ROOT, 'lib', 'utils.ts'));
    // node_modules should be skipped
    expect(result.some(f => f.includes('node_modules'))).toBe(false);
  });
});
