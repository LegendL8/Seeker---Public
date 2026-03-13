import {
  fetchApplicationsList,
  createApplication,
  fetchApplicationById,
  updateApplication,
  deleteApplication,
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

describe("fetchApplicationsList", () => {
  it("builds URL with page and limit and returns data", async () => {
    const data = {
      items: [],
      page: 1,
      limit: 20,
      total: 0,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const result = await fetchApplicationsList(1, 20);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/applications?page=1&limit=20",
      { credentials: "include" },
    );
    expect(result).toEqual(data);
  });

  it("encodes page and limit in URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ items: [], page: 2, limit: 10, total: 0 }),
    });

    await fetchApplicationsList(2, 10);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/applications?page=2&limit=10",
      expect.any(Object),
    );
  });

  it("throws with API message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Unauthorized",
      json: () => Promise.resolve({ message: "Not authenticated" }),
    });

    await expect(fetchApplicationsList(1, 20)).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("throws with statusText when response has no message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Forbidden",
      json: () => Promise.reject(new Error("parse error")),
    });

    await expect(fetchApplicationsList(1, 20)).rejects.toThrow("Forbidden");
  });
});

describe("createApplication", () => {
  it("POSTs body to correct URL and returns application", async () => {
    const body = { jobTitle: "Engineer", status: "saved" };
    const created = { id: "uuid-1", jobTitle: "Engineer", status: "saved" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(created),
    });

    const result = await createApplication(body);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/applications",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    expect(result).toEqual(created);
  });

  it("throws with API message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Bad Request",
      json: () =>
        Promise.resolve({
          message: "jobTitle is required",
        }),
    });

    await expect(createApplication({ jobTitle: "" })).rejects.toThrow(
      "jobTitle is required",
    );
  });
});

describe("fetchApplicationById", () => {
  it("GETs correct URL and returns application", async () => {
    const app = { id: "uuid-1", jobTitle: "Engineer", status: "saved" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(app),
    });

    const result = await fetchApplicationById("uuid-1");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/applications/uuid-1",
      { credentials: "include" },
    );
    expect(result).toEqual(app);
  });

  it("encodes id in URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: "a/b", jobTitle: "Dev" }),
    });

    await fetchApplicationById("a/b");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/applications/a%2Fb",
      expect.any(Object),
    );
  });

  it("throws with API message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Not Found",
      json: () => Promise.resolve({ message: "Application not found" }),
    });

    await expect(fetchApplicationById("uuid-1")).rejects.toThrow(
      "Application not found",
    );
  });
});

describe("updateApplication", () => {
  it("PATCHes body to correct URL and returns application", async () => {
    const body = { jobTitle: "Senior Engineer", status: "interviewing" };
    const updated = {
      id: "uuid-1",
      jobTitle: "Senior Engineer",
      status: "interviewing",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(updated),
    });

    const result = await updateApplication("uuid-1", body);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/applications/uuid-1",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    expect(result).toEqual(updated);
  });

  it("throws with API message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Not Found",
      json: () => Promise.resolve({ message: "Application not found" }),
    });

    await expect(
      updateApplication("uuid-1", { jobTitle: "Updated" }),
    ).rejects.toThrow("Application not found");
  });
});

describe("deleteApplication", () => {
  it("DELETEs correct URL", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await deleteApplication("uuid-1");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/applications/uuid-1",
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
      json: () => Promise.resolve({ message: "Application not found" }),
    });

    await expect(deleteApplication("uuid-1")).rejects.toThrow(
      "Application not found",
    );
  });
});
