'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';

const loginLimiter = rateLimit({ interval: 300_000, maxRequests: 5 }); // 5 attempts per 5 min
const signupLimiter = rateLimit({ interval: 600_000, maxRequests: 3 }); // 3 attempts per 10 min

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success } = await loginLimiter.check(`login:${ip}`);
  if (!success) {
    redirect(`/login?error=${encodeURIComponent('Too many login attempts. Please try again later.')}`);
  }

  try {
    await auth.api.signInEmail({
      body: { email, password },
    });
  } catch {
    redirect(`/login?error=${encodeURIComponent('Invalid email or password')}`);
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success } = await signupLimiter.check(`signup:${ip}`);
  if (!success) {
    redirect(`/login?error=${encodeURIComponent('Too many signup attempts. Please try again later.')}`);
  }

  try {
    await auth.api.signUpEmail({
      body: { email, password, name: email.split('@')[0] },
    });
  } catch {
    redirect(`/login?error=${encodeURIComponent('Sign up failed. Please try again.')}`);
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
