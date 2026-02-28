import { basename } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// Import from @orbit-cli/core subpath exports
import { scanProject } from '@orbit-cli/core/detector';
import type { ScanResult } from '@orbit-cli/core/detector';
import { buildContextIR } from '@orbit-cli/core/context-ir';
import type { ContextIR } from '@orbit-cli/core/context-ir';
import { ScanCache } from '@orbit-cli/core/cache';
import { resolveTaskFocus } from '@orbit-cli/core/task-focus';

// ── Redirect console.log to stderr (stdio transport protection) ──
const originalLog = console.log;
console.log = console.error;

const cache = new ScanCache();

async function getOrBuildIR(dir: string): Promise<{ scan: ScanResult; ir: ContextIR }> {
  // Try cache first
  const cached = await cache.get(dir);
  if (cached) {
    return { scan: cached.scan, ir: cached.ir };
  }

  const projectName = basename(dir);
  const scan = await scanProject(dir);
  const ir = buildContextIR(scan, [], projectName);
  await cache.set(dir, scan, ir);

  return { scan, ir };
}

export async function startMcpServer(): Promise<void> {
  const server = new McpServer({
    name: 'orbit',
    version: '0.1.0',
  });

  // ── Tool: orbit_getProjectContext ──
  server.tool(
    'orbit_getProjectContext',
    'Get full project context (structure, tech stack, code map, tasks, git status)',
    {
      dir: z.string().optional().describe('Project directory (default: cwd)'),
    },
    async ({ dir }) => {
      const projectDir = dir ?? process.cwd();
      const { ir } = await getOrBuildIR(projectDir);
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(ir, null, 2) }],
      };
    },
  );

  // ── Tool: orbit_getModuleContext ──
  server.tool(
    'orbit_getModuleContext',
    'Get module details: exports, imports, and importedBy count',
    {
      path: z.string().describe('Module file path (relative to project root)'),
    },
    async ({ path: modulePath }) => {
      const dir = process.cwd();
      const { ir } = await getOrBuildIR(dir);

      const mod = ir.codeMap.modules.find(m => m.path === modulePath);
      if (!mod) {
        return {
          content: [{ type: 'text' as const, text: JSON.stringify({ error: `Module not found: ${modulePath}` }) }],
        };
      }

      // Find files that import this module
      const importedByFiles = ir.architecture.importGraph
        .filter(e => e.to === modulePath || e.to.endsWith(`/${modulePath}`))
        .map(e => e.from);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            path: mod.path,
            exports: mod.exports,
            imports: mod.imports,
            importedBy: mod.importedBy,
            importedByFiles,
          }, null, 2),
        }],
      };
    },
  );

  // ── Tool: orbit_getActiveTasks ──
  server.tool(
    'orbit_getActiveTasks',
    'Get in-progress tasks and git status (local-only, no auth required)',
    {},
    async () => {
      const dir = process.cwd();
      const { ir } = await getOrBuildIR(dir);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            tasks: ir.activeWork.tasks.filter(t => t.status === 'in_progress'),
            allTasks: ir.activeWork.tasks,
            git: ir.activeWork.git,
          }, null, 2),
        }],
      };
    },
  );

  // ── Tool: orbit_getFileRelations ──
  server.tool(
    'orbit_getFileRelations',
    'Get import/export relationships for a file',
    {
      path: z.string().describe('File path (relative to project root)'),
    },
    async ({ path: filePath }) => {
      const dir = process.cwd();
      const { ir } = await getOrBuildIR(dir);

      // Imports from this file
      const outgoing = ir.architecture.importGraph
        .filter(e => e.from === filePath)
        .map(e => e.to);

      // Files that import this file
      const incoming = ir.architecture.importGraph
        .filter(e => e.to === filePath || e.to.endsWith(`/${filePath}`))
        .map(e => e.from);

      // Exports from this file
      const mod = ir.codeMap.modules.find(m => m.path === filePath);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            path: filePath,
            imports: outgoing,
            importedBy: incoming,
            exports: mod?.exports ?? [],
          }, null, 2),
        }],
      };
    },
  );

  // ── Tool: orbit_getTaskFocus ──
  server.tool(
    'orbit_getTaskFocus',
    'Get focus areas: files and modules relevant to active in-progress tasks',
    {
      dir: z.string().optional().describe('Project directory (default: cwd)'),
    },
    async ({ dir }) => {
      const projectDir = dir ?? process.cwd();
      const { ir } = await getOrBuildIR(projectDir);

      // Standalone mode: no auth, resolve focus from IR tasks only
      const focusAreas = resolveTaskFocus([], ir);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(focusAreas, null, 2) }],
      };
    },
  );

  // ── Start server ──
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[orbit-mcp] Server started on stdio');
}
