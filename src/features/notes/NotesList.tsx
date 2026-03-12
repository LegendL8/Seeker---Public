'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useNotesList } from './hooks/useNotesList';
import { useDeleteNote } from './hooks/useDeleteNote';
import { NoteEditor } from './NoteEditor';
import { AddNoteForm } from './AddNoteForm';
import type { Note } from './types';
import styles from './NotesList.module.css';

const TYPE_TAGS = [
  { value: '', label: 'All types' },
  { value: 'general', label: 'General' },
  { value: 'interview', label: 'Interview' },
  { value: 'job_description', label: 'Job description' },
  { value: 'research', label: 'Research' },
];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export function NotesList() {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [typeTag, setTypeTag] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const query = {
    page,
    limit: DEFAULT_LIMIT,
    typeTag: typeTag || undefined,
  };
  const { data, isPending, isError, error } = useNotesList(query);
  const deleteMutation = useDeleteNote();

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_LIMIT));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function handleDelete(id: string) {
    if (
      typeof window !== 'undefined' &&
      window.confirm('Delete this note? This cannot be undone.')
    ) {
      deleteMutation.mutate(id);
      if (selectedId === id) setSelectedId(null);
    }
  }

  if (isError) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h2 className={styles.title}>Notes</h2>
          <Link href="/applications" className={styles.appsLink}>
            Applications
          </Link>
        </div>
        <p className={styles.error}>
          {error instanceof Error ? error.message : 'Failed to load notes'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Notes</h2>
        <Link href="/applications" className={styles.appsLink}>
          Applications
        </Link>
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.filters}>
            <label htmlFor="filter-type">Filter by type</label>
            <select
              id="filter-type"
              value={typeTag}
              onChange={(e) => {
                setTypeTag(e.target.value);
                setPage(1);
              }}
              className={styles.select}
            >
              {TYPE_TAGS.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => {
              setShowAddForm(true);
              setSelectedId(null);
            }}
          >
            Add note
          </button>
          {isPending && !data ? (
            <p className={styles.status}>Loading…</p>
          ) : (
            <ul className={styles.notesList}>
              {items.map((note: Note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    className={`${styles.noteItem} ${selectedId === note.id ? styles.noteItemActive : ''}`}
                    onClick={() => {
                      setSelectedId(note.id);
                      setShowAddForm(false);
                    }}
                  >
                    <span>{formatDate(note.updatedAt)} · {note.typeTag}</span>
                    <div className={styles.notePreview}>
                      {note.content}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {data && items.length > 0 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!hasPrev}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
              >
                Next
              </button>
            </div>
          )}
        </aside>

        <div className={styles.detail}>
          {showAddForm ? (
            <AddNoteForm
              onSuccess={() => {
                setShowAddForm(false);
              }}
            />
          ) : selectedId ? (
            <>
              <NoteEditor noteId={selectedId} />
              <div style={{ marginTop: 16 }}>
                <button
                  type="button"
                  className={styles.pageBtn}
                  onClick={() => handleDelete(selectedId)}
                  disabled={deleteMutation.isPending}
                >
                  Delete note
                </button>
              </div>
            </>
          ) : (
            <p className={styles.detailEmpty}>
              Select a note or add a new one.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
