'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useApplicationsList } from './hooks/useApplicationsList';
import styles from './ApplicationsList.module.css';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

export function ApplicationsList() {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const { data, isPending, isError, error } = useApplicationsList(page, DEFAULT_LIMIT);

  if (isPending && !data) {
    return <p className={styles.status}>Loading applications…</p>;
  }

  if (isError) {
    return (
      <p className={styles.error}>
        Failed to load applications: {error instanceof Error ? error.message : 'Unknown error'}
      </p>
    );
  }

  const { items, total, limit } = data;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Applications</h2>
        <div className={styles.headerActions}>
          <Link href="/notes" className={styles.addLink}>
            Notes
          </Link>
          <Link href="/applications/new" className={styles.addLink}>
            Add application
          </Link>
        </div>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>
          No applications yet. Add one to get started.
        </p>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Job title</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Location</th>
                <th className={styles.th}>Applied</th>
              </tr>
            </thead>
            <tbody>
              {items.map((app) => (
                <tr key={app.id}>
                  <td className={styles.td}>
                    <Link href={`/applications/${app.id}`} className={styles.cellLink}>
                      {app.jobTitle}
                    </Link>
                  </td>
                  <td className={styles.td}>{app.status}</td>
                  <td className={styles.td}>{app.location ?? '—'}</td>
                  <td className={styles.td}>{formatDate(app.appliedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Applications pagination">
              <button
                type="button"
                className={styles.pageBtn}
                disabled={!hasPrev}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages} ({total} total)
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={!hasNext}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
