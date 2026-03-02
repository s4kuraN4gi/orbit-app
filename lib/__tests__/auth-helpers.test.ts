import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock setup ---

let mockSession: { user: { id: string; email: string } } | null = null;
let mockProjectAccess: { project: Record<string, unknown>; role: string } | null = null;
let mockTaskQuery: Record<string, unknown>[] = [];

vi.mock('next/headers', () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));

vi.mock('@/lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(() => Promise.resolve(mockSession)),
    },
  },
}));

vi.mock('@/lib/project-access', () => ({
  verifyProjectAccess: vi.fn(() => Promise.resolve(mockProjectAccess)),
}));

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve(mockTaskQuery)),
      })),
    })),
  },
}));

vi.mock('@/lib/schema', () => ({
  tasks: { id: 'id', projectId: 'project_id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: unknown[]) => args),
}));

// --- Tests ---

describe('requireUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = null;
    mockProjectAccess = null;
    mockTaskQuery = [];
  });

  it('returns user when authenticated', async () => {
    mockSession = { user: { id: 'user-1', email: 'test@example.com' } };

    const { requireUser } = await import('../auth-helpers');
    const user = await requireUser();
    expect(user.id).toBe('user-1');
  });

  it('throws when not authenticated', async () => {
    mockSession = null;

    const { requireUser } = await import('../auth-helpers');
    await expect(requireUser()).rejects.toThrow('Not authenticated');
  });
});

describe('requireProjectAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = { user: { id: 'user-1', email: 'test@example.com' } };
    mockProjectAccess = null;
  });

  it('returns user, project, and role when access granted', async () => {
    mockProjectAccess = {
      project: { id: 'proj-1', name: 'Test', ownerId: 'user-1' },
      role: 'owner',
    };

    const { requireProjectAccess } = await import('../auth-helpers');
    const result = await requireProjectAccess('proj-1');
    expect(result.user.id).toBe('user-1');
    expect(result.project.id).toBe('proj-1');
    expect(result.role).toBe('owner');
  });

  it('throws Forbidden when access denied', async () => {
    mockProjectAccess = null;

    const { requireProjectAccess } = await import('../auth-helpers');
    await expect(requireProjectAccess('proj-1')).rejects.toThrow('Forbidden');
  });

  it('throws when not authenticated', async () => {
    mockSession = null;

    const { requireProjectAccess } = await import('../auth-helpers');
    await expect(requireProjectAccess('proj-1')).rejects.toThrow('Not authenticated');
  });
});

describe('requireProjectAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = { user: { id: 'user-1', email: 'test@example.com' } };
  });

  it('allows owner', async () => {
    mockProjectAccess = {
      project: { id: 'proj-1', name: 'Test', ownerId: 'user-1' },
      role: 'owner',
    };

    const { requireProjectAdmin } = await import('../auth-helpers');
    const result = await requireProjectAdmin('proj-1');
    expect(result.role).toBe('owner');
  });

  it('allows admin', async () => {
    mockProjectAccess = {
      project: { id: 'proj-1', name: 'Test', ownerId: 'user-2', organizationId: 'org-1' },
      role: 'admin',
    };

    const { requireProjectAdmin } = await import('../auth-helpers');
    const result = await requireProjectAdmin('proj-1');
    expect(result.role).toBe('admin');
  });

  it('rejects member role', async () => {
    mockProjectAccess = {
      project: { id: 'proj-1', name: 'Test', ownerId: 'user-2', organizationId: 'org-1' },
      role: 'member',
    };

    const { requireProjectAdmin } = await import('../auth-helpers');
    await expect(requireProjectAdmin('proj-1')).rejects.toThrow(
      'Forbidden: admin or owner required'
    );
  });
});

describe('requireTaskAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = { user: { id: 'user-1', email: 'test@example.com' } };
    mockProjectAccess = null;
    mockTaskQuery = [];
  });

  it('returns user, project, task when task found and access granted', async () => {
    mockTaskQuery = [{ id: 'task-1', projectId: 'proj-1', title: 'Test task' }];
    mockProjectAccess = {
      project: { id: 'proj-1', name: 'Test', ownerId: 'user-1' },
      role: 'owner',
    };

    const { requireTaskAccess } = await import('../auth-helpers');
    const result = await requireTaskAccess('task-1');
    expect(result.task.id).toBe('task-1');
    expect(result.project.id).toBe('proj-1');
  });

  it('throws when task not found', async () => {
    mockTaskQuery = [];

    const { requireTaskAccess } = await import('../auth-helpers');
    await expect(requireTaskAccess('task-nonexistent')).rejects.toThrow('Task not found');
  });

  it('throws when user lacks project access', async () => {
    mockTaskQuery = [{ id: 'task-1', projectId: 'proj-1', title: 'Test task' }];
    mockProjectAccess = null;

    const { requireTaskAccess } = await import('../auth-helpers');
    await expect(requireTaskAccess('task-1')).rejects.toThrow('Forbidden');
  });
});

describe('legacy aliases', () => {
  it('requireProjectOwner is alias for requireProjectAccess', async () => {
    const mod = await import('../auth-helpers');
    expect(mod.requireProjectOwner).toBe(mod.requireProjectAccess);
  });

  it('requireTaskOwner is alias for requireTaskAccess', async () => {
    const mod = await import('../auth-helpers');
    expect(mod.requireTaskOwner).toBe(mod.requireTaskAccess);
  });
});
