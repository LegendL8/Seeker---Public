import { CompanyDetail } from "@/features/companies/CompanyDetail";
import styles from "../page.module.css";

export default function CompanyDetailPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <CompanyDetail />
      </main>
    </div>
  );
}
