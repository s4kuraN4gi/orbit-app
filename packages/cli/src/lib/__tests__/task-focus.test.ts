import { describe, it, expect } from 'vitest';
import { extractKeywords, resolveTaskFocus } from '../task-focus.js';
import type { ContextIR } from '../context-ir.js';
import type { Task } from '../../types.js';

// Helper to create a minimal Task
function makeTask(overrides: Partial<Task> & { id: string; title: string }): Task {
  return {
    project_id: 'p',
    parent_id: null,
    description: '',
    status: 'in_progress',
    priority: 'medium',
    start_date: null,
    due_date: null,
    created_at: '',
    ...overrides,
  };
}

// Helper to create a minimal ContextIR fixture
function createIR(overrides: Partial<ContextIR> = {}): ContextIR {
  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    project: {
      name: 'test',
      techStack: ['TypeScript'],
      packageManager: 'pnpm',
      nodeVersion: '20',
    },
    codeMap: {
      totalFiles: 10,
      totalLines: 1000,
      modules: [],
      entryPoints: [],
      largestFiles: [],
    },
    architecture: {
      layers: [],
      importGraph: [],
      hubModules: [],
    },
    activeWork: {
      tasks: [],
      git: null,
      externalIssues: [],
    },
    constraints: {
      envVars: [],
      scripts: {},
    },
    ...overrides,
  } as ContextIR;
}

describe('extractKeywords', () => {
  it('extracts words from plain text', () => {
    const kws = extractKeywords('authentication module');
    expect(kws).toContain('authentication');
    expect(kws).toContain('module');
  });

  it('splits camelCase identifiers', () => {
    const kws = extractKeywords('getUserSettings');
    expect(kws).toContain('user');
    expect(kws).toContain('settings');
  });

  it('splits snake_case identifiers', () => {
    const kws = extractKeywords('scan_data_export');
    expect(kws).toContain('scan');
    expect(kws).toContain('data');
    expect(kws).toContain('export');
  });

  it('splits kebab-case identifiers', () => {
    const kws = extractKeywords('context-diff-view');
    expect(kws).toContain('context');
    expect(kws).toContain('diff');
    expect(kws).toContain('view');
  });

  it('filters out stop words', () => {
    const kws = extractKeywords('add new task for the user');
    expect(kws).not.toContain('add');
    expect(kws).not.toContain('new');
    expect(kws).not.toContain('the');
    expect(kws).not.toContain('for');
    expect(kws).not.toContain('task');
    expect(kws).toContain('user');
  });

  it('filters out short words (< 3 chars)', () => {
    const kws = extractKeywords('a to be or not');
    expect(kws).toHaveLength(0);
  });

  it('extracts code tokens in backticks', () => {
    const kws = extractKeywords('Fix the `loginHandler` function');
    expect(kws).toContain('login');
    expect(kws).toContain('handler');
  });

  it('deduplicates keywords', () => {
    const kws = extractKeywords('auth auth auth');
    const authCount = kws.filter(k => k === 'auth').length;
    expect(authCount).toBe(1);
  });

  it('returns empty array for empty input', () => {
    expect(extractKeywords('')).toEqual([]);
  });
});

describe('resolveTaskFocus', () => {
  it('returns empty array when no in-progress tasks', () => {
    const ir = createIR();
    const tasks: Task[] = [makeTask({ id: '1', title: 'Done', status: 'done' })];
    expect(resolveTaskFocus(tasks, ir)).toEqual([]);
  });

  it('returns empty array when no tasks at all', () => {
    const ir = createIR();
    expect(resolveTaskFocus([], ir)).toEqual([]);
  });

  it('matches in-progress task keywords to module paths', () => {
    const ir = createIR({
      codeMap: {
        totalFiles: 2,
        totalLines: 100,
        modules: [
          { path: 'lib/authentication.ts', exports: [], imports: [], importedBy: 0 },
          { path: 'lib/utils.ts', exports: [], imports: [], importedBy: 0 },
        ],
        entryPoints: [],
        largestFiles: [],
      },
    });

    const tasks: Task[] = [
      makeTask({ id: 't1', title: 'Fix authentication logic', priority: 'high' }),
    ];

    const result = resolveTaskFocus(tasks, ir);
    expect(result).toHaveLength(1);
    expect(result[0].taskTitle).toBe('Fix authentication logic');
    expect(result[0].primaryFiles).toContain('lib/authentication.ts');
  });

  it('matches keywords to export names', () => {
    const ir = createIR({
      codeMap: {
        totalFiles: 1,
        totalLines: 50,
        modules: [
          {
            path: 'lib/helpers.ts',
            exports: [{ name: 'validateToken', kind: 'function' }],
            imports: [],
            importedBy: 0,
          },
        ],
        entryPoints: [],
        largestFiles: [],
      },
    });

    const tasks: Task[] = [
      makeTask({ id: 't1', title: 'Update token validation' }),
    ];

    const result = resolveTaskFocus(tasks, ir);
    expect(result).toHaveLength(1);
    expect(result[0].relevantExports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'validateToken' }),
      ])
    );
  });

  it('finds related modules via import graph', () => {
    const ir = createIR({
      codeMap: {
        totalFiles: 3,
        totalLines: 200,
        modules: [
          { path: 'lib/auth.ts', exports: [{ name: 'login', kind: 'function' }], imports: [], importedBy: 2 },
          { path: 'lib/session.ts', exports: [], imports: [], importedBy: 1 },
          { path: 'lib/db.ts', exports: [], imports: [], importedBy: 1 },
        ],
        entryPoints: [],
        largestFiles: [],
      },
      architecture: {
        layers: [],
        importGraph: [
          { from: 'lib/auth.ts', to: 'lib/session.ts' },
          { from: 'lib/auth.ts', to: 'lib/db.ts' },
        ],
        hubModules: [],
      },
    });

    const tasks: Task[] = [
      makeTask({ id: 't1', title: 'login improvements' }),
    ];

    const result = resolveTaskFocus(tasks, ir);
    expect(result).toHaveLength(1);
    expect(result[0].primaryFiles).toContain('lib/auth.ts');
    expect(result[0].relatedModules).toContain('lib/session.ts');
    expect(result[0].relatedModules).toContain('lib/db.ts');
  });

  it('skips tasks with no matching keywords', () => {
    const ir = createIR({
      codeMap: {
        totalFiles: 1,
        totalLines: 50,
        modules: [
          { path: 'lib/auth.ts', exports: [], imports: [], importedBy: 0 },
        ],
        entryPoints: [],
        largestFiles: [],
      },
    });

    const tasks: Task[] = [
      makeTask({ id: 't1', title: 'Something unrelated xyz' }),
    ];

    const result = resolveTaskFocus(tasks, ir);
    expect(result).toHaveLength(0);
  });

  it('handles external issues', () => {
    const ir = createIR({
      codeMap: {
        totalFiles: 1,
        totalLines: 50,
        modules: [
          { path: 'lib/stripe.ts', exports: [{ name: 'createCheckout', kind: 'function' }], imports: [], importedBy: 0 },
        ],
        entryPoints: [],
        largestFiles: [],
      },
      activeWork: {
        tasks: [],
        git: null,
        externalIssues: [
          { number: 42, title: 'Stripe checkout broken', body: 'Payment fails', state: 'open', labels: [], url: '', provider: 'github' },
        ],
      },
    });

    const result = resolveTaskFocus([], ir);
    expect(result).toHaveLength(1);
    expect(result[0].taskId).toBe('gh-42');
    expect(result[0].primaryFiles).toContain('lib/stripe.ts');
  });
});
