import { NextResponse } from 'next/server';
import { authenticateRequest } from '../auth';
import { incrementUsage } from '@/lib/subscription';
import { rateLimit } from '@/lib/rate-limit';

const limiter = rateLimit({ interval: 60_000, maxRequests: 30 });

export async function POST(request: Request) {
  const session = await authenticateRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success } = await limiter.check(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { feature } = await request.json();
  if (!feature || typeof feature !== 'string') {
    return NextResponse.json({ error: 'Missing feature' }, { status: 400 });
  }

  await incrementUsage(session.user.id, feature);

  return NextResponse.json({ ok: true });
}
