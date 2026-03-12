import z from 'zod';

export const RESUME_FILE_TYPES = ['pdf', 'docx'] as const;
export type ResumeFileType = (typeof RESUME_FILE_TYPES)[number];

export const resumeFileTypeSchema = z.enum(RESUME_FILE_TYPES);

export interface ResumeRecord {
  id: string;
  userId: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  isActive: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface ResumeWithSignedUrl extends ResumeRecord {
  signedUrl: string;
}

export const setActiveBodySchema = z.object({
  isActive: z.boolean(),
});

export type SetActiveBody = z.infer<typeof setActiveBodySchema>;

const MIME_TO_EXT: Record<string, ResumeFileType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
};

export function mimeToFileType(mime: string): ResumeFileType | null {
  return MIME_TO_EXT[mime] ?? null;
}

export const FREE_TIER_RESUME_CAP = 1;
