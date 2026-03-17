"use client";

import Link from "next/link";
import { useCurrentUser } from "@/features/layout/hooks/useCurrentUser";
import { getWelcomeName } from "@/features/layout/utils";
import { useApplicationsList } from "@/features/applications/hooks/useApplicationsList";
import { useResumesList } from "@/features/resumes/hooks/useResumesList";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";
import styles from "./Dashboard.module.css";

const STATUS_PILL_MODIFIERS: Record<string, string> = {
  saved: "statusPill_saved",
  applied: "statusPill_applied",
  interviewing: "statusPill_interviewing",
  offer: "statusPill_offer",
  rejected: "statusPill_rejected",
};

function getStatusPillClass(status: string): string {
  return styles[STATUS_PILL_MODIFIERS[status] as keyof typeof styles] ?? "";
}

function headerInitials(displayName: string | null, email: string): string {
  const name = getWelcomeName(displayName, email);
  if (name === "User") return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Dashboard() {
  const { data: user } = useCurrentUser();
  const {
    data: metricsData,
    isPending,
    isError,
    error,
  } = useDashboardMetrics();
  const { data: applicationsData } = useApplicationsList(1, 5);
  const { data: resumesData } = useResumesList(1, 1);

  if (isPending && !metricsData) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
            <p className={styles.welcome}>Loading…</p>
          </div>
        </div>
        <p className={styles.status}>Loading metrics…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Dashboard</h1>
          </div>
        </div>
        <p className={styles.error}>
          Failed to load metrics:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  const m = metricsData.data;
  const recentApps = applicationsData?.items ?? [];
  const resumeTotal = resumesData?.total ?? 0;
  const hasData = m.totalApplications > 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.welcome}>
            Welcome back,{" "}
            {user ? getWelcomeName(user.displayName, user.email) : "User"}!
          </p>
        </div>
        {user && (
          <div className={styles.headerAvatar} aria-hidden>
            {headerInitials(user.displayName, user.email)}
          </div>
        )}
      </div>

      {!hasData && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No applications yet</p>
          <p className={styles.emptyText}>
            Add your first job application to see metrics here.
          </p>
          <Link href="/applications/new" className={styles.emptyLink}>
            Add application
          </Link>
        </div>
      )}

      <div className={styles.cardsGrid}>
        <section className={styles.card} aria-labelledby="overview-heading">
          <h2 id="overview-heading" className={styles.cardTitle}>
            Overview
          </h2>
          <div className={styles.overviewStats}>
            <div className={styles.overviewStat}>
              <span className={styles.overviewStatValue}>
                {m.activeApplications}
              </span>
              <span className={styles.overviewStatLabel}>Open Jobs</span>
            </div>
            <div className={styles.overviewStat}>
              <span className={styles.overviewStatValue}>
                {m.totalApplications}
              </span>
              <span className={styles.overviewStatLabel}>Applications</span>
            </div>
            <div className={styles.overviewStat}>
              <span className={styles.overviewStatValue}>
                {m.applicationsByStatus.interviewing}
              </span>
              <span className={styles.overviewStatLabel}>Interviewing</span>
            </div>
          </div>
        </section>

        <section className={styles.card} aria-labelledby="stats-heading">
          <h2 id="stats-heading" className={styles.cardTitle}>
            Job Application Stats
          </h2>
          <p className={styles.placeholder}>Chart coming soon.</p>
        </section>

        <section className={styles.card} aria-labelledby="recent-heading">
          <div className={styles.cardTitleRow}>
            <h2 id="recent-heading" className={styles.cardTitle}>
              Recent Applications
            </h2>
            <Link href="/applications" className={styles.viewAll}>
              View All &gt;
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <p className={styles.placeholder}>No applications yet.</p>
          ) : (
            <ul className={styles.recentList}>
              {recentApps.map((app) => (
                <li key={app.id} className={styles.recentItem}>
                  <Link
                    href={`/applications/${app.id}`}
                    className={styles.recentLink}
                  >
                    <span className={styles.recentJobTitle}>
                      {app.jobTitle}
                    </span>
                    <span className={styles.recentMeta}>
                      {app.companyId ? "Company" : "—"}
                    </span>
                    <span
                      className={`${styles.statusPill} ${getStatusPillClass(app.status)}`}
                    >
                      {app.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className={styles.card} aria-labelledby="progress-heading">
          <h2 id="progress-heading" className={styles.cardTitle}>
            Job Search Progress
          </h2>
          <div className={styles.progressList}>
            <div className={styles.progressRow}>
              <span className={styles.progressLabel}>Saved Jobs</span>
              <span className={styles.progressValue}>
                {m.applicationsByStatus.saved}
              </span>
            </div>
            <div className={styles.progressRow}>
              <span className={styles.progressLabel}>Resumes Uploaded</span>
              <span className={styles.progressValue}>{resumeTotal}</span>
            </div>
            <div className={styles.progressRow}>
              <span className={styles.progressLabel}>Contacts</span>
              <span className={styles.progressValue}>0</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
