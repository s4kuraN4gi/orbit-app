export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";
export type PlanTier = 'free' | 'pro' | 'team';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete';
export type OrgRole = 'owner' | 'admin' | 'member';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
  createdAt: string;
}

export interface OrgMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgRole;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
  createdAt: string;
}

export interface PlanLimits {
  tier: PlanTier;
  maxProjects: number;
  maxTasksPerProject: number;
  maxContextHistory: number;
  maxImportsPerMonth: number;
  exportFormats: ('markdown' | 'json' | 'custom')[];
  contextDiff: boolean;
}

export interface ScanDependency {
  category: string;
  packages: string[];
}

export interface ScanApiRoute {
  method: string;
  path: string;
}

export interface ScanDbTable {
  name: string;
  columns: number;
}

export interface ScanData {
  techStack?: string[];
  packageManager?: string;
  nodeVersion?: string;
  dependencies?: ScanDependency[];
  depCount?: { total: number };
  structure?: {
    pages?: string[];
    apiRoutes?: ScanApiRoute[];
    dbTables?: ScanDbTable[];
  };
  codeMetrics?: { totalFiles?: number; totalLines?: number };
  exports?: unknown[];
  importGraph?: unknown[];
  envVars?: string[];
  git?: { branch?: string; totalCommits?: number; lastCommitDate?: string };
  deployment?: { platform?: string; ci?: string };
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

export interface ScanSnapshot {
  id: string;
  project_id: string;
  scan_data: ScanData;
  created_at: string;
}

export interface User {
  id: string; // UUID
  email: string;
}

export interface Project {
  id: string;
  name: string;
  key: string; // "ORB" etc.
  owner_id: string;
  organization_id?: string | null;
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
  completed_at?: string | null; // ISO Date string

  // Frontend display properties
  ai_context?: AIContext;
  depth?: number; // Indent depth
  children?: Task[]; // Nested subtasks for hierarchical display
}
