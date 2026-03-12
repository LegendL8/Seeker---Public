import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

const EXPRESS_API_URL = process.env.EXPRESS_API_URL ?? 'http://localhost:3001';
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE ?? undefined;

async function proxy(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const path = pathSegments.join('/');
  const url = new URL(`/api/${path}`, EXPRESS_API_URL);
  url.search = request.nextUrl.searchParams.toString();

  const tokenRes = new NextResponse();
  let token: string;
  try {
    const result = await auth0.getAccessToken(request, tokenRes, {
      audience: AUTH0_AUDIENCE ?? undefined,
    });
    token = result.token;
  } catch {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Not authenticated', statusCode: 401 },
      { status: 401 }
    );
  }

  const headers = new Headers(request.headers);
  headers.set('Authorization', `Bearer ${token}`);
  headers.delete('host');
  headers.delete('cookie');

  const init: RequestInit = {
    method: request.method,
    headers,
  };
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const contentType = request.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      try {
        init.body = await request.text();
      } catch {
        // no body
      }
    } else if (contentType?.includes('multipart/form-data')) {
      try {
        init.body = await request.arrayBuffer();
      } catch {
        // no body
      }
    }
  }

  const backendRes = await fetch(url.toString(), init);
  const response = new NextResponse(backendRes.body, {
    status: backendRes.status,
    statusText: backendRes.statusText,
    headers: backendRes.headers,
  });
  const setCookies = tokenRes.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    response.headers.append('set-cookie', cookie);
  }
  return response;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  return proxy(request, path);
}
