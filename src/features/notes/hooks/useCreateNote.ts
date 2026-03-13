import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createNote } from "../api";
import type { CreateNoteInput } from "../types";

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateNoteInput) => createNote(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
