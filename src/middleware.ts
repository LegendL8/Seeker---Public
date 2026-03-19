import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

/** Paths that do not require auth. */
const PUBLIC_PATH_PREFIX = "/auth";

const PUBLIC_PATHS = new Set<string>(["/"]);

function requiresAuth(pathname: string): boolean {
  if (pathname.startsWith(PUBLIC_PATH_PREFIX)) {
    return false;
  }
  if (PUBLIC_PATHS.has(pathname)) {
    return false;
  }
  return true;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (requiresAuth(pathname)) {
    const session = await auth0.getSession(request);
    if (!session) {
      const destination = `${pathname}${request.nextUrl.search}`;
      const signInUrl = new URL("/auth/sign-in", request.url);
      signInUrl.searchParams.set("returnTo", destination);
      return NextResponse.redirect(signInUrl);
    }
  }

  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
