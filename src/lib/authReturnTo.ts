const DEFAULT_AFTER_SIGNIN = "/";

/**
 * Accepts only same-origin relative paths (path + optional search + hash).
 * Rejects scheme-relative and absolute URLs.
 */
export function sanitizeReturnTo(value: string | undefined): string {
  if (value === undefined || value === "") {
    return DEFAULT_AFTER_SIGNIN;
  }
  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_AFTER_SIGNIN;
  }
  if (value.includes("://")) {
    return DEFAULT_AFTER_SIGNIN;
  }
  return value;
}

function ensureLeadingSlash(value: string): string {
  return value && !value.startsWith("/") ? `/${value}` : value;
}

function ensureTrailingSlash(value: string): string {
  return value && !value.endsWith("/") ? `${value}/` : value;
}

function ensureNoLeadingSlash(value: string): string {
  return value.startsWith("/") ? value.substring(1) : value;
}

/**
 * Mirrors Auth0 SDK `createRouteUrl` + `returnTo` shape (path + search + hash).
 */
export function createAppPathRedirectUrl(
  returnPath: string | undefined,
  appBaseUrl: string,
): URL {
  const path = returnPath ?? "/";
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH;
  const normalizedRelative =
    basePath === undefined
      ? path
      : ensureTrailingSlash(ensureLeadingSlash(basePath)) +
        ensureNoLeadingSlash(path);

  return new URL(
    ensureNoLeadingSlash(normalizedRelative),
    ensureTrailingSlash(appBaseUrl),
  );
}
