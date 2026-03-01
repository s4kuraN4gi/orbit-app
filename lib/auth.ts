import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { db } from './db';
import * as schema from './schema';
import { updateOrgSeatCount } from './subscription';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      organization: schema.organization,
      member: schema.member,
      invitation: schema.invitation,
    },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  trustedOrigins: process.env.BETTER_AUTH_URL
    ? [process.env.BETTER_AUTH_URL]
    : [],
  plugins: [
    organization({
      creatorRole: 'owner',
      invitationExpiresIn: 60 * 60 * 72, // 72 hours in seconds
      // No-op: we use link-copy instead of email
      async sendInvitationEmail() {},
      organizationHooks: {
        async afterAddMember(data) {
          const orgId = data.member.organizationId;
          await updateOrgSeatCount(orgId);
        },
        async afterRemoveMember(data) {
          const orgId = data.member.organizationId;
          await updateOrgSeatCount(orgId);
        },
      },
    }),
  ],
});
