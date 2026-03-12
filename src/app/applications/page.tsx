import { ApplicationsList } from '@/features/applications/ApplicationsList';
import styles from './page.module.css';

export default function ApplicationsPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ApplicationsList />
      </main>
    </div>
  );
}
