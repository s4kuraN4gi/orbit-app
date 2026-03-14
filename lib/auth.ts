import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { organization } from 'better-auth/plugins';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { db } from './db';
import * as schema from './schema';
import { updateOrgSeatCount } from './subscription';

/**
 * Explicit scrypt password hashing config.
 * N=32768 (2^15) provides stronger resistance than the default N=16384.
 * OWASP recommends N>=32768 for interactive logins.
 */
const SCRYPT_CONFIG = { N: 32768, r: 16, p: 1, dkLen: 64 };

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function hashPassword(password: string): Promise<string> {
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const key = await scryptAsync(
    password.normalize('NFKC'),
    salt,
    { ...SCRYPT_CONFIG, maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2 }
  );
  return `${salt}:${bytesToHex(key)}`;
}

async function verifyPassword({
  hash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  const [salt, key] = hash.split(':');
  if (!salt || !key) return false;
  const derived = await scryptAsync(
    password.normalize('NFKC'),
    salt,
    { ...SCRYPT_CONFIG, maxmem: 128 * SCRYPT_CONFIG.N * SCRYPT_CONFIG.r * 2 }
  );
  const expected = hexToBytes(key);
  if (derived.length !== expected.length) return false;
  // constant-time comparison
  let diff = 0;
  for (let i = 0; i < derived.length; i++) {
    diff |= derived[i] ^ expected[i];
  }
  return diff === 0;
}

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
    password: {
      hash: hashPassword,
      verify: verifyPassword,
    },
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
