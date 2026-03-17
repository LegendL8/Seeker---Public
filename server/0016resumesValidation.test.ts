import {
  listResumesQuerySchema,
  mimeToFileType,
  setActiveBodySchema,
} from "./resumes/types";

describe("listResumesQuerySchema", () => {
  it("uses defaults for empty query", () => {
    const result = listResumesQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });

  it("coerces string page and limit to numbers", () => {
    const result = listResumesQuerySchema.parse({
      page: "2",
      limit: "10",
    });
    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });

  it("accepts limit up to 100", () => {
    const result = listResumesQuerySchema.parse({ limit: 100 });
    expect(result.limit).toBe(100);
  });

  it("rejects limit over 100", () => {
    expect(() => listResumesQuerySchema.parse({ limit: 101 })).toThrow();
  });

  it("rejects page less than 1", () => {
    expect(() => listResumesQuerySchema.parse({ page: 0 })).toThrow();
  });
});

describe("setActiveBodySchema", () => {
  it("accepts isActive true", () => {
    const result = setActiveBodySchema.parse({ isActive: true });
    expect(result.isActive).toBe(true);
  });

  it("accepts isActive false", () => {
    const result = setActiveBodySchema.parse({ isActive: false });
    expect(result.isActive).toBe(false);
  });

  it("rejects missing isActive", () => {
    expect(() => setActiveBodySchema.parse({})).toThrow();
  });

  it("rejects non-boolean isActive", () => {
    expect(() => setActiveBodySchema.parse({ isActive: "yes" })).toThrow();
  });
});

describe("mimeToFileType", () => {
  it("returns pdf for application/pdf", () => {
    expect(mimeToFileType("application/pdf")).toBe("pdf");
  });

  it("returns docx for Word MIME type", () => {
    expect(
      mimeToFileType(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe("docx");
  });

  it("returns null for unknown MIME type", () => {
    expect(mimeToFileType("text/plain")).toBeNull();
    expect(mimeToFileType("application/octet-stream")).toBeNull();
  });
});
