'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function logout() {
  const headersList = await headers();
  await auth.api.signOut({ headers: headersList });
  revalidatePath('/', 'layout');
  redirect('/login');
}
