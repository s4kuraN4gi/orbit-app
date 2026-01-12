2. データ構造・型定義書 (Class Diagram Alternative)
Javaなどで言う「クラス図」に相当する部分です。Next.js + TypeScriptで実装する際の「型（Interface）」の設計です。


// --- Domain Models (Entities) ---

// ユーザー (Supabase Authと連携)
interface User {
  id: string; // UUID
  email: string;
}

// プロジェクト
interface Project {
  id: string;
  name: string;
  key: string; // "ORB" etc.
  owner_id: string;
}

// AIコンテキスト (生成元の記憶)
interface AIContext {
  id: string;
  source_tool: 'Cursor' | 'Antigravity' | 'Manual';
  original_prompt: string;
  created_at: Date;
}

// タスク (最重要)
interface Task {
  id: string;
  project_id: string;
  parent_id: string | null; // 親タスク
  ai_context_id: string | null;
  
  title: string;
  description: string; // Markdown
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  
  start_date: string | null; // ISO Date string
  due_date: string | null;
  
  // フロントエンド表示用 (DBにはないが計算して持つ値)
  depth?: number; // インデントの深さ (WBS表示用)
  children?: Task[]; // 子タスクの配列
}


