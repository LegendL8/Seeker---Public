import { useQuery } from '@tanstack/react-query';
import { fetchNotesList } from '../api';
import type { ListNotesQuery } from '../types';

export function useNotesList(query: ListNotesQuery) {
  return useQuery({
    queryKey: ['notes', query],
    queryFn: () => fetchNotesList(query),
  });
}
