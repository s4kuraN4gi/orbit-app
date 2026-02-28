# Orbit 辛口審査 アクションプラン

> 審査日: 2026-02-27
> 審査方式: 3エージェント並行審査（CTO技術・市場競合・プロダクトUX）
> 前回審査: 2026-02-22（ピボット戦略策定 → docs/06_pivot-plan.md の基盤）

---

## 審査スコア

| 審査領域 | 評価 | 審査官 |
|---------|------|--------|
| CTO 技術審査 | 6.5/10 | YC出身 元Google Staff Engineer |
| 市場競合分析 | 3/10 | AI/DevTools 市場専門家 |
| プロダクト・UX | 5.5/10 | 元Stripe/Vercel シニアPM |
| **総合** | **5.0/10** | — |

---

## 審査の要約

### 良い点
- detector.ts のコア解析エンジンが秀逸（492行で構造解析・依存グラフ・署名抽出）
- Stripe 連携が堅い（署名検証・冪等性・seat 自動更新）
- Better Auth + Organization プラグイン活用が適切
- CLI の無認証設計（Phase 1）が集客基盤として正しい
- セキュリティ修正（Phase 0）が徹底されている

### 致命的な問題
- テストカバレッジ 0%（130ソースファイル）
- 「構造化コンテキスト vs 全量ダンプ」の差別化が崩壊（Repomix --compress で Tree-sitter 構造抽出済み）
- Claude Code /init が CLAUDE.md 自動生成をビルトイン化
- npm 未公開のまま Phase 5B まで完走（公開済み: 2026-02-27）
- ゼロユーザーからの PMF 検証なし
- ContextDiff が製品レベルに達していない
- i18n にハードコード残り（修正済み: 2026-02-27）

### 競合状況（2026年2月時点）
| 競合 | Stars/規模 | 脅威 |
|------|-----------|------|
| Repomix | 22,000+ Stars, 無料, Tree-sitter --compress | 直接競合・差別化崩壊 |
| Claude Code /init | ビルトイン CLAUDE.md 生成 | コアバリュー代替 |
| Cursor Dynamic Context | 静的ルールファイル非推奨化 | 市場縮小 |
| Greptile | $180M バリュエーション, Neo4j | 技術的に1-2世代先 |
| Potpie AI | $2.2M 調達, ナレッジグラフ | 技術的に先行 |

---

## アクションプラン

### Priority A: 今週中

- [x] npm 公開 — `@orbit-cli/core@0.1.0` (完了: 2026-02-27)
- [x] ハードコード toast の i18n 化 — 14箇所修正 (完了: 2026-02-27)
- [x] LP に Repomix 比較表追加 — Repomix 名指し比較表に差し替え (完了: 2026-02-27)
- [~] HN "Show HN" 投稿 — ドラフト完成、手動投稿待ち (docs/08_launch-drafts.md)
- [~] Product Hunt ローンチ — ドラフト完成、手動投稿待ち (docs/08_launch-drafts.md)

### Priority B: 2週間内

- [x] テスト導入（Vitest） — 46テスト: stripe/subscription/detector (完了: 2026-02-27)
- [x] ContextDiff を完成 — 12カテゴリの包括的差分比較に拡充 (完了: 2026-02-27)
- [x] Dashboard タブを3つに整理 — Overview / Tasks / Context (完了: 2026-02-27)
- [x] Pricing page に Team 詳細追加 — 6機能 + 4カード詳細セクション (完了: 2026-02-27)
- [x] エラー Alert 機構 — lib/alert.ts + Slack webhook 対応 (完了: 2026-02-27)

### Priority C: 1ヶ月内

- [x] 差別化軸の再構築 — Focus Mode: タスク連動コンテキスト特化 (完了: 2026-02-27)
- [x] 外部イシュートラッカー連携 — GitHub Issues → AI コンテキスト自動生成 (完了: 2026-02-27)
- [x] Rate Limiting — API Routes に追加 (完了: 2026-02-27)
- [x] DB migration story — `userSettings.plan` と `subscriptions.plan` の冗長性解消 (完了: 2026-02-27)
- [x] 認可チェック統一 — `requireProjectAccess` と `checkProjectAccess` を一本化 (完了: 2026-02-27)

### Priority D: 中長期

- [x] MCP Server 単品切り出し — @orbit-cli/mcp パッケージ (完了: 2026-02-27)
- [x] Monitoring & Analytics — lib/monitoring.ts + PostHog 対応 (完了: 2026-02-27)
- [~] Dev.to / Reddit で記事 — ドラフト完成 (docs/09_content-drafts.md)

---

## $1,000 MRR への道

### 現在の課題
- $1,000 MRR = Pro 111人 or Team 53席
- 有料転換率 3% → 登録ユーザー 3,700人必要
- 現在のユーザー数: ≈ 0

### 市場エージェントが提案した代替戦略

**選択肢A: MCP Server 単品で勝負**
MCP は2026年の最大トレンド（97M 月間 SDK DL）。Orbit MCP Server を切り出し、プレミアム MCP ツールでマネタイズ。

**選択肢B: 「タスク対応コンテキスト」に特化**
唯一の本物の差別化 = 「今やっているタスクに応じてコンテキストが変わる」。Linear / GitHub Issues / Jira 連携を最優先。内蔵タスク管理は捨てる。

**選択肢C: OSS + スポンサー/コンサル**
SaaS $1,000 MRR はゼロユーザーから非現実的。OSS として広めてスポンサー収入や企業コンサルで稼ぐ。

---

## 技術的ボトルネック（CTO指摘）

1. **テストゼロ** — detector.ts の regex 変更で全ユーザーの scan 結果が壊れるリスク
2. **エラーハンドリング** — Stripe seat 更新失敗が console.error で消える
3. **DB 冗長性** — userSettings.plan と subscriptions.plan の二重管理
4. **認可パターン不統一** — requireProjectAccess と checkProjectAccess が微妙に異なるロジック
5. **Pro + Team 二重課金リスク** — getEffectivePlan は判定のみ、実際の請求とズレる可能性
6. **MCP Server** — エラーハンドリング不足、console.log を stderr にリダイレクトする脆弱な実装

---

## 参考ソース

- [Repomix GitHub](https://github.com/yamadashy/repomix) — 22,000+ Stars
- [Repomix MCP Server](https://repomix.com/guide/mcp-server) — Top 10 MCP Servers
- [Greptile $180M Valuation](https://techfundingnews.com/ai-startup-greptile-eyes-180m-valuation-to-disrupt-future-of-ai-code-review/)
- [Potpie AI $2.2M Raise](https://www.sovereignmagazine.com/startups/potpie-ai-raises-2-2-million-to-give-ai-agents-codebase-context/)
- [The State of MCP — Zuplo Report](https://zuplo.com/mcp-report) — 97M 月間 SDK DL
- [AI Dev Tool Power Rankings Feb 2026](https://blog.logrocket.com/ai-dev-tool-power-rankings/)
