import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { SdkError } from "@auth0/nextjs-auth0/errors";
import { NextResponse } from "next/server";
import { createAppPathRedirectUrl } from "@/lib/authReturnTo";

type Auth0ClientOptions = NonNullable<
  ConstructorParameters<typeof Auth0Client>[0]
>;

function ensureTrailingSlash(value: string): string {
  return value.endsWith("/") ? value : `${value}/`;
}

function resolveAppBaseUrlForCallback(
  ctx: { appBaseUrl?: string }
): string | undefined {
  if (ctx.appBaseUrl) {
    return ctx.appBaseUrl;
  }
  const raw = process.env.APP_BASE_URL;
  if (raw === undefined || raw === "") {
    return undefined;
  }
  const first = raw.split(",")[0]?.trim();
  return first === "" ? undefined : first;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function callbackErrorHtml(code: string): string {
  const safe = escapeHtml(code);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Sign-in error</title></head><body>
<p>Sign-in did not complete (${safe}).</p>
<p><a href="/auth/sign-in">Try again</a> or <a href="/">go home</a>.</p>
</body></html>`;
}

const onCallback: NonNullable<Auth0ClientOptions["onCallback"]> = async (
  error,
  ctx,
  session
) => {
  void session;
  if (!error) {
    const appBaseUrl = resolveAppBaseUrlForCallback(ctx);
    if (!appBaseUrl) {
      throw new Error(
        "appBaseUrl could not be resolved for the callback redirect."
      );
    }
    return NextResponse.redirect(
      createAppPathRedirectUrl(ctx.returnTo, appBaseUrl)
    );
  }

  const appBaseUrl = resolveAppBaseUrlForCallback(ctx);
  const code =
    error instanceof SdkError ? error.code : "unknown";

  if (!appBaseUrl) {
    return new NextResponse(callbackErrorHtml(code), {
      status: 400,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }

  const errorUrl = new URL("/auth/error", ensureTrailingSlash(appBaseUrl));
  errorUrl.searchParams.set("code", code);
  if (ctx.returnTo) {
    errorUrl.searchParams.set("returnTo", ctx.returnTo);
  }
  return NextResponse.redirect(errorUrl);
};

export const auth0 = new Auth0Client({
  onCallback,
});
