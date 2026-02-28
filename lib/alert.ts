/**
 * Alert module for critical error notifications.
 *
 * If ALERT_WEBHOOK_URL is set (Slack, Discord, or generic webhook),
 * sends a POST with error details. Otherwise falls back to console.error.
 *
 * Usage:
 *   await alert('stripe', 'Seat count update failed', { orgId, error });
 */

type AlertCategory = 'stripe' | 'webhook' | 'auth' | 'db' | 'general';

interface AlertPayload {
  category: AlertCategory;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

function formatSlackPayload(payload: AlertPayload): object {
  const detailLines = payload.details
    ? Object.entries(payload.details)
        .map(([k, v]) => `  ${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
        .join('\n')
    : '';

  return {
    text: `[${payload.category.toUpperCase()}] ${payload.message}`,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*[${payload.category.toUpperCase()}]* ${payload.message}\n\`${payload.timestamp}\`${detailLines ? `\n\`\`\`\n${detailLines}\n\`\`\`` : ''}`,
        },
      },
    ],
  };
}

export async function alert(
  category: AlertCategory,
  message: string,
  details?: Record<string, unknown>
): Promise<void> {
  const payload: AlertPayload = {
    category,
    message,
    details,
    timestamp: new Date().toISOString(),
  };

  // Always log structured error
  console.error(JSON.stringify(payload));

  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formatSlackPayload(payload)),
    });
  } catch {
    // Don't throw if alert delivery itself fails — avoid cascading errors
    console.error('Alert delivery failed:', message);
  }
}
