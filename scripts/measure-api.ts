/**
 * Phase 4 performance script. Measures p50/p95/p99 latency for critical GETs.
 * Requires: Express running (e.g. localhost:3001), PERF_JWT in env (Bearer token for API).
 * Optional: EXPRESS_API_URL (default http://localhost:3001), PERF_APPLICATION_ID (or first application from list is used).
 * Run: node -r dotenv/config node_modules/.bin/tsx scripts/measure-api.ts
 */

const EXPRESS_API_URL = process.env.EXPRESS_API_URL ?? "http://localhost:3001";
const JWT = process.env.PERF_JWT ?? "";
const N = 30;
const TARGET_P95_MS = 500;

type Endpoint = {
  name: string;
  url: string;
};

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
}

async function measure(
  url: string,
  headers: Record<string, string>,
): Promise<number> {
  const start = performance.now();
  const res = await fetch(url, { headers });
  const elapsed = performance.now() - start;
  if (!res.ok) {
    throw new Error(`${url} ${res.status} ${await res.text()}`);
  }
  await res.text();
  return elapsed;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sample(
  url: string,
  headers: Record<string, string>,
  n: number,
): Promise<number[]> {
  const times: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = await measure(url, headers);
    times.push(t);
    if (i < n - 1) await delay(1100);
  }
  return times;
}

async function main(): Promise<void> {
  if (!JWT.trim()) {
    console.error(
      "PERF_JWT is required. Set it in .env (e.g. copy an access token after logging in).",
    );
    process.exit(1);
  }

  const headers: Record<string, string> = {
    Authorization: JWT.startsWith("Bearer ") ? JWT : `Bearer ${JWT}`,
  };

  const base = EXPRESS_API_URL.replace(/\/$/, "");
  const endpoints: Endpoint[] = [
    {
      name: "GET /api/v1/dashboard/metrics",
      url: `${base}/api/v1/dashboard/metrics`,
    },
    {
      name: "GET /api/v1/applications (list)",
      url: `${base}/api/v1/applications?page=1&limit=20`,
    },
    {
      name: "GET /api/v1/notes (list)",
      url: `${base}/api/v1/notes?page=1&limit=20`,
    },
    { name: "GET /api/v1/resumes (list)", url: `${base}/api/v1/resumes` },
  ];

  let applicationId = process.env.PERF_APPLICATION_ID;
  if (!applicationId) {
    const listUrl = `${base}/api/v1/applications?page=1&limit=1`;
    const res = await fetch(listUrl, { headers });
    if (res.ok) {
      const data = (await res.json()) as { items?: { id?: string }[] };
      applicationId = data.items?.[0]?.id;
    }
  }
  if (applicationId) {
    endpoints.push({
      name: "GET /api/v1/applications/:id",
      url: `${base}/api/v1/applications/${applicationId}`,
    });
  } else {
    console.warn(
      "No PERF_APPLICATION_ID and no applications in list; skipping GET application by id.",
    );
  }

  console.log(`Measuring ${N} requests per endpoint against ${base}\n`);

  const results: {
    name: string;
    p50: number;
    p95: number;
    p99: number;
    ok: boolean;
  }[] = [];

  for (const ep of endpoints) {
    process.stdout.write(`${ep.name} ... `);
    try {
      const times = await sample(ep.url, headers, N);
      times.sort((a, b) => a - b);
      const p50 = percentile(times, 50);
      const p95 = percentile(times, 95);
      const p99 = percentile(times, 99);
      const ok = p95 < TARGET_P95_MS;
      results.push({ name: ep.name, p50, p95, p99, ok });
      console.log(
        `p50=${p50.toFixed(0)}ms p95=${p95.toFixed(0)}ms p99=${p99.toFixed(0)}ms ${ok ? "OK" : "OVER TARGET"}`,
      );
    } catch (err) {
      console.log(
        `FAILED: ${err instanceof Error ? err.message : String(err)}`,
      );
      results.push({
        name: ep.name,
        p50: 0,
        p95: 0,
        p99: 0,
        ok: false,
      });
    }
  }

  console.log("\n--- Summary ---");
  const allOk = results.every((r) => r.ok);
  console.log(
    `Target: p95 < ${TARGET_P95_MS} ms. ${allOk ? "All within target." : "Some over target."}`,
  );
  console.log(
    "Record results in DOCUMENTATION/PERFORMANCE_BASELINES.md when baselining.",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
