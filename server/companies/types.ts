import z from "zod";

const optionalString = (max: number) => z.string().max(max).optional();
const optionalStringNullable = (max: number) =>
  z.string().max(max).optional().nullable();

export const createCompanyBodySchema = z.object({
  name: z.string().min(1).max(255),
  website: z
    .union([z.string().url().max(500), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  industry: optionalString(255),
});

export const updateCompanyBodySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  website: z
    .union([z.string().url().max(500), z.literal(""), z.null()])
    .optional()
    .transform((v) => {
      if (v === undefined) return undefined;
      if (v === "") return null;
      return v;
    }),
  industry: optionalStringNullable(255),
});

export const listCompaniesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z
    .string()
    .max(200)
    .optional()
    .transform((s) => {
      if (s === undefined) return undefined;
      const t = s.trim();
      return t.length === 0 ? undefined : t;
    }),
});

export type CreateCompanyBody = z.infer<typeof createCompanyBodySchema>;
export type UpdateCompanyBody = z.infer<typeof updateCompanyBodySchema>;
export type ListCompaniesQuery = z.infer<typeof listCompaniesQuerySchema>;
