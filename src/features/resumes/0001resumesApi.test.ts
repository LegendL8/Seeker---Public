import {
  deleteResume,
  fetchResumesList,
  fetchResumeWithUrl,
  setResumeActive,
} from "./api";

const mockFetch = jest.fn();
const originalFetch = globalThis.fetch;

beforeAll(() => {
  (globalThis as { fetch: typeof fetch }).fetch = mockFetch;
});

afterAll(() => {
  (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
});

beforeEach(() => {
  mockFetch.mockReset();
  delete process.env.NEXT_PUBLIC_API_URL;
});

describe("fetchResumesList", () => {
  it("builds URL with page and limit and returns data", async () => {
    const data = { items: [], page: 1, limit: 20, total: 0 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const result = await fetchResumesList(1, 20);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/resumes?page=1&limit=20",
      { credentials: "include" },
    );
    expect(result).toEqual(data);
  });

  it("encodes page and limit in URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [], page: 2, limit: 10, total: 0 }),
    });

    await fetchResumesList(2, 10);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/resumes?page=2&limit=10",
      expect.any(Object),
    );
  });

  it("throws with API message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Unauthorized",
      json: () => Promise.resolve({ message: "Not authenticated" }),
    });

    await expect(fetchResumesList(1, 20)).rejects.toThrow("Not authenticated");
  });

  it("throws with statusText when response has no message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Forbidden",
      json: () => Promise.reject(new Error("parse error")),
    });

    await expect(fetchResumesList(1, 20)).rejects.toThrow("Forbidden");
  });
});

describe("fetchResumeWithUrl", () => {
  it("GETs correct URL and returns data", async () => {
    const resume = {
      id: "uuid-1",
      fileName: "resume.pdf",
      fileType: "pdf",
      fileSizeBytes: 1024,
      isActive: true,
      createdAt: "2025-01-01T00:00:00Z",
      signedUrl: "https://s3.example.com/signed",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: resume }),
    });

    const result = await fetchResumeWithUrl("uuid-1");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith("/api/proxy/v1/resumes/uuid-1", {
      credentials: "include",
    });
    expect(result).toEqual(resume);
  });

  it("encodes id in URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            id: "a/b",
            fileName: "x.pdf",
            fileType: "pdf",
            fileSizeBytes: 0,
            isActive: false,
            createdAt: null,
            signedUrl: "https://example.com",
          },
        }),
    });

    await fetchResumeWithUrl("a/b");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/resumes/a%2Fb",
      expect.any(Object),
    );
  });

  it("throws with API message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Not Found",
      json: () => Promise.resolve({ message: "Resume not found" }),
    });

    await expect(fetchResumeWithUrl("uuid-1")).rejects.toThrow(
      "Resume not found",
    );
  });
});

describe("setResumeActive", () => {
  it("PATCHes body to correct URL and returns resume", async () => {
    const updated = {
      id: "uuid-1",
      fileName: "resume.pdf",
      fileType: "pdf",
      fileSizeBytes: 1024,
      isActive: true,
      createdAt: "2025-01-01T00:00:00Z",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updated }),
    });

    const result = await setResumeActive("uuid-1", true);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/resumes/uuid-1",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      }),
    );
    expect(result).toEqual(updated);
  });

  it("throws with API message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Bad Request",
      json: () => Promise.resolve({ message: "Resume not found" }),
    });

    await expect(setResumeActive("uuid-1", false)).rejects.toThrow(
      "Resume not found",
    );
  });
});

describe("deleteResume", () => {
  it("DELETEs correct URL", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await deleteResume("uuid-1");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/resumes/uuid-1",
      expect.objectContaining({
        method: "DELETE",
        credentials: "include",
      }),
    );
  });

  it("throws with API message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Forbidden",
      json: () => Promise.resolve({ message: "Resume not found" }),
    });

    await expect(deleteResume("uuid-1")).rejects.toThrow("Resume not found");
  });
});
