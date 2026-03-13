import {
  createNoteBodySchema,
  listNotesQuerySchema,
  noteTypeTagSchema,
  updateNoteBodySchema,
} from "./notes/types";

describe("noteTypeTagSchema", () => {
  it("accepts all valid type tags", () => {
    const tags = ["interview", "job_description", "research", "general"];
    tags.forEach((t) => {
      expect(noteTypeTagSchema.parse(t)).toBe(t);
    });
  });

  it("rejects invalid type tag", () => {
    expect(() => noteTypeTagSchema.parse("invalid")).toThrow();
  });
});

describe("createNoteBodySchema", () => {
  it("accepts minimal valid body (content and typeTag)", () => {
    const result = createNoteBodySchema.parse({
      content: "Some note",
      typeTag: "general",
    });
    expect(result.content).toBe("Some note");
    expect(result.typeTag).toBe("general");
    expect(result.applicationId).toBeUndefined();
  });

  it("accepts one relational tag", () => {
    const appId = "550e8400-e29b-41d4-a716-446655440000";
    const result = createNoteBodySchema.parse({
      content: "Note for application",
      typeTag: "interview",
      applicationId: appId,
    });
    expect(result.applicationId).toBe(appId);
    expect(result.interviewId).toBeUndefined();
  });

  it("rejects more than one relational tag", () => {
    const appId = "550e8400-e29b-41d4-a716-446655440000";
    const interviewId = "550e8400-e29b-41d4-a716-446655440001";
    expect(() =>
      createNoteBodySchema.parse({
        content: "Note",
        typeTag: "general",
        applicationId: appId,
        interviewId,
      }),
    ).toThrow(/Only one relational tag/);
  });

  it("rejects empty content", () => {
    expect(() =>
      createNoteBodySchema.parse({ content: "", typeTag: "general" }),
    ).toThrow();
  });

  it("rejects missing content", () => {
    expect(() => createNoteBodySchema.parse({ typeTag: "general" })).toThrow();
  });
});

describe("updateNoteBodySchema", () => {
  it("accepts partial body", () => {
    const result = updateNoteBodySchema.parse({ content: "Updated" });
    expect(result.content).toBe("Updated");
  });

  it("rejects more than one relational tag", () => {
    const appId = "550e8400-e29b-41d4-a716-446655440000";
    const interviewId = "550e8400-e29b-41d4-a716-446655440001";
    expect(() =>
      updateNoteBodySchema.parse({
        applicationId: appId,
        interviewId,
      }),
    ).toThrow(/Only one relational tag/);
  });
});

describe("listNotesQuerySchema", () => {
  it("parses with defaults", () => {
    const result = listNotesQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("accepts typeTag and applicationId", () => {
    const result = listNotesQuerySchema.parse({
      page: 2,
      limit: 10,
      typeTag: "interview",
      applicationId: "550e8400-e29b-41d4-a716-446655440000",
    });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
    expect(result.typeTag).toBe("interview");
    expect(result.applicationId).toBe("550e8400-e29b-41d4-a716-446655440000");
  });

  it("rejects limit over 100", () => {
    expect(() => listNotesQuerySchema.parse({ limit: 101 })).toThrow();
  });

  it("rejects page less than 1", () => {
    expect(() => listNotesQuerySchema.parse({ page: 0 })).toThrow();
  });

  it("rejects invalid applicationId (not UUID)", () => {
    expect(() =>
      listNotesQuerySchema.parse({ applicationId: "not-uuid" }),
    ).toThrow();
  });
});
