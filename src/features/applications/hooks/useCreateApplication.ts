'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { createApplication } from '../api';
import type { CreateApplicationInput } from '../api';

export function useCreateApplication() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (body: CreateApplicationInput) => createApplication(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'list'] });
      router.push('/applications');
    },
  });
}
