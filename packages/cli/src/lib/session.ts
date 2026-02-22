import { loadSession, sessionExists } from './config.js';
import { AuthError } from './errors.js';
import type { User } from '../types.js';

/**
 * Require authentication. Throws AuthError if not logged in.
 * Returns the current user.
 */
export async function requireAuth(): Promise<User> {
  if (!sessionExists()) {
    throw new AuthError();
  }
  const session = await loadSession();
  return session.user;
}
