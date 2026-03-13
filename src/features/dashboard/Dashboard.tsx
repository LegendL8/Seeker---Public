"use client";

import Link from "next/link";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";
import styles from "./Dashboard.module.css";

function formatRate(rate: number): string {
  if (rate === 0) return "0%";
  const pct = rate * 100;
  return pct % 1 === 0 ? `${pct}%` : `${pct.toFixed(1)}%`;
}

export function Dashboard() {
  const { data, isPending, isError, error } = useDashboardMetrics();

  if (isPending && !data) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
        </div>
        <p className={styles.status}>Loading metrics…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Dashboard</h1>
        </div>
        <p className={styles.error}>
          Failed to load metrics:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
      </div>
    );
  }

  const m = data.data;
  const hasData = m.totalApplications > 0;

  const topStats = [
    {
      label: "Total applications",
      value: String(m.totalApplications),
      accent: "blue" as const,
    },
    {
      label: "Interview rate",
      value: formatRate(m.interviewRate),
      accent: "purple" as const,
    },
    {
      label: "Saved",
      value: String(m.applicationsByStatus.saved),
      accent: null,
    },
    {
      label: "Interviewing",
      value: String(m.applicationsByStatus.interviewing),
      accent: null,
    },
  ];

  const rightStats = [
    { label: "Applied", value: String(m.applicationsByStatus.applied) },
    { label: "Rejections", value: String(m.rejectionsReceived) },
    { label: "Saved", value: String(m.applicationsByStatus.saved) },
    {
      label: "Interviewing",
      value: String(m.applicationsByStatus.interviewing),
    },
    { label: "Offer", value: String(m.applicationsByStatus.offer) },
    { label: "Active", value: String(m.activeApplications) },
  ];

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
      </div>

      <div className={styles.topMetrics}>
        {topStats.map((s) => (
          <div key={s.label} className={styles.metricCard}>
            <div className={styles.metricCardLabel}>{s.label}</div>
            <div
              className={
                s.accent === "blue"
                  ? `${styles.metricCardValue} ${styles.metricCardValue_accentBlue}`
                  : s.accent === "purple"
                    ? `${styles.metricCardValue} ${styles.metricCardValue_accentPurple}`
                    : styles.metricCardValue
              }
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.mainRow}>
        <div className={styles.notificationCard}>
          <p className={styles.notificationPlaceholder}>
            No notifications yet. This section will be repurposed later.
          </p>
        </div>

        <div className={styles.statsCard}>
          <div className={styles.statsGrid}>
            {rightStats.map((s) => (
              <div key={s.label} className={styles.statsCell}>
                <div className={styles.statsCellLabel}>{s.label}</div>
                <div className={styles.statsCellValue}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
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
    </div>
  );
}
