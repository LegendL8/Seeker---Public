"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./NavBar.module.css";

const AUTH_PATH_PREFIX = "/auth";

export function NavBar() {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith(AUTH_PATH_PREFIX) ?? false;

  return (
    <nav className={styles.nav} role="navigation">
      <Link href="/" className={styles.brand}>
        Seeker
      </Link>
      <div className={styles.links}>
        {isAuthRoute ? (
          <Link href="/auth/login" className={styles.link}>
            Log in
          </Link>
        ) : (
          <>
            <Link href="/" className={styles.link}>
              Dashboard
            </Link>
            <Link href="/applications" className={styles.link}>
              Applications
            </Link>
            <Link href="/notes" className={styles.link}>
              Notes
            </Link>
            <Link href="/resumes" className={styles.link}>
              Resumes
            </Link>
            <Link href="/auth/logout" className={styles.link}>
              Log out
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
