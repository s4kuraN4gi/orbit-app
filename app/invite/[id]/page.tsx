import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { invitation, organization } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { InviteAcceptView } from './InviteAcceptView';

interface InvitePageProps {
  params: Promise<{ id: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    // Redirect to login with return URL
    redirect(`/login?redirect=/invite/${id}`);
  }

  // Fetch invitation details
  const [inv] = await db
    .select({
      id: invitation.id,
      organizationId: invitation.organizationId,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    })
    .from(invitation)
    .where(eq(invitation.id, id));

  if (!inv) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Invitation Not Found</h1>
          <p className="text-muted-foreground">This invitation link is invalid or has been removed.</p>
        </div>
      </div>
    );
  }

  if (inv.status !== 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">
            {inv.status === 'accepted' ? 'Already Accepted' : 'Invitation Expired'}
          </h1>
          <p className="text-muted-foreground">
            {inv.status === 'accepted'
              ? 'This invitation has already been accepted.'
              : 'This invitation is no longer valid.'}
          </p>
        </div>
      </div>
    );
  }

  if (inv.expiresAt && inv.expiresAt < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Invitation Expired</h1>
          <p className="text-muted-foreground">This invitation has expired. Please request a new one.</p>
        </div>
      </div>
    );
  }

  // Fetch org name
  const [org] = await db
    .select({ name: organization.name })
    .from(organization)
    .where(eq(organization.id, inv.organizationId));

  const currentEmail = session.user.email;
  const isWrongAccount = currentEmail !== inv.email;

  return (
    <InviteAcceptView
      invitationId={inv.id}
      organizationId={inv.organizationId}
      organizationName={org?.name ?? 'Unknown'}
      role={inv.role}
      email={inv.email}
      currentEmail={currentEmail}
      isWrongAccount={isWrongAccount}
    />
  );
}
