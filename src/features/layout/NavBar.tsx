"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "./hooks/useCurrentUser";
import { getDisplayName, getDisplayEmail, isAuth0LikeIdentity } from "./utils";
import styles from "./NavBar.module.css";

const AUTH_PATH_PREFIX = "/auth";

function getInitials(displayName: string | null, email: string): string {
  if (isAuth0LikeIdentity(displayName) && isAuth0LikeIdentity(email)) {
    return "U";
  }
  if (displayName?.trim() && !isAuth0LikeIdentity(displayName)) {
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }
  if (email?.trim() && !isAuth0LikeIdentity(email)) {
    const local = email.split("@")[0];
    if (local) return local.slice(0, 2).toUpperCase();
  }
  return "U";
}

export function NavBar() {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith(AUTH_PATH_PREFIX) ?? false;
  const { data: user } = useCurrentUser();

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
            <Link
              href="/"
              className={
                pathname === "/"
                  ? `${styles.link} ${styles.linkActive}`
                  : styles.link
              }
            >
              Dashboard
            </Link>
            <Link
              href="/applications"
              className={
                pathname?.startsWith("/applications")
                  ? `${styles.link} ${styles.linkActive}`
                  : styles.link
              }
            >
              Applications
            </Link>
            <Link
              href="/notes"
              className={
                pathname?.startsWith("/notes")
                  ? `${styles.link} ${styles.linkActive}`
                  : styles.link
              }
            >
              Notes
            </Link>
            <Link
              href="/resumes"
              className={
                pathname?.startsWith("/resumes")
                  ? `${styles.link} ${styles.linkActive}`
                  : styles.link
              }
            >
              Resumes
            </Link>
            <Link href="/auth/logout" className={styles.link}>
              Log out
            </Link>
          </>
        )}
      </div>
      {!isAuthRoute && user && (
        <div className={styles.profileBlock}>
          <div className={styles.profileAvatar} aria-hidden>
            {getInitials(user.displayName, user.email)}
          </div>
          <div className={styles.profileInfo}>
            <span className={styles.profileName}>
              {getDisplayName(user.displayName)}
            </span>
            <span className={styles.profileEmail}>
              {getDisplayEmail(user.email)}
            </span>
          </div>
        </div>
      )}
    </nav>
  );
}
