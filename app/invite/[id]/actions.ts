'use server';

import { updateOrgSeatCount } from '@/lib/subscription';
import { requireUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { member } from '@/lib/schema';
import { and, eq } from 'drizzle-orm';

export async function syncOrgSeatCount(organizationId: string) {
  const user = await requireUser();
  const [m] = await db
    .select({ id: member.id })
    .from(member)
    .where(and(
      eq(member.organizationId, organizationId),
      eq(member.userId, user.id)
    ));
  if (!m) throw new Error('Forbidden');
  await updateOrgSeatCount(organizationId);
}
