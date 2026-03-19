import { SettingsPage } from "@/features/settings/SettingsPage";
import styles from "./page.module.css";

export default function SettingsRoutePage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <SettingsPage />
      </main>
    </div>
  );
}
