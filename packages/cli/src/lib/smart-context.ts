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

  // 5. Score files based on multiple signals
  const allModulePaths = ir.codeMap.modules.map(m => m.path);

  // Score changed files (highest signal)
  for (const file of changedFiles) {
    const matchedModule = allModulePaths.find(p => p === file || file.endsWith(p) || p.endsWith(file));
    if (matchedModule) {
      scores.set(matchedModule, (scores.get(matchedModule) || 0) + 40);
    }
  }

  // Score recently committed files
  for (const file of recentFiles) {
    const matchedModule = allModulePaths.find(p => p === file || file.endsWith(p) || p.endsWith(file));
    if (matchedModule) {
      scores.set(matchedModule, (scores.get(matchedModule) || 0) + 20);
    }
  }

  // Score modules matching keywords via import graph
  for (const mod of ir.codeMap.modules) {
    for (const kw of allKeywords) {
      if (mod.path.toLowerCase().includes(kw.toLowerCase())) {
        scores.set(mod.path, (scores.get(mod.path) || 0) + 15);
      }
      for (const exp of mod.exports) {
        if (exp.name.toLowerCase().includes(kw.toLowerCase())) {
          scores.set(mod.path, (scores.get(mod.path) || 0) + 10);
        }
      }
    }
  }

  // Score hub modules (high importedBy)
  for (const hub of ir.architecture.hubModules) {
    if (scores.has(hub.path)) {
      scores.set(hub.path, (scores.get(hub.path) || 0) + 5);
    }
  }

  // Expand to import graph: direct dependencies of scored files
  const scoredPaths = new Set(scores.keys());
  for (const edge of ir.architecture.importGraph) {
    if (scoredPaths.has(edge.from) && !scores.has(edge.to)) {
      scores.set(edge.to, 15);
    }
    if (scoredPaths.has(edge.to) && !scores.has(edge.from)) {
      scores.set(edge.from, 10);
    }
  }

  // 6. Sort by score and pick top 15
  const sorted = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const activeFiles = sorted.map(([path]) => path);

  // 7. Find related modules (imports of active files not already in the list)
  const activeSet = new Set(activeFiles);
  const relatedSet = new Set<string>();
  for (const file of activeFiles) {
    for (const edge of ir.architecture.importGraph) {
      if (edge.from === file && !activeSet.has(edge.to)) {
        relatedSet.add(edge.to);
      }
      if (edge.to === file && !activeSet.has(edge.from)) {
        relatedSet.add(edge.from);
      }
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
