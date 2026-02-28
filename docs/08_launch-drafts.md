# Orbit Launch Drafts

## Hacker News — Show HN

### Title
Show HN: Orbit – AI context engine that gives Claude/Cursor your project's structure, not a code dump

### Text
```
Hi HN,

I built Orbit, an open-source CLI that scans your codebase and generates structured context files (CLAUDE.md, .cursorrules, copilot-instructions.md) for AI coding assistants.

The problem: Tools like Repomix pack your entire repo into one massive file. AI assistants choke on noise. They don't know your architecture, your routes, or what you're working on right now.

Orbit takes a different approach:
- Scans your tech stack, routes, DB schema, import graph, and code metrics
- Includes your active tasks so AI knows *what you're building*, not just what exists
- Generates focused context files in the format your AI needs
- MCP Server for real-time integration with Claude/Cursor
- Watch mode: auto-regenerates context on file changes

Try it:
  npx @orbit-cli/core scan -g

No sign-up required. CLI is free and MIT licensed.

Web dashboard (optional): https://orbit-app-ruddy.vercel.app
GitHub: https://github.com/s4kuraN4gi/orbit-app
npm: https://www.npmjs.com/package/@orbit-cli/core

I'd love feedback on:
1. Is "task-aware context" actually useful for your workflow?
2. What format/AI tool do you use most?
3. What's missing from the scan output?

Built with: Next.js, TypeScript, Commander.js, MCP SDK
```

### Submission URL
https://news.ycombinator.com/submit
- URL: https://www.npmjs.com/package/@orbit-cli/core (or GitHub URL)
- Title: Show HN: Orbit – AI context engine that gives Claude/Cursor your project structure

### Best Time to Post
- Weekday morning US time (Tuesday-Thursday, 9-11 AM ET)
- Avoid weekends and Monday mornings

---

## Product Hunt

### Tagline
AI context engine — give Claude & Cursor your project's structure, not a code dump

### Description
```
Orbit scans your codebase and generates structured context files for AI coding assistants like Claude, Cursor, Copilot, and Windsurf.

Unlike code-dump tools, Orbit understands your project's architecture:
- Tech stack, routes, DB schema, import graph
- Active tasks and completion progress
- Git status and recent activity

One command, zero config:
npx @orbit-cli/core scan -g

Features:
- Multi-format output (CLAUDE.md, .cursorrules, copilot-instructions.md, .windsurfrules)
- MCP Server for real-time AI IDE integration
- Watch mode with incremental scanning
- Web dashboard for visual overview and context history
- Free CLI, open source (MIT)
```

### Topics
- Developer Tools
- Artificial Intelligence
- Open Source
- Productivity
- CLI Tools

### Maker Comment
```
Hey Product Hunt! I built Orbit because I was tired of copy-pasting project context into AI chats.

Existing tools dump your entire codebase into one file — but AI assistants don't need every line of code. They need to understand your architecture and what you're working on.

Orbit scans your project structure and generates focused context files. The CLI is completely free and works without sign-up.

Would love your feedback!
```

---

## Notes

- GitHub repo (s4kuraN4gi/orbit-app) should have a polished README before launch
- Consider creating a short demo GIF/video (30 seconds) showing scan → CLAUDE.md generation
- Respond to every comment on HN within the first 6 hours
- Product Hunt launch should be on a Tuesday or Wednesday
