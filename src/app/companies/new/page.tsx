import { AddCompanyForm } from "@/features/companies/AddCompanyForm";
import styles from "../page.module.css";

export default function NewCompanyPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <AddCompanyForm />
      </main>
    </div>
  );
}
