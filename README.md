<div align="center">

# Orbit

**AI context engine for your codebase.**

Generate structured context files for Claude, Cursor, Copilot, Windsurf, and other AI coding assistants — in one command.

[![npm version](https://img.shields.io/npm/v/@orbit-cli/core?color=blue)](https://www.npmjs.com/package/@orbit-cli/core)
[![npm downloads](https://img.shields.io/npm/dm/@orbit-cli/core?color=green)](https://www.npmjs.com/package/@orbit-cli/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-brightgreen)](https://nodejs.org)

![Orbit demo](https://raw.githubusercontent.com/s4kuraN4gi/orbit-app/main/packages/cli/demo.gif)

</div>

---

## Why Orbit?

AI assistants write better code when they understand your project. But feeding them raw source files wastes tokens and misses the big picture.

**Orbit scans your codebase and generates a structured context file** — tech stack, routes, database schema, import graph, exports, dependencies, and more — so your AI assistant understands the *architecture*, not just the code.

```bash
npx @orbit-cli/core scan -g
```

That's it. No sign-up, no config, no API key. Open the generated `CLAUDE.md` and your AI assistant now understands your project.

---

## Orbit vs Code-Dump Tools

| | **Orbit** | **Code-dump tools** (Repomix, etc.) |
|---|---|---|
| **Output** | Structured context (tech, routes, DB, imports) | Raw file contents |
| **Token usage** | Minimal — structure only | High — full source code |
| **Multi-format** | CLAUDE.md, .cursorrules, Copilot, Windsurf | Usually one format |
| **Import graph** | Hub modules ranked by dependency count | None |
| **Custom rules** | Preserved across regeneration | N/A |
| **Setup** | Zero config — just `npx` | Often requires configuration |

---

## What Orbit Detects

- **Tech Stack** — frameworks, languages, package manager, Node version
- **Project Structure** — pages, API routes, database tables
- **Import Graph** — module dependencies, hub modules ranked by import count
- **Exports** — components, functions, types with file locations
- **Dependencies** — categorized (UI, state, testing, database, auth, etc.)
- **Git Status** — branch, recent commits, uncommitted changes
- **Code Metrics** — file count, lines of code, largest files
- **Deployment** — platform (Vercel, AWS, etc.) and CI configuration
- **Environment Variables** — names only (values are never read)
- **Scripts** — npm/pnpm/yarn scripts available

---

## Example Output

Running `orbit scan -g` on a Next.js project generates:

```markdown
# Project: my-app

## Tech Stack
Next.js 15 / React 19 / TypeScript / Tailwind CSS / Drizzle ORM
- Package Manager: pnpm
- Platform: Vercel

## Project Structure
- **Pages (5):** /dashboard /login /pricing /settings
- **API Routes (8):** GET, PATCH, PUT, POST
- **DB Tables (10):** user, session, account, projects, tasks ...

## Import Graph
99 files, 332 local imports

Most imported modules:
- `@/types` (21 imports)
- `@/lib/utils` (20 imports)
- `@/lib/db` (17 imports)
...
```

Your AI assistant gets a complete mental model of the project in a fraction of the tokens.

---

## Multi-Format Output

Generate context files for any AI assistant:

```bash
orbit scan -g                          # CLAUDE.md (default)
orbit scan -g --target cursor          # .cursorrules
orbit scan -g --target copilot         # .github/copilot-instructions.md
orbit scan -g --target windsurf        # .windsurfrules
orbit scan -g --target cursor-mdc      # .cursor/rules/*.mdc (modular)
```

---

## Custom Rules (Preserved on Regeneration)

Add your own coding standards between the markers — Orbit keeps them intact when you re-scan:

```markdown
<!-- ORBIT:USER-START -->
## Our Coding Standards
- Use `const` over `let` everywhere
- All API routes must validate input with Zod
- Components use named exports, not default
<!-- ORBIT:USER-END -->
```

---

## Watch Mode

Automatically regenerate context when your project changes:

```bash
orbit watch
```

---

## MCP Server

Use Orbit as an MCP server for real-time context in Claude Desktop or other MCP clients:

```bash
orbit mcp-serve
```

Exposes tools: `orbit_getProjectContext`, `orbit_getModuleContext`, `orbit_getActiveTasks`, `orbit_getFileRelations`, `orbit_getTaskFocus`.

---

## All Commands

| Command | Description |
|---------|-------------|
| `orbit scan` | Scan project and display overview |
| `orbit scan -g` | Generate AI context file |
| `orbit scan -g --target <format>` | Generate for specific AI tool |
| `orbit watch` | Watch for changes and auto-regenerate |
| `orbit focus <task-id>` | Generate task-focused context |
| `orbit login` | Sign in to Orbit dashboard |
| `orbit init` | Link directory to a project |
| `orbit list` | List tasks |
| `orbit add <title>` | Create a task |
| `orbit start <id>` | Start a task |
| `orbit done <id>` | Complete a task |
| `orbit mcp-serve` | Start MCP server |
| `orbit issues` | Import GitHub issues as tasks |

---

## Installation

```bash
# Run directly with npx (no install needed)
npx @orbit-cli/core scan -g

# Or install globally
npm install -g @orbit-cli/core
```

**Requirements:** Node.js >= 20

---

## Contributing

Contributions are welcome! Feel free to open issues and pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feat/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feat/amazing-feature`)
5. Open a Pull Request

---

## License

[MIT](./LICENSE)

---

<div align="center">

**If Orbit helps your workflow, consider giving it a star.**

[![GitHub stars](https://img.shields.io/github/stars/s4kuraN4gi/orbit-app?style=social)](https://github.com/s4kuraN4gi/orbit-app)

</div>
