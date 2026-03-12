export interface Note {
  id: string;
  userId: string;
  content: string;
  typeTag: string;
  applicationId: string | null;
  interviewId: string | null;
  companyId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListNotesResponse {
  items: Note[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateNoteInput {
  content: string;
  typeTag: string;
  applicationId?: string | null;
  interviewId?: string | null;
  companyId?: string | null;
}

export interface UpdateNoteInput {
  content?: string;
  typeTag?: string;
  applicationId?: string | null;
  interviewId?: string | null;
  companyId?: string | null;
}

export interface ListNotesQuery {
  page?: number;
  limit?: number;
  typeTag?: string;
  applicationId?: string;
  interviewId?: string;
  companyId?: string;
}
