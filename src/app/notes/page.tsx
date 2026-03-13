import { NotesList } from "@/features/notes/NotesList";
import styles from "./page.module.css";

export default function NotesPage() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <NotesList />
      </main>
    </div>
  );
}
