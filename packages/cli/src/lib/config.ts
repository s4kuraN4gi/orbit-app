import { homedir } from 'node:os';
import { join } from 'node:path';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { OrbitConfig, OrbitSession } from '../types.js';
import { ConfigError } from './errors.js';

const ORBIT_DIR = join(homedir(), '.orbit');
const CONFIG_PATH = join(ORBIT_DIR, 'config.json');
const SESSION_PATH = join(ORBIT_DIR, 'session.json');

async function ensureDir(): Promise<void> {
  if (!existsSync(ORBIT_DIR)) {
    await mkdir(ORBIT_DIR, { recursive: true, mode: 0o700 });
  }
}

// --- Config (orbit_url, database_url) ---

export async function loadConfig(): Promise<OrbitConfig> {
  if (!existsSync(CONFIG_PATH)) {
    throw new ConfigError();
  }
  const raw = await readFile(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw) as OrbitConfig;
}

export async function saveConfig(config: OrbitConfig): Promise<void> {
  await ensureDir();
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export function configExists(): boolean {
  return existsSync(CONFIG_PATH);
}

// --- Session (token + user) ---

export async function loadSession(): Promise<OrbitSession> {
  if (!existsSync(SESSION_PATH)) {
    throw new ConfigError('No session found. Run `orbit login` first.');
  }
  const raw = await readFile(SESSION_PATH, 'utf-8');
  return JSON.parse(raw) as OrbitSession;
}

export async function saveSession(session: OrbitSession): Promise<void> {
  await ensureDir();
  await writeFile(SESSION_PATH, JSON.stringify(session, null, 2), { mode: 0o600 });
}

export async function clearSession(): Promise<void> {
  if (existsSync(SESSION_PATH)) {
    await rm(SESSION_PATH);
  }
}

export function sessionExists(): boolean {
  return existsSync(SESSION_PATH);
}

export async function isLoggedIn(): Promise<boolean> {
  try {
    const session = await loadSession();
    return !!session?.token;
  } catch {
    return false;
  }
}
