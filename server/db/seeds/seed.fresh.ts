import { preferences, users } from "../schema";
import { db, pool } from "../index";

/**
 * Seed: new user with no data.
 * One user, one preferences row. No applications, interviews, notes, etc.
 */
async function seedFresh() {
  const [user] = await db
    .insert(users)
    .values({
      auth0Id: "auth0|seed-fresh",
      email: "seed-fresh@example.com",
      displayName: "Fresh User",
      subscriptionTier: "free",
    })
    .returning({ id: users.id });

  if (!user) throw new Error("Failed to insert user");

  await db.insert(preferences).values({
    userId: user.id,
    postingCheckFrequency: "daily",
  });

  await pool.end();
}

seedFresh().catch((err) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});
