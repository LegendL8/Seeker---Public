"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useCompany } from "./hooks/useCompany";
import { useDeleteCompany } from "./hooks/useDeleteCompany";
import styles from "./CompanyDetail.module.css";

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

export function CompanyDetail() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;
  const { data: company, isPending, isError, error } = useCompany(id);
  const deleteMutation = useDeleteCompany();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (id === null) {
    return <p className={styles.error}>Invalid company id.</p>;
  }

  if (isPending && !company) {
    return <p className={styles.status}>Loading…</p>;
  }

  if (isError || !company) {
    return (
      <p className={styles.error}>
        {error instanceof Error ? error.message : "Company not found."}
      </p>
    );
  }

  const companyIdForDelete = company.id;

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    deleteMutation.mutate(companyIdForDelete);
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div>
          <Link href="/companies" className={styles.backLink}>
            Companies
          </Link>
          <h1 className={styles.title}>{company.name}</h1>
        </div>
        <div className={styles.actions}>
          <Link href={`/companies/${id}/edit`} className={styles.link}>
            Edit
          </Link>
        </div>
      </div>

      <div className={styles.card}>
        <dl className={styles.dl}>
          <dt className={styles.dt}>Website</dt>
          <dd className={styles.dd}>
            {company.website ? (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.externalLink}
              >
                {company.website}
              </a>
            ) : (
              "—"
            )}
          </dd>

          <dt className={styles.dt}>Industry</dt>
          <dd className={styles.dd}>{company.industry ?? "—"}</dd>

          <dt className={styles.dt}>Created</dt>
          <dd className={styles.dd}>{formatDateTime(company.createdAt)}</dd>

          <dt className={styles.dt}>Updated</dt>
          <dd className={styles.dd}>{formatDateTime(company.updatedAt)}</dd>
        </dl>
      </div>

      <div className={styles.deleteSection}>
        {confirmDelete ? (
          <div className={styles.deleteConfirm}>
            <p className={styles.deleteText}>
              Delete this company? Applications linked to it will keep their
              records but the company link will be cleared.
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
            Delete company
          </button>
        )}
      </div>
    </div>
  );
}
