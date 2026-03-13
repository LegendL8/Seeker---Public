import { fetchDashboardMetrics } from "./api";

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

describe("fetchDashboardMetrics", () => {
  it("GETs correct URL with credentials and returns data", async () => {
    const data = {
      data: {
        totalApplications: 6,
        applicationsByStatus: {
          saved: 1,
          applied: 2,
          interviewing: 1,
          offer: 1,
          rejected: 1,
        },
        interviewRate: 2 / 3,
        activeApplications: 3,
        offersReceived: 1,
        rejectionsReceived: 1,
      },
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const result = await fetchDashboardMetrics();

    expect(mockFetch).toHaveBeenCalledWith("/api/proxy/v1/dashboard/metrics", {
      credentials: "include",
    });
    expect(result).toEqual(data);
  });

  it("throws with API message on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Server Error",
      json: () => Promise.resolve({ message: "Redis unavailable" }),
    });

    await expect(fetchDashboardMetrics()).rejects.toThrow("Redis unavailable");
  });

  it("throws with statusText when response has no message body", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Unauthorized",
      json: () => Promise.reject(new Error("parse error")),
    });

    await expect(fetchDashboardMetrics()).rejects.toThrow("Unauthorized");
  });

  it("uses NEXT_PUBLIC_API_URL when set", async () => {
    process.env.NEXT_PUBLIC_API_URL = "http://api.example.com";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    });

    await fetchDashboardMetrics();

    expect(mockFetch).toHaveBeenCalledWith(
      "http://api.example.com/v1/dashboard/metrics",
      { credentials: "include" },
    );
  });
});
