import { z } from "zod";

export const createCompanyFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  website: z
    .union([z.string().url("Invalid URL"), z.literal("")])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  industry: z
    .string()
    .max(255)
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
});

export type CreateCompanyFormValues = z.infer<typeof createCompanyFormSchema>;
export type CreateCompanyFormInput = z.input<typeof createCompanyFormSchema>;

export const updateCompanyFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  website: z
    .union([z.string().url("Invalid URL"), z.literal("")])
    .transform((v) => (v === "" ? null : v)),
  industry: z
    .string()
    .max(255)
    .transform((v) => (v === "" ? null : v)),
});

export type UpdateCompanyFormValues = z.infer<typeof updateCompanyFormSchema>;
export type UpdateCompanyFormInput = z.input<typeof updateCompanyFormSchema>;
