import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  unique,
  boolean,
} from 'drizzle-orm/pg-core';

// --------------------------------------------------------
// Better Auth managed tables
// --------------------------------------------------------

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

// --------------------------------------------------------
// App tables
// --------------------------------------------------------

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  key: text('key').notNull(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  localPath: text('local_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const aiContexts = pgTable('ai_contexts', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  sourceTool: text('source_tool').notNull(),
  originalPrompt: text('original_prompt'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'),
  aiContextId: uuid('ai_context_id').references(() => aiContexts.id, {
    onDelete: 'set null',
  }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status').notNull().default('todo'),
  priority: text('priority').notNull().default('medium'),
  startDate: timestamp('start_date', { withTimezone: true }),
  dueDate: timestamp('due_date', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  position: integer('position').default(0),
  boardOrder: integer('board_order'),
  recurrenceType: text('recurrence_type'),
  recurrenceInterval: integer('recurrence_interval').default(1),
  recurrenceDays: text('recurrence_days').array(),
  recurrenceEndDate: timestamp('recurrence_end_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const taskDependencies = pgTable(
  'task_dependencies',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    predecessorId: uuid('predecessor_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    successorId: uuid('successor_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    dependencyType: text('dependency_type'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.predecessorId, table.successorId)]
);

export const taskTemplates = pgTable('task_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  title: text('title').notNull(),
  description: text('description').default(''),
  priority: text('priority').default('medium'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const labels = pgTable('labels', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6366f1'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const taskLabels = pgTable(
  'task_labels',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    labelId: uuid('label_id')
      .notNull()
      .references(() => labels.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [unique().on(table.taskId, table.labelId)]
);

export const taskComments = pgTable('task_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id')
    .notNull()
    .references(() => tasks.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const ideas = pgTable('ideas', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  notes: text('notes'),
  convertedTaskId: uuid('converted_task_id').references(() => tasks.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const userSettings = pgTable('user_settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  theme: text('theme').default('system'),
  defaultView: text('default_view').default('list'),
  language: text('language').default('ja'),
  customColors: jsonb('custom_colors'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
