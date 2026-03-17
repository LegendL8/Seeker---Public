import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE ?? undefined;

/**
 * Dev-only: returns the current session's access token for use in PERF_JWT or other tooling.
 * Returns 404 when NODE_ENV !== "development".
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const tokenRes = new NextResponse();
  try {
    const result = await auth0.getAccessToken(request, tokenRes, {
      audience: AUTH0_AUDIENCE ?? undefined,
    });
    return NextResponse.json({ accessToken: result.token });
  } catch {
    return NextResponse.json(
      { error: "UNAUTHORIZED", message: "Not authenticated" },
      { status: 401 },
    );
  }
}
