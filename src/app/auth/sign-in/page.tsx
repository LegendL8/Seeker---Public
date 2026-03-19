import Link from "next/link";
import { SignInRedirect } from "./SignInRedirect";
import { sanitizeReturnTo } from "@/lib/authReturnTo";
import styles from "./page.module.css";

interface SignInPageProps {
  readonly searchParams: Promise<{ returnTo?: string | string[] }>;
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export default async function SignInPage({
  searchParams,
}: SignInPageProps): Promise<React.ReactElement> {
  const params = await searchParams;
  const rawReturnTo = firstParam(params.returnTo);
  const returnTo = sanitizeReturnTo(rawReturnTo);

  const loginHref = `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>You need to sign in to continue</h1>
      <p className={styles.copy}>
        You will be redirected to our secure sign-in provider. After you finish,
        you will return to the page you were trying to open.
      </p>
      <p className={styles.status} aria-live="polite">
        Signing you in&hellip;
      </p>
      <p className={styles.copy}>
        <Link href={loginHref} className={styles.link}>
          Continue to sign in
        </Link>{" "}
        if you are not redirected automatically.
      </p>
      <SignInRedirect loginHref={loginHref} />
    </div>
  );
}
