---
title: "I Scanned 5 Project Types with an AI Context Generator — Here's What It Found"
published: false
description: "I ran Orbit CLI on 5 different project archetypes — Next.js SaaS, Express API, Vite React app, monorepo, and Python — to see what an automated context generator actually picks up."
tags: ai, productivity, cli, webdev
cover_image:
canonical_url:
---

Every AI coding assistant — Claude, Cursor, Copilot, Windsurf — works better when it understands your project. What framework are you using? What does the database look like? Which modules are the most connected? The problem is that nobody wants to sit down and write a context file by hand. You open `CLAUDE.md`, stare at it for a minute, type "This is a Next.js app with Postgres," and call it done.

That barely scratches the surface of what AI assistants can actually use. The import graph, the hub modules, the environment variables, the exact DB schema — all of that makes a real difference in the quality of suggestions you get. But who has time to map all that out manually?

I built [Orbit](https://github.com/s4kuraN4gi/orbit-app) to answer that question. It's a free, open-source CLI that scans your codebase and generates structured context files in about 3 seconds. I decided to run it on 5 different project archetypes to see exactly what it picks up — and what surprised me.

## How It Works

Two commands. That's it.

```bash
npm i -g @orbit-cli/core
orbit scan -g
```

Orbit walks your source tree, detects your tech stack, maps the import graph, finds database tables, counts pages and API routes, discovers environment variables, and outputs a structured Markdown file. It supports multiple output formats: `CLAUDE.md`, `.cursorrules`, `copilot-instructions.md`, and `.windsurfrules`.

No authentication required. No cloud dependency. Everything runs locally.

---

## Project 1: Next.js SaaS App

First up — the classic full-stack Next.js SaaS with auth, billing, and a dashboard. This is probably the most common archetype in the indie hacker world right now.

Here's what Orbit generated:

```markdown
# Project: example-nextjs-saas

## Tech Stack
React 19.0.0 / TypeScript / Tailwind CSS / Drizzle ORM

## Project Structure
- **Pages (4):** /dashboard /login /pricing /settings
- **API Routes (11):** GET, POST, PUT, PATCH
- **DB Tables (9):** users, sessions, teams, team_members, products,
  orders, order_items, subscriptions, audit_logs
```

Right away, any AI assistant reading this knows this is a multi-tenant SaaS with team support, a product/order domain model, and subscription billing. That's a huge amount of context from zero configuration.

The **import graph** is where it gets interesting:

```markdown
## Import Graph
35 files, 81 local imports

Most imported modules:
- @/lib/utils (12 imports)
- @/types (10 imports)
- @/lib/auth (7 imports)
- @/components/ui/button (7 imports)
- @/components/ui/card (7 imports)
- @/db (6 imports)
- @/db/schema (6 imports)
- @/lib/validators (4 imports)
- @/lib/stripe (2 imports)
```

This tells the AI assistant which files are the "hub" modules — the ones that, if changed, ripple across the entire codebase. `@/lib/utils` with 12 imports is clearly the most critical shared module. The AI now knows that if you ask it to refactor `utils.ts`, it needs to be careful because 12 other files depend on it.

Orbit also picked up **6 environment variables**, including Stripe keys:

```markdown
## Environment Variables
DATABASE_URL, NEXT_PUBLIC_URL, STRIPE_ENTERPRISE_PRICE_ID,
STRIPE_PRO_PRICE_ID, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
```

And the **npm scripts**, so the AI knows how to run, build, and manage the database:

```markdown
## Scripts
- dev: next dev
- build: next build
- db:push: drizzle-kit push
- db:studio: drizzle-kit studio
```

**38 source files, ~848 lines.** Scanned in under 3 seconds.

---

## Project 2: Express REST API

Next — a backend-only Express API with controllers, services, middleware, and Prisma. No React, no pages, no UI components. Can Orbit handle a pure API project?

```markdown
# Project: example-express-api

## Tech Stack
TypeScript

## Key Files
- Largest: order-service.ts (57 lines), validators.ts (45 lines),
  product-service.ts (40 lines), server.ts (33 lines),
  product-controller.ts (31 lines)
- 21 source files, ~498 lines
```

Notice it correctly detected that this is a TypeScript project *without* React. No framework noise, no false positives. It identified the key files by size, which immediately tells you where the business logic lives: `order-service.ts` and `product-service.ts`.

The **export analysis** is particularly useful for API projects:

```markdown
## Exports
- **Functions (24):** handleRegister, handleLogin, handleCreateOrder,
  handleGetOrders, handleUpdateOrderStatus, handleGetProducts,
  handleGetProduct, handleCreateProduct, handleUpdateProduct,
  authenticate, requireAdmin, errorHandler, register, login,
  createOrder, getOrders, updateOrderStatus, getProducts,
  getProductById, createProduct ...
- **Types (4):** AuthRequest, PaginationQuery, ProductFilter, OrderFilter
```

From this, an AI assistant can immediately understand the full API surface: auth (register/login), products (CRUD), and orders (create/list/update status). It also sees the middleware layer (`authenticate`, `requireAdmin`, `errorHandler`) and knows this API has role-based access control.

The import graph reveals the project architecture:

```markdown
Most imported modules:
- ../types (6 imports)
- ../utils/errors (5 imports)
- ../utils/validators (4 imports)
- ../config/database (3 imports)
- ../services/auth-service (2 imports)
- ../services/product-service (2 imports)
```

Clean layered architecture — types at the top, error handling and validation as shared utilities, services consumed by controllers. An AI reading this won't accidentally suggest putting database queries directly in route handlers.

---

## Project 3: Vite React App

Third — a client-side Vite + React SPA with Zustand stores and custom hooks. No server-side rendering, no API routes on the same codebase.

```markdown
# Project: example-vite-react

## Tech Stack
React 19.0.0 / TypeScript / Tailwind CSS

## Exports
- **Components (17):** App, StatsOverview, WeeklyChart, ProjectCard,
  CreateTaskForm, TaskBoard, TaskCard, Header, Sidebar,
  PriorityBadge, StatusBadge, Button, Modal, AnalyticsPage,
  DashboardPage, LoginPage, ProjectPage
- **Functions (23):** getAnalytics, getProjects, getProject,
  createProject, deleteProject, getTasks, getTask, createTask,
  updateTask, deleteTask, useAnalytics, useProjects,
  useCreateProject, useDeleteProject, useTasks, useCreateTask,
  useUpdateTask, useDeleteTask, cn, formatDate ...
- **Types (8):** User, Project, Task, TaskStatus, Priority,
  AnalyticsData, CreateTaskInput, UpdateTaskInput
```

Orbit separated the API client functions (`getProjects`, `createTask`) from the React hooks (`useProjects`, `useCreateTask`) and the components. This distinction matters — an AI assistant now knows the data-fetching layer is separate from the UI layer.

The import graph shows something interesting about this frontend app:

```markdown
Most imported modules:
- @/types (11 imports)
- @/utils/cn (6 imports)
- @/components/ui/button (6 imports)
- @/stores/ui-store (6 imports)
- ./client (3 imports)
- @/utils/date (3 imports)
- @/hooks/use-analytics (2 imports)
- @/hooks/use-tasks (2 imports)
- @/stores/auth-store (2 imports)
```

`@/stores/ui-store` with 6 imports is a hub module — it's the global UI state that half the app depends on. `@/types` with 11 imports is the most connected file in the entire project. The AI assistant knows these are critical files to understand before making changes.

**29 source files, ~709 lines.** A lean, well-structured SPA — and Orbit captured the full architecture without any configuration.

---

## Project 4: Monorepo

This is where things get more ambitious. Monorepos with multiple packages (think Turborepo or Nx workspaces) are a different beast entirely.

Orbit can detect workspace configurations and analyze each package independently. For a typical monorepo with `packages/api`, `packages/web`, and `packages/shared`, you'd get:

- Workspace detection (pnpm-workspace.yaml, package.json workspaces)
- Per-package tech stack analysis
- Cross-package import tracking
- Shared module identification

That said, monorepo support is an area of active development. The current version handles the common patterns well, but deeply nested or unconventional workspace structures may need some manual annotation. This is something I'm actively improving based on real-world feedback.

---

## Project 5: Python / Go / Other Languages

Let me be straightforward here: **Orbit currently focuses on the JavaScript/TypeScript ecosystem.** It's optimized for projects using Node.js, React, Vue, Svelte, Next.js, Express, and similar tools.

For Python, Go, Rust, or other language ecosystems, the scanner won't detect framework-specific patterns like Django models or Go module graphs. You'd get basic file structure analysis, but not the deep semantic understanding you see with JS/TS projects.

Multi-language support is on the roadmap. If you're interested in a specific ecosystem, [open an issue](https://github.com/s4kuraN4gi/orbit-app/issues) — it helps me prioritize.

---

## What Surprised Me

After running Orbit on dozens of projects, three things consistently stand out as insights you'd never include in a hand-written context file:

### 1. Hub Module Detection

The import graph ranking reveals which files are load-bearing walls. In the Next.js SaaS example, `@/lib/utils` has 12 imports — change that file and you affect a third of the codebase. In the Vite app, `@/types` has 11 imports. No developer sits down and counts import references manually, but this information is gold for an AI assistant trying to assess the blast radius of a refactor.

### 2. Environment Variable Discovery

Orbit scans for `process.env.*` and `import.meta.env.*` references across your codebase and lists every environment variable it finds. The Next.js example surfaced 6 variables including Stripe keys. When an AI assistant knows what env vars exist, it can generate correct configuration code instead of inventing placeholder names.

### 3. Export Surface Area

Knowing that an Express API exports 24 functions and 4 types — and seeing the exact names — gives an AI assistant a complete mental model of the API. It's the difference between "this is an Express app" and "this is an Express app with auth (register/login), product CRUD, order management, role-based middleware, and pagination support."

---

## Try It Yourself

```bash
npm i -g @orbit-cli/core
orbit scan -g
```

Run it on your own project. It takes about 3 seconds and generates a `CLAUDE.md` file in your project root. Want a different format? Use the flags:

```bash
orbit scan -g --target cursor     # .cursorrules
orbit scan -g --target copilot    # copilot-instructions.md
orbit scan -g --target windsurf   # .windsurfrules
```

It's 100% free, MIT licensed, and runs entirely on your machine. No account, no API keys, no data leaves your laptop.

If you find it useful, [a star on GitHub](https://github.com/s4kuraN4gi/orbit-app) would mean a lot. And if you run into edge cases or have feature requests, issues and PRs are welcome.

I'd love to see what Orbit finds in your project. Drop a comment with your scan results -- especially if it picks up something unexpected.
