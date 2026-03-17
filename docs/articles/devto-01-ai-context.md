---
title: "Why Your AI Coding Assistant Writes Bad Code — and How to Fix It with Structured Context"
published: false
description: "AI assistants hallucinate imports, reference wrong files, and ignore your architecture. Here's why — and a one-command fix."
tags: ai, webdev, claude, productivity
---

You paste your code into Claude, Cursor, or Copilot, and it confidently suggests `import { db } from './database'` — except that file doesn't exist. It generates a React component that imports from packages you've never installed. It writes an API route that doesn't match your routing conventions. Sound familiar?

## The Problem: AI Is Smart but Blind

AI coding assistants are incredibly capable. They can write algorithms, refactor code, generate tests, and explain complex logic. But they have a fundamental limitation: **they can't see your project**.

When you paste a snippet of code into Claude or Cursor, the AI sees *text* — not architecture. It doesn't know that your database connection lives at `@/lib/db`, not `./database`. It doesn't know you have 10 database tables or 11 API routes. It doesn't know that `@/lib/utils` is the most imported module in your project, used in 12 different files.

So it guesses. And sometimes it guesses wrong.

The result? You spend more time fixing AI-generated code than you would have spent writing it yourself. Hallucinated imports. Non-existent file paths. Components that don't match your design system. API calls to endpoints that don't exist.

This isn't an AI problem — it's a **context problem**.

## Why Code Dumps Don't Work

The obvious fix seems simple: just give the AI more code. Paste your whole project. Some tools even automate this, concatenating your entire codebase into one massive file and dumping it into the prompt.

This doesn't work for two reasons.

First, **it wastes tokens**. A typical project has thousands of lines of code. Most of it is implementation detail the AI doesn't need. You're burning context window on the body of every function when the AI only needs to know the function exists, what it's called, and where it lives.

Second, and more importantly, **raw code isn't understanding**. Think of it this way: if you asked someone to write a chapter for your novel, would you hand them a dictionary? Or would you give them an outline — the characters, the plot structure, the themes, the style guide? The AI needs a *map* of your project, not the full territory.

## The Solution: Structured Context

This is the idea behind [Orbit](https://github.com/s4kuraN4gi/orbit-app) — a free, open-source CLI that scans your codebase and generates a structured context file that AI assistants actually understand.

Instead of dumping raw code, Orbit produces a concise "blueprint" of your project: your tech stack, page routes, API endpoints, database schema, export catalog, and — crucially — your **import graph**. It tells the AI which modules are the hubs of your codebase, so it knows the right way to import things.

Here's what a generated `CLAUDE.md` looks like for a real Next.js SaaS project:

```markdown
# Project: example-nextjs-saas

## Tech Stack
React 19.0.0 / TypeScript / Tailwind CSS / Drizzle ORM

## Project Structure
- **Pages (4):** /dashboard /login /pricing /settings
- **API Routes (11):** GET, POST, PUT, PATCH
- **DB Tables (9):** users, sessions, teams, team_members, products,
  orders, order_items, subscriptions, audit_logs

## Key Files
- Largest: schema.ts (85 lines), billing-settings.tsx (34 lines),
  pricing-table.tsx (33 lines)
- 38 source files, ~848 lines

## Exports
- **Components (22):** DashboardPage, RootLayout, LoginPage,
  PricingPage, ProductList, RecentOrders, RevenueChart, StatsCards,
  Hero, PricingTable, BillingSettings, TeamSettings, Navbar, Sidebar...
- **Functions (27):** useAuth, useLogout, useOrders, useOrderStats,
  useProducts, useCreateProduct, useTeam, getSession...
- **Types (14):** DB, CreateProductInput, CreateOrderInput, User,
  Team, Product, Order, Subscription, UserRole, OrderStatus...

## Import Graph
35 files, 81 local imports

Most imported modules:
- `@/lib/utils` (12 imports)
- `@/types` (10 imports)
- `@/lib/auth` (7 imports)
- `@/components/ui/button` (7 imports)
- `@/components/ui/card` (7 imports)
- `@/db` (6 imports)
- `@/db/schema` (6 imports)

## Environment Variables
DATABASE_URL, NEXT_PUBLIC_URL, STRIPE_SECRET_KEY,
STRIPE_WEBHOOK_SECRET
```

Look at what the AI now *knows* without seeing a single line of implementation code:

- The project uses Drizzle ORM, not Prisma — so it won't generate Prisma client calls.
- The database connection is at `@/db`, not `./database` or `lib/prisma`.
- There are 9 specific tables, so the AI knows `orders` exists but `invoices` doesn't.
- `@/lib/utils` is the most-used module — the AI will import from there, not reinvent utilities.
- The project uses `@/components/ui/button`, signaling a component library convention.

This is the difference between an AI that *guesses* and one that *knows*.

## How to Use It

```bash
npm i -g @orbit-cli/core
```

Then, in your project root:

```bash
orbit scan -g
```

That's it. One command. Orbit scans your project and generates a `CLAUDE.md` file in your project root. Claude Code, Cursor, Copilot, and Windsurf all automatically pick up their respective context files.

Want a different format? Orbit supports multiple output targets:

```bash
orbit scan -g --target cursor    # generates .cursorrules
orbit scan -g --target copilot   # generates copilot-instructions.md
orbit scan -g --target windsurf  # generates .windsurfrules
```

No account required. No auth. No config files. Just scan and go.

## Before vs After

Here's a concrete example. Say you ask Claude: *"Add a new API endpoint to update a team member's role."*

**Without context**, Claude might generate:

```typescript
// app/api/teams/update-role/route.ts
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  const { userId, role } = await req.json()
  const updated = await prisma.teamMember.update({
    where: { userId },
    data: { role }
  })
  return Response.json(updated)
}
```

Three problems: wrong ORM (Prisma instead of Drizzle), wrong import path, and it used POST where your existing pattern uses PATCH for updates.

**With Orbit context**, Claude knows the project uses Drizzle ORM, that the database is at `@/db`, that the schema is at `@/db/schema`, and that the existing API pattern uses PATCH for updates. It generates:

```typescript
// app/api/teams/members/route.ts
import { db } from '@/db'
import { team_members } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(req: Request) {
  const { userId, role } = await req.json()
  const [updated] = await db
    .update(team_members)
    .set({ role })
    .where(eq(team_members.userId, userId))
    .returning()
  return Response.json(updated)
}
```

Correct ORM. Correct imports. Correct HTTP method. Code that actually works on the first try.

## Try It

```bash
npm i -g @orbit-cli/core
cd your-project
orbit scan -g
```

Give your AI assistant the context it needs. Stop fixing hallucinated imports.

If you find it useful, [star it on GitHub](https://github.com/s4kuraN4gi/orbit-app) — it helps others discover the project.

---

*Orbit is 100% free and MIT licensed. Works with Next.js, React, Vue, Express, and more.*
