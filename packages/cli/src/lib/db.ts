import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { loadConfig } from './config.js';

let _db: ReturnType<typeof drizzle> | null = null;

/**
 * Get a Drizzle client connected to Neon.
 * Lazily initialized from ~/.orbit/config.json.
 */
export async function getDb() {
  if (_db) return _db;

  const config = await loadConfig();
  const sql = neon(config.database_url);
  _db = drizzle(sql);
  return _db;
}
