import { useQuery } from "@tanstack/react-query";
import { fetchResumeWithUrl } from "../api";

export function useResumeWithUrl(id: string | null) {
  return useQuery({
    queryKey: ["resumes", id],
    queryFn: () => fetchResumeWithUrl(id!),
    enabled: Boolean(id),
  });
}
