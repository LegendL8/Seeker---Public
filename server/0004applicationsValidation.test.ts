import {
  applicationStatusSchema,
  createApplicationBodySchema,
  listApplicationsQuerySchema,
  updateApplicationBodySchema,
} from "./applications/types";

describe("applicationStatusSchema", () => {
  it("accepts all APPLICATION_STATUSES", () => {
    const statuses = ["saved", "applied", "interviewing", "offer", "rejected"];
    statuses.forEach((s) => {
      expect(applicationStatusSchema.parse(s)).toBe(s);
    });
  });

  it("rejects invalid status", () => {
    expect(() => applicationStatusSchema.parse("invalid")).toThrow();
    expect(() => applicationStatusSchema.parse("")).toThrow();
  });
});

describe("createApplicationBodySchema", () => {
  it("accepts minimal valid body (jobTitle only)", () => {
    const result = createApplicationBodySchema.parse({ jobTitle: "Engineer" });
    expect(result.jobTitle).toBe("Engineer");
    expect(result.status).toBeUndefined();
  });

  it("accepts full valid body", () => {
    const body = {
      jobTitle: "Engineer",
      status: "applied" as const,
      companyId: "550e8400-e29b-41d4-a716-446655440000",
      jobPostingUrl: "https://example.com/job",
      location: "Remote",
      salaryMin: 100000,
      salaryMax: 150000,
      appliedAt: "2025-01-15T12:00:00Z",
      source: "LinkedIn",
    };
    const result = createApplicationBodySchema.parse(body);
    expect(result.jobTitle).toBe(body.jobTitle);
    expect(result.status).toBe("applied");
    expect(result.appliedAt).toBe(body.appliedAt);
  });

  it("transforms empty jobPostingUrl to undefined", () => {
    const result = createApplicationBodySchema.parse({
      jobTitle: "Engineer",
      jobPostingUrl: "",
    });
    expect(result.jobPostingUrl).toBeUndefined();
  });

  it("rejects missing jobTitle", () => {
    expect(() => createApplicationBodySchema.parse({})).toThrow();
  });

  it("rejects empty jobTitle", () => {
    expect(() => createApplicationBodySchema.parse({ jobTitle: "" })).toThrow();
  });

  it("rejects invalid status", () => {
    expect(() =>
      createApplicationBodySchema.parse({ jobTitle: "Engineer", status: "x" }),
    ).toThrow();
  });

  it("rejects invalid companyId (not UUID)", () => {
    expect(() =>
      createApplicationBodySchema.parse({
        jobTitle: "Engineer",
        companyId: "not-uuid",
      }),
    ).toThrow();
  });

  it("rejects invalid jobPostingUrl (not URL)", () => {
    expect(() =>
      createApplicationBodySchema.parse({
        jobTitle: "Engineer",
        jobPostingUrl: "not-a-url",
      }),
    ).toThrow();
  });
});

describe("updateApplicationBodySchema", () => {
  it("accepts empty object (all optional)", () => {
    const result = updateApplicationBodySchema.parse({});
    expect(result.jobTitle).toBeUndefined();
  });

  it("accepts partial update", () => {
    const result = updateApplicationBodySchema.parse({
      status: "interviewing",
      jobTitle: "Senior Engineer",
    });
    expect(result.status).toBe("interviewing");
    expect(result.jobTitle).toBe("Senior Engineer");
  });

  it("accepts null to clear optional fields", () => {
    const result = updateApplicationBodySchema.parse({
      location: null,
      companyId: null,
    });
    expect(result.location).toBeNull();
    expect(result.companyId).toBeNull();
  });
});

describe("listApplicationsQuerySchema", () => {
  it("uses defaults for empty query", () => {
    const result = listApplicationsQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("coerces string page and limit to numbers", () => {
    const result = listApplicationsQuerySchema.parse({
      page: "2",
      limit: "10",
    });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });

  it("accepts limit up to 100", () => {
    const result = listApplicationsQuerySchema.parse({ limit: 100 });
    expect(result.limit).toBe(100);
  });

  it("rejects limit over 100", () => {
    expect(() => listApplicationsQuerySchema.parse({ limit: 101 })).toThrow();
  });

  it("rejects page less than 1", () => {
    expect(() => listApplicationsQuerySchema.parse({ page: 0 })).toThrow();
  });
});
