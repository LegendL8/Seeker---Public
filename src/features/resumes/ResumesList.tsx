"use client";

import { useEffect, useRef, useState } from "react";
import { useResumesList } from "./hooks/useResumesList";
import { useUploadResume } from "./hooks/useUploadResume";
import { useResumeWithUrl } from "./hooks/useResumeWithUrl";
import { useSetActiveResume } from "./hooks/useSetActiveResume";
import { useDeleteResume } from "./hooks/useDeleteResume";
import type { Resume } from "./types";
import styles from "./ResumesList.module.css";

const RESUME_CAP = 1;
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const ALLOWED_TYPES = ".pdf,.docx";
const MAX_SIZE_MB = 5;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function filterBySearch(items: Resume[], search: string): Resume[] {
  if (!search.trim()) return items;
  const q = search.trim().toLowerCase();
  return items.filter((r) => r.fileName.toLowerCase().includes(q));
}

function ResumeItem({ resume }: { resume: Resume }) {
  const [previewing, setPreviewing] = useState(false);
  const { data: withUrl, isPending: urlPending } = useResumeWithUrl(
    previewing ? resume.id : null,
  );
  const setActiveMutation = useSetActiveResume();
  const deleteMutation = useDeleteResume();

  function handlePreview() {
    setPreviewing(true);
  }

  useEffect(() => {
    if (previewing && withUrl?.signedUrl) {
      window.open(withUrl.signedUrl, "_blank", "noopener,noreferrer");
      const t = setTimeout(() => setPreviewing(false), 0);
      return () => clearTimeout(t);
    }
  }, [previewing, withUrl?.signedUrl]);

  function handleSetActive() {
    setActiveMutation.mutate({ id: resume.id, isActive: true });
  }

  function handleDelete() {
    if (
      typeof window !== "undefined" &&
      window.confirm("Delete this resume? This cannot be undone.")
    ) {
      deleteMutation.mutate(resume.id);
    }
  }

  return (
    <div className={styles.item}>
      <div className={styles.itemInfo}>
        <p className={styles.itemName}>{resume.fileName}</p>
        <p className={styles.itemMeta}>
          {resume.fileType.toUpperCase()} – {formatBytes(resume.fileSizeBytes)}
          {resume.isActive && (
            <>
              {" · "}
              <span className={styles.badge}>Active</span>
            </>
          )}
        </p>
      </div>
      <div className={styles.itemActions}>
        <button
          type="button"
          className={styles.btn}
          onClick={handlePreview}
          disabled={urlPending}
        >
          {urlPending ? "Loading…" : "Preview"}
        </button>
        {!resume.isActive && (
          <button
            type="button"
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleSetActive}
            disabled={setActiveMutation.isPending}
          >
            Set active
          </button>
        )}
        <button
          type="button"
          className={`${styles.btn} ${styles.btnDanger}`}
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function ResumesList() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [search, setSearch] = useState("");
  const { data, isPending, isError, error } = useResumesList(
    page,
    DEFAULT_LIMIT,
  );
  const uploadMutation = useUploadResume();

  const rawItems = data?.items ?? [];
  const items = filterBySearch(rawItems, search);
  const total = data?.total ?? 0;
  const limit = data?.limit ?? DEFAULT_LIMIT;
  const atCap = total >= RESUME_CAP;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;
  const showEmptyState = data != null && total === 0;

  function triggerUpload() {
    if (atCap || uploadMutation.isPending) return;
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) return;
    uploadMutation.mutate(file, {
      onSuccess: () => {
        e.target.value = "";
      },
    });
  }

  if (isError) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Resume Management</h1>
        </div>
        <p className={styles.error}>
          {error instanceof Error ? error.message : "Failed to load resumes"}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES}
        className={styles.hiddenInput}
        onChange={handleFileChange}
        aria-hidden
      />

      <div className={styles.header}>
        <h1 className={styles.title}>Resume Management</h1>
        <button
          type="button"
          className={styles.uploadBtnHeader}
          onClick={triggerUpload}
          disabled={atCap || uploadMutation.isPending}
        >
          + Upload Resume
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden>Q</span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search resumes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search resumes"
          />
        </div>
        <select
          className={styles.filterSelect}
          aria-label="Filter by job title"
        >
          <option>All Job Titles</option>
        </select>
      </div>

      {(uploadMutation.isError || (atCap && !showEmptyState)) && (
        <div className={styles.uploadStatus}>
          {uploadMutation.isError && (
            <p className={styles.error}>
              {uploadMutation.error instanceof Error
                ? uploadMutation.error.message
                : "Upload failed"}
            </p>
          )}
          {atCap && !showEmptyState && (
            <p className={styles.capMessage}>
              You can store {RESUME_CAP} resume. Delete one to upload another.
            </p>
          )}
        </div>
      )}

      {showEmptyState ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIllustration} aria-hidden>
            <span className={styles.emptyIllustrationIcon}>R</span>
          </div>
          <h2 className={styles.emptyTitle}>Manage Resumes</h2>
          <p className={styles.emptyText}>
            Upload and manage your resumes for targeted job applications. Keep
            track of resume versions and visibility settings here.
          </p>
          <button
            type="button"
            className={styles.emptyCta}
            onClick={triggerUpload}
            disabled={atCap || uploadMutation.isPending}
          >
            + Upload Your First Resume
          </button>
          {uploadMutation.isError && (
            <p className={styles.error}>
              {uploadMutation.error instanceof Error
                ? uploadMutation.error.message
                : "Upload failed"}
            </p>
          )}
          {uploadMutation.isPending && (
            <p className={styles.status}>Uploading…</p>
          )}
        </div>
      ) : (
        <>
          {isPending && !data ? (
            <p className={styles.status}>Loading resumes…</p>
          ) : (
            <div className={styles.list}>
              {items.map((r) => (
                <ResumeItem key={r.id} resume={r} />
              ))}
            </div>
          )}
          {data && totalPages > 1 && (
            <nav className={styles.pagination} aria-label="Resumes pagination">
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
