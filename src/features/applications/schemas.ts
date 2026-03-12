import { z } from 'zod';

const APPLICATION_STATUSES = [
  'saved',
  'applied',
  'interviewing',
  'offer',
  'rejected',
] as const;

export const createApplicationFormSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(255),
  status: z.enum(APPLICATION_STATUSES).optional(),
  jobPostingUrl: z
    .union([z.string().url('Invalid URL'), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
  location: z.string().max(255).optional(),
  salaryMin: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(
      z.union([
        z.undefined(),
        z.coerce.number().int().refine((n) => !Number.isNaN(n), 'Enter a valid number'),
      ])
    ),
  salaryMax: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v))
    .pipe(
      z.union([
        z.undefined(),
        z.coerce.number().int().refine((n) => !Number.isNaN(n), 'Enter a valid number'),
      ])
    ),
  appliedAt: z
    .string()
    .optional()
    .transform((v) => {
      if (!v || v === '') return undefined;
      const date = new Date(v);
      return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
    }),
  source: z.string().max(255).optional(),
  resumeId: z
    .string()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

export type CreateApplicationFormValues = z.infer<
  typeof createApplicationFormSchema
>;
export type CreateApplicationFormInput = z.input<
  typeof createApplicationFormSchema
>;

export const updateApplicationFormSchema = z.object({
  jobTitle: z.string().min(1, 'Job title is required').max(255).optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  jobPostingUrl: z
    .union([z.string().url('Invalid URL'), z.literal('')])
    .optional()
    .transform((v) => (v === '' ? null : v)),
  location: z
    .string()
    .max(255)
    .optional()
    .transform((v) => (v === '' ? null : v)),
  salaryMin: z
    .string()
    .optional()
    .transform((v) => (v === '' ? null : v))
    .pipe(
      z.union([
        z.null(),
        z.undefined(),
        z.coerce.number().int().refine((n) => !Number.isNaN(n), 'Enter a valid number'),
      ])
    ),
  salaryMax: z
    .string()
    .optional()
    .transform((v) => (v === '' ? null : v))
    .pipe(
      z.union([
        z.null(),
        z.undefined(),
        z.coerce.number().int().refine((n) => !Number.isNaN(n), 'Enter a valid number'),
      ])
    ),
  appliedAt: z
    .string()
    .optional()
    .transform((v) => {
      if (v === undefined || v === '') return null;
      const date = new Date(v);
      return Number.isNaN(date.getTime()) ? null : date.toISOString();
    }),
  source: z
    .string()
    .max(255)
    .optional()
    .transform((v) => (v === '' ? null : v)),
  resumeId: z
    .string()
    .optional()
    .transform((v) => (v === '' ? null : v)),
});

export type UpdateApplicationFormValues = z.infer<
  typeof updateApplicationFormSchema
>;
export type UpdateApplicationFormInput = z.input<
  typeof updateApplicationFormSchema
>;
