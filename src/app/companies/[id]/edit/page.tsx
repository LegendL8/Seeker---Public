"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { EditCompanyForm } from "@/features/companies/EditCompanyForm";
import { useCompany } from "@/features/companies/hooks/useCompany";
import styles from "../../page.module.css";

export default function EditCompanyPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;
  const { data: company, isPending, isError, error } = useCompany(id);

  if (id === null) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p>Invalid company id.</p>
          <Link href="/companies">Back to companies</Link>
        </main>
      </div>
    );
  }

  if (isPending && !company) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p>Loading…</p>
        </main>
      </div>
    );
  }

  if (isError || !company) {
    return (
      <div className={styles.page}>
        <main className={styles.main}>
          <p>{error instanceof Error ? error.message : "Company not found."}</p>
          <Link href="/companies">Back to companies</Link>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <EditCompanyForm company={company} id={id} />
      </main>
    </div>
  );
}
