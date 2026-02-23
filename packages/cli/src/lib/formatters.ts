import type { ScanResult } from './detector.js';

export type OutputFormat = 'markdown' | 'json' | 'yaml';

export function formatScanResult(scan: ScanResult, format: OutputFormat): string {
  switch (format) {
    case 'json':
      return JSON.stringify(scan, null, 2);
    case 'yaml':
      return toYaml(scan);
    case 'markdown':
      return toMarkdownSummary(scan);
  }
}

// ─── YAML serializer (no external dependency) ───
function toYaml(obj: unknown, indent = 0): string {
  const prefix = '  '.repeat(indent);

  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    if (obj.includes('\n') || obj.includes(':') || obj.includes('#') || obj.includes("'") || obj.includes('"')) {
      return `"${obj.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    // Simple scalar arrays on one line
    if (obj.every(v => typeof v !== 'object' || v === null)) {
      return `[${obj.map(v => typeof v === 'string' ? `"${v}"` : String(v)).join(', ')}]`;
    }
    return '\n' + obj.map(item => {
      const yaml = toYaml(item, indent + 1);
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const lines = yaml.split('\n').filter(Boolean);
        return `${prefix}- ${lines[0].trim()}\n${lines.slice(1).map(l => `${prefix}  ${l.trim()}`).join('\n')}`;
      }
      return `${prefix}- ${yaml}`;
    }).join('\n');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return entries.map(([key, val]) => {
      const yaml = toYaml(val, indent + 1);
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        return `${prefix}${key}:\n${yaml}`;
      }
      if (Array.isArray(val) && val.length > 0 && val.some(v => typeof v === 'object' && v !== null)) {
        return `${prefix}${key}:${yaml}`;
      }
      return `${prefix}${key}: ${yaml}`;
    }).join('\n');
  }

  return String(obj);
}

// ─── Markdown summary (standalone, not for AI context) ───
function toMarkdownSummary(scan: ScanResult): string {
  const lines: string[] = [];

  lines.push('# Scan Result');
  lines.push('');

  if (scan.techStack.length > 0) {
    lines.push(`**Tech Stack:** ${scan.techStack.join(' / ')}`);
  }
  if (scan.packageManager) {
    lines.push(`**Package Manager:** ${scan.packageManager}`);
  }
  lines.push(`**Dependencies:** ${scan.depCount.total} (${scan.depCount.dev} dev)`);
  lines.push('');

  if (scan.structure.pages.length > 0) {
    lines.push(`**Pages:** ${scan.structure.pages.length}`);
  }
  if (scan.structure.apiRoutes.length > 0) {
    lines.push(`**API Routes:** ${scan.structure.apiRoutes.length}`);
  }
  if (scan.structure.dbTables.length > 0) {
    lines.push(`**DB Tables:** ${scan.structure.dbTables.map(t => t.name).join(', ')}`);
  }
  lines.push('');

  lines.push(`**Files:** ${scan.codeMetrics.totalFiles} | **Lines:** ~${scan.codeMetrics.totalLines.toLocaleString()}`);

  if (scan.exports.length > 0) {
    const components = scan.exports.filter(e => e.kind === 'component').length;
    const functions = scan.exports.filter(e => e.kind === 'function').length;
    const types = scan.exports.filter(e => e.kind === 'type').length;
    lines.push(`**Exports:** ${scan.exports.length} (${components} components, ${functions} functions, ${types} types)`);
  }

  if (scan.importGraph.length > 0) {
    const totalImports = scan.importGraph.reduce((sum, f) => sum + f.imports.length, 0);
    lines.push(`**Import Graph:** ${scan.importGraph.length} files, ${totalImports} local imports`);
  }

  if (scan.git) {
    lines.push('');
    lines.push(`**Branch:** ${scan.git.branch} | **Commits:** ${scan.git.totalCommits} total, ${scan.git.recentCommits} this week`);
  }

  if (scan.deployment.platform || scan.deployment.ci) {
    lines.push('');
    if (scan.deployment.platform) lines.push(`**Platform:** ${scan.deployment.platform}`);
    if (scan.deployment.ci) lines.push(`**CI:** ${scan.deployment.ci}`);
  }

  lines.push('');
  return lines.join('\n');
}
