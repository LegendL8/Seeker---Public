import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setResumeActive } from '../api';

export function useSetActiveResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setResumeActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
}
