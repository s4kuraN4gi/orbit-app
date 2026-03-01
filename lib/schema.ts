import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  unique,
  boolean,
  index,
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
  activeOrganizationId: text('active_organization_id'),
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
// Better Auth organization plugin tables
// --------------------------------------------------------

export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  metadata: text('metadata'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at'),
});

export const member = pgTable('member', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('member'),
  createdAt: timestamp('created_at').notNull(),
}, (t) => [
  index('member_user_id_idx').on(t.userId),
  index('member_organization_id_idx').on(t.organizationId),
]);

export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull(),
  status: text('status').notNull().default('pending'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
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
  organizationId: text('organization_id').references(() => organization.id, {
    onDelete: 'set null',
  }),
  localPath: text('local_path'),
  scanData: jsonb('scan_data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('projects_owner_id_idx').on(t.ownerId),
  index('projects_organization_id_idx').on(t.organizationId),
]);

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Drizzle self-reference requires any
  parentId: uuid('parent_id').references((): any => tasks.id, { onDelete: 'set null' }),
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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('tasks_project_id_idx').on(t.projectId),
  index('tasks_parent_id_idx').on(t.parentId),
]);

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
  plan: text('plan').default('free'),
  customColors: jsonb('custom_colors'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const scanSnapshots = pgTable('scan_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  scanData: jsonb('scan_data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => [
  index('scan_snapshots_project_id_idx').on(t.projectId),
]);

// --------------------------------------------------------
// Stripe billing tables
// --------------------------------------------------------

export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  plan: text('plan').notNull().default('free'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  status: text('status').notNull().default('active'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const orgSubscriptions = pgTable('org_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: 'cascade' }),
  plan: text('plan').notNull().default('team'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  stripePriceId: text('stripe_price_id'),
  quantity: integer('quantity').notNull().default(1),
  status: text('status').notNull().default('active'),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const usage = pgTable(
  'usage',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    feature: text('feature').notNull(),
    month: text('month').notNull(), // "2026-02" format
    count: integer('count').notNull().default(0),
  },
  (t) => [unique('usage_user_feature_month').on(t.userId, t.feature, t.month)]
);

export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey(), // Stripe event.id for idempotency
  type: text('type').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow(),
});
