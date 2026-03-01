import { z } from 'zod';

// 共通
export const idSchema = z.string().uuid();
export const projectIdSchema = z.string().min(1).max(100);

// Stripe checkout
export const checkoutSchema = z.object({
  plan: z.enum(['free', 'pro', 'team']),
  organizationId: z.string().optional(),
});

// Stripe portal
export const portalSchema = z.object({
  organizationId: z.string().optional(),
});

// Task bulk-create
export const taskSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    title: z.string().min(1).max(500),
    description: z.string().max(5000).optional(),
    status: z.enum(['todo', 'in_progress', 'done']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    start_date: z.string().optional(),
    due_date: z.string().optional(),
    children: z.array(taskSchema).optional(),
  })
);

export const bulkCreateSchema = z.object({
  project_id: z.string().min(1),
  source_tool: z.enum(['Antigravity', 'Cursor', 'Manual']).optional().default('Manual'),
  original_prompt: z.string().max(10000).optional().default(''),
  tasks: z.array(taskSchema).min(1).max(200),
});

// CLI tasks
export const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  start_date: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
});

// CLI project patch
export const patchProjectSchema = z.object({
  local_path: z.string().max(1000).optional(),
});

// Settings
export const userSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  default_view: z.enum(['list']).optional(),
  language: z.enum(['ja', 'en']).optional(),
  custom_colors: z.record(z.string(), z.string().regex(/^#[0-9a-fA-F]{3,8}$/, 'Invalid color code')).nullable().optional(),
});

// Project creation
export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  key: z.string().min(1).max(20).optional(),
  organizationId: z.string().optional(),
});

// Idea
export const createIdeaSchema = z.object({
  content: z.string().min(1).max(5000),
});
