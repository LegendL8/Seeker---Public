'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { updateApplication } from '../api';
import type { UpdateApplicationInput } from '../api';

export function useUpdateApplication(id: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body: UpdateApplicationInput) => updateApplication(id, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'list'] });
      queryClient.setQueryData(['applications', data.id], data);
      router.push(`/applications/${data.id}`);
    },
  });
}
