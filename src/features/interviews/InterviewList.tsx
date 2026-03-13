"use client";

import { useState } from "react";
import { useInterviewsForApplication } from "./hooks/useInterviewsForApplication";
import { useDeleteInterview } from "./hooks/useDeleteInterview";
import { AddInterviewForm } from "./AddInterviewForm";
import type { Interview } from "./types";
import styles from "./AddInterviewForm.module.css";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

export interface InterviewListProps {
  applicationId: string;
}

export function InterviewList({ applicationId }: InterviewListProps) {
  const { data, isPending, isError, error } =
    useInterviewsForApplication(applicationId);
  const deleteMutation = useDeleteInterview(applicationId);
  const [showForm, setShowForm] = useState(false);

  if (isPending && !data) {
    return (
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Interviews</h3>
        <p className={styles.empty}>Loading…</p>
      </section>
    );
  }

  if (isError) {
    return (
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Interviews</h3>
        <p className={styles.error}>
          {error instanceof Error ? error.message : "Failed to load interviews"}
        </p>
      </section>
    );
  }

  const items = data?.items ?? [];

  return (
    <section className={styles.section}>
      <h3 className={styles.sectionTitle}>Interviews</h3>
      {showForm ? (
        <AddInterviewForm
          applicationId={applicationId}
          onSuccess={() => setShowForm(false)}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button
          type="button"
          className={styles.toggleBtn}
          onClick={() => setShowForm(true)}
        >
          Add interview
        </button>
      )}

      {items.length === 0 ? (
        <p className={styles.empty}>No interviews yet.</p>
      ) : (
        <ul className={styles.list}>
          {items.map((interview: Interview) => (
            <li key={interview.id} className={styles.item}>
              <span className={styles.itemTitle}>
                {interview.interviewType}
                {interview.interviewerName
                  ? ` with ${interview.interviewerName}`
                  : ""}
              </span>
              <div className={styles.itemMeta}>
                {formatDateTime(interview.scheduledAt)} · {interview.outcome}
              </div>
              <div className={styles.itemActions}>
                <button
                  type="button"
                  onClick={() => {
                    if (
                      typeof window !== "undefined" &&
                      window.confirm("Delete this interview?")
                    ) {
                      deleteMutation.mutate(interview.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
