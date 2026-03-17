/**
 * Treats Auth0 sub, placeholder emails, and similar as "no identity" for display.
 */
export function isAuth0LikeIdentity(value: string | null | undefined): boolean {
  if (value == null || typeof value !== "string") return true;
  const s = value.trim();
  if (!s) return true;
  if (s.startsWith("auth0|") || s.startsWith("auth0-")) return true;
  if (s.endsWith("@auth0.user")) return true;
  if (/^auth0-[a-f0-9]+$/i.test(s)) return true;
  return false;
}

export function getDisplayName(displayName: string | null | undefined): string {
  if (displayName != null && displayName.trim() && !isAuth0LikeIdentity(displayName)) {
    return displayName.trim();
  }
  return "User";
}

export function getDisplayEmail(email: string | null | undefined): string {
  if (email != null && email.trim() && !isAuth0LikeIdentity(email)) {
    return email.trim();
  }
  return "No email";
}

export function getWelcomeName(
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  if (displayName != null && displayName.trim() && !isAuth0LikeIdentity(displayName)) {
    return displayName.trim();
  }
  if (email != null && email.trim() && !isAuth0LikeIdentity(email)) {
    const local = email.split("@")[0]?.trim();
    if (local) return local;
  }
  return "User";
}
