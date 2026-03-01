import { basename } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { apiRequest } from '../lib/api.js';
import { sessionExists } from '../lib/config.js';
import { getProjectLink } from '../lib/project.js';
import { registerOrbitTools } from '../lib/mcp-tools.js';
import type { Task, OrbitProjectLink } from '../types.js';
import type { TaskProvider } from '../lib/mcp-tools.js';

// ── Redirect console.log to stderr (stdio transport protection) ──
const originalLog = console.log;
console.log = console.error;

async function tryGetProjectLink(): Promise<OrbitProjectLink | null> {
  if (!sessionExists()) return null;
  try {
    return await getProjectLink();
  } catch {
    return null;
  }
}

async function fetchTasks(link: OrbitProjectLink | null): Promise<Task[]> {
  if (!link) return [];
  try {
    const data = await apiRequest<{ tasks: Task[] }>('GET', `/api/cli/projects/${link.project_id}/tasks`);
    return data.tasks ?? [];
  } catch {
    return [];
  }
}

// ── TaskProvider that fetches from Orbit API ──
const taskProvider: TaskProvider = {
  async getTasks() {
    const link = await tryGetProjectLink();
    return fetchTasks(link);
  },
  async getProjectName() {
    const link = await tryGetProjectLink();
    return link?.project_name ?? basename(process.cwd());
  },
};

export async function mcpServeCommand(): Promise<void> {
  const server = new McpServer({
    name: 'orbit',
    version: '0.1.0',
  });

  registerOrbitTools(server, taskProvider);

  // ── Start server ──
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[orbit-mcp] Server started on stdio');
}
