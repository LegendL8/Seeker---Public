"use client";

import { useState } from "react";
import type { Application } from "@/features/applications/types";
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
  applications?: Application[];
  initialTypeTag?: string;
  onSuccess?: () => void;
}

export function AddNoteForm({
  applications = [],
  initialTypeTag,
  onSuccess,
}: AddNoteFormProps) {
  const [content, setContent] = useState("");
  const [typeTag, setTypeTag] = useState<CreateNoteInput["typeTag"]>(
    (initialTypeTag as CreateNoteInput["typeTag"]) ?? "general",
  );
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const createMutation = useCreateNote();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    createMutation.mutate(
      {
        content: trimmed,
        typeTag,
        applicationId: applicationId || undefined,
      },
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
          Category
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
      <div className={styles.field}>
        <label htmlFor="note-applicationId" className={styles.label}>
          Link to application
        </label>
        <select
          id="note-applicationId"
          value={applicationId ?? ""}
          onChange={(e) => setApplicationId(e.target.value || null)}
          className={styles.select}
          disabled={createMutation.isPending}
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
