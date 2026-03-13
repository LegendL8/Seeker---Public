import { useQuery } from "@tanstack/react-query";
import { fetchNoteById } from "../api";

export function useNote(id: string | null) {
  return useQuery({
    queryKey: ["notes", id],
    queryFn: () => fetchNoteById(id as string),
    enabled: Boolean(id),
  });
}
