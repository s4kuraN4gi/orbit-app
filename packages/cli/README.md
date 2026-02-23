# @orbit-cli/core

AI context engine for your codebase. Generate structured context files for Claude, Cursor, Windsurf, and other AI assistants.

**Unlike code-dump tools**, Orbit understands your project's _structure_ — tech stack, routes, database schema, dependencies, git activity, and task status — and generates focused context that helps AI assistants write better code.

## Quick Start

```bash
# No sign-up required
npx @orbit-cli/core scan

# Generate a CLAUDE.md context file
npx @orbit-cli/core scan -g

# Generate a .cursorrules file
npx @orbit-cli/core scan -g -o .cursorrules
```

## What It Does

`orbit scan` analyzes your project and outputs:

- **Tech Stack** — frameworks, languages, versions
- **Project Structure** — pages, API routes, database tables
- **Dependencies** — categorized by purpose (UI, state, testing, etc.)
- **Git Status** — branch, recent activity, uncommitted changes
- **Codebase Metrics** — file count, lines of code, largest files
- **Deployment** — platform (Vercel, AWS, etc.) and CI configuration
- **Environment Variables** — detected variable names (values are never read)

## Context Generation

With `--generate-context` (or `-g`), Orbit writes a Markdown file that AI assistants can use as project context:

```bash
orbit scan -g              # Outputs CLAUDE.md
orbit scan -g -o context.md   # Custom output path
```

The generated file includes all scan data in a clean, structured format that AI tools understand.

## With Orbit Account (Optional)

Sign in to include task data in your context — so AI assistants know what you're working on right now:

```bash
orbit login
orbit init        # Link to an Orbit project
orbit scan -g     # Now includes active tasks + completion status
```

Task context gives AI assistants the "what" and "why" behind your current work, not just the code.

## Commands

| Command | Description |
|---------|-------------|
| `orbit scan` | Scan project and display overview |
| `orbit scan -g` | Scan + generate AI context file |
| `orbit login` | Sign in to Orbit |
| `orbit init` | Link directory to an Orbit project |
| `orbit list` | List tasks |
| `orbit add <title>` | Create a task |
| `orbit start <id>` | Start a task |
| `orbit done <id>` | Complete a task |

## Requirements

- Node.js >= 18

## License

MIT
