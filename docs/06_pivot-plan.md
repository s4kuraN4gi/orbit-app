# Orbit Pivot Plan — AI Context Engine

> Generated: 2026-02-22
> Status: Phase 2 完了
> このファイルは Orbit のピボット実装計画の全体像です。
> タスク確認時は必ずこのファイルを最初に参照してください。

---

## Overview

**現在**: タスク管理ツール（10,990行 Web UI + 1,507行 CLI）
**目標**: AI Context Engine + 軽量タスク管理 SaaS（月 $1,000 MRR）
**期間**: 約9週間（Phase 0〜5）
**一文定義**: 「タスク管理と統合された AI コンテキストエンジン — コードの構造だけでなく、今何をしようとしているかを AI に伝える唯一のツール」

### Core Assets（守るべき資産）

| ファイル | 行数 | 役割 |
|---------|------|------|
| `packages/cli/src/lib/detector.ts` | 379行 | プロダクトの心臓。プロジェクト構造解析 |
| `packages/cli/src/lib/context-generator.ts` | 128行 | AI コンテキスト出力 |
| `packages/cli/src/commands/scan.ts` | 197行 | scan コマンド |
| `components/dashboard/ProjectOverview.tsx` | 388行 | scan 結果の可視化 |
| `components/dashboard/ExportContextModal.tsx` | 164行 | コンテキストエクスポート |
| `components/dashboard/AIContextCard.tsx` | 51行 | AI コンテキスト表示 |

---

## Phase 0: Security Hotfix（3日）

> セキュリティ監査で総合評価 D（不合格）。全ての開発に先立ち修正必須。

### Critical（即時修正）

- [x] `app/api/tasks/bulk-create/route.ts` — 認証チェック追加（未認証で他人の PJ にタスク注入可能）
- [x] `app/actions/task.ts` 全関数 — 認可（プロジェクト所有権）チェック追加（IDOR）
- [x] `app/actions/idea.ts` — 認証 + 認可チェック追加（認証すらない）
- [x] `app/actions/dependency.ts` — 認証 + 認可チェック追加
- [x] `app/actions/bulkCreate.ts` — 認証 + 認可チェック追加
- [x] `app/actions/label.ts` — 認可チェック追加（認証あるが認可なし）

### High

- [x] `app/api/cli/projects/[id]/scan/route.ts` — scan_data バリデーション + 1MB サイズ制限
- [x] `app/api/tasks/bulk-create/route.ts:85` — error.message サニタイズ（内部情報漏洩防止）

### 完了条件

全 Server Actions / API Routes で「認証（誰か）」と「認可（権限があるか）」の両方が実装されていること。

---

## Phase 1: CLI OSS + scan 認証不要化（1週間）

> `npx @orbit-cli/core scan` で誰でも即座に価値体験。集客基盤。

### 実装タスク

- [x] `packages/cli/src/commands/scan.ts` — `requireAuth()` を条件分岐。未認証→ローカルスキャンのみ（タスク取得・sync スキップ）
- [x] `packages/cli/src/lib/context-generator.ts` — タスクなし時の出力対応
- [x] `packages/cli/package.json` — name → `@orbit-cli/core`、英語 description、repository/keywords 追加
- [x] `packages/cli/src/index.ts` — description 英語化（`"Orbit — AI context engine for your codebase"`）
- [x] `packages/cli/README.md` — npm 公開用 README（英語）新規作成
- [x] `packages/cli/LICENSE` — MIT 新規作成
- [x] `.github/workflows/cli-publish.yml` — npm publish 自動化 新規作成

### 完了時 UX

```bash
npx @orbit-cli/core scan           # 認証不要で即実行
npx @orbit-cli/core scan -g        # CLAUDE.md 生成
npx @orbit-cli/core scan -g -o .cursorrules  # 出力先指定
```

### KPI

- npm weekly downloads 100+
- GitHub Stars 50+

---

## Phase 2: LP 英語化 + detector 強化 + 不要機能削除（1.5週間）

> 英語圏開発者への訴求 + 競合との技術差別化の第一歩 + 4,500行削減

### 削除するファイル

| ファイル | 行数 | 理由 |
|---------|------|------|
| `components/dashboard/TaskDetailModal.tsx` | 605 | 重量級タスク詳細。軽量インライン編集で代替 |
| `components/dashboard/CommentSection.tsx` | 266 | コンテキストエンジンに不要 |
| `components/dashboard/AnalyticsView.tsx` | 252 | recharts 依存ごと削除 |
| `components/dashboard/LabelSelector.tsx` | 220 | ラベル機能削除 |
| `components/dashboard/RecurrenceSelector.tsx` | 203 | 繰り返しタスク削除 |
| `components/dashboard/DependencySection.tsx` | 196 | タスク依存関係削除 |
| `components/dashboard/GanttChart.tsx` | 181 | gantt-task-react 依存ごと削除 |
| `components/dashboard/TemplateManager.tsx` | 125 | テンプレート削除 |
| `components/dashboard/TaskBoard.tsx` | 111 | カンバン削除 |
| `components/dashboard/BoardColumn.tsx` | 66 | カンバン列削除 |
| `components/dashboard/TaskCard.tsx` | 76 | カンバンカード削除 |
| `app/actions/dependency.ts` | 70 | 依存関係 Action |
| `app/actions/template.ts` | 61 | テンプレート Action |
| `app/actions/comment.ts` | 116 | コメント Action |
| `app/actions/label.ts` | 134 | ラベル Action |

### 削除するパッケージ

`gantt-task-react`, `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, `recharts`, `react-day-picker`, `ws`

### 削除する DB テーブル

`task_dependencies`, `task_templates`, `task_labels`, `labels`, `task_comments`

### 簡素化するファイル

| ファイル | 変更前 | 変更後 | 内容 |
|---------|-------|-------|------|
| `TaskList.tsx` | 581行 | ~200行 | ラベル・依存・繰り返し表示除去。タイトル/ステータス/優先度のみ |
| `CreateTaskModal.tsx` | 322行 | ~120行 | タイトル/説明/優先度/期限の4フィールドのみ |
| `DashboardView.tsx` | 424行 | ~300行 | タブを `Overview / Tasks / Context History` の3つに変更 |
| `TaskFilters.tsx` | 131行 | ~60行 | 検索 + ステータス + showCompleted のみ |
| `app/actions/task.ts` | 301行 | ~150行 | recurrence 関連ロジック全削除 |
| `lib/schema.ts` | - | - | tasks から recurrence 系カラム・boardOrder 除去、削除テーブル定義除去 |

### LP 英語化

- [x] `app/page.tsx` — 全文英語化
  - ヒーロー: 「AI Context Engine for Developers」
  - CTA: `npx @orbit-cli/core scan -g` のコードブロック
  - 「JiraとRedmine」「チームの生産性」の文言を全て除去

### detector.ts 強化（技術差別化 Phase 1）

- [x] Import Graph 解析 — regex で import 文解析 → ファイル間依存グラフ構築
- [x] 関数/コンポーネントシグネチャ抽出 — export された関数名・kind（component/function/type/const）を抽出
- [x] マルチフォーマット出力 — `--format json|yaml|markdown` フラグ追加
- [x] `packages/cli/src/lib/formatters.ts` — 出力フォーマッター 新規作成
- [x] AI コンテキストファイル検出拡張 — `.aider`, `AGENTS.md`, `.roomodes`, Devin 設定等を追加

### KPI

- LP 訪問→CLI install 転換率 5%+

---

## Phase 3: Web UI ピボット + Pricing（2週間）

> ダッシュボードを「AI コンテキスト管理画面」に変換 + 課金導線設置

### 新規作成

| ファイル | 行数目安 | 内容 |
|---------|---------|------|
| `app/pricing/page.tsx` | ~120行 | Free/Pro/Team 料金テーブル表示 |
| `components/PricingTable.tsx` | ~120行 | 料金表コンポーネント |
| `components/dashboard/ContextHistoryView.tsx` | ~200行 | ai_contexts タイムライン。Free=5件、Pro=無制限 |
| `components/dashboard/ContextDiffView.tsx` | ~150行 | scan_data 間の差分表示（Pro のみ） |
| `components/dashboard/PricingGate.tsx` | ~80行 | ペイウォール共通コンポーネント |
| `components/dashboard/ScanDashboard.tsx` | ~200行 | scanData 可視化メインビュー |

### 修正

- [x] `DashboardView.tsx` — ProjectOverview をデフォルトタブに。タスクは従属表示
- [x] `ProjectOverview.tsx` — scanData 可視化をメインコンテンツに昇格
- [x] `ExportContextModal.tsx` — 「メイン機能」として UI 上の優先度を上げる

### フリーミアム設計

| 機能 | Free | Pro ($9/月) | Team ($19/user/月) |
|------|------|-------------|-------------------|
| CLI 全機能 | 無制限 | 無制限 | 無制限 |
| プロジェクト数 | 3 | 無制限 | 無制限 |
| Web Overview | 全機能 | 全機能 | 全機能 |
| エクスポート形式 | Markdown のみ | MD + JSON | MD + JSON + カスタム |
| コンテキスト履歴 | 直近5件 | 無制限 | 無制限 |
| Context Diff | - | 全機能 | 全機能 |
| タスク数 | 50件/PJ | 無制限 | 無制限 |
| AI Plan Import | 月3回 | 無制限 | 無制限 |
| チームメンバー | 1人 | 1人 | 無制限 |

### ペイウォールの位置（PricingGate 表示箇所）

1. `ExportContextModal` → JSON フォーマット選択時
2. `ContextHistoryView` → 6件目以降の閲覧時
3. `ContextDiffView` → タブクリック時（Pro バッジ付き）
4. `CreateProjectModal` → 4つ目のプロジェクト作成時
5. `ImportPlanModal` → 月4回目の実行時

### ユーザージャーニー

```
Day 0:  npx @orbit-cli/core scan → CLI 無料で即時価値
        ↓ CLI 出力末尾に「Web Dashboard: orbit.app」リンク
Day 1:  Web 登録 → ProjectOverview で scan 結果をリッチ可視化
        ↓ 「Export Context」で CLAUDE.md コピー（無料）
Day 3-7: 制限に当たる（4PJ目、JSON出力、履歴6件目）
        ↓ PricingGate 表示 → Pricing ページ誘導
Day 7-14: Pro にアップグレード → Stripe Checkout → 即全機能アンロック
```

### KPI

- 登録ユーザー 50+
- DAU 10+

---

## Phase 4: MCP Server + orbit watch（2週間）

> AI IDE とのリアルタイム連携 = Pro 課金の核

### 新規作成

| ファイル | 内容 |
|---------|------|
| `packages/cli/src/commands/watch.ts` | `chokidar` で FS 監視 → debounce 2秒 → 差分スキャン → CLAUDE.md 自動再生成 |
| `packages/cli/src/commands/mcp-serve.ts` | `@modelcontextprotocol/sdk` stdio transport。MCP ツール4種公開 |
| `packages/cli/src/lib/cache.ts` | `~/.orbit/cache/` ローカルキャッシュ管理 |

### MCP 公開ツール

| ツール | 機能 |
|-------|------|
| `orbit.getProjectContext` | プロジェクト全体の Context IR を返す |
| `orbit.getModuleContext(path)` | 特定モジュールの依存・シグネチャを返す |
| `orbit.getActiveTasks` | 進行中タスクとコード変更を返す |
| `orbit.getFileRelations(path)` | ファイルの import/export 先を返す |

### Context IR（中間表現）

```typescript
interface ContextIR {
  project: { name: string; techStack: string[]; packageManager: string };
  architecture: { layers: Layer[]; importGraph: Edge[] };
  activeWork: { tasks: TaskSummary[]; recentCommits: CommitRef[] };
  codeMap: { modules: ModuleSummary[]; entryPoints: string[] };
  constraints: { envVars: string[]; deployTarget: string };
}
```

各 AI ツール形式にトランスパイル:
- `renderClaude(ir)` → CLAUDE.md
- `renderCursor(ir)` → .cursorrules
- `renderCopilot(ir)` → copilot-instructions.md
- `renderWindsurf(ir)` → .windsurfrules

### orbit watch のインクリメンタル戦略

| 変更対象 | 再スキャン範囲 |
|---------|--------------|
| `package.json` | techStack + dependencies |
| `app/` 配下 | pages + apiRoutes |
| `lib/schema.ts` | dbTables |
| `.ts/.tsx` 追加/削除 | codeMetrics 差分 + importGraph 差分 |
| その他 | 変更ファイルのシグネチャのみ |

### MCP セキュリティ対策

- stdio transport 推奨（HTTP SSE より安全）
- HTTP 使用時: ランダムポート + ワンタイムトークン + CORS 厳格設定 + Host header 127.0.0.1 限定
- レスポンスに sensitive フラグ付与

### KPI

- MCP Server installs 200+
- watch 利用率 30%+

---

## Phase 5: Stripe 課金 + Team 機能（2週間）

> 収益化開始

### DB 追加

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free',  -- 'free' | 'pro' | 'team'
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,  -- 'import_plan' etc.
  month TEXT NOT NULL,    -- '2026-02'
  count INTEGER DEFAULT 0,
  UNIQUE(user_id, feature, month)
);
```

### 新規作成

| ファイル | 内容 |
|---------|------|
| `app/api/webhooks/stripe/route.ts` | Stripe Webhook 受信。署名検証必須 |
| `app/api/stripe/checkout/route.ts` | Stripe Checkout Session 作成 |
| `lib/subscription.ts` | プラン判定 + `requirePlan('pro')` ガード関数 |

### Stripe セキュリティ

- Webhook: `request.text()` (raw body) + `stripe.webhooks.constructEvent()` で署名検証
- 冪等性: `event.id` を DB 保存し重複処理防止
- プラン制限: **全てサーバー側で enforce**（クライアント非表示はバイパス可能）
- plan check は API 層で毎回実施。キャッシュ max 60秒
- Webhook 受信時に plan 変更を即座に DB 反映

### Team 機能のセキュリティ

- `team_members` テーブル: team_id, user_id, role (owner/admin/member/viewer)
- 招待: メールで招待リンク送信。署名付き JWT、有効期限72時間
- RBAC: owner > admin > member > viewer
- 全 API エンドポイントで role ベースの認可チェック

### KPI

- 有料転換率 3%+
- 月 $1,000 MRR

---

## 技術差別化ロードマップ（中長期）

| 時期 | 機能 | ライブラリ | vs Repomix |
|------|------|-----------|-----------|
| Phase 2 | Import Graph + シグネチャ抽出 | `ts-morph` | 関数単位の構造化 vs ファイル全量ダンプ |
| 3ヶ月 | 変更ヒートマップ | `git log --numstat` | 開発活動のコンテキスト化 |
| 3ヶ月 | アーキテクチャパターン認識 | importGraph 解析 | 設計方針の自動検出 |
| 3ヶ月 | TODO/FIXME/HACK 集約 | 正規表現 | コード内タスク候補の自動抽出 |
| 6ヶ月 | セマンティックチャンク化 | `tree-sitter` | 意味単位パック vs ファイル単位 |
| 6ヶ月 | コンテキスト予算マネージャ | 独自 | LLM ウィンドウに合わせた自動取捨選択 |

---

## Progress Tracker

| Phase | 期間 | 状態 | 完了日 |
|-------|------|------|-------|
| Phase 0: Security Hotfix | 3日 | [x] 完了 | 2026-02-22 |
| Phase 1: CLI OSS + scan 認証不要化 | 1週間 | [x] 完了 | 2026-02-22 |
| Phase 2: LP 英語化 + 削除 + detector 強化 | 1.5週間 | [x] 完了 | 2026-02-22 |
| Phase 3: Web UI ピボット + Pricing | 2週間 | [x] 完了 | 2026-02-23 |
| Phase 4: MCP Server + orbit watch | 2週間 | [x] 完了 | 2026-02-24 |
| Phase 5: Stripe 課金 + Team | 2週間 | [ ] 未着手 | |
