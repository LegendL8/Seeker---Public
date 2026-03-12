import { NextResponse, type NextRequest } from 'next/server';
import { auth0 } from '@/lib/auth0';

/** Paths that do not require auth. Will later include landing and login page. */
const PUBLIC_PATH_PREFIX = '/auth';

function requiresAuth(pathname: string): boolean {
  return !pathname.startsWith(PUBLIC_PATH_PREFIX);
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (requiresAuth(pathname)) {
    const session = await auth0.getSession(request);
    if (!session) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('returnTo', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
