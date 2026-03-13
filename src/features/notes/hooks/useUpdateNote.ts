import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateNote } from '../api';
import type { UpdateNoteInput } from '../types';

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateNoteInput) => updateNote(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['notes', id] });
    },
  });
}
