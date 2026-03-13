"use client";

import { useState } from "react";
import { useCreateInterview } from "./hooks/useCreateInterview";
import type { CreateInterviewInput } from "./types";
import styles from "./AddInterviewForm.module.css";

const INTERVIEW_TYPES = [
  { value: "phone", label: "Phone" },
  { value: "technical", label: "Technical" },
  { value: "behavioral", label: "Behavioral" },
  { value: "onsite", label: "On-site" },
  { value: "final", label: "Final" },
];

const OUTCOMES = [
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "no_show", label: "No show" },
];

export interface AddInterviewFormProps {
  applicationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AddInterviewForm({
  applicationId,
  onSuccess,
  onCancel,
}: AddInterviewFormProps) {
  const [interviewType, setInterviewType] =
    useState<CreateInterviewInput["interviewType"]>("phone");
  const [scheduledAt, setScheduledAt] = useState("");
  const [interviewerName, setInterviewerName] = useState("");
  const [interviewerTitle, setInterviewerTitle] = useState("");
  const [outcome, setOutcome] =
    useState<CreateInterviewInput["outcome"]>("pending");

  const createMutation = useCreateInterview(applicationId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body: CreateInterviewInput = {
      interviewType,
      outcome,
      interviewerName: interviewerName.trim() || undefined,
      interviewerTitle: interviewerTitle.trim() || undefined,
    };
    if (scheduledAt.trim()) {
      body.scheduledAt = new Date(scheduledAt).toISOString();
    }
    createMutation.mutate(body, {
      onSuccess: () => {
        setScheduledAt("");
        setInterviewerName("");
        setInterviewerTitle("");
        onSuccess?.();
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="interviewType" className={styles.label}>
          Type
        </label>
        <select
          id="interviewType"
          value={interviewType}
          onChange={(e) =>
            setInterviewType(
              e.target.value as CreateInterviewInput["interviewType"],
            )
          }
          className={styles.select}
          disabled={createMutation.isPending}
        >
          {INTERVIEW_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.field}>
        <label htmlFor="scheduledAt" className={styles.label}>
          Scheduled at
        </label>
        <input
          id="scheduledAt"
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className={styles.input}
          disabled={createMutation.isPending}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor="interviewerName" className={styles.label}>
            Interviewer name
          </label>
          <input
            id="interviewerName"
            type="text"
            value={interviewerName}
            onChange={(e) => setInterviewerName(e.target.value)}
            className={styles.input}
            disabled={createMutation.isPending}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="interviewerTitle" className={styles.label}>
            Interviewer title
          </label>
          <input
            id="interviewerTitle"
            type="text"
            value={interviewerTitle}
            onChange={(e) => setInterviewerTitle(e.target.value)}
            className={styles.input}
            disabled={createMutation.isPending}
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="outcome" className={styles.label}>
          Outcome
        </label>
        <select
          id="outcome"
          value={outcome}
          onChange={(e) =>
            setOutcome(e.target.value as CreateInterviewInput["outcome"])
          }
          className={styles.select}
          disabled={createMutation.isPending}
        >
          {OUTCOMES.map((opt) => (
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
            : "Failed to add interview"}
        </p>
      )}

      <div className={styles.row}>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? "Adding…" : "Add interview"}
        </button>
        {onCancel && (
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onCancel}
            disabled={createMutation.isPending}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
