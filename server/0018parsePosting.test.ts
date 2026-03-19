import { parseJobPostingUrl } from "./applications/parsePosting";

const LINKEDIN_GUEST_BASE =
  "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting";

describe("parseJobPostingUrl", () => {
  const originalFetch = global.fetch;

  afterAll(() => {
    global.fetch = originalFetch;
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("returns job data from LinkedIn guest API and normalizes URL", async () => {
    global.fetch = jest.fn().mockImplementation((input: string | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.startsWith(LINKEDIN_GUEST_BASE + "/")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              title: "Full Stack Developer",
              companyName: "Acme Corp",
              formattedLocation: "Remote",
            }),
            { headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return Promise.resolve(new Response("", { status: 404 }));
    });

    const url =
      "https://www.linkedin.com/jobs/view/123?utm_source=foo&tracking=bar";
    const result = await parseJobPostingUrl(url);

    expect(result.jobTitle).toBe("Full Stack Developer");
    expect(result.companyName).toBe("Acme Corp");
    expect(result.location).toBe("Remote");
    expect(result.jobPostingUrl).toBe("https://www.linkedin.com/jobs/view/123");
  });

  it("returns normalized URL and nulls when guest API fails", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(new Response("", { status: 404 }));

    const url = "https://www.linkedin.com/jobs/view/456";
    const result = await parseJobPostingUrl(url);

    expect(result.jobTitle).toBeNull();
    expect(result.companyName).toBeNull();
    expect(result.location).toBeNull();
    expect(result.jobPostingUrl).toBe("https://www.linkedin.com/jobs/view/456");
  });

  it("returns normalized URL and nulls for non-http(s) protocol", async () => {
    const url = "ftp://example.com/job";
    const result = await parseJobPostingUrl(url);

    expect(result.jobTitle).toBeNull();
    expect(result.companyName).toBeNull();
    expect(result.location).toBeNull();
    expect(result.jobPostingUrl).toBe("ftp://example.com/job");
  });

  it("parses page title when guest API returns non-JSON", async () => {
    global.fetch = jest.fn().mockImplementation((input: string | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.startsWith(LINKEDIN_GUEST_BASE + "/")) {
        return Promise.resolve(
          new Response("not json", {
            headers: { "Content-Type": "text/plain" },
          }),
        );
      }
      return Promise.resolve(
        new Response(
          "<!DOCTYPE html><html><head><title>Acme hiring Engineer in NYC | LinkedIn</title></head></html>",
          { headers: { "Content-Type": "text/html" } },
        ),
      );
    });

    const url = "https://www.linkedin.com/jobs/view/789";
    const result = await parseJobPostingUrl(url);

    expect(result.jobTitle).toBe("Engineer");
    expect(result.companyName).toBe("Acme");
    expect(result.location).toBe("NYC");
    expect(result.jobPostingUrl).toBe("https://www.linkedin.com/jobs/view/789");
  });

  it("returns normalized URL only when page fetch fails", async () => {
    global.fetch = jest
      .fn()
      .mockResolvedValue(new Response("", { status: 404 }));

    const url = "https://other-site.com/job/999";
    const result = await parseJobPostingUrl(url);

    expect(result.jobTitle).toBeNull();
    expect(result.companyName).toBeNull();
    expect(result.location).toBeNull();
    expect(result.jobPostingUrl).toBe("https://other-site.com/job/999");
  });

  it("returns normalized URL and nulls for blocked host (SSRF)", async () => {
    const url = "http://127.0.0.1/job/123";
    const result = await parseJobPostingUrl(url);

    expect(result.jobTitle).toBeNull();
    expect(result.companyName).toBeNull();
    expect(result.location).toBeNull();
    expect(result.jobPostingUrl).toBe("http://127.0.0.1/job/123");
  });

  it("returns normalized URL and nulls for metadata host", async () => {
    const url = "http://169.254.169.254/latest/meta-data/";
    const result = await parseJobPostingUrl(url);

    expect(result.jobTitle).toBeNull();
    expect(result.companyName).toBeNull();
    expect(result.location).toBeNull();
    expect(result.jobPostingUrl).toBe(
      "http://169.254.169.254/latest/meta-data",
    );
  });

  it("trims input URL", async () => {
    global.fetch = jest.fn().mockImplementation((input: string | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.startsWith(LINKEDIN_GUEST_BASE + "/")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              title: "Dev",
              companyName: "Co",
              formattedLocation: "Here",
            }),
            { headers: { "Content-Type": "application/json" } },
          ),
        );
      }
      return Promise.resolve(new Response("", { status: 404 }));
    });

    const result = await parseJobPostingUrl(
      "  https://www.linkedin.com/jobs/view/111  ",
    );

    expect(result.jobTitle).toBe("Dev");
    expect(result.jobPostingUrl).toBe("https://www.linkedin.com/jobs/view/111");
  });
});
