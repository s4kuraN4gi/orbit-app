/**
 * Tree-sitter PoC for scanExports()
 *
 * Compares tree-sitter AST-based export extraction against the existing
 * regex-based approach in detector.ts. This PoC targets the single most
 * regex-heavy function (scanExports, L202-254) to evaluate:
 *
 * 1. Accuracy: does AST catch edge cases regex misses?
 * 2. Performance: is tree-sitter faster or slower?
 * 3. Bundle impact: native binary dependency concerns
 *
 * Usage (dev only):
 *   npx tsx src/lib/tree-sitter-poc.ts [dir]
 *
 * Requirements (devDependency):
 *   pnpm add -D tree-sitter tree-sitter-typescript
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

// ─── Type stubs for tree-sitter (only needed when installed) ───

/* eslint-disable @typescript-eslint/no-explicit-any */
interface TreeSitterNode {
  type: string;
  text: string;
  childCount: number;
  children: TreeSitterNode[];
  namedChildren: TreeSitterNode[];
  child(index: number): TreeSitterNode | null;
  childForFieldName(name: string): TreeSitterNode | null;
}

interface TreeSitterTree {
  rootNode: TreeSitterNode;
}

interface TreeSitterParser {
  setLanguage(lang: any): void;
  parse(input: string): TreeSitterTree;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Types ───

export interface ExportEntry {
  file: string;
  name: string;
  kind: 'function' | 'component' | 'const' | 'type';
}

interface ComparisonResult {
  file: string;
  regexOnly: ExportEntry[];
  treeSitterOnly: ExportEntry[];
  matched: ExportEntry[];
}

// ─── Tree-sitter export scanner ───

/**
 * Scan exports from a single file using tree-sitter AST.
 *
 * NOTE: This requires `tree-sitter` and `tree-sitter-typescript` to be installed.
 * Since these are native modules, they are loaded dynamically to avoid
 * breaking the CLI build if not installed.
 */
export async function scanExportsWithTreeSitter(
  filePath: string,
  content: string,
  relPath: string,
): Promise<ExportEntry[]> {
  // Dynamic import to avoid build-time dependency
  const ParserModule = await import(/* webpackIgnore: true */ 'tree-sitter' + '');
  const Parser = ParserModule.default as new () => TreeSitterParser;
  const TypeScriptModule = await import(/* webpackIgnore: true */ 'tree-sitter-typescript' + '');
  const TypeScript = TypeScriptModule.default as { tsx: unknown; typescript: unknown };

  const parser = new Parser();
  const isTsx = filePath.endsWith('.tsx');
  parser.setLanguage(isTsx ? TypeScript.tsx : TypeScript.typescript);

  const tree = parser.parse(content);
  const exports: ExportEntry[] = [];

  // Walk top-level children looking for export statements
  const rootNode = tree.rootNode;

  for (let i = 0; i < rootNode.childCount; i++) {
    const node = rootNode.child(i);
    if (!node) continue;

    const nodeType = node.type;

    // export_statement wraps: export function/const/type/interface/default
    if (nodeType === 'export_statement') {
      const declaration = node.namedChildren.find(
        (c: TreeSitterNode) =>
          c.type === 'function_declaration' ||
          c.type === 'lexical_declaration' ||
          c.type === 'type_alias_declaration' ||
          c.type === 'interface_declaration' ||
          c.type === 'class_declaration',
      );

      if (declaration) {
        switch (declaration.type) {
          case 'function_declaration': {
            const nameNode = declaration.childForFieldName('name');
            if (nameNode) {
              const name = nameNode.text;
              const kind = /^[A-Z]/.test(name) ? 'component' : 'function';
              exports.push({ file: relPath, name, kind });
            }
            break;
          }

          case 'lexical_declaration': {
            // export const Foo = ... or export const foo = ...
            for (const declarator of declaration.namedChildren) {
              if (declarator.type === 'variable_declarator') {
                const nameNode = declarator.childForFieldName('name');
                if (nameNode) {
                  const name = nameNode.text;
                  const kind = /^[A-Z]/.test(name) ? 'component' : 'const';
                  exports.push({ file: relPath, name, kind });
                }
              }
            }
            break;
          }

          case 'type_alias_declaration':
          case 'interface_declaration': {
            const nameNode = declaration.childForFieldName('name');
            if (nameNode) {
              exports.push({ file: relPath, name: nameNode.text, kind: 'type' });
            }
            break;
          }

          case 'class_declaration': {
            const nameNode = declaration.childForFieldName('name');
            if (nameNode) {
              exports.push({ file: relPath, name: nameNode.text, kind: 'component' });
            }
            break;
          }
        }
      }

      // export default function Foo(...)
      const isDefault = node.children.some((c: TreeSitterNode) => c.type === 'default');
      if (isDefault) {
        const funcDecl = node.namedChildren.find(
          (c: TreeSitterNode) => c.type === 'function_declaration',
        );
        if (funcDecl) {
          const nameNode = funcDecl.childForFieldName('name');
          if (nameNode) {
            const name = nameNode.text;
            // Only add if not already captured above
            if (!exports.some((e) => e.file === relPath && e.name === name)) {
              const kind = /^[A-Z]/.test(name) ? 'component' : 'function';
              exports.push({ file: relPath, name, kind });
            }
          }
        }
      }
    }
  }

  return exports;
}

// ─── Regex-based scanner (copy from detector.ts for comparison) ───

function scanExportsWithRegex(content: string, relPath: string): ExportEntry[] {
  const results: ExportEntry[] = [];

  // export function / export async function (PascalCase = component)
  for (const m of content.matchAll(/export\s+(?:async\s+)?function\s+([A-Z]\w*)/g)) {
    results.push({ file: relPath, name: m[1], kind: 'component' });
  }
  for (const m of content.matchAll(/export\s+(?:async\s+)?function\s+([a-z]\w*)/g)) {
    results.push({ file: relPath, name: m[1], kind: 'function' });
  }
  // export default function
  for (const m of content.matchAll(/export\s+default\s+(?:async\s+)?function\s+([A-Z]\w*)/g)) {
    if (!results.some((r) => r.file === relPath && r.name === m[1])) {
      results.push({ file: relPath, name: m[1], kind: 'component' });
    }
  }
  for (const m of content.matchAll(/export\s+default\s+(?:async\s+)?function\s+([a-z]\w*)/g)) {
    if (!results.some((r) => r.file === relPath && r.name === m[1])) {
      results.push({ file: relPath, name: m[1], kind: 'function' });
    }
  }
  // export const
  for (const m of content.matchAll(/export\s+const\s+([A-Z]\w*)\s*[=:]/g)) {
    results.push({ file: relPath, name: m[1], kind: 'component' });
  }
  for (const m of content.matchAll(/export\s+const\s+([a-z]\w*)\s*[=:]/g)) {
    results.push({ file: relPath, name: m[1], kind: 'const' });
  }
  // export type / export interface
  for (const m of content.matchAll(/export\s+(?:type|interface)\s+(\w+)/g)) {
    results.push({ file: relPath, name: m[1], kind: 'type' });
  }

  return results;
}

// ─── Comparison runner ───

async function collectTsFiles(dir: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(d: string) {
    const entries = await readdir(d, { withFileTypes: true });
    for (const entry of entries) {
      const full = join(d, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.next') continue;
        await walk(full);
      } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
        results.push(full);
      }
    }
  }

  await walk(dir);
  return results;
}

export async function compareApproaches(dir: string): Promise<{
  results: ComparisonResult[];
  summary: {
    totalFiles: number;
    regexTime: number;
    treeSitterTime: number;
    regexTotal: number;
    treeSitterTotal: number;
    matchedTotal: number;
    regexOnlyTotal: number;
    treeSitterOnlyTotal: number;
  };
}> {
  const files = await collectTsFiles(dir);
  const results: ComparisonResult[] = [];

  let regexTime = 0;
  let treeSitterTime = 0;
  let regexTotal = 0;
  let treeSitterTotal = 0;
  let matchedTotal = 0;
  let regexOnlyTotal = 0;
  let treeSitterOnlyTotal = 0;

  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const relPath = relative(dir, file).replace(/\\/g, '/');

    // Regex approach
    const regexStart = performance.now();
    const regexExports = scanExportsWithRegex(content, relPath);
    regexTime += performance.now() - regexStart;

    // Tree-sitter approach
    const tsStart = performance.now();
    let tsExports: ExportEntry[];
    try {
      tsExports = await scanExportsWithTreeSitter(file, content, relPath);
    } catch {
      // tree-sitter not installed — skip
      tsExports = [];
    }
    treeSitterTime += performance.now() - tsStart;

    // Compare
    const regexSet = new Set(regexExports.map((e) => `${e.name}:${e.kind}`));
    const tsSet = new Set(tsExports.map((e) => `${e.name}:${e.kind}`));

    const matched = regexExports.filter((e) => tsSet.has(`${e.name}:${e.kind}`));
    const regexOnly = regexExports.filter((e) => !tsSet.has(`${e.name}:${e.kind}`));
    const treeSitterOnly = tsExports.filter((e) => !regexSet.has(`${e.name}:${e.kind}`));

    regexTotal += regexExports.length;
    treeSitterTotal += tsExports.length;
    matchedTotal += matched.length;
    regexOnlyTotal += regexOnly.length;
    treeSitterOnlyTotal += treeSitterOnly.length;

    if (regexOnly.length > 0 || treeSitterOnly.length > 0) {
      results.push({ file: relPath, regexOnly, treeSitterOnly, matched });
    }
  }

  return {
    results,
    summary: {
      totalFiles: files.length,
      regexTime: Math.round(regexTime * 100) / 100,
      treeSitterTime: Math.round(treeSitterTime * 100) / 100,
      regexTotal,
      treeSitterTotal,
      matchedTotal,
      regexOnlyTotal,
      treeSitterOnlyTotal,
    },
  };
}

// ─── CLI entry point ───

async function main() {
  const dir = process.argv[2] || process.cwd();

  console.log(`\n  Tree-sitter PoC — Comparing export scanners\n`);
  console.log(`  Directory: ${dir}\n`);

  try {
    const { results, summary } = await compareApproaches(dir);

    console.log('  === Summary ===');
    console.log(`  Files scanned:        ${summary.totalFiles}`);
    console.log(`  Regex exports found:  ${summary.regexTotal}`);
    console.log(`  Tree-sitter found:    ${summary.treeSitterTotal}`);
    console.log(`  Matched (both):       ${summary.matchedTotal}`);
    console.log(`  Regex only:           ${summary.regexOnlyTotal}`);
    console.log(`  Tree-sitter only:     ${summary.treeSitterOnlyTotal}`);
    console.log('');
    console.log('  === Performance ===');
    console.log(`  Regex time:           ${summary.regexTime}ms`);
    console.log(`  Tree-sitter time:     ${summary.treeSitterTime}ms`);
    console.log(`  Speedup:              ${(summary.regexTime / (summary.treeSitterTime || 1)).toFixed(2)}x`);
    console.log('');

    if (results.length > 0) {
      console.log('  === Differences ===');
      for (const diff of results.slice(0, 20)) {
        console.log(`\n  File: ${diff.file}`);
        if (diff.regexOnly.length > 0) {
          console.log('    Regex only:');
          for (const e of diff.regexOnly) {
            console.log(`      - ${e.kind}: ${e.name}`);
          }
        }
        if (diff.treeSitterOnly.length > 0) {
          console.log('    Tree-sitter only:');
          for (const e of diff.treeSitterOnly) {
            console.log(`      - ${e.kind}: ${e.name}`);
          }
        }
      }
      if (results.length > 20) {
        console.log(`\n  ... and ${results.length - 20} more files with differences`);
      }
    } else {
      console.log('  No differences found — both approaches produce identical results.');
    }

    // Decision summary
    console.log('\n  === Decision Factors ===');
    const accuracy = summary.matchedTotal / (summary.regexTotal || 1) * 100;
    console.log(`  Accuracy match:       ${accuracy.toFixed(1)}%`);
    console.log(`  Native binary:        tree-sitter requires platform-specific binaries`);
    console.log(`  Bundle size impact:   ~5-10MB per platform (tree-sitter + grammar)`);
    console.log(`  npx compatibility:    May require postinstall or prebuild steps`);
    console.log(`  Recommendation:       ${accuracy > 95 ? 'Consider for Phase 4 if performance justifies it' : 'Regex approach sufficient for current needs'}`);
    console.log('');
  } catch (err) {
    if (err instanceof Error && err.message.includes('Cannot find module')) {
      console.log('  tree-sitter not installed. Install with:');
      console.log('    pnpm add -D tree-sitter tree-sitter-typescript');
      console.log('');
      console.log('  Running regex-only analysis for baseline...\n');

      // Run regex-only baseline
      const files = await collectTsFiles(dir);
      let total = 0;
      const start = performance.now();
      for (const file of files) {
        const content = await readFile(file, 'utf-8');
        const relPath = relative(dir, file).replace(/\\/g, '/');
        const exports = scanExportsWithRegex(content, relPath);
        total += exports.length;
      }
      const elapsed = performance.now() - start;

      console.log(`  Files:    ${files.length}`);
      console.log(`  Exports:  ${total}`);
      console.log(`  Time:     ${elapsed.toFixed(2)}ms`);
      console.log('');
    } else {
      throw err;
    }
  }
}

// Only run if executed directly
const isMain = process.argv[1]?.endsWith('tree-sitter-poc.ts') ||
               process.argv[1]?.endsWith('tree-sitter-poc.js');
if (isMain) {
  main().catch(console.error);
}
