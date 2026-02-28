# @orbit-cli/mcp

MCP (Model Context Protocol) server for Orbit. Expose your project's structured context to AI assistants like Claude Desktop, Cursor, and others.

## What it does

`@orbit-cli/mcp` runs as a local MCP server that gives AI assistants rich, structured understanding of your codebase:

- **Project context** — tech stack, architecture layers, DB schema, scripts, environment variables
- **Code map** — module exports, imports, and dependency graph
- **File relations** — what imports a file, what it exports, and its connections
- **Active tasks** — in-progress work and git status
- **Task focus** — files and modules relevant to current tasks

## Installation

```bash
npm install -g @orbit-cli/mcp
```

Or use directly with npx:

```bash
npx @orbit-cli/mcp
```

> **Peer dependency:** Requires `@orbit-cli/core` (installed automatically if using npm/pnpm).

## Setup

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "orbit": {
      "command": "npx",
      "args": ["-y", "@orbit-cli/mcp"],
      "env": {}
    }
  }
}
```

**Config file locations:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### Cursor

Add to your MCP settings (`.cursor/mcp.json` in your project or global settings):

```json
{
  "mcpServers": {
    "orbit": {
      "command": "npx",
      "args": ["-y", "@orbit-cli/mcp"]
    }
  }
}
```

### Claude Code

Add to your `.claude/settings.json`:

```json
{
  "mcpServers": {
    "orbit": {
      "command": "npx",
      "args": ["-y", "@orbit-cli/mcp"]
    }
  }
}
```

### Generic / Other MCP Clients

Run the server on stdio:

```bash
orbit-mcp
```

The server communicates via stdin/stdout using the MCP protocol.

## Available Tools

| Tool | Description |
|------|-------------|
| `orbit_getProjectContext` | Full project context: structure, tech stack, code map, tasks, git status |
| `orbit_getModuleContext` | Module details: exports, imports, and importedBy count |
| `orbit_getActiveTasks` | In-progress tasks and git status |
| `orbit_getFileRelations` | Import/export relationships for a file |
| `orbit_getTaskFocus` | Focus areas: files and modules relevant to active tasks |

## How it works

The MCP server uses `@orbit-cli/core`'s project scanner to analyze your codebase locally. No data is sent to any server -- everything runs on your machine.

1. Scans your project directory for structure, dependencies, and code patterns
2. Builds a structured context IR (Intermediate Representation)
3. Caches results for fast repeated access (7-day TTL)
4. Serves context to AI assistants via the MCP protocol over stdio

## License

MIT
