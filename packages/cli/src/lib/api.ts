import { loadConfig, loadSession } from './config.js';

export async function apiRequest<T = Record<string, unknown>>(method: string, path: string, body?: unknown): Promise<T> {
  const config = await loadConfig();
  const session = await loadSession();
  const res = await fetch(`${config.orbit_url}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.token}`,
      'Origin': config.orbit_url,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) {
    console.error(
      'Session expired. Please log in again:\n  orbit login'
    );
    process.exit(1);
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new Error((data.message as string) || `API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}
