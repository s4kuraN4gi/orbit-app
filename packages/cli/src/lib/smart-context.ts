import { execSync } from 'node:child_process';
import type { ContextIR } from './context-ir.js';
import { extractKeywords } from './task-focus.js';

export interface SmartRecommendation {
  activeFiles: string[];
  relatedModules: string[];
  suggestedExports: { name: string; kind: string; file: string }[];
  workContext: string;
  relevanceScores: Map<string, number>;
}

function execGit(cmd: string, cwd: string): string | null {
  try {
    return execSync(cmd, { cwd, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch {
    return null;
  }
}

function getChangedFiles(cwd: string): string[] {
  // Staged + unstaged changes
  const diffOutput = execGit('git diff --name-only HEAD', cwd);
  const stagedOutput = execGit('git diff --name-only --cached', cwd);
  const untrackedOutput = execGit('git ls-files --others --exclude-standard', cwd);

  const files = new Set<string>();
  for (const output of [diffOutput, stagedOutput, untrackedOutput]) {
    if (output) {
      for (const f of output.split('\n').filter(Boolean)) {
        files.add(f);
      }
    }
  }
  return [...files];
}

function getRecentCommitMessages(cwd: string, count = 5): string[] {
  const output = execGit(`git log -${count} --format=%s`, cwd);
  if (!output) return [];
  return output.split('\n').filter(Boolean);
}

function getBranchName(cwd: string): string {
  return execGit('git branch --show-current', cwd) || 'unknown';
}

function getRecentlyChangedFiles(cwd: string, days = 3): string[] {
  const output = execGit(`git log --since="${days} days ago" --name-only --format=`, cwd);
  if (!output) return [];
  const files = new Set(output.split('\n').filter(Boolean));
  return [...files];
}

export function analyzeWorkContext(ir: ContextIR, cwd: string = process.cwd()): SmartRecommendation {
  const scores = new Map<string, number>();

  // 1. Get changed files from git diff
  const changedFiles = getChangedFiles(cwd);

  // 2. Get recent commit messages for keyword extraction
  const commitMessages = getRecentCommitMessages(cwd);
  const branchName = getBranchName(cwd);

  // 3. Extract keywords from branch name + commit messages
  const branchKeywords = extractKeywords(branchName.replace(/[/\-_]/g, ' '));
  const commitKeywords = commitMessages.flatMap(msg => extractKeywords(msg));
  const allKeywords = [...new Set([...branchKeywords, ...commitKeywords])];

  // 4. Get recently changed files from git log
  const recentFiles = getRecentlyChangedFiles(cwd);

  // 5. Build lookup structures for O(1) matching
  const pathSet = new Set(ir.codeMap.modules.map(m => m.path));

  // Build a suffix → path map for fuzzy file matching
  const suffixMap = new Map<string, string>();
  for (const p of pathSet) {
    suffixMap.set(p, p);
    // Also index by filename for partial matches
    const parts = p.split('/');
    const filename = parts[parts.length - 1];
    if (!suffixMap.has(filename)) suffixMap.set(filename, p);
  }

  const resolveFile = (file: string): string | undefined => {
    if (pathSet.has(file)) return file;
    const parts = file.split('/');
    const filename = parts[parts.length - 1];
    return suffixMap.get(filename);
  };

  // Build adjacency lists for import graph (O(E) once instead of O(E) per lookup)
  const importsFrom = new Map<string, string[]>(); // from → [to]
  const importedBy = new Map<string, string[]>();   // to → [from]
  for (const edge of ir.architecture.importGraph) {
    if (!importsFrom.has(edge.from)) importsFrom.set(edge.from, []);
    importsFrom.get(edge.from)!.push(edge.to);
    if (!importedBy.has(edge.to)) importedBy.set(edge.to, []);
    importedBy.get(edge.to)!.push(edge.from);
  }

  // Score changed files (highest signal)
  for (const file of changedFiles) {
    const matched = resolveFile(file);
    if (matched) {
      scores.set(matched, (scores.get(matched) || 0) + 40);
    }
  }

  // Score recently committed files
  for (const file of recentFiles) {
    const matched = resolveFile(file);
    if (matched) {
      scores.set(matched, (scores.get(matched) || 0) + 20);
    }
  }

  // Score modules matching keywords — lowercase keywords once
  const kwLower = allKeywords.map(k => k.toLowerCase());

  for (const mod of ir.codeMap.modules) {
    const pathLower = mod.path.toLowerCase();
    let pathScore = 0;

    for (const kw of kwLower) {
      if (pathLower.includes(kw)) pathScore += 15;
    }

    for (const exp of mod.exports) {
      const expLower = exp.name.toLowerCase();
      for (const kw of kwLower) {
        if (expLower.includes(kw)) { pathScore += 10; break; }
      }
    }

    if (pathScore > 0) {
      scores.set(mod.path, (scores.get(mod.path) || 0) + pathScore);
    }
  }

  // Score hub modules (high importedBy)
  for (const hub of ir.architecture.hubModules) {
    if (scores.has(hub.path)) {
      scores.set(hub.path, (scores.get(hub.path) || 0) + 5);
    }
  }

  // Expand to import graph: direct dependencies of scored files (using adjacency lists)
  const scoredPaths = new Set(scores.keys());
  for (const path of scoredPaths) {
    for (const dep of importsFrom.get(path) || []) {
      if (!scores.has(dep)) scores.set(dep, 15);
    }
    for (const dep of importedBy.get(path) || []) {
      if (!scores.has(dep)) scores.set(dep, 10);
    }
  }

  // 6. Sort by score and pick top 15
  const sorted = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const activeFiles = sorted.map(([path]) => path);

  // 7. Find related modules using adjacency lists
  const activeSet = new Set(activeFiles);
  const relatedSet = new Set<string>();
  for (const file of activeFiles) {
    for (const dep of importsFrom.get(file) || []) {
      if (!activeSet.has(dep)) relatedSet.add(dep);
    }
    for (const dep of importedBy.get(file) || []) {
      if (!activeSet.has(dep)) relatedSet.add(dep);
    }
  }
  const relatedModules = [...relatedSet].slice(0, 10);

  // 8. Collect relevant exports from active files
  const suggestedExports: { name: string; kind: string; file: string }[] = [];
  for (const mod of ir.codeMap.modules) {
    if (activeSet.has(mod.path)) {
      for (const exp of mod.exports) {
        suggestedExports.push({ name: exp.name, kind: exp.kind, file: mod.path });
      }
    }
  }

  // 9. Build work context description
  const contextParts: string[] = [];
  if (branchName !== 'unknown' && branchName !== 'main' && branchName !== 'master') {
    contextParts.push(`Branch: ${branchName}`);
  }
  if (commitMessages.length > 0) {
    contextParts.push(`Recent: ${commitMessages[0]}`);
  }
  if (changedFiles.length > 0) {
    contextParts.push(`${changedFiles.length} files changed`);
  }
  const workContext = contextParts.join(' | ') || 'No active work detected';

  return {
    activeFiles,
    relatedModules,
    suggestedExports: suggestedExports.slice(0, 20),
    workContext,
    relevanceScores: new Map(sorted),
  };
}
