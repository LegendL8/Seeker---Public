import Link from "next/link";
import { sanitizeReturnTo } from "@/lib/authReturnTo";
import styles from "./page.module.css";

const MESSAGES: Record<string, string> = {
  missing_state:
    "The sign-in session expired or was interrupted. Try signing in again.",
  invalid_state:
    "We could not verify your sign-in request. Try signing in again.",
  discovery_error:
    "We could not reach the sign-in service. Check your connection and try again.",
  authorization_error:
    "Sign-in was cancelled or denied. Try again or use a different account.",
  authorization_code_grant_request_error:
    "We could not complete sign-in with the provider. Try again in a moment.",
  authorization_code_grant_error:
    "Sign-in could not be completed. Try again or contact support if it keeps happening.",
  invalid_configuration:
    "Sign-in is misconfigured. If you are the app owner, check Auth0 and environment settings.",
};

interface AuthErrorPageProps {
  readonly searchParams: Promise<{
    code?: string | string[];
    returnTo?: string | string[];
  }>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function AuthErrorPage({
  searchParams,
}: AuthErrorPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const code = firstParam(params.code) ?? "unknown";
  const message =
    MESSAGES[code] ??
    "Something went wrong while signing in. You can try again or go home.";

  const returnTo = sanitizeReturnTo(firstParam(params.returnTo));
  const tryAgainHref = `/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Sign-in did not complete</h1>
      <p className={styles.message}>{message}</p>
      <div className={styles.actions}>
        <Link href={tryAgainHref} className={styles.buttonPrimary}>
          Try again
        </Link>
        <Link href="/" className={styles.button}>
          Home
        </Link>
      </div>
    </div>
  );
}
