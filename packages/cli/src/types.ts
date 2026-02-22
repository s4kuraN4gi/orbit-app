export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface User {
  id: string;
  email: string;
}

export interface Project {
  id: string;
  name: string;
  key: string;
  owner_id: string;
  local_path?: string | null;
  created_at?: string;
}

export interface Task {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string | null;
  due_date: string | null;
  created_at: string;
  position?: number;
  completed_at?: string | null;
}

/** Stored in ~/.orbit/config.json */
export interface OrbitConfig {
  orbit_url: string;
  database_url: string;
}

/** Stored in ~/.orbit/session.json */
export interface OrbitSession {
  token: string;
  user: User;
}

/** Stored in .orbit.json (project root) */
export interface OrbitProjectLink {
  project_id: string;
  project_name: string;
  project_key: string;
}
