import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { projects, scanSnapshots } from '@/lib/schema';
import { eq, asc } from 'drizzle-orm';
import { authenticateRequest, checkProjectAccess } from '../../../auth';
import { rateLimit } from '@/lib/rate-limit';
import { measureAsync, flushAfterRequest } from '@/lib/monitoring';

const limiter = rateLimit({ interval: 60_000, maxRequests: 10 });

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await authenticateRequest(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { success } = await limiter.check(session.user.id);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { id } = await params;

  const project = await checkProjectAccess(session.user.id, id);
  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Validate payload size (1MB limit)
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > 1_000_000) {
    return NextResponse.json(
      { error: 'Payload too large. Maximum size is 1MB.' },
      { status: 413 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('scan_data' in body) ||
    typeof (body as Record<string, unknown>).scan_data !== 'object' ||
    (body as Record<string, unknown>).scan_data === null
  ) {
    return NextResponse.json(
      { error: 'scan_data must be a non-null object' },
      { status: 400 }
    );
  }

  const { scan_data } = body as { scan_data: Record<string, unknown> };

  // Double-check serialized size
  const serialized = JSON.stringify(scan_data);
  if (serialized.length > 1_000_000) {
    return NextResponse.json(
      { error: 'scan_data too large. Maximum size is 1MB.' },
      { status: 413 }
    );
  }

  const result = await measureAsync('scan_upload', async () => {
    const [updated] = await db
      .update(projects)
      .set({ scanData: scan_data })
      .where(eq(projects.id, id))
      .returning();

    // Save scan snapshot for history
    await db.insert(scanSnapshots).values({
      projectId: id,
      scanData: scan_data,
    });

    // Keep only latest 50 snapshots per project
    const allSnapshots = await db
      .select({ id: scanSnapshots.id })
      .from(scanSnapshots)
      .where(eq(scanSnapshots.projectId, id))
      .orderBy(asc(scanSnapshots.createdAt));

    if (allSnapshots.length > 50) {
      const toDelete = allSnapshots.slice(0, allSnapshots.length - 50);
      for (const s of toDelete) {
        await db.delete(scanSnapshots).where(eq(scanSnapshots.id, s.id));
      }
    }

    return updated;
  }, { projectId: id });

  flushAfterRequest();

  return NextResponse.json({
    project: {
      id: result.id,
      name: result.name,
      scan_data: result.scanData,
    },
  });
}
