"use client";

import { useState } from "react";
import { useNotesList } from "./hooks/useNotesList";
import { useDeleteNote } from "./hooks/useDeleteNote";
import { useApplicationsList } from "@/features/applications/hooks/useApplicationsList";
import { NoteEditor } from "./NoteEditor";
import { AddNoteForm } from "./AddNoteForm";
import type { Note } from "./types";
import styles from "./NotesList.module.css";

const TYPE_TAGS = [
  { value: "", label: "All Categories" },
  { value: "general", label: "General" },
  { value: "interview", label: "Interview" },
  { value: "job_description", label: "Job description" },
  { value: "research", label: "Research" },
];

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function filterBySearch(items: Note[], search: string): Note[] {
  if (!search.trim()) return items;
  const q = search.trim().toLowerCase();
  return items.filter((n) => n.content.toLowerCase().includes(q));
}

const APPLICATIONS_PAGE = 1;
const APPLICATIONS_LIMIT = 100;

export function NotesList() {
  const [page, setPage] = useState(DEFAULT_PAGE);
  const [typeTag, setTypeTag] = useState<string>("");
  const [applicationId, setApplicationId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormInitialTypeTag, setAddFormInitialTypeTag] = useState<
    string | undefined
  >(undefined);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const query = {
    page,
    limit: DEFAULT_LIMIT,
    typeTag: typeTag || undefined,
    applicationId: applicationId || undefined,
  };
  const { data, isPending, isError, error } = useNotesList(query);
  const { data: applicationsData } = useApplicationsList(
    APPLICATIONS_PAGE,
    APPLICATIONS_LIMIT,
  );
  const applications = applicationsData?.items ?? [];
  const deleteMutation = useDeleteNote();

  const rawItems = data?.items ?? [];
  const items = filterBySearch(rawItems, search);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_LIMIT));
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  function handleDelete(id: string) {
    if (
      typeof window !== "undefined" &&
      window.confirm("Delete this note? This cannot be undone.")
    ) {
      deleteMutation.mutate(id);
      if (selectedId === id) setSelectedId(null);
    }
  }

  const showEmptyState =
    data != null && total === 0 && !showAddForm;

  if (isError) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Notes</h1>
        </div>
        <p className={styles.error}>
          {error instanceof Error ? error.message : "Failed to load notes"}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Notes</h1>
        <button
          type="button"
          className={styles.addBtn}
          onClick={() => {
            setAddFormInitialTypeTag(undefined);
            setShowAddForm(true);
            setSelectedId(null);
          }}
        >
          + Add Note
        </button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon} aria-hidden>Q</span>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search notes"
          />
        </div>
        <select
          className={styles.categorySelect}
          value={typeTag}
          onChange={(e) => {
            setTypeTag(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by category"
        >
          {TYPE_TAGS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          className={styles.categorySelect}
          value={applicationId}
          onChange={(e) => {
            setApplicationId(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by application"
        >
          <option value="">All applications</option>
          {applications.map((app) => (
            <option key={app.id} value={app.id}>
              {app.jobTitle}
            </option>
          ))}
        </select>
        <div className={styles.viewToggles} role="tablist" aria-label="View mode">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "list"}
            className={
              viewMode === "list"
                ? `${styles.viewTab} ${styles.viewTabActive}`
                : styles.viewTab
            }
            onClick={() => setViewMode("list")}
          >
            List
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "grid"}
            className={
              viewMode === "grid"
                ? `${styles.viewTab} ${styles.viewTabActive}`
                : styles.viewTab
            }
            onClick={() => setViewMode("grid")}
          >
            Grid
          </button>
        </div>
      </div>

      {showEmptyState ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIllustration} aria-hidden>
            <span className={styles.emptyIllustrationIcon}>N</span>
          </div>
          <h2 className={styles.emptyTitle}>Stay Organized</h2>
          <p className={styles.emptyText}>
            Keep track of important notes related to your job search here. Add
            categories, tags, and link notes to specific job applications,
            contacts, or companies.
          </p>
          <div className={styles.emptyPills}>
            {TYPE_TAGS.filter((t) => t.value).map((t) => (
              <button
                key={t.value}
                type="button"
                className={styles.emptyPill}
                onClick={() => {
                  setAddFormInitialTypeTag(t.value);
                  setShowAddForm(true);
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={styles.emptyCta}
            onClick={() => {
              setAddFormInitialTypeTag(undefined);
              setShowAddForm(true);
            }}
          >
            + Add Your First Note
          </button>
        </div>
      ) : (
      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          {isPending && !data ? (
            <p className={styles.status}>Loading…</p>
          ) : (
            <ul
              className={
                viewMode === "grid"
                  ? `${styles.notesList} ${styles.notesListGrid}`
                  : styles.notesList
              }
            >
              {items.map((note: Note) => (
                <li key={note.id}>
                  <button
                    type="button"
                    className={`${styles.noteItem} ${selectedId === note.id ? styles.noteItemActive : ""}`}
                    onClick={() => {
                      setSelectedId(note.id);
                      setShowAddForm(false);
                    }}
                  >
                    <span className={styles.noteItemMeta}>
                      {formatDate(note.updatedAt)} · {note.typeTag}
                    </span>
                    <div className={styles.notePreview}>{note.content}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {data && items.length > 0 && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!hasPrev}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className={styles.pageBtn}
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
              >
                Next
              </button>
            </div>
          )}
        </aside>

        <div className={styles.detail}>
          {showAddForm ? (
            <AddNoteForm
              key={addFormInitialTypeTag ?? "default"}
              applications={applications}
              initialTypeTag={addFormInitialTypeTag}
              onSuccess={() => {
                setShowAddForm(false);
              }}
            />
          ) : selectedId ? (
            <>
              <NoteEditor
                noteId={selectedId}
                applications={applications}
              />
              <div className={styles.detailActions}>
                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(selectedId)}
                  disabled={deleteMutation.isPending}
                >
                  Delete note
                </button>
              </div>
            </>
          ) : (
            <p className={styles.detailEmpty}>
              Select a note or add a new one.
            </p>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
