import { describe, it, expect } from 'vitest';
import { buildContextIR } from '../context-ir.js';
import type { ScanResult } from '../detector.js';
import type { Task } from '../../types.js';

// ─── Fixtures ───

function makeScanResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    techStack: ['Next.js', 'React', 'TypeScript'],
    nodeVersion: '20.11.0',
    packageManager: 'pnpm',
    dependencies: [
      { category: 'UI', packages: ['react', 'react-dom'] },
      { category: 'DB', packages: ['drizzle-orm'] },
    ],
    depCount: { total: 10, dev: 5 },
    structure: {
      pages: ['/dashboard', '/login', '/settings'],
      apiRoutes: [
        { method: 'GET', path: '/api/projects' },
        { method: 'POST', path: '/api/projects' },
        { method: 'GET', path: '/api/tasks' },
      ],
      dbTables: [
        { name: 'users', columns: 5 },
        { name: 'projects', columns: 4 },
        { name: 'tasks', columns: 8 },
      ],
    },
    aiContext: {
      files: [
        { name: 'CLAUDE.md', path: './CLAUDE.md' },
        { name: '.cursorrules', path: './.cursorrules' },
      ],
    },
    git: {
      branch: 'main',
      lastCommitDate: '2026-02-28',
      uncommittedChanges: 3,
      totalCommits: 150,
      recentCommits: 12,
    },
    codeMetrics: {
      totalFiles: 80,
      totalLines: 9500,
      byDirectory: [
        { dir: 'app', files: 20 },
        { dir: 'components', files: 30 },
        { dir: 'lib', files: 15 },
      ],
      largestFiles: [
        { path: 'components/TaskList.tsx', lines: 580 },
        { path: 'lib/detector.ts', lines: 490 },
        { path: 'lib/renderers.ts', lines: 410 },
      ],
    },
    exports: [
      { file: 'lib/utils.ts', name: 'cn', kind: 'function' },
      { file: 'lib/utils.ts', name: 'formatDate', kind: 'function' },
      { file: 'components/Button.tsx', name: 'Button', kind: 'component' },
      { file: 'types/index.ts', name: 'Task', kind: 'type' },
      { file: 'types/index.ts', name: 'Project', kind: 'type' },
    ],
    importGraph: [
      { file: 'app/page.tsx', imports: ['lib/utils.ts', 'components/Button.tsx'] },
      { file: 'app/dashboard/page.tsx', imports: ['lib/utils.ts', 'types/index.ts'] },
      { file: 'components/Button.tsx', imports: ['lib/utils.ts'] },
      { file: 'lib/db.ts', imports: ['lib/schema.ts'] },
    ],
    scripts: {
      dev: 'next dev',
      build: 'next build',
      test: 'vitest run',
    },
    deployment: {
      platform: 'Vercel',
      ci: 'GitHub Actions',
    },
    envVars: ['DATABASE_URL', 'BETTER_AUTH_URL'],
    ...overrides,
  };
}

function makeTasks(overrides?: Partial<Task>[]): Task[] {
  const defaults: Task[] = [
    {
      id: 'task-001-abcdef1234567',
      project_id: 'proj-1',
      parent_id: null,
      title: 'Implement auth flow',
      description: 'Add login/logout',
      status: 'in_progress',
      priority: 'high',
      start_date: '2026-02-25',
      due_date: '2026-03-05',
      created_at: '2026-02-20',
    },
    {
      id: 'task-002-bcdef2345678',
      project_id: 'proj-1',
      parent_id: null,
      title: 'Add dashboard charts',
      description: 'Charts for metrics',
      status: 'todo',
      priority: 'medium',
      start_date: null,
      due_date: null,
      created_at: '2026-02-21',
    },
    {
      id: 'task-003-cdef3456789a',
      project_id: 'proj-1',
      parent_id: null,
      title: 'Write unit tests',
      description: '',
      status: 'done',
      priority: 'low',
      start_date: null,
      due_date: null,
      created_at: '2026-02-18',
    },
  ];

  if (overrides) {
    return overrides.map((o, i) => ({ ...defaults[i % defaults.length], ...o }));
  }
  return defaults;
}

// ─── Tests ───

describe('buildContextIR', () => {
  describe('basic structure', () => {
    it('sets version to 1.0', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.version).toBe('1.0');
    });

    it('sets generatedAt to an ISO string', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.generatedAt).toBeTruthy();
      // Should be a valid ISO date string
      expect(() => new Date(ir.generatedAt)).not.toThrow();
      expect(new Date(ir.generatedAt).toISOString()).toBe(ir.generatedAt);
    });

    it('sets project name from argument', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'MyApp');
      expect(ir.project.name).toBe('MyApp');
    });

    it('sets project techStack from scan', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.project.techStack).toEqual(['Next.js', 'React', 'TypeScript']);
    });

    it('sets packageManager from scan', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.project.packageManager).toBe('pnpm');
    });

    it('sets nodeVersion from scan', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.project.nodeVersion).toBe('20.11.0');
    });
  });

  describe('architecture.layers', () => {
    it('maps pages to a pages Layer', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      const pagesLayer = ir.architecture.layers.find(l => l.type === 'pages');
      expect(pagesLayer).toBeDefined();
      expect(pagesLayer!.items).toEqual(['/dashboard', '/login', '/settings']);
    });

    it('maps apiRoutes to an api Layer with "METHOD path" format', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      const apiLayer = ir.architecture.layers.find(l => l.type === 'api');
      expect(apiLayer).toBeDefined();
      expect(apiLayer!.items).toEqual([
        'GET /api/projects',
        'POST /api/projects',
        'GET /api/tasks',
      ]);
    });

    it('maps dbTables to a db Layer with table names', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      const dbLayer = ir.architecture.layers.find(l => l.type === 'db');
      expect(dbLayer).toBeDefined();
      expect(dbLayer!.items).toEqual(['users', 'projects', 'tasks']);
    });

    it('omits empty layers', () => {
      const scan = makeScanResult({
        structure: { pages: [], apiRoutes: [], dbTables: [] },
      });
      const ir = buildContextIR(scan, makeTasks(), 'TestProject');
      expect(ir.architecture.layers).toEqual([]);
    });

    it('includes only non-empty layers', () => {
      const scan = makeScanResult({
        structure: {
          pages: ['/home'],
          apiRoutes: [],
          dbTables: [{ name: 'users', columns: 3 }],
        },
      });
      const ir = buildContextIR(scan, makeTasks(), 'TestProject');
      expect(ir.architecture.layers).toHaveLength(2);
      expect(ir.architecture.layers.map(l => l.type)).toEqual(['pages', 'db']);
    });
  });

  describe('architecture.importGraph', () => {
    it('constructs Edge[] from scan importGraph entries', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.architecture.importGraph).toContainEqual({
        from: 'app/page.tsx',
        to: 'lib/utils.ts',
      });
      expect(ir.architecture.importGraph).toContainEqual({
        from: 'app/page.tsx',
        to: 'components/Button.tsx',
      });
      expect(ir.architecture.importGraph).toContainEqual({
        from: 'lib/db.ts',
        to: 'lib/schema.ts',
      });
    });

    it('creates one edge per import', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      // The fixture has 4 entries with 2+2+1+1 = 6 total imports
      expect(ir.architecture.importGraph).toHaveLength(6);
    });
  });

  describe('architecture.hubModules', () => {
    it('sorts by importedBy count descending', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      const hubs = ir.architecture.hubModules;
      // lib/utils.ts is imported by 3 files (page.tsx, dashboard/page.tsx, Button.tsx)
      expect(hubs[0].path).toBe('lib/utils.ts');
      expect(hubs[0].importedBy).toBe(3);
    });

    it('is capped at 10 entries', () => {
      // Create a scan with 15 unique import targets
      const importGraph = Array.from({ length: 15 }, (_, i) => ({
        file: `src/consumer-${i}.ts`,
        imports: [`src/hub-${i}.ts`],
      }));
      // Add extra imports to the first few to differentiate counts
      for (let i = 0; i < 15; i++) {
        importGraph.push({
          file: `src/extra-${i}.ts`,
          imports: [`src/hub-${i}.ts`],
        });
      }
      const scan = makeScanResult({ importGraph });
      const ir = buildContextIR(scan, makeTasks(), 'TestProject');
      expect(ir.architecture.hubModules.length).toBeLessThanOrEqual(10);
    });

    it('includes correct importedBy counts', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      const hubs = ir.architecture.hubModules;
      const utilsHub = hubs.find(h => h.path === 'lib/utils.ts');
      expect(utilsHub).toBeDefined();
      expect(utilsHub!.importedBy).toBe(3);
    });
  });

  describe('activeWork.tasks', () => {
    it('maps tasks to TaskSummary format', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.activeWork.tasks).toHaveLength(3);
      expect(ir.activeWork.tasks[0]).toEqual({
        id: 'task-001-abcdef1234567',
        title: 'Implement auth flow',
        status: 'in_progress',
        priority: 'high',
      });
    });

    it('preserves all task statuses', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      const statuses = ir.activeWork.tasks.map(t => t.status);
      expect(statuses).toEqual(['in_progress', 'todo', 'done']);
    });

    it('handles empty task array', () => {
      const ir = buildContextIR(makeScanResult(), [], 'TestProject');
      expect(ir.activeWork.tasks).toEqual([]);
    });
  });

  describe('activeWork.git', () => {
    it('includes git info when present in scan', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.activeWork.git).not.toBeNull();
      expect(ir.activeWork.git).toEqual({
        branch: 'main',
        uncommittedChanges: 3,
        recentCommits: 12,
        totalCommits: 150,
      });
    });

    it('sets git to null when scan has no git data', () => {
      const scan = makeScanResult({ git: null });
      const ir = buildContextIR(scan, makeTasks(), 'TestProject');
      expect(ir.activeWork.git).toBeNull();
    });
  });

  describe('codeMap.modules', () => {
    it('creates modules from exports', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      const utilsModule = ir.codeMap.modules.find(m => m.path === 'lib/utils.ts');
      expect(utilsModule).toBeDefined();
      expect(utilsModule!.exports).toEqual([
        { name: 'cn', kind: 'function' },
        { name: 'formatDate', kind: 'function' },
      ]);
    });

    it('attaches imports from importGraph', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      const pageModule = ir.codeMap.modules.find(m => m.path === 'app/page.tsx');
      expect(pageModule).toBeDefined();
      expect(pageModule!.imports).toEqual(['lib/utils.ts', 'components/Button.tsx']);
    });

    it('computes importedBy count correctly', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      const utilsModule = ir.codeMap.modules.find(m => m.path === 'lib/utils.ts');
      expect(utilsModule).toBeDefined();
      // lib/utils.ts is imported by page.tsx, dashboard/page.tsx, and Button.tsx
      expect(utilsModule!.importedBy).toBe(3);
    });

    it('creates modules for files that only appear in importGraph (no exports)', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      const dbModule = ir.codeMap.modules.find(m => m.path === 'lib/db.ts');
      expect(dbModule).toBeDefined();
      expect(dbModule!.exports).toEqual([]);
      expect(dbModule!.imports).toEqual(['lib/schema.ts']);
    });
  });

  describe('codeMap.entryPoints', () => {
    it('includes pages as entry points', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.codeMap.entryPoints).toEqual(['/dashboard', '/login', '/settings']);
    });
  });

  describe('codeMap metrics', () => {
    it('includes totalFiles and totalLines from scan', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.codeMap.totalFiles).toBe(80);
      expect(ir.codeMap.totalLines).toBe(9500);
    });

    it('includes largestFiles from scan', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.codeMap.largestFiles).toEqual([
        { path: 'components/TaskList.tsx', lines: 580 },
        { path: 'lib/detector.ts', lines: 490 },
        { path: 'lib/renderers.ts', lines: 410 },
      ]);
    });
  });

  describe('constraints', () => {
    it('includes envVars from scan', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.constraints.envVars).toEqual(['DATABASE_URL', 'BETTER_AUTH_URL']);
    });

    it('includes scripts from scan', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.constraints.scripts).toEqual({
        dev: 'next dev',
        build: 'next build',
        test: 'vitest run',
      });
    });

    it('includes deployTarget from scan', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.constraints.deployTarget).toBe('Vercel');
    });

    it('includes ci from scan', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.constraints.ci).toBe('GitHub Actions');
    });

    it('handles null deployment values', () => {
      const scan = makeScanResult({
        deployment: { platform: null, ci: null },
      });
      const ir = buildContextIR(scan, makeTasks(), 'TestProject');
      expect(ir.constraints.deployTarget).toBeNull();
      expect(ir.constraints.ci).toBeNull();
    });
  });

  describe('aiContext', () => {
    it('includes existing AI context files', () => {
      const ir = buildContextIR(makeScanResult(), makeTasks(), 'TestProject');
      expect(ir.aiContext.existingFiles).toEqual([
        { name: 'CLAUDE.md', path: './CLAUDE.md' },
        { name: '.cursorrules', path: './.cursorrules' },
      ]);
    });
  });

  describe('edge case: empty ScanResult', () => {
    it('does not crash with minimal/empty scan data', () => {
      const emptyScan: ScanResult = {
        techStack: [],
        nodeVersion: null,
        packageManager: null,
        dependencies: [],
        depCount: { total: 0, dev: 0 },
        structure: { pages: [], apiRoutes: [], dbTables: [] },
        aiContext: { files: [] },
        git: null,
        codeMetrics: {
          totalFiles: 0,
          totalLines: 0,
          byDirectory: [],
          largestFiles: [],
        },
        exports: [],
        importGraph: [],
        scripts: {},
        deployment: { platform: null, ci: null },
        envVars: [],
      };

      expect(() => buildContextIR(emptyScan, [], 'Empty')).not.toThrow();
    });

    it('returns valid structure with empty data', () => {
      const emptyScan: ScanResult = {
        techStack: [],
        nodeVersion: null,
        packageManager: null,
        dependencies: [],
        depCount: { total: 0, dev: 0 },
        structure: { pages: [], apiRoutes: [], dbTables: [] },
        aiContext: { files: [] },
        git: null,
        codeMetrics: {
          totalFiles: 0,
          totalLines: 0,
          byDirectory: [],
          largestFiles: [],
        },
        exports: [],
        importGraph: [],
        scripts: {},
        deployment: { platform: null, ci: null },
        envVars: [],
      };

      const ir = buildContextIR(emptyScan, [], 'Empty');
      expect(ir.version).toBe('1.0');
      expect(ir.project.name).toBe('Empty');
      expect(ir.project.techStack).toEqual([]);
      expect(ir.architecture.layers).toEqual([]);
      expect(ir.architecture.importGraph).toEqual([]);
      expect(ir.architecture.hubModules).toEqual([]);
      expect(ir.activeWork.tasks).toEqual([]);
      expect(ir.activeWork.git).toBeNull();
      expect(ir.codeMap.modules).toEqual([]);
      expect(ir.codeMap.entryPoints).toEqual([]);
      expect(ir.codeMap.totalFiles).toBe(0);
      expect(ir.codeMap.totalLines).toBe(0);
      expect(ir.constraints.envVars).toEqual([]);
      expect(ir.constraints.scripts).toEqual({});
      expect(ir.constraints.deployTarget).toBeNull();
      expect(ir.constraints.ci).toBeNull();
    });
  });
});
