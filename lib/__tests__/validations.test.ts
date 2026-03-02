import { describe, it, expect } from 'vitest';
import {
  idSchema,
  projectIdSchema,
  checkoutSchema,
  taskSchema,
  bulkCreateSchema,
  createTaskSchema,
  patchProjectSchema,
  userSettingsSchema,
  createProjectSchema,
  createIdeaSchema,
} from '../validations';

describe('idSchema', () => {
  it('accepts valid UUID', () => {
    expect(idSchema.parse('550e8400-e29b-41d4-a716-446655440000')).toBe(
      '550e8400-e29b-41d4-a716-446655440000'
    );
  });

  it('rejects non-UUID string', () => {
    expect(() => idSchema.parse('not-a-uuid')).toThrow();
  });

  it('rejects empty string', () => {
    expect(() => idSchema.parse('')).toThrow();
  });
});

describe('projectIdSchema', () => {
  it('accepts valid project id', () => {
    expect(projectIdSchema.parse('proj-123')).toBe('proj-123');
  });

  it('rejects empty string', () => {
    expect(() => projectIdSchema.parse('')).toThrow();
  });

  it('rejects string exceeding 100 chars', () => {
    expect(() => projectIdSchema.parse('a'.repeat(101))).toThrow();
  });
});

describe('checkoutSchema', () => {
  it('accepts valid plan', () => {
    expect(checkoutSchema.parse({ plan: 'pro' })).toEqual({ plan: 'pro' });
  });

  it('accepts plan with organizationId', () => {
    const result = checkoutSchema.parse({ plan: 'team', organizationId: 'org-1' });
    expect(result.plan).toBe('team');
    expect(result.organizationId).toBe('org-1');
  });

  it('rejects invalid plan', () => {
    expect(() => checkoutSchema.parse({ plan: 'enterprise' })).toThrow();
  });

  it('rejects missing plan', () => {
    expect(() => checkoutSchema.parse({})).toThrow();
  });
});

describe('taskSchema', () => {
  it('accepts minimal task', () => {
    const result = taskSchema.parse({ title: 'Test' });
    expect(result).toEqual({ title: 'Test' });
  });

  it('accepts task with all fields', () => {
    const result = taskSchema.parse({
      title: 'Test',
      description: 'A description',
      status: 'in_progress',
      priority: 'high',
      start_date: '2026-03-01',
      due_date: '2026-03-15',
    });
    expect(result).toBeDefined();
  });

  it('accepts nested children', () => {
    const result = taskSchema.parse({
      title: 'Parent',
      children: [
        { title: 'Child 1' },
        { title: 'Child 2', children: [{ title: 'Grandchild' }] },
      ],
    });
    expect(result).toBeDefined();
  });

  it('rejects empty title', () => {
    expect(() => taskSchema.parse({ title: '' })).toThrow();
  });

  it('rejects title exceeding 500 chars', () => {
    expect(() => taskSchema.parse({ title: 'a'.repeat(501) })).toThrow();
  });

  it('rejects invalid status', () => {
    expect(() => taskSchema.parse({ title: 'T', status: 'invalid' })).toThrow();
  });

  it('rejects invalid priority', () => {
    expect(() => taskSchema.parse({ title: 'T', priority: 'critical' })).toThrow();
  });
});

describe('bulkCreateSchema', () => {
  it('accepts valid payload with defaults', () => {
    const result = bulkCreateSchema.parse({
      project_id: 'proj-1',
      tasks: [{ title: 'Task 1' }],
    });
    expect(result.source_tool).toBe('Manual');
    expect(result.original_prompt).toBe('');
  });

  it('rejects empty tasks array', () => {
    expect(() =>
      bulkCreateSchema.parse({ project_id: 'proj-1', tasks: [] })
    ).toThrow();
  });

  it('rejects more than 200 tasks', () => {
    const tooMany = Array.from({ length: 201 }, (_, i) => ({ title: `Task ${i}` }));
    expect(() =>
      bulkCreateSchema.parse({ project_id: 'proj-1', tasks: tooMany })
    ).toThrow();
  });

  it('rejects missing project_id', () => {
    expect(() =>
      bulkCreateSchema.parse({ tasks: [{ title: 'T' }] })
    ).toThrow();
  });
});

describe('createTaskSchema', () => {
  it('accepts minimal task', () => {
    expect(createTaskSchema.parse({ title: 'Test' })).toEqual({ title: 'Test' });
  });

  it('accepts nullable dates', () => {
    const result = createTaskSchema.parse({
      title: 'Test',
      start_date: null,
      due_date: null,
    });
    expect(result.start_date).toBeNull();
  });

  it('rejects empty title', () => {
    expect(() => createTaskSchema.parse({ title: '' })).toThrow();
  });
});

describe('patchProjectSchema', () => {
  it('accepts valid local_path', () => {
    expect(patchProjectSchema.parse({ local_path: '/home/user/project' })).toEqual({
      local_path: '/home/user/project',
    });
  });

  it('accepts empty object', () => {
    expect(patchProjectSchema.parse({})).toEqual({});
  });

  it('rejects path exceeding 1000 chars', () => {
    expect(() => patchProjectSchema.parse({ local_path: 'a'.repeat(1001) })).toThrow();
  });
});

describe('userSettingsSchema', () => {
  it('accepts valid settings', () => {
    const result = userSettingsSchema.parse({
      theme: 'dark',
      default_view: 'list',
      language: 'ja',
    });
    expect(result.theme).toBe('dark');
    expect(result.language).toBe('ja');
  });

  it('accepts custom_colors with valid hex', () => {
    const result = userSettingsSchema.parse({
      custom_colors: { primary: '#ff0000', background: '#1a1a1a' },
    });
    expect(result.custom_colors).toBeDefined();
  });

  it('rejects invalid color code', () => {
    expect(() =>
      userSettingsSchema.parse({ custom_colors: { primary: 'not-a-color' } })
    ).toThrow();
  });

  it('rejects invalid theme', () => {
    expect(() => userSettingsSchema.parse({ theme: 'ocean' })).toThrow();
  });

  it('accepts null custom_colors (reset)', () => {
    const result = userSettingsSchema.parse({ custom_colors: null });
    expect(result.custom_colors).toBeNull();
  });
});

describe('createProjectSchema', () => {
  it('accepts valid project', () => {
    const result = createProjectSchema.parse({ name: 'My Project' });
    expect(result.name).toBe('My Project');
  });

  it('accepts project with key and org', () => {
    const result = createProjectSchema.parse({
      name: 'Project',
      key: 'PRJ',
      organizationId: 'org-1',
    });
    expect(result.key).toBe('PRJ');
  });

  it('rejects empty name', () => {
    expect(() => createProjectSchema.parse({ name: '' })).toThrow();
  });

  it('rejects name exceeding 100 chars', () => {
    expect(() => createProjectSchema.parse({ name: 'a'.repeat(101) })).toThrow();
  });
});

describe('createIdeaSchema', () => {
  it('accepts valid idea', () => {
    expect(createIdeaSchema.parse({ content: 'An idea' })).toEqual({ content: 'An idea' });
  });

  it('rejects empty content', () => {
    expect(() => createIdeaSchema.parse({ content: '' })).toThrow();
  });

  it('rejects content exceeding 5000 chars', () => {
    expect(() => createIdeaSchema.parse({ content: 'a'.repeat(5001) })).toThrow();
  });
});
