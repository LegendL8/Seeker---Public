import z from 'zod';

export const INTERVIEW_TYPES = [
  'phone',
  'technical',
  'behavioral',
  'onsite',
  'final',
] as const;

export type InterviewType = (typeof INTERVIEW_TYPES)[number];

export const INTERVIEW_OUTCOMES = ['pending', 'completed', 'cancelled', 'no_show'] as const;

export type InterviewOutcome = (typeof INTERVIEW_OUTCOMES)[number];

export const interviewTypeSchema = z.enum(INTERVIEW_TYPES);
export const interviewOutcomeSchema = z.enum(INTERVIEW_OUTCOMES);

const optionalString = (max: number) => z.string().max(max).optional();

export const createInterviewBodySchema = z.object({
  interviewType: interviewTypeSchema,
  scheduledAt: z.string().datetime().optional(),
  interviewerName: optionalString(255),
  interviewerTitle: optionalString(255),
  outcome: interviewOutcomeSchema.optional(),
});

export const updateInterviewBodySchema = z.object({
  interviewType: interviewTypeSchema.optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
  interviewerName: optionalString(255).nullable(),
  interviewerTitle: optionalString(255).nullable(),
  outcome: interviewOutcomeSchema.optional(),
});

export type CreateInterviewBody = z.infer<typeof createInterviewBodySchema>;
export type UpdateInterviewBody = z.infer<typeof updateInterviewBodySchema>;
