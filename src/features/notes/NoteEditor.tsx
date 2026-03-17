"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Application } from "@/features/applications/types";
import { useNote } from "./hooks/useNote";
import { useUpdateNote } from "./hooks/useUpdateNote";
import styles from "./NoteEditor.module.css";

const DEBOUNCE_MS = 500;

const TYPE_TAGS = [
  { value: "general", label: "General" },
  { value: "interview", label: "Interview" },
  { value: "job_description", label: "Job description" },
  { value: "research", label: "Research" },
] as const;

export interface NoteEditorProps {
  noteId: string;
  applications?: Application[];
}

export function NoteEditor({ noteId, applications = [] }: NoteEditorProps) {
  const { data: note, isPending, isError, error } = useNote(noteId);
  const updateMutation = useUpdateNote(noteId);
  const [localContent, setLocalContent] = useState("");
  const [localTypeTag, setLocalTypeTag] = useState<string>("general");
  const [localApplicationId, setLocalApplicationId] = useState<string | null>(
    null,
  );
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
      queueMicrotask(() => {
        setLocalContent(note.content);
        setLocalTypeTag(note.typeTag);
        setLocalApplicationId(note.applicationId);
      });
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

  function handleTypeTagChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    setLocalTypeTag(value);
    updateMutation.mutate({ typeTag: value });
  }

  function handleApplicationChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    const next = value || null;
    setLocalApplicationId(next);
    updateMutation.mutate({ applicationId: next });
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
      <div className={styles.field}>
        <label htmlFor="note-typeTag" className={styles.label}>
          Category
        </label>
        <select
          id="note-typeTag"
          value={localTypeTag}
          onChange={handleTypeTagChange}
          className={styles.select}
          disabled={updateMutation.isPending}
          aria-label="Note category"
        >
          {TYPE_TAGS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="note-applicationId" className={styles.label}>
          Link to application
        </label>
        <select
          id="note-applicationId"
          value={localApplicationId ?? ""}
          onChange={handleApplicationChange}
          className={styles.select}
          disabled={updateMutation.isPending}
          aria-label="Link note to application"
        >
          <option value="">None</option>
          {applications.map((app) => (
            <option key={app.id} value={app.id}>
              {app.jobTitle}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
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
      </div>
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
