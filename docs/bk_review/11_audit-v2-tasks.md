# Orbit 辛口審査 v2 タスク表

> 作成日: 2026-02-28
> ソース: docs/10_audit-review-2026-02-28.md（5エージェント並行審査）
> 総合スコア: 4.1/10

---

## タスク一覧

| # | Phase | 領域 | タスク | 深刻度 | 対象ファイル | 修正工数 | 状態 |
|---|-------|------|--------|--------|-------------|---------|------|
| 1 | 0 | セキュリティ | Stripe checkout に org membership 検証追加 | Critical | `app/api/stripe/checkout/route.ts` | 30m | [x] |
| 2 | 0 | セキュリティ | Stripe portal に org membership 検証追加 | Critical | `app/api/stripe/portal/route.ts` | 30m | [x] |
| 3 | 0 | セキュリティ | `syncOrgSeatCount` に認証/認可追加 | Critical | `app/invite/[id]/actions.ts` | 30m | [x] |
| 4 | 0 | セキュリティ | bulk-create を `verifyProjectAccess` に統一 | Critical | `app/api/tasks/bulk-create/route.ts` | 30m | [x] |
| 5 | 0 | セキュリティ | `requirePlan()` を `getEffectivePlan()` に修正 | Critical | `lib/subscription.ts` | 1h | [x] |
| 6 | 0 | セキュリティ | `origin` ヘッダー → `BETTER_AUTH_URL` に修正 | High | `app/api/stripe/checkout/route.ts`, `portal/route.ts` | 15m | [x] |
| 7 | 1 | セキュリティ | Rate limiter を Upstash Redis に移行 | Critical | `lib/rate-limit.ts` | 1-2h | [x] |
| 8 | 1 | セキュリティ | 入力バリデーション (Zod) 導入 | High | 全 API Route + Server Action | 4-6h | [x] |
| 9 | 1 | セキュリティ | セキュリティヘッダー追加 (CSP, X-Frame-Options 等) | High | `next.config.ts` | 30m | [x] |
| 10 | 1 | セキュリティ | パスワード強度ポリシー設定 | Medium | `lib/auth.ts` | 15m | [x] |
| 11 | 1 | セキュリティ | error メッセージの内部情報漏洩修正 | Medium | `app/login/actions.ts` | 30m | [x] |
| 12 | 1 | エンジニアリング | CI workflow 作成 (PR毎に lint+typecheck+test+build) | High | `.github/workflows/ci.yml` (新規) | 2h | [x] |
| 13 | 1 | エンジニアリング | npm publish CI にテスト追加 | High | `.github/workflows/cli-publish.yml`, `mcp-publish.yml` | 30m | [x] |
| 14 | 1 | エンジニアリング | Monitoring を `waitUntil()` に修正 | Medium | `lib/monitoring.ts` | 1h | [x] |
| 15 | 1 | UX | Settings のゴースト機能削除 (Board/Gantt) | High | `components/settings/SettingsView.tsx`, `messages/*.json` | 30m | [x] |
| 16 | 1 | UX | `console.error` → `toast.error()` に置き換え (9箇所) | High | `ContextDiffView.tsx`, `ContextHistoryView.tsx`, `TeamSettings.tsx`, `TaskList.tsx` 他 | 1h | [x] |
| 17 | 1 | UX | `confirm()` → AlertDialog に置き換え | Medium | `components/settings/TeamSettings.tsx` | 30m | [x] |
| 18 | 2 | 収益化 | CLI 機能のゲート設計 (Focus/Issues/Watch を Pro 限定 or 月N回制限) | Critical | `packages/cli/src/commands/scan.ts`, `watch.ts`, `index.ts` | 4-6h | [x] |
| 19 | 2 | 収益化 | LP CTA 改修 (npx コピーボタンを主CTA、Dashboard を secondary) | High | `app/page.tsx` | 2h | [x] |
| 20 | 2 | 収益化 | LP の「Free and open source」文言を CLI 限定に修正 | High | `app/page.tsx` | 30m | [x] |
| 21 | 2 | 収益化 | Team checkout フロー改善 (インライン組織作成) | High | `components/PricingTable.tsx`, `components/settings/TeamSettings.tsx` | 3h | [x] |
| 22 | 2 | エンジニアリング | DB インデックス追加 (ownerId, projectId, userId 等) | High | `lib/schema.ts` + migration | 1h | [x] |
| 23 | 2 | エンジニアリング | `tasks.parentId` に外部キー制約追加 | High | `lib/schema.ts` + migration | 30m | [x] |
| 24 | 2 | エンジニアリング | テスト追加: Stripe Webhook ハンドラ (優先度S) | High | `app/api/webhooks/stripe/__tests__/` (新規) | 3h | [x] |
| 25 | 2 | エンジニアリング | テスト追加: 認可ロジック (優先度S) | High | `lib/__tests__/project-access.test.ts` (新規) | 2h | [x] |
| 26 | 2 | UX | Landing Page i18n 化 | High | `app/page.tsx`, `messages/en.json`, `messages/ja.json` | 2h | [x] |
| 27 | 2 | UX | i18n の古いキー削除 (Board/Gantt/pre-pivot) | Medium | `messages/en.json`, `messages/ja.json` | 1h | [x] |
| 28 | 2 | 市場 | `.cursorrules` → `.cursor/rules/*.mdc` 形式対応 | High | `packages/cli/src/lib/renderers.ts`, `packages/cli/src/commands/scan.ts` | 3h | [x] |
| 29 | 2 | エンジニアリング | `scanData?: any` を共有型に置き換え | Medium | `components/dashboard/DashboardView.tsx`, `types/index.ts` | 1h | [x] |
| 30 | 2 | セキュリティ | CLI セッショントークンの有効期限管理 | Medium | `packages/cli/src/lib/config.ts`, `session.ts` | 1h | [x] |
| 31 | 3 | 収益化 | Pro キラーフィーチャー新設 (AI 自動コンテキスト推薦) | Critical | 新規ファイル群 | 8-12h | [x] |
| 32 | 3 | 収益化 | Pricing 改定実装 (Free制限強化 + Pro $12 + Team $15) | High | `lib/plan.ts`, `components/PricingTable.tsx`, Stripe Dashboard | 3h | [x] |
| 33 | 3 | 市場 | ポジショニング転換: 「タスク駆動 AI ワークフロー」 | Critical | `app/page.tsx`, LP全体, README | 4h | [x] |
| 34 | 3 | 市場 | `orbit plan <task-id>` コマンド実装 | High | `packages/cli/src/commands/plan.ts` (新規) | 6-8h | [x] |
| 35 | 3 | エンジニアリング | テスト追加: ContextIR ビルダー (優先度A) | Medium | `packages/cli/src/lib/__tests__/context-ir.test.ts` (新規) | 2h | [x] |
| 36 | 3 | エンジニアリング | テスト追加: Renderers (優先度A) | Medium | `packages/cli/src/lib/__tests__/renderers.test.ts` (新規) | 2h | [x] |
| 37 | 3 | エンジニアリング | `any` 型の撲滅 (29箇所) | Medium | 複数ファイル | 3-4h | [x] |
| 38 | 3 | エンジニアリング | MCP Server 二重実装の一本化 | Low | `packages/cli/src/commands/mcp-serve.ts`, `packages/mcp/` | 2h | [x] |
| 39 | 3 | 市場 | Tree-sitter 対応検討・PoC | Medium | `packages/cli/src/lib/detector.ts` | 8h | [x] 見送り判断 |
| 40 | 3 | UX | CLI `--quiet`/`--verbose` フラグ追加 | Low | `packages/cli/src/commands/scan.ts`, `index.ts` | 1h | [x] |
| 41 | 3 | UX | CLI 初回実行後の「What's next?」ガイド表示 | Medium | `packages/cli/src/commands/scan.ts` | 1h | [x] |

---

## Phase 別サマリー

### Phase 0: 今すぐ（1-2日）— セキュリティ緊急修正

| 指標 | 値 |
|------|---|
| タスク数 | 6 |
| 合計工数 | 3-4h |
| 目的 | 他人の組織の課金を操作できる脆弱性を塞ぐ |

対象タスク: #1〜#6

```
修正フロー:
Stripe checkout/portal → member テーブルで org 所属 + admin/owner 確認
syncOrgSeatCount → requireUser() + member 確認
bulk-create → verifyProjectAccess() に統一
requirePlan() → getEffectivePlan() に変更
origin ヘッダー → BETTER_AUTH_URL に固定
```

### Phase 1: 今週中 — 基盤修正

| 指標 | 値 |
|------|---|
| タスク数 | 11 |
| 合計工数 | 10-14h |
| 目的 | プロダクション運用の最低ラインを満たす |

対象タスク: #7〜#17

重点:
- Rate limiter を実効性のある外部ストアに移行
- CI パイプラインでテスト・lint・ビルド検証を自動化
- ゴースト機能とエラーハンドリングの修正

### Phase 2: 2週間以内 — 収益化構造修正 + テスト強化

| 指標 | 値 |
|------|---|
| タスク数 | 13 |
| 合計工数 | 19-24h |
| 目的 | 「課金する理由」を作る + 品質保証の基盤 |

対象タスク: #18〜#30

重点:
- **CLI 機能のゲート設計**（最重要 — 収益化の根本課題）
- LP の CTA とメッセージ修正
- Stripe Webhook + 認可のテスト（課金の安全網）
- `.cursor/rules/*.mdc` 対応（市場対応）

### Phase 3: 1ヶ月以内 — 差別化再構築

| 指標 | 値 |
|------|---|
| タスク数 | 11 |
| 合計工数 | 39-51h |
| 目的 | 市場での生存可能性を確保 |

対象タスク: #31〜#41

重点:
- ポジショニング転換: 「コンテキスト生成」→「タスク駆動 AI ワークフロー」
- `orbit plan` コマンドで差別化
- Pricing 改定で Free→Pro の壁を適正化

---

## 領域別サマリー

| 領域 | タスク数 | Critical | High | Medium | Low |
|------|---------|---------|------|--------|-----|
| セキュリティ | 11 | 6 | 3 | 2 | 0 |
| 収益化 | 6 | 2 | 3 | 0 | 0 |
| エンジニアリング | 13 | 0 | 7 | 5 | 1 |
| UX | 7 | 0 | 3 | 3 | 1 |
| 市場 | 4 | 1 | 1 | 1 | 0 |
| **合計** | **41** | **9** | **17** | **11** | **2** |

---

## 収益化ネックの解決順序

```
[ネック 1] CLI 全機能無料 → タスク #18 で解決
  ↓
[ネック 3] Pro の独自価値が薄い → タスク #31, #34 で解決
  ↓
[ネック 2] LP が「無料 OSS」を強調 → タスク #19, #20, #33 で解決
  ↓
[ネック 4] 差別化が 3-6 ヶ月で消滅 → タスク #28, #34, #39 で解決
```

---

## $1,000 MRR ロードマップとタスクの対応

| 期間 | 目標 | 必須タスク |
|------|------|-----------|
| 1ヶ月目 | 100 WAU | Phase 0+1 全完了、HN/PH 投稿 |
| 2ヶ月目 | 50 Web UI 登録 | #18 CLI ゲート、#19-20 LP 改修 |
| 3ヶ月目 | 10 Pro ($90 MRR) | #31 Pro キラーフィーチャー、#32 Pricing 改定 |
| 6ヶ月目 | 50 Pro + 2 Team ($594 MRR) | #21 Team フロー、#34 orbit plan |
| 12ヶ月目 | $1,000+ MRR | #39 Tree-sitter、継続的改善 |

---

## 合計工数見積

| Phase | 工数 | 期限 |
|-------|------|------|
| Phase 0 | 3-4h | 即日 |
| Phase 1 | 10-14h | 今週中 |
| Phase 2 | 19-24h | 2週間以内 |
| Phase 3 | 39-51h | 1ヶ月以内 |
| **合計** | **71-93h** | — |
