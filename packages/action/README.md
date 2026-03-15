# Orbit Context Update — GitHub Action

Keep your AI context files (`CLAUDE.md`, `.cursorrules`, etc.) automatically in sync with your codebase on every PR.

Orbit scans your project structure — files, imports, exports, types, scripts, DB schemas — and generates a structured context file that AI coding assistants can consume. This Action runs that scan on every PR so the context never goes stale.

## Quick Start

Add this to `.github/workflows/orbit-context.yml`:

```yaml
name: Update AI Context
on:
  pull_request:
    branches: [main]

permissions:
  contents: write

jobs:
  update-context:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: s4kuraN4gi/orbit-action@v1
```

That's it. Every PR will now get an up-to-date `CLAUDE.md` committed back to the branch.

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `target` | `claude` | Output format: `claude`, `cursor`, `cursor-mdc`, `copilot`, `windsurf` |
| `output` | *(auto)* | Custom output file path. If omitted, uses the default for the target (e.g. `CLAUDE.md` for claude, `.cursorrules` for cursor). |
| `commit` | `true` | Whether to auto-commit and push changes back to the PR branch. |
| `commit-message` | `chore: update AI context [orbit]` | Commit message used for the auto-commit. |

## Examples

### Basic — Update CLAUDE.md on every PR

```yaml
name: Update AI Context
on:
  pull_request:
    branches: [main]

permissions:
  contents: write

jobs:
  update-context:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}
          token: ${{ secrets.GITHUB_TOKEN }}

      - uses: s4kuraN4gi/orbit-action@v1
```

### Multi-format — Generate both CLAUDE.md and .cursorrules

```yaml
name: Update AI Context (multi)
on:
  pull_request:
    branches: [main]

permissions:
  contents: write

jobs:
  update-context:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.head_ref }}
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Generate CLAUDE.md
        uses: s4kuraN4gi/orbit-action@v1
        with:
          target: claude
          commit: 'false'

      - name: Generate .cursorrules
        uses: s4kuraN4gi/orbit-action@v1
        with:
          target: cursor
          commit: 'false'

      - name: Commit all changes
        run: |
          git config user.name "orbit-bot"
          git config user.email "orbit-bot@users.noreply.github.com"
          git add -A
          git diff --staged --quiet || git commit -m "chore: update AI context files [orbit]"
          git push
```

### Scheduled — Weekly regeneration on main

```yaml
name: Refresh AI Context (weekly)
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 09:00 UTC
  workflow_dispatch:       # Allow manual trigger

permissions:
  contents: write

jobs:
  refresh-context:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: s4kuraN4gi/orbit-action@v1
        with:
          commit-message: 'chore: weekly AI context refresh [orbit]'
```

### Custom output path

```yaml
- uses: s4kuraN4gi/orbit-action@v1
  with:
    target: claude
    output: 'docs/AI_CONTEXT.md'
```

### Dry run (no commit)

```yaml
- uses: s4kuraN4gi/orbit-action@v1
  with:
    commit: 'false'
```

The generated file will appear in the workspace but won't be committed. Useful if you want to inspect changes in a later step or handle commits yourself.

## How It Works

1. Sets up Node.js 20
2. Runs `npx @orbit-cli/core@latest scan -g --target <target>` in the checked-out repo
3. If `commit` is `true`, stages all changes, and pushes a commit only if something actually changed (no empty commits)

## Requirements

- The workflow must have `contents: write` permission.
- For PRs, use `actions/checkout@v4` with `ref: ${{ github.head_ref }}` so commits go to the PR branch (not the merge ref).
- No Orbit account or API key is needed. The `scan -g` command is a free feature.

## License

MIT
