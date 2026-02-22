export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface User {
  id: string; // UUID
  email: string;
}

export interface Project {
  id: string;
  name: string;
  key: string; // "ORB" etc.
  owner_id: string;
  local_path?: string | null; // CLI linked directory path
}

export interface AIContext {
  id: string;
  source_tool: "Cursor" | "Antigravity" | "Manual";
  original_prompt: string;
  created_at: Date;
}

export interface Task {
  id: string;
  project_id: string;
  parent_id: string | null; // Parent task
  ai_context_id: string | null;

  title: string;
  description: string; // Markdown
  status: TaskStatus;
  priority: TaskPriority;

  start_date: string | null; // ISO Date string
  due_date: string | null;
  created_at: string; // ISO Date string
  position?: number; // Sorting order
  
  // Recurrence properties
  recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  recurrence_interval?: number;
  recurrence_days?: string[];
  recurrence_end_date?: string; // ISO Date string
  completed_at?: string | null; // ISO Date string

  // Frontend display properties
  ai_context?: AIContext;
  depth?: number; // Indent depth
  board_order?: number; // Kanban order
  children?: Task[]; // Nested subtasks for hierarchical display
}

export interface TaskDependency {
  id: string;
  project_id: string;
  predecessor_id: string;
  successor_id: string;
  dependency_type: string | null;
}

