"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EditApplicationForm } from "@/features/applications/EditApplicationForm";
import { useApplication } from "@/features/applications/hooks/useApplication";
import styles from "../../page.module.css";

export default function EditApplicationPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;
  const { data: application, isPending, isError, error } = useApplication(id);

  if (id === null) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p>Invalid application id.</p>
          <Link href="/applications">Back to applications</Link>
        </main>
      </div>
    );
  }

  if (isPending && !application) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p>Loading…</p>
        </main>
      </div>
    );
  }

  if (isError || !application) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p>
            {error instanceof Error ? error.message : "Application not found."}
          </p>
          <Link href="/applications">Back to applications</Link>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <EditApplicationForm application={application} id={id} />
      </main>
    </div>
  );
}
