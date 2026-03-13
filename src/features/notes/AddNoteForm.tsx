"use client";

import { useState } from "react";
import { useCreateNote } from "./hooks/useCreateNote";
import type { CreateNoteInput } from "./types";
import styles from "./AddNoteForm.module.css";

const TYPE_TAGS = [
  { value: "general", label: "General" },
  { value: "interview", label: "Interview" },
  { value: "job_description", label: "Job description" },
  { value: "research", label: "Research" },
];

export interface AddNoteFormProps {
  onSuccess?: () => void;
}

export function AddNoteForm({ onSuccess }: AddNoteFormProps) {
  const [content, setContent] = useState("");
  const [typeTag, setTypeTag] = useState<CreateNoteInput["typeTag"]>("general");
  const createMutation = useCreateNote();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    createMutation.mutate(
      { content: trimmed, typeTag },
      {
        onSuccess: () => {
          setContent("");
          onSuccess?.();
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="note-content" className={styles.label}>
          Content
        </label>
        <textarea
          id="note-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={styles.textarea}
          disabled={createMutation.isPending}
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="note-typeTag" className={styles.label}>
          Type
        </label>
        <select
          id="note-typeTag"
          value={typeTag}
          onChange={(e) =>
            setTypeTag(e.target.value as CreateNoteInput["typeTag"])
          }
          className={styles.select}
          disabled={createMutation.isPending}
        >
          {TYPE_TAGS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {createMutation.isError && (
        <p className={styles.error}>
          {createMutation.error instanceof Error
            ? createMutation.error.message
            : "Failed to create note"}
        </p>
      )}
      <button
        type="submit"
        className={styles.submitBtn}
        disabled={createMutation.isPending || !content.trim()}
      >
        {createMutation.isPending ? "Adding…" : "Add note"}
      </button>
    </form>
  );
}
