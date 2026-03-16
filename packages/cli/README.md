# @orbit-cli/core

**AI context engine for your codebase.** Generate structured context files for Claude, Cursor, Copilot, Windsurf, and other AI assistants.

![Orbit demo](https://raw.githubusercontent.com/s4kuraN4gi/orbit-app/main/packages/cli/demo.gif)

Unlike code-dump tools (like Repomix), Orbit understands your project's *structure* — tech stack, routes, database schema, import graph, dependencies, and git activity — and generates focused context that helps AI assistants write better code.

## Why Orbit?

| | Orbit | Code-dump tools |
|---|---|---|
| **Output** | Structured context (tech, routes, DB, imports) | Raw file contents |
| **Token usage** | Minimal (structure only) | High (full source code) |
| **Multi-format** | CLAUDE.md, .cursorrules, Copilot, Windsurf | Usually one format |
| **Import graph** | Hub modules ranked by dependency count | None |
| **Custom rules** | Preserved across regeneration | N/A |
| **Setup** | Zero config — just run `npx` | Often requires configuration |

## Quick Start

```bash
# Generate a CLAUDE.md (no sign-up, no config)
npx @orbit-cli/core scan -g

# Preview what Orbit detects (without writing a file)
npx @orbit-cli/core scan
```

That's it. Open the generated `CLAUDE.md` in Claude Code, and your AI assistant now understands your project.

## Multi-Format Output (Pro)

Generate context files for any AI assistant:

```bash
orbit scan -g                          # CLAUDE.md (free)
orbit scan -g --target cursor          # .cursorrules
orbit scan -g --target copilot         # .github/copilot-instructions.md
orbit scan -g --target windsurf        # .windsurfrules
orbit scan -g --target cursor-mdc      # .cursor/rules/*.mdc (modular)
```

## What It Detects

- **Tech Stack** — frameworks, languages, package manager, Node version
- **Project Structure** — pages, API routes, database tables
- **Import Graph** — module dependencies, hub modules ranked by import count
- **Exports** — components, functions, types with file locations
- **Dependencies** — categorized (UI, state, testing, database, auth, etc.)
- **Git Status** — branch, recent commits, uncommitted changes
- **Code Metrics** — file count, lines of code, largest files
- **Deployment** — platform (Vercel, AWS, etc.) and CI configuration
- **Environment Variables** — variable names detected (values are never read)
- **Scripts** — npm/pnpm scripts available

## Custom Rules (Preserved on Regeneration)

When you re-run `orbit scan -g`, your hand-written notes are preserved:

```markdown
<!-- ORBIT:USER-START -->
## Our Coding Standards
- Use `const` over `let` everywhere
- All API routes must validate input with Zod
- Components use named exports, not default
<!-- ORBIT:USER-END -->
```

Write anything between the markers — Orbit keeps it intact across regeneration.

## Task-Aware Context (Optional)

Connect to the Orbit dashboard to include task context — so AI knows *what you're building right now*:

```bash
orbit login                 # Sign in
orbit init                  # Link to a project
orbit add "Add user auth"   # Create a task
orbit start ORB-a1b2        # Start working
orbit scan -g               # Context now includes active tasks
```

## MCP Server

Use Orbit as an MCP server for real-time context in Claude Desktop or other MCP clients:

```bash
orbit mcp-serve
```

Provides tools: `orbit_getProjectContext`, `orbit_getModuleContext`, `orbit_getActiveTasks`, `orbit_getFileRelations`, `orbit_getTaskFocus`.

## All Commands

| Command | Description |
|---------|-------------|
| `orbit scan` | Scan project and display overview |
| `orbit scan -g` | Generate AI context file |
| `orbit scan -g --target <format>` | Generate for specific AI tool |
| `orbit watch` | Watch for changes and auto-regenerate |
| `orbit focus <task-id>` | Generate task-focused context |
| `orbit login` | Sign in to Orbit |
| `orbit init` | Link directory to a project |
| `orbit list` | List tasks |
| `orbit add <title>` | Create a task |
| `orbit start <id>` | Start a task |
| `orbit done <id>` | Complete a task |
| `orbit mcp-serve` | Start MCP server |
| `orbit issues` | Import GitHub issues as tasks |

## Requirements

- Node.js >= 20

## Free vs Pro

| Feature | Free | Pro ($12/mo) |
|---------|------|-------------|
| `scan -g` (CLAUDE.md) | Unlimited | Unlimited |
| Multi-format output | - | All formats |
| Custom rules preservation | 1 project | Unlimited |
| `orbit watch` | - | Unlimited |
| MCP Server | - | Authenticated |
| Context history | 3 snapshots | Unlimited |
| Smart Context | - | AI-powered |

## License

MIT
