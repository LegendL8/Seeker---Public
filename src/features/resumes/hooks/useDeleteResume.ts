import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteResume } from '../api';

export function useDeleteResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteResume(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
}
