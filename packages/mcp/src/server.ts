import { basename } from 'node:path';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerOrbitTools } from '../../cli/src/lib/mcp-tools.js';

// ── Redirect console.log to stderr (stdio transport protection) ──
const originalLog = console.log;
console.log = console.error;

// ── No-op TaskProvider (standalone mode, no auth) ──
const taskProvider = {
  async getTasks() { return [] as never[]; },
  async getProjectName() { return basename(process.cwd()); },
};

export async function startMcpServer(): Promise<void> {
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
