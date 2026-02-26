'use server';

import { updateOrgSeatCount } from '@/lib/subscription';

export async function syncOrgSeatCount(organizationId: string) {
  await updateOrgSeatCount(organizationId);
}
