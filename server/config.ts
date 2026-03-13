import z from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .optional()
    .default('postgresql://seeker:seekerdev@localhost:5432/seeker'),
  PORT: z.coerce.number().optional().default(3001),
  REDIS_URL: z.string().min(1, { message: 'REDIS_URL is required' }),
  AUTH0_ISSUER_BASE_URL: z.string().url().optional(),
  AUTH0_AUDIENCE: z
    .string()
    .optional()
    .refine((v) => v === undefined || v.length >= 1, {
      message: 'AUTH0_AUDIENCE must be non-empty when set',
    }),
  S3_BUCKET_RESUMES: z.string().min(1).optional(),
  AWS_REGION: z.string().min(1).optional(),
  MAX_RESUME_SIZE_BYTES: z.coerce.number().optional().default(5 * 1024 * 1024),
});

export const env = envSchema.parse(process.env);
