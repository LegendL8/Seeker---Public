export interface CurrentUser {
  id: string;
  email: string;
  displayName: string | null;
  subscriptionTier: string;
}
