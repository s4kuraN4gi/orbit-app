import { auth } from '@/lib/auth';

export async function authenticateRequest(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) return null;
  const headers = new Headers();
  headers.set(
    'cookie',
    `better-auth.session_token=${token}; __Secure-better-auth.session_token=${token}`
  );
  const session = await auth.api.getSession({ headers });
  return session;
}
