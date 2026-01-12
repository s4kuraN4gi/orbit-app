
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Task } from '@/types';

// Initialize Supabase client
// NOTE: In a real production environment, you should use the Service Role Key for backend-only APIs
// to bypass RLS, or ensure the request is authenticated with a user token.
// For this implementation, we assume the environment variables are set.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''; // Or Service Role Key if needed
const supabase = createClient(supabaseUrl, supabaseKey);

interface BulkCreateRequestBody {
  project_id: string;
  source_tool: 'Antigravity' | 'Cursor' | 'Manual';
  original_prompt: string;
  tasks: Task[]; // Using the Task type defined in types/index.ts
}

// Recursive function to insert tasks
async function insertTasks(
  tasks: Task[],
  projectId: string,
  aiContextId: string,
  parentId: string | null = null
) {
  for (const task of tasks) {
    // 1. Insert the current task
    const { data: insertedTask, error } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        parent_id: parentId,
        ai_context_id: aiContextId,
        title: task.title,
        description: task.description,
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        start_date: task.start_date,
        due_date: task.due_date,
        // board_order is optional, default handled by DB or could be calculated
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error inserting task:', error);
      throw new Error(`Failed to insert task: ${task.title}`);
    }

    // 2. If there are children, process them recursively
    if (task.children && task.children.length > 0) {
      await insertTasks(task.children, projectId, aiContextId, insertedTask.id);
    }
  }
}

export async function POST(request: Request) {
  try {
    const body: BulkCreateRequestBody = await request.json();

    // Basic Validation
    if (!body.project_id || !body.tasks || !Array.isArray(body.tasks)) {
      return NextResponse.json(
        { error: 'Invalid request body. project_id and tasks array are required.' },
        { status: 400 }
      );
    }

    // 1. Create AI Context
    const { data: aiContext, error: contextError } = await supabase
      .from('ai_contexts')
      .insert({
        project_id: body.project_id,
        source_tool: body.source_tool || 'Manual',
        original_prompt: body.original_prompt || '',
        raw_data: body, // Store the raw payload for debugging
      })
      .select('id')
      .single();

    if (contextError) {
      console.error('Error creating AI context:', contextError);
      return NextResponse.json(
        { error: 'Failed to create AI context contextError' + contextError.message },
        { status: 500 }
      );
    }

    // 2. Insert Tasks Recursively
    await insertTasks(body.tasks, body.project_id, aiContext.id, null);

    return NextResponse.json({
      success: true,
      message: 'Tasks created successfully',
      ai_context_id: aiContext.id,
    });
  } catch (error: any) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
