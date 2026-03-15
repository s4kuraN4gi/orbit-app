import type { ContextIR } from './context-ir.js';
import type { Task } from '../types.js';
export interface FocusArea {
  taskId: string;
  taskTitle: string;
  primaryFiles: string[];
  relatedModules: string[];
  relevantExports: { name: string; kind: string; file: string }[];
  matchedKeywords: string[];
}

// Stop words to filter out
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'this', 'that', 'from', 'into',
  'have', 'has', 'not', 'but', 'are', 'was', 'were', 'been',
  'will', 'can', 'may', 'should', 'would', 'could',
  'add', 'fix', 'update', 'remove', 'implement', 'create', 'change',
  'new', 'todo', 'done', 'task', 'feature', 'bug',
]);

/** Split camelCase/PascalCase/snake_case/kebab-case into words */
function splitIdentifier(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')  // camelCase
    .replace(/[-_]/g, ' ')                   // snake/kebab
    .split(/\s+/)
    .map(w => w.toLowerCase())
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));
}

/** Extract meaningful keywords from task text */
export function extractKeywords(text: string): string[] {
  const words = splitIdentifier(text);
  // Also match quoted strings and code-like tokens
  const codeTokens = text.match(/`([^`]+)`/g)?.map(t => t.replace(/`/g, '')) ?? [];
  const allWords = [...words, ...codeTokens.flatMap(splitIdentifier)];
  return [...new Set(allWords)];
}

/** Check if a keyword matches a path or name (case-insensitive partial match) */
function matchesKeyword(keyword: string, target: string): boolean {
  return target.toLowerCase().includes(keyword.toLowerCase());
}

/** Shared logic to resolve focus from a title + text */
function resolveFocusForItem(
  id: string,
  title: string,
  text: string,
  ir: ContextIR,
): FocusArea | null {
  const keywords = extractKeywords(text);
  if (keywords.length === 0) return null;

  const primaryFileSet = new Set<string>();
  const relevantExports: { name: string; kind: string; file: string }[] = [];
  const matchedKeywordSet = new Set<string>();

  for (const mod of ir.codeMap.modules) {
    for (const kw of keywords) {
      if (matchesKeyword(kw, mod.path)) {
        primaryFileSet.add(mod.path);
        matchedKeywordSet.add(kw);
      }
      for (const exp of mod.exports) {
        if (matchesKeyword(kw, exp.name)) {
          primaryFileSet.add(mod.path);
          relevantExports.push({ name: exp.name, kind: exp.kind, file: mod.path });
          matchedKeywordSet.add(kw);
        }
      }
    }
  }

  for (const layer of ir.architecture.layers) {
    for (const item of layer.items) {
      for (const kw of keywords) {
        if (matchesKeyword(kw, item)) {
          matchedKeywordSet.add(kw);
          const lastWord = item.split(' ').pop() || item;
          const matchingMod = ir.codeMap.modules.find(m => matchesKeyword(lastWord, m.path));
          if (matchingMod) primaryFileSet.add(matchingMod.path);
        }
      }
    }
  }

  const primaryFiles = [...primaryFileSet].slice(0, 8);

  const relatedSet = new Set<string>();
  for (const file of primaryFiles) {
    for (const edge of ir.architecture.importGraph) {
      if (edge.from === file && !primaryFileSet.has(edge.to)) {
        relatedSet.add(edge.to);
      }
      if (edge.to === file && !primaryFileSet.has(edge.from)) {
        relatedSet.add(edge.from);
      }
    }
  }
  const relatedModules = [...relatedSet].slice(0, 6);

  if (primaryFiles.length === 0) return null;

  return {
    taskId: id,
    taskTitle: title,
    primaryFiles,
    relatedModules,
    relevantExports: relevantExports.slice(0, 10),
    matchedKeywords: [...matchedKeywordSet],
  };
}

export function resolveTaskFocus(tasks: Task[], ir: ContextIR): FocusArea[] {
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const externalIssues = ir.activeWork.externalIssues ?? [];
  if (inProgressTasks.length === 0 && externalIssues.length === 0) return [];

  const focusAreas: FocusArea[] = [];

  // Resolve focus from in-progress tasks
  for (const task of inProgressTasks) {
    const text = `${task.title} ${task.description || ''}`;
    const area = resolveFocusForItem(task.id, task.title, text, ir);
    if (area) focusAreas.push(area);
  }

  // Resolve focus from external issues (top 5 only to limit noise)
  for (const issue of externalIssues.slice(0, 5)) {
    const text = `${issue.title} ${issue.body || ''}`;
    const area = resolveFocusForItem(
      `gh-${issue.number}`,
      `#${issue.number}: ${issue.title}`,
      text,
      ir,
    );
    if (area) focusAreas.push(area);
  }

  return focusAreas;
}
