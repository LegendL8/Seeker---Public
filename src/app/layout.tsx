import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NavBar } from "@/features/layout/NavBar";
import { Providers } from "./providers";
import "./globals.css";
import styles from "./layout.module.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Seeker",
  description: "Applicant tracking for job seekers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        <Providers>
          <div className={styles.wrapper}>
            <aside className={styles.sidebar}>
              <NavBar />
            </aside>
            <main className={styles.main}>{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
