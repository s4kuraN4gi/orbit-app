# ユーザー獲得戦略（2026-03-17）

Growth Marketer + OSS Developer Advocate の2名による分析。

---

## 現状の厳しい数字

- GitHub Stars: 0
- npm 月間 DL: 213（ほぼ自己インストール）
- 実ユーザー: 0
- 競合 Repomix: 22,473 stars / 258,706 DL/月

---

## 致命的な問題（今すぐ修正）

### 1. ルート README が Next.js テンプレのまま（CRITICAL）
GitHub を訪問した人が最初に見るのがこれ。即離脱する。

### 2. LICENSE ファイルが存在しない（CRITICAL）
package.json で MIT と主張しているが、実ファイルなし。法的リスク＋信頼喪失。

### 3. デモ GIF が空白（HIGH）
現在の demo.gif は空のターミナルのみ。ビジュアルが最重要なのに無駄になっている。

### 4. バッジなし（HIGH）
npm version、downloads、license バッジがゼロ。品質シグナルが不足。

### 5. CONTRIBUTING.md / Issue Template なし（MEDIUM）
コミュニティ貢献を受け入れる準備ができていない。

---

## ランチ前チェックリスト（全てクリアしてから公開活動開始）

- [ ] ルート README を製品 README に置き換え
- [ ] LICENSE ファイル作成（MIT）
- [ ] デモ GIF 再録画（実際の scan 出力を見せる、15秒以内）
- [ ] CLI README にバッジ追加（npm version, downloads, license, Node.js）
- [ ] package.json の keywords 拡充 + author/bugs/funding 追加
- [ ] CONTRIBUTING.md 作成
- [ ] GitHub Issue Template 作成（bug_report.yml, feature_request.yml）
- [ ] CLI README に Example Output セクション追加
- [ ] GitHub repo description + topics 設定
- [ ] Pricing テーブル更新（全て無料に）
- [ ] npx @orbit-cli/core scan -g が Next.js / Vite / Python / Go で問題なく動作確認
- [ ] /examples ディレクトリに実プロジェクトの scan 出力を2-3個格納

---

## 90日アクションプラン

### Phase 0: 基盤整備（Week 1 — 3/17-23）

月-水:
- ルート README 修正、GitHub description + topics 設定
- Pricing テーブル更新（全て無料）
- デモ GIF 再録画
- CONTRIBUTING.md + Issue Template 作成

木-金:
- 比較用リポジトリ作成: 有名 OSS プロジェクトに Repomix と Orbit 両方を実行、出力を /examples に保存
- エレベーターピッチ文を用意（英語 + 日本語）

週末:
- ランディングページ整備（orbit-cli.dev などの独自ドメイン推奨 ~$12/年）

### Phase 1: コンテンツ種まき（Week 2-4 — 3/24 - 4/13）

Week 2（英語コンテンツ）:
- 月: dev.to 記事 #1「Why your AI coding assistant writes bad code — and how to fix it」
- 水: dev.to 記事 #2「I scanned 5 popular OSS projects with Orbit」
- 金: X スレッド（Orbit vs Repomix の出力比較）
- 毎日: r/ClaudeAI, r/cursor で質問に回答（10:1 ルール: 10回の純粋な回答に対し1回だけ Orbit に言及）

Week 3（日本語コンテンツ）:
- 月: Zenn 記事 #3「Claude Code / Cursor のコンテキスト生成を自動化する CLI を作った」
- 水: Zenn 記事 #4「CLAUDE.md を手書きするのをやめた話」
- 金: X 日本語スレッド

Week 4（比較 + SEO）:
- 月: dev.to 記事 #5「Repomix vs Orbit: code dump vs structured context」
- 水: README に Repomix vs Orbit セクション追加
- 金: awesome-claude / awesome-cursor リストに PR 提出

### Phase 2: ローンチ（Week 5-6 — 4/14-27）

Week 5:
- 月: Hacker News「Show HN: Orbit — AI context engine that maps your codebase structure for LLMs」
  - 投稿時間: 月 or 火の US Eastern 7-8 AM
  - 3時間以上オンラインで全コメントに返信
  - 「Repomix との違いは？」への回答を事前に準備
- 火: r/ClaudeAI に投稿
- 水: r/cursor に投稿
- 木: Discord サーバーでシェア

Week 6:
- 火: Product Hunt ローンチ（火曜が最もエンゲージメント高い）
  - スクリーンショット 3-5枚 + デモ GIF + 1分ウォークスルー動画
- 残り: 全プラットフォームのコメントに返信、フィードバックを48時間以内に反映

### Phase 3: 持続的成長（Week 7-12 — 4/28 - 6/14）

- 毎週月: コンテンツ1本（dev.to / Zenn 交互）
- 毎週水: X スレッド or 短いデモ動画
- 毎週金: コミュニティで3-5スレッドに回答
- 隔週: マイナーバージョンリリース + アナウンス
- 毎月: 「building in public」振り返り（数字公開）

---

## コンテンツ戦略

### ブログ記事 5本

1. (dev.to) 「Why your AI coding assistant writes bad code — and how to fix it with structured context」
   - フック: コード全量を AI に渡すと存在しない import をハルシネーションする問題
   - Orbit の構造化出力 vs コードダンプの比較

2. (dev.to) 「I scanned 5 popular OSS projects with Orbit — here's what AI context looks like」
   - t3-app, shadcn/ui, cal.com 等の実出力を見せる

3. (Zenn) 「Claude Code / Cursor のコンテキスト生成を自動化する CLI を作った」
   - 技術的な深掘り（Zenn コミュニティが好む形式）

4. (Zenn) 「CLAUDE.md を手書きするのをやめた話 — Orbit で構造化コンテキストを自動生成する」
   - チュートリアル形式、ステップバイステップ

5. (dev.to) 「Repomix vs Orbit: code dump vs structured context — which helps AI write better code?」
   - 公平な比較。SEO で「repomix alternative」を狙う

### 差別化の3つの角度

1. 「構造化コンテキスト vs コードダンプ」— AI に辞書を渡すのではなくアウトラインを渡す
2. 「トークン効率」— 同じプロジェクトで Orbit 出力 vs Repomix 出力のトークン数を比較
3. 「マルチツール対応」— 1回の scan で Claude/Cursor/Copilot/Windsurf 全てに対応

### SNS 投稿スケジュール

X/Twitter（週3回）:
- 月: 技術的なインサイト or Tips
- 水: デモ or スクリーンショット
- 金: エンゲージメント投稿（質問、投票、AI 開発の話題への返信）

---

## ターゲットコミュニティ

### Reddit
- r/ClaudeAI（177K メンバー）— 最優先ターゲット
- r/cursor — Cursor パワーユーザー
- r/ChatGPTCoding — より広い層
- r/webdev — 自己宣伝厳禁、純粋に役立つコンテンツのみ

### Discord
- Cursor Discord（公式）— #showcase / #tools チャンネル
- Vercel Discord — Next.js 開発者が自然なターゲット

### その他
- Hacker News — AI/dev-tools スレッドに継続参加
- awesome-claude / awesome-cursor リストに PR

---

## マイルストーン予測

### 30日後（4/17）
- 楽観: 30-50 stars, 500-1K DL/月
- 現実: 10-20 stars, 300-500 DL/月
- 悲観: 5 stars（友人のみ）

成功の指標: 見知らぬ人が GitHub Issue を開く or 質問する

### 60日後（5/17）
- 楽観: 100-200 stars, 2K-5K DL/月
- 現実: 40-80 stars, 1K-2K DL/月
- 悲観: 15-30 stars

成功の指標: リピートユーザーの存在。誰かが頼まれずに Orbit について書く

### 90日後（6/17）
- 楽観: 300-500 stars, 5K-10K DL/月（HN フロントページ到達時）
- 現実: 80-150 stars, 2K-4K DL/月
- 悲観: 30-50 stars

500 stars は HN バイラルなしでは困難。コンテンツだけでは 50-150 stars が現実的

---

## 撤退判断ポイント

### 30日後 — stars < 10 かつ実ユーザーゼロの場合
→ ポジショニングか PMF の問題。5-10人に直接ヒアリング

### 60日後 — stars < 30 かつリピートユーザーなしの場合
→ 問題の深さが不十分。ポジショニング変更を検討（「プロジェクト文書化」「チーム新規参入支援」等）

### 90日後 — stars < 50 の場合
→ スタンドアロンツールとしての需要がない可能性。選択肢:
- Repomix にプラグイン/PR として貢献
- VS Code 拡張にピボット
- orbit impact（影響範囲分析）特化にピボット

---

## 重要な気づき

1. MCP サーバー機能がスリーパーヒットの可能性あり。Repomix にない差別化ポイント。Claude 向けコミュニティでリードすべき
2. Repomix は敵ではなく最大のマーケティングチャネル。「repomix alternative」検索を狙う
3. 日本語 Dev コミュニティ（Zenn / X）は AI dev tools コンテンツが不足。Zenn でのヒットは GitHub トラフィックに直結
4. HN Show HN 投稿が最高 ROI のアクション。全ての Phase 0-1 はこの一瞬のための準備
