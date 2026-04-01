"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useCompany } from "@/features/companies/hooks/useCompany";
import { InterviewList } from "@/features/interviews/InterviewList";
import { useInterviewsForApplication } from "@/features/interviews/hooks/useInterviewsForApplication";
import { useApplication } from "./hooks/useApplication";
import { useDeleteApplication } from "./hooks/useDeleteApplication";
import styles from "./ApplicationDetail.module.css";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

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

/** API stores salary in cents (yearly cents or hourly cents per salaryPeriod). */
function formatSalary(
  min: number | null,
  max: number | null,
  period: "yearly" | "hourly" = "yearly",
): string {
  if (min == null && max == null) return "—";
  const dollars = (cents: number) => cents / 100;
  if (period === "hourly") {
    const fmt = (c: number) => `$${dollars(c).toFixed(2)}`;
    const suffix = " /hr";
    if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}${suffix}`;
    if (min != null) return `${fmt(min)}${suffix}`;
    return `${fmt(max!)}${suffix}`;
  }
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "decimal" }).format(
      Math.round(dollars(cents)),
    );
  if (min != null && max != null) return `$${fmt(min)} – $${fmt(max)}`;
  if (min != null) return `$${fmt(min)}`;
  return `$${fmt(max!)}`;
}

function CompanyDetailRow({ companyId }: { companyId: string | null }) {
  const { data, isPending } = useCompany(companyId);
  if (!companyId) {
    return <dd className={styles.dd}>—</dd>;
  }
  if (isPending) {
    return <dd className={styles.dd}>Loading…</dd>;
  }
  if (!data) {
    return <dd className={styles.dd}>—</dd>;
  }
  return (
    <dd className={styles.dd}>
      <Link href={`/companies/${data.id}`} className={styles.externalLink}>
        {data.name}
      </Link>
    </dd>
  );
}

export function ApplicationDetail() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;
  const { data: application, isPending, isError, error } = useApplication(id);
  useInterviewsForApplication(id);
  const deleteMutation = useDeleteApplication(id ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (id === null) {
    return <p className={styles.error}>Invalid application id.</p>;
  }

  if (isPending && !application) {
    return <p className={styles.status}>Loading…</p>;
  }

  if (isError || !application) {
    return (
      <p className={styles.error}>
        {error instanceof Error ? error.message : "Application not found."}
      </p>
    );
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteMutation.mutate();
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <Link href="/applications" className={styles.backLink}>
            Applications
          </Link>
          <h1 className={styles.title}>{application.jobTitle}</h1>
        </div>
        <div className={styles.actions}>
          <Link href={`/applications/${id}/edit`} className={styles.link}>
            Edit
          </Link>
        </div>
      </div>

      <div className={styles.card}>
        <dl className={styles.dl}>
          <dt className={styles.dt}>Status</dt>
          <dd className={styles.dd}>{application.status}</dd>

          <dt className={styles.dt}>Location</dt>
          <dd className={styles.dd}>{application.location ?? "—"}</dd>

          <dt className={styles.dt}>Job posting URL</dt>
          <dd className={styles.dd}>
            {application.jobPostingUrl ? (
              <a
                href={application.jobPostingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                {application.jobPostingUrl}
              </a>
            ) : (
              "—"
            )}
          </dd>

          <dt className={styles.dt}>Salary</dt>
          <dd className={styles.dd}>
            {formatSalary(
              application.salaryMin,
              application.salaryMax,
              application.salaryPeriod ?? "yearly",
            )}
          </dd>

          <dt className={styles.dt}>Applied date</dt>
          <dd className={styles.dd}>{formatDate(application.appliedAt)}</dd>

          <dt className={styles.dt}>Source</dt>
          <dd className={styles.dd}>{application.source ?? "—"}</dd>

          <dt className={styles.dt}>Company</dt>
          <CompanyDetailRow companyId={application.companyId} />

          <dt className={styles.dt}>Created</dt>
          <dd className={styles.dd}>{formatDateTime(application.createdAt)}</dd>

          <dt className={styles.dt}>Updated</dt>
          <dd className={styles.dd}>{formatDateTime(application.updatedAt)}</dd>
        </dl>
      </div>

      <div className={styles.card}>
        <InterviewList applicationId={application.id} />
      </div>

      <div className={styles.deleteSection}>
        {confirmDelete ? (
          <div className={styles.deleteConfirm}>
            <p className={styles.deleteText}>
              Delete this application? This cannot be undone.
            </p>
            <div className={styles.deleteActions}>
              <button
                type="button"
                className={styles.deleteBtn}
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setConfirmDelete(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDelete}
          >
            Delete application
          </button>
        )}
      </div>
    </div>
  );
}
