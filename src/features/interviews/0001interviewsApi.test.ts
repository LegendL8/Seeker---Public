import {
  fetchInterviewsByApplicationId,
  createInterview,
  fetchInterviewById,
  updateInterview,
  deleteInterview,
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

describe("fetchInterviewsByApplicationId", () => {
  it("GETs correct URL and returns items", async () => {
    const data = { items: [] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const result = await fetchInterviewsByApplicationId("app-uuid-1");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/applications/app-uuid-1/interviews",
      { credentials: "include" },
    );
    expect(result).toEqual(data);
  });

  it("throws with API message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Not Found",
      json: () => Promise.resolve({ message: "Application not found" }),
    });

    await expect(fetchInterviewsByApplicationId("app-uuid-1")).rejects.toThrow(
      "Application not found",
    );
  });
});

describe("createInterview", () => {
  it("POSTs body to correct URL and returns interview", async () => {
    const body = { interviewType: "phone", outcome: "pending" };
    const created = { id: "int-1", interviewType: "phone", outcome: "pending" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(created),
    });

    const result = await createInterview("app-uuid-1", body);

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/applications/app-uuid-1/interviews",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
    expect(result).toEqual(created);
  });
});

describe("fetchInterviewById", () => {
  it("GETs correct URL and returns interview", async () => {
    const interview = { id: "int-1", interviewType: "technical" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(interview),
    });

    const result = await fetchInterviewById("int-1");

    expect(mockFetch).toHaveBeenCalledWith("/api/proxy/v1/interviews/int-1", {
      credentials: "include",
    });
    expect(result).toEqual(interview);
  });
});

describe("updateInterview", () => {
  it("PATCHes body to correct URL", async () => {
    const updated = { id: "int-1", outcome: "completed" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(updated),
    });

    await updateInterview("int-1", { outcome: "completed" });

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/interviews/int-1",
      expect.objectContaining({
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      }),
    );
  });
});

describe("deleteInterview", () => {
  it("DELETEs correct URL", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await deleteInterview("int-1");

    expect(mockFetch).toHaveBeenCalledWith(
      "/api/proxy/v1/interviews/int-1",
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
  });
});
