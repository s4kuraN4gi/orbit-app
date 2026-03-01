import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ContextIR } from './context-ir.js';
import type { ScanResult } from './detector.js';
import type { Task } from '../types.js';
import { z } from 'zod';
import { ScanCache } from './cache.js';
import { scanProject } from './detector.js';
import { buildContextIR } from './context-ir.js';
import { resolveTaskFocus } from './task-focus.js';

export interface TaskProvider {
  getTasks(): Promise<Task[]>;
  getProjectName(): Promise<string>;
}

export function registerOrbitTools(
  server: McpServer,
  taskProvider: TaskProvider,
): void {
  const cache = new ScanCache();

  async function getOrBuildIR(dir: string): Promise<{ scan: ScanResult; ir: ContextIR }> {
    const cached = await cache.get(dir);
    if (cached) return { scan: cached.scan, ir: cached.ir };

    const projectName = await taskProvider.getProjectName();
    const scan = await scanProject(dir);
    const tasks = await taskProvider.getTasks();
    const ir = buildContextIR(scan, tasks, projectName);
    await cache.set(dir, scan, ir);
    return { scan, ir };
  }

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
    'Get in-progress tasks and git status',
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

      const tasks = await taskProvider.getTasks();
      const focusAreas = resolveTaskFocus(tasks, ir);

      return {
        content: [{ type: 'text' as const, text: JSON.stringify(focusAreas, null, 2) }],
      };
    },
  );
}
