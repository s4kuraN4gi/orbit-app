1. ER図 (全体像)
まずはテーブル同士の関係性を可視化しました。

erDiagram
    PROJECTS ||--o{ TASKS : "contains"
    PROJECTS ||--o{ AI_CONTEXTS : "logs"
    
    AI_CONTEXTS ||--o{ TASKS : "generated"
    
    TASKS ||--o{ TASKS : "parent/child (WBS)"
    TASKS ||--o{ TASK_RELATIONS : "predecessor"
    TASKS ||--o{ TASK_RELATIONS : "successor"

    PROJECTS {
        uuid id PK
        string name
        string key "例: ORB"
        uuid owner_id "Supabase Auth ID"
    }

    AI_CONTEXTS {
        uuid id PK
        uuid project_id FK
        string source_tool "Cursor, Antigravity etc"
        text original_prompt "AIへの指示内容"
        jsonb raw_data "受信した生JSON"
        timestamp created_at
    }

    TASKS {
        uuid id PK
        uuid project_id FK
        uuid parent_id FK "親タスク"
        uuid ai_context_id FK "生成元の文脈"
        string title
        text description "Markdown"
        enum status "todo, in_progress, done"
        enum priority "low, medium, high"
        date start_date
        date due_date
        float board_order "カンバン並び順"
    }

    TASK_RELATIONS {
        uuid id PK
        uuid predecessor_id FK "先行タスク"
        uuid successor_id FK "後続タスク"
        string type "finish_to_start"
    }


2. テーブル詳細解説
Orbitのコア機能を実現するための重要なポイントを解説します。

A. ai_contexts (AIの外部記憶テーブル)
ここがOrbitの心臓部です。タスクそのものではなく**「なぜそのタスクが生まれたか」**という文脈を保存します。

役割: 1回のAIとの会話（Antigravityでの指示など）で、5つのタスクが生成された場合、その5つのタスクはこのテーブルの1つのレコード（ID）を参照します。

メリット: 後でタスクを見た時に、「このタスク、どういう意図で作ったんだっけ？」となっても、このテーブルを辿れば元の会話ログやプロンプトを確認できます。

B. tasks (タスク本体)
JiraとRedmineのハイブリッド構造を支えます。

parent_id: これがあることで、無限に階層（プロジェクト > 機能 > タスク > サブタスク...）を作れます。Redmine的なWBSを実現します。

board_order: カンバンボード（Jira風）でカードを並び替えるための数値です。

ai_context_id: 手動で作った場合はNULL、AI経由で作った場合は ai_contexts のIDが入ります。

C. task_relations (依存関係)
ガントチャート用です。

「タスクA（DB設計）が終わらないと、タスクB（API実装）は着手できない」という線を引くために使います。

3. Supabase用 SQLコード (DDL)
これをSupabaseの「SQL Editor」に貼り付けて実行すれば、すぐに開発を始められる状態のコードを用意しました。
-- ENUM定義 (ステータスと優先度)
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

-- 1. プロジェクトテーブル
CREATE TABLE projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL, -- Supabase AuthのユーザーID
  name TEXT NOT NULL,
  key VARCHAR(10) NOT NULL, -- チケット番号のプレフィックス (例: "DEV")
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. AIコンテキスト (会話ログ・履歴)
CREATE TABLE ai_contexts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  source_tool TEXT NOT NULL, -- 'Cursor', 'Antigravity', 'Gemini' など
  original_prompt TEXT, -- ユーザーが入力した指示
  raw_data JSONB, -- AIから送られてきた生のJSONデータ（デバッグ用）
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. タスクテーブル
CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- 親タスク
  ai_context_id UUID REFERENCES ai_contexts(id) ON DELETE SET NULL, -- 生成元
  
  title TEXT NOT NULL,
  description TEXT, -- Markdown形式
  status task_status DEFAULT 'todo',
  priority task_priority DEFAULT 'medium',
  
  start_date DATE,
  due_date DATE,
  board_order FLOAT DEFAULT 0, -- カンバンでの並び順管理用
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. タスク依存関係 (ガントチャート用)
CREATE TABLE task_relations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  predecessor_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- 先行タスク
  successor_id UUID REFERENCES tasks(id) ON DELETE CASCADE, -- 後続タスク
  relation_type TEXT DEFAULT 'finish_to_start',
  UNIQUE(predecessor_id, successor_id) -- 重複登録防止
);

-- RLS (Row Level Security) の有効化 --
-- ※個人利用でも最低限、自分のデータしか見えないように設定
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_contexts ENABLE ROW LEVEL SECURITY;

-- ポリシー例 (認証済みユーザーは自分のプロジェクトのみ操作可能)
-- ※実際のデプロイ時に厳密に設定しますが、まずは全許可に近い形で開発用
CREATE POLICY "Users can manage their own projects" ON projects
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Users can manage tasks of their projects" ON tasks
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE owner_id = auth.uid())
  );


