import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Mock setup ---

const mockSelectResult: any[] = [];
let selectCallCount = 0;

vi.mock('@/lib/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => {
          const result = mockSelectResult[selectCallCount] ?? [];
          selectCallCount++;
          return Promise.resolve(Array.isArray(result) ? result : [result]);
        }),
      })),
    })),
  },
}));

vi.mock('@/lib/schema', () => ({
  projects: { id: 'id', ownerId: 'owner_id', organizationId: 'organization_id' },
  member: { id: 'id', role: 'role', organizationId: 'organization_id', userId: 'user_id' },
}));

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: any[]) => args),
  and: vi.fn((...args: any[]) => args),
}));

// --- Tests ---

describe('verifyProjectAccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelectResult.length = 0;
    selectCallCount = 0;
  });

  it('returns null when project does not exist', async () => {
    mockSelectResult[0] = []; // No project found

    const { verifyProjectAccess } = await import('../project-access');
    const result = await verifyProjectAccess('user-1', 'project-nonexistent');
    expect(result).toBeNull();
  });

  it('allows owner to access their personal project', async () => {
    mockSelectResult[0] = [{
      id: 'project-1',
      ownerId: 'user-1',
      organizationId: null,
      name: 'My Project',
      key: 'MP',
    }];

    const { verifyProjectAccess } = await import('../project-access');
    const result = await verifyProjectAccess('user-1', 'project-1');
    expect(result).not.toBeNull();
    expect(result?.role).toBe('owner');
  });

  it('denies access to another user\'s personal project', async () => {
    mockSelectResult[0] = [{
      id: 'project-1',
      ownerId: 'user-1',
      organizationId: null,
      name: 'My Project',
      key: 'MP',
    }];

    const { verifyProjectAccess } = await import('../project-access');
    const result = await verifyProjectAccess('user-2', 'project-1');
    expect(result).toBeNull();
  });

  it('allows org member to access org project', async () => {
    mockSelectResult[0] = [{
      id: 'project-org',
      ownerId: 'user-1',
      organizationId: 'org-1',
      name: 'Team Project',
      key: 'TP',
    }];
    mockSelectResult[1] = [{
      id: 'member-1',
      role: 'member',
    }];

    const { verifyProjectAccess } = await import('../project-access');
    const result = await verifyProjectAccess('user-2', 'project-org');
    expect(result).not.toBeNull();
    expect(result?.role).toBe('member');
  });

  it('denies non-member access to org project', async () => {
    mockSelectResult[0] = [{
      id: 'project-org',
      ownerId: 'user-1',
      organizationId: 'org-1',
      name: 'Team Project',
      key: 'TP',
    }];
    mockSelectResult[1] = []; // Not a member

    const { verifyProjectAccess } = await import('../project-access');
    const result = await verifyProjectAccess('user-3', 'project-org');
    expect(result).toBeNull();
  });
});
