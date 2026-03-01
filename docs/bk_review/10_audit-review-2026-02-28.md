# Orbit 辛口審査レポート v2

> 審査日: 2026-02-28
> 審査方式: 5エージェント並行審査
> 前回審査: 2026-02-27（docs/07_audit-action-plan.md）
> 対象コミット: 6989d9d (feat: 辛口審査アクションプラン全項目実装)

---

## 審査スコア

| 審査領域 | 評価 | 前回 | 審査官 |
|---------|------|------|--------|
| CTO セキュリティ審査 | **3.5/10** | 6.5/10 | YC出身 元Google Staff Engineer (SREリード) |
| 収益化・マネタイズ | **3/10** | — | 元Stripe/Vercel シニアPM, YC Partner |
| 市場・競合分析 | **3/10** | 3/10 | a16z Market Research チームリード |
| プロダクト・UX | **5.5/10** | 5.5/10 | 元Stripe/Vercel シニアプロダクトデザイナー |
| エンジニアリングマネジメント | **5.5/10** | — | 元Meta/Stripe VP of Engineering |
| **総合** | **4.1/10** | 5.0/10 | — |

> **前回比: -0.9pt** — セキュリティ審査が深掘りにより大幅下落。収益化の構造的問題が新たに判明。

---

## 総合サマリー

### 一言で言うと
> 「良いエンジンを積んだ車に、ブレーキとメーターがまだ付いていない。そして走る道が間違っている。」

### 最大の問題 TOP 5
1. **CLI が全機能無料** → Web UI 課金の動機がゼロ（$1 MRR すら到達不能）
2. **Stripe 課金に認可チェック欠如** → 他人の組織の課金を操作できる脆弱性
3. **Rate Limiter がサーバーレスで無効** → 全 API が無防備
4. **差別化が 3-6 ヶ月で消滅** → Repomix/Claude Code/Cursor が同機能を追加
5. **テスト 46 件のみ、CI にテストなし** → リファクタリング・機能追加がリグレッション地雷原

---

## 1. CTO セキュリティ審査（3.5/10）

### Critical（即座に修正が必要）

**C-1. Stripe checkout で org membership 未検証**
- ファイル: `app/api/stripe/checkout/route.ts` L38-66
- 問題: `plan === 'team' && organizationId` の分岐で、ログインユーザーがその組織に所属しているかのチェックがない。任意の `organizationId` でチームチェックアウトを開始し、他人の組織の Stripe 課金データにアクセス・上書きできる。
- 修正:
```typescript
const [m] = await db.select({ role: member.role }).from(member)
  .where(and(eq(member.organizationId, organizationId), eq(member.userId, userId)));
if (!m || (m.role !== 'owner' && m.role !== 'admin')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

**C-2. Stripe portal で org membership 未検証**
- ファイル: `app/api/stripe/portal/route.ts` L29-44
- 問題: C-1 と同様。任意の `organizationId` で他人の組織の課金ポータルを開き、サブスクリプションのキャンセル・プラン変更が可能。
- 修正: C-1 と同じく `member` テーブルで owner/admin 確認を追加。

**C-3. `syncOrgSeatCount` Server Action に認証/認可なし**
- ファイル: `app/invite/[id]/actions.ts` L1-7
- 問題: `'use server'` ディレクティブはあるがクライアントから直接呼び出し可能。認証も orgId に対する認可チェックもない。攻撃者は任意の `organizationId` を渡して Stripe の quantity を不正に操作（過小請求）できる。
- 修正: `requireUser()` で認証し、`member` テーブルで admin/owner ロールを確認。

**C-4. `/api/tasks/bulk-create` が旧式の `ownerId` チェック**
- ファイル: `app/api/tasks/bulk-create/route.ts` L73-85
- 問題: `project.ownerId !== session.user.id` でチェック。チームプロジェクトではメンバーが常に 403。認可ロジックが統一されていない。
- 修正: `verifyProjectAccess` を使用。

**C-5. In-memory rate limiter はサーバーレスで完全に無効**
- ファイル: `lib/rate-limit.ts` L1-28
- 問題: `new Map<string, number[]>()` をモジュールスコープで保持。Vercel の各インスタンスで独立。Cold start のたびに空。全 API ルートが無制限にアクセス可能。
- 修正: Upstash Redis (`@upstash/ratelimit`) に移行。

**C-6. `requirePlan()` が個人プランのみチェック**
- ファイル: `lib/subscription.ts` L155-162
- 問題: `getSubscriptionPlan(userId)` のみ呼び、`getEffectivePlan()` を使っていない。Team プラン経由の Pro 機能が使えない。
- 修正: `getEffectivePlan(userId, orgId)` を使うように変更。

### High（2週間以内に修正）

**H-1. 入力バリデーションライブラリの完全な不在**
- 問題: Zod / Joi 等が未使用。全 API ルートと Server Action が `as` キャストでリクエストボディを型付け。不正な型・超長文字列がそのまま DB に到達。
- 例: `checkout/route.ts` L25 — `plan` に `"admin"` や任意文字列を渡せる
- 修正: Zod で全エンドポイントの入力を `.parse()`。

**H-2. npm publish CI にテスト・lint ステップなし**
- ファイル: `.github/workflows/cli-publish.yml`, `mcp-publish.yml`
- 問題: `cli-v*` / `mcp-v*` タグ push で即 build + publish。テスト・lint・型チェック一切なし。
- 修正: publish 前に `pnpm test`, `pnpm lint`, `tsc --noEmit` を追加。

**H-3. DB にパフォーマンスインデックスなし**
- ファイル: `lib/schema.ts`
- 対象: `projects.ownerId`, `projects.organizationId`, `tasks.projectId`, `member.userId` + `member.organizationId`, `subscriptions.stripeSubscriptionId` 等
- 修正: Drizzle の `.index()` を追加するマイグレーション作成。

**H-4. `tasks.parentId` に外部キー制約なし**
- ファイル: `lib/schema.ts` L143
- 問題: 親タスク削除時に孤児サブタスクが発生。
- 修正: `.references(() => tasks.id, { onDelete: 'set null' })` を追加。

**H-5. セキュリティヘッダーの欠如**
- 問題: `next.config.ts` に CSP, X-Frame-Options, X-Content-Type-Options 等の設定なし。
- 修正: `next.config.ts` の `headers()` で適切なセキュリティヘッダーを設定。

**H-6. `origin` ヘッダーの信頼**
- ファイル: `app/api/stripe/checkout/route.ts` L35, `portal/route.ts` L26
- 問題: `request.headers.get('origin')` で Stripe redirect URL を構築。フィッシングサイトに誘導される可能性。
- 修正: 環境変数 `BETTER_AUTH_URL` のみを使用。

### Medium（1ヶ月以内に修正）

- **M-1. 監視メトリクスがサーバーレスで消失** — `setTimeout` ベースのフラッシュが発火しない。`waitUntil()` API を使用すべき。
- **M-2. CLI セッショントークンがプレーンテキスト保存** — 有効期限管理が不明。CLI 用 API トークン機構を検討。
- **M-3. signup 時のパスワード強度ポリシーなし** — Better Auth のデフォルトに依存。最小 8 文字を明示設定。
- **M-4. error メッセージに内部情報漏洩リスク** — login の `error.message` を URL パラメータに含めてクライアント返却。

### 良い点
- Stripe webhook の署名検証 + 冪等性チェックは production-grade
- `verifyProjectAccess` の分離設計（判断のみ、throw しない）は正しい
- CLI のファイルパーミッション (`0o600`, `0o700`) が適切
- scan データの 1MB サイズ制限とスナップショット上限 (50件)

---

## 2. 収益化・マネタイズ審査（3/10）

### 致命的な収益化リスク

**1. CLI が Web UI の完全上位互換になっている**

`orbit scan -g` で全機能が無料で動作する。`--format json`, `--target cursor/copilot/windsurf`, `--focus`, `--issues` もすべて無料。ユーザーが Web UI にログインする理由が存在しない。

> 改善策:
> - CLI のコンテキスト生成を月 N 回に制限（認証必須でカウント）
> - `--focus` と `--issues` をプレミアムフラグとして認証 + Pro 必須に
> - Watch mode を Pro 限定に

**2. Free → Pro のアップグレード動機がほぼゼロ**

Pro の差分: プロジェクト数（3→無制限）、タスク数（50→無制限）、Context History（5→無制限）、JSON export、Context Diff。しかし個人開発者は 1-2 プロジェクトで十分、タスク管理はコアバリューではない、CLI で `--format json` すれば無料。

> 改善策:
> - Pro のキラーフィーチャーを新設: AI 自動コンテキスト推薦、CI/CD 統合、Slack 通知
> - Usage-based 制限: 月間スキャン回数で無料を制限
> - CLI 出力品質を段階化: Free は基本構造のみ、Pro は完全版

**3. ランディングページが「無料で全部できます」と宣伝**

LP の CTA 直前に「No sign-up required. Free and open source.」と記載。ユーザーの合理的行動は CLI 実行して終了。

### 収益化シミュレーション

**$1,000 MRR 到達シナリオ**

| シナリオ | 必要ユーザー | 転換率 | 到達期間 |
|---------|------------|--------|---------|
| 楽観 | Pro 80名 + Team 3チーム。npm 5,000 DL/週、Web 流入最適化済み | 2% | 6-9ヶ月 |
| 現実 | 現構造ではWeb流入ほぼゼロ。月間有料転換≈1.2人 | 0.1% | **到達不能** |
| 悲観 | 0ユーザー → $0 MRR のまま。CLI は慈善事業 | 0% | ∞ |

> **核心**: 0 ユーザーから $1,000 MRR への道は「プロダクト改善」ではなく「ディストリビューション」の問題。しかし現在のプロダクト構造では、ディストリビューションに成功しても収益化できない。

### Pricing 改定案

| | Free | Pro ($12/月) | Team ($15/user/月) |
|---|---|---|---|
| CLI scan | 月5回 | 無制限 | 無制限 |
| コンテキスト生成 | Markdown, 基本項目のみ | 全フォーマット, 全項目 | 全フォーマット, 全項目 |
| Web ダッシュボード | 1プロジェクト | 無制限 | 無制限 |
| Context History | 3件 | 無制限 | 無制限 |
| Context Diff | なし | あり | あり |
| Watch mode | なし | あり | あり |
| Focus Mode | なし | あり | あり |
| AI 推薦 (新機能) | なし | あり | あり |
| CI 統合 (新機能) | なし | あり | あり |
| チーム共有 | なし | なし | あり |

### 代替収益モデル

| モデル | 実現可能性 | 推定月収 |
|--------|-----------|---------|
| GitHub Sponsors | 高 | $50-200/月 |
| テンプレート販売 | 中 | $100-500/月 |
| API as a Service | 中 | $200-1,000/月 |
| コンサルティング | 中-高 | $1,000-5,000/月 |
| MCP Marketplace | 低-中 | 未知数 |
| Enterprise Self-hosted | 低 | $0 (短期) |

### 良い点
- Stripe 統合の品質は production-ready（署名検証、冪等性、seat 自動更新）
- PricingGate のブラー + ロックオーバーレイは良い UX パターン
- `getEffectivePlan()` の設計思想（個人/チーム高い方を採用）は正しい

---

## 3. 市場・競合分析（3/10）

### 致命的な市場リスク

| リスク | 発生確率 | インパクト |
|--------|---------|-----------|
| Claude Code `/init` が Orbit の全機能を無料で代替 | 95% (既発生) | 致命的 |
| Repomix の Tree-sitter + MCP が技術的に 1-2 世代先 | 90% | 致命的 |
| Cursor が `.cursorrules` を非推奨化 → `.cursor/rules/*.mdc` に移行 | 100% (既発生) | 高 |
| $0 MRR で SaaS 課金モデルが成立しない | 85% | 高 |
| Greptile/Potpie が VC マネーで市場を埋め尽くす | 70% | 中-高 |

### 差別化の持続性

| 機能 | 現在の独自性 | 6ヶ月後 | 寿命 |
|------|------------|--------|------|
| Focus Mode | 中（タスク連動コンテキスト） | 低（IDE 動的コンテキストが標準化） | 3-6ヶ月 |
| MCP Server | 低-中（5ツール） | 低（Repomix MCP が Top 10、Orbit は無名） | 3ヶ月 |
| 構造化コンテキスト | 中（ContextIR） | 低（regex < Tree-sitter） | 3-6ヶ月 |
| マルチフォーマット | 中（4形式） | 低（.cursorrules 非推奨化で実質3形式） | 3ヶ月 |
| GitHub Issues 連携 | 低-中 | 低（Claude Code は `gh` CLI と統合済み） | 3ヶ月 |

### 競合マトリクス

| 観点 | Orbit | Repomix | Claude Code /init | Cursor Dynamic | Greptile |
|------|-------|---------|-------------------|---------------|----------|
| 解析エンジン | Regex (TS のみ) | Tree-sitter (100+言語) | Anthropic 内部 | エディタ内蔵 | Neo4j |
| 精度 | 低-中 | 高 | 中-高 | 高 | 非常に高 |
| 価格 | Free/$9 Pro | 完全無料 | Claude 契約に含む | Cursor 契約に含む | Enterprise |
| GitHub Stars | 0 | 22,000+ | N/A | N/A | ~1,000 |
| npm DL/週 | ~0 | 数万+ | N/A | N/A | N/A |
| 資金 | 自己資金 | 個人 OSS | Anthropic $7.6B+ | Anysphere $2.5B+ | $41.9M |
| 堀 (Moat) | なし | コミュニティ | プラットフォーム | プラットフォーム | 技術+資金 |

### 推奨ポジショニング

**候補A（推奨）: 「タスク駆動 AI ペアプログラミング・コーディネーター」**
- `orbit plan <task-id>`: タスクから実装計画を AI 生成
- `orbit focus <task-id>`: 関連ファイルを特定し MCP 経由で AI に注入
- `orbit done <task-id>`: 変更差分をタスクに紐付け、PR description 自動生成
- 「コンテキスト生成」→「タスク実行支援」への移行。Repomix/Claude Code とは異なる問題を解決。

**候補B: 「AI コーディング品質保証ツール」**
- アーキテクチャルール違反検出、AI 生成コードの適合性チェック、コンテキストドリフト検出

**候補C: 「MCP ファースト・プロジェクト理解サーバー」**
- CLI を捨て MCP Server に全振り（差別化困難）

### 良い点
- ContextIR（中間表現）の設計思想は Repomix にない抽象化レイヤー
- CLI 無料 → Web 課金のフリーミアム設計は GTM として理論的に正しい
- MCP エコシステムへの早期参入タイミングは悪くない
- 日本語/英語 i18n は日本市場足がかりとして有効

---

## 4. プロダクト・UX 審査（5.5/10）

### Critical UX Issues

**1. Free-to-Paid 転換パスが構造的に壊れている**
- `orbit scan -g` で全コンテキスト生成が無料・オフライン・無制限に動作
- Web UI の Pro 機能（Context History, Context Diff）は「既にローカルにあるデータの二次分析」
- ペイウォールが主要ワークフローの外に置かれている

**2. Landing Page が訪問者を転換できない**
- CTA「Try the Dashboard」がログインページに誘導するが、CLI-first 製品として矛盾
- 直前に「No sign-up required. Free and open source.」と記載
- 改善: npx コマンドのコピーボタンを主要 CTA に、ダッシュボードは secondary に

**3. Settings ページにピボット前のゴースト機能が残存**
- `SettingsView.tsx` L50: `'list' | 'board' | 'gantt'` が選択可能
- Board と Gantt ビューは現在のプロダクトに存在しない
- キーボードショートカットにも Board View (key `2`)、Gantt View (key `3`) が残存

### Major UX Issues

**4. Landing Page が英語のみ（i18n 未対応）**
- `app/page.tsx` に `useTranslations()` 呼び出しなし
- `en.json` の `landing` セクションはピボット前のキーが残存

**5. エラーハンドリングが開発者向けのみ**
- 9箇所の `console.error()` がユーザー向けフィードバックの代替
- ContextDiffView: スナップショット読み込み失敗 → 永遠のローディング
- TeamSettings: org ロード失敗 → エラー表示なし

**6. Team 課金フローが混乱を招く**
- PricingTable で「Upgrade to Team」クリック → `/settings` にリダイレクト → 組織作成が必要 → ガイダンスなし

**7. `confirm()` ネイティブダイアログがデザインを壊す**
- TeamSettings L166: ブラウザネイティブダイアログを使用
- `AlertDialog` (shadcn/ui) に置き換えるべき

### CLI DX 評価

| 観点 | 評価 |
|------|------|
| コマンド体系 | 7/10 — 直感的な分類 |
| エラーメッセージ | 8/10 — 「Run `orbit login` first」等のアクション提示が秀逸 |
| プログレス表示 | 7/10 — ora スピナーは良いが、大規模プロジェクトで進捗段階が不明 |
| 出力品質 | 6/10 — 大規模プロジェクトで出力がスクロール超え。`--quiet`/`--verbose` 未対応 |
| 初回体験 | 5/10 — scan -g 後に何をすべきか不明。ドキュメントへの誘導不足 |

### 良い点
- PricingGate のブラー + ロック UI パターンは有料機能の訴求として優秀
- マルチターゲットレンダリングの ContextIR 設計は拡張性が高い
- watch モードのインクリメンタルスキャン + デバウンスは思慮深い DX
- CLI のカスタムエラークラス (`AuthError`, `ProjectError`) はテキストブック通りの良い DX
- i18n 基盤は堅実（600+ キー、next-intl 統合）

---

## 5. エンジニアリングマネジメント審査（5.5/10）

### 技術的負債ランキング（深刻度順）

| # | 負債 | 放置リスク | 修正工数 | 対応時期 |
|---|------|----------|---------|---------|
| 1 | **CI/CD パイプラインの不在** | 壊れたコードが本番・npm に到達 | 2-3h | 即日 |
| 2 | **Rate Limiter 無効** | 全 API が無防備、abuse でコスト爆発 | 1-2h | ユーザー獲得前 |
| 3 | **Monitoring 消失** | 障害時にデータなし | 1h | 即日 |
| 4 | **テスト不足** (46/~135ファイル) | リファクタリング不能、リグレッション地雷原 | 8-12h | ローンチ前 |
| 5 | **型安全性の穴** (29箇所の `any`) | ランタイム TypeError | 3-4h | ローンチ前 |
| 6 | **認可ロジック不統一** | Team 機能が壊れる | 1h | Team 提供前 |
| 7 | **DB インデックス不足** | 100+ ユーザーで遅延 | 1h | 100ユーザー前 |
| 8 | **MCP Server 二重実装** | 片方に修正忘れ | 2h | 次メジャーリリース |
| 9 | **i18n 不完全** | 国際展開で全面作業 | 2-3h | 英語圏展開時 |
| 10 | **エラーハンドリング甘い** | 障害時のデバッグ不能 | 3-4h | 段階的 |

### スケーラビリティ評価

| ユーザー数 | ボトルネック | 必要な対応 |
|-----------|------------|-----------|
| ~10 | なし | Rate limiter 修正のみ |
| ~100 | DB クエリ性能、Cold Start | インデックス追加、scan_data ページネーション |
| ~1,000 | Neon 接続数上限、Webhook スループット | Vercel Pro, 非同期 Webhook (Inngest/QStash) |
| ~10,000 | アーキテクチャ限界 | Background Job Queue, CDN, Read Replica, APM |

### CI/CD 改善計画

```yaml
# 理想構成
# .github/workflows/ci.yml (PR ごとに実行)
jobs:
  lint-and-typecheck:
    - pnpm lint
    - pnpm tsc --noEmit
    - pnpm --filter @orbit-cli/core tsc --noEmit
  test:
    - pnpm test
    - pnpm --filter @orbit-cli/core test
  build:
    - pnpm build
    - pnpm --filter @orbit-cli/core build
    - pnpm --filter @orbit-cli/mcp build

# cli-publish.yml / mcp-publish.yml にテスト追加
# + Dependabot, CodeQL, Preview Deployments
```

### テスト優先度

| 優先度 | 対象 | 理由 | 推定テスト数 |
|--------|------|------|------------|
| S | Stripe Webhook ハンドラ | 課金の心臓部 | 12-15 |
| S | 認可ロジック (project-access, auth-helpers) | セキュリティ根幹 | 10-12 |
| A | ContextIR ビルダー | コア価値 | 8-10 |
| A | Renderers | 出力品質=UX | 8-12 |
| B | CLI コマンド E2E | ユーザー体験 | 15-20 |
| B | API Routes 統合テスト | 全エンドポイント | 20-30 |

### 引き継ぎ可能性: 中程度（2-3日で生産性発揮可能）

**良い**: CLAUDE.md 自動生成、直感的ファイル命名、Drizzle schema 一元化、monorepo 分離明確
**問題**: コード内コメント最小限、API ドキュメント皆無、Server Actions vs API Routes の使い分け基準不明

### 良い点
- detector.ts の並列スキャン設計が秀逸
- Stripe 統合がベストプラクティス準拠
- `verifyProjectAccess` の関心分離が正しい
- ContextIR による正規化はコンパイラ理論の正しい適用
- monorepo の分割が教科書的に適切

---

## アクションプラン

### Phase 0: 今すぐ（1-2日）— セキュリティ修正

- [ ] **Stripe checkout/portal に org membership 検証追加** (C-1, C-2)
- [ ] **`syncOrgSeatCount` に認証/認可追加** (C-3)
- [ ] **`bulk-create` を `verifyProjectAccess` に統一** (C-4)
- [ ] **`requirePlan()` を `getEffectivePlan()` に修正** (C-6)
- [ ] **`origin` ヘッダー使用を `BETTER_AUTH_URL` に修正** (H-6)

### Phase 1: 今週中 — 基盤修正

- [ ] **Rate limiter を Upstash Redis に移行** (C-5)
- [ ] **CI workflow 作成**: PR 毎に lint + typecheck + test + build (H-2)
- [ ] **Monitoring を `waitUntil()` に修正** (M-1)
- [ ] **入力バリデーション (Zod) 導入**: 全 API Route + Server Action (H-1)
- [ ] **セキュリティヘッダー追加** (H-5)
- [ ] **Settings のゴースト機能削除**: Board/Gantt (UX-3)

### Phase 2: 2週間以内 — 収益化構造修正

- [ ] **CLI 機能のゲート設計**: Focus/Issues/Watch を Pro 限定 or 月 N 回制限
- [ ] **DB インデックス追加** (H-3)
- [ ] **Webhook + 認可のテスト追加** (優先度 S)
- [ ] **Landing Page 改修**: CTA 修正 + i18n 化
- [ ] **Team checkout フロー改善**: インライン組織作成
- [ ] **`.cursorrules` → `.cursor/rules/*.mdc` 対応**

### Phase 3: 1ヶ月以内 — 差別化再構築

- [ ] **ポジショニング転換**: 「コンテキスト生成」→「タスク駆動 AI ワークフロー」
- [ ] **`orbit plan <task-id>`**: タスクから AI 実装計画生成
- [ ] **ContextIR + Renderers のテスト追加** (優先度 A)
- [ ] **Tree-sitter 対応検討**: regex → AST ベースの解析
- [ ] **Pricing 改定**: Free 制限強化 + Pro $12 + Team $15

---

## 収益化ネック分析

### $1,000 MRR 到達の最大ネック

```
[ネック 1] CLI 全機能無料
  ↓ ユーザーは Web UI に来ない
[ネック 2] LP が「無料 OSS」を強調
  ↓ 来ても課金動機なし
[ネック 3] Pro の独自価値が薄い
  ↓ 課金しても解約
[ネック 4] 差別化が 3-6 ヶ月で消滅
  ↓ 市場から退場

解決順序: ネック 1 → 3 → 2 → 4
```

### 現実的な収益化ロードマップ

| 期間 | 目標 | 施策 |
|------|------|------|
| 1ヶ月目 | 100 WAU (Weekly Active Users) | npm DL 促進、HN/PH 投稿、CLI 体験最適化 |
| 2ヶ月目 | 50 Web UI 登録 | CLI→Web 導線強化、Pro 機能の可視化 |
| 3ヶ月目 | 10 Pro 転換 ($90 MRR) | Free→Pro ゲート最適化、キラーフィーチャー追加 |
| 6ヶ月目 | 50 Pro + 2 Team ($594 MRR) | チーム機能訴求、コンテンツマーケティング |
| 9ヶ月目 | 80 Pro + 5 Team ($945 MRR) | Product-led Growth、口コミ |
| 12ヶ月目 | $1,000+ MRR | 安定成長 |

> **前提条件**: CLI の機能制限を導入し、Pro のキラーフィーチャーを最低2つ新設すること。現在の構造のままでは到達不能。

---

## 参考ソース

- [Repomix GitHub](https://github.com/yamadashy/repomix) — 22,000+ Stars
- [Repomix MCP Server](https://repomix.com/guide/mcp-server) — Top 10 MCP Servers
- [Claude Code /init](https://code.claude.com/docs/en/overview) — CLAUDE.md 自動生成
- [Cursor Rules Documentation](https://docs.cursor.com/context/rules) — .cursor/rules/*.mdc 形式
- [Greptile $180M Valuation](https://techcrunch.com/2025/07/18/benchmark-in-talks-to-lead-series-a-for-greptile/)
- [Greptile $25M Funding](https://siliconangle.com/2025/09/23/greptile-bags-25m-funding/)
- [Potpie AI $2.2M Raise](https://techfundingnews.com/the-startup-building-a-knowledge-graph-for-code/)
- [MCP Ecosystem — Anthropic](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation)
- [AI Developer Tools Market](https://virtuemarketresearch.com/report/ai-developer-tools-market)
