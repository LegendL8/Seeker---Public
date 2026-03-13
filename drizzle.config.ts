import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./server/db/schema.ts",
  out: "./server/db/migrations",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://seeker:seekerdev@localhost:5432/seeker",
  },
});
