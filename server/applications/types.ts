import z from "zod";

export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "interviewing",
  "offer",
  "rejected",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES);

const optionalString = (max: number) => z.string().max(max).optional();
const optionalUuid = () => z.string().uuid().optional();

export const createApplicationBodySchema = z.object({
  jobTitle: z.string().min(1).max(255),
  status: applicationStatusSchema.optional(),
  companyId: optionalUuid(),
  jobPostingUrl: z
    .union([z.string().url().max(500), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  location: optionalString(255),
  salaryMin: z.number().int().optional(),
  salaryMax: z.number().int().optional(),
  appliedAt: z.string().datetime().optional(),
  source: optionalString(255),
  resumeId: optionalUuid(),
});

export const updateApplicationBodySchema = z.object({
  jobTitle: z.string().min(1).max(255).optional(),
  status: applicationStatusSchema.optional(),
  companyId: optionalUuid().nullable(),
  jobPostingUrl: z
    .union([z.string().url().max(500), z.literal("")])
    .optional()
    .nullable()
    .transform((v) => (v === "" ? undefined : v)),
  location: optionalString(255).nullable(),
  salaryMin: z.number().int().optional().nullable(),
  salaryMax: z.number().int().optional().nullable(),
  appliedAt: z.string().datetime().optional().nullable(),
  source: optionalString(255).nullable(),
  resumeId: optionalUuid().nullable(),
});

export const listApplicationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export const parsePostingBodySchema = z.object({
  url: z
    .string()
    .min(1)
    .max(2048)
    .transform((s) => s.trim())
    .pipe(z.string().url("Invalid URL")),
});

export type CreateApplicationBody = z.infer<typeof createApplicationBodySchema>;
export type UpdateApplicationBody = z.infer<typeof updateApplicationBodySchema>;
export type ListApplicationsQuery = z.infer<typeof listApplicationsQuerySchema>;
export type ParsePostingBody = z.infer<typeof parsePostingBodySchema>;
