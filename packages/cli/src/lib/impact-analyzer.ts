import chalk from 'chalk';
import { heading, dim } from './display.js';

// ─── Types ───

export interface ImpactResult {
  targetFile: string;
  directDependents: string[];
  transitiveDependents: string[];
  directDependencies: string[];
  totalFilesInGraph: number;
  impactScore: number;
  affectedTests: string[];
  hubScore: number;
}

// ─── Analysis ───

/**
 * Build adjacency lists and run BFS to compute the full impact of a file change.
 *
 * The import graph from the scanner stores raw import specifiers (e.g. `@/lib/utils`,
 * `./foo`), not resolved file paths. We normalise both the target file and the graph
 * entries so that matching works regardless of how the user provides the file path.
 */
export function analyzeImpact(
  targetFile: string,
  importGraph: Array<{ file: string; imports: string[] }>,
  totalFiles: number,
): ImpactResult {
  // ── 1. Build canonical key mapping ──
  // The import graph has two kinds of identifiers:
  //   - File entries: relative paths like `components/ui/button.tsx`
  //   - Import specifiers: aliases like `@/components/ui/button` or relative `./foo`
  // We unify them by building an equivalence map: file path <-> @/ specifier.
  const canonicalOf = new Map<string, string>(); // alias -> canonical
  const allCanonicals = new Set<string>();

  // First pass: collect all file entries (these are the real files)
  const realFiles = new Set<string>();
  for (const entry of importGraph) {
    realFiles.add(entry.file);
  }

  // Build mapping: for each real file `foo/bar.tsx`, its @/ specifier `@/foo/bar` maps to it
  for (const file of realFiles) {
    const stripped = file.replace(/\.(ts|tsx|js|jsx)$/, '');
    const alias = '@/' + stripped;
    canonicalOf.set(alias, file);
    canonicalOf.set(file, file);
    // Also handle /index suffix: @/foo/bar/index -> @/foo/bar
    if (stripped.endsWith('/index')) {
      canonicalOf.set('@/' + stripped.replace(/\/index$/, ''), file);
    }
    allCanonicals.add(file);
  }

  // Helper to resolve any identifier to its canonical form
  function resolve(id: string): string {
    if (canonicalOf.has(id)) return canonicalOf.get(id)!;
    // Try stripping extension
    const stripped = id.replace(/\.(ts|tsx|js|jsx)$/, '');
    if (canonicalOf.has(stripped)) return canonicalOf.get(stripped)!;
    // Try adding @/
    if (!id.startsWith('@/') && !id.startsWith('.')) {
      const withAlias = '@/' + id;
      if (canonicalOf.has(withAlias)) return canonicalOf.get(withAlias)!;
      const withAliasStripped = '@/' + stripped;
      if (canonicalOf.has(withAliasStripped)) return canonicalOf.get(withAliasStripped)!;
    }
    return id; // unresolved (external or relative specifier)
  }

  // ── 1b. Also register import specifiers as canonical entries ──
  // Files that have no local imports themselves won't appear in realFiles,
  // but they can still be import *targets* (e.g. `@/lib/utils`).
  // We collect all @/ import specifiers and register them so they can be matched.
  for (const entry of importGraph) {
    for (const imp of entry.imports) {
      if (imp.startsWith('@/')) {
        const specAsFile = imp.slice(2); // remove @/
        // Try common extensions to find a plausible file path
        const extensions = ['.ts', '.tsx', '.js', '.jsx'];
        for (const ext of extensions) {
          const candidate = specAsFile + ext;
          if (!canonicalOf.has(candidate)) {
            canonicalOf.set(candidate, imp);
          }
        }
        if (!canonicalOf.has(imp)) {
          canonicalOf.set(imp, imp);
        }
        allCanonicals.add(imp);
      }
    }
  }

  // ── 2. Build adjacency lists using canonical keys ──
  const forward = new Map<string, Set<string>>();
  const reverse = new Map<string, Set<string>>();

  for (const entry of importGraph) {
    const from = resolve(entry.file);
    if (!forward.has(from)) forward.set(from, new Set());

    for (const imp of entry.imports) {
      const to = resolve(imp);
      forward.get(from)!.add(to);

      if (!reverse.has(to)) reverse.set(to, new Set());
      reverse.get(to)!.add(from);
    }
  }

  // ── 3. Find the target in the graph ──
  const normalised = normaliseTarget(targetFile);
  const resolvedTarget = resolve(normalised);
  const matchedKey = allCanonicals.has(resolvedTarget)
    ? resolvedTarget
    : findMatchingKey(normalised, allCanonicals);

  if (!matchedKey) {
    return {
      targetFile,
      directDependents: [],
      transitiveDependents: [],
      directDependencies: [],
      totalFilesInGraph: totalFiles,
      impactScore: 0,
      affectedTests: [],
      hubScore: 0,
    };
  }

  // ── 4. Direct dependents (who imports this file) ──
  const directDependents = [...(reverse.get(matchedKey) ?? [])].sort();

  // ── 5. BFS for transitive dependents ──
  const transitiveDependents: string[] = [];
  const visited = new Set<string>([matchedKey, ...directDependents]);
  const queue = [...directDependents];

  while (queue.length > 0) {
    const current = queue.shift()!;
    // Check both the file-level reverse edges and specifier-level
    const parents = reverse.get(current);
    if (!parents) continue;

    for (const parent of parents) {
      if (visited.has(parent)) continue;
      visited.add(parent);
      transitiveDependents.push(parent);
      queue.push(parent);
    }
  }
  transitiveDependents.sort();

  // ── 6. Direct dependencies (what this file imports) ──
  const directDependencies = [...(forward.get(matchedKey) ?? [])].sort();

  // ── 6. Identify test files in the impact zone ──
  const allAffected = [matchedKey, ...directDependents, ...transitiveDependents];
  const affectedTests = allAffected
    .filter(isTestFile)
    .sort();

  // ── 7. Impact score ──
  const uniqueAffected = new Set([...directDependents, ...transitiveDependents]);
  const impactScore = totalFiles > 0
    ? Math.round((uniqueAffected.size / totalFiles) * 1000) / 10
    : 0;

  // ── 8. Hub score ──
  const hubScore = directDependents.length;

  return {
    targetFile: matchedKey,
    directDependents,
    transitiveDependents,
    directDependencies,
    totalFilesInGraph: totalFiles,
    impactScore,
    affectedTests,
    hubScore,
  };
}

// ─── Formatting ───

export function formatImpactReport(result: ImpactResult): string {
  const lines: string[] = [];

  lines.push('');
  lines.push(heading('Impact Analysis'));

  // Target
  lines.push(`  ${chalk.dim('File:')}   ${chalk.cyan(result.targetFile)}`);

  // Impact score with colour
  const scoreStr = `${result.impactScore}%`;
  let scoreColoured: string;
  if (result.impactScore < 5) {
    scoreColoured = chalk.green(scoreStr);
  } else if (result.impactScore <= 20) {
    scoreColoured = chalk.yellow(scoreStr);
  } else {
    scoreColoured = chalk.red(scoreStr);
  }
  const totalAffected = result.directDependents.length + result.transitiveDependents.length;
  lines.push(`  ${chalk.dim('Impact:')} ${scoreColoured} of codebase (${totalAffected} files affected)`);
  lines.push(`  ${chalk.dim('Hub:')}    imported by ${result.hubScore} files`);
  lines.push('');

  // Direct dependents
  lines.push(chalk.bold(`  Direct Dependents (${result.directDependents.length})`));
  if (result.directDependents.length === 0) {
    lines.push(dim('No files directly import this file.'));
  } else {
    for (const dep of result.directDependents) {
      lines.push(`    ${chalk.yellow('\u2190')} ${dep}`);
    }
  }
  lines.push('');

  // Transitive dependents
  if (result.transitiveDependents.length > 0) {
    lines.push(chalk.bold(`  Transitive Dependents (${result.transitiveDependents.length})`));
    const maxShow = 20;
    const shown = result.transitiveDependents.slice(0, maxShow);
    for (const dep of shown) {
      lines.push(`    ${chalk.dim('\u2190\u2190')} ${dep}`);
    }
    if (result.transitiveDependents.length > maxShow) {
      lines.push(dim(`  ... and ${result.transitiveDependents.length - maxShow} more`));
    }
    lines.push('');
  }

  // Direct dependencies
  lines.push(chalk.bold(`  Dependencies (${result.directDependencies.length})`));
  if (result.directDependencies.length === 0) {
    lines.push(dim('This file has no local imports.'));
  } else {
    for (const dep of result.directDependencies) {
      lines.push(`    ${chalk.blue('\u2192')} ${dep}`);
    }
  }
  lines.push('');

  // Affected tests
  if (result.affectedTests.length > 0) {
    lines.push(chalk.bold(`  Affected Tests (${result.affectedTests.length})`));
    for (const t of result.affectedTests) {
      lines.push(`    ${chalk.magenta('\u25B6')} ${t}`);
    }
    lines.push('');
  } else {
    lines.push(dim('No test files in impact zone.'));
    lines.push('');
  }

  return lines.join('\n');
}

// ─── Helpers ───

function normaliseTarget(filePath: string): string {
  // Strip leading ./ or /
  const p = filePath.replace(/^\.\//, '').replace(/^\//, '');
  // Strip common prefix directories users might type
  // e.g. "packages/cli/src/lib/foo.ts" stays as-is
  return p;
}

function findMatchingKey(target: string, allFiles: Set<string>): string | null {
  // Exact match
  if (allFiles.has(target)) return target;

  // Try with common extensions
  const extensions = ['.ts', '.tsx', '.js', '.jsx'];
  for (const ext of extensions) {
    if (allFiles.has(target + ext)) return target + ext;
  }

  // Strip file extension for specifier matching (imports often omit extensions)
  const stripped = target.replace(/\.(ts|tsx|js|jsx)$/, '');

  // Try @/ alias: user types `lib/utils.ts` -> check `@/lib/utils`
  const asAlias = stripped.startsWith('@/') ? stripped : '@/' + stripped;
  if (allFiles.has(asAlias)) return asAlias;

  // Try without @/ prefix: user types `@/lib/utils` -> check `lib/utils`
  const withoutAlias = stripped.startsWith('@/') ? stripped.slice(2) : stripped;
  for (const f of allFiles) {
    const fStripped = f.replace(/\.(ts|tsx|js|jsx)$/, '');
    if (fStripped === withoutAlias || fStripped === stripped) {
      return f;
    }
  }

  // Try matching as a suffix (user typed partial path)
  const candidates: string[] = [];
  for (const f of allFiles) {
    if (f.endsWith('/' + target) || f === target) {
      candidates.push(f);
    }
    // Also try with extensions
    for (const ext of extensions) {
      if (f.endsWith('/' + target + ext) || f === target + ext) {
        candidates.push(f);
      }
    }
    // Try suffix matching on stripped versions
    const fStripped = f.replace(/\.(ts|tsx|js|jsx)$/, '');
    if (fStripped.endsWith('/' + stripped) || fStripped.endsWith('/' + withoutAlias)) {
      candidates.push(f);
    }
  }

  // Deduplicate
  const unique = [...new Set(candidates)];
  if (unique.length === 1) return unique[0];
  if (unique.length > 1) {
    // Prefer shortest match
    unique.sort((a, b) => a.length - b.length);
    return unique[0];
  }

  return null;
}

function isTestFile(filePath: string): boolean {
  return (
    /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(filePath) ||
    filePath.includes('__tests__/') ||
    filePath.includes('__test__/')
  );
}
