import { describe, it, expect } from 'vitest';
import { parsePlanMarkdown, convertToApiFormat } from '../planParser';

describe('parsePlanMarkdown', () => {
  it('parses headers as top-level tasks', () => {
    const md = `## Task A\n## Task B`;
    const result = parsePlanMarkdown(md);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Task A');
    expect(result[1].title).toBe('Task B');
  });

  it('parses bullet items as tasks', () => {
    const md = `- Item 1\n- Item 2\n- Item 3`;
    const result = parsePlanMarkdown(md);
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('Item 1');
  });

  it('parses checkbox items', () => {
    const md = `- [ ] Todo\n- [x] Done`;
    const result = parsePlanMarkdown(md);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Todo');
    expect(result[1].title).toBe('Done');
  });

  it('parses numbered lists', () => {
    const md = `1. First\n2. Second\n3. Third`;
    const result = parsePlanMarkdown(md);
    expect(result).toHaveLength(3);
    expect(result[0].title).toBe('First');
  });

  it('builds hierarchy from headers and bullets', () => {
    const md = `## Phase 1\n- Task A\n- Task B\n## Phase 2\n- Task C`;
    const result = parsePlanMarkdown(md);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Phase 1');
    expect(result[0].children).toHaveLength(2);
    expect(result[1].title).toBe('Phase 2');
    expect(result[1].children).toHaveLength(1);
  });

  it('builds hierarchy from indentation', () => {
    const md = `- Parent\n  - Child 1\n  - Child 2\n    - Grandchild`;
    const result = parsePlanMarkdown(md);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Parent');
    expect(result[0].children).toHaveLength(2);
    expect(result[0].children![1].children).toHaveLength(1);
    expect(result[0].children![1].children![0].title).toBe('Grandchild');
  });

  it('handles nested headers', () => {
    const md = `## Section\n### Subsection\n- Item`;
    const result = parsePlanMarkdown(md);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Section');
    expect(result[0].children).toHaveLength(1);
    expect(result[0].children![0].title).toBe('Subsection');
    expect(result[0].children![0].children).toHaveLength(1);
  });

  it('ignores blank lines', () => {
    const md = `- Item 1\n\n\n- Item 2`;
    const result = parsePlanMarkdown(md);
    expect(result).toHaveLength(2);
  });

  it('ignores non-list/header lines', () => {
    const md = `Some random text\n- Actual task\nMore text`;
    const result = parsePlanMarkdown(md);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Actual task');
  });

  it('returns empty array for empty input', () => {
    expect(parsePlanMarkdown('')).toEqual([]);
  });

  it('returns empty array for text-only input', () => {
    expect(parsePlanMarkdown('Just some plain text\nNothing to parse')).toEqual([]);
  });

  it('handles asterisk bullets', () => {
    const md = `* Item A\n* Item B`;
    const result = parsePlanMarkdown(md);
    expect(result).toHaveLength(2);
    expect(result[0].title).toBe('Item A');
  });

  it('handles asterisk checkboxes', () => {
    const md = `* [ ] Todo\n* [X] Done (uppercase X)`;
    const result = parsePlanMarkdown(md);
    expect(result).toHaveLength(2);
  });

  it('cleans up empty children arrays', () => {
    const md = `- Leaf task`;
    const result = parsePlanMarkdown(md);
    expect(result[0].children).toBeUndefined();
  });
});

describe('convertToApiFormat', () => {
  it('converts parsed tasks to API format', () => {
    const parsed = [
      { title: 'Task 1' },
      { title: 'Task 2', children: [{ title: 'Sub 1' }] },
    ];
    const result = convertToApiFormat(parsed, 'proj-1');
    expect(result.project_id).toBe('proj-1');
    expect(result.source_tool).toBe('Manual');
    expect(result.original_prompt).toBe('');
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0].title).toBe('Task 1');
    expect(result.tasks[0].status).toBe('todo');
    expect(result.tasks[0].priority).toBe('medium');
    expect(result.tasks[0].description).toBeNull();
  });

  it('preserves children hierarchy', () => {
    const parsed = [
      {
        title: 'Parent',
        children: [
          { title: 'Child', children: [{ title: 'Grandchild' }] },
        ],
      },
    ];
    const result = convertToApiFormat(parsed, 'proj-1');
    expect(result.tasks[0].children).toHaveLength(1);
    expect(result.tasks[0].children[0].children).toHaveLength(1);
    expect(result.tasks[0].children[0].children[0].title).toBe('Grandchild');
  });

  it('uses provided source_tool and prompt', () => {
    const result = convertToApiFormat(
      [{ title: 'T' }],
      'proj-1',
      'Cursor',
      'Build auth'
    );
    expect(result.source_tool).toBe('Cursor');
    expect(result.original_prompt).toBe('Build auth');
  });
});
