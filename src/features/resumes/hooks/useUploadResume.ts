import { useMutation, useQueryClient } from '@tanstack/react-query';
import { uploadResume } from '../api';

export function useUploadResume() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => uploadResume(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
  });
}
