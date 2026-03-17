"use client";

import Link from "next/link";
import { useState } from "react";
import { useApplicationsList } from "./hooks/useApplicationsList";
import type { Application } from "./types";
import styles from "./ApplicationsList.module.css";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 6;

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interview" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "saved", label: "Saved" },
] as const;

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

/** API stores salary in cents (per schema). */
function formatSalary(min: number | null, max: number | null): string {
  if (min == null && max == null) return "—";
  const fmt = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "decimal" }).format(
      Math.round(cents / 100),
    );
  if (min != null && max != null) return `$${fmt(min)}–$${fmt(max)}`;
  if (min != null) return `$${fmt(min)}`;
  return `$${fmt(max!)}`;
}

function getStatusPillClass(status: string): string {
  const map: Record<string, string> = {
    saved: styles.pillSaved,
    applied: styles.pillApplied,
    interviewing: styles.pillInterviewing,
    offer: styles.pillOffer,
    rejected: styles.pillRejected,
  };
  return map[status] ?? "";
}

function filterItems(
  items: Application[],
  statusTab: string,
  search: string,
): Application[] {
  let out = items;
  if (statusTab !== "all") {
    out = out.filter((a) => a.status === statusTab);
  }
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    out = out.filter((a) => a.jobTitle.toLowerCase().includes(q));
  }
  return out;
}

function countByStatus(items: Application[], status: string): number {
  if (status === "all") return items.length;
  return items.filter((a) => a.status === status).length;
}

export function ApplicationsList() {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [statusTab, setStatusTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const { data, isPending, isError, error } = useApplicationsList(
    page,
    DEFAULT_LIMIT,
  );

  if (isPending && !data) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Applications</h1>
        </div>
        <p className={styles.status}>Loading applications…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Applications</h1>
        </div>
        <p className={styles.error}>
          Failed to load applications:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  const { items, total, limit } = data;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const filtered = filterItems(items, statusTab, search);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((a) => a.id)));
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Applications</h1>
        <Link href="/applications/new" className={styles.addLink}>
          Add application
        </Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden>
            Q
          </span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search jobs"
          />
        </div>
        <select className={styles.stageSelect} aria-label="Filter by stage">
          <option>All Stages</option>
        </select>
      </div>

      <div className={styles.tabs} role="tablist">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.value === "all" ? total : countByStatus(items, tab.value);
          const isSelected = statusTab === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={
                isSelected ? `${styles.tab} ${styles.tabActive}` : styles.tab
              }
              onClick={() => setStatusTab(tab.value)}
            >
              {tab.label} {count}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>
          No applications yet.{" "}
          <Link href="/applications/new" className={styles.emptyLink}>
            Add one
          </Link>{" "}
          to get started.
        </p>
      ) : (
        <>
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={
                    filtered.length > 0 && selectedIds.size === filtered.length
                  }
                  onChange={toggleSelectAll}
                  aria-label="Select all on page"
                />
              </label>
              <span className={styles.tableHeaderTitle}>Job Applied</span>
              <span className={styles.tableHeaderRange}>
                {start}–{end} of {total} Applications
              </span>
              <div className={styles.tableHeaderActions}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  aria-label="View toggle"
                >
                  —
                </button>
                <button type="button" className={styles.archivedBtn}>
                  Archived
                </button>
              </div>
            </div>

            <ul className={styles.rowList}>
              {filtered.map((app) => (
                <li key={app.id} className={styles.row}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(app.id)}
                      onChange={() => toggleSelect(app.id)}
                      aria-label={`Select ${app.jobTitle}`}
                    />
                  </label>
                  <div className={styles.jobCell}>
                    <span className={styles.logoPlaceholder} aria-hidden>
                      {app.jobTitle.slice(0, 1).toUpperCase()}
                    </span>
                    <div className={styles.jobMeta}>
                      <Link
                        href={`/applications/${app.id}`}
                        className={styles.jobTitleLink}
                      >
                        {app.jobTitle}
                      </Link>
                      <span className={styles.companyLine}>
                        {app.companyId ? "Company" : "—"}
                        {app.location ? `, ${app.location}` : ""}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`${styles.pill} ${getStatusPillClass(app.status)}`}
                  >
                    {app.status}
                  </span>
                  <span className={styles.dateCell}>
                    Applied {formatDate(app.appliedAt)}
                  </span>
                  <span className={styles.salaryCell}>
                    {formatSalary(app.salaryMin, app.salaryMax)}
                  </span>
                  <Link
                    href={`/applications/${app.id}`}
                    className={styles.viewBtn}
                  >
                    View Application
                  </Link>
                  <div className={styles.menuWrap}>
                    <button
                      type="button"
                      className={styles.menuBtn}
                      aria-expanded={menuOpenId === app.id}
                      aria-haspopup="true"
                      aria-label="Actions"
                      onClick={() =>
                        setMenuOpenId((id) => (id === app.id ? null : app.id))
                      }
                    >
                      …
                    </button>
                    {menuOpenId === app.id && (
                      <div className={styles.menuDropdown}>
                        <Link
                          href={`/applications/${app.id}/edit`}
                          className={styles.menuItem}
                          onClick={() => setMenuOpenId(null)}
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/applications/${app.id}`}
                          className={styles.menuItem}
                          onClick={() => setMenuOpenId(null)}
                        >
                          View
                        </Link>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <nav
            className={styles.pagination}
            aria-label="Applications pagination"
          >
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage(1)}
              aria-label="First page"
            >
              &laquo;
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              &lsaquo;
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={
                  p === page
                    ? `${styles.pageBtn} ${styles.pageBtnActive}`
                    : styles.pageBtn
                }
                onClick={() => setPage(p)}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              &rsaquo;
            </button>
            <button
              type="button"
              className={styles.pageBtn}
              disabled={page >= totalPages}
              onClick={() => setPage(totalPages)}
              aria-label="Last page"
            >
              &raquo;
            </button>
            <span className={styles.pageInfo}>
              {start}–{end} of {total} Applications
            </span>
          </nav>
        </>
      )}
    </div>
  );
}
