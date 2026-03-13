"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNote } from "./hooks/useNote";
import { useUpdateNote } from "./hooks/useUpdateNote";
import styles from "./NoteEditor.module.css";

const DEBOUNCE_MS = 500;

export interface NoteEditorProps {
  noteId: string;
}

export function NoteEditor({ noteId }: NoteEditorProps) {
  const { data: note, isPending, isError, error } = useNote(noteId);
  const updateMutation = useUpdateNote(noteId);
  const [localContent, setLocalContent] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const prevNoteIdRef = useRef<string | null>(null);

  const flushSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    const trimmed = localContent.trim();
    if (trimmed !== lastSavedRef.current && noteId) {
      lastSavedRef.current = trimmed;
      updateMutation.mutate(
        { content: trimmed },
        {
          onSuccess: (updated) => {
            setLocalContent(updated.content);
            lastSavedRef.current = updated.content;
          },
        },
      );
    }
  }, [localContent, noteId, updateMutation]);

  useEffect(() => {
    if (note && prevNoteIdRef.current !== note.id) {
      prevNoteIdRef.current = note.id;
      lastSavedRef.current = note.content;
      const content = note.content;
      queueMicrotask(() => setLocalContent(content));
    }
  }, [note]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setLocalContent(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      const trimmed = value.trim();
      if (trimmed !== lastSavedRef.current) {
        lastSavedRef.current = trimmed;
        updateMutation.mutate(
          { content: trimmed },
          {
            onSuccess: (updated) => {
              setLocalContent(updated.content);
              lastSavedRef.current = updated.content;
            },
          },
        );
      }
    }, DEBOUNCE_MS);
  }

  function handleBlur() {
    flushSave();
  }

  if (isPending && !note) {
    return <p className={styles.saveStatus}>Loading note…</p>;
  }

  if (isError || !note) {
    return (
      <p className={styles.error}>
        {error instanceof Error ? error.message : "Note not found"}
      </p>
    );
  }

  return (
    <div className={styles.wrapper}>
      <label htmlFor="note-content" className={styles.label}>
        Content
      </label>
      <textarea
        id="note-content"
        value={localContent}
        onChange={handleChange}
        onBlur={handleBlur}
        className={styles.textarea}
        disabled={updateMutation.isPending}
      />
      <p className={styles.saveStatus}>
        {updateMutation.isPending
          ? "Saving…"
          : updateMutation.isError
            ? updateMutation.error instanceof Error
              ? updateMutation.error.message
              : "Save failed"
            : "Saved"}
      </p>
    </div>
  );
}
