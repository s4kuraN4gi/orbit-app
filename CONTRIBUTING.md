# Contributing to Orbit

Thanks for your interest in contributing! Orbit is an AI context engine that generates structured context files for AI coding assistants.

## Development Setup

```bash
git clone https://github.com/s4kuraN4gi/orbit-app.git
cd orbit-app
pnpm install
```

### Run CLI in dev mode

```bash
cd packages/cli
pnpm dev scan          # run scan command
pnpm dev context       # run context command
```

### Run tests

```bash
pnpm test
```

## What to Contribute

- **Bug reports** — file an issue with reproduction steps
- **Detector features** — add support for new frameworks/languages in `packages/cli/src/lib/detector.ts`
- **Output formats** — new context output formats in `packages/cli/src/lib/renderers.ts`
- **MCP tools** — extend Model Context Protocol integration
- **Documentation** — improve README, inline comments, or examples

## Pull Request Process

1. Fork the repo and create a feature branch from `main`
2. Make your changes with tests where applicable
3. Run `pnpm test` and `pnpm lint` to verify nothing is broken
4. Open a PR with a clear description of what and why
5. One maintainer approval is required before merging

## Code Style

- TypeScript strict mode — no `any` unless absolutely necessary
- Prefer `const` over `let`; never use `var`
- Use named exports (not default exports)
- Keep functions small and focused
- Use early returns to reduce nesting

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
