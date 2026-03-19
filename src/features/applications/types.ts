/** Application row as returned by the API (camelCase from server). */
export interface Application {
  id: string;
  userId: string;
  companyId: string | null;
  jobTitle: string;
  jobPostingUrl: string | null;
  postingStatus: string;
  postingStatusCheckedAt: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  salaryPeriod?: "yearly" | "hourly";
  status: string;
  appliedAt: string | null;
  source: string | null;
  resumeId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListApplicationsResponse {
  items: Application[];
  page: number;
  limit: number;
  total: number;
}
