import z from 'zod';

export const NOTE_TYPE_TAGS = [
  'interview',
  'job_description',
  'research',
  'general',
] as const;

export type NoteTypeTag = (typeof NOTE_TYPE_TAGS)[number];

export const noteTypeTagSchema = z.enum(NOTE_TYPE_TAGS);

const optionalUuid = () => z.string().uuid().optional().nullable();

export const createNoteBodySchema = z
  .object({
    content: z.string().min(1),
    typeTag: noteTypeTagSchema,
    applicationId: optionalUuid(),
    interviewId: optionalUuid(),
    companyId: optionalUuid(),
  })
  .refine(
    (data) => {
      const count = [
        data.applicationId,
        data.interviewId,
        data.companyId,
      ].filter((v) => v != null && v !== '').length;
      return count <= 1;
    },
    { message: 'Only one relational tag (applicationId, interviewId, companyId) allowed' }
  );

export const updateNoteBodySchema = z.object({
  content: z.string().min(1).optional(),
  typeTag: noteTypeTagSchema.optional(),
  applicationId: optionalUuid(),
  interviewId: optionalUuid(),
  companyId: optionalUuid(),
}).refine(
  (data) => {
    const count = [
      data.applicationId,
      data.interviewId,
      data.companyId,
    ].filter((v) => v != null && v !== '').length;
    return count <= 1;
  },
  { message: 'Only one relational tag (applicationId, interviewId, companyId) allowed' }
);

export const listNotesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  typeTag: noteTypeTagSchema.optional(),
  applicationId: z.string().uuid().optional(),
  interviewId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
});

export type CreateNoteBody = z.infer<typeof createNoteBodySchema>;
export type UpdateNoteBody = z.infer<typeof updateNoteBodySchema>;
export type ListNotesQuery = z.infer<typeof listNotesQuerySchema>;
