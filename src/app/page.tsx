import { auth0 } from '@/lib/auth0';
import { Dashboard } from '@/features/dashboard/Dashboard';
import styles from './page.module.css';

export default async function Home() {
  const session = await auth0.getSession();

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        {session ? (
          <Dashboard />
        ) : (
          <>
            <h1 className={styles.title}>Seeker</h1>
            <p className={styles.intro}>Applicant tracking for job seekers.</p>
            <a href="/auth/login" className={styles.link}>
              Log in
            </a>
          </>
        )}
      </main>
    </div>
  );
}
