export interface ApplicationsByStatus {
  saved: number;
  applied: number;
  interviewing: number;
  offer: number;
  rejected: number;
}

export interface DashboardMetrics {
  totalApplications: number;
  applicationsByStatus: ApplicationsByStatus;
  interviewRate: number;
  activeApplications: number;
  offersReceived: number;
  rejectionsReceived: number;
}
