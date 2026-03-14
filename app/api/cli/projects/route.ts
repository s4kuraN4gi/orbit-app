import { NextResponse } from 'next/server';
import { authenticateRequest } from '../auth';
import { rateLimit } from '@/lib/rate-limit';
import { getProjectsForUser } from '@/lib/queries';

const limiter = rateLimit({ interval: 60_000, maxRequests: 10 });

export async function GET(request: Request) {
  const session = await authenticateRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success } = await limiter.check(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const data = await getProjectsForUser(session.user.id);

  return NextResponse.json({
    projects: data.map((p) => ({
      id: p.id,
      name: p.name,
      key: p.key,
      owner_id: p.ownerId,
      organization_id: p.organizationId,
      local_path: p.localPath,
      created_at: p.createdAt?.toISOString() ?? '',
    })),
  });
}
