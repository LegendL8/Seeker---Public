import { createApplicationFormSchema } from "./schemas";

describe("createApplicationFormSchema", () => {
  it("accepts minimal valid input (jobTitle only)", () => {
    const result = createApplicationFormSchema.parse({ jobTitle: "Engineer" });
    expect(result.jobTitle).toBe("Engineer");
    expect(result.status).toBeUndefined();
  });

  it("accepts valid status", () => {
    const result = createApplicationFormSchema.parse({
      jobTitle: "Engineer",
      status: "applied",
    });
    expect(result.status).toBe("applied");
  });

  it("transforms empty jobPostingUrl to undefined", () => {
    const result = createApplicationFormSchema.parse({
      jobTitle: "Engineer",
      jobPostingUrl: "",
    });
    expect(result.jobPostingUrl).toBeUndefined();
  });

  it("accepts valid URL for jobPostingUrl", () => {
    const result = createApplicationFormSchema.parse({
      jobTitle: "Engineer",
      jobPostingUrl: "https://example.com/job",
    });
    expect(result.jobPostingUrl).toBe("https://example.com/job");
  });

  it("rejects missing jobTitle", () => {
    expect(() => createApplicationFormSchema.parse({})).toThrow();
  });

  it("rejects empty jobTitle", () => {
    expect(() => createApplicationFormSchema.parse({ jobTitle: "" })).toThrow();
  });

  it("rejects invalid jobPostingUrl", () => {
    expect(() =>
      createApplicationFormSchema.parse({
        jobTitle: "Engineer",
        jobPostingUrl: "not-a-url",
      }),
    ).toThrow();
  });

  it("rejects invalid status", () => {
    expect(() =>
      createApplicationFormSchema.parse({
        jobTitle: "Engineer",
        status: "invalid",
      }),
    ).toThrow();
  });

  it("accepts valid salary string and defaults salaryPeriod to yearly", () => {
    const result = createApplicationFormSchema.parse({
      jobTitle: "Engineer",
      salaryMin: "100000",
      salaryMax: "150000",
    });
    expect(result.salaryPeriod).toBe("yearly");
    expect(result.salaryMin).toBe("100000");
    expect(result.salaryMax).toBe("150000");
  });

  it("accepts salary with commas and dollar sign", () => {
    const result = createApplicationFormSchema.parse({
      jobTitle: "Engineer",
      salaryPeriod: "yearly",
      salaryMin: "150,000",
      salaryMax: "180,000",
    });
    expect(result.salaryMin).toBe("150,000");
    expect(result.salaryMax).toBe("180,000");
  });

  it("transforms empty salary to undefined", () => {
    const result = createApplicationFormSchema.parse({
      jobTitle: "Engineer",
      salaryMin: "",
      salaryMax: "",
    });
    expect(result.salaryMin).toBeUndefined();
    expect(result.salaryMax).toBeUndefined();
  });

  it("rejects invalid salary (non-numeric)", () => {
    expect(() =>
      createApplicationFormSchema.parse({
        jobTitle: "Engineer",
        salaryMin: "abc",
      }),
    ).toThrow();
  });

  it("transforms date string to ISO", () => {
    const result = createApplicationFormSchema.parse({
      jobTitle: "Engineer",
      appliedAt: "2025-03-09",
    });
    expect(result.appliedAt).toMatch(/^2025-03-09T/);
    expect(result.appliedAt).toMatch(/Z$/);
  });

  it("transforms empty appliedAt to undefined", () => {
    const result = createApplicationFormSchema.parse({
      jobTitle: "Engineer",
      appliedAt: "",
    });
    expect(result.appliedAt).toBeUndefined();
  });

  it("accepts full valid form input", () => {
    const result = createApplicationFormSchema.parse({
      jobTitle: "Senior Engineer",
      status: "interviewing",
      jobPostingUrl: "https://example.com/job",
      location: "Remote",
      salaryPeriod: "yearly",
      salaryMin: "120000",
      salaryMax: "160000",
      appliedAt: "2025-02-01",
      source: "LinkedIn",
    });
    expect(result.jobTitle).toBe("Senior Engineer");
    expect(result.status).toBe("interviewing");
    expect(result.jobPostingUrl).toBe("https://example.com/job");
    expect(result.location).toBe("Remote");
    expect(result.salaryPeriod).toBe("yearly");
    expect(result.salaryMin).toBe("120000");
    expect(result.salaryMax).toBe("160000");
    expect(result.appliedAt).toMatch(/^2025-02-01/);
    expect(result.source).toBe("LinkedIn");
  });
});
