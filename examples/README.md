# Orbit Scan Examples

Real outputs from `orbit scan -g` on sample projects of different tech stacks.

These files show what structured AI context looks like compared to raw code dumps. Orbit extracts **tech stack, project structure, database schema, API routes, exports, import graph, and hub modules** -- all in a compact format that AI assistants can use immediately.

## Examples

### [Next.js SaaS](./nextjs-saas/CLAUDE.md)

A full-stack SaaS application with authentication, Stripe billing, team management, and a dashboard.

- **Stack:** React 19, TypeScript, Tailwind CSS, Drizzle ORM, Stripe, Better Auth
- **38 files, ~848 lines** -- Orbit summarizes this into a single context file
- Detects 4 pages, 11 API endpoints, 9 DB tables, 22 components
- Maps 81 local imports to surface hub modules (`@/lib/utils`, `@/types`, `@/lib/auth`)

### [Express REST API](./express-api/CLAUDE.md)

A backend API with layered architecture: routes, controllers, services, middleware.

- **Stack:** Express.js, TypeScript, Prisma, Jest
- **21 files, ~498 lines** -- structured into a clear module map
- Extracts 24 functions, 4 custom types, and the full import dependency graph
- Shows how services like `auth-service`, `product-service`, and `order-service` connect through middleware and controllers

### [Vite React App](./vite-react/CLAUDE.md)

A client-side task management app with Zustand state management and React Query data fetching.

- **Stack:** Vite, React 19, TypeScript, Zustand, React Query, Tailwind CSS
- **29 files, ~709 lines** -- mapped into components, hooks, stores, and API layers
- Identifies 17 components, 23 functions, 8 types
- Import graph reveals `@/types`, `@/utils/cn`, and `@/stores/ui-store` as hub modules

## Try It Yourself

```bash
npm install -g @orbit-cli/core
cd your-project
orbit scan -g
```

This generates a `CLAUDE.md` (or rules file for Cursor/Copilot/Windsurf) that gives AI assistants structured understanding of your codebase -- without dumping thousands of lines of raw code.
