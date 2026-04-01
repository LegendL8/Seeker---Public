"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCompaniesList } from "./hooks/useCompaniesList";
import type { Company } from "./types";
import styles from "./CompaniesList.module.css";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const SEARCH_DEBOUNCE_MS = 300;

export function CompaniesList() {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [search]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSearch(e.target.value);
    setPage(1);
  }

  const { data, isPending, isError, error } = useCompaniesList(
    page,
    DEFAULT_LIMIT,
    debouncedSearch || undefined,
  );

  const items: Company[] = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_LIMIT));
  const start = total === 0 ? 0 : (page - 1) * DEFAULT_LIMIT + 1;
  const end = Math.min(page * DEFAULT_LIMIT, total);
  const showEmpty =
    data != null && total === 0 && !isPending && debouncedSearch === "";
  const showNoMatches =
    data != null && total === 0 && debouncedSearch.length > 0 && !isPending;

  if (isPending && !data) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Companies</h1>
        </div>
        <p className={styles.status}>Loading companies…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Companies</h1>
        </div>
        <p className={styles.error}>
          Failed to load companies:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Companies</h1>
        <Link href="/companies/new" className={styles.addLink}>
          Add company
        </Link>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search by name, site, industry"
            value={search}
            onChange={handleSearchChange}
            aria-label="Search companies"
          />
        </div>
      </div>

      {showEmpty && (
        <p className={styles.empty}>
          No companies yet. <Link href="/companies/new">Add a company</Link> to
          link it from applications.
        </p>
      )}

      {showNoMatches && (
        <p className={styles.empty}>No companies match your search.</p>
      )}

      {!showEmpty && !showNoMatches && items.length > 0 && (
        <>
          <ul className={styles.list}>
            {items.map((c) => (
              <li key={c.id} className={styles.row}>
                <div className={styles.rowMain}>
                  <Link href={`/companies/${c.id}`} className={styles.nameLink}>
                    {c.name}
                  </Link>
                  <span className={styles.meta}>
                    {[c.industry, c.website].filter(Boolean).join(" · ") ||
                      "No industry or website"}
                  </span>
                </div>
                <Link href={`/companies/${c.id}`} className={styles.viewLink}>
                  View
                </Link>
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <nav
              className={styles.pagination}
              aria-label="Companies pagination"
            >
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                Previous
              </button>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                Next
              </button>
              <span className={styles.pageInfo}>
                {start}–{end} of {total}
              </span>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
