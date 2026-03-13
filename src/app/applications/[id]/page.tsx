import { ApplicationDetail } from "@/features/applications/ApplicationDetail";
import styles from "../page.module.css";

export default function ApplicationDetailPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ApplicationDetail />
      </main>
    </div>
  );
}
