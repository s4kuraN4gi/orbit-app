-- ============================================================
-- Orbit: Initial Schema
-- 全テーブル + RLS + インデックスを一括作成
-- ============================================================

-- --------------------------------------------------------
-- 1. projects
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  key text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  local_path text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects" ON projects
  FOR ALL USING (auth.uid() = owner_id);

-- --------------------------------------------------------
-- 2. ai_contexts
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  source_tool text NOT NULL,
  original_prompt text,
  raw_data jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage ai_contexts in own projects" ON ai_contexts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = ai_contexts.project_id AND p.owner_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- 3. tasks
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  parent_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  ai_context_id uuid REFERENCES ai_contexts(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo',
  priority text NOT NULL DEFAULT 'medium',
  start_date timestamptz,
  due_date timestamptz,
  completed_at timestamptz,
  position integer DEFAULT 0,
  board_order integer,
  recurrence_type text,
  recurrence_interval integer DEFAULT 1,
  recurrence_days text[],
  recurrence_end_date timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);
CREATE INDEX idx_tasks_status ON tasks(status);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage tasks in own projects" ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = tasks.project_id AND p.owner_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- 4. task_dependencies
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_dependencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  predecessor_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  successor_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  dependency_type text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(predecessor_id, successor_id)
);

ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage dependencies in own projects" ON task_dependencies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = task_dependencies.project_id AND p.owner_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- 5. task_templates
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  priority text DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage templates in own projects" ON task_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = task_templates.project_id AND p.owner_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- 6. labels + task_labels
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_labels_project_id ON labels(project_id);

ALTER TABLE labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view labels in their projects" ON labels
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = labels.project_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "Users can create labels in their projects" ON labels
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = labels.project_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "Users can update labels in their projects" ON labels
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = labels.project_id AND p.owner_id = auth.uid())
  );
CREATE POLICY "Users can delete labels in their projects" ON labels
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM projects p WHERE p.id = labels.project_id AND p.owner_id = auth.uid())
  );

CREATE TABLE IF NOT EXISTS task_labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  label_id uuid REFERENCES labels(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(task_id, label_id)
);

CREATE INDEX idx_task_labels_task_id ON task_labels(task_id);
CREATE INDEX idx_task_labels_label_id ON task_labels(label_id);

ALTER TABLE task_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view task_labels in their projects" ON task_labels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t JOIN projects p ON t.project_id = p.id
      WHERE t.id = task_labels.task_id AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY "Users can add labels to tasks in their projects" ON task_labels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tasks t JOIN projects p ON t.project_id = p.id
      WHERE t.id = task_labels.task_id AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY "Users can remove labels from tasks in their projects" ON task_labels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tasks t JOIN projects p ON t.project_id = p.id
      WHERE t.id = task_labels.task_id AND p.owner_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- 7. task_comments
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX idx_task_comments_user_id ON task_comments(user_id);

ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view comments on their project tasks" ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t JOIN projects p ON t.project_id = p.id
      WHERE t.id = task_comments.task_id AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY "Users can add comments to their project tasks" ON task_comments
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND EXISTS (
      SELECT 1 FROM tasks t JOIN projects p ON t.project_id = p.id
      WHERE t.id = task_comments.task_id AND p.owner_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own comments" ON task_comments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON task_comments
  FOR DELETE USING (auth.uid() = user_id);

-- --------------------------------------------------------
-- 8. ideas
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  notes text,
  converted_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage ideas in own projects" ON ideas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = ideas.project_id AND p.owner_id = auth.uid()
    )
  );

-- --------------------------------------------------------
-- 9. user_settings
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  theme text DEFAULT 'system',
  default_view text DEFAULT 'list',
  language text DEFAULT 'ja',
  custom_colors jsonb DEFAULT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);
