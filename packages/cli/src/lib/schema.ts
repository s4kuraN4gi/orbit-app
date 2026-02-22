import { pgTable, uuid, text, timestamp, integer } from 'drizzle-orm/pg-core';

// Minimal schema for CLI usage (subset of the full web app schema)

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
});

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  key: text('key').notNull(),
  ownerId: text('owner_id').notNull(),
  localPath: text('local_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull(),
  parentId: uuid('parent_id'),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'),
  priority: text('priority').notNull().default('medium'),
  startDate: timestamp('start_date', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  position: integer('position').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
