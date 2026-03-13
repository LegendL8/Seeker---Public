import { useQuery } from "@tanstack/react-query";
import { fetchInterviewsByApplicationId } from "../api";

export function useInterviewsForApplication(applicationId: string | null) {
  return useQuery({
    queryKey: ["interviews", applicationId],
    queryFn: () => fetchInterviewsByApplicationId(applicationId as string),
    enabled: Boolean(applicationId),
  });
}
