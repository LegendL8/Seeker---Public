export type PostingCheckFrequency = "hourly" | "daily" | "weekly";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string | null;
  subscriptionTier: string;
}

export interface PreferencesResponse {
  data: {
    postingCheckFrequency: PostingCheckFrequency;
  };
}
