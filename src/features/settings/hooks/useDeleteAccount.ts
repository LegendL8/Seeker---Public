"use client";

import { useMutation } from "@tanstack/react-query";
import { deleteCurrentUserAccount } from "../api";

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () => deleteCurrentUserAccount(),
    onSuccess: () => {
      window.location.assign("/auth/logout");
    },
  });
}
