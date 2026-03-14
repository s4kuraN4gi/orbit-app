'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { userSettings } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { UserSettings, CustomColors } from '@/lib/theme';
import { auth } from '@/lib/auth';
import { requireUser } from '@/lib/auth-helpers';
import { userSettingsSchema } from '@/lib/validations';

function toUserSettings(row: typeof userSettings.$inferSelect): UserSettings {
  return {
    id: row.id,
    user_id: row.userId,
    theme: (row.theme as 'light' | 'dark' | 'system') ?? 'system',
    default_view: (row.defaultView as 'list' | 'overview') ?? 'list',
    language: (row.language as 'ja' | 'en') ?? 'ja',
    custom_colors: row.customColors as CustomColors | null,
    created_at: row.createdAt?.toISOString() ?? '',
    updated_at: row.updatedAt?.toISOString() ?? '',
  };
}

export async function getUserSettings(): Promise<UserSettings | null> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const [existing] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, session.user.id));

  if (existing) return toUserSettings(existing);

  // Create default settings if not exists
  const [newSettings] = await db
    .insert(userSettings)
    .values({
      userId: session.user.id,
      theme: 'system',
      defaultView: 'list',
      language: 'ja',
      customColors: null,
    })
    .returning();

  if (!newSettings) return null;
  return toUserSettings(newSettings);
}

export async function updateUserSettings(
  updates: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<UserSettings | null> {
  const user = await requireUser();

  const validated = userSettingsSchema.parse(updates);

  const setValues: Partial<typeof userSettings.$inferInsert> = { updatedAt: new Date() };
  if (validated.theme !== undefined) setValues.theme = validated.theme;
  if (validated.default_view !== undefined) setValues.defaultView = validated.default_view;
  if (validated.language !== undefined) setValues.language = validated.language;
  if (validated.custom_colors !== undefined) setValues.customColors = validated.custom_colors;

  const [data] = await db
    .update(userSettings)
    .set(setValues)
    .where(eq(userSettings.userId, user.id))
    .returning();

  if (!data) throw new Error('Failed to update settings');

  revalidatePath('/settings');

  return toUserSettings(data);
}

export async function updateCustomColors(customColors: CustomColors): Promise<UserSettings | null> {
  return updateUserSettings({ custom_colors: customColors });
}

export async function resetCustomColors(): Promise<UserSettings | null> {
  return updateUserSettings({ custom_colors: null });
}
