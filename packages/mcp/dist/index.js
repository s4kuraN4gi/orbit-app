#!/usr/bin/env node

// src/server.ts
import { basename } from "path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { scanProject } from "@orbit-cli/core/detector";
import { buildContextIR } from "@orbit-cli/core/context-ir";
import { ScanCache } from "@orbit-cli/core/cache";
import { resolveTaskFocus } from "@orbit-cli/core/task-focus";
console.log = console.error;
var cache = new ScanCache();
async function getOrBuildIR(dir) {
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
async function startMcpServer() {
  const server = new McpServer({
    name: "orbit",
    version: "0.1.0"
  });
  server.tool(
    "orbit_getProjectContext",
    "Get full project context (structure, tech stack, code map, tasks, git status)",
    {
      dir: z.string().optional().describe("Project directory (default: cwd)")
    },
    async ({ dir }) => {
      const projectDir = dir ?? process.cwd();
      const { ir } = await getOrBuildIR(projectDir);
      return {
        content: [{ type: "text", text: JSON.stringify(ir, null, 2) }]
      };
    }
  );
  server.tool(
    "orbit_getModuleContext",
    "Get module details: exports, imports, and importedBy count",
    {
      path: z.string().describe("Module file path (relative to project root)")
    },
    async ({ path: modulePath }) => {
      const dir = process.cwd();
      const { ir } = await getOrBuildIR(dir);
      const mod = ir.codeMap.modules.find((m) => m.path === modulePath);
      if (!mod) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `Module not found: ${modulePath}` }) }]
        };
      }
      const importedByFiles = ir.architecture.importGraph.filter((e) => e.to === modulePath || e.to.endsWith(`/${modulePath}`)).map((e) => e.from);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            path: mod.path,
            exports: mod.exports,
            imports: mod.imports,
            importedBy: mod.importedBy,
            importedByFiles
          }, null, 2)
        }]
      };
    }
  );
  server.tool(
    "orbit_getActiveTasks",
    "Get in-progress tasks and git status (local-only, no auth required)",
    {},
    async () => {
      const dir = process.cwd();
      const { ir } = await getOrBuildIR(dir);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            tasks: ir.activeWork.tasks.filter((t) => t.status === "in_progress"),
            allTasks: ir.activeWork.tasks,
            git: ir.activeWork.git
          }, null, 2)
        }]
      };
    }
  );
  server.tool(
    "orbit_getFileRelations",
    "Get import/export relationships for a file",
    {
      path: z.string().describe("File path (relative to project root)")
    },
    async ({ path: filePath }) => {
      const dir = process.cwd();
      const { ir } = await getOrBuildIR(dir);
      const outgoing = ir.architecture.importGraph.filter((e) => e.from === filePath).map((e) => e.to);
      const incoming = ir.architecture.importGraph.filter((e) => e.to === filePath || e.to.endsWith(`/${filePath}`)).map((e) => e.from);
      const mod = ir.codeMap.modules.find((m) => m.path === filePath);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            path: filePath,
            imports: outgoing,
            importedBy: incoming,
            exports: mod?.exports ?? []
          }, null, 2)
        }]
      };
    }
  );
  server.tool(
    "orbit_getTaskFocus",
    "Get focus areas: files and modules relevant to active in-progress tasks",
    {
      dir: z.string().optional().describe("Project directory (default: cwd)")
    },
    async ({ dir }) => {
      const projectDir = dir ?? process.cwd();
      const { ir } = await getOrBuildIR(projectDir);
      const focusAreas = resolveTaskFocus([], ir);
      return {
        content: [{ type: "text", text: JSON.stringify(focusAreas, null, 2) }]
      };
    }
  );
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[orbit-mcp] Server started on stdio");
}

// src/index.ts
startMcpServer().catch((err) => {
  console.error("[orbit-mcp] Fatal error:", err);
  process.exit(1);
});
