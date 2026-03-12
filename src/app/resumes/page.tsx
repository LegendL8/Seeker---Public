import { ResumesList } from '@/features/resumes/ResumesList';
import styles from '../applications/page.module.css';

export default function ResumesPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <ResumesList />
      </main>
    </div>
  );
}
