import { useQuery } from '@tanstack/react-query';
import { fetchResumesList } from '../api';

export function useResumesList() {
  return useQuery({
    queryKey: ['resumes'],
    queryFn: () => fetchResumesList(),
  });
}
