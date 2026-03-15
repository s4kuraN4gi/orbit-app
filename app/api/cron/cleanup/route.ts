import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { webhookEvents } from '@/lib/schema';
import { lt } from 'drizzle-orm';

export async function GET(request: Request) {
  // Verify Vercel Cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Delete webhook events older than 90 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  await db
    .delete(webhookEvents)
    .where(lt(webhookEvents.processedAt, cutoff));

  return NextResponse.json({
    ok: true,
    message: `Cleaned up webhook events older than ${cutoff.toISOString()}`,
  });
}
