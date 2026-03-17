import { NextResponse } from 'next/server';
import { authenticateRequest } from '../auth';
import { getEffectivePlan } from '@/lib/subscription';
import { db } from '@/lib/db';
import { usage } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({ interval: 60_000, maxRequests: 30 });

export async function GET(request: Request) {
  const session = await authenticateRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success } = await limiter.check(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const plan = await getEffectivePlan(session.user.id);
  const month = new Date().toISOString().slice(0, 7);

  const usageRecords = await db
    .select()
    .from(usage)
    .where(and(eq(usage.userId, session.user.id), eq(usage.month, month)));

  const usageMap: Record<string, number> = {};
  for (const r of usageRecords) {
    usageMap[r.feature] = r.count;
  }

  return NextResponse.json({
    plan,
    // [Sponsorware] All CLI features unlimited during adoption phase
    limits: {
      cliFocus: null,
      cliIssues: null,
      cliWatch: null,
      cliSmart: null,
      cliPlan: null,
      cliFormat: null,
    },
    usage: usageMap,
  });
}
