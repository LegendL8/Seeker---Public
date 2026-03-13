import { eq } from "drizzle-orm";
import {
  applications,
  companies,
  interviews,
  notes,
  preferences,
  users,
} from "../schema";
import { db, pool } from "../index";

/**
 * Seed: full realistic sample dataset across all entities.
 * One user, preferences, several companies, applications (some linked to companies),
 * interviews, and notes. Use for staging or showcase.
 *
 * Requires SEED_DEMO_AUTH0_ID (Auth0 user id / sub). If that user does not exist,
 * also set SEED_DEMO_EMAIL. Run with:
 *   SEED_DEMO_AUTH0_ID='auth0|xxxxx' npm run db:seed:demo
 *   (and SEED_DEMO_EMAIL=you@example.com if the user does not exist yet)
 */
async function seedDemo() {
  const auth0Id = process.env.SEED_DEMO_AUTH0_ID?.trim();
  if (!auth0Id) {
    throw new Error(
      "SEED_DEMO_AUTH0_ID is required. Set it to your Auth0 user id (sub), e.g. SEED_DEMO_AUTH0_ID='auth0|xxxxx'",
    );
  }

  const existing = (
    await db.select().from(users).where(eq(users.auth0Id, auth0Id)).limit(1)
  )[0];
  let userId: string;

  if (existing) {
    userId = existing.id;
  } else {
    const email = process.env.SEED_DEMO_EMAIL?.trim();
    if (!email) {
      throw new Error(
        "No user found with that Auth0 id. Set SEED_DEMO_EMAIL to create one, e.g. SEED_DEMO_EMAIL=you@example.com",
      );
    }
    const [inserted] = await db
      .insert(users)
      .values({
        auth0Id,
        email,
        displayName: "Sample User",
        subscriptionTier: "free",
      })
      .returning({ id: users.id });
    if (!inserted) throw new Error("Failed to insert user");
    userId = inserted.id;
  }

  await db
    .insert(preferences)
    .values({ userId, postingCheckFrequency: "daily" })
    .onConflictDoNothing({ target: preferences.userId });

  await db.delete(applications).where(eq(applications.userId, userId));
  await db.delete(notes).where(eq(notes.userId, userId));
  await db.delete(companies).where(eq(companies.userId, userId));

  const companyValues = [
    {
      userId,
      name: "Acme Corp",
      website: "https://acme.example.com",
      industry: "Technology",
    },
    {
      userId,
      name: "BuildRight Inc",
      website: "https://buildright.example.com",
      industry: "Software",
    },
    { userId, name: "DataFlow Labs", website: null, industry: "Data" },
  ];
  const insertedCompanies = await db
    .insert(companies)
    .values(companyValues)
    .returning({ id: companies.id });
  const companyIds = insertedCompanies.map((r) => r.id);

  const appValues = [
    {
      userId,
      companyId: companyIds[0],
      jobTitle: "Senior Software Engineer",
      status: "applied",
      jobPostingUrl: "https://example.com/job/1",
      location: "Remote",
      salaryMin: 140000,
      salaryMax: 180000,
      appliedAt: new Date("2025-02-01T10:00:00Z"),
      source: "LinkedIn",
    },
    {
      userId,
      companyId: companyIds[0],
      jobTitle: "Staff Engineer",
      status: "interviewing",
      location: "San Francisco, CA",
      salaryMin: 180000,
      salaryMax: 220000,
      appliedAt: new Date("2025-02-05T14:00:00Z"),
      source: "Referral",
    },
    {
      userId,
      companyId: companyIds[1],
      jobTitle: "Full Stack Developer",
      status: "offer",
      location: "New York, NY",
      salaryMin: 120000,
      salaryMax: 150000,
      appliedAt: new Date("2025-01-10T11:00:00Z"),
      source: "Company website",
    },
    {
      userId,
      companyId: null,
      jobTitle: "Backend Engineer",
      status: "saved",
      jobPostingUrl: "https://example.com/job/4",
      location: "Boston, MA",
    },
    {
      userId,
      companyId: companyIds[2],
      jobTitle: "Data Engineer",
      status: "rejected",
      appliedAt: new Date("2025-01-20T09:00:00Z"),
      source: "Indeed",
    },
    {
      userId,
      companyId: companyIds[1],
      jobTitle: "Frontend Engineer",
      status: "applied",
      location: "Remote",
      salaryMin: 110000,
      salaryMax: 135000,
      appliedAt: new Date("2025-02-10T16:00:00Z"),
      source: "LinkedIn",
    },
  ];

  const insertedApps = await db
    .insert(applications)
    .values(appValues)
    .returning({ id: applications.id });
  const appIds = insertedApps.map((r) => r.id);

  const interviewValues = [
    {
      userId,
      applicationId: appIds[0],
      interviewType: "phone",
      scheduledAt: new Date("2025-02-15T14:00:00Z"),
      interviewerName: "Jane Smith",
      interviewerTitle: "Engineering Manager",
      outcome: "completed",
    },
    {
      userId,
      applicationId: appIds[1],
      interviewType: "technical",
      scheduledAt: new Date("2025-02-20T10:00:00Z"),
      interviewerName: "Alex Chen",
      interviewerTitle: "Senior Engineer",
      outcome: "pending",
    },
    {
      userId,
      applicationId: appIds[1],
      interviewType: "behavioral",
      scheduledAt: new Date("2025-02-18T15:00:00Z"),
      outcome: "completed",
    },
    {
      userId,
      applicationId: appIds[2],
      interviewType: "onsite",
      scheduledAt: new Date("2025-01-25T09:00:00Z"),
      interviewerName: "Sam Rivera",
      interviewerTitle: "Director of Engineering",
      outcome: "completed",
    },
    {
      userId,
      applicationId: appIds[5],
      interviewType: "phone",
      scheduledAt: new Date("2025-02-22T11:00:00Z"),
      outcome: "pending",
    },
  ];

  await db.insert(interviews).values(interviewValues);

  const noteValues = [
    {
      userId,
      content: "Focus on system design and scalability. They use Go and Kafka.",
      typeTag: "interview",
      applicationId: appIds[0],
      interviewId: null,
      companyId: null,
    },
    {
      userId,
      content: "Research: company raised Series B, team ~50 eng. Remote-first.",
      typeTag: "research",
      applicationId: null,
      interviewId: null,
      companyId: null,
    },
    {
      userId,
      content:
        "JD mentioned 5+ years React/Node. Emphasize full-stack projects.",
      typeTag: "job_description",
      applicationId: appIds[3],
      interviewId: null,
      companyId: null,
    },
    {
      userId,
      content: "General prep: STAR method for behavioral. Review algo basics.",
      typeTag: "general",
      applicationId: null,
      interviewId: null,
      companyId: null,
    },
    {
      userId,
      content: "Technical round went well. Follow up on team structure.",
      typeTag: "interview",
      applicationId: appIds[1],
      interviewId: null,
      companyId: null,
    },
    {
      userId,
      content:
        "Offer details: 120k base, 10% bonus, equity. Benefits start day 1.",
      typeTag: "general",
      applicationId: appIds[2],
      interviewId: null,
      companyId: null,
    },
  ];

  await db.insert(notes).values(noteValues);

  await pool.end();
}

seedDemo().catch((err) => {
  process.stderr.write(String(err) + "\n");
  process.exit(1);
});
