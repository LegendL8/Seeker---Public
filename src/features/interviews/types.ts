export interface Interview {
  id: string;
  applicationId: string;
  userId: string;
  interviewType: string;
  scheduledAt: string | null;
  interviewerName: string | null;
  interviewerTitle: string | null;
  outcome: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListInterviewsResponse {
  items: Interview[];
}

export interface CreateInterviewInput {
  interviewType: string;
  scheduledAt?: string;
  interviewerName?: string;
  interviewerTitle?: string;
  outcome?: string;
}

export interface UpdateInterviewInput {
  interviewType?: string;
  scheduledAt?: string | null;
  interviewerName?: string | null;
  interviewerTitle?: string | null;
  outcome?: string;
}
