/**
 * Parse job posting URL: try LinkedIn guest API first, then fall back to
 * fetching the page and parsing <title> (e.g. "Company hiring Title in Location | LinkedIn").
 * SSRF: blocks private/internal hosts and validates redirect targets.
 */

const LINKEDIN_GUEST_API_BASE =
  "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting";
const FETCH_TIMEOUT_MS = 10_000;
const FETCH_MAX_BODY_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;

const LINKEDIN_JOBS_VIEW_PATTERN = /linkedin\.com\/jobs\/view\/(\d+)/i;
const TITLE_TAG_PATTERN = /<title[^>]*>([^<]*)<\/title>/i;
const LINKEDIN_TITLE_PATTERN =
  /^(.+?)\s+hiring\s+(.+?)\s+in\s+(.+?)\s+\|\s+LinkedIn$/;

const IPv4_REGEX = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

export interface ParsePostingResult {
  jobTitle: string | null;
  companyName: string | null;
  location: string | null;
  jobPostingUrl: string;
}

interface LinkedInGuestResponse {
  title?: string;
  companyName?: string;
  formattedLocation?: string;
  location?: string;
}

const MAX_JOB_POSTING_URL_LENGTH = 500;

function getAllowedHosts(): string[] {
  const raw = process.env.ALLOWED_JOB_POSTING_HOSTS;
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

function isPrivateIPv4(host: string): boolean {
  const m = host.match(IPv4_REGEX);
  if (!m) return false;
  const a = parseInt(m[1], 10);
  const b = parseInt(m[2], 10);
  const c = parseInt(m[3], 10);
  const d = parseInt(m[4], 10);
  if ([a, b, c, d].some((n) => n > 255 || n < 0)) return false;
  if (a === 127) return true;
  if (a === 10) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 169 && b === 254) return true;
  if (a === 0 && b === 0 && c === 0 && d === 0) return true;
  return false;
}

function isBlockedIPv6(host: string): boolean {
  const lower = host.toLowerCase();
  if (lower === "::1") return true;
  if (lower.startsWith("fe80:")) return true;
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
  return false;
}

function isUrlAllowed(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (!host) return false;

    const allowedHosts = getAllowedHosts();
    if (allowedHosts.length > 0) {
      const match = allowedHosts.some(
        (allowed) =>
          host === allowed ||
          host === `www.${allowed}` ||
          host.endsWith(`.${allowed}`),
      );
      if (!match) return false;
    }

    if (
      host === "localhost" ||
      host === "metadata" ||
      host.endsWith(".local") ||
      host === "169.254.169.254" // cloud metadata endpoint (AWS/GCP/Azure SSRF)
    ) {
      return false;
    }

    if (host.includes(":")) {
      if (isBlockedIPv6(host)) return false;
    } else if (IPv4_REGEX.test(host)) {
      if (isPrivateIPv4(host)) return false;
    }

    return true;
  } catch {
    return false;
  }
}

function normalizeJobPostingUrl(url: string): string {
  try {
    const u = new URL(url);
    const canonical = `${u.origin}${u.pathname}`.replace(/\/+$/, "") || `${u.origin}/`;
    return canonical.length > MAX_JOB_POSTING_URL_LENGTH
      ? canonical.slice(0, MAX_JOB_POSTING_URL_LENGTH)
      : canonical;
  } catch {
    return url.slice(0, MAX_JOB_POSTING_URL_LENGTH);
  }
}

function extractLinkedInJobId(url: string): string | null {
  const match = url.match(LINKEDIN_JOBS_VIEW_PATTERN);
  return match ? match[1] : null;
}

async function fetchWithTimeout(
  url: string,
  options: {
    timeoutMs: number;
    headers?: Record<string, string>;
    redirectCount?: number;
  },
): Promise<Response> {
  const redirectCount = options.redirectCount ?? 0;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: options.headers ?? {},
      redirect: "manual",
    });
    if (
      redirectCount < MAX_REDIRECTS &&
      res.status >= 300 &&
      res.status < 400
    ) {
      const location = res.headers.get("location");
      if (location) {
        const absolute =
          location.startsWith("http://") || location.startsWith("https://")
            ? location
            : new URL(location, url).href;
        if (isUrlAllowed(absolute)) {
          return fetchWithTimeout(absolute, {
            ...options,
            redirectCount: redirectCount + 1,
          });
        }
      }
    }
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchLinkedInGuest(
  jobId: string,
): Promise<LinkedInGuestResponse | null> {
  const url = `${LINKEDIN_GUEST_API_BASE}/${jobId}`;
  const res = await fetchWithTimeout(url, {
    timeoutMs: FETCH_TIMEOUT_MS,
    headers: { "User-Agent": "Seeker/1.0 (job-posting-parser)" },
  });
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  const text = await res.text();
  if (text.length > FETCH_MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(text) as LinkedInGuestResponse;
  } catch {
    return null;
  }
}

function mapLinkedInGuestToResult(
  data: LinkedInGuestResponse,
  postingUrl: string,
): ParsePostingResult {
  const location =
    data.formattedLocation ?? data.location ?? null;
  return {
    jobTitle: data.title ?? null,
    companyName: data.companyName ?? null,
    location: typeof location === "string" ? location : null,
    jobPostingUrl: normalizeJobPostingUrl(postingUrl),
  };
}

function parseLinkedInTitlePattern(
  title: string,
): { companyName: string; jobTitle: string; location: string } | null {
  const trimmed = title.trim();
  const match = trimmed.match(LINKEDIN_TITLE_PATTERN);
  if (!match) return null;
  return {
    companyName: match[1].trim(),
    jobTitle: match[2].trim(),
    location: match[3].trim(),
  };
}

async function fetchPageTitle(pageUrl: string): Promise<string | null> {
  const res = await fetchWithTimeout(pageUrl, {
    timeoutMs: FETCH_TIMEOUT_MS,
    headers: { "User-Agent": "Seeker/1.0 (job-posting-parser)" },
  });
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return null;
  const text = await res.text();
  const slice =
    text.length > FETCH_MAX_BODY_BYTES
      ? text.slice(0, FETCH_MAX_BODY_BYTES)
      : text;
  const titleMatch = slice.match(TITLE_TAG_PATTERN);
  return titleMatch ? titleMatch[1].trim() : null;
}

/**
 * Parse a job posting URL. Tries LinkedIn guest API first; if not LinkedIn or
 * guest fails, fetches the page and parses <title>. Returns at least
 * jobPostingUrl; other fields may be null.
 */
export async function parseJobPostingUrl(
  url: string,
): Promise<ParsePostingResult> {
  const trimmed = url.trim();
  const parsed = new URL(trimmed);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return {
      jobTitle: null,
      companyName: null,
      location: null,
      jobPostingUrl: normalizeJobPostingUrl(trimmed),
    };
  }

  if (!isUrlAllowed(trimmed)) {
    return {
      jobTitle: null,
      companyName: null,
      location: null,
      jobPostingUrl: normalizeJobPostingUrl(trimmed),
    };
  }

  const jobId = extractLinkedInJobId(trimmed);
  if (jobId) {
    const guestData = await fetchLinkedInGuest(jobId);
    if (guestData && (guestData.title ?? guestData.companyName)) {
      return mapLinkedInGuestToResult(guestData, trimmed);
    }
  }

  const title = await fetchPageTitle(trimmed);
  if (title) {
    const linkedInParsed = parseLinkedInTitlePattern(title);
    if (linkedInParsed) {
      return {
        jobTitle: linkedInParsed.jobTitle,
        companyName: linkedInParsed.companyName,
        location: linkedInParsed.location,
        jobPostingUrl: normalizeJobPostingUrl(trimmed),
      };
    }
  }

  return {
    jobTitle: null,
    companyName: null,
    location: null,
    jobPostingUrl: normalizeJobPostingUrl(trimmed),
  };
}
