# Orbit Elevator Pitches & Post Templates

---

## 1. Core Elevator Pitch (English)

Orbit is an open-source CLI that scans your codebase and generates structured context files for AI coding assistants -- CLAUDE.md, .cursorrules, copilot-instructions.md, and .windsurfrules. Instead of dumping raw code at your AI, Orbit gives it a map: your tech stack, routes, DB schema, import graph, active tasks, and code metrics, all in ~500 tokens. Run `npx @orbit-cli/core scan -g` and your AI assistant immediately understands your project.

---

## 2. Core Elevator Pitch (Japanese)

Orbit は、コードベースをスキャンして AI コーディングアシスタント向けの構造化コンテキストファイル（CLAUDE.md / .cursorrules / copilot-instructions.md / .windsurfrules）を自動生成するオープンソース CLI です。コードを丸ごとダンプするのではなく、技術スタック・ルーティング・DB スキーマ・import グラフ・進行中タスクを約 500 トークンに凝縮して AI に渡します。`npx @orbit-cli/core scan -g` を実行するだけで、AI アシスタントがプロジェクトの全体像を即座に把握できます。

---

## 3. One-liners

**English:**
Scan your codebase, generate structured context for Claude/Cursor/Copilot/Windsurf -- not a code dump, a project map.

**Japanese:**
コードベースをスキャンし、Claude/Cursor/Copilot/Windsurf 向けの構造化コンテキストを生成。コードダンプではなく、プロジェクトの地図を AI に渡す CLI。

---

## 4. Hacker News "Show HN" Post

**Title:**
Show HN: Orbit -- structured context for AI assistants from your codebase (~500 tokens)

**Body:**

```
I built Orbit, a CLI that scans your project and generates context files
(CLAUDE.md, .cursorrules, copilot-instructions.md, .windsurfrules) for
AI coding assistants.

The idea: AI assistants work better when they understand your project's
architecture, not just the code. Orbit extracts your tech stack, API routes,
DB schema, import graph (with hub module detection), active tasks, and code
metrics -- then outputs a focused context file in ~500 tokens.

What makes it different from tools like Repomix:
- Structure over volume. Repomix is great for feeding full code to AI.
  Orbit takes the opposite approach: give AI a high-level map so it knows
  where things are and how they connect.
- Multi-format output. One scan generates context for Claude, Cursor,
  Copilot, and Windsurf simultaneously.
- Import graph analysis. Identifies hub modules and dependency clusters.
- Impact analysis. `orbit impact <file>` shows which files are affected
  by a change.
- Watch mode. Auto-regenerates context when files change.
- MCP server. Real-time integration with Claude Desktop / Cursor.

Try it (zero config):
  npx @orbit-cli/core scan -g

100% free, MIT licensed. No account needed.

GitHub: https://github.com/s4kuraN4gi/orbit-app
npm: https://www.npmjs.com/package/@orbit-cli/core

I'd genuinely appreciate feedback:
1. Is structured context actually more useful than full code dumps for your workflow?
2. What's missing from the generated output?
3. Which AI assistant do you use most?
```

---

## 5. Reddit Post Templates

### 5a. r/ClaudeAI

**Title:** I built a CLI that generates CLAUDE.md files from your codebase automatically

**Body:**

```
I got tired of manually writing CLAUDE.md files for every project, so I built
a tool that does it automatically.

Orbit scans your codebase and generates a CLAUDE.md with:
- Tech stack & framework versions
- Page routes and API endpoints
- DB schema (tables, columns)
- Import graph with hub module detection
- Active tasks (from your task tracker)
- Key file locations and code metrics

The output is ~500 tokens -- compact enough that Claude doesn't waste context
window on noise, but detailed enough that it understands your project structure.

  npx @orbit-cli/core scan -g

It also generates .cursorrules, copilot-instructions.md, and .windsurfrules
from the same scan if you use multiple tools.

Free, MIT licensed, no account required.

GitHub: https://github.com/s4kuraN4gi/orbit-app

Has anyone else found that giving Claude structured project metadata works
better than pasting large code blocks? Curious how others handle this.
```

### 5b. r/cursor

**Title:** Auto-generate .cursorrules from your codebase structure (open-source CLI)

**Body:**

```
I built Orbit, a CLI that scans your project and generates a .cursorrules
file based on your actual codebase -- tech stack, routes, DB schema, import
graph, and active tasks.

The problem I was solving: writing .cursorrules by hand is tedious, and it
gets stale as the project evolves. Orbit re-scans and regenerates it so
Cursor always has up-to-date context.

  npx @orbit-cli/core scan -g

What it generates:
- Framework & dependency versions
- Route map (pages + API endpoints)
- Database schema overview
- Import graph (which modules are hubs)
- Active task summary
- File metrics (largest files, line counts)

It also has a watch mode (`orbit watch`) that auto-regenerates when your
code changes, and an MCP server for real-time Cursor integration.

Free, open-source, MIT licensed.

GitHub: https://github.com/s4kuraN4gi/orbit-app
npm: @orbit-cli/core

Would love to hear what you typically put in your .cursorrules files --
trying to figure out what metadata is most useful for Cursor specifically.
```

### 5c. r/ChatGPTCoding

**Title:** Generate structured project context for any AI coding assistant with one command

**Body:**

```
I built an open-source CLI called Orbit that scans your codebase and
generates context files for AI coding assistants.

Instead of copying large chunks of code into your prompt, Orbit gives your AI
a structured overview: tech stack, routes, DB schema, import graph, active
tasks, and code metrics. The output is ~500 tokens -- much more token-efficient
than pasting raw code.

One scan generates context for multiple formats:
- CLAUDE.md (Claude / Claude Code)
- .cursorrules (Cursor)
- copilot-instructions.md (GitHub Copilot)
- .windsurfrules (Windsurf)

  npx @orbit-cli/core scan -g

Other features:
- Impact analysis: `orbit impact <file>` shows blast radius of changes
- Watch mode: auto-regenerate context on file changes
- MCP server: real-time integration with Claude Desktop / Cursor

Free, MIT licensed, no sign-up.

GitHub: https://github.com/s4kuraN4gi/orbit-app

Has anyone tried structured context vs raw code dumps? I found AI gives
noticeably better answers when it knows the project architecture upfront,
even if it hasn't seen the actual code.
```

---

## 6. X/Twitter Thread

### Tweet 1 (Hook)

```
I've been giving AI coding assistants the wrong kind of context.

Raw code dumps? They choke on noise.
Manual project summaries? They go stale in a day.

So I built something different. Thread:
```

### Tweet 2 (Problem)

```
The problem with most "feed your code to AI" tools:

- They dump thousands of tokens of raw code
- AI spends context window parsing syntax instead of understanding architecture
- No info about what you're *currently building*

Your AI knows your code but doesn't understand your project.
```

### Tweet 3 (Solution)

```
Orbit scans your codebase and generates a structured context file in ~500 tokens:

- Tech stack & versions
- Routes (pages + API)
- DB schema
- Import graph (hub modules, clusters)
- Active tasks

One command, multiple formats:
CLAUDE.md | .cursorrules | copilot-instructions.md | .windsurfrules
```

### Tweet 4 (Demo)

```
Zero config. One command:

  npx @orbit-cli/core scan -g

Also:
- `orbit impact <file>` -- see blast radius of changes
- `orbit watch` -- auto-regenerate on file changes
- MCP server for real-time Claude/Cursor integration

[demo GIF]
```

### Tweet 5 (CTA)

```
Free, MIT licensed, no account needed.

GitHub: https://github.com/s4kuraN4gi/orbit-app
npm: @orbit-cli/core

If you try it, I'd genuinely like to know:
- Did the generated context improve your AI's responses?
- What's missing?

PRs and issues welcome.
```

---

## 7. Zenn Article Intro Template (Japanese)

```markdown
AI コーディングアシスタント（Claude, Cursor, Copilot, Windsurf）に
プロジェクトの情報を渡すとき、どうしていますか？

コードをそのまま貼り付ける？ Repomix でリポジトリ全体をダンプする？
それでも AI は「このプロジェクトで何が重要か」を理解してくれないことが多いです。

そこで作ったのが **Orbit** というオープンソース CLI です。
コードベースをスキャンして、技術スタック・ルーティング・DB スキーマ・import グラフ・
進行中タスクなどを **約 500 トークン** の構造化コンテキストに凝縮し、
CLAUDE.md / .cursorrules / copilot-instructions.md / .windsurfrules として出力します。

```bash
npx @orbit-cli/core scan -g
```

設定不要、アカウント不要、MIT ライセンスで完全無料です。

この記事では、Orbit の仕組みと使い方、そして「構造化コンテキスト」が
なぜ AI の回答精度を上げるのかを解説します。

GitHub: https://github.com/s4kuraN4gi/orbit-app
npm: https://www.npmjs.com/package/@orbit-cli/core
```

---

## 8. dev.to Article Intro Template (English)

```markdown
When you use an AI coding assistant -- Claude, Cursor, Copilot, Windsurf --
how do you give it context about your project?

Most of us either paste code snippets (limited view) or use tools that dump
the entire repo into one file (too much noise). The AI gets code, but it
doesn't get *architecture*.

I built **Orbit**, an open-source CLI that takes a different approach.
It scans your codebase and generates a structured context file containing
your tech stack, routes, DB schema, import graph, active tasks, and code
metrics -- all in ~500 tokens.

```bash
npx @orbit-cli/core scan -g
```

One scan outputs context for multiple AI tools simultaneously:
CLAUDE.md, .cursorrules, copilot-instructions.md, and .windsurfrules.

Zero config, no account required, MIT licensed.

In this post, I'll walk through how Orbit works, what it generates, and
why structured context tends to produce better AI responses than raw code dumps.

GitHub: [github.com/s4kuraN4gi/orbit-app](https://github.com/s4kuraN4gi/orbit-app)
npm: [@orbit-cli/core](https://www.npmjs.com/package/@orbit-cli/core)
```

---

## 9. "How is this different from Repomix?"

```
Good question -- Repomix is a solid tool and we're solving related but
different problems.

Repomix packs your full codebase into a single file that you can feed to AI.
This works well when you need the AI to have access to actual source code --
for code review, refactoring, or understanding implementation details.

Orbit takes a different approach: instead of giving AI the code itself, it
gives AI a *map* of your project. It extracts structure -- tech stack, routes,
DB schema, import graph, active tasks, code metrics -- and compresses that
into ~500 tokens.

The tradeoff:
- Repomix: AI sees all your code (10,000+ tokens) but has to figure out
  the architecture from the code itself.
- Orbit: AI understands the architecture immediately (~500 tokens) but
  doesn't see the actual code unless you provide it separately.

They're complementary, honestly. You could use Orbit for the project overview
and Repomix when you need the AI to look at specific implementation details.

The other difference is that Orbit outputs native context files (.cursorrules,
CLAUDE.md, copilot-instructions.md, .windsurfrules) rather than a generic
text dump, so each AI tool gets context in its expected format.
```

---

## 10. "How is this different from Claude Code /init?"

```
Claude Code's /init command generates a CLAUDE.md based on what Claude
observes about your project during a conversation. It's convenient if you're
already in a Claude Code session.

Orbit takes a more systematic approach:

1. **Deterministic scan.** Orbit uses static analysis (AST parsing, import
   graph traversal, framework detection) rather than LLM inference. The
   output is reproducible -- same codebase always produces the same context.

2. **Richer extraction.** Orbit generates an import graph with hub module
   detection, DB schema from ORM definitions, route maps from framework
   conventions, active tasks from your task tracker, and code metrics.
   /init typically captures high-level observations.

3. **Multi-format.** Orbit generates context for Claude, Cursor, Copilot,
   and Windsurf simultaneously. /init only produces CLAUDE.md.

4. **Automation.** `orbit watch` auto-regenerates context on file changes.
   The MCP server provides real-time context to Claude Desktop / Cursor.
   /init is a one-shot command you re-run manually.

5. **No LLM cost.** Orbit runs locally with zero API calls. /init uses
   Claude to generate the file, which costs tokens.

That said, /init is zero-install and already built into Claude Code. If
you just need a quick CLAUDE.md and you're already in a Claude Code session,
/init is the fastest path. Orbit is better suited if you want structured,
reproducible context across multiple AI tools, or if you want it to stay
in sync automatically.
```

---

*Last updated: 2026-03-17*
