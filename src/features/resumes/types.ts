export interface Resume {
  id: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  isActive: boolean;
  createdAt: string | null;
}

export interface ResumeWithSignedUrl extends Resume {
  signedUrl: string;
}

export interface ListResumesResponse {
  items: Resume[];
  page: number;
  limit: number;
  total: number;
}
