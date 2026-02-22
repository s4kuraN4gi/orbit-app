import prompts from 'prompts';
import ora from 'ora';
import { saveConfig, saveSession, configExists, loadConfig } from '../lib/config.js';
import { success, error, heading } from '../lib/display.js';

export async function loginCommand(): Promise<void> {
  console.log(heading('Orbit Login'));

  let orbitUrl: string;

  if (configExists()) {
    const existing = await loadConfig();
    orbitUrl = existing.orbit_url;
    console.log(`  Using saved config: ${orbitUrl}`);
  } else {
    const connResponse = await prompts([
      {
        type: 'text',
        name: 'url',
        message: 'Orbit Web App URL',
        validate: (v: string) => v.startsWith('http') || 'Must start with http:// or https://',
      },
    ]);

    if (!connResponse.url) {
      console.log(error('Login cancelled.'));
      process.exit(1);
    }

    orbitUrl = connResponse.url;
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
    const res = await fetch(`${orbitUrl}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': orbitUrl,
      },
      body: JSON.stringify({
        email: credResponse.email,
        password: credResponse.password,
      }),
    });

    const resText = await res.text();
    let data: any;
    try {
      data = JSON.parse(resText);
    } catch {
      spinner.fail('Login failed');
      console.log(error(`Unexpected response: ${resText.slice(0, 200)}`));
      process.exit(1);
    }

    if (!res.ok) {
      spinner.fail('Login failed');
      console.log(error(data.message || `HTTP ${res.status}: ${resText.slice(0, 200)}`));
      process.exit(1);
    }

    const token = data.token || data.session?.token;
    const user = data.user;

    if (!user || !token) {
      spinner.fail('Login failed');
      console.log(error(`Invalid response structure. Keys: ${Object.keys(data).join(', ')}`));
      process.exit(1);
    }

    await saveConfig({ orbit_url: orbitUrl });
    await saveSession({
      token,
      user: {
        id: user.id,
        email: user.email ?? '',
      },
    });

    spinner.succeed('Logged in');
    console.log(success(`Welcome, ${user.email}!`));
  } catch (err: unknown) {
    spinner.fail('Login failed');
    const message = err instanceof Error ? err.message : String(err);
    console.log(error(message));
    process.exit(1);
  }
}
