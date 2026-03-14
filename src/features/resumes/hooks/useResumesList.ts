import { useQuery } from "@tanstack/react-query";
import { fetchResumesList } from "../api";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export function useResumesList(
  page: number = DEFAULT_PAGE,
  limit: number = DEFAULT_LIMIT,
) {
  return useQuery({
    queryKey: ["resumes", "list", page, limit],
    queryFn: () => fetchResumesList(page, limit),
  });
}
