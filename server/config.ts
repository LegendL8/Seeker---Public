import z from "zod";

export const envSchema = z.object({
  DATABASE_URL: z
    .string()
    .min(1)
    .optional()
    .default("postgresql://seeker:seekerdev@localhost:5432/seeker"),
  PORT: z.coerce.number().optional().default(3001),
  REDIS_URL: z.string().min(1, { message: "REDIS_URL is required" }),
  AUTH0_ISSUER_BASE_URL: z.string().url().optional(),
  AUTH0_AUDIENCE: z
    .string()
    .optional()
    .refine((v) => v === undefined || v !== "", {
      message: "AUTH0_AUDIENCE must be non-empty when set",
    }),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_RESUMES: z.string().min(1).optional(),
  MAX_RESUME_SIZE_BYTES: z.coerce
    .number()
    .optional()
    .default(5 * 1024 * 1024),
  ALLOWED_ORIGIN: z.string().url().optional().default("http://localhost:3000"),
});

export const env = envSchema.parse(process.env);
