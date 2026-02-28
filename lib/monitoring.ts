interface Metric {
  name: string;
  value: number;
  tags: Record<string, string>;
  timestamp: number;
}

const buffer: Metric[] = [];
const MAX_BUFFER_SIZE = 100;
let flushTimer: ReturnType<typeof setTimeout> | null = null;

export function trackMetric(
  name: string,
  value: number = 1,
  tags: Record<string, string> = {},
): void {
  buffer.push({
    name,
    value,
    tags,
    timestamp: Date.now(),
  });

  if (buffer.length >= MAX_BUFFER_SIZE) {
    flush();
  } else if (!flushTimer) {
    flushTimer = setTimeout(flush, 30_000);
  }
}

export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  tags: Record<string, string> = {},
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);
    trackMetric(name, durationMs, { ...tags, status: 'success' });
    return result;
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    trackMetric(name, durationMs, { ...tags, status: 'error' });
    throw err;
  }
}

function flush(): void {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (buffer.length === 0) return;

  const events = buffer.splice(0, buffer.length);

  const posthogKey = process.env.POSTHOG_API_KEY;
  if (posthogKey) {
    // Fire-and-forget PostHog batch capture
    fetch('https://app.posthog.com/batch/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: posthogKey,
        batch: events.map(e => ({
          event: e.name,
          properties: {
            ...e.tags,
            value: e.value,
            timestamp: new Date(e.timestamp).toISOString(),
          },
          timestamp: new Date(e.timestamp).toISOString(),
        })),
      }),
    }).catch(() => {
      // Silently ignore PostHog errors
    });
  } else if (process.env.NODE_ENV === 'development') {
    for (const e of events) {
      console.log(`[metric] ${e.name}=${e.value}`, e.tags);
    }
  }
}
