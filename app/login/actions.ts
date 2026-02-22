'use server';

import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await auth.api.signInEmail({
      body: { email, password },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    await auth.api.signUpEmail({
      body: { email, password, name: email.split('@')[0] },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Signup failed';
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}
