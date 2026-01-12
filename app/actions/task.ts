
'use server';

import { createClient } from '@/lib/supabase'; // Using the lib helper which uses env vars
import { TaskStatus } from '@/types';
import { revalidatePath } from 'next/cache';

export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
  const supabase = createClient();

  // Create a new client if needed for mutations? 
  // Our lib/supabase creates a BrowserClient usually intended for client side,
  // but `@supabase/ssr` creates different clients.
  // The current `lib/supabase` is `createBrowserClient`. It MIGHT work in Server Actions if env vars are available,
  // but typically we should use `createServerClient` with Cookie handling or just direct REST if no auth context.
  // Given we are using ANON key and simple env vars, let's just make sure we use a client that works here.
  // Actually, for Server Actions, creating a plain `createClient` from `@supabase/supabase-js` is often safer/simpler for simple CRUD 
  // if we don't need the Next.js Request/Response context for cookies (which we don't yet for this MVP).
  // BUT the existing `lib/supabase.ts` exports `createClient = createBrowserClient`.
  // `createBrowserClient` might complain if run on server without proper window context or if it expects browser env.
  // Let's create a direct instance here to be safe and "pure" server-side.
  
  // Correction: `lib/supabase.ts` was implemented as:
  // export const createClient = () => createBrowserClient(...)
  // This is fine for Client Components. For Server Actions, we should implement a server-safe client or use `supabase-js` directly.
  
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const serverSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await serverSupabase
    .from('tasks')
    .update({ status: newStatus })
    .eq('id', taskId);

  if (error) {
    console.error('Failed to update task status:', error);
    throw new Error('Failed to update task status');
  }

  revalidatePath('/dashboard');
}

export async function updateTaskPriority(taskId: string, newPriority: string) {
  const supabase = createClient();
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const serverSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await serverSupabase
    .from('tasks')
    .update({ priority: newPriority })
    .eq('id', taskId);

  if (error) {
    console.error('Failed to update task priority:', error);
    throw new Error('Failed to update task priority');
  }

  revalidatePath('/dashboard');
}

export async function updateTaskDates(taskId: string, startDate: Date, dueDate: Date) {
  const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
  const serverSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await serverSupabase
    .from('tasks')
    .update({ 
      start_date: startDate.toISOString(),
      due_date: dueDate.toISOString()
    })
    .eq('id', taskId);

  if (error) {
    console.error('Failed to update task dates:', error);
    throw new Error('Failed to update task dates');
  }

  revalidatePath('/dashboard');
}
