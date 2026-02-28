# Orbit Content Drafts

> Target platforms: Dev.to, Reddit (r/programming, r/nextjs)
> Created: 2026-02-27

---

## Article 1: How to Give AI Assistants Better Context About Your Codebase

**Target:** Dev.to, r/programming
**Tone:** Educational, practical

---

### The Problem Every Developer Hits

You open Claude, Cursor, or Copilot. You paste in your question. The AI gives you a generic answer that ignores your project's architecture, your database schema, your routing conventions, and the task you're actually working on.

So you start copy-pasting. A bit of your schema file. Some of your route handlers. Your package.json. Maybe a component or two for style reference.

This works for small projects. But once your codebase crosses a few thousand lines, you hit a wall: **AI assistants don't understand your project because you can't fit your project into a prompt.**

### Why Code Dumps Don't Work

The most obvious solution is to dump your entire codebase into context. Tools exist that concatenate every file into a single text blob. The idea is simple: give the AI everything, let it figure out what matters.

In practice, this fails for three reasons:

**1. Token limits are real.**
Even with 200K context windows, a medium-sized project (20,000+ lines) blows past the limit. And larger context windows don't mean better comprehension -- studies consistently show that LLM accuracy degrades with context length. The model pays less attention to information in the middle of long contexts (the "lost in the middle" problem).

**2. Noise drowns out signal.**
Your AI doesn't need the contents of every utility function, every test file, and every CSS class. When you dump everything, the model spends its attention budget on irrelevant code instead of the architectural decisions that actually matter for your question.

**3. Structure is lost.**
A flat text dump destroys the relationships between files. The AI can't see that `UserService` depends on `AuthProvider`, that your API routes follow a specific pattern, or that your database has 10 tables with specific relationships. These structural connections are exactly what the AI needs to give good answers.

### A Better Approach: Structured Context

Instead of giving AI assistants *all your code*, give them *knowledge about your code*. There's a crucial difference.

Think about how a senior developer onboards to a new project. They don't read every file line by line. They look at:

- **Tech stack and conventions** -- What framework? What ORM? What's the folder structure?
- **Architecture** -- What are the main layers (pages, API routes, database tables)? How do they connect?
- **Key modules** -- Which files are imported most often? What are the main exported functions and components?
- **Active work** -- What's being built right now? What branch are we on? What tasks are in progress?
- **Constraints** -- What deployment platform? What environment variables exist? What CI pipeline runs?

This is structured context. It's a map of your project, not a photocopy of every page.

### What Structured Context Looks Like

Here's a concrete example. Instead of dumping 12,000 lines of TypeScript, you give the AI something like this:

```markdown
# Project: Orbit

## Tech Stack
Next.js 16.1.1 / React 19.2.3 / TypeScript / Tailwind CSS / Drizzle ORM
- Package Manager: pnpm
- Platform: Vercel
- CI: GitHub Actions

## Project Structure
- Pages (5): /dashboard /login /pricing /settings
- API Routes (8): GET, PATCH, PUT, POST
- DB Tables (10): user, session, account, verification, projects,
  ai_contexts, tasks, ideas, user_settings, scan_snapshots

## Key Files
- Largest: TaskList.tsx (582 lines), detector.ts (493 lines),
  renderers.ts (415 lines)
- 114 source files, ~11,844 lines

## Import Graph
99 files, 332 local imports
Most imported: @/types (21), @/lib/utils (20), @/lib/db (17),
@/lib/schema (17), @/components/ui/button (17)

## Active Tasks
### In Progress
- [ORB-9f14a0e] Implement focus mode for task-specific context

## Environment Variables
BETTER_AUTH_URL, DATABASE_URL
```

This is ~40 lines. It fits easily in any context window. And it gives the AI a mental model of the entire project: the stack, the shape, the dependencies, and what's happening right now.

When the AI knows you're using Drizzle ORM with a `projects` table and a `tasks` table, it writes migration code that matches your schema. When it knows you use pnpm, it doesn't suggest `npm install`. When it sees your active task, it can tailor suggestions to what you're building.

### How Orbit Solves This

[Orbit](https://github.com/s4kuraN4gi/orbit-app) is an open-source CLI that automates this process. It scans your codebase and generates structured context files in the format your AI tool expects.

One command, zero config:

```bash
npx @orbit-cli/core scan -g
```

This produces a `CLAUDE.md` file (or `.cursorrules`, `copilot-instructions.md`, `.windsurfrules` -- your choice) with the structured context described above.

Under the hood, the scanner does several things in parallel:

- **Tech stack detection** -- reads `package.json`, checks for framework config files (Next.js, Vite, etc.)
- **Route scanning** -- finds all `page.tsx` and `route.ts` files, extracts HTTP methods
- **Schema analysis** -- locates Drizzle/Prisma schema files, extracts table names and column counts
- **Export extraction** -- regex-based scan of all `.ts/.tsx` files for exported functions, components, types, and constants
- **Import graph construction** -- maps every local import to build a dependency graph, identifies hub modules (most-imported files)
- **Git activity** -- current branch, uncommitted changes, recent commits
- **Code metrics** -- file counts, line counts, largest files by directory
- **Deployment detection** -- checks for Vercel, Netlify, Docker, Railway config files
- **CI detection** -- GitHub Actions, GitLab CI

The entire scan runs in under 2 seconds on a typical project. No external dependencies, no build step, no AST parsing overhead.

**Task-aware context** is where it gets interesting. If you use Orbit's task tracking (or connect it to your existing issue tracker), the generated context includes your active tasks. This means the AI knows *what you're working on*, not just what your project looks like. It's the difference between "here's a map" and "here's a map, and you're going from A to B."

### Practical Tips (Even Without Orbit)

You don't need any tool to start giving AI better context. Here are patterns that work with any AI assistant:

**1. Create a project brief.**
Write a `CONTEXT.md` (or `CLAUDE.md`, `.cursorrules`, etc.) by hand. Include your tech stack, folder structure, key conventions, and current focus areas. Even a 20-line file dramatically improves AI responses.

**2. Be specific about conventions.**
Instead of letting the AI guess, tell it: "We use Drizzle ORM, not Prisma. We use Server Actions, not API routes for mutations. We use `pnpm`, not `npm`."

**3. Include your task.**
At the top of your AI context (or your prompt), state what you're working on: "I'm implementing user invitation flow. The relevant files are `lib/auth.ts`, `app/invite/[id]/page.tsx`, and `lib/schema.ts`."

**4. Describe architecture, not implementation.**
The AI doesn't need to see your entire `utils.ts`. It needs to know that `utils.ts` exists, what it exports, and that 20 other files import from it.

**5. Update regularly.**
Stale context is misleading context. If your context file says you have 5 API routes but you now have 12, the AI will make wrong assumptions. Automate context generation if possible.

### Try It

If you want to automate structured context generation:

```bash
# Generate CLAUDE.md
npx @orbit-cli/core scan -g

# Generate for Cursor instead
npx @orbit-cli/core scan -g -f cursor

# Generate for all supported formats at once
npx @orbit-cli/core scan -g -f all

# Watch mode: auto-regenerate on file changes
npx @orbit-cli/core watch
```

The CLI is free, open source (MIT), and requires no sign-up.

- **GitHub:** [s4kuraN4gi/orbit-app](https://github.com/s4kuraN4gi/orbit-app)
- **npm:** [@orbit-cli/core](https://www.npmjs.com/package/@orbit-cli/core)

---

**What's your approach to giving AI context about your codebase? Do you maintain a context file by hand, use a tool, or just paste code into prompts? I'd love to hear what works for you.**

---
---

## Article 2: Building an AI Context Engine with Next.js

**Target:** Dev.to, r/nextjs
**Tone:** Technical deep-dive

---

### What Is an "AI Context Engine"?

Every AI coding assistant -- Claude, Cursor, Copilot, Windsurf -- works better when it understands your project's structure. But each tool has its own context format: Claude reads `CLAUDE.md`, Cursor reads `.cursorrules`, Copilot reads `.github/copilot-instructions.md`, Windsurf reads `.windsurfrules`.

An AI context engine is a system that scans your codebase, builds an intermediate representation (IR) of your project's architecture, and renders that IR into whatever format your AI tool expects. One scan, multiple outputs.

I built [Orbit](https://github.com/s4kuraN4gi/orbit-app) as an open-source AI context engine. This article walks through the architectural decisions, the technical tradeoffs, and the lessons learned.

### Architecture Overview

Orbit has three main components:

```
CLI (Commander.js)          Web Dashboard (Next.js)
  |                                  |
  v                                  v
Detector → Context IR → Renderers    API Routes → DB (Neon + Drizzle)
                |                         |
                v                         v
          Output files              Scan history, diff, team features
          (.md / .rules)
```

**CLI** (`packages/cli/`): The core engine. Scans the codebase, builds the IR, renders output files. Distributed as an npm package (`@orbit-cli/core`). Zero runtime dependencies beyond Node.js built-ins.

**Web Dashboard** (`app/`): A Next.js application that stores scan history, shows diffs between scans, and provides team collaboration features. This is the optional SaaS layer on top of the free CLI.

**MCP Server**: A Model Context Protocol server that exposes scan results to AI IDEs in real time. Instead of reading a static file, the IDE queries the MCP server for live project context.

### The Detector: How to Scan a Codebase in Under 2 Seconds

The detector (`packages/cli/src/lib/detector.ts`, ~493 lines) is the heart of the engine. It needs to extract meaningful structure from any TypeScript/JavaScript project fast enough to run on every file save in watch mode.

#### Design Decision: Regex Over AST

The biggest architectural decision was using regex-based scanning instead of a proper AST parser like Tree-sitter or the TypeScript compiler API.

**Why regex?**

1. **Zero dependencies.** The CLI has no runtime dependencies. Adding Tree-sitter means native binaries, platform-specific builds, and `node-gyp` headaches. For a tool distributed via `npx`, install friction is the enemy.

2. **Speed.** Regex is fast. Scanning 114 files and 12,000 lines takes under 2 seconds. AST parsing the same codebase takes 5-10x longer because you're building full syntax trees for files where you only need surface-level information.

3. **Good enough.** We're extracting exports, imports, route definitions, and schema tables. These follow consistent syntactic patterns in TypeScript. You don't need a full AST to find `export function Foo()` or `import { bar } from './baz'`.

**The tradeoff:** Regex can't handle every edge case. Dynamically computed exports, re-exports through barrel files, or unusual import syntax might be missed. In practice, this covers 95%+ of real-world code.

#### Scanner Architecture

The detector is composed of independent scanning functions, each responsible for one aspect of the project:

```typescript
// Each scanner is independent -- they can run in parallel
export async function scanPages(dir: string): Promise<string[]>
export async function scanApiRoutes(dir: string): Promise<ApiRoute[]>
export async function scanDbTables(dir: string): Promise<DbTable[]>
export async function scanExports(dir: string): Promise<Export[]>
export async function scanImportGraph(dir: string): Promise<ImportEntry[]>
export async function scanCodeMetrics(dir: string): Promise<CodeMetrics>
export function scanGit(dir: string): GitInfo | null
export function scanDeployment(dir: string): DeploymentInfo
export function scanAiContext(dir: string): AiContextInfo
```

The main `scan()` function orchestrates all of these and merges their results into a single `ScanResult` object.

#### Example: Export Extraction

The export scanner demonstrates the regex approach. It needs to distinguish between components (PascalCase), functions (camelCase), types/interfaces, and constants:

```typescript
export async function scanExports(dir: string) {
  const files = await globFiles(dir, /\.(ts|tsx)$/);
  const results = [];

  for (const file of files) {
    const content = await readText(file);
    if (!content) continue;
    const relPath = relative(dir, file);

    // PascalCase exports → components
    for (const m of content.matchAll(
      /export\s+(?:async\s+)?function\s+([A-Z]\w*)/g
    )) {
      results.push({ file: relPath, name: m[1], kind: 'component' });
    }

    // camelCase exports → functions
    for (const m of content.matchAll(
      /export\s+(?:async\s+)?function\s+([a-z]\w*)/g
    )) {
      results.push({ file: relPath, name: m[1], kind: 'function' });
    }

    // Types and interfaces
    for (const m of content.matchAll(
      /export\s+(?:type|interface)\s+(\w+)/g
    )) {
      results.push({ file: relPath, name: m[1], kind: 'type' });
    }
  }
  return results;
}
```

The PascalCase/camelCase heuristic for component detection is simple but effective. In React projects, `export function UserList()` is almost always a component, while `export function getUserList()` is a utility function. This distinction matters because AI assistants treat components and functions differently.

#### Example: Import Graph Construction

The import graph scanner builds a map of every local import in the project:

```typescript
const importPattern = /(?:import\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]|require\s*\(\s*['"]([^'"]+)['"]\s*\))/g;

for (const file of files) {
  const content = await readText(file);
  const imports = [];

  for (const m of content.matchAll(importPattern)) {
    const specifier = m[1] || m[2];
    // Only track local imports (. or @/)
    if (specifier.startsWith('.') || specifier.startsWith('@/')) {
      imports.push(specifier);
    }
  }

  if (imports.length > 0) {
    results.push({ file: relPath, imports });
  }
}
```

Filtering to local imports (`.` or `@/` paths) keeps the graph focused. We don't care that 50 files import from `react` -- that's a given. We care that 21 files import from `@/types` and 17 from `@/lib/schema`, because those are the hub modules that define your project's shape.

### Context IR: The Intermediate Representation

The raw `ScanResult` is a flat data bag. The Context IR (`ContextIR`) restructures this into a normalized, format-agnostic representation:

```typescript
export interface ContextIR {
  version: '1.0';
  generatedAt: string;
  project: {
    name: string;
    techStack: string[];
    packageManager: string | null;
  };
  architecture: {
    layers: Layer[];           // pages, api, db, lib, components
    importGraph: Edge[];       // { from, to } pairs
    hubModules: HubModule[];   // most-imported files
  };
  activeWork: {
    tasks: TaskSummary[];      // current tasks with status
    git: GitSummary | null;    // branch, uncommitted changes
  };
  codeMap: {
    modules: ModuleSummary[];  // per-file exports + imports
    entryPoints: string[];     // page routes
    totalFiles: number;
    totalLines: number;
  };
  constraints: {
    envVars: string[];
    deployTarget: string | null;
    ci: string | null;
    scripts: Record<string, string>;
  };
}
```

The IR introduces several concepts not in the raw scan:

- **Layers**: The architecture is decomposed into typed layers (pages, API, DB, library, components). This maps to how developers think about their app.
- **Hub modules**: Calculated from import frequency. If 21 files import `@/types`, it's a hub -- the AI should know about it.
- **Active work**: Tasks and git state are first-class. This is what makes context "task-aware."

The `buildContextIR()` function transforms `ScanResult` into `ContextIR`. This is a pure function with no side effects -- easy to test, easy to reason about.

### Renderers: One IR, Four Formats

Each AI tool has different expectations for its context file. The renderer layer translates the IR:

```typescript
export type RenderTarget = 'claude' | 'cursor' | 'copilot' | 'windsurf';

export const RENDER_TARGETS: Record<RenderTarget, string> = {
  claude:   'CLAUDE.md',
  cursor:   '.cursorrules',
  copilot:  '.github/copilot-instructions.md',
  windsurf: '.windsurfrules',
};

export function renderContext(ir: ContextIR, target: RenderTarget): string {
  switch (target) {
    case 'claude':   return renderClaude(ir);
    case 'cursor':   return renderCursor(ir);
    case 'copilot':  return renderCopilot(ir);
    case 'windsurf': return renderWindsurf(ir);
  }
}
```

Each renderer knows the conventions of its target tool. For example:
- `CLAUDE.md` uses standard Markdown headers and lists
- `.cursorrules` uses a more directive tone ("You are working on...")
- `copilot-instructions.md` follows GitHub's expected structure
- `.windsurfrules` matches Windsurf's rule format

The key insight: **all renderers consume the same IR**. Adding a new format means writing one render function. No changes to the scanner, no changes to the IR builder.

### Watch Mode with Incremental Scanning

For development workflows, re-scanning on every file save keeps context fresh. Watch mode uses Node.js `fs.watch` with debouncing:

```bash
npx @orbit-cli/core watch
```

The watcher monitors the project directory for `.ts` and `.tsx` file changes, debounces rapid saves (300ms window), and triggers a full re-scan + re-render. Since the full scan takes under 2 seconds, there's no need for incremental/differential scanning -- just re-run everything.

This is an intentional simplicity tradeoff. Incremental scanning would be faster but adds significant complexity (tracking which scanner results are affected by which file changes, cache invalidation, etc.). At sub-2-second full scan times, the complexity isn't justified.

### MCP Server: Real-Time IDE Integration

The [Model Context Protocol](https://modelcontextprotocol.io/) is a standard for AI tools to request context from external servers. Orbit includes an MCP server that exposes scan results as MCP tools:

```bash
npx @orbit-cli/core mcp
```

Instead of the IDE reading a static `CLAUDE.md` file, it can query the MCP server for live project context. This means context updates without regenerating files -- the MCP server re-scans on demand.

The MCP integration uses the `@modelcontextprotocol/sdk` and exposes tools like `scan_project`, `get_context`, and `get_tasks`.

### The Web Layer: Next.js Dashboard

The CLI is the core, but the web dashboard adds features that a CLI alone can't provide:

- **Scan history**: Every scan result is stored in the database. You can see how your project structure has evolved over time.
- **Context diff**: Compare two scans side by side. See what changed -- new routes added, tables modified, exports renamed.
- **Team collaboration**: Organization-based access control. Multiple developers share the same context dashboard.

The web app uses:
- **Next.js 16** with the App Router
- **Drizzle ORM** with Neon PostgreSQL
- **Better Auth** for authentication (email/password + organization plugin)
- **Stripe** for billing (Pro and Team plans)

The API routes (`app/api/cli/`) provide authenticated endpoints for the CLI to sync scan results to the web dashboard. This is optional -- the CLI works entirely offline without the web layer.

### Lessons Learned Building Dev Tools

**1. Zero-config is non-negotiable.**
`npx @orbit-cli/core scan -g` must work on any TypeScript project with zero setup. The moment you need a config file, you lose 80% of potential users. Detection should be automatic.

**2. Speed matters more than accuracy.**
A scan that takes 10 seconds and catches 100% of exports will be used once. A scan that takes 1 second and catches 95% will be used on every save. We chose regex over AST because speed-to-install and speed-to-run dominate user experience.

**3. Solve the distribution problem first.**
We spent weeks building features before publishing to npm. That was backwards. The CLI should have been on npm from day one, even if it only had basic scanning. Distribution > polish.

**4. Intermediate representations pay off.**
The Context IR seemed like over-engineering when we had only one output format. When we added Cursor, Copilot, and Windsurf support, the IR meant zero changes to the scanner. The upfront cost was repaid in hours.

**5. Static analysis has a ceiling.**
Regex-based scanning hits a limit. We can detect `export function Foo()`, but we can't understand what `Foo` does or how it relates semantically to `Bar`. The next evolution is likely Tree-sitter integration for deeper structural analysis, or even LLM-assisted context summarization.

**6. Task awareness is the real differentiator.**
Every tool can scan a codebase. The unique value is knowing *what the developer is working on right now* and tailoring context accordingly. This is where issue tracker integrations (Linear, GitHub Issues) become critical.

### Try Orbit

```bash
# Quick start
npx @orbit-cli/core scan -g

# See all options
npx @orbit-cli/core --help

# Web dashboard (optional)
# https://orbit-app-ruddy.vercel.app
```

The CLI is free and MIT licensed. The web dashboard adds team features and scan history.

- **GitHub:** [s4kuraN4gi/orbit-app](https://github.com/s4kuraN4gi/orbit-app)
- **npm:** [@orbit-cli/core](https://www.npmjs.com/package/@orbit-cli/core)

---

**If you're building dev tools with Next.js, I'd love to hear about your architecture. What patterns have worked for you? What would you do differently?**
