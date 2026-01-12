Orbit 要件定義書 (Ver 1.1)
1. プロジェクト概要
アプリ名: Orbit (オービット)

コンセプト: AI駆動開発における「タスクの蒸発」を防ぐ、IDE連携型タスク管理ツール。

開発の背景:

AI搭載IDE（Google Antigravity, Cursor等）は強力だが、会話が長引くと当初の計画（ステップ）を忘れる「コンテキストウィンドウの限界」がある。

既存ツール（Jira/Redmine）は手動入力が手間であり、開発フロー（IDE）から分断されている。

コアバリュー:

IDEの「外部記憶」: IDE上のAIが決めた実装プランを、即座に永続的なタスクとして保存する。

No Friction (摩擦ゼロ): 開発の手を止めずにタスク管理ができるAPIファースト設計。

2. システムアーキテクチャ（連携フロー）
Orbit側で推論するのではなく、IDE側のAIを「司令塔」とし、Orbitを「データベース」として扱う構成にします。

Plan (IDE内): ユーザーとAIが会話して実装プラン（例：3つのステップ）を決定。

Action (IDE -> Orbit): IDE側のAIがTool Use機能等を使い、決定したプランをJSON形式でOrbit APIに送信。

Store (Orbit): Orbitは受け取ったデータをそのままDBに格納し、WBS（階層構造）を生成。

3. 機能要件
(1) API連携機能（最重要）
外部（IDE/スクリプト）からタスクを操作するためのREST APIを提供します。

エンドポイント: POST /api/tasks/bulk-create

入力: 親子関係を含むJSONデータ（Project ID, Task List, Description）。

処理: 既存のプロジェクトに紐づけてタスクを一括登録する。

レスポンス: 生成されたタスクのURLなどを返し、IDE側でリンクを表示できるようにする。

(2) タスク管理・表示機能
階層管理 (WBS):

Project > Epic (大きな機能) > Task (作業) > Subtask (詳細作業) のような階層構造をサポート。

ビュー切り替え:

List View (WBS): 階層構造で全体を把握する。Redmineライク。

Board View (Kanban): ToDo In Progress Done のステータス管理。ドラッグ＆ドロップ対応。

Gantt Chart: スケジュールと依存関係の可視化。

仕様: ドラッグ操作で期間変更可能。簡易的な依存線（Aが終わったらB）の描画。

(3) ドキュメント・詳細機能
Context Log:

タスク生成元となった「IDEでの会話ログ」や「プロンプト」を保存する専用フィールド。

「なぜこのタスクが生まれたか」を後から追跡可能にする。

Markdownエディタ:

詳細欄はMarkdown対応。コードブロックやチェックリストを表示。

4. 非機能要件
UI/UX:

Developer First: ダークモード標準搭載。キーボードショートカット対応。

Speed: Next.js App Routerによる高速なページ遷移。

認証:

個人用だが、Web公開（Vercel）を想定し、管理者（自分）のみがアクセスできる認証を導入（Supabase Auth / Google Login）。

5. 技術スタック
Frontend: Next.js (App Router / TypeScript)

UI Components: Shadcn/ui (Tailwind CSS)

State/DND: dnd-kit (カンバン/ガントチャート操作用)

Backend: Next.js Server Actions / API Routes

Database: Supabase (PostgreSQL)

Hosting: Vercel



6. データモデル方針（概略）
後のER図作成に向けた基本方針です。
エンティティ	役割	備考
Projects	プロジェクト単位	「Orbit開発」「別アプリ開発」など
Tasks	タスク本体	parent_id で自己参照し階層を作る。
			source_type (Manual/AI) で作成元を区別。
Contexts	生成元の文脈	IDEから送られてきた「会話の要約」や「元のプロンプト」を格納。
			Tasksと1対多で紐づく。
TaskRelations	依存関係	ガントチャート用。predecessor_id (先行タスク) を持つ。
