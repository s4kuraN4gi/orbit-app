
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Supabase environment variables not found in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  console.log('--- Starting API Test: Bulk Create Tasks ---');

  // 1. Create a Temporary Project for testing (to avoid FK errors)
  // Note: This requires the Anon Key to have permissions to create projects (RLS 'true' for auth, but maybe we can simulate a user or just hope RLS aligns for testing)
  // If RLS is strict, this might fail without a logged-in user session.
  // For this test script, we'll try to create a project with a random owner or valid one if possible.
  // Since we don't have a user token easily, we'll ask the user to provide a Project ID OR try to create one if the policy allows anon (unlikely for production, but maybe for dev).
  
  // STRATEGY: user asked for "dummy data". We will use a random UUID and expect the user to have disabled RLS or set up a Project manually, 
  // OR we simply print the payload. 
  // BETTER: Valid UUID.
  
  // Let's try to fetch an existing project first to use.
  // We need to support 'fs' module? No, we are in a script.
  
  // To make this robust, let's just use a Project ID that the user MUST replace if they don't have one.
  // But wait, I can use the Supabase client here to INSERT a project if I am "admin"? No, I only have ANON key usually.
  
  // I will write the script to hit the API. 
  // I will assume the server side (API route) handles the formatting.
  
  const API_URL = 'http://localhost:3000/api/tasks/bulk-create';
  
  // Generating a random UUID for testing purposes if you want to verify validation
  // BUT for successful insertion, we need a REAL project_id.
  // I will ask the user to hardcode their Project ID in the script or I'll try to find one.
  
  let projectId = 'fbfd4fd7-b318-43e3-b5df-11d08a67a2cf'; 

  // OPTIONAL: Try to find a project if we can
  const { data: projects } = await supabase.from('projects').select('id').limit(1);
  if (projects && projects.length > 0) {
    projectId = projects[0].id;
    console.log(`Found existing project to use: ${projectId}`);
  } else {
    console.warn('Warning: No projects found in DB. API might fail with FK violation if Project ID is invalid.');
    // Attempt to create one? (Likely fails due to Auth/RLS)
  }

  const payload = {
    project_id: projectId,
    source_tool: 'Antigravity',
    original_prompt: 'Test prompt from scripts/test-api.ts',
    tasks: [
      {
        title: 'Test Parent Task',
        description: 'This is a parent task created by the test script.',
        status: 'todo',
        priority: 'high',
        children: [
          {
            title: 'Test Child Task',
            description: 'This is a child task.',
            status: 'todo',
            priority: 'medium'
          }
        ]
      },
       {
        title: 'Another Top Level Task',
        description: 'Testing multiple top level items.',
        status: 'in_progress',
        priority: 'low'
      }
    ]
  };

  console.log('Sending payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    console.log('--- Response Status:', response.status);
    console.log('--- Response Data:', data);

    if (response.ok) {
       console.log('✅ Test Passed: API returned success.');
    } else {
       console.error('❌ Test Failed: API returned error.');
    }

  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

main();
