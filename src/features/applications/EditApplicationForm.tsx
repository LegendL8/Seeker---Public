"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  updateApplicationFormSchema,
  salaryStringToCents,
  type UpdateApplicationFormInput,
  type UpdateApplicationFormValues,
} from "./schemas";
import { useUpdateApplication } from "./hooks/useUpdateApplication";
import { useResumesList } from "@/features/resumes/hooks/useResumesList";
import type { Application } from "./types";
import styles from "./AddApplicationForm.module.css";

const STATUS_OPTIONS: {
  value: NonNullable<UpdateApplicationFormValues["status"]>;
  label: string;
}[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

function centsToDisplayString(
  cents: number,
  period: "yearly" | "hourly",
): string {
  const dollars = cents / 100;
  return period === "hourly"
    ? dollars.toFixed(2)
    : dollars.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function applicationToFormInput(app: Application): UpdateApplicationFormInput {
  const period = app.salaryPeriod ?? "yearly";
  return {
    jobTitle: app.jobTitle,
    status: app.status as UpdateApplicationFormValues["status"],
    jobPostingUrl: app.jobPostingUrl ?? "",
    location: app.location ?? "",
    salaryPeriod: period,
    salaryMin:
      app.salaryMin != null ? centsToDisplayString(app.salaryMin, period) : "",
    salaryMax:
      app.salaryMax != null ? centsToDisplayString(app.salaryMax, period) : "",
    appliedAt: app.appliedAt ? app.appliedAt.slice(0, 10) : "",
    source: app.source ?? "",
    resumeId: app.resumeId ?? "",
  };
}

export function EditApplicationForm({
  application,
  id,
}: {
  application: Application;
  id: string;
}) {
  const [values, setValues] = useState<UpdateApplicationFormInput>(() =>
    applicationToFormInput(application),
  );
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof UpdateApplicationFormValues, string>>
  >({});
  const { mutate, isPending, error: submitError } = useUpdateApplication(id);
  const { data: resumesData } = useResumesList();
  const resumes = resumesData?.items ?? [];

  useEffect(() => {
    setValues(applicationToFormInput(application));
  }, [application]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    const key = name as keyof UpdateApplicationFormValues;
    if (fieldErrors[key]) {
      setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit(e: React.SyntheticEvent) {
    e.preventDefault();
    setFieldErrors({});
    const parsed = updateApplicationFormSchema.safeParse(values);
    if (!parsed.success) {
      const errors: Partial<Record<keyof UpdateApplicationFormValues, string>> =
        {};
      for (const issue of parsed.error.issues) {
        const path = issue.path[0];
        if (typeof path === "string") {
          const key = path as keyof UpdateApplicationFormValues;
          if (!errors[key]) errors[key] = issue.message;
        }
      }
      setFieldErrors(errors);
      return;
    }
    const body = parsed.data;
    const period = body.salaryPeriod ?? "yearly";
    mutate({
      jobTitle: body.jobTitle,
      status: body.status,
      jobPostingUrl: body.jobPostingUrl ?? undefined,
      location: body.location ?? undefined,
      salaryMin:
        salaryStringToCents(body.salaryMin ?? undefined, period) ?? null,
      salaryMax:
        salaryStringToCents(body.salaryMax ?? undefined, period) ?? null,
      salaryPeriod: period,
      appliedAt: body.appliedAt ?? undefined,
      source: body.source ?? undefined,
      resumeId: body.resumeId ?? undefined,
    });
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <Link href={`/applications/${id}`} className={styles.backLink}>
            Application
          </Link>
          <h1 className={styles.title}>Edit application</h1>
        </div>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="jobTitle" className={styles.label}>
              Job title
            </label>
            <input
              id="jobTitle"
              name="jobTitle"
              type="text"
              value={values.jobTitle ?? ""}
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
              <label htmlFor="salaryPeriod" className={styles.label}>
                Salary type
              </label>
              <select
                id="salaryPeriod"
                name="salaryPeriod"
                value={values.salaryPeriod ?? "yearly"}
                onChange={handleChange}
                className={styles.select}
                disabled={isPending}
              >
                <option value="yearly">Yearly</option>
                <option value="hourly">Hourly</option>
              </select>
            </div>
            <div className={styles.field}>
              <label htmlFor="salaryMin" className={styles.label}>
                Salary min
              </label>
              <input
                id="salaryMin"
                name="salaryMin"
                type="text"
                inputMode="decimal"
                value={
                  values.salaryMin === undefined || values.salaryMin === null
                    ? ""
                    : String(values.salaryMin)
                }
                onChange={handleChange}
                className={styles.input}
                placeholder={
                  (values.salaryPeriod ?? "yearly") === "hourly"
                    ? "e.g. $75.00"
                    : "e.g. 150,000"
                }
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
                type="text"
                inputMode="decimal"
                value={
                  values.salaryMax === undefined || values.salaryMax === null
                    ? ""
                    : String(values.salaryMax)
                }
                onChange={handleChange}
                className={styles.input}
                placeholder={
                  (values.salaryPeriod ?? "yearly") === "hourly"
                    ? "e.g. $85.00"
                    : "e.g. 180,000"
                }
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
              value={
                values.appliedAt && values.appliedAt !== ""
                  ? String(values.appliedAt).slice(0, 10)
                  : ""
              }
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
                : "Failed to update application"}
            </p>
          )}

          <div className={styles.actions}>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={isPending}
            >
              {isPending ? "Saving…" : "Save changes"}
            </button>
            <Link href={`/applications/${id}`} className={styles.cancelLink}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
