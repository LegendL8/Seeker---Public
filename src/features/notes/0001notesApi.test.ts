import {
  fetchNotesList,
  fetchNoteById,
  createNote,
  updateNote,
  deleteNote,
} from './api';

const mockFetch = jest.fn();
const originalFetch = globalThis.fetch;

beforeAll(() => {
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch;
});

afterAll(() => {
  (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
});

beforeEach(() => {
  mockFetch.mockReset();
  delete process.env.NEXT_PUBLIC_API_URL;
});

describe('fetchNotesList', () => {
  it('builds URL with query params and returns data', async () => {
    const data = { items: [], total: 0, page: 1, limit: 20 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const result = await fetchNotesList({ page: 1, limit: 20 });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/proxy/v1/notes?page=1&limit=20',
      { credentials: 'include' }
    );
    expect(result).toEqual(data);
  });

  it('includes typeTag and applicationId when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [], total: 0, page: 1, limit: 20 }),
    });

    await fetchNotesList({
      page: 2,
      limit: 10,
      typeTag: 'interview',
      applicationId: 'app-uuid',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/proxy/v1/notes?page=2&limit=10&typeTag=interview&applicationId=app-uuid',
      expect.any(Object)
    );
  });

  it('throws with API message on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: 'Unauthorized',
      json: () => Promise.resolve({ message: 'Not authenticated' }),
    });

    await expect(fetchNotesList({})).rejects.toThrow('Not authenticated');
  });
});

describe('fetchNoteById', () => {
  it('GETs correct URL and returns note', async () => {
    const note = { id: 'note-1', content: 'Hello', typeTag: 'general' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(note),
    });

    const result = await fetchNoteById('note-1');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/proxy/v1/notes/note-1',
      { credentials: 'include' }
    );
    expect(result).toEqual(note);
  });
});

describe('createNote', () => {
  it('POSTs body to correct URL and returns note', async () => {
    const body = { content: 'New note', typeTag: 'general' };
    const created = { id: 'note-1', content: 'New note', typeTag: 'general' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(created),
    });

    const result = await createNote(body);

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/proxy/v1/notes',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    );
    expect(result).toEqual(created);
  });
});

describe('updateNote', () => {
  it('PATCHes body to correct URL', async () => {
    const updated = { id: 'note-1', content: 'Updated' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(updated),
    });

    await updateNote('note-1', { content: 'Updated' });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/proxy/v1/notes/note-1',
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Updated' }),
      })
    );
  });
});

describe('deleteNote', () => {
  it('DELETEs correct URL', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await deleteNote('note-1');

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/proxy/v1/notes/note-1',
      expect.objectContaining({ method: 'DELETE', credentials: 'include' })
    );
  });
});
