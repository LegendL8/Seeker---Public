"use client";

import { useEffect } from "react";

interface SignInRedirectProps {
  readonly loginHref: string;
}

export function SignInRedirect({ loginHref }: SignInRedirectProps): null {
  useEffect(() => {
    window.location.replace(loginHref);
  }, [loginHref]);

  return null;
}
