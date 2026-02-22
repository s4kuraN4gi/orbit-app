import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check for Better Auth session cookie
  const sessionToken = request.cookies.get('better-auth.session_token')?.value;

  if (request.nextUrl.pathname.startsWith('/dashboard') && !sessionToken) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
