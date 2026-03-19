import { z } from "zod";

const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
] as const;

const SALARY_PERIODS = ["yearly", "hourly"] as const;

function parseSalaryString(s: string): number | null {
  const cleaned = s.replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return Number.isNaN(n) || n < 0 ? null : n;
}

/** Parse form salary string (e.g. "150,000" or "$75.00") to cents for API. */
export function salaryStringToCents(
  s: string | undefined,
  _period: "yearly" | "hourly",
): number | undefined {
  if (s === undefined || s === "") return undefined;
  const dollars = parseSalaryString(s);
  return dollars === null ? undefined : Math.round(dollars * 100);
}

const salaryStringSchema = z
  .string()
  .optional()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(
    z.union([
      z.undefined(),
      z.string().refine(
        (s) => parseSalaryString(s ?? "") !== null,
        "Enter a valid amount (e.g. 150,000 or $75.00)",
      ),
    ]),
  );

export const createApplicationFormSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required").max(255),
  status: z.enum(APPLICATION_STATUSES).optional(),
  jobPostingUrl: z
    .union([z.string().url("Invalid URL"), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  location: z.string().max(255).optional(),
  salaryPeriod: z.enum(SALARY_PERIODS).default("yearly"),
  salaryMin: salaryStringSchema,
  salaryMax: salaryStringSchema,
  appliedAt: z
    .string()
    .optional()
    .transform((v) => {
      if (!v || v === "") return undefined;
      const date = new Date(v);
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
    }),
  source: z.string().max(255).optional(),
  resumeId: z
    .string()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

export type CreateApplicationFormValues = z.infer<
  typeof createApplicationFormSchema
>;
export type CreateApplicationFormInput = z.input<
  typeof createApplicationFormSchema
>;

const salaryStringOptionalSchema = z
  .string()
  .optional()
  .transform((v) => (v === "" ? null : v))
  .pipe(
    z.union([
      z.null(),
      z.undefined(),
      z.string().refine(
        (s) => parseSalaryString(s ?? "") !== null,
        "Enter a valid amount (e.g. 150,000 or $75.00)",
      ),
    ]),
  );

export const updateApplicationFormSchema = z.object({
  jobTitle: z.string().min(1, "Job title is required").max(255).optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  jobPostingUrl: z
    .union([z.string().url("Invalid URL"), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? null : v)),
  location: z
    .string()
    .max(255)
    .optional()
    .transform((v) => (v === "" ? null : v)),
  salaryPeriod: z.enum(SALARY_PERIODS).optional(),
  salaryMin: salaryStringOptionalSchema,
  salaryMax: salaryStringOptionalSchema,
  appliedAt: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === "") return null;
      const date = new Date(v);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }),
  source: z
    .string()
    .max(255)
    .optional()
    .transform((v) => (v === "" ? null : v)),
  resumeId: z
    .string()
    .optional()
    .transform((v) => (v === "" ? null : v)),
});

export type UpdateApplicationFormValues = z.infer<
  typeof updateApplicationFormSchema
>;
export type UpdateApplicationFormInput = z.input<
  typeof updateApplicationFormSchema
>;
