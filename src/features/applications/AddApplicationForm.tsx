"use client";

import Link from "next/link";
import { useState } from "react";
import {
  createApplicationFormSchema,
  type CreateApplicationFormInput,
  type CreateApplicationFormValues,
} from "./schemas";
import { useCreateApplication } from "./hooks/useCreateApplication";
import { useResumesList } from "@/features/resumes/hooks/useResumesList";
import styles from "./AddApplicationForm.module.css";

const STATUS_OPTIONS: {
  value: NonNullable<CreateApplicationFormValues["status"]>;
  label: string;
}[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

const initialValues: CreateApplicationFormInput = {
  jobTitle: "",
  status: "saved",
  jobPostingUrl: "",
  location: "",
  salaryMin: undefined,
  salaryMax: undefined,
  appliedAt: undefined,
  source: "",
  resumeId: "",
};

export function AddApplicationForm() {
  const [values, setValues] =
    useState<CreateApplicationFormInput>(initialValues);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CreateApplicationFormValues, string>>
  >({});
  const { mutate, isPending, error: submitError } = useCreateApplication();
  const { data: resumesData } = useResumesList();
  const resumes = resumesData?.items ?? [];

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    const key = name as keyof CreateApplicationFormValues;
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    const parsed = createApplicationFormSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Partial<Record<keyof CreateApplicationFormValues, string>> =
        {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string") {
          const key = path as keyof CreateApplicationFormValues;
          if (!errors[key]) errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }
    const body = parsed.data;
    mutate({
      jobTitle: body.jobTitle,
      status: body.status,
      jobPostingUrl: body.jobPostingUrl,
      location: body.location,
      salaryMin: body.salaryMin,
      salaryMax: body.salaryMax,
      appliedAt: body.appliedAt,
      source: body.source,
      resumeId: body.resumeId,
    });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <Link href="/applications" className={styles.backLink}>
            Applications
          </Link>
          <h1 className={styles.title}>Add application</h1>
        </div>
      </div>

      <div className={styles.formCard}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="jobTitle" className={styles.label}>
            Job title <span className={styles.required}>*</span>
          </label>
          <input
            id="jobTitle"
            name="jobTitle"
            type="text"
            value={values.jobTitle}
            onChange={handleChange}
            className={styles.input}
            autoComplete="off"
            disabled={isPending}
          />
          {fieldErrors.jobTitle && (
            <span className={styles.error}>{fieldErrors.jobTitle}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="status" className={styles.label}>
            Status
          </label>
          <select
            id="status"
            name="status"
            value={values.status ?? "saved"}
            onChange={handleChange}
            className={styles.select}
            disabled={isPending}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="jobPostingUrl" className={styles.label}>
            Job posting URL
          </label>
          <input
            id="jobPostingUrl"
            name="jobPostingUrl"
            type="url"
            value={values.jobPostingUrl ?? ""}
            onChange={handleChange}
            className={styles.input}
            placeholder="https://..."
            disabled={isPending}
          />
          {fieldErrors.jobPostingUrl && (
            <span className={styles.error}>{fieldErrors.jobPostingUrl}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="location" className={styles.label}>
            Location
          </label>
          <input
            id="location"
            name="location"
            type="text"
            value={values.location ?? ""}
            onChange={handleChange}
            className={styles.input}
            maxLength={255}
            disabled={isPending}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="salaryMin" className={styles.label}>
              Salary min
            </label>
            <input
              id="salaryMin"
              name="salaryMin"
              type="number"
              min={0}
              step={1}
              value={
                values.salaryMin === undefined ? "" : String(values.salaryMin)
              }
              onChange={handleChange}
              className={styles.input}
              disabled={isPending}
            />
            {fieldErrors.salaryMin && (
              <span className={styles.error}>{fieldErrors.salaryMin}</span>
            )}
          </div>
          <div className={styles.field}>
            <label htmlFor="salaryMax" className={styles.label}>
              Salary max
            </label>
            <input
              id="salaryMax"
              name="salaryMax"
              type="number"
              min={0}
              step={1}
              value={
                values.salaryMax === undefined ? "" : String(values.salaryMax)
              }
              onChange={handleChange}
              className={styles.input}
              disabled={isPending}
            />
            {fieldErrors.salaryMax && (
              <span className={styles.error}>{fieldErrors.salaryMax}</span>
            )}
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="appliedAt" className={styles.label}>
            Applied date
          </label>
          <input
            id="appliedAt"
            name="appliedAt"
            type="date"
            value={values.appliedAt ? values.appliedAt.slice(0, 10) : ""}
            onChange={handleChange}
            className={styles.input}
            disabled={isPending}
          />
          {fieldErrors.appliedAt && (
            <span className={styles.error}>{fieldErrors.appliedAt}</span>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="source" className={styles.label}>
            Source
          </label>
          <input
            id="source"
            name="source"
            type="text"
            value={values.source ?? ""}
            onChange={handleChange}
            className={styles.input}
            maxLength={255}
            placeholder="e.g. LinkedIn, company website"
            disabled={isPending}
          />
        </div>

        {resumes.length > 0 && (
          <div className={styles.field}>
            <label htmlFor="resumeId" className={styles.label}>
              Attach resume
            </label>
            <select
              id="resumeId"
              name="resumeId"
              value={values.resumeId ?? ""}
              onChange={handleChange}
              className={styles.select}
              disabled={isPending}
            >
              <option value="">None</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.fileName}
                </option>
              ))}
            </select>
          </div>
        )}

        {submitError && (
          <p className={styles.submitError}>
            {submitError instanceof Error
              ? submitError.message
              : "Failed to create application"}
          </p>
        )}

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isPending}
          >
            {isPending ? "Saving…" : "Add application"}
          </button>
          <Link href="/applications" className={styles.cancelLink}>
            Cancel
          </Link>
        </div>
      </form>
      </div>
    </div>
  );
}
