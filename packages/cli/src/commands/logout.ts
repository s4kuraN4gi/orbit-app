import { clearSession, sessionExists } from '../lib/config.js';
import { success, dim } from '../lib/display.js';

export async function logoutCommand(): Promise<void> {
  if (!sessionExists()) {
    console.log(dim('Already logged out.'));
    return;
  }

  await clearSession();
  console.log(success('Logged out.'));
}
