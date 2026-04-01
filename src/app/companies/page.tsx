import { CompaniesList } from "@/features/companies/CompaniesList";
import styles from "./page.module.css";

export default function CompaniesPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <CompaniesList />
      </main>
    </div>
  );
}
