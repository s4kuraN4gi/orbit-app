import { loadConfig, loadSession } from './config.js';

export async function apiRequest(method: string, path: string, body?: unknown): Promise<any> {
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
  if (!res.ok) {
    const data: any = await res.json().catch(() => ({}));
    throw new Error(data.message || `API error: ${res.status}`);
  }
  return res.json();
}
