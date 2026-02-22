import prompts from 'prompts';
import ora from 'ora';
import { saveConfig, saveSession, configExists, loadConfig } from '../lib/config.js';
import { success, error, heading } from '../lib/display.js';

export async function loginCommand(): Promise<void> {
  console.log(heading('Orbit Login'));

  // Connection info
  let orbitUrl: string;
  let databaseUrl: string;

  if (configExists()) {
    const existing = await loadConfig();
    orbitUrl = existing.orbit_url;
    databaseUrl = existing.database_url;
    console.log(`  Using saved config: ${orbitUrl}`);
  } else {
    const connResponse = await prompts([
      {
        type: 'text',
        name: 'url',
        message: 'Orbit Web App URL',
        validate: (v: string) => v.startsWith('http') || 'Must start with http:// or https://',
      },
      {
        type: 'text',
        name: 'databaseUrl',
        message: 'Database URL (postgresql://...)',
        validate: (v: string) => v.startsWith('postgresql://') || v.startsWith('postgres://') || 'Must be a PostgreSQL connection string',
      },
    ]);

    if (!connResponse.url || !connResponse.databaseUrl) {
      console.log(error('Login cancelled.'));
      process.exit(1);
    }

    orbitUrl = connResponse.url;
    databaseUrl = connResponse.databaseUrl;
  }

  // Credentials
  const credResponse = await prompts([
    {
      type: 'text',
      name: 'email',
      message: 'Email',
      validate: (v: string) => v.includes('@') || 'Invalid email',
    },
    {
      type: 'password',
      name: 'password',
      message: 'Password',
    },
  ]);

  if (!credResponse.email || !credResponse.password) {
    console.log(error('Login cancelled.'));
    process.exit(1);
  }

  const spinner = ora('Signing in...').start();

  try {
    // Authenticate via Better Auth REST API
    const res = await fetch(`${orbitUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: credResponse.email,
        password: credResponse.password,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      spinner.fail('Login failed');
      console.log(error(body.message || `HTTP ${res.status}`));
      process.exit(1);
    }

    const data = await res.json();

    if (!data.user || !data.token) {
      spinner.fail('Login failed');
      console.log(error('Invalid response from server'));
      process.exit(1);
    }

    // Save config and session
    await saveConfig({ orbit_url: orbitUrl, database_url: databaseUrl });
    await saveSession({
      token: data.token,
      user: {
        id: data.user.id,
        email: data.user.email ?? '',
      },
    });

    spinner.succeed('Logged in');
    console.log(success(`Welcome, ${data.user.email}!`));
  } catch (err: unknown) {
    spinner.fail('Login failed');
    const message = err instanceof Error ? err.message : String(err);
    console.log(error(message));
    process.exit(1);
  }
}
