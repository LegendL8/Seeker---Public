import { AddApplicationForm } from '@/features/applications/AddApplicationForm';
import styles from '../page.module.css';

export default function NewApplicationPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <AddApplicationForm />
      </main>
    </div>
  );
}
